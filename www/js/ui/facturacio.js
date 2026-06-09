// =============================================================================
// FACTURACIÓ — Resum facturable per client i mes
// =============================================================================

import { state } from '../state.js';
import { t, tForLang, currentLang } from '../config/i18n.js';
import { parseDateToDateObj, parseDateToTime } from '../utils.js';
import { syncFromBilling } from './filters.js';
import { renderBillingSummary } from './table.js';

let factClientLang = localStorage.getItem('moga_fact_lang') || currentLang;
let syncingFact = false;
let configCache = null;

async function loadConfig() {
    if (configCache !== null) return configCache;
    try {
        const res = await fetch('config.json', { cache: 'no-store' });
        if (!res.ok) { console.warn('[config] HTTP error', res.status); configCache = { customers: [] }; return configCache; }
        configCache = await res.json();
    } catch (e) {
        console.warn('[config] error carregant config.json:', e);
        configCache = { customers: [] };
    }
    return configCache;
}

function buildProjectCostCalc(config, clientId) {
    const norm = s => s?.trim().toLowerCase() ?? '';
    const customer = config.customers?.find(c => norm(c.customer_id) === norm(clientId));
    const map = {};
    customer?.projects?.forEach(p => {
        if (p.project_id) map[p.project_id] = {
            cost: p.cost_calculation || 'hours',
            hpd: p.hours_per_day || 8
        };
    });
    return map;
}

const fmt2 = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toYMD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Quan imputacions o absències canvien les dates, actualitzar la taula de facturació
document.addEventListener('fact:render', () => {
    if (!syncingFact) renderFactTable();
});

export function setupFacturacio() {
    // Idioma de comunicació
    const clientLangSelect = document.getElementById('fact-client-lang');
    if (clientLangSelect) {
        clientLangSelect.value = factClientLang;
        clientLangSelect.addEventListener('change', () => {
            factClientLang = clientLangSelect.value;
            localStorage.setItem('moga_fact_lang', factClientLang);
            renderFactTable();
        });
    }

    // Toggle Validació / Ordres
    const btnValidacio   = document.getElementById('fact-btn-validacio');
    const btnOrdres      = document.getElementById('fact-btn-ordres');
    const panelValidacio = document.getElementById('fact-panel-validacio');
    const panelOrdres    = document.getElementById('fact-panel-ordres');

    if (btnValidacio && btnOrdres) {
        btnValidacio.addEventListener('click', () => {
            btnValidacio.classList.add('fact-mode-btn--active');
            btnOrdres.classList.remove('fact-mode-btn--active');
            panelValidacio.classList.remove('hidden');
            panelOrdres.classList.add('hidden');
        });
        btnOrdres.addEventListener('click', () => {
            btnOrdres.classList.add('fact-mode-btn--active');
            btnValidacio.classList.remove('fact-mode-btn--active');
            panelOrdres.classList.remove('hidden');
            panelValidacio.classList.add('hidden');
        });
    }

    // Filtres
    const dateStart     = document.getElementById('fact-filter-date-start');
    const dateEnd       = document.getElementById('fact-filter-date-end');
    const monthNav      = document.getElementById('fact-month-nav');
    const btnMonthPrev  = document.getElementById('fact-btn-month-prev');
    const btnMonthNext  = document.getElementById('fact-btn-month-next');
    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const userSelect    = document.getElementById('fact-filter-users');

    function applyMonthNav() {
        if (!monthNav?.value) return;
        const [year, month] = monthNav.value.split('-').map(Number);
        if (dateStart) dateStart.value = toYMD(new Date(year, month - 1, 1));
        if (dateEnd)   dateEnd.value   = toYMD(new Date(year, month, 0));
        renderFactTable();
        if (!syncingFact) {
            syncingFact = true;
            syncFromBilling(dateStart?.value ?? '', dateEnd?.value ?? '', null);
            syncingFact = false;
        }
    }

    function shiftMonthNav(delta) {
        if (!monthNav) return;
        if (!monthNav.value) {
            const now = new Date();
            monthNav.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        let [y, m] = monthNav.value.split('-').map(Number);
        m += delta;
        if (m > 12) { m = 1;  y++; }
        if (m < 1)  { m = 12; y--; }
        monthNav.value = `${y}-${String(m).padStart(2, '0')}`;
        applyMonthNav();
    }

    if (monthNav)     monthNav.addEventListener('change', applyMonthNav);
    if (btnMonthPrev) btnMonthPrev.addEventListener('click', () => shiftMonthNav(-1));
    if (btnMonthNext) btnMonthNext.addEventListener('click', () => shiftMonthNav(+1));

    // Dates: rebuild en cascada + render + propagar a imputacions/absències
    [dateStart, dateEnd].filter(Boolean).forEach(el => {
        el.addEventListener('change', () => {
            rebuildProjectsAndUsers();
            renderFactTable();
            if (!syncingFact) {
                syncingFact = true;
                syncFromBilling(dateStart?.value ?? '', dateEnd?.value ?? '', null);
                syncingFact = false;
            }
        });
    });

    // Client: rebuild en cascada + render + propagar selecció a imputacions/absències
    if (clientSelect) {
        clientSelect.addEventListener('change', () => {
            rebuildProjectsAndUsers();
            renderFactTable();
            const client = clientSelect.options[clientSelect.selectedIndex]?.value || null;
            if (!syncingFact && client) {
                syncingFact = true;
                syncFromBilling(null, null, client);
                syncingFact = false;
            }
        });
    }

    // Projectes: rebuild tècnics + render
    if (projectSelect) {
        projectSelect.addEventListener('change', () => {
            rebuildUsers(null, null, userSelect);
            renderFactTable();
        });
    }

    // Tècnics: només re-renderitza
    if (userSelect) {
        userSelect.addEventListener('change', renderFactTable);
    }

    // Netejar filtres
    const btnClear = document.getElementById('fact-btn-clear-filters');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (dateStart)     dateStart.value = '';
            if (dateEnd)       dateEnd.value   = '';
            if (monthNav)      monthNav.value  = '';
            if (projectSelect) Array.from(projectSelect.options).forEach(o => o.selected = false);
            if (userSelect)    Array.from(userSelect.options).forEach(o => o.selected = false);
            if (clientSelect && clientSelect.options.length > 0) clientSelect.selectedIndex = 0;
            renderFactTable();
        });
    }

    // Minimitzar / maximitzar
    const btnToggle      = document.getElementById('fact-btn-toggle-filters');
    const filtersSection = document.getElementById('fact-filters-section');
    if (btnToggle && filtersSection) {
        if (localStorage.getItem('fact_filters_minimized') === 'true') filtersSection.classList.add('minimized');
        btnToggle.addEventListener('click', () => {
            const minimized = filtersSection.classList.toggle('minimized');
            localStorage.setItem('fact_filters_minimized', minimized);
        });
    }
}

