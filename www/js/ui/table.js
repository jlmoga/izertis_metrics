// =============================================================================
// TABLE — Renderitzat de les taules d'imputacions i absències
// =============================================================================

import { state } from '../state.js';
import { t, tForLang } from '../config/i18n.js';
import { formatCurrency, isRejectedStatus } from '../utils.js';
import { getConflictAbsenceKeys } from './overtime.js';

// Set de claus user|dateStart|dateEnd de les absències que originen conflicte de jornada.
// Es deriva de getConflicts (mateixa lògica que la taula de conflictes) perquè el marcatge
// en vermell del desglós coincideixi exactament amb els conflictes mostrats.
let absConflictKeys = new Set();

function buildAbsConflictKeys() {
    absConflictKeys = getConflictAbsenceKeys();
}

const tableBody = document.getElementById('tableBody');
const absTableBody = document.getElementById('absTableBody');
const absTableFoot = document.getElementById('absTableFoot');

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


export function renderBillingSummary(data, rateHeader, lang, projectCostCalc = {}, customerName = null, tableEl = null, totalsOnly = false) {
    const summaryTable = tableEl ?? document.getElementById('summaryTable');
    const summaryBody  = summaryTable?.querySelector('tbody');
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

    // Com aggregate però exclou els amounts de projectes amb cost fix
    const aggregateEffective = (rows, fixedPids) => {
        const map = Object.fromEntries(monthKeys.map(k => [k, { hours: 0, amount: 0 }]));
        rows.forEach(r => {
            if (!r.date) return;
            const p = r.date.split('/');
            if (p.length < 3) return;
            const k = `${p[2]}-${p[1].padStart(2, '0')}`;
            if (map[k]) {
                map[k].hours += r.hours || 0;
                if (!fixedPids.has(r.project)) map[k].amount += r._importedCalculated || 0;
            }
        });
        return map;
    };

    // isFixed=true: suprimeix amounts mensuals; totalA=null: mostra '-' a la cel·la de total
    const monthlyCells = (map, totalH, totalA, isDays = false, hoursPerDay = 8, isFixed = false) => {
        let html = '';
        monthKeys.forEach(k => {
            const d = map[k];
            html += `<td class="number-col">${d.hours > 0 ? d.hours.toFixed(2) + 'h' : '-'}</td>`;
            if (hasDays) {
                const j = isDays && d.hours > 0 ? (d.hours / hoursPerDay).toFixed(2) : '-';
                html += `<td class="number-col">${j}</td>`;
            }
            html += `<td class="number-col highlight-col month-group-end">${!isFixed && d.amount > 0 ? formatCurrency(d.amount) : '-'}</td>`;
        });
        html += `<td class="number-col summary-total-cell"><strong>${totalH.toFixed(2)}h</strong></td>`;
        if (hasDays) {
            const totalJ = isDays ? `<strong>${(totalH / hoursPerDay).toFixed(2)}</strong>` : '-';
            html += `<td class="number-col summary-total-cell">${totalJ}</td>`;
        }
        html += `<td class="number-col highlight-col summary-total-cell"><strong>${totalA != null ? formatCurrency(totalA) : '-'}</strong></td>`;
        return html;
    };

    // Jerarquia: client → projecte → (tècnic + tarifa)
    const clientOrder = [];
    const clientMap   = {};
    data.forEach(r => {
        const ck  = r.client  || '-';
        const pk  = r.project || '-';

        if (!clientMap[ck]) {
            clientMap[ck] = { hours: 0, amount: 0, rows: [], projects: {}, projectOrder: [] };
            clientOrder.push(ck);
        }
        clientMap[ck].hours  += r.hours || 0;
        clientMap[ck].amount += r._importedCalculated || 0;
        clientMap[ck].rows.push(r);

        const cp = clientMap[ck].projects;
        if (!cp[pk]) {
            cp[pk] = { hours: 0, amount: 0, rows: [] };
            clientMap[ck].projectOrder.push(pk);
        }
        cp[pk].hours  += r.hours || 0;
        cp[pk].amount += r._importedCalculated || 0;
        cp[pk].rows.push(r);
    });

    clientOrder.sort((a, b) => clientMap[b].hours - clientMap[a].hours);

    // Precalcula amounts efectius per a clients amb projectes de cost fix
    clientOrder.forEach(ck => {
        const c = clientMap[ck];
        const fixedPids = new Set(c.projectOrder.filter(pk => projectCostCalc[pk]?.cost === 'fixed'));
        c.fixedPids = fixedPids;
        c.effectiveAmount = c.projectOrder.reduce((sum, pk) => {
            const projInfo = projectCostCalc[pk] || { cost: 'hours', fixedAmount: 0 };
            const p = c.projects[pk];
            return sum + (projInfo.cost === 'fixed' ? (projInfo.fixedAmount || 0) : p.amount);
        }, 0);
    });

    summaryBody.innerHTML = '';
    let counter = 0;

    clientOrder.forEach(ck => {
        const c        = clientMap[ck];
        const clientId = `sum-${counter++}`;
        const cMap     = c.fixedPids.size > 0 ? aggregateEffective(c.rows, c.fixedPids) : aggregate(c.rows);

        const clientRow = document.createElement('tr');
        clientRow.className = 'group-header-row group-level-1';
        clientRow.dataset.groupId = clientId;
        clientRow.innerHTML = `
            <td><i class="ph ph-caret-up toggle-icon group-toggle-icon"></i><strong>${customerName || ck}</strong></td>
            <td class="number-col"></td>
            ${monthlyCells(cMap, c.hours, c.effectiveAmount)}`;
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

            const projInfo      = projectCostCalc[pk] || { cost: 'hours', hpd: 8, navision: '', fixedAmount: 0 };
            const isDays        = projInfo.cost === 'days';
            const isFixed       = projInfo.cost === 'fixed';
            const hoursPerDay   = projInfo.hpd;
            const navisionTag   = projInfo.navision ? ` <span class="project-navision">(${projInfo.navision})</span>` : '';
            const projAmount    = isFixed ? (projInfo.fixedAmount || 0) : p.amount;
            const projectRow = document.createElement('tr');
            projectRow.className = 'group-header-row group-level-2';
            projectRow.dataset.groupId    = projectId;
            projectRow.dataset.parentGroup = clientId;
            if (totalsOnly) {
                projectRow.innerHTML = `
                    <td style="padding-left:1.6rem">${pk}${navisionTag}</td>
                    <td class="number-col"></td>
                    ${monthlyCells(pMap, p.hours, projAmount, isDays, hoursPerDay, isFixed)}`;
            } else {
                projectRow.innerHTML = `
                    <td style="padding-left:1.6rem"><i class="ph ph-caret-up toggle-icon group-toggle-icon"></i>${pk}${navisionTag}</td>
                    <td class="number-col"></td>
                    ${monthlyCells(pMap, p.hours, projAmount, isDays, hoursPerDay, isFixed)}`;
                projectRow.addEventListener('click', () => {
                    const collapsed = projectRow.classList.toggle('collapsed');
                    setDescendantsDisplay(projectId, collapsed ? 'none' : '', summaryBody);
                });
            }
            summaryBody.appendChild(projectRow);

            if (totalsOnly) return;

            // Renderitza les files de tècnic (agrupades per tècnic+tarifa) sota un grup pare
            const renderUsers = (rows, parentId, indent) => {
                const users = {}, order = [];
                rows.forEach(r => {
                    const uk = r.user || '-', rt = r.rate || 0, urk = `${uk}\x00${rt}`;
                    if (!users[urk]) { users[urk] = { user: uk, rate: rt, hours: 0, amount: 0, rows: [] }; order.push(urk); }
                    users[urk].hours  += r.hours || 0;
                    users[urk].amount += r._importedCalculated || 0;
                    users[urk].rows.push(r);
                });
                order.sort((a, b) => users[b].hours - users[a].hours);
                order.forEach(urk => {
                    const u = users[urk];
                    const userRow = document.createElement('tr');
                    userRow.dataset.parentGroup = parentId;
                    userRow.innerHTML = `
                        <td style="padding-left:${indent}">${u.user}</td>
                        <td class="number-col">${isFixed ? '-' : fmt2(u.rate) + ' €/h'}</td>
                        ${monthlyCells(aggregate(u.rows), u.hours, isFixed ? null : u.amount, isDays, hoursPerDay, isFixed)}`;
                    summaryBody.appendChild(userRow);
                });
            };

            // Si el projecte té més d'una tasca informada al període, afegeix un nivell de
            // desglós per tasca (projecte → tasca → tècnic); si no, tècnics directes.
            const distinctTasks = new Set(p.rows.map(r => r.task).filter(Boolean));
            if (distinctTasks.size > 1) {
                const taskMap = {}, taskOrder = [];
                p.rows.forEach(r => {
                    const tk = r.task || '-';
                    if (!taskMap[tk]) { taskMap[tk] = { hours: 0, amount: 0, rows: [] }; taskOrder.push(tk); }
                    taskMap[tk].hours  += r.hours || 0;
                    taskMap[tk].amount += r._importedCalculated || 0;
                    taskMap[tk].rows.push(r);
                });
                taskOrder.sort((a, b) => taskMap[b].hours - taskMap[a].hours);
                taskOrder.forEach(tk => {
                    const tsk    = taskMap[tk];
                    const taskId = `sum-${counter++}`;
                    const taskRow = document.createElement('tr');
                    taskRow.className = 'group-header-row group-level-3';
                    taskRow.dataset.groupId     = taskId;
                    taskRow.dataset.parentGroup = projectId;
                    taskRow.innerHTML = `
                        <td style="padding-left:3.2rem"><i class="ph ph-caret-up toggle-icon group-toggle-icon"></i>${tk}</td>
                        <td class="number-col"></td>
                        ${monthlyCells(aggregate(tsk.rows), tsk.hours, isFixed ? null : tsk.amount, isDays, hoursPerDay, isFixed)}`;
                    taskRow.addEventListener('click', () => {
                        const collapsed = taskRow.classList.toggle('collapsed');
                        setDescendantsDisplay(taskId, collapsed ? 'none' : '', summaryBody);
                    });
                    summaryBody.appendChild(taskRow);
                    renderUsers(tsk.rows, taskId, '4.8rem');
                });
            } else {
                renderUsers(p.rows, projectId, '3.2rem');
            }
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
    const rejected = isRejectedStatus(row.status);
    const isConflict = !rejected && absConflictKeys.has(`${row.user}|${row.dateStart}|${row.dateEnd}`);
    const conflictIcon = isConflict
        ? `<i class="ph ph-warning-circle" style="color:var(--danger-color);margin-left:5px" title="${t('lblAbsConflictWarning')}"></i>`
        : '';
    const tr = document.createElement('tr');
    if (rejected) tr.classList.add('abs-rejected-row');
    else if (isConflict) tr.classList.add('abs-conflict-row');
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

function renderAbsFoot(data) {
    if (!absTableFoot) return;
    absTableFoot.innerHTML = '';
    if (!data || data.length === 0) return;

    let totalDays = 0;
    let totalHours = 0;
    data.forEach(row => {
        totalDays += parseFloat(row.days) || 0;
        totalHours += row.hours || 0;
    });

    const trFoot = document.createElement('tr');
    trFoot.style.fontWeight = 'bold';
    trFoot.style.borderTop = '2px solid var(--border-color)';
    trFoot.style.background = 'var(--table-header-bg)';
    trFoot.innerHTML = `
        <td colspan="5" style="text-align:right; font-weight:600; padding: 0.65rem 1rem;">Total:</td>
        <td class="number-col" style="font-weight:700; padding: 0.65rem 1rem;">${Number.isInteger(totalDays) ? totalDays : totalDays.toFixed(2)}</td>
        <td class="number-col" style="font-weight:700; padding: 0.65rem 1rem;">${totalHours.toFixed(2)}h</td>
        <td style="padding: 0.65rem 1rem;"></td>
    `;
    absTableFoot.appendChild(trFoot);
}

export function renderGroupedAbsTable(data, groupByArray, startCollapsed = false) {
    if (!absTableBody) return;
    buildAbsConflictKeys();
    absTableBody.innerHTML = '';
    renderAbsFoot(data);
    renderAbsLevel(data, groupByArray, 1, absTableBody, null, { n: 0 });
    if (startCollapsed) {
        absTableBody.querySelectorAll('.group-header-row').forEach(h => h.classList.add('collapsed'));
        absTableBody.querySelectorAll('tr:not(.group-level-1)').forEach(el => { el.style.display = 'none'; });
    }
}

export function renderAbsTable(data) {
    buildAbsConflictKeys();
    absTableBody.innerHTML = '';
    renderAbsFoot(data);
    data.forEach(row => absTableBody.appendChild(renderAbsDataRow(row, null)));
}
