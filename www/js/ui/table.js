// =============================================================================
// TABLE — Renderitzat de les taules d'imputacions i absències
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';
import { formatCurrency } from '../utils.js';

const tableBody = document.getElementById('tableBody');
const absTableBody = document.getElementById('absTableBody');

export function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach(row => {
        const hasAbsence = state.absData.some(abs => abs.user === row.user && abs.dateStart === row.date);
        const isBillableBadge = row.isBillable
            ? `<span class="badge badge-yes">${t('badgeYes')}</span>`
            : `<span class="badge badge-no">${t('badgeNo')}</span>`;
        const absenceWarning = hasAbsence
            ? `<i class="ph ph-warning-circle" style="color: var(--danger-color); margin-left: 5px;" title="${t('lblOvertimeWarning')}"></i>`
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date || '-'}</td>
            <td>${row.user || '-'}${absenceWarning}</td>
            <td>${row.client || '-'}</td>
            <td>${row.project || '-'}</td>
            <td>${row.task || '-'}</td>
            <td>${isBillableBadge}</td>
            <td class="number-col">${formatCurrency(row.rate)}</td>
            <td class="number-col">${row.hours.toFixed(2)}h</td>
            <td class="number-col highlight-col">${formatCurrency(row._importedCalculated)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

export function renderAbsTable(data) {
    absTableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.user || '-'}</td>
            <td>${row.type || '-'}</td>
            <td>${row.status || '-'}</td>
            <td>${row.dateStart || '-'}</td>
            <td>${row.dateEnd || '-'}</td>
            <td class="number-col">${row.days || '0'}</td>
            <td class="number-col">${(row.hours || 0).toFixed(2)}h</td>
            <td>${row.approver || '-'}</td>
        `;
        absTableBody.appendChild(tr);
    });
}
