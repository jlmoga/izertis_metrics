// =============================================================================
// FACTURACIÓ — Resum facturable per client i mes
// =============================================================================

import { state } from '../state.js';
import { t, tForLang, currentLang } from '../config/i18n.js';
import { parseDateToDateObj, parseDateToTime, usersForClients } from '../utils.js';
import { syncFromBilling } from './filters.js';
import { renderBillingSummary } from './table.js';
import { getConflicts } from './overtime.js';

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
    const norm = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
    const customer = config.customers?.find(c => norm(c.customer_id) === norm(clientId));
    const map = {};
    customer?.projects?.forEach(p => {
        if (p.project_id) map[p.project_id] = {
            cost: p.cost_calculation || 'hours',
            hpd: p.hours_per_day || 8,
            navision: p.project_navision_code || '',
            fixedAmount: p.cost_fixed || 0
        };
    });
    return map;
}

const fmt2 = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toYMD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Quan imputacions o absències canvien les dates, actualitzar la taula de facturació
document.addEventListener('fact:render', () => {
    if (!syncingFact) { renderFactTable(); renderOrdresTable(); }
});

export function setupFacturacio() {
    // Idioma de comunicació
    const clientLangSelect = document.getElementById('fact-client-lang');
    if (clientLangSelect) {
        clientLangSelect.value = factClientLang;
        clientLangSelect.addEventListener('change', () => {
            factClientLang = clientLangSelect.value;
            localStorage.setItem('moga_fact_lang', factClientLang);
            renderFactTable(); renderOrdresTable();
            syncToolbarTexts();
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
            document.querySelectorAll('.fact-omo-only').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.fact-validacio-only').forEach(el => el.classList.remove('hidden'));
        });
        btnOrdres.addEventListener('click', () => {
            btnOrdres.classList.add('fact-mode-btn--active');
            btnValidacio.classList.remove('fact-mode-btn--active');
            panelOrdres.classList.remove('hidden');
            panelValidacio.classList.add('hidden');
            document.querySelectorAll('.fact-validacio-only').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.fact-omo-only').forEach(el => el.classList.remove('hidden'));
            renderOrdresTable();
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
        renderFactTable(); renderOrdresTable();
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
            renderFactTable(); renderOrdresTable();
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
            renderFactTable(); renderOrdresTable();
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
            renderFactTable(); renderOrdresTable();
        });
    }

    // Tècnics: només re-renderitza
    if (userSelect) {
        userSelect.addEventListener('change', () => { renderFactTable(); renderOrdresTable(); });
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
            renderFactTable(); renderOrdresTable();
        });
    }

    // Imprimir validació
    const btnPrintVal = document.getElementById('fact-btn-print-validacio');
    if (btnPrintVal) btnPrintVal.addEventListener('click', printValidacio);

    // Preparar mail validació
    const btnMailVal = document.getElementById('fact-btn-mail-validacio');
    if (btnMailVal) btnMailVal.addEventListener('click', mailValidacio);

    // Imprimir OMO
    const btnPrintOMO = document.getElementById('fact-btn-print-omo');
    if (btnPrintOMO) btnPrintOMO.addEventListener('click', printOMO);

    // Preparar mail OMO
    const btnMailOMO = document.getElementById('fact-btn-mail-omo');
    if (btnMailOMO) btnMailOMO.addEventListener('click', mailOMO);

    // Quadre de conflictes clicable → pestanya d'absències amb els mateixos filtres
    ['fact-total-conflicts', 'fact-omo-total-conflicts'].forEach(id => {
        const card = document.getElementById(id)?.closest('.stat-card');
        if (!card) return;
        card.addEventListener('click', () => {
            if (!card.classList.contains('stat-card--clickable')) return;
            const ds = document.getElementById('fact-filter-date-start')?.value ?? '';
            const de = document.getElementById('fact-filter-date-end')?.value ?? '';
            const cs = document.getElementById('fact-filter-clients');
            const client = cs?.options[cs.selectedIndex]?.value || null;
            syncFromBilling(ds, de, client);
            document.getElementById('nav-absencies')?.click();
        });
    });

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

    // Copiar validació
    const btnCopyVal = document.getElementById('fact-btn-copy-validacio');
    if (btnCopyVal) btnCopyVal.addEventListener('click', copyValidacio);

    // Copiar OMO
    const btnCopyOMO = document.getElementById('fact-btn-copy-omo');
    if (btnCopyOMO) btnCopyOMO.addEventListener('click', copyOMO);

    // Escolta de canvis a Text per enviar
    const checkSendText = document.getElementById('fact-check-send-text');
    if (checkSendText) checkSendText.addEventListener('change', () => updateSendTextOnlyUI(false));

    const checkOmoSendText = document.getElementById('fact-check-omo-send-text');
    if (checkOmoSendText) checkOmoSendText.addEventListener('change', () => updateSendTextOnlyUI(true));

    // Inicialització de la interfície pels checks de text
    syncToolbarTexts();
}

function htmlToPlainText(html) {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/th>/gi, '\t')
        .replace(/<\/td>/gi, '\t')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\t\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function copyHtmlToClipboard(html) {
    try {
        await navigator.clipboard.write([new ClipboardItem({
            'text/html':  new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([htmlToPlainText(html)], { type: 'text/plain' })
        })]);
    } catch { /* si el navegador no ho permet, no passa res */ }
}

