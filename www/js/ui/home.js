// =============================================================================
// HOME — Dashboard de la pantalla d'inici (KPIs, resum mensual, alertes)
// =============================================================================

import { state } from '../state.js';
import { t, currentLang } from '../config/i18n.js';
import { parseDateToTime, parseDateToDateObj } from '../utils.js';
import { getFromDB } from '../services/db.js';
import { getConflicts } from './overtime.js';

export async function updateHomeDashboard() {
    const homeDashboard = document.getElementById('home-dashboard');
    const homeEmptyState = document.getElementById('home-empty-state');
    const hasData = state.currentData.length > 0 || state.absData.length > 0;

    if (!hasData) {
        if (homeDashboard) homeDashboard.classList.add('hidden');
        if (homeEmptyState) homeEmptyState.classList.remove('hidden');
        return;
    }

    if (homeDashboard) homeDashboard.classList.remove('hidden');
    if (homeEmptyState) homeEmptyState.classList.add('hidden');

    // --- KPIs globals ---
    const totalHours = state.currentData.reduce((s, r) => s + (r.hours || 0), 0);
    const totalAmount = state.currentData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
    const totalAbsHours = state.absData.reduce((s, r) => s + (r.hours || 0), 0);
    const conflictsAll = getConflicts(state.currentData, state.absData);
    const totalConflictsCount = conflictsAll.filter(c => Math.abs(c.diff) > 0.01).length;

    document.getElementById('home-total-hours').textContent = totalHours.toFixed(2);
    document.getElementById('home-total-amount').textContent = totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    document.getElementById('home-total-abs-hours').textContent = totalAbsHours.toFixed(2);
    document.getElementById('home-total-conflicts').textContent = totalConflictsCount;

    // --- KPIs del mes actual ---
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();
    const names = t('months');

    const monthTitle = document.getElementById('home-month-title');
    if (monthTitle) monthTitle.textContent = `${t('titleMonthlySituation')} ${names[currMonth]} ${currYear}`;

    const filterByMonth = (data, m, y, dateField) => data.filter(r => {
        const d = parseDateToDateObj(r[dateField]);
        return d && d.getMonth() === m && d.getFullYear() === y;
    });

    const cData = filterByMonth(state.currentData, currMonth, currYear, 'date');
    const cAbs = filterByMonth(state.absData, currMonth, currYear, 'dateStart');
    const mHours = cData.reduce((s, r) => s + (r.hours || 0), 0);
    const mAmount = cData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
    const mAbsHours = cAbs.reduce((s, r) => s + (r.hours || 0), 0);
    const mConflicts = getConflicts(cData, state.absData).filter(c => Math.abs(c.diff) > 0.01).length;

    if (document.getElementById('home-curr-hours')) document.getElementById('home-curr-hours').textContent = mHours.toFixed(2);
    if (document.getElementById('home-curr-amount')) document.getElementById('home-curr-amount').textContent = mAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    if (document.getElementById('home-curr-abs-hours')) document.getElementById('home-curr-abs-hours').textContent = mAbsHours.toFixed(2);
    if (document.getElementById('home-curr-conflicts')) document.getElementById('home-curr-conflicts').textContent = mConflicts;

    // --- KPIs del mes anterior ---
    const prevMonth = currMonth === 0 ? 11 : currMonth - 1;
    const prevYear = currMonth === 0 ? currYear - 1 : currYear;

    const prevTitle = document.getElementById('home-prev-month-title');
    if (prevTitle) prevTitle.textContent = `${t('titleMonthlySituation')} ${names[prevMonth]} ${prevYear}`;

    const pData = filterByMonth(state.currentData, prevMonth, prevYear, 'date');
    const pAbs = filterByMonth(state.absData, prevMonth, prevYear, 'dateStart');
    const pmHours = pData.reduce((s, r) => s + (r.hours || 0), 0);
    const pmAmount = pData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
    const pmAbsHours = pAbs.reduce((s, r) => s + (r.hours || 0), 0);
    const pmConflicts = getConflicts(pData, state.absData).filter(c => Math.abs(c.diff) > 0.01).length;

    if (document.getElementById('home-prev-hours')) document.getElementById('home-prev-hours').textContent = pmHours.toFixed(2);
    if (document.getElementById('home-prev-amount')) document.getElementById('home-prev-amount').textContent = pmAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    if (document.getElementById('home-prev-abs-hours')) document.getElementById('home-prev-abs-hours').textContent = pmAbsHours.toFixed(2);
    if (document.getElementById('home-prev-conflicts')) document.getElementById('home-prev-conflicts').textContent = pmConflicts;

    // --- Timestamps de càrrega ---
    const formatTS = (ts) => {
        if (!ts) return '-';
        return new Date(ts).toLocaleString(currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-GB' : 'ca-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };
    const tsImp = await getFromDB('imputacions_updated');
    const tsAbs = await getFromDB('absencies_updated');
    if (document.getElementById('last-updated-imp')) document.getElementById('last-updated-imp').textContent = formatTS(tsImp);
    if (document.getElementById('last-updated-abs')) document.getElementById('last-updated-abs').textContent = formatTS(tsAbs);

    // --- Resum per client (últims 30 dies) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysTime = thirtyDaysAgo.getTime();

    const clientStats = {};
    state.currentData.forEach(row => {
        if (parseDateToTime(row.date) < thirtyDaysTime) return;
        if (!clientStats[row.client]) clientStats[row.client] = { hours: 0, amount: 0 };
        clientStats[row.client].hours += (row.hours || 0);
        clientStats[row.client].amount += (row._importedCalculated || 0);
    });

    const sortedClients = Object.entries(clientStats).sort((a, b) => b[1].hours - a[1].hours).slice(0, 5);
    const clientBody = document.getElementById('homeClientBody');
    if (clientBody) {
        clientBody.innerHTML = sortedClients.map(([client, stat]) => `
            <tr>
                <td>${client || t('lblNoClient')}</td>
                <td class="number-col">${stat.hours.toFixed(2)}</td>
                <td class="number-col">${stat.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
            </tr>
        `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoRecentData')}</td></tr>`;
    }

    // --- Alertes recents (últims 30 dies) ---
    const alertsBody = document.getElementById('homeAlertsBody');
    if (alertsBody) {
        const conflictsFiltered = conflictsAll
            .sort((a, b) => parseDateToTime(b.date) - parseDateToTime(a.date))
            .filter(c => parseDateToTime(c.date) >= thirtyDaysTime && Math.abs(c.diff) > 0.1)
            .slice(0, 5);
        alertsBody.innerHTML = conflictsFiltered.map(c => `
            <tr>
                <td>${c.date}</td>
                <td style="font-weight:600">${c.user}</td>
                <td class="number-col" style="color:var(--danger-color); font-weight:bold">${Math.abs(c.diff).toFixed(2)}h</td>
            </tr>
        `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoConflicts')}</td></tr>`;
    }
}