export function renderFacturacio() {
    const noData = document.getElementById('fact-no-data');
    const main   = document.getElementById('fact-main');
    if (!noData || !main) return;

    if (state.currentData.length === 0) {
        noData.classList.remove('hidden');
        main.classList.add('hidden');
        return;
    }

    noData.classList.add('hidden');
    main.classList.remove('hidden');
    populateFilters();
    renderFactTable();
}

function populateFilters() {
    populateClients();
    rebuildProjectsAndUsers();
}

function populateClients() {
    const sel = document.getElementById('fact-filter-clients');
    if (!sel) return;
    const prev    = sel.options[sel.selectedIndex]?.value || '';
    const clients = [...new Set(state.currentData.map(r => r.client || '?'))].filter(c => c !== '?').sort();
    sel.innerHTML = clients.map(c => `<option value="${c}"${c === prev ? ' selected' : ''}>${c}</option>`).join('');
    if (!clients.includes(prev) && clients.length > 0) sel.selectedIndex = 0;
}

// Reconstrueix projectes i tècnics filtrats únicament pel client seleccionat.
// Les dates no filtren les opcions disponibles, només la taula de resultats.
function rebuildProjectsAndUsers() {
    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const userSelect    = document.getElementById('fact-filter-users');
    if (!projectSelect || !userSelect) return;

    const client   = clientSelect?.options[clientSelect.selectedIndex]?.value || '';
    const byClient = client
        ? state.currentData.filter(r => (r.client || '?') === client)
        : state.currentData;

    const prevProjects  = Array.from(projectSelect.selectedOptions).map(o => o.value);
    const availProjects = [...new Set(byClient.map(r => r.project).filter(Boolean))].sort();
    const validProjects = prevProjects.filter(p => availProjects.includes(p));
    projectSelect.innerHTML = availProjects.map(p =>
        `<option value="${p}"${validProjects.includes(p) ? ' selected' : ''}>${p}</option>`
    ).join('');

    rebuildUsers(byClient, validProjects, userSelect);
}

