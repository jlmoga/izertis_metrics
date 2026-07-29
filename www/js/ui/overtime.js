// =============================================================================
// OVERTIME — Càlcul de conflictes de jornada i taula d'excés
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';
import { parseDateToTime, isRejectedStatus, usersForClients } from '../utils.js';

const overtimeTableBody = document.getElementById('overtimeTableBody');
const overtimeTableFoot = document.getElementById('overtimeTableFoot');
const filterAbsUsers = document.getElementById('filter-abs-users');
const filterAbsClients = document.getElementById('filter-abs-clients');
const filterAbsDateStart = document.getElementById('filter-abs-date-start');
const filterAbsDateEnd = document.getElementById('filter-abs-date-end');
const overtimeFilterOverwork = document.getElementById('overtime-filter-overwork');
const overtimeFilterMissing = document.getElementById('overtime-filter-missing');

// Llindars (h) que defineixen un conflicte de jornada: per sota, falta d'imputació;
// per sobre, excés (vegeu disclaimers absConflictDisclaimer / factConflictsDisclaimer).
const UNDERWORK_THRESHOLD = 6;
const OVERWORK_THRESHOLD = 10;

// Conjunt de tècnics (nom normalitzat) el client predominant dels quals està entre els
// clients seleccionats al filtre d'absències. Retorna null si no hi ha filtre de client actiu.
export function getClientAllowedUsers() {
    const selRaw = filterAbsClients ? Array.from(filterAbsClients.selectedOptions).map(o => o.value) : [];
    const sel = selRaw.includes('ALL') ? [] : selRaw;
    if (sel.length === 0) return null;
    return usersForClients(state.currentData, state.absData, sel);
}

// Fi efectiu (en temps) d'una absència. La data de finalització importada de vegades no
// reflecteix la durada real (ve buida o igual a la d'inici), de manera que confiar-hi
// deixaria fora dies coberts per l'absència. Per això prenem el màxim entre la dateEnd
// desada i el fi derivat de `days` (dies LABORALS a partir de l'inici, saltant caps de setmana).
function absenceEndTime(abs) {
    const startTime = parseDateToTime(abs.dateStart);
    if (!startTime) return 0;
    const endParsed = parseDateToTime(abs.dateEnd);
    const days = Math.max(1, Math.ceil(parseFloat(abs.days) || 1));
    const d = new Date(startTime);
    let counted = 1;
    while (counted < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) counted++;   // 0=diumenge, 6=dissabte
    }
    return Math.max(endParsed || 0, d.getTime());
}

// Hores d'absència d'un tècnic en un dia concret (targetTime), i les absències que hi contribueixen.
function computeDayAbsence(absData, user, targetTime) {
    let dayAbsenceHours = 0;
    const absSources = [];
    const absKeys = [];

    absData.filter(a => a.user === user && !isRejectedStatus(a.status)).forEach(abs => {
        const startTime = parseDateToTime(abs.dateStart);
        const endTime   = absenceEndTime(abs);
        if (startTime && targetTime >= startTime && targetTime <= endTime) {
            const dailyHours = (parseFloat(abs.days) > 1)
                ? (parseFloat(abs.hours) / parseFloat(abs.days))
                : parseFloat(abs.hours);
            dayAbsenceHours += dailyHours;
            // Període de l'absència que origina el conflicte (per identificar-la sense ID)
            const src = (abs.dateEnd && abs.dateEnd !== abs.dateStart)
                ? `${abs.dateStart} → ${abs.dateEnd}`
                : (abs.dateStart || '');
            if (src && !absSources.includes(src)) absSources.push(src);
            // Clau de l'absència contribuent (per marcar-la en vermell al desglós)
            const k = `${abs.user}|${abs.dateStart}|${abs.dateEnd}`;
            if (!absKeys.includes(k)) absKeys.push(k);
        }
    });

    return { dayAbsenceHours, absSources, absKeys };
}

export function getConflicts(data, absData, userFilter = [], start = null, end = null, allowedUsers = null) {
    if (!data || !absData || data.length === 0 || absData.length === 0) return [];

    const impMap = {};
    data.forEach(row => {
        if (allowedUsers && !allowedUsers.has(row.user)) return;
        if (userFilter.length > 0 && !userFilter.includes(row.user)) return;
        const time = parseDateToTime(row.date);
        if (start && time < start) return;
        if (end && time > end) return;
        const key = `${row.user}|${row.date}`;
        impMap[key] = (impMap[key] || 0) + (parseFloat(row.hours) || 0);
    });

    const conflictsList = [];
    Object.keys(impMap).forEach(key => {
        const [user, dateStr] = key.split('|');
        const impHours = impMap[key];
        const targetTime = parseDateToTime(dateStr);
        const { dayAbsenceHours, absSources, absKeys } = computeDayAbsence(absData, user, targetTime);

        const totalCompute = impHours + dayAbsenceHours;
        if (dayAbsenceHours > 0 && totalCompute > OVERWORK_THRESHOLD) {
            conflictsList.push({ type: 'overwork', date: dateStr, user, impHours, absHours: dayAbsenceHours, totalCompute, diff: totalCompute - OVERWORK_THRESHOLD, absSource: absSources.join('; '), absKeys });
        }
    });
    return conflictsList;
}

