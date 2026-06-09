// =============================================================================
// TABLE — Renderitzat de les taules d'imputacions i absències
// =============================================================================

import { state } from '../state.js';
import { t, tForLang } from '../config/i18n.js';
import { formatCurrency, isDateInRange } from '../utils.js';

// Set precalculat de claus user|dateStart|dateEnd per a files d'absència amb conflicte
let absConflictKeys = new Set();

function buildAbsConflictKeys(absData) {
    absConflictKeys = new Set();
    if (!state.currentData.length) return;
    const impDates = {};
    state.currentData.forEach(r => {
        if (!r.user || !r.date) return;
        if (!impDates[r.user]) impDates[r.user] = [];
        impDates[r.user].push(r.date);
    });
    absData.forEach(row => {
        const dates = impDates[row.user];
        if (dates && dates.some(d => isDateInRange(d, row.dateStart, row.dateEnd))) {
            absConflictKeys.add(`${row.user}|${row.dateStart}|${row.dateEnd}`);
        }
    });
}

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
            <td class="number-col">${row.hours.toFixed(2)}h</td>
        `;
        tableBody.appendChild(tr);
    });
}

function setDescendantsDisplay(groupId, display, tbody) {
    tbody.querySelectorAll(`[data-parent-group="${groupId}"]`).forEach(el => {
        el.style.display = display;
        if (el.dataset.groupId) {
            if (display === 'none' || !el.classList.contains('collapsed')) {
                setDescendantsDisplay(el.dataset.groupId, display, tbody);
            }
        }
    });
}

function groupRows(rows, groupBy) {
    const order = [];
    const map = {};
    rows.forEach(r => {
        const key = groupBy === 'project'
            ? `${r.project || '-'}|||${r.client || '-'}`
            : (r[groupBy] || '-');
        if (!map[key]) {
            map[key] = {
                label: groupBy === 'project'
                    ? `${r.project || '-'} · ${r.client || '-'}`
                    : (r[groupBy] || '-'),
                rows: [], hours: 0, amount: 0
            };
            order.push(key);
        }
        map[key].rows.push(r);
        map[key].hours  += r.hours || 0;
        map[key].amount += r._importedCalculated || 0;
    });
    order.sort((a, b) =>
        groupBy === 'date' ? a.localeCompare(b) : map[b].hours - map[a].hours
    );
    return order.map(k => map[k]);
}

function renderDataRow(row, parentGroupId) {
    const hasAbsence = state.absData.some(abs => abs.user === row.user && abs.dateStart === row.date);
    const isBillableBadge = row.isBillable
        ? `<span class="badge badge-yes">${t('badgeYes')}</span>`
        : `<span class="badge badge-no">${t('badgeNo')}</span>`;
    const absenceWarning = hasAbsence
        ? `<i class="ph ph-warning-circle" style="color:var(--danger-color);margin-left:5px" title="${t('lblOvertimeWarning')}"></i>`
        : '';
    const tr = document.createElement('tr');
    tr.dataset.parentGroup = parentGroupId;
    tr.innerHTML = `
        <td>${row.date || '-'}</td>
        <td>${row.user || '-'}${absenceWarning}</td>
        <td>${row.client || '-'}</td>
        <td>${row.project || '-'}</td>
        <td>${row.task || '-'}</td>
        <td>${isBillableBadge}</td>
        <td class="number-col">${row.hours.toFixed(2)}h</td>
    `;
    return tr;
}

function renderLevel(rows, groupByArray, level, tbody, parentGroupId, counter) {
    const groupBy = groupByArray[0];
    const remaining = groupByArray.slice(1);
    const indent = `${0.6 + (level - 1) * 1.4}rem`;

    groupRows(rows, groupBy).forEach(g => {
        const groupId = `grp-${counter.n++}`;

        const headerRow = document.createElement('tr');
        headerRow.className = `group-header-row group-level-${level}`;
        headerRow.dataset.groupId = groupId;
        if (parentGroupId) headerRow.dataset.parentGroup = parentGroupId;
        headerRow.innerHTML = `<td colspan="9" style="padding-left:${indent}">
            <i class="ph ph-caret-up toggle-icon group-toggle-icon"></i>
            <strong>${g.label}</strong>
            <span class="group-summary">${g.rows.length} ${t('lblImputacions')} &nbsp;·&nbsp; ${g.hours.toFixed(2)}h &nbsp;·&nbsp; ${formatCurrency(g.amount)}</span>
        </td>`;
        headerRow.addEventListener('click', () => {
            const collapsed = headerRow.classList.toggle('collapsed');
            setDescendantsDisplay(groupId, collapsed ? 'none' : '', tbody);
        });
        tbody.appendChild(headerRow);

        if (remaining.length > 0) {
            renderLevel(g.rows, remaining, level + 1, tbody, groupId, counter);
        } else {
            g.rows.forEach(row => tbody.appendChild(renderDataRow(row, groupId)));
        }
    });
}

export function renderGroupedTable(data, groupByArray, startCollapsed = false) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    renderLevel(data, groupByArray, 1, tableBody, null, { n: 0 });
    if (startCollapsed) {
        tableBody.querySelectorAll('.group-header-row').forEach(h => h.classList.add('collapsed'));
        tableBody.querySelectorAll('tr:not(.group-level-1)').forEach(el => { el.style.display = 'none'; });
    }
}


export function renderBillingSummary(data, rateHeader, lang, projectCostCalc = {}, customerName = null) {
    const summaryTable = document.getElementById('summaryTable');
    const summaryBody  = document.getElementById('summaryBody');
    if (!summaryTable || !summaryBody) return;

    const tl    = (key) => tForLang(lang, key);
    const fmt2  = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const hasDays = Object.values(projectCostCalc).some(v => v.cost === 'days');

    // Mesos presents a les dades
    const monthSet = new Set();
    data.forEach(r => {
        if (!r.date) return;
        const p = r.date.split('/');
        if (p.length < 3) return;
        monthSet.add(`${p[2]}-${p[1].padStart(2, '0')}`);
    });
    const monthKeys   = [...monthSet].sort();
    const monthLabels = tl('months');
    const monthMeta   = monthKeys.map(k => {
        const [yr, mo] = k.split('-');
        return { key: k, label: `${monthLabels[parseInt(mo, 10) - 1]} ${yr}` };
    });

    // Capçalera: entitat | tarifa | mesos... | total
    const colSpan = hasDays ? 3 : 2;
    const thead = summaryTable.querySelector('thead');
    let r1 = `<th rowspan="2" class="summary-entity-header">${tl('summaryColEntity')}</th>`;
    r1 += `<th rowspan="2" class="summary-entity-header number-col">${rateHeader}</th>`;
    monthMeta.forEach(m => { r1 += `<th colspan="${colSpan}" class="summary-month-header">${m.label}</th>`; });
    r1 += `<th colspan="${colSpan}" class="summary-total-header">Total</th>`;

    let r2 = '';
    for (let i = 0; i <= monthKeys.length; i++) {
        const isTotal = i === monthKeys.length;
        r2 += `<th class="number-col summary-sub-header${isTotal ? ' summary-total-sub' : ''}">${tl('summaryColHours')}</th>`;
        if (hasDays) r2 += `<th class="number-col summary-sub-header${isTotal ? ' summary-total-sub' : ''}">${tl('factColDays')}</th>`;
        r2 += `<th class="number-col highlight-col summary-sub-header${isTotal ? ' summary-total-sub' : ''} month-group-end">${tl('summaryColAmount')}</th>`;
    }
    thead.innerHTML = `<tr>${r1}</tr><tr>${r2}</tr>`;

    // Agrega files per mes
    const aggregate = (rows) => {
        const map = Object.fromEntries(monthKeys.map(k => [k, { hours: 0, amount: 0 }]));
        rows.forEach(r => {
            if (!r.date) return;
            const p = r.date.split('/');
            if (p.length < 3) return;
            const k = `${p[2]}-${p[1].padStart(2, '0')}`;
            if (map[k]) { map[k].hours += r.hours || 0; map[k].amount += r._importedCalculated || 0; }
        });
        return map;
    };

    const monthlyCells = (map, totalH, totalA, isDays = false, hoursPerDay = 8) => {
        let html = '';
        monthKeys.forEach(k => {
            const d = map[k];
            html += `<td class="number-col">${d.hours > 0 ? d.hours.toFixed(2) + 'h' : '-'}</td>`;
            if (hasDays) {
                const j = isDays && d.hours > 0 ? (d.hours / hoursPerDay).toFixed(2) : '-';
                html += `<td class="number-col">${j}</td>`;
            }
            html += `<td class="number-col highlight-col month-group-end">${d.amount > 0 ? formatCurrency(d.amount) : '-'}</td>`;
        });
        html += `<td class="number-col summary-total-cell"><strong>${totalH.toFixed(2)}h</strong></td>`;
        if (hasDays) {
            const totalJ = isDays ? `<strong>${(totalH / hoursPerDay).toFixed(2)}</strong>` : '-';
            html += `<td class="number-col summary-total-cell">${totalJ}</td>`;
        }
        html += `<td class="number-col highlight-col summary-total-cell"><strong>${formatCurrency(totalA)}</strong></td>`;
        return html;
    };

    // Jerarquia: client → projecte → (tècnic + tarifa)
    const clientOrder = [];
    const clientMap   = {};
    data.forEach(r => {
        const ck  = r.client  || '-';
        const pk  = r.project || '-';
        const uk  = r.user    || '-';
        const rt  = r.rate    || 0;
        const urk = `${uk}\x00${rt}`;

        if (!clientMap[ck]) {
            clientMap[ck] = { hours: 0, amount: 0, rows: [], projects: {}, projectOrder: [] };
            clientOrder.push(ck);
        }
        clientMap[ck].hours  += r.hours || 0;
        clientMap[ck].amount += r._importedCalculated || 0;
        clientMap[ck].rows.push(r);

        const cp = clientMap[ck].projects;
        if (!cp[pk]) {
            cp[pk] = { hours: 0, amount: 0, rows: [], users: {}, userOrder: [] };
            clientMap[ck].projectOrder.push(pk);
        }
        cp[pk].hours  += r.hours || 0;
        cp[pk].amount += r._importedCalculated || 0;
        cp[pk].rows.push(r);

        if (!cp[pk].users[urk]) {
            cp[pk].users[urk] = { user: uk, rate: rt, hours: 0, amount: 0, rows: [] };
            cp[pk].userOrder.push(urk);
        }
        cp[pk].users[urk].hours  += r.hours || 0;
        cp[pk].users[urk].amount += r._importedCalculated || 0;
        cp[pk].users[urk].rows.push(r);
    });

    clientOrder.sort((a, b) => clientMap[b].hours - clientMap[a].hours);

    summaryBody.innerHTML = '';
    let counter = 0;

    clientOrder.forEach(ck => {
        const c        = clientMap[ck];
        const clientId = `sum-${counter++}`;
        const cMap     = aggregate(c.rows);

        const clientRow = document.createElement('tr');
        clientRow.className = 'group-header-row group-level-1';
        clientRow.dataset.groupId = clientId;
        clientRow.innerHTML = `
            <td><i class="ph ph-caret-up toggle-icon group-toggle-icon"></i><strong>${customerName || ck}</strong></td>
            <td class="number-col"></td>
            ${monthlyCells(cMap, c.hours, c.amount)}`;
        clientRow.addEventListener('click', () => {
            const collapsed = clientRow.classList.toggle('collapsed');
            setDescendantsDisplay(clientId, collapsed ? 'none' : '', summaryBody);
        });
        summaryBody.appendChild(clientRow);

        c.projectOrder.sort((a, b) => c.projects[b].hours - c.projects[a].hours);
        c.projectOrder.forEach(pk => {
            const p         = c.projects[pk];
            const projectId = `sum-${counter++}`;
            const pMap      = aggregate(p.rows);

            const projInfo   = projectCostCalc[pk] || { cost: 'hours', hpd: 8 };
            const isDays     = projInfo.cost === 'days';
            const hoursPerDay = projInfo.hpd;
            const projectRow = document.createElement('tr');
            projectRow.className = 'group-header-row group-level-2';
            projectRow.dataset.groupId    = projectId;
            projectRow.dataset.parentGroup = clientId;
            projectRow.innerHTML = `
                <td style="padding-left:1.6rem"><i class="ph ph-caret-up toggle-icon group-toggle-icon"></i>${pk}</td>
                <td class="number-col"></td>
                ${monthlyCells(pMap, p.hours, p.amount, isDays, hoursPerDay)}`;
            projectRow.addEventListener('click', () => {
                const collapsed = projectRow.classList.toggle('collapsed');
                setDescendantsDisplay(projectId, collapsed ? 'none' : '', summaryBody);
            });
            summaryBody.appendChild(projectRow);

            p.userOrder.sort((a, b) => p.users[b].hours - p.users[a].hours);
            p.userOrder.forEach(urk => {
                const u       = p.users[urk];
                const uMap    = aggregate(u.rows);
                const userRow = document.createElement('tr');
                userRow.dataset.parentGroup = projectId;
                userRow.innerHTML = `
                    <td style="padding-left:3.2rem">${u.user}</td>
                    <td class="number-col">${fmt2(u.rate)} €/h</td>
                    ${monthlyCells(uMap, u.hours, u.amount, isDays, hoursPerDay)}`;
                summaryBody.appendChild(userRow);
            });
        });
    });
}

function groupAbsRows(rows, groupBy) {
    const order = [];
    const map = {};
    rows.forEach(r => {
        const key = r[groupBy] || '-';
        if (!map[key]) {
            map[key] = { label: key, rows: [], days: 0, hours: 0 };
            order.push(key);
        }
        map[key].rows.push(r);
        map[key].days  += parseFloat(r.days) || 0;
        map[key].hours += r.hours || 0;
    });
    order.sort((a, b) =>
        groupBy === 'dateStart' ? a.localeCompare(b) : map[b].hours - map[a].hours
    );
    return order.map(k => map[k]);
}

function renderAbsDataRow(row, parentGroupId) {
    const isConflict = absConflictKeys.has(`${row.user}|${row.dateStart}|${row.dateEnd}`);
    const conflictIcon = isConflict
        ? `<i class="ph ph-warning-circle" style="color:var(--danger-color);margin-left:5px" title="${t('lblAbsConflictWarning')}"></i>`
        : '';
    const tr = document.createElement('tr');
    if (isConflict) tr.classList.add('abs-conflict-row');
    if (parentGroupId) tr.dataset.parentGroup = parentGroupId;
    tr.innerHTML = `
        <td>${row.user || '-'}${conflictIcon}</td>
        <td>${row.type || '-'}</td>
        <td>${row.status || '-'}</td>
        <td>${row.dateStart || '-'}</td>
        <td>${row.dateEnd || '-'}</td>
        <td class="number-col">${row.days || '0'}</td>
        <td class="number-col">${(row.hours || 0).toFixed(2)}h</td>
        <td>${row.approver || '-'}</td>
    `;
    return tr;
}

function renderAbsLevel(rows, groupByArray, level, tbody, parentGroupId, counter) {
    const groupBy = groupByArray[0];
    const remaining = groupByArray.slice(1);
    const indent = `${0.6 + (level - 1) * 1.4}rem`;

    groupAbsRows(rows, groupBy).forEach(g => {
        const groupId = `absgrp-${counter.n++}`;

        const headerRow = document.createElement('tr');
        headerRow.className = `group-header-row group-level-${level}`;
        headerRow.dataset.groupId = groupId;
        if (parentGroupId) headerRow.dataset.parentGroup = parentGroupId;
        headerRow.innerHTML = `<td colspan="8" style="padding-left:${indent}">
            <i class="ph ph-caret-up toggle-icon group-toggle-icon"></i>
            <strong>${g.label}</strong>
            <span class="group-summary">${g.rows.length} ${t('lblAbsencies')} &nbsp;·&nbsp; ${g.days.toFixed(2)}d &nbsp;·&nbsp; ${g.hours.toFixed(2)}h</span>
        </td>`;
        headerRow.addEventListener('click', () => {
            const collapsed = headerRow.classList.toggle('collapsed');
            setDescendantsDisplay(groupId, collapsed ? 'none' : '', tbody);
        });
        tbody.appendChild(headerRow);

        if (remaining.length > 0) {
            renderAbsLevel(g.rows, remaining, level + 1, tbody, groupId, counter);
        } else {
            g.rows.forEach(row => tbody.appendChild(renderAbsDataRow(row, groupId)));
        }
    });
}

export function renderGroupedAbsTable(data, groupByArray, startCollapsed = false) {
    if (!absTableBody) return;
    buildAbsConflictKeys(data);
    absTableBody.innerHTML = '';
    renderAbsLevel(data, groupByArray, 1, absTableBody, null, { n: 0 });
    if (startCollapsed) {
        absTableBody.querySelectorAll('.group-header-row').forEach(h => h.classList.add('collapsed'));
        absTableBody.querySelectorAll('tr:not(.group-level-1)').forEach(el => { el.style.display = 'none'; });
    }
}

export function renderAbsTable(data) {
    buildAbsConflictKeys(data);
    absTableBody.innerHTML = '';
    data.forEach(row => absTableBody.appendChild(renderAbsDataRow(row, null)));
}
