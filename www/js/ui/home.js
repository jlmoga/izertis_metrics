// =============================================================================
// HOME — Dashboard de la pantalla d'inici (KPIs, resum mensual, alertes)
// =============================================================================

import { state } from '../state.js';
import { t, currentLang } from '../config/i18n.js';
import { parseDateToTime, parseDateToDateObj } from '../utils.js';
import { getFromDB } from '../services/db.js';
import { getConflicts } from './overtime.js';

const nameKey = name => name
    ? name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9\s]/g, '').trim()
          .split(/\s+/).filter(Boolean).sort().join(' ')
    : '?';

const CLIENT_COLORS = [
    '#a8c8e8','#a8d5a2','#f2a7a7','#c4b0d8','#a0d8d8',
    '#f7d6a0','#a0cfd4','#f0b89a','#e8a8cc','#b8c4cc',
    '#b8d4f0','#b8e0b4','#f4baba','#d0c0e0','#b0e0e0',
];

const _charts = {};

function renderStackedChart(canvasId, rows) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (_charts[canvasId]) {
        _charts[canvasId].destroy();
        delete _charts[canvasId];
    }

    const clientAmounts = {};
    rows.forEach(r => {
        const c = r.client || t('lblNoClient');
        clientAmounts[c] = (clientAmounts[c] || 0) + (r._importedCalculated || 0);
    });

    const sorted = Object.entries(clientAmounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return;

    const datasets = sorted.map(([client, amount], i) => ({
        label: client,
        data: [amount],
        backgroundColor: CLIENT_COLORS[i % CLIENT_COLORS.length],
    }));

    _charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: { labels: [''], datasets },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, display: false, grid: { display: false } },
                y: { stacked: true, display: false, grid: { display: false } },
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, boxHeight: 12, padding: 10, font: { size: 11 } },
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const val = ctx.parsed.x;
                            return ` ${ctx.dataset.label}: ${val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
                        },
                    },
                },
            },
        },
    });
}

function renderEvoChart(canvasId, rows, absRows, currYear, shortMonths, unit) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (_charts[canvasId]) { _charts[canvasId].destroy(); delete _charts[canvasId]; }

    const isAbs = unit === 'h';
    const byKey = {};

    if (isAbs) {
        // Mapa user → client predominant (més hores d'imputació)
        const userHoursByClient = {};
        rows.forEach(r => {
            const u = nameKey(r.user);
            const c = r.client || '?';
            if (!userHoursByClient[u]) userHoursByClient[u] = {};
            userHoursByClient[u][c] = (userHoursByClient[u][c] || 0) + (r.hours || 0);
        });
        const userMainClient = {};
        Object.entries(userHoursByClient).forEach(([u, clients]) => {
            userMainClient[u] = Object.entries(clients).sort((a, b) => b[1] - a[1])[0][0];
        });

        absRows.forEach(r => {
            const d = parseDateToDateObj(r.dateStart);
            if (!d || d.getFullYear() !== currYear) return;
            const client = userMainClient[nameKey(r.user)] || '?';
            if (!byKey[client]) byKey[client] = Array(12).fill(0);
            byKey[client][d.getMonth()] += (r.hours || 0);
        });
    } else {
        const valueField = unit === 'imp-h' ? 'hours' : '_importedCalculated';
        rows.forEach(r => {
            const d = parseDateToDateObj(r.date);
            if (!d || d.getFullYear() !== currYear) return;
            const key = r.client || '?';
            if (!byKey[key]) byKey[key] = Array(12).fill(0);
            byKey[key][d.getMonth()] += (r[valueField] || 0);
        });
    }

    const sorted = Object.entries(byKey).sort((a, b) =>
        b[1].reduce((s, v) => s + v, 0) - a[1].reduce((s, v) => s + v, 0)
    );

    const datasets = sorted.map(([key, vals], i) => ({
        label: key,
        data: vals,
        backgroundColor: CLIENT_COLORS[i % CLIENT_COLORS.length],
        borderColor: CLIENT_COLORS[i % CLIENT_COLORS.length],
        borderWidth: 1,
        borderRadius: 2,
    }));

    const isCurrency = unit === '€';
    const isHours = unit === 'h' || unit === 'imp-h';
    _charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: { labels: shortMonths, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(128,128,128,0.15)' },
                    ticks: {
                        font: { size: 11 },
                        callback: val => isCurrency
                            ? val.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
                            : val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' h',
                    },

                },
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, boxHeight: 12, padding: 8, font: { size: 11 } },
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const val = ctx.parsed.y;
                            const fmt = isCurrency
                                ? val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
                                : val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
                            return ` ${ctx.dataset.label}: ${fmt}`;
                        },
                    },
                },
            },
        },
    });
}

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

    // --- KPIs any en curs ---
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();

    const yearData = state.currentData.filter(r => {
        const d = parseDateToDateObj(r.date);
        return d && d.getFullYear() === currYear;
    });
    const yearAbsData = state.absData.filter(r => {
        const d = parseDateToDateObj(r.dateStart);
        return d && d.getFullYear() === currYear;
    });

    const totalHours = yearData.reduce((s, r) => s + (r.hours || 0), 0);
    const totalAmount = yearData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
    const totalAbsHours = yearAbsData.reduce((s, r) => s + (r.hours || 0), 0);
    const conflictsAll = getConflicts(yearData, yearAbsData);
    const totalConflictsCount = conflictsAll.filter(c => Math.abs(c.diff) > 0.01).length;

    const globalTitleEl = document.getElementById('home-global-title');
    if (globalTitleEl) {
        const s = globalTitleEl.querySelector('span');
        if (s) s.textContent = `${t('titleGlobalSummary')} ${currYear}`;
    }

    document.getElementById('home-total-hours').textContent = totalHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
    document.getElementById('home-total-amount').textContent = totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    document.getElementById('home-total-abs-hours').textContent = totalAbsHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
    document.getElementById('home-total-conflicts').textContent = totalConflictsCount;
    const names = t('months');

    const monthTitle = document.getElementById('home-month-title');
    if (monthTitle) {
        const s = monthTitle.querySelector('span');
        if (s) s.textContent = `${t('titleMonthlySituation')} ${names[currMonth]} ${currYear}`;
    }

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

    if (document.getElementById('home-curr-hours')) document.getElementById('home-curr-hours').textContent = mHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
    if (document.getElementById('home-curr-amount')) document.getElementById('home-curr-amount').textContent = mAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    if (document.getElementById('home-curr-abs-hours')) document.getElementById('home-curr-abs-hours').textContent = mAbsHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
    if (document.getElementById('home-curr-conflicts')) document.getElementById('home-curr-conflicts').textContent = mConflicts;

    // --- KPIs del mes anterior ---
    const prevMonth = currMonth === 0 ? 11 : currMonth - 1;
    const prevYear = currMonth === 0 ? currYear - 1 : currYear;

    const prevTitle = document.getElementById('home-prev-month-title');
    if (prevTitle) {
        const s = prevTitle.querySelector('span');
        if (s) s.textContent = `${t('titleMonthlySituation')} ${names[prevMonth]} ${prevYear}`;
    }

    const pData = filterByMonth(state.currentData, prevMonth, prevYear, 'date');
    const pAbs = filterByMonth(state.absData, prevMonth, prevYear, 'dateStart');
    const pmHours = pData.reduce((s, r) => s + (r.hours || 0), 0);
    const pmAmount = pData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
    const pmAbsHours = pAbs.reduce((s, r) => s + (r.hours || 0), 0);
    const pmConflicts = getConflicts(pData, state.absData).filter(c => Math.abs(c.diff) > 0.01).length;

    if (document.getElementById('home-prev-hours')) document.getElementById('home-prev-hours').textContent = pmHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
    if (document.getElementById('home-prev-amount')) document.getElementById('home-prev-amount').textContent = pmAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    if (document.getElementById('home-prev-abs-hours')) document.getElementById('home-prev-abs-hours').textContent = pmAbsHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' h';
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

    // --- Títols dinàmics amb mes actual i mes anterior ---
    const monthLabel = `${names[currMonth]} ${currYear}`;
    const prevMonthLabel = `${names[prevMonth]} ${prevYear}`;
    const clientTitleEl = document.getElementById('home-client-title');
    if (clientTitleEl) clientTitleEl.textContent = `${t('titleClientSummary')} · ${monthLabel}`;
    const alertsTitleEl = document.getElementById('home-alerts-title');
    if (alertsTitleEl) alertsTitleEl.textContent = `${t('titleRecentAlerts')} · ${monthLabel}`;
    const clientPrevTitleEl = document.getElementById('home-client-prev-title');
    if (clientPrevTitleEl) clientPrevTitleEl.textContent = `${t('titleClientSummary')} · ${prevMonthLabel}`;
    const alertsPrevTitleEl = document.getElementById('home-alerts-prev-title');
    if (alertsPrevTitleEl) alertsPrevTitleEl.textContent = `${t('titleRecentAlerts')} · ${prevMonthLabel}`;

    // --- Resum per client (mes actual) ---
    const clientStats = {};
    cData.forEach(row => {
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

    // --- Alertes (mes actual) ---
    const alertsBody = document.getElementById('homeAlertsBody');
    if (alertsBody) {
        const conflictsFiltered = getConflicts(cData, state.absData)
            .filter(c => Math.abs(c.diff) > 0.1)
            .sort((a, b) => parseDateToTime(b.date) - parseDateToTime(a.date))
            .slice(0, 5);
        alertsBody.innerHTML = conflictsFiltered.map(c => `
            <tr>
                <td>${c.date}</td>
                <td style="font-weight:600">${c.user}</td>
                <td class="number-col" style="color:var(--danger-color); font-weight:bold">${Math.abs(c.diff).toFixed(2)}h</td>
            </tr>
        `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoConflicts')}</td></tr>`;
    }

    // --- Resum per client (mes anterior) ---
    const clientStatsPrev = {};
    pData.forEach(row => {
        if (!clientStatsPrev[row.client]) clientStatsPrev[row.client] = { hours: 0, amount: 0 };
        clientStatsPrev[row.client].hours += (row.hours || 0);
        clientStatsPrev[row.client].amount += (row._importedCalculated || 0);
    });
    const sortedClientsPrev = Object.entries(clientStatsPrev).sort((a, b) => b[1].hours - a[1].hours).slice(0, 5);
    const clientPrevBody = document.getElementById('homeClientPrevBody');
    if (clientPrevBody) {
        clientPrevBody.innerHTML = sortedClientsPrev.map(([client, stat]) => `
            <tr>
                <td>${client || t('lblNoClient')}</td>
                <td class="number-col">${stat.hours.toFixed(2)}</td>
                <td class="number-col">${stat.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
            </tr>
        `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoRecentData')}</td></tr>`;
    }

    // --- Alertes (mes anterior) ---
    const alertsPrevBody = document.getElementById('homeAlertsPrevBody');
    if (alertsPrevBody) {
        const conflictsPrevFiltered = getConflicts(pData, state.absData)
            .filter(c => Math.abs(c.diff) > 0.1)
            .sort((a, b) => parseDateToTime(b.date) - parseDateToTime(a.date))
            .slice(0, 5);
        alertsPrevBody.innerHTML = conflictsPrevFiltered.map(c => `
            <tr>
                <td>${c.date}</td>
                <td style="font-weight:600">${c.user}</td>
                <td class="number-col" style="color:var(--danger-color); font-weight:bold">${Math.abs(c.diff).toFixed(2)}h</td>
            </tr>
        `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoConflicts')}</td></tr>`;
    }

    // --- Mapa user → client predominant (per absències per client) ---
    const userHoursByClientMap = {};
    state.currentData.forEach(r => {
        const u = nameKey(r.user);
        const c = r.client || '?';
        if (!userHoursByClientMap[u]) userHoursByClientMap[u] = {};
        userHoursByClientMap[u][c] = (userHoursByClientMap[u][c] || 0) + (r.hours || 0);
    });
    const userMainClientMap = {};
    Object.entries(userHoursByClientMap).forEach(([u, clients]) => {
        userMainClientMap[u] = Object.entries(clients).sort((a, b) => b[1] - a[1])[0][0];
    });

    const absHoursByClient = (absRows) => {
        const result = {};
        absRows.forEach(r => {
            const client = userMainClientMap[nameKey(r.user)] || '?';
            result[client] = (result[client] || 0) + (r.hours || 0);
        });
        return Object.entries(result).sort((a, b) => b[1] - a[1]);
    };

    const renderAbsClientTable = (tbodyId, titleId, absRows, label) => {
        const titleEl = document.getElementById(titleId);
        if (titleEl) titleEl.textContent = `${t('titleAbsSummary')} · ${label}`;
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        const rows = absHoursByClient(absRows);
        tbody.innerHTML = rows.length
            ? rows.map(([client, hours]) => `
                <tr>
                    <td>${client}</td>
                    <td class="number-col">${hours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</td>
                </tr>`).join('')
            : `<tr><td colspan="2" style="text-align:center">${t('lblNoRecentData')}</td></tr>`;
    };

    renderAbsClientTable('homeAbsClientCurrBody', 'home-abs-client-curr-title', cAbs, monthLabel);
    renderAbsClientTable('homeAbsClientPrevBody', 'home-abs-client-prev-title', pAbs, prevMonthLabel);

    // --- Gràfics apilats d'import per client ---
    renderStackedChart('homeYearChart', yearData);
    renderStackedChart('homeCurrChart', cData);
    renderStackedChart('homePrevChart', pData);

    // --- Gràfics d'evolució mensual ---
    const shortMonths = t('monthsShort');
    renderEvoChart('homeEvoPressupostChart', state.currentData, state.absData, currYear, shortMonths, '€');
    renderEvoChart('homeEvoAbsenciesChart', state.currentData, state.absData, currYear, shortMonths, 'h');
    renderEvoChart('homeEvoImputacionsChart', state.currentData, state.absData, currYear, shortMonths, 'imp-h');
}
