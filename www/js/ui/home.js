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
const _expandedClients = { curr: null, prev: null };

function shadeColor(hex, factor) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return hex || '#ccc';
    factor = Math.min(1, Math.max(0, factor));
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return '#' + [r, g, b].map(c => Math.round(c + (255 - c) * factor).toString(16).padStart(2, '0')).join('');
}

function setupClientTable(tbodyId, chartCanvasId, data, section, colorMap, selectedClients = null) {
    const render = () => {
        const expandedClient = _expandedClients[section];
        const activeData = selectedClients ? data.filter(r => selectedClients.has(r.client || '?')) : data;
        const clientStats = {}, clientProjectStats = {};
        activeData.forEach(row => {
            const c = row.client || '?';
            if (!clientStats[c]) clientStats[c] = { hours: 0, amount: 0 };
            clientStats[c].hours += (row.hours || 0);
            clientStats[c].amount += (row._importedCalculated || 0);
            if (!clientProjectStats[c]) clientProjectStats[c] = {};
            const p = row.project || '?';
            if (!clientProjectStats[c][p]) clientProjectStats[c][p] = { hours: 0, amount: 0 };
            clientProjectStats[c][p].hours += (row.hours || 0);
            clientProjectStats[c][p].amount += (row._importedCalculated || 0);
        });

        const sorted = Object.entries(clientStats).sort((a, b) => b[1].hours - a[1].hours).slice(0, 5);
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        let html = '';
        sorted.forEach(([client, stat]) => {
            const projects = clientProjectStats[client] || {};
            const isExpandable = Object.keys(projects).length > 1;
            const isExpanded = client === expandedClient;
            const baseColor = (colorMap && colorMap[client]) || '#bbb';
            const chevron = isExpandable
                ? `<i class="ph ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'} client-expand-icon"></i>`
                : `<span class="client-expand-placeholder"></span>`;
            html += `<tr class="client-summary-row${isExpandable ? ' expandable-client' : ''}" data-client="${client}">
                <td class="client-name-cell">${chevron}<span class="client-color-dot" style="background:${baseColor};"></span>${client}</td>
                <td class="number-col">${stat.hours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</td>
                <td class="number-col">${stat.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
            </tr>`;
            if (isExpanded) {
                Object.entries(projects).sort((a, b) => b[1].hours - a[1].hours).forEach(([project, pStat], j) => {
                    html += `<tr class="project-summary-row">
                        <td class="project-name-cell"><span class="client-color-dot" style="background:${shadeColor(baseColor, (j + 1) * 0.22)};"></span>${project}</td>
                        <td class="number-col">${pStat.hours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</td>
                        <td class="number-col">${pStat.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                    </tr>`;
                });
            }
        });

        tbody.innerHTML = html || `<tr><td colspan="3" style="text-align:center">${t('lblNoRecentData')}</td></tr>`;
        tbody.querySelectorAll('.expandable-client').forEach(row => {
            row.addEventListener('click', () => {
                const client = row.dataset.client;
                _expandedClients[section] = _expandedClients[section] === client ? null : client;
                render();
                renderStackedChart(chartCanvasId, activeData, _expandedClients[section], colorMap);
            });
        });
        renderStackedChart(chartCanvasId, activeData, expandedClient, colorMap);
    };
    render();
}

function renderStackedChart(canvasId, rows, expandedClient = null, colorMap = null) {
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

    const datasets = [];
    sorted.forEach(([client, amount], i) => {
        const baseColor = (colorMap && colorMap[client]) || CLIENT_COLORS[i % CLIENT_COLORS.length];
        if (client === expandedClient) {
            const projectAmounts = {};
            rows.filter(r => r.client === client).forEach(r => {
                const p = r.project || '?';
                projectAmounts[p] = (projectAmounts[p] || 0) + (r._importedCalculated || 0);
            });
            Object.entries(projectAmounts).sort((a, b) => b[1] - a[1]).forEach(([project, pAmount], j) => {
                datasets.push({ label: project, data: [pAmount], backgroundColor: shadeColor(baseColor, (j + 1) * 0.22) });
            });
        } else {
            datasets.push({ label: client, data: [amount], backgroundColor: baseColor });
        }
    });

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

function computeEvoByKey(rows, absRows, currYear, unit, byProject = false) {
    const byKey = {};
    if (unit === 'h') {
        // Absències: sempre per client (no hi ha dades de projecte)
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
            const key = byProject
                ? `${r.client || '?'} — ${r.project || '?'}`
                : (r.client || '?');
            if (!byKey[key]) byKey[key] = Array(12).fill(0);
            byKey[key][d.getMonth()] += (r[valueField] || 0);
        });
    }
    return byKey;
}

