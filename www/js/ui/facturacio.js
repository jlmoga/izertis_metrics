// =============================================================================
// FACTURACIÓ — Resum facturable per client i mes
// =============================================================================

import { state } from '../state.js';
import { t, tForLang, currentLang } from '../config/i18n.js';
import { parseDateToDateObj, parseDateToTime } from '../utils.js';
import { syncFromBilling } from './filters.js';

let factClientLang = localStorage.getItem('moga_fact_lang') || currentLang;
let syncingFact = false;

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

    // Dates: render + propagar a imputacions/absències
    [dateStart, dateEnd].filter(Boolean).forEach(el => {
        el.addEventListener('change', () => {
            renderFactTable();
            if (!syncingFact) {
                syncingFact = true;
                syncFromBilling(dateStart?.value ?? '', dateEnd?.value ?? '', null);
                syncingFact = false;
            }
        });
    });

    // Client: render + propagar selecció a imputacions/absències (unidireccional)
    if (clientSelect) {
        clientSelect.addEventListener('change', () => {
            renderFactTable();
            const client = clientSelect.options[clientSelect.selectedIndex]?.value || null;
            if (!syncingFact && client) {
                syncingFact = true;
                syncFromBilling(null, null, client);
                syncingFact = false;
            }
        });
    }

    // Projectes i tècnics: només re-renderitzen facturació
    [projectSelect, userSelect].filter(Boolean).forEach(el => {
        el.addEventListener('change', renderFactTable);
    });

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
    populateMultiSelect('fact-filter-projects', state.currentData.map(r => r.project).filter(Boolean));
    populateMultiSelect('fact-filter-users',    state.currentData.map(r => r.user).filter(Boolean));
}

function populateClients() {
    const sel = document.getElementById('fact-filter-clients');
    if (!sel) return;
    const prev    = sel.options[sel.selectedIndex]?.value || '';
    const clients = [...new Set(state.currentData.map(r => r.client || '?'))].filter(c => c !== '?').sort();
    sel.innerHTML = clients.map(c => `<option value="${c}"${c === prev ? ' selected' : ''}>${c}</option>`).join('');
    if (!clients.includes(prev) && clients.length > 0) sel.selectedIndex = 0;
}

function populateMultiSelect(id, rawValues) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prevSelected = Array.from(sel.selectedOptions).map(o => o.value);
    const values = [...new Set(rawValues)].sort();
    sel.innerHTML = values.map(v =>
        `<option value="${v}"${prevSelected.includes(v) ? ' selected' : ''}>${v}</option>`
    ).join('');
}

function renderFactTable() {
    const dateStartEl   = document.getElementById('fact-filter-date-start');
    const dateEndEl     = document.getElementById('fact-filter-date-end');
    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const userSelect    = document.getElementById('fact-filter-users');
    const tbody         = document.getElementById('fact-tbody');
    const titleEl       = document.getElementById('fact-table-title');
    if (!clientSelect || !tbody) return;

    const client          = clientSelect.options[clientSelect.selectedIndex]?.value || '';
    const startTs         = dateStartEl?.value ? parseDateToTime(dateStartEl.value) : 0;
    const endTs           = dateEndEl?.value   ? parseDateToTime(dateEndEl.value) + 86399999 : Infinity;
    const selectedProjects = projectSelect ? Array.from(projectSelect.selectedOptions).map(o => o.value) : [];
    const selectedUsers    = userSelect    ? Array.from(userSelect.selectedOptions).map(o => o.value)    : [];

    if (!client) { tbody.innerHTML = ''; return; }

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

    // Agrega per projecte + tècnic + tarifa
    const agg = {};
    rows.forEach(r => {
        const key = `${r.project || '?'}\x00${r.user || '?'}\x00${r.rate || 0}`;
        if (!agg[key]) agg[key] = { project: r.project || '?', user: r.user || '?', rate: r.rate || 0, hours: 0, amount: 0 };
        agg[key].hours  += r.hours || 0;
        agg[key].amount += r._importedCalculated || 0;
    });

    const entries = Object.values(agg).sort((a, b) =>
        a.project.localeCompare(b.project) || a.user.localeCompare(b.user) || a.rate - b.rate);

    const tF = (key) => tForLang(factClientLang, key);

    // Encapçalaments en l'idioma de comunicació
    const thMap = { 'fact-th-project': 'colProject', 'fact-th-user': 'colUser', 'fact-th-rate': 'factColRate', 'fact-th-hours': 'factColHours', 'fact-th-import': 'factColImport' };
    Object.entries(thMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = tF(key);
    });

    // Títol: client + rang de dates si n'hi ha
    let titleText = client;
    if (dateStartEl?.value || dateEndEl?.value) {
        titleText += ` — ${dateStartEl?.value || '…'} / ${dateEndEl?.value || '…'}`;
    }
    if (titleEl) titleEl.textContent = titleText;
    const ordresTitleEl = document.getElementById('fact-ordres-title');
    if (ordresTitleEl) ordresTitleEl.textContent = titleText;

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="fact-no-results">${tF('factNoResults')}</td></tr>`;
        return;
    }

    const totalHours  = entries.reduce((s, r) => s + r.hours, 0);
    const totalAmount = entries.reduce((s, r) => s + r.amount, 0);

    let lastProject = null;
    tbody.innerHTML = entries.map(r => {
        const projectCell = r.project !== lastProject ? `<td>${r.project}</td>` : `<td></td>`;
        lastProject = r.project;
        return `<tr>
            ${projectCell}
            <td>${r.user}</td>
            <td class="number-col">${fmt2(r.rate)} €/h</td>
            <td class="number-col">${fmt2(r.hours)} h</td>
            <td class="number-col">${fmt2(r.amount)} €</td>
        </tr>`;
    }).join('')
        + `<tr class="fact-total-row">
            <td colspan="2">${tF('factTotal')}</td>
            <td class="number-col"></td>
            <td class="number-col">${fmt2(totalHours)} h</td>
            <td class="number-col">${fmt2(totalAmount)} €</td>
        </tr>`;
}
