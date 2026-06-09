// =============================================================================
// FACTURACIÓ — Resum facturable per client i mes
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';

const fmt2 = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function setupFacturacio() {
    const monthInput = document.getElementById('fact-month');
    const clientSelect = document.getElementById('fact-client');
    if (!monthInput || !clientSelect) return;

    const now = new Date();
    monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    monthInput.addEventListener('change', renderFactTable);
    clientSelect.addEventListener('change', renderFactTable);
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
    populateClients();
    renderFactTable();
}

function populateClients() {
    const clientSelect = document.getElementById('fact-client');
    if (!clientSelect) return;

    const prev = clientSelect.value;
    const clients = [...new Set(state.currentData.map(r => r.client || '?'))]
        .filter(c => c !== '?').sort();

    clientSelect.innerHTML = clients
        .map(c => `<option value="${c}"${c === prev ? ' selected' : ''}>${c}</option>`)
        .join('');

    if (!clients.includes(prev) && clients.length > 0) clientSelect.value = clients[0];
}

function renderFactTable() {
    const monthInput  = document.getElementById('fact-month');
    const clientSelect = document.getElementById('fact-client');
    const tbody        = document.getElementById('fact-tbody');
    const titleEl      = document.getElementById('fact-table-title');
    if (!monthInput || !clientSelect || !tbody) return;

    const monthVal = monthInput.value;
    const client   = clientSelect.value;
    if (!monthVal || !client) { tbody.innerHTML = ''; return; }

    const [year, month] = monthVal.split('-').map(Number);

    const rows = state.currentData.filter(r => {
        const d = r.date instanceof Date ? r.date : new Date(r.date);
        return (r.client || '?') === client
            && d.getFullYear() === year
            && d.getMonth() + 1 === month;
    });

    // Agrega per projecte + tècnic
    const agg = {};
    rows.forEach(r => {
        const key = `${r.project || '?'}\x00${r.user || '?'}`;
        if (!agg[key]) agg[key] = { client, project: r.project || '?', user: r.user || '?', hours: 0, amount: 0 };
        agg[key].hours  += r.hours || 0;
        agg[key].amount += r._importedCalculated || 0;
    });

    const entries = Object.values(agg).sort((a, b) =>
        a.project.localeCompare(b.project) || a.user.localeCompare(b.user));

    const monthNames = t('months');
    const monthName  = Array.isArray(monthNames) ? monthNames[month - 1] : monthVal;
    if (titleEl) titleEl.textContent = `${client} — ${monthName} ${year}`;

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="fact-no-results">${t('factNoResults')}</td></tr>`;
        return;
    }

    const totalHours  = entries.reduce((s, r) => s + r.hours, 0);
    const totalAmount = entries.reduce((s, r) => s + r.amount, 0);

    tbody.innerHTML = entries.map(r => `
        <tr>
            <td>${r.client}</td>
            <td>${r.project}</td>
            <td>${r.user}</td>
            <td class="number-col">${fmt2(r.hours)} h</td>
            <td class="number-col">${fmt2(r.amount)} €</td>
        </tr>`).join('')
        + `<tr class="fact-total-row">
            <td colspan="3">${t('factTotal')}</td>
            <td class="number-col">${fmt2(totalHours)} h</td>
            <td class="number-col">${fmt2(totalAmount)} €</td>
        </tr>`;
}