// Tècnics candidats per detectar "falta d'imputació": unió de tots els noms presents a
// imputacions i absències (tot l'històric carregat), no només els del desplegable de
// tècnics d'absències (aquest només llista tècnics que han demanat alguna absència).
function allKnownUsers(data, absData) {
    const users = new Set();
    (data || []).forEach(r => { if (r.user) users.add(r.user); });
    (absData || []).forEach(r => { if (r.user) users.add(r.user); });
    return users;
}

function formatDateFromTime(ts) {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Dies laborables (dl-dv) en què un tècnic no té ni imputacions ni absències, o bé la suma
// d'imputació + absència d'aquell dia no arriba a les UNDERWORK_THRESHOLD hores.
export function getMissingImputationConflicts(data, absData, userFilter = [], start = null, end = null, allowedUsers = null) {
    if (!start || !end) return [];

    const candidateUsers = userFilter.length > 0 ? userFilter : Array.from(allKnownUsers(data, absData));
    let users = candidateUsers.filter(u => !allowedUsers || allowedUsers.has(u));
    if (users.length === 0) return [];

    const impMap = {};
    (data || []).forEach(row => {
        const time = parseDateToTime(row.date);
        if (!time) return;
        const key = `${row.user}|${time}`;
        impMap[key] = (impMap[key] || 0) + (parseFloat(row.hours) || 0);
    });

    // Exclou tècnics sense CAP imputació ni absència dins el rang filtrat: si no hi ha cap
    // rastre d'activitat en tot el període, molt probablement el tècnic no hi està assignat
    // (ha marxat, encara no hi era, o treballa en un altre projecte fora d'abast), i marcar-lo
    // com a "falta d'imputació" cada dia laborable seria fals positiu, no un conflicte real.
    const activeInRange = new Set();
    (data || []).forEach(row => {
        const time = parseDateToTime(row.date);
        if (time && time >= start && time <= end && (parseFloat(row.hours) || 0) > 0) activeInRange.add(row.user);
    });
    (absData || []).forEach(abs => {
        const aStart = parseDateToTime(abs.dateStart);
        if (!aStart) return;
        const aEnd = absenceEndTime(abs);
        if (aEnd >= start && aStart <= end) activeInRange.add(abs.user);
    });
    users = users.filter(u => activeInRange.has(u));
    if (users.length === 0) return [];

    const conflictsList = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) {
            const dayTime = cursor.getTime();
            const dateStr = formatDateFromTime(dayTime);
            users.forEach(user => {
                const impHours = impMap[`${user}|${dayTime}`] || 0;
                const { dayAbsenceHours } = computeDayAbsence(absData, user, dayTime);
                const totalCompute = impHours + dayAbsenceHours;
                if (totalCompute < UNDERWORK_THRESHOLD) {
                    conflictsList.push({ type: 'missingImputation', date: dateStr, user, impHours, absHours: dayAbsenceHours, totalCompute, diff: UNDERWORK_THRESHOLD - totalCompute, absSource: '', absKeys: [] });
                }
            });
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return conflictsList;
}

// Conjunt de claus `user|dateStart|dateEnd` de les absències que originen algun conflicte,
// calculat amb els MATEIXOS filtres que la taula de conflictes. El desglós d'absències l'usa
// per marcar en vermell exactament les absències que provoquen els conflictes mostrats.
export function getConflictAbsenceKeys() {
    const selectedUsersRaw = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
    const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;
    const startDate = filterAbsDateStart.value ? parseDateToTime(filterAbsDateStart.value) : null;
    const endDate = filterAbsDateEnd.value ? parseDateToTime(filterAbsDateEnd.value) : null;
    const allowedUsers = getClientAllowedUsers();
    const keys = new Set();
    getConflicts(state.currentData, state.absData, selectedUsers, startDate, endDate, allowedUsers)
        .forEach(c => (c.absKeys || []).forEach(k => keys.add(k)));
    return keys;
}

export function renderOvertimeTable() {
    if (!overtimeTableBody) return;
    overtimeTableBody.innerHTML = '';
    if (overtimeTableFoot) overtimeTableFoot.innerHTML = '';

    if (!state.currentData.length || !state.absData.length) {
        overtimeTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-secondary);">${t('msgOvertimeNeedsBoth')}</td></tr>`;
        return;
    }

    const selectedUsersRaw = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
    const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;
    const startDate = filterAbsDateStart.value ? parseDateToTime(filterAbsDateStart.value) : null;
    const endDate = filterAbsDateEnd.value ? parseDateToTime(filterAbsDateEnd.value) : null;

    // S'usa el conjunt complet d'absències (no el filtrat per data) perquè getConflicts
    // detecta solapaments amb isDateInRange i així no perd absències multi-dia que comencen
    // abans del rang. El filtre de client es respecta restringint els tècnics permesos.
    const allowedUsers = getClientAllowedUsers();
    const showOverwork = !overtimeFilterOverwork || overtimeFilterOverwork.checked;
    const showMissing = !overtimeFilterMissing || overtimeFilterMissing.checked;
    const conflicts = [
        ...(showOverwork ? getConflicts(state.currentData, state.absData, selectedUsers, startDate, endDate, allowedUsers) : []),
        ...(showMissing ? getMissingImputationConflicts(state.currentData, state.absData, selectedUsers, startDate, endDate, allowedUsers) : [])
    ];

    if (conflicts.length === 0) {
        const msgKey = (!showOverwork && !showMissing) ? 'msgOvertimeTypesHidden' : 'msgNoConflictsInPeriod';
        overtimeTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-secondary);">${t(msgKey)}</td></tr>`;
        return;
    }

    const col = state.currentOvertimeSort.column;
    const dir = state.currentOvertimeSort.direction;
    conflicts.sort((a, b) => {
        let valA = col === 'date' ? parseDateToTime(a.date) : a.user.toLowerCase();
        let valB = col === 'date' ? parseDateToTime(b.date) : b.user.toLowerCase();
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
    });

    let totalImpHours = 0;
    let totalAbsHours = 0;

    conflicts.forEach(c => {
        totalImpHours += c.impHours;
        totalAbsHours += c.absHours;

        const typeLabel = c.type === 'missingImputation' ? t('overtimeTypeMissingImputation') : t('overtimeTypeOverwork');
        const typeBadgeClass = c.type === 'missingImputation' ? 'badge-warning' : 'badge-danger';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge ${typeBadgeClass}">${typeLabel}</span></td>
            <td>${c.date}</td>
            <td>${c.absSource || '-'}</td>
            <td style="font-weight:600;">${c.user}</td>
            <td class="number-col">${c.impHours.toFixed(2)}h</td>
            <td class="number-col">${c.absHours.toFixed(2)}h</td>
            <td class="number-col highlight-col" style="font-weight:700; color:var(--accent-color);">${c.totalCompute.toFixed(2)}h</td>
        `;
        overtimeTableBody.appendChild(tr);
    });

    if (overtimeTableFoot) {
        const trFoot = document.createElement('tr');
        trFoot.style.fontWeight = 'bold';
        trFoot.style.borderTop = '2px solid var(--border-color)';
        trFoot.style.background = 'var(--table-header-bg)';
        trFoot.innerHTML = `
            <td colspan="4" style="text-align:right; font-weight:600; padding: 0.65rem 1rem;">Total:</td>
            <td class="number-col" style="font-weight:700; padding: 0.65rem 1rem;">${totalImpHours.toFixed(2)}h</td>
            <td class="number-col" style="font-weight:700; padding: 0.65rem 1rem;">${totalAbsHours.toFixed(2)}h</td>
            <td style="padding: 0.65rem 1rem;"></td>
        `;
        overtimeTableFoot.appendChild(trFoot);
    }
}

export function setupOvertimeTypeFilterHandlers() {
    [overtimeFilterOverwork, overtimeFilterMissing].filter(Boolean).forEach(chk => {
        chk.addEventListener('change', renderOvertimeTable);
    });
}

export function setupOvertimeSortHandlers() {
    document.querySelectorAll('#overtimeTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort-overtime');
            if (state.currentOvertimeSort.column === column) {
                state.currentOvertimeSort.direction = state.currentOvertimeSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                state.currentOvertimeSort.column = column;
                state.currentOvertimeSort.direction = 'asc';
            }
            document.querySelectorAll('#overtimeTable .sort-icon').forEach(icon => {
                icon.className = 'ph ph-caret-up sort-icon';
            });
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.className = `ph ph-caret-${state.currentOvertimeSort.direction === 'asc' ? 'up' : 'down'} sort-icon active`;
            renderOvertimeTable();
        });
    });
}