function sortedEvoEntries(byKey, selectedClients, byProject = false) {
    return Object.entries(byKey)
        .filter(([key]) => {
            if (!selectedClients || selectedClients.size === 0) return true;
            const clientPart = byProject ? key.split(' — ')[0] : key;
            return selectedClients.has(clientPart);
        })
        .sort((a, b) => b[1].reduce((s, v) => s + v, 0) - a[1].reduce((s, v) => s + v, 0));
}

function renderEvoChart(canvasId, rows, absRows, currYear, shortMonths, unit, chartType = 'bar', selectedClients = null, colorMap = null, byProject = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (_charts[canvasId]) { _charts[canvasId].destroy(); delete _charts[canvasId]; }

    const byKey = computeEvoByKey(rows, absRows, currYear, unit, byProject);
    const sorted = sortedEvoEntries(byKey, selectedClients, byProject);

    const isLine = chartType === 'line';
    const datasets = sorted.map(([key, vals], i) => {
        const color = (colorMap && colorMap[key]) || CLIENT_COLORS[i % CLIENT_COLORS.length];
        return {
            label: key,
            data: vals,
            backgroundColor: isLine ? color + '33' : color,
            borderColor: color,
            borderWidth: isLine ? 2 : 1,
            ...(isLine
                ? { tension: 0.35, fill: false, pointRadius: 3, pointHoverRadius: 5 }
                : { borderRadius: 2 }),
        };
    });

    const isCurrency = unit === '€';
    const isHours = unit === 'h' || unit === 'imp-h';
    _charts[canvasId] = new Chart(canvas, {
        type: chartType,
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

function renderEvoTable(containerId, rows, absRows, currYear, shortMonths, unit, selectedClients = null, colorMap = null, byProject = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const byKey = computeEvoByKey(rows, absRows, currYear, unit, byProject);
    const sorted = sortedEvoEntries(byKey, selectedClients, byProject);
    const isCurrency = unit === '€';
    const fmt = v => v > 0
        ? v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (isCurrency ? ' €' : ' h')
        : '—';

    container.innerHTML = `
        <div class="evo-table-scroll">
            <table class="evo-data-table">
                <thead>
                    <tr>
                        <th>Client</th>
                        ${shortMonths.map(m => `<th class="number-col">${m}</th>`).join('')}
                        <th class="number-col evo-total-col">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(([client, vals]) => {
                        const color = (colorMap && colorMap[client]) || '#ccc';
                        const total = vals.reduce((s, v) => s + v, 0);
                        return `<tr>
                            <td class="evo-client-td">
                                <span class="evo-client-dot" style="background:${color};"></span>
                                ${client}
                            </td>
                            ${vals.map(v => `<td class="number-col">${fmt(v)}</td>`).join('')}
                            <td class="number-col evo-total-col">${fmt(total)}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
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
    const clientColorMap = {};
    [...new Set(yearData.map(r => r.client || '?'))].sort().forEach((c, i) => {
        clientColorMap[c] = CLIENT_COLORS[i % CLIENT_COLORS.length];
    });

    // Clients disponibles i seleccionats — s'usen en totes les seccions del home
    const EVO_CLIENTS_KEY = 'moga_evo_clients';
    const allEvoClients = [...new Set(yearData.map(r => r.client || '?'))].sort();
    let _storedClients = null;
    try { _storedClients = JSON.parse(localStorage.getItem(EVO_CLIENTS_KEY)); } catch {}
    const _validStored = _storedClients ? _storedClients.filter(c => allEvoClients.includes(c)) : null;
    let selectedClients = _validStored ? new Set(_validStored) : new Set(allEvoClients);

    // Mapa user → client predominant (per filtrar absències per client seleccionat)
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
    const getUserClient = user => userMainClientMap[nameKey(user)] || '?';

    const yearAbsData = state.absData.filter(r => {
        const d = parseDateToDateObj(r.dateStart);
        return d && d.getFullYear() === currYear;
    });

    const globalTitleEl = document.getElementById('home-global-title');
    if (globalTitleEl) {
        const s = globalTitleEl.querySelector('span');
        if (s) s.textContent = `${t('titleGlobalSummary')} ${currYear}`;
    }
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

    // KPIs filtrats per la selecció de clients
    const renderKPIs = () => {
        const fmt = (n, sfx) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + sfx;
        const el = id => document.getElementById(id);
        const fYear   = yearData.filter(r => selectedClients.has(r.client || '?'));
        const fYearAbs = yearAbsData.filter(r => selectedClients.has(getUserClient(r.user)));
        const fCurr   = cData.filter(r => selectedClients.has(r.client || '?'));
        const fCAbs   = cAbs.filter(r => selectedClients.has(getUserClient(r.user)));
        const fPrev   = pData.filter(r => selectedClients.has(r.client || '?'));
        const fPAbs   = pAbs.filter(r => selectedClients.has(getUserClient(r.user)));

        if (el('home-total-hours'))    el('home-total-hours').textContent    = fmt(fYear.reduce((s,r) => s+(r.hours||0), 0), ' h');
        if (el('home-total-amount'))   el('home-total-amount').textContent   = fmt(fYear.reduce((s,r) => s+(r._importedCalculated||0), 0), ' €');
        if (el('home-total-abs-hours'))el('home-total-abs-hours').textContent= fmt(fYearAbs.reduce((s,r) => s+(r.hours||0), 0), ' h');
        if (el('home-total-conflicts'))el('home-total-conflicts').textContent= getConflicts(fYear, fYearAbs).filter(c => Math.abs(c.diff) > 0.01).length;

        if (el('home-curr-hours'))    el('home-curr-hours').textContent    = fmt(fCurr.reduce((s,r) => s+(r.hours||0), 0), ' h');
        if (el('home-curr-amount'))   el('home-curr-amount').textContent   = fmt(fCurr.reduce((s,r) => s+(r._importedCalculated||0), 0), ' €');
        if (el('home-curr-abs-hours'))el('home-curr-abs-hours').textContent= fmt(fCAbs.reduce((s,r) => s+(r.hours||0), 0), ' h');
        if (el('home-curr-conflicts'))el('home-curr-conflicts').textContent= getConflicts(fCurr, state.absData).filter(c => Math.abs(c.diff) > 0.01).length;

        if (el('home-prev-hours'))    el('home-prev-hours').textContent    = fmt(fPrev.reduce((s,r) => s+(r.hours||0), 0), ' h');
        if (el('home-prev-amount'))   el('home-prev-amount').textContent   = fmt(fPrev.reduce((s,r) => s+(r._importedCalculated||0), 0), ' €');
        if (el('home-prev-abs-hours'))el('home-prev-abs-hours').textContent= fmt(fPAbs.reduce((s,r) => s+(r.hours||0), 0), ' h');
        if (el('home-prev-conflicts'))el('home-prev-conflicts').textContent= getConflicts(fPrev, state.absData).filter(c => Math.abs(c.diff) > 0.01).length;
    };

    // --- Timestamps de càrrega ---
    const formatTS = (ts) => {
        if (!ts) return '-';
        return new Date(ts).toLocaleString(currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-GB' : 'ca-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };
    const tsImp       = await getFromDB('imputacions_updated');
    const tsAbs       = await getFromDB('absencies_updated');
    const filesImp    = await getFromDB('total_files');
    const filesAbs    = await getFromDB('total_abs_files');
    if (document.getElementById('last-updated-imp')) document.getElementById('last-updated-imp').textContent = formatTS(tsImp);
    if (document.getElementById('last-updated-abs')) document.getElementById('last-updated-abs').textContent = formatTS(tsAbs);
    const setFileCount = (id, count) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (count) { el.textContent = `(${count})`; el.classList.remove('hidden'); }
        else el.classList.add('hidden');
    };
    setFileCount('imp-file-count', filesImp);
    setFileCount('abs-file-count', filesAbs);

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
    setupClientTable('homeClientBody', 'homeCurrChart', cData, 'curr', clientColorMap, selectedClients);

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
    setupClientTable('homeClientPrevBody', 'homePrevChart', pData, 'prev', clientColorMap, selectedClients);

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

    const absHoursByClient = (absRows) => {
        const result = {};
        absRows.forEach(r => {
            const client = userMainClientMap[nameKey(r.user)] || '?';
            result[client] = (result[client] || 0) + (r.hours || 0);
        });
        return Object.entries(result).sort((a, b) => b[1] - a[1]);
    };

    const renderAbsClientTable = (tbodyId, titleId, absRows, label, selectedClients = null) => {
        const titleEl = document.getElementById(titleId);
        if (titleEl) titleEl.textContent = `${t('titleAbsSummary')} · ${label}`;
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        const rows = absHoursByClient(absRows)
            .filter(([client]) => !selectedClients || selectedClients.has(client));
        tbody.innerHTML = rows.length
            ? rows.map(([client, hours]) => `
                <tr>
                    <td>${client}</td>
                    <td class="number-col">${hours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</td>
                </tr>`).join('')
            : `<tr><td colspan="2" style="text-align:center">${t('lblNoRecentData')}</td></tr>`;
    };

    renderAbsClientTable('homeAbsClientCurrBody', 'home-abs-client-curr-title', cAbs, monthLabel, selectedClients);
    renderAbsClientTable('homeAbsClientPrevBody', 'home-abs-client-prev-title', pAbs, prevMonthLabel, selectedClients);

    // --- Gràfic apilat any en curs (curr/prev es renderitzen dins setupClientTable) ---
    const filteredYearData = yearData.filter(r => selectedClients.has(r.client || '?'));
    renderStackedChart('homeYearChart', filteredYearData, null, clientColorMap);

    // --- Gràfics d'evolució mensual ---
    const shortMonths = t('monthsShort');
    const EVO_TYPE_KEY = 'moga_evo_chart_type';
    let evoChartType = localStorage.getItem(EVO_TYPE_KEY) || 'bar';

    // Mapa de colors per projecte (degradat des del color base del client)
    const buildProjectColorMap = () => {
        const map = {};
        const clientProjects = {};
        yearData.forEach(r => {
            const c = r.client || '?';
            const p = r.project || '?';
            if (!clientProjects[c]) clientProjects[c] = new Set();
            clientProjects[c].add(p);
        });
        allEvoClients.forEach(c => {
            const base = clientColorMap[c] || '#bbb';
            [...(clientProjects[c] || [])].sort().forEach((p, j) => {
                map[`${c} — ${p}`] = shadeColor(base, j * 0.22);
            });
        });
        return map;
    };

    const EVO_PROJECT_KEY = 'moga_evo_by_project';
    let evoByProject = localStorage.getItem(EVO_PROJECT_KEY) === 'true';
    const byProjectCb = document.getElementById('evo-by-project');
    if (byProjectCb) byProjectCb.checked = evoByProject;

    const renderAllEvoCharts = () => {
        const isTable = evoChartType === 'table';
        document.querySelector('.evolucio-grid')?.classList.toggle('evo-mode-table', isTable);
        document.querySelectorAll('.evolucio-chart-wrap').forEach(el => { el.style.display = isTable ? 'none' : ''; });
        document.querySelectorAll('.evolucio-table-wrap').forEach(el => { el.style.display = isTable ? '' : 'none'; });

        const activeColorMap = evoByProject ? buildProjectColorMap() : clientColorMap;

        if (isTable) {
            renderEvoTable('homeEvoPressupostTable', state.currentData, state.absData, currYear, shortMonths, '€', selectedClients, activeColorMap, evoByProject);
            renderEvoTable('homeEvoAbsenciesTable', state.currentData, state.absData, currYear, shortMonths, 'h', selectedClients, clientColorMap, false);
            renderEvoTable('homeEvoImputacionsTable', state.currentData, state.absData, currYear, shortMonths, 'imp-h', selectedClients, activeColorMap, evoByProject);
        } else {
            renderEvoChart('homeEvoPressupostChart', state.currentData, state.absData, currYear, shortMonths, '€', evoChartType, selectedClients, activeColorMap, evoByProject);
            renderEvoChart('homeEvoAbsenciesChart', state.currentData, state.absData, currYear, shortMonths, 'h', evoChartType, selectedClients, clientColorMap, false);
            renderEvoChart('homeEvoImputacionsChart', state.currentData, state.absData, currYear, shortMonths, 'imp-h', evoChartType, selectedClients, activeColorMap, evoByProject);
        }
    };

    if (byProjectCb) {
        byProjectCb.onchange = (e) => {
            e.stopPropagation();
            evoByProject = byProjectCb.checked;
            localStorage.setItem(EVO_PROJECT_KEY, evoByProject);
            renderAllEvoCharts();
        };
    }

    // Botons de tipus de gràfic
    document.querySelectorAll('.evo-type-btn[data-chart-type]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chartType === evoChartType);
        btn.onclick = (e) => {
            e.stopPropagation();
            evoChartType = btn.dataset.chartType;
            localStorage.setItem(EVO_TYPE_KEY, evoChartType);
            document.querySelectorAll('.evo-type-btn[data-chart-type]').forEach(b => b.classList.toggle('active', b === btn));
            renderAllEvoCharts();
        };
    });

    // Funció que re-renderitza totes les seccions del home amb el filtre de clients actiu
    const renderAllSections = () => {
        renderKPIs();
        setupClientTable('homeClientBody', 'homeCurrChart', cData, 'curr', clientColorMap, selectedClients);
        setupClientTable('homeClientPrevBody', 'homePrevChart', pData, 'prev', clientColorMap, selectedClients);
        renderAbsClientTable('homeAbsClientCurrBody', 'home-abs-client-curr-title', cAbs, monthLabel, selectedClients);
        renderAbsClientTable('homeAbsClientPrevBody', 'home-abs-client-prev-title', pAbs, prevMonthLabel, selectedClients);
        const fYearData = yearData.filter(r => selectedClients.has(r.client || '?'));
        renderStackedChart('homeYearChart', fYearData, null, clientColorMap);
        renderAllEvoCharts();
    };

    // Filtre global de clients
    const filterContainer = document.getElementById('home-client-filter');
    if (filterContainer) {
        const saveClients = () => localStorage.setItem(EVO_CLIENTS_KEY, JSON.stringify([...selectedClients]));

        const updateBtnLabel = () => {
            const lbl = filterContainer.querySelector('.evo-client-btn-label');
            if (!lbl) return;
            if (selectedClients.size === allEvoClients.length) lbl.textContent = 'Tots els clients';
            else if (selectedClients.size === 0) lbl.textContent = 'Cap client';
            else lbl.textContent = `${selectedClients.size} de ${allEvoClients.length} clients`;
        };

        const allSelected = () => selectedClients.size === allEvoClients.length;

        filterContainer.innerHTML = `
            <button class="evo-type-btn" id="home-client-btn" type="button">
                <i class="ph ph-users"></i>
                <span class="evo-client-btn-label">…</span>
                <i class="ph ph-caret-down" style="font-size:0.65rem;margin-left:2px;opacity:0.7;"></i>
            </button>
            <div class="evo-client-panel" id="home-client-panel">
                <label class="evo-client-check evo-client-all-label">
                    <input type="checkbox" id="home-check-all" ${allSelected() ? 'checked' : ''}>
                    <span>Tots els clients</span>
                </label>
                <div id="home-client-list">
                    ${allEvoClients.map(c => `
                        <label class="evo-client-check">
                            <input type="checkbox" data-client="${c}" ${selectedClients.has(c) ? 'checked' : ''}>
                            <span class="evo-client-dot" style="background:${clientColorMap[c]};"></span>
                            <span>${c}</span>
                        </label>`).join('')}
                </div>
            </div>`;

        updateBtnLabel();

        const panel = filterContainer.querySelector('#home-client-panel');
        filterContainer.querySelector('#home-client-btn').addEventListener('click', e => {
            e.stopPropagation();
            panel.classList.toggle('open');
        });

        // Tanca el panel en clicar fora (listener únic per instància)
        if (!filterContainer.dataset.outsideListenerAdded) {
            filterContainer.dataset.outsideListenerAdded = 'true';
            document.addEventListener('mousedown', e => {
                const p = document.getElementById('home-client-panel');
                const fc = document.getElementById('home-client-filter');
                if (p && fc && !fc.contains(e.target)) p.classList.remove('open');
            });
        }

        filterContainer.querySelector('#home-check-all').addEventListener('change', e => {
            if (e.target.checked) allEvoClients.forEach(c => selectedClients.add(c));
            else selectedClients.clear();
            filterContainer.querySelectorAll('#home-client-list input').forEach(cb => {
                cb.checked = selectedClients.has(cb.dataset.client);
            });
            updateBtnLabel();
            saveClients();
            renderAllSections();
        });

        filterContainer.querySelectorAll('#home-client-list input').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) selectedClients.add(cb.dataset.client);
                else selectedClients.delete(cb.dataset.client);
                const allCb = filterContainer.querySelector('#home-check-all');
                if (allCb) allCb.checked = allSelected();
                updateBtnLabel();
                saveClients();
                renderAllSections();
            });
        });
    }

    renderAllSections();
}