// Reconstrueix tècnics filtrats per client i projectes seleccionats.
function rebuildUsers(byClient, selectedProjects, userSelect) {
    if (!userSelect) userSelect = document.getElementById('fact-filter-users');
    if (!userSelect) return;
    if (!byClient) {
        const clientSelect = document.getElementById('fact-filter-clients');
        const client = clientSelect?.options[clientSelect.selectedIndex]?.value || '';
        byClient = client
            ? state.currentData.filter(r => (r.client || '?') === client)
            : state.currentData;
    }
    if (!selectedProjects) {
        const projectSelect = document.getElementById('fact-filter-projects');
        selectedProjects = projectSelect ? Array.from(projectSelect.selectedOptions).map(o => o.value) : [];
    }

    const byProject  = selectedProjects.length > 0
        ? byClient.filter(r => selectedProjects.includes(r.project))
        : byClient;
    const prevUsers  = Array.from(userSelect.selectedOptions).map(o => o.value);
    const availUsers = [...new Set(byProject.map(r => r.user).filter(Boolean))].sort();
    const validUsers = prevUsers.filter(u => availUsers.includes(u));
    userSelect.innerHTML = availUsers.map(u =>
        `<option value="${u}"${validUsers.includes(u) ? ' selected' : ''}>${u}</option>`
    ).join('');
}

async function renderFactTable() {
    const dateStartEl   = document.getElementById('fact-filter-date-start');
    const dateEndEl     = document.getElementById('fact-filter-date-end');
    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const userSelect    = document.getElementById('fact-filter-users');
    const summaryBody   = document.getElementById('summaryBody');
    const titleEl       = document.getElementById('fact-table-title');
    if (!clientSelect || !summaryBody) return;

    const client           = clientSelect.options[clientSelect.selectedIndex]?.value || '';
    const startTs          = dateStartEl?.value ? parseDateToTime(dateStartEl.value) : 0;
    const endTs            = dateEndEl?.value   ? parseDateToTime(dateEndEl.value) + 86399999 : Infinity;
    const selectedProjects = projectSelect ? Array.from(projectSelect.selectedOptions).map(o => o.value) : [];
    const selectedUsers    = userSelect    ? Array.from(userSelect.selectedOptions).map(o => o.value)    : [];

    const ordresTitleEl = document.getElementById('fact-ordres-title');

    const totalHoursEl  = document.getElementById('fact-total-hours');
    const totalAmountEl = document.getElementById('total-amount');

    if (!client) {
        summaryBody.innerHTML = '';
        if (totalHoursEl)  totalHoursEl.textContent  = '0.00';
        if (totalAmountEl) totalAmountEl.textContent = '0.00 €';
        return;
    }

    const rows = state.currentData.filter(r => {
        if ((r.client || '?') !== client) return false;
        const d = parseDateToDateObj(r.date);
        if (!d) return false;
        const rowTs = d.getTime();
        if (startTs   && rowTs < startTs) return false;
        if (endTs !== Infinity && rowTs > endTs) return false;
        if (selectedProjects.length > 0 && !selectedProjects.includes(r.project)) return false;
        if (selectedUsers.length    > 0 && !selectedUsers.includes(r.user))       return false;
        return true;
    });

    const totalHours  = rows.reduce((s, r) => s + (r.hours || 0), 0);
    const totalAmount = rows.reduce((s, r) => s + (r._importedCalculated || 0), 0);
    if (totalHoursEl)  totalHoursEl.textContent  = totalHours.toFixed(2);
    if (totalAmountEl) totalAmountEl.textContent = totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    const config          = await loadConfig();
    const norm            = s => s?.trim().toLowerCase() ?? '';
    const customerEntry   = config.customers?.find(c => norm(c.customer_id) === norm(client));
    const customerName    = customerEntry?.customer_name || client;
    const projectCostCalc = buildProjectCostCalc(config, client);

    // Títol: nom oficial del client + rang de dates
    let titleText = customerName;
    if (dateStartEl?.value || dateEndEl?.value) {
        titleText += ` — ${dateStartEl?.value || '…'} / ${dateEndEl?.value || '…'}`;
    }
    if (titleEl) titleEl.textContent = titleText;
    if (ordresTitleEl) ordresTitleEl.textContent = titleText;

    renderBillingSummary(rows, tForLang(factClientLang, 'factColRate'), factClientLang, projectCostCalc, customerName);
}