async function mailValidacio() {
    const titleEl    = document.getElementById('fact-table-title');
    const sendTextEl = document.getElementById('fact-validation-send-text');
    const billingEl  = document.getElementById('fact-billing-tables');
    const afterEl    = document.getElementById('fact-validation-meta-after');
    if (!billingEl) return;

    const prefix   = tForLang(factClientLang, 'factTitleValidacio').replace(/\.$/, '');
    const subject  = `${prefix} — ${titleEl?.textContent?.trim() || ''}`;
    const bodyHtml = (sendTextEl?.innerHTML || '') + billingEl.innerHTML + (afterEl?.innerHTML || '');
    const body     = htmlToPlainText(bodyHtml);

    // Destinataris: llegim config per obtenir list_mails_validation del client actiu
    const clientSelect = document.getElementById('fact-filter-clients');
    const client = clientSelect?.options[clientSelect?.selectedIndex]?.value || '';
    let to = '';
    if (client) {
        const config = await loadConfig();
        const norm = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
        const customerEntry = config.customers?.find(c => norm(c.customer_id) === norm(client));
        to = customerEntry?.list_mails_validation?.trim() || '';
    }

    await copyHtmlToClipboard(bodyHtml);

    const mailClient = localStorage.getItem('moga_mail_client') || 'desktop';
    if (mailClient === 'web') {
        window.open(`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else {
        window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
}

function printValidacio() {
    const titleEl      = document.getElementById('fact-table-title');
    const beforeEl     = document.getElementById('fact-validation-meta-before');
    const sendTextEl   = document.getElementById('fact-validation-send-text');
    const billingEl    = document.getElementById('fact-billing-tables');
    const afterEl      = document.getElementById('fact-validation-meta-after');
    if (!billingEl) return;

    const sendTextOnly = document.getElementById('fact-check-send-text')?.checked ?? false;
    const base  = window.location.href.replace(/[^/]*$/, '');
    const title = titleEl?.textContent?.trim() || '';
    const theme = document.body.className;

    const headerEl     = document.querySelector('#fact-panel-validacio .fact-panel-header');
    const headerHtml   = sendTextOnly ? '' : (headerEl?.outerHTML || '');

    const metaHtml = sendTextOnly
        ? (sendTextEl?.innerHTML || '')
        : headerHtml + (beforeEl?.innerHTML || '') + (sendTextEl?.innerHTML || '');

    const html = `<!DOCTYPE html>
<html lang="${document.documentElement.lang}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<base href="${base}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://unpkg.com/@phosphor-icons/web"><\/script>
<link rel="stylesheet" href="css/main.css">
<style>
  body { padding: 2rem 2.5rem; overflow: visible; height: auto; }
  @media print { body { padding: 0; } }
  .table-container { overflow: visible; max-height: none; height: auto; box-shadow: none; }
  .fact-content-scroll { overflow: visible; }
</style>
</head>
<body class="${theme} print-report">
<p class="fact-meta-line" style="font-size:1.1rem;font-weight:600;margin-bottom:1.25rem;padding-bottom:0.5rem;border-bottom:2px solid var(--accent-color);">${title}</p>
${metaHtml}
${billingEl.innerHTML}
${afterEl?.innerHTML || ''}
</body>
</html>`;

    const tab = window.open('', '_blank');
    if (tab) {
        tab.document.write(html);
        tab.document.close();
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

// Compta i mostra els conflictes de jornada del client i període seleccionats.
// Usa la mateixa lògica que la pestanya d'Absències: els tècnics es vinculen al client
// pel seu client predominant (no per la imputació concreta del dia), de manera que el
// recompte coincideix amb el que es veu a la taula de conflictes d'absències.
function updateConflictsCard(el, client, startTs, endTs) {
    if (!el) return;
    let count = 0;
    if (client && state.absData.length > 0) {
        const allowedUsers = usersForClients(state.currentData, state.absData, [client]);
        count = getConflicts(state.currentData, state.absData, [], startTs, endTs, allowedUsers).length;
    }
    const card = el.closest('.stat-card');
    if (count === 0) {
        el.setAttribute('data-i18n', 'factNoConflicts');
        el.textContent = t('factNoConflicts');
        if (card) card.classList.remove('stat-card--clickable');
    } else {
        el.removeAttribute('data-i18n');
        el.textContent = `${count} ${t('factConflictsSuffix')}`;
        if (card) card.classList.add('stat-card--clickable');
    }
}

async function renderFactTable() {
    const dateStartEl   = document.getElementById('fact-filter-date-start');
    const dateEndEl     = document.getElementById('fact-filter-date-end');
    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const userSelect    = document.getElementById('fact-filter-users');
    const billingTablesEl = document.getElementById('fact-billing-tables');
    const titleEl         = document.getElementById('fact-table-title');
    if (!clientSelect || !billingTablesEl) return;

    const client           = clientSelect.options[clientSelect.selectedIndex]?.value || '';
    const startTs          = dateStartEl?.value ? parseDateToTime(dateStartEl.value) : 0;
    const endTs            = dateEndEl?.value   ? parseDateToTime(dateEndEl.value) + 86399999 : Infinity;
    const selectedProjects = projectSelect ? Array.from(projectSelect.selectedOptions).map(o => o.value) : [];
    const selectedUsers    = userSelect    ? Array.from(userSelect.selectedOptions).map(o => o.value)    : [];

    const totalHoursEl  = document.getElementById('fact-total-hours');
    const totalAmountEl = document.getElementById('total-amount');
    const conflictsEl   = document.getElementById('fact-total-conflicts');

    if (!client) {
        billingTablesEl.innerHTML = '';
        if (totalHoursEl)  totalHoursEl.textContent  = '0.00';
        if (totalAmountEl) totalAmountEl.textContent = '0.00 €';
        updateConflictsCard(conflictsEl, '', startTs, endTs);
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

    const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(2);
    updateConflictsCard(conflictsEl, client, startTs, endTs);

    const config          = await loadConfig();
    const norm            = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
    const customerEntry   = config.customers?.find(c => norm(c.customer_id) === norm(client));
    const customerName    = customerEntry?.customer_name || client;
    const projectCostCalc = buildProjectCostCalc(config, client);

    // Import efectiu: projectes fixos usen cost_fixed; la resta sumen _importedCalculated
    const effectiveTotalAmount = (() => {
        const byPid = {};
        rows.forEach(r => {
            const pid = r.project; if (!pid) return;
            byPid[pid] = (byPid[pid] || 0) + (r._importedCalculated || 0);
        });
        return Object.keys(byPid).reduce((sum, pid) => {
            const pi = projectCostCalc[pid];
            return sum + (pi?.cost === 'fixed' ? (pi.fixedAmount || 0) : byPid[pid]);
        }, 0);
    })();
    if (totalAmountEl) totalAmountEl.textContent = effectiveTotalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // Títol: nom oficial del client + rang de dates
    let titleText = customerName;
    if (dateStartEl?.value || dateEndEl?.value) {
        titleText += ` — ${dateStartEl?.value || '…'} / ${dateEndEl?.value || '…'}`;
    }
    if (titleEl) titleEl.textContent = titleText;

    if (rows.length === 0) {
        billingTablesEl.innerHTML = '';
        const noDataEl = document.createElement('p');
        noDataEl.className = 'fact-meta-line';
        noDataEl.style.cssText = 'color:var(--text-secondary);font-style:italic;margin-top:0.75rem;';
        noDataEl.textContent = t('factNoDataSelection');
        billingTablesEl.appendChild(noDataEl);
        renderValidationMeta([], config, client, factClientLang);
        return;
    }

    billingTablesEl.innerHTML = '';
    {
        const esc    = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const nl2br  = s => esc(s).replace(/\\n|\n/g,'<br>');
        const projectIds = [...new Set(rows.map(r => r.project).filter(Boolean))];
        const mkBlank    = () => { const p = document.createElement('p'); p.className = 'fact-meta-line'; p.innerHTML = '&nbsp;'; return p; };

        projectIds.forEach((pid, index) => {
            if (index > 0) {
                billingTablesEl.appendChild(mkBlank());
                billingTablesEl.appendChild(mkBlank());
            }

            const projectRows = rows.filter(r => r.project === pid);
            const projConf    = customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid));

            const introText = projConf?.validation_intro?.trim();
            if (introText) {
                const introEl = document.createElement('p');
                introEl.className = 'fact-meta-line';
                introEl.innerHTML = nl2br(introText);
                billingTablesEl.appendChild(introEl);
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'table-container fact-project-table';
            const table  = document.createElement('table');
            const thead  = document.createElement('thead');
            const tbody  = document.createElement('tbody');
            table.appendChild(thead);
            table.appendChild(tbody);
            wrapper.appendChild(table);
            billingTablesEl.appendChild(wrapper);
            renderBillingSummary(projectRows, tForLang(factClientLang, 'factColRate'), factClientLang, projectCostCalc, customerName, table);

            const obsText = projConf?.validation_observations?.trim();
            if (obsText) {
                const obsEl = document.createElement('p');
                obsEl.className = 'fact-meta-line';
                obsEl.innerHTML = nl2br(obsText);
                billingTablesEl.appendChild(obsEl);
            }
        });
    }

    // Separador i títol de totals
    const mkBlankOuter = () => { const p = document.createElement('p'); p.className = 'fact-meta-line'; p.innerHTML = '&nbsp;'; return p; };
    billingTablesEl.appendChild(mkBlankOuter());
    billingTablesEl.appendChild(mkBlankOuter());
    const totalsLabelEl = document.createElement('p');
    totalsLabelEl.className = 'fact-meta-line';
    totalsLabelEl.innerHTML = `<strong>${tForLang(factClientLang, 'factTotalsLabel')}</strong>`;
    billingTablesEl.appendChild(totalsLabelEl);

    // Taula de totals del client
    const totalWrapper = document.createElement('div');
    totalWrapper.className = 'table-container fact-project-table';
    const totalTable = document.createElement('table');
    totalTable.appendChild(document.createElement('thead'));
    totalTable.appendChild(document.createElement('tbody'));
    totalWrapper.appendChild(totalTable);
    billingTablesEl.appendChild(totalWrapper);
    renderBillingSummary(rows, tForLang(factClientLang, 'factColRate'), factClientLang, projectCostCalc, customerName, totalTable, true);

    renderValidationMeta(rows, config, client, factClientLang);
}

function renderValidationMeta(rows, config, clientId, lang) {
    const beforeEl   = document.getElementById('fact-validation-meta-before');
    const sendTextEl = document.getElementById('fact-validation-send-text');
    const afterEl    = document.getElementById('fact-validation-meta-after');
    if (!beforeEl || !afterEl) return;

    const norm = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
    const customerEntry = config.customers?.find(c => norm(c.customer_id) === norm(clientId));
    const visibleProjectIds = [...new Set(rows.map(r => r.project).filter(Boolean))];

    const projects = visibleProjectIds
        .map(pid => customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid)))
        .filter(Boolean);

    const uniq = arr => [...new Set(arr.filter(v => v != null && String(v).trim() !== ''))];
    const esc  = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const nl2br = s => esc(s).replace(/\\n|\n/g, '<br>');

    const listMails    = customerEntry?.list_mails_validation?.trim()
        ? [customerEntry.list_mails_validation.trim()]
        : [];
    const navisionCodes = visibleProjectIds
        .map(pid => customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid))?.project_navision_code)
        .filter(v => v != null && String(v).trim() !== '');
    const okRequired   = projects.some(p => p.ok_required);
    const introTexts   = customerEntry?.customer_validation_intro?.trim()
        ? [customerEntry.customer_validation_intro.trim()]
        : [];
    const obsTexts     = customerEntry?.customer_validation_observations?.trim()
        ? [customerEntry.customer_validation_observations.trim()]
        : [];

    const tl = key => tForLang(lang, key);
    const customerName = customerEntry?.customer_name || clientId;

    // Bloc informatiu — idioma de la interfície, exclòs en mode "text per enviar"
    let infoHtml = '';
    if (listMails.length > 0)
        infoHtml += `<p class="fact-meta-line"><strong>${t('factValidationMailList')}</strong> ${esc(listMails.join('; '))}</p>`;
    if (navisionCodes.length > 0)
        infoHtml += `<p class="fact-meta-line"><strong>${t('factValidationNavision')}</strong> ${esc(navisionCodes.join(', '))}</p>`;
    infoHtml += `<p class="fact-meta-line"><strong>${t('factValidationRequired')}</strong> ${okRequired ? t('factValidationYes') : t('factValidationNo')}</p>`;
    beforeEl.innerHTML = `<div class="fact-validation-config-box">
        <p class="fact-validation-config-box-title">${t('factValidationConfigTitle')} ${esc(customerName)}</p>
        ${infoHtml}
    </div>${!okRequired ? `<p class="fact-no-validation-warning"><i class="ph ph-warning"></i> ${t('factNoValidationWarning')}</p>` : ''}`;

    // Sense dades: no mostrem el bloc de text a enviar
    if (rows.length === 0) {
        if (sendTextEl) sendTextEl.innerHTML = '';
        if (afterEl)    afterEl.innerHTML    = '';
        return;
    }

    // Bloc de text a enviar (a partir del títol en negreta)
    const dateStart    = document.getElementById('fact-filter-date-start')?.value || '';
    const dateEnd      = document.getElementById('fact-filter-date-end')?.value   || '';
    const dateRange    = (dateStart || dateEnd) ? ` - ${dateStart} / ${dateEnd}` : '';
    let sendHtml = '';
    sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    sendHtml += `<p class="fact-meta-line"><strong>${tl('factMetaValidationTitle')} - ${esc(customerName)}${dateRange}</strong></p>`;

    if (introTexts.length > 0) {
        sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
        sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    }
    introTexts.forEach(text => {
        sendHtml += `<p class="fact-meta-line fact-meta-intro">${nl2br(text)}</p>`;
    });

    const projectTotals = {};
    rows.forEach(r => {
        const pk = r.project || '-';
        if (!projectTotals[pk]) projectTotals[pk] = { hours: 0, amount: 0 };
        projectTotals[pk].hours  += r.hours || 0;
        projectTotals[pk].amount += r._importedCalculated || 0;
    });
    sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    sendHtml += `<p class="fact-meta-line">${tl('factMetaProjectsHeader')}</p>`;
    visibleProjectIds.forEach(pid => {
        const totals   = projectTotals[pid] || { hours: 0, amount: 0 };
        const projConf = customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid));
        const isDays   = projConf?.cost_calculation === 'days';
        const isFixed  = projConf?.cost_calculation === 'fixed';
        const hpd      = projConf?.hours_per_day || 8;
        const qty      = isDays
            ? `${fmt2(totals.hours / hpd)} ${tl('factMetaDays')}`
            : `${fmt2(totals.hours)} ${tl('factMetaHours')}`;
        const effectiveAmount = isFixed
            ? (projConf?.cost_fixed || 0)
            : totals.amount;
        const navision = projConf?.project_navision_code?.trim()
            ? ` (${esc(projConf.project_navision_code.trim())})`
            : '';
        sendHtml += `<p class="fact-meta-line">- ${esc(pid)}${navision}: ${qty} - ${fmt2(effectiveAmount)} €</p>`;
    });

    const monthSet = new Set();
    rows.forEach(r => {
        if (!r.date) return;
        const p = r.date.split('/');
        if (p.length < 3) return;
        monthSet.add(`${p[2]}-${p[1].padStart(2, '0')}`);
    });
    const monthKeys   = [...monthSet].sort();
    const monthNames  = tForLang(lang, 'months');
    const monthsStr   = monthKeys
        .map(k => {
            const [yr, mo] = k.split('-');
            return `${monthNames[parseInt(mo, 10) - 1]} ${tl('factMetaMonthOf')} ${yr}`;
        })
        .join(', ');
    if (monthKeys.length > 0) {
        sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
        sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
        sendHtml += `<p class="fact-meta-line"><strong>${tl('factMetaBreakdownIntro')} ${monthsStr}.</strong></p>`;
    }

    if (sendTextEl) sendTextEl.innerHTML = sendHtml;

    let afterHtml = '';
    obsTexts.forEach(text => {
        afterHtml += `<p class="fact-meta-line fact-meta-obs">${nl2br(text)}</p>`;
    });
    if (obsTexts.length > 0) {
        afterHtml += `<p class="fact-meta-line">&nbsp;</p>`;
        afterHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    }
    afterEl.innerHTML = afterHtml;
}

// =============================================================================
// ORDRES DE FACTURACIÓ
// =============================================================================

async function renderOrdresTable() {
    const dateStartEl   = document.getElementById('fact-filter-date-start');
    const dateEndEl     = document.getElementById('fact-filter-date-end');
    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const userSelect    = document.getElementById('fact-filter-users');
    const omoTablesEl   = document.getElementById('fact-omo-tables');
    if (!clientSelect || !omoTablesEl) return;

    const client           = clientSelect.options[clientSelect.selectedIndex]?.value || '';
    const startTs          = dateStartEl?.value ? parseDateToTime(dateStartEl.value) : 0;
    const endTs            = dateEndEl?.value   ? parseDateToTime(dateEndEl.value) + 86399999 : Infinity;
    const selectedProjects = projectSelect ? Array.from(projectSelect.selectedOptions).map(o => o.value) : [];
    const selectedUsers    = userSelect    ? Array.from(userSelect.selectedOptions).map(o => o.value)    : [];

    const totalHoursEl  = document.getElementById('fact-omo-total-hours');
    const totalAmountEl = document.getElementById('fact-omo-total-amount');
    const conflictsEl   = document.getElementById('fact-omo-total-conflicts');

    if (!client) {
        omoTablesEl.innerHTML = '';
        if (totalHoursEl)  totalHoursEl.textContent  = '0.00';
        if (totalAmountEl) totalAmountEl.textContent = '0.00 €';
        updateConflictsCard(conflictsEl, '', startTs, endTs);
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

    const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(2);
    updateConflictsCard(conflictsEl, client, startTs, endTs);

    const config          = await loadConfig();
    const norm            = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
    const customerEntry   = config.customers?.find(c => norm(c.customer_id) === norm(client));
    const customerName    = customerEntry?.customer_name || client;
    const projectCostCalc = buildProjectCostCalc(config, client);

    const effectiveTotalAmount = (() => {
        const byPid = {};
        rows.forEach(r => {
            const pid = r.project; if (!pid) return;
            byPid[pid] = (byPid[pid] || 0) + (r._importedCalculated || 0);
        });
        return Object.keys(byPid).reduce((sum, pid) => {
            const pi = projectCostCalc[pid];
            return sum + (pi?.cost === 'fixed' ? (pi.fixedAmount || 0) : byPid[pid]);
        }, 0);
    })();
    if (totalAmountEl) totalAmountEl.textContent = effectiveTotalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    const ordresTitleEl = document.getElementById('fact-ordres-title');
    let titleText = customerName;
    if (dateStartEl?.value || dateEndEl?.value) {
        titleText += ` — ${dateStartEl?.value || '…'} / ${dateEndEl?.value || '…'}`;
    }
    if (ordresTitleEl) ordresTitleEl.textContent = titleText;

    if (rows.length === 0) {
        omoTablesEl.innerHTML = '';
        const noDataEl = document.createElement('p');
        noDataEl.className = 'fact-meta-line';
        noDataEl.style.cssText = 'color:var(--text-secondary);font-style:italic;margin-top:0.75rem;';
        noDataEl.textContent = t('factNoDataSelection');
        omoTablesEl.appendChild(noDataEl);
        renderOMOMeta([], config, client);
        return;
    }

    omoTablesEl.innerHTML = '';
    {
        const esc    = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const nl2br  = s => esc(s).replace(/\\n|\n/g,'<br>');
        const projectIds = [...new Set(rows.map(r => r.project).filter(Boolean))];
        const mkBlank    = () => { const p = document.createElement('p'); p.className = 'fact-meta-line'; p.innerHTML = '&nbsp;'; return p; };

        projectIds.forEach((pid, index) => {
            if (index > 0) {
                omoTablesEl.appendChild(mkBlank());
                omoTablesEl.appendChild(mkBlank());
            }
            const projectRows = rows.filter(r => r.project === pid);
            const projConf    = customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid));

            const introText = projConf?.OMO_intro?.trim();
            if (introText) {
                const introEl = document.createElement('p');
                introEl.className = 'fact-meta-line';
                introEl.innerHTML = nl2br(introText);
                omoTablesEl.appendChild(introEl);
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'table-container fact-project-table';
            const table  = document.createElement('table');
            table.appendChild(document.createElement('thead'));
            table.appendChild(document.createElement('tbody'));
            wrapper.appendChild(table);
            omoTablesEl.appendChild(wrapper);
            renderBillingSummary(projectRows, tForLang(factClientLang, 'factColRate'), factClientLang, projectCostCalc, customerName, table);

            const obsText = projConf?.OMO_observations?.trim();
            if (obsText) {
                const obsEl = document.createElement('p');
                obsEl.className = 'fact-meta-line';
                obsEl.innerHTML = nl2br(obsText);
                omoTablesEl.appendChild(obsEl);
            }
        });
    }

    const mkBlankOuter = () => { const p = document.createElement('p'); p.className = 'fact-meta-line'; p.innerHTML = '&nbsp;'; return p; };
    omoTablesEl.appendChild(mkBlankOuter());
    omoTablesEl.appendChild(mkBlankOuter());
    const totalsLabelEl = document.createElement('p');
    totalsLabelEl.className = 'fact-meta-line';
    totalsLabelEl.innerHTML = `<strong>${tForLang(factClientLang, 'factTotalsLabel')}</strong>`;
    omoTablesEl.appendChild(totalsLabelEl);

    const totalWrapper = document.createElement('div');
    totalWrapper.className = 'table-container fact-project-table';
    const totalTable = document.createElement('table');
    totalTable.appendChild(document.createElement('thead'));
    totalTable.appendChild(document.createElement('tbody'));
    totalWrapper.appendChild(totalTable);
    omoTablesEl.appendChild(totalWrapper);
    renderBillingSummary(rows, tForLang(factClientLang, 'factColRate'), factClientLang, projectCostCalc, customerName, totalTable, true);

    renderOMOMeta(rows, config, client);
}

function renderOMOMeta(rows, config, clientId) {
    const beforeEl   = document.getElementById('fact-omo-meta-before');
    const sendTextEl = document.getElementById('fact-omo-send-text');
    const afterEl    = document.getElementById('fact-omo-meta-after');
    if (!beforeEl) return;

    const norm  = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
    const esc   = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const customerEntry = config.customers?.find(c => norm(c.customer_id) === norm(clientId));
    const customerName  = customerEntry?.customer_name || clientId;
    const visibleProjectIds = [...new Set(rows.map(r => r.project).filter(Boolean))];

    const customerMailsOMO = customerEntry?.list_mails_OMO?.trim() || '';
    const uniqueMails = customerMailsOMO
        ? [...new Set(customerMailsOMO.split(',').map(s => s.trim()).filter(Boolean))]
        : [];
    const navisionCodes = [];
    visibleProjectIds.forEach(pid => {
        const projConf = customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid));
        const nav = projConf?.project_navision_code?.trim();
        if (nav) navisionCodes.push(nav);
    });

    let infoHtml = '';
    infoHtml += `<p class="fact-meta-line"><strong>${t('factLblClient')}:</strong> ${esc(customerName)}</p>`;
    if (uniqueMails.length > 0)
        infoHtml += `<p class="fact-meta-line"><strong>${t('factOMOMailList')}</strong> ${esc(uniqueMails.join('; '))}</p>`;
    if (navisionCodes.length > 0)
        infoHtml += `<p class="fact-meta-line"><strong>${t('factValidationNavision')}</strong> ${esc(navisionCodes.join(', '))}</p>`;
    beforeEl.innerHTML = `<div class="fact-validation-config-box">
        <p class="fact-validation-config-box-title">${t('factOMOConfigTitle')} ${esc(customerName)}</p>
        ${infoHtml}
    </div>`;

    if (rows.length === 0) {
        if (sendTextEl) sendTextEl.innerHTML = '';
        if (afterEl)    afterEl.innerHTML    = '';
        return;
    }

    const dateStart = document.getElementById('fact-filter-date-start')?.value || '';
    const dateEnd   = document.getElementById('fact-filter-date-end')?.value   || '';
    const dateRange = (dateStart || dateEnd) ? ` - ${dateStart} / ${dateEnd}` : '';

    let sendHtml = '';
    sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    const tl = key => tForLang(factClientLang, key);
    sendHtml += `<p class="fact-meta-line"><strong>${tl('factTitleOrdres')} - ${esc(customerName)}${dateRange}</strong></p>`;

    const projectTotals = {};
    rows.forEach(r => {
        const pk = r.project || '-';
        if (!projectTotals[pk]) projectTotals[pk] = { hours: 0, amount: 0 };
        projectTotals[pk].hours  += r.hours || 0;
        projectTotals[pk].amount += r._importedCalculated || 0;
    });
    sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
    sendHtml += `<p class="fact-meta-line">${tl('factMetaProjectsHeader')}</p>`;
    visibleProjectIds.forEach(pid => {
        const totals   = projectTotals[pid] || { hours: 0, amount: 0 };
        const projConf = customerEntry?.projects?.find(p => norm(p.project_id) === norm(pid));
        const isDays   = projConf?.cost_calculation === 'days';
        const isFixed  = projConf?.cost_calculation === 'fixed';
        const hpd      = projConf?.hours_per_day || 8;
        const qty      = isDays
            ? `${fmt2(totals.hours / hpd)} ${tl('factMetaDays')}`
            : `${fmt2(totals.hours)} ${tl('factMetaHours')}`;
        const effectiveAmount = isFixed ? (projConf?.cost_fixed || 0) : totals.amount;
        const navision = projConf?.project_navision_code?.trim()
            ? ` (${esc(projConf.project_navision_code.trim())})`
            : '';
        sendHtml += `<p class="fact-meta-line">- ${esc(pid)}${navision}: ${qty} - ${fmt2(effectiveAmount)} €</p>`;
    });

    const monthSet = new Set();
    rows.forEach(r => {
        if (!r.date) return;
        const parts = r.date.split('/');
        if (parts.length < 3) return;
        monthSet.add(`${parts[2]}-${parts[1].padStart(2, '0')}`);
    });
    const monthKeys  = [...monthSet].sort();
    const monthNames = tl('months');
    const monthsStr  = monthKeys
        .map(k => {
            const [yr, mo] = k.split('-');
            return `${monthNames[parseInt(mo, 10) - 1]} ${tl('factMetaMonthOf')} ${yr}`;
        })
        .join(', ');
    if (monthKeys.length > 0) {
        sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
        sendHtml += `<p class="fact-meta-line">&nbsp;</p>`;
        sendHtml += `<p class="fact-meta-line"><strong>${tl('factMetaBreakdownIntro')} ${monthsStr}.</strong></p>`;
    }

    if (sendTextEl) sendTextEl.innerHTML = sendHtml;
    if (afterEl)    afterEl.innerHTML    = '';
}

function printOMO() {
    const titleEl    = document.getElementById('fact-ordres-title');
    const beforeEl   = document.getElementById('fact-omo-meta-before');
    const sendTextEl = document.getElementById('fact-omo-send-text');
    const billingEl  = document.getElementById('fact-omo-tables');
    const afterEl    = document.getElementById('fact-omo-meta-after');
    if (!billingEl) return;

    const sendTextOnly = document.getElementById('fact-check-omo-send-text')?.checked ?? false;
    const base  = window.location.href.replace(/[^/]*$/, '');
    const title = `${tForLang(factClientLang, 'factTitleOrdres')} — ${titleEl?.textContent?.trim() || ''}`;
    const theme = document.body.className;

    const headerEl     = document.querySelector('#fact-panel-ordres .fact-panel-header');
    const headerHtml   = sendTextOnly ? '' : (headerEl?.outerHTML || '');

    const metaHtml = sendTextOnly
        ? (sendTextEl?.innerHTML || '')
        : headerHtml + (beforeEl?.innerHTML || '') + (sendTextEl?.innerHTML || '');

    const html = `<!DOCTYPE html>
<html lang="${document.documentElement.lang}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<base href="${base}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://unpkg.com/@phosphor-icons/web"><\/script>
<link rel="stylesheet" href="css/main.css">
<style>
  body { padding: 2rem 2.5rem; overflow: visible; height: auto; }
  @media print { body { padding: 0; } }
  .table-container { overflow: visible; max-height: none; height: auto; box-shadow: none; }
  .fact-content-scroll { overflow: visible; }
</style>
</head>
<body class="${theme} print-report">
<p class="fact-meta-line" style="font-size:1.1rem;font-weight:600;margin-bottom:1.25rem;padding-bottom:0.5rem;border-bottom:2px solid var(--accent-color);">${title}</p>
${metaHtml}
${billingEl.innerHTML}
${afterEl?.innerHTML || ''}
</body>
</html>`;

    const tab = window.open('', '_blank');
    if (tab) {
        tab.document.write(html);
        tab.document.close();
    }
}

async function mailOMO() {
    const titleEl    = document.getElementById('fact-ordres-title');
    const sendTextEl = document.getElementById('fact-omo-send-text');
    const billingEl  = document.getElementById('fact-omo-tables');
    const afterEl    = document.getElementById('fact-omo-meta-after');
    if (!billingEl) return;

    const subject  = `${tForLang(factClientLang, 'factTitleOrdres')} — ${titleEl?.textContent?.trim() || ''}`;
    const bodyHtml = (sendTextEl?.innerHTML || '') + billingEl.innerHTML + (afterEl?.innerHTML || '');
    const body     = htmlToPlainText(bodyHtml);

    await copyHtmlToClipboard(bodyHtml);

    const clientSelect  = document.getElementById('fact-filter-clients');
    const projectSelect = document.getElementById('fact-filter-projects');
    const client = clientSelect?.options[clientSelect?.selectedIndex]?.value || '';
    let to = '';
    if (client) {
        const config = await loadConfig();
        const norm = s => s?.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') ?? '';
        const customerEntry = config.customers?.find(c => norm(c.customer_id) === norm(client));
        const selectedProjects = projectSelect ? Array.from(projectSelect.selectedOptions).map(o => o.value) : [];
        const visibleProjects  = selectedProjects.length > 0 ? selectedProjects
            : [...new Set(state.currentData.filter(r => (r.client || '?') === client).map(r => r.project).filter(Boolean))];
        const customerMailsOMO = customerEntry?.list_mails_OMO?.trim() || '';
        to = [...new Set(customerMailsOMO.split(',').map(s => s.trim()).filter(Boolean))].join(',');
    }

    const mailClient = localStorage.getItem('moga_mail_client') || 'desktop';
    if (mailClient === 'web') {
        window.open(`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else {
        window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
}

async function copyValidacio() {
    const btn = document.getElementById('fact-btn-copy-validacio');
    const sendTextOnly = document.getElementById('fact-check-send-text')?.checked ?? false;
    const beforeEl   = document.getElementById('fact-validation-meta-before');
    const sendTextEl = document.getElementById('fact-validation-send-text');
    const billingEl  = document.getElementById('fact-billing-tables');
    const afterEl    = document.getElementById('fact-validation-meta-after');
    const headerEl   = document.querySelector('#fact-panel-validacio .fact-panel-header');
    
    if (!billingEl) return;
    
    let html = '';
    if (sendTextOnly) {
        html = (sendTextEl?.innerHTML || '') + 
               billingEl.innerHTML + 
               (afterEl?.innerHTML || '');
    } else {
        html = (headerEl?.outerHTML || '') +
               (beforeEl?.innerHTML || '') + 
               (sendTextEl?.innerHTML || '') + 
               billingEl.innerHTML + 
               (afterEl?.innerHTML || '');
    }
    
    await copyHtmlToClipboard(html);
    showCopyFeedback(btn);
}

async function copyOMO() {
    const btn = document.getElementById('fact-btn-copy-omo');
    const sendTextOnly = document.getElementById('fact-check-omo-send-text')?.checked ?? false;
    const beforeEl   = document.getElementById('fact-omo-meta-before');
    const sendTextEl = document.getElementById('fact-omo-send-text');
    const billingEl  = document.getElementById('fact-omo-tables');
    const afterEl    = document.getElementById('fact-omo-meta-after');
    const headerEl   = document.querySelector('#fact-panel-ordres .fact-panel-header');
    
    if (!billingEl) return;
    
    let html = '';
    if (sendTextOnly) {
        html = (sendTextEl?.innerHTML || '') + 
               billingEl.innerHTML + 
               (afterEl?.innerHTML || '');
    } else {
        html = (headerEl?.outerHTML || '') +
               (beforeEl?.innerHTML || '') + 
               (sendTextEl?.innerHTML || '') + 
               billingEl.innerHTML + 
               (afterEl?.innerHTML || '');
    }
    
    await copyHtmlToClipboard(html);
    showCopyFeedback(btn);
}

function showCopyFeedback(btn) {
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    const prevIconClass = icon ? icon.className : '';
    const prevText = span ? span.textContent : '';
    
    if (icon) icon.className = 'ph ph-check';
    if (span) span.textContent = tForLang(factClientLang, 'msgCopied') || 'Copiat!';
    btn.style.borderColor = 'var(--success-color)';
    btn.style.color = 'var(--success-color)';
    
    setTimeout(() => {
        if (icon) icon.className = prevIconClass;
        if (span) span.textContent = prevText;
        btn.style.borderColor = '';
        btn.style.color = '';
    }, 1500);
}

function updateSendTextOnlyUI(isOMO) {
    const checkId = isOMO ? 'fact-check-omo-send-text' : 'fact-check-send-text';
    const checkEl = document.getElementById(checkId);
    const panelId = isOMO ? 'fact-panel-ordres' : 'fact-panel-validacio';
    const panelEl = document.getElementById(panelId);
    
    const copyBtnId = isOMO ? 'fact-btn-copy-omo' : 'fact-btn-copy-validacio';
    const copyBtn = document.getElementById(copyBtnId);
    
    const printBtnId = isOMO ? 'fact-btn-print-omo' : 'fact-btn-print-validacio';
    const printBtn = document.getElementById(printBtnId);

    if (!checkEl) return;
    const active = checkEl.checked;
    
    if (panelEl) {
        if (active) {
            panelEl.classList.add('fact-send-text-only-active');
        } else {
            panelEl.classList.remove('fact-send-text-only-active');
        }
    }
    
    if (copyBtn) {
        const icon = copyBtn.querySelector('i');
        const span = copyBtn.querySelector('span');
        if (active) {
            if (icon) icon.className = 'ph ph-text-aa';
            if (span) span.textContent = tForLang(factClientLang, 'btnCopyText') || 'Copiar text';
        } else {
            if (icon) icon.className = 'ph ph-copy';
            if (span) span.textContent = tForLang(factClientLang, 'btnCopy') || 'Copiar';
        }
    }

    if (printBtn) {
        const span = printBtn.querySelector('span');
        if (active) {
            if (span) span.textContent = tForLang(factClientLang, 'btnPrintText') || 'Imprimir text';
        } else {
            if (span) span.textContent = tForLang(factClientLang, 'btnPrint') || 'Imprimir Informe';
        }
    }
}

function syncToolbarTexts() {
    updateSendTextOnlyUI(false);
    updateSendTextOnlyUI(true);
}