// =============================================================================
// IMPRESSIÓ D'INFORME DEL HOME
// =============================================================================

function printHomeReport() {
    const el = id => document.getElementById(id);
    const val = id => el(id)?.textContent?.trim() || '-';

    const logoSrc = document.querySelector('.home-app-logo')?.src || '';
    const impDate = val('last-updated-imp');
    const absDate = val('last-updated-abs');
    const filterLabel = document.querySelector('#home-client-filter .evo-client-btn-label')?.textContent?.trim() || '';

    // Captura canvas com a imatge PNG
    const chartImg = id => {
        const c = el(id);
        return c ? `<img class="chart-img" src="${c.toDataURL('image/png')}">` : '';
    };

    // Etiqueta KPI llegida del DOM (stat-title més proper)
    const kpiLabel = id => el(id)?.closest('.stat-card')?.querySelector('.stat-title')?.textContent?.trim() || '';

    // Grid de 4 KPIs (2 columnes)
    const kpiGrid = (...ids) => `<div class="kpi-grid">${ids.map(id => `
        <div class="kpi-card">
            <div class="kpi-label">${kpiLabel(id)}</div>
            <div class="kpi-value">${val(id)}</div>
        </div>`).join('')}</div>`;

    // Clona un tbody i elimina icones d'expansió
    const cloneBody = tbodyId => {
        const tbody = el(tbodyId);
        if (!tbody) return '';
        const clone = tbody.cloneNode(true);
        clone.querySelectorAll('.client-expand-icon,.client-expand-placeholder').forEach(n => n.remove());
        return clone.innerHTML.trim();
    };

    // Taula completa amb capçaleres llegides del DOM
    const tableHtml = tbodyId => {
        const table = el(tbodyId)?.closest('table');
        if (!table) return '<p class="no-data">—</p>';
        const ths = [...table.querySelectorAll('thead th')]
            .map(th => `<th class="${th.className}">${th.textContent.trim()}</th>`).join('');
        const body = cloneBody(tbodyId);
        if (!body) return '<p class="no-data">—</p>';
        return `<table><thead><tr>${ths}</tr></thead><tbody>${body}</tbody></table>`;
    };

    // Títol de secció (span dins del header)
    const secTitle = id => el(id)?.querySelector('span')?.textContent?.trim() || el(id)?.textContent?.trim() || '';
    // Títol de subsecció (h3)
    const subTitle = id => val(id);

    // Secció de mes (actual o anterior)
    const monthSection = (hId, hoursId, amountId, absId, conflictsId,
                          clientTbId, clientTitleId, alertsTbId, alertsTitleId,
                          absTbId, absTitleId, chartId) => `
        <div class="section">
            <div class="section-title">${secTitle(hId)}</div>
            ${kpiGrid(hoursId, amountId, absId, conflictsId)}
            <div class="chart-wrap">${chartImg(chartId)}</div>
            <div class="sub-title">${subTitle(clientTitleId)}</div>
            ${tableHtml(clientTbId)}
            <div class="sub-title">${subTitle(absTitleId)}</div>
            ${tableHtml(absTbId)}
            <div class="sub-title">${subTitle(alertsTitleId)}</div>
            ${tableHtml(alertsTbId)}
        </div>`;

    // Evolució: gràfics o taules
    const isEvoTable = !!document.querySelector('.evolucio-grid.evo-mode-table');
    const evoCols = document.querySelectorAll('.evolucio-col');
    const evoChartIds  = ['homeEvoPressupostChart','homeEvoAbsenciesChart','homeEvoImputacionsChart'];
    const evoTableIds  = ['homeEvoPressupostTable','homeEvoAbsenciesTable','homeEvoImputacionsTable'];

    const evoSub = i => {
        const colTitle = evoCols[i]?.querySelector('.dashboard-col-title')?.textContent?.trim() || '';
        let content;
        if (isEvoTable) {
            const tbl = el(evoTableIds[i])?.querySelector('.evo-data-table');
            content = tbl ? `<div class="evo-wrap">${tbl.cloneNode(true).outerHTML}</div>` : '';
        } else {
            content = `<div class="chart-wrap">${chartImg(evoChartIds[i])}</div>`;
        }
        return `<div class="print-sub"><div class="sub-title">${colTitle}</div>${content}</div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="ca"><head><meta charset="UTF-8">
<title>Izertis Metrics – Informe</title>
<style>
  *,*::before,*::after{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#222;margin:0;padding:28px 36px;background:#fff}
  h1,h2,h3,p{margin:0}
  .header{display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:2px solid #0078d4;margin-bottom:10px}
  .logo{height:36px;object-fit:contain}
  .app-name{font-size:1.25rem;font-weight:700;color:#0078d4}
  .meta{font-size:0.72rem;color:#666;display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;padding:6px 0;border-bottom:1px solid #eee}
  .meta strong{color:#444}
  .section{margin-bottom:22px}
  .section-title{font-size:0.72rem;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;color:#0078d4;border-left:3px solid #0078d4;padding:3px 0 3px 8px;margin-bottom:10px}
  .sub-title{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.8px;color:#888;font-weight:600;margin:10px 0 4px}
  .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .kpi-card{border:1px solid #ddd;border-radius:3px;padding:8px 12px}
  .kpi-label{font-size:0.62rem;text-transform:uppercase;color:#888;letter-spacing:0.4px;margin-bottom:3px}
  .kpi-value{font-size:1.05rem;font-weight:700}
  .chart-wrap{margin:8px 0 12px}
  .chart-img{width:100%;display:block}
  table{width:100%;border-collapse:collapse;font-size:0.78rem;margin-bottom:12px}
  thead th{background:#f0f4f8;font-size:0.64rem;text-transform:uppercase;letter-spacing:0.3px;padding:4px 7px;text-align:left;border-bottom:1px solid #ccc;font-weight:600}
  tbody td{padding:3px 7px;border-bottom:1px solid #eee}
  .number-col{text-align:right}
  .project-summary-row td{font-size:0.75em;color:#666}
  .client-color-dot{display:inline-block;width:8px;height:8px;border-radius:2px;vertical-align:middle;margin-right:4px}
  .evo-wrap{overflow:hidden}
  .evo-wrap table{font-size:0.72rem}
  .evo-total-col{font-weight:600;border-left:1px solid #ccc}
  .print-sub{margin-bottom:10px}
  .evo-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .no-data{color:#aaa;font-style:italic;font-size:0.78rem;margin-bottom:8px}
  @media print{body{padding:0}@page{margin:1.5cm;size:A4 portrait}.section{page-break-inside:avoid}}
</style></head><body>

<div class="header">
  ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
  <span class="app-name">Izertis Metrics</span>
</div>
<div class="meta">
  <span><strong>${t('lastUpdatedImp')}:</strong> ${impDate}</span>
  <span><strong>${t('lastUpdatedAbs')}:</strong> ${absDate}</span>
  ${filterLabel ? `<span><strong>Clients:</strong> ${filterLabel}</span>` : ''}
</div>

<div class="section">
  <div class="section-title">${secTitle('home-global-title')}</div>
  ${kpiGrid('home-total-hours','home-total-amount','home-total-abs-hours','home-total-conflicts')}
  <div class="chart-wrap">${chartImg('homeYearChart')}</div>
</div>

${monthSection('home-month-title',
  'home-curr-hours','home-curr-amount','home-curr-abs-hours','home-curr-conflicts',
  'homeClientBody','home-client-title','homeAlertsBody','home-alerts-title',
  'homeAbsClientCurrBody','home-abs-client-curr-title','homeCurrChart')}

${monthSection('home-prev-month-title',
  'home-prev-hours','home-prev-amount','home-prev-abs-hours','home-prev-conflicts',
  'homeClientPrevBody','home-client-prev-title','homeAlertsPrevBody','home-alerts-prev-title',
  'homeAbsClientPrevBody','home-abs-client-prev-title','homePrevChart')}

<div class="section">
  <div class="section-title">${t('titleEvolucio')}</div>
  <div class="evo-grid">${evoSub(0)}${evoSub(1)}${evoSub(2)}</div>
</div>

</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.addEventListener('load', () => { win.focus(); win.print(); });
}

document.getElementById('btn-print-home')?.addEventListener('click', printHomeReport);
