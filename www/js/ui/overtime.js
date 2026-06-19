// =============================================================================
// OVERTIME — Càlcul de conflictes de jornada i taula d'excés
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';
import { parseDateToTime, isDateInRange, isRejectedStatus, usersForClients } from '../utils.js';

const overtimeTableBody = document.getElementById('overtimeTableBody');
const filterAbsUsers = document.getElementById('filter-abs-users');
const filterAbsClients = document.getElementById('filter-abs-clients');
const filterAbsDateStart = document.getElementById('filter-abs-date-start');
const filterAbsDateEnd = document.getElementById('filter-abs-date-end');

// Conjunt de tècnics (nom normalitzat) el client predominant dels quals està entre els
// clients seleccionats al filtre d'absències. Retorna null si no hi ha filtre de client actiu.
export function getClientAllowedUsers() {
    const selRaw = filterAbsClients ? Array.from(filterAbsClients.selectedOptions).map(o => o.value) : [];
    const sel = selRaw.includes('ALL') ? [] : selRaw;
    if (sel.length === 0) return null;
    return usersForClients(state.currentData, state.absData, sel);
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
        let dayAbsenceHours = 0;
        const absSources = [];
        const absKeys = [];

        absData.filter(a => a.user === user && !isRejectedStatus(a.status)).forEach(abs => {
            if (isDateInRange(dateStr, abs.dateStart, abs.dateEnd)) {
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

        const totalCompute = impHours + dayAbsenceHours;
        if (dayAbsenceHours > 0 && totalCompute > 10) {
            conflictsList.push({ date: dateStr, user, impHours, absHours: dayAbsenceHours, totalCompute, diff: totalCompute - 10, absSource: absSources.join('; '), absKeys });
        }
    });
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

    if (!state.currentData.length || !state.absData.length) {
        overtimeTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-secondary);">${t('msgOvertimeNeedsBoth')}</td></tr>`;
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
    const conflicts = getConflicts(state.currentData, state.absData, selectedUsers, startDate, endDate, allowedUsers);

    if (conflicts.length === 0) {
        overtimeTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-secondary);">${t('msgNoConflictsInPeriod')}</td></tr>`;
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

    conflicts.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.date}</td>
            <td>${c.absSource || '-'}</td>
            <td style="font-weight:600;">${c.user}</td>
            <td class="number-col">${c.impHours.toFixed(2)}h</td>
            <td class="number-col">${c.absHours.toFixed(2)}h</td>
            <td class="number-col highlight-col" style="font-weight:700; color:var(--accent-color);">${c.totalCompute.toFixed(2)}h</td>
        `;
        overtimeTableBody.appendChild(tr);
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
