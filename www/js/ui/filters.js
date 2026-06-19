// =============================================================================
// FILTERS — Filtrat de dades d'imputacions i absències
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';
import { parseDateToTime, formatCurrency, absNameKey, buildUserClientMap } from '../utils.js';
import { sortData, sortAbsData } from './sort.js';
import { renderTable, renderAbsTable, renderGroupedTable, renderGroupedAbsTable } from './table.js';
import { updateChart, updateAbsCharts } from './charts.js';
import { renderOvertimeTable, getConflicts, getClientAllowedUsers } from './overtime.js';
import { updateHomeDashboard } from './home.js';

// --- DOM refs imputacions ---
const filterDateStart = document.getElementById('filter-date-start');
const filterDateEnd = document.getElementById('filter-date-end');
const filterClients = document.getElementById('filter-clients');
const filterProjects = document.getElementById('filter-projects');
const filterTasks = document.getElementById('filter-tasks');
const filterUsers = document.getElementById('filter-users');
const filtersSection = document.getElementById('filters-section');
const totalRowsEl = document.getElementById('total-rows');
const totalHoursEl = document.getElementById('total-hours');

// --- DOM refs navegador de mes (imputacions) ---
const impMonthNav = document.getElementById('imp-month-nav');
const btnImpMonthPrev = document.getElementById('btn-imp-month-prev');
const btnImpMonthNext = document.getElementById('btn-imp-month-next');

// --- DOM refs navegador de mes (absències) ---
const absMonthNav = document.getElementById('abs-month-nav');
const btnAbsMonthPrev = document.getElementById('btn-abs-month-prev');
const btnAbsMonthNext = document.getElementById('btn-abs-month-next');

// --- DOM refs absències ---
const filterAbsDateStart = document.getElementById('filter-abs-date-start');
const filterAbsDateEnd = document.getElementById('filter-abs-date-end');
const filterAbsUsers = document.getElementById('filter-abs-users');
const filterAbsStatus = document.getElementById('filter-abs-status');
const filterAbsClients = document.getElementById('filter-abs-clients');
const absTotalRequestsEl = document.getElementById('abs-total-requests');
const absTotalDaysEl = document.getElementById('abs-total-days');
const absPendingEl = document.getElementById('abs-pending');

const toYMD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Guard per evitar bucles de sincronització entre pestanyes
let syncingFilters = false;

// Propaga dates i client des d'imputacions o absències cap a les altres dues pestanyes.
// Facturació accepta un únic client, per tant s'hi aplica sempre el primer seleccionat.
function syncDatesAndClients(fromTab) {
    const factStart    = document.getElementById('fact-filter-date-start');
    const factEnd      = document.getElementById('fact-filter-date-end');
    const factMonthNav = document.getElementById('fact-month-nav');
    const factClients  = document.getElementById('fact-filter-clients');

    if (fromTab === 'imp') {
        const s = filterDateStart?.value ?? '';
        const e = filterDateEnd?.value   ?? '';
        if (filterAbsDateStart) filterAbsDateStart.value = s;
        if (filterAbsDateEnd)   filterAbsDateEnd.value   = e;
        if (factStart)          factStart.value           = s;
        if (factEnd)            factEnd.value             = e;
        if (absMonthNav)  absMonthNav.value  = impMonthNav?.value ?? '';
        if (factMonthNav) factMonthNav.value = impMonthNav?.value ?? '';
        const selClients = Array.from(filterClients?.selectedOptions ?? []).map(o => o.value).filter(v => v !== 'ALL');
        if (filterAbsClients) {
            Array.from(filterAbsClients.options).forEach(o => {
                o.selected = selClients.length > 0 ? selClients.includes(o.value) : o.value === 'ALL';
            });
        }
        if (factClients && selClients.length > 0) {
            Array.from(factClients.options).forEach(o => { o.selected = o.value === selClients[0]; });
        }
    } else {
        const s = filterAbsDateStart?.value ?? '';
        const e = filterAbsDateEnd?.value   ?? '';
        if (filterDateStart) filterDateStart.value = s;
        if (filterDateEnd)   filterDateEnd.value   = e;
        if (factStart)       factStart.value        = s;
        if (factEnd)         factEnd.value          = e;
        if (impMonthNav)  impMonthNav.value  = absMonthNav?.value ?? '';
        if (factMonthNav) factMonthNav.value = absMonthNav?.value ?? '';
        const selClients = filterAbsClients
            ? Array.from(filterAbsClients.selectedOptions).map(o => o.value).filter(v => v !== 'ALL')
            : [];
        if (filterClients) {
            Array.from(filterClients.options).forEach(o => {
                o.selected = selClients.length > 0 ? selClients.includes(o.value) : o.value === 'ALL';
            });
        }
        if (factClients && selClients.length > 0) {
            Array.from(factClients.options).forEach(o => { o.selected = o.value === selClients[0]; });
        }
    }
    document.dispatchEvent(new CustomEvent('fact:render'));
}

// Helper per reconstruir un <select> mantenint la selecció actual
function rebuildSelect(el, values, selectedValues) {
    el.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.textContent = t('optAll');
    if (selectedValues.includes('ALL')) optAll.selected = true;
    el.appendChild(optAll);
    values.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        if (selectedValues.includes(v)) opt.selected = true;
        el.appendChild(opt);
    });
}

export function applyFilters() {
    const pStart = filterDateStart.value ? new Date(filterDateStart.value) : null;
    const pEnd   = filterDateEnd.value   ? new Date(filterDateEnd.value)   : null;

    const startTs = pStart ? parseDateToTime(filterDateStart.value) : 0;
    const endTs = pEnd ? parseDateToTime(filterDateEnd.value) + (24 * 60 * 60 * 1000 - 1) : Infinity;

    const selectedClientsRaw = Array.from(filterClients.selectedOptions).map(o => o.value);
    const selectedClients = selectedClientsRaw.includes('ALL') ? [] : selectedClientsRaw;
    const selectedProjectsRaw = Array.from(filterProjects.selectedOptions).map(o => o.value);
    const selectedProjects = selectedProjectsRaw.includes('ALL') ? [] : selectedProjectsRaw;
    const selectedTasksRaw = Array.from(filterTasks.selectedOptions).map(o => o.value);
    const selectedTasks = selectedTasksRaw.includes('ALL') ? [] : selectedTasksRaw;
    const selectedUsersRaw = Array.from(filterUsers.selectedOptions).map(o => o.value);
    const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;

    const rowMatchesDate = (row) => {
        const rowTime = parseDateToTime(row.date);
        if (rowTime > 0) return rowTime >= startTs && rowTime <= endTs;
        return startTs === 0 && endTs === Infinity;
    };

    state.filteredData = state.currentData.filter(row => {
        if (!rowMatchesDate(row)) return false;
        if (selectedClients.length > 0 && !selectedClients.includes(row.client)) return false;
        if (selectedProjects.length > 0 && !selectedProjects.includes(row.project)) return false;
        if (selectedTasks.length > 0 && !selectedTasks.includes(row.task)) return false;
        if (selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
        return true;
    });

    // Recalcular opcions disponibles per cada filtre (excloent el propi)
    const getOptionsFor = (ignore) => state.currentData.filter(row => {
        if (!rowMatchesDate(row)) return false;
        if (ignore !== 'client' && selectedClients.length > 0 && !selectedClients.includes(row.client)) return false;
        if (ignore !== 'project' && selectedProjects.length > 0 && !selectedProjects.includes(row.project)) return false;
        if (ignore !== 'task' && selectedTasks.length > 0 && !selectedTasks.includes(row.task)) return false;
        if (ignore !== 'user' && selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
        return true;
    });

    rebuildSelect(filterClients, [...new Set(getOptionsFor('client').map(r => r.client).filter(Boolean))].sort(), selectedClients);
    rebuildSelect(filterProjects, [...new Set(getOptionsFor('project').map(r => r.project).filter(Boolean))].sort(), selectedProjects);
    rebuildSelect(filterTasks, [...new Set(getOptionsFor('task').map(r => r.task).filter(Boolean))].sort(), selectedTasks);
    rebuildSelect(filterUsers, [...new Set(getOptionsFor('user').map(r => r.user).filter(Boolean))].sort(), selectedUsers);

    totalRowsEl.textContent = state.filteredData.length;
    totalHoursEl.textContent = state.filteredData.reduce((acc, r) => acc + (r.hours || 0), 0).toFixed(2);
    filtersSection.classList.remove('hidden');

    if (state.currentGroup.length > 0) {
        renderGroupedTable(state.filteredData, state.currentGroup, state.groupStartCollapsed);
    } else {
        sortData();
        renderTable(state.filteredData);
    }
    updateChart(state.filteredData);
    renderOvertimeTable();

    if (!syncingFilters && state.absData.length > 0) {
        syncingFilters = true;
        syncDatesAndClients('imp');
        applyAbsFilters();
        syncingFilters = false;
    }
}

export function applyAbsFilters() {
    const selectedUsersRaw = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
    const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;
    const selectedStatusRaw = Array.from(filterAbsStatus.selectedOptions).map(o => o.value);
    const selectedStatus = selectedStatusRaw.includes('ALL') ? [] : selectedStatusRaw;
    const selectedAbsClientsRaw = filterAbsClients ? Array.from(filterAbsClients.selectedOptions).map(o => o.value) : [];
    const selectedAbsClients = selectedAbsClientsRaw.includes('ALL') ? [] : selectedAbsClientsRaw;
    const startDate = filterAbsDateStart.value ? parseDateToTime(filterAbsDateStart.value) : null;
    const endDate = filterAbsDateEnd.value ? parseDateToTime(filterAbsDateEnd.value) : null;

    const userClientMap = buildUserClientMap(state.currentData);
    const getAbsClient = row => userClientMap[absNameKey(row.user)] || '?';

    state.filteredAbsData = state.absData.filter(row => {
        if (selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
        if (selectedStatus.length > 0 && !selectedStatus.includes(row.status)) return false;
        if (selectedAbsClients.length > 0 && !selectedAbsClients.includes(getAbsClient(row))) return false;
        if (startDate || endDate) {
            const rowTime = parseDateToTime(row.dateStart);
            if (startDate && rowTime < startDate) return false;
            if (endDate && rowTime > endDate) return false;
        }
        return true;
    });

    // Reconstruir selectors dinàmics
    const rebuildDynamic = (selectEl, allData, field) => {
        const currentSelected = Array.from(selectEl.selectedOptions).map(o => o.value);
        const vals = [...new Set(allData.map(r => r[field]).filter(Boolean))].sort();
        rebuildSelect(selectEl, vals, currentSelected);
    };
    rebuildDynamic(filterAbsUsers, state.absData, 'user');
    rebuildDynamic(filterAbsStatus, state.absData, 'status');
    if (filterAbsClients) {
        const allAbsClients = [...new Set(state.absData.map(r => getAbsClient(r)))].sort();
        rebuildSelect(filterAbsClients, allAbsClients, selectedAbsClients);
    }

    absTotalRequestsEl.textContent = state.filteredAbsData.length;
    absTotalDaysEl.textContent = state.filteredAbsData.reduce((acc, r) => acc + (parseFloat(r.days) || 0), 0).toFixed(2);
    absPendingEl.textContent = state.filteredAbsData.filter(r =>
        ['pendent', 'pendiente', 'en espera'].some(s => r.status.toLowerCase().includes(s))
    ).length;

    if (state.currentAbsGroup.length > 0) {
        renderGroupedAbsTable(state.filteredAbsData, state.currentAbsGroup, state.absGroupStartCollapsed);
    } else {
        renderAbsTable(state.filteredAbsData);
    }
    updateAbsCharts(state.filteredAbsData);
    renderOvertimeTable();
    updateHomeDashboard();

    if (!syncingFilters && state.currentData.length > 0) {
        syncingFilters = true;
        syncDatesAndClients('abs');
        applyFilters();
        syncingFilters = false;
    }
}

export function syncFromBilling(startVal, endVal, clientName) {
    if (syncingFilters) return;
    syncingFilters = true;
    if (startVal !== null) {
        if (filterDateStart)    filterDateStart.value    = startVal;
        if (filterAbsDateStart) filterAbsDateStart.value = startVal;
        const mv = startVal ? startVal.substring(0, 7) : '';
        if (impMonthNav) impMonthNav.value = mv;
        if (absMonthNav) absMonthNav.value = mv;
    }
    if (endVal !== null) {
        if (filterDateEnd)    filterDateEnd.value    = endVal;
        if (filterAbsDateEnd) filterAbsDateEnd.value = endVal;
    }
    if (clientName != null) {
        if (filterClients) {
            Array.from(filterClients.options).forEach(opt => { opt.selected = opt.value === clientName; });
        }
        if (filterAbsClients) {
            Array.from(filterAbsClients.options).forEach(opt => { opt.selected = opt.value === clientName; });
        }
    }
    if (state.currentData.length > 0) applyFilters();
    if (state.absData.length > 0) applyAbsFilters();
    syncingFilters = false;
}

function applyMonthToRange(monthInput, startInput, endInput, applyFn) {
    if (!monthInput.value) return;
    const [year, month] = monthInput.value.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    startInput.value = toYMD(start);
    endInput.value = toYMD(end);
    applyFn();
}

function shiftMonth(monthInput, delta, startInput, endInput, applyFn) {
    let year, month;
    if (monthInput.value) {
        [year, month] = monthInput.value.split('-').map(Number);
    } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
    }
    month += delta;
    if (month > 12) { month = 1; year++; }
    if (month < 1) { month = 12; year--; }
    monthInput.value = `${year}-${String(month).padStart(2, '0')}`;
    applyMonthToRange(monthInput, startInput, endInput, applyFn);
}

export function initDefaultDates() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    const first = toYMD(new Date(y, m - 1, 1));
    const last  = toYMD(new Date(y, m, 0));

    if (filterDateStart)    filterDateStart.value    = first;
    if (filterDateEnd)      filterDateEnd.value      = last;
    if (impMonthNav)        impMonthNav.value        = ym;

    if (filterAbsDateStart) filterAbsDateStart.value = first;
    if (filterAbsDateEnd)   filterAbsDateEnd.value   = last;
    if (absMonthNav)        absMonthNav.value        = ym;

    const factStart   = document.getElementById('fact-filter-date-start');
    const factEnd     = document.getElementById('fact-filter-date-end');
    const factMonthNav = document.getElementById('fact-month-nav');
    if (factStart)    factStart.value    = first;
    if (factEnd)      factEnd.value      = last;
    if (factMonthNav) factMonthNav.value = ym;
}

export function setupFilterHandlers() {
    [filterDateStart, filterDateEnd, filterClients, filterProjects, filterTasks, filterUsers].forEach(el => {
        el.addEventListener('change', applyFilters);
    });

    if (impMonthNav) {
        impMonthNav.addEventListener('change', () => applyMonthToRange(impMonthNav, filterDateStart, filterDateEnd, applyFilters));
        btnImpMonthPrev.addEventListener('click', () => shiftMonth(impMonthNav, -1, filterDateStart, filterDateEnd, applyFilters));
        btnImpMonthNext.addEventListener('click', () => shiftMonth(impMonthNav, +1, filterDateStart, filterDateEnd, applyFilters));
    }

    const btnClearFilters = document.getElementById('btn-clear-filters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            filterDateStart.value = '';
            filterDateEnd.value = '';
            Array.from(filterClients.options).forEach(opt => opt.selected = false);
            Array.from(filterProjects.options).forEach(opt => opt.selected = false);
            Array.from(filterTasks.options).forEach(opt => opt.selected = false);
            Array.from(filterUsers.options).forEach(opt => opt.selected = false);
            applyFilters();
        });
    }
}

export function setupAbsFilterHandlers() {
    [filterAbsUsers, filterAbsStatus, filterAbsDateStart, filterAbsDateEnd, filterAbsClients].filter(Boolean).forEach(el => {
        el.addEventListener('change', applyAbsFilters);
    });

    if (absMonthNav) {
        absMonthNav.addEventListener('change', () => applyMonthToRange(absMonthNav, filterAbsDateStart, filterAbsDateEnd, applyAbsFilters));
        btnAbsMonthPrev.addEventListener('click', () => shiftMonth(absMonthNav, -1, filterAbsDateStart, filterAbsDateEnd, applyAbsFilters));
        btnAbsMonthNext.addEventListener('click', () => shiftMonth(absMonthNav, +1, filterAbsDateStart, filterAbsDateEnd, applyAbsFilters));
    }

    const btnClearAbsFilters = document.getElementById('btn-clear-abs-filters');
    if (btnClearAbsFilters) {
        btnClearAbsFilters.addEventListener('click', () => {
            Array.from(filterAbsUsers.options).forEach(opt => opt.selected = false);
            Array.from(filterAbsStatus.options).forEach(opt => opt.selected = false);
            if (filterAbsClients) Array.from(filterAbsClients.options).forEach(opt => opt.selected = false);
            filterAbsDateStart.value = '';
            filterAbsDateEnd.value = '';
            applyAbsFilters();
        });
    }
}

export function setupFilterToggles() {
    const setupToggle = (btnId, sectionId, storageKey) => {
        const btn = document.getElementById(btnId);
        const section = document.getElementById(sectionId);
        if (btn && section) {
            if (localStorage.getItem(storageKey) === 'true') section.classList.add('minimized');
            btn.addEventListener('click', () => {
                const minimized = section.classList.toggle('minimized');
                localStorage.setItem(storageKey, minimized);
            });
        }
    };
    setupToggle('btn-toggle-filters',     'filters-section',     'filters_imputacions_minimized');
    setupToggle('btn-toggle-abs-filters', 'filters-absencies',   'filters_absencies_minimized');
    setupToggle('btn-toggle-charts',      'charts-section',      'charts_imputacions_minimized');
    setupToggle('btn-toggle-abs-charts',  'abs-charts-section',  'charts_absencies_minimized');
}

export function setupGroupingHandlers() {
    const bar = document.getElementById('grouping-bar');
    if (!bar) return;

    const detailBtn      = bar.querySelector('[data-group=""]');
    const groupBtns      = [...bar.querySelectorAll('.group-btn[data-group]:not([data-group=""])')];
    const collapsedLabel = document.getElementById('group-collapsed-label');
    const collapsedChk   = document.getElementById('group-start-collapsed');

    const refresh = () => {
        const hasGroup = state.currentGroup.length > 0;
        if (detailBtn) detailBtn.classList.toggle('active', !hasGroup);
        groupBtns.forEach(b => {
            const idx = state.currentGroup.indexOf(b.dataset.group);
            b.classList.toggle('active', idx >= 0);
            if (idx >= 0) b.dataset.order = idx + 1;
            else delete b.dataset.order;
        });
        if (collapsedLabel) collapsedLabel.classList.toggle('hidden', !hasGroup);
    };

    if (detailBtn) {
        detailBtn.addEventListener('click', () => {
            state.currentGroup = [];
            refresh();
            applyFilters();
        });
    }

    groupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const g = btn.dataset.group;
            const idx = state.currentGroup.indexOf(g);
            if (idx >= 0) state.currentGroup.splice(idx, 1);
            else state.currentGroup.push(g);
            refresh();
            applyFilters();
        });
    });

    if (collapsedChk) {
        collapsedChk.addEventListener('change', () => {
            state.groupStartCollapsed = collapsedChk.checked;
            if (state.currentGroup.length > 0) applyFilters();
        });
    }
}

export function setupExportXlsx() {
    const btn = document.getElementById('btn-export-xlsx');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const data = state.filteredData;
        if (!data || data.length === 0) return;

        const yes = t('factValidationYes');
        const no  = t('factValidationNo');
        const headers = [
            t('xlsxColDate'), t('xlsxColUser'), t('xlsxColClient'),
            t('xlsxColProject'), t('xlsxColTask'), t('xlsxColBillable'), t('xlsxColHours')
        ];
        const rows = data.map(r => [
            r.date    || '',
            r.user    || '',
            r.client  || '',
            r.project || '',
            r.task    || '',
            r.isBillable ? yes : no,
            r.hours   ?? 0
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // Amplades de columna orientatives
        ws['!cols'] = [
            { wch: 12 }, { wch: 22 }, { wch: 22 },
            { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 10 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Imputacions');

        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        XLSX.writeFile(wb, `imputacions_${stamp}.xlsx`);
    });
}

export function setupExportAbsXlsx() {
    const btn = document.getElementById('btn-export-abs-xlsx');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const wb = XLSX.utils.book_new();

        // --- Full 1: Absències ---
        const absData = state.filteredAbsData;
        const absHeaders = [
            t('xlsxAbsUser'), t('xlsxAbsApprover'), t('xlsxAbsType'), t('xlsxAbsStatus'),
            t('xlsxAbsDateStart'), t('xlsxAbsDateEnd'), t('xlsxAbsDays'), t('xlsxAbsHours')
        ];
        const absRows = (absData || []).map(r => [
            r.user       || '',
            r.approver   || '',
            r.type       || '',
            r.status     || '',
            r.dateStart  || '',
            r.dateEnd    || '',
            parseFloat(r.days)  || 0,
            parseFloat(r.hours) || 0
        ]);
        const wsAbs = XLSX.utils.aoa_to_sheet([absHeaders, ...absRows]);
        wsAbs['!cols'] = [
            { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 16 },
            { wch: 12 }, { wch: 12 }, { wch: 8 },  { wch: 8 }
        ];
        XLSX.utils.book_append_sheet(wb, wsAbs, t('xlsxSheetAbs'));

        // --- Full 2: Excessos de jornada ---
        const selectedUsersRaw = Array.from(
            document.getElementById('filter-abs-users')?.selectedOptions || []
        ).map(o => o.value);
        const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;
        const startRaw = document.getElementById('filter-abs-date-start')?.value;
        const endRaw   = document.getElementById('filter-abs-date-end')?.value;
        const startTs  = startRaw ? parseDateToTime(startRaw) : null;
        const endTs    = endRaw   ? parseDateToTime(endRaw)   : null;

        const allowedUsers = getClientAllowedUsers();
        const conflicts = getConflicts(state.currentData, state.absData, selectedUsers, startTs, endTs, allowedUsers);
        const ovHeaders = [
            t('xlsxOvDate'), t('xlsxOvUser'),
            t('xlsxOvImpHours'), t('xlsxOvAbsHours'), t('xlsxOvTotal')
        ];
        const ovRows = conflicts.map(c => [
            c.date, c.user,
            parseFloat(c.impHours.toFixed(2)),
            parseFloat(c.absHours.toFixed(2)),
            parseFloat(c.totalCompute.toFixed(2))
        ]);
        const wsOv = XLSX.utils.aoa_to_sheet([ovHeaders, ...ovRows]);
        wsOv['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsOv, t('xlsxSheetOvertime'));

        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        XLSX.writeFile(wb, `absencies_${stamp}.xlsx`);
    });
}

export function setupAbsGroupingHandlers() {
    const bar = document.getElementById('abs-grouping-bar');
    if (!bar) return;

    const detailBtn      = bar.querySelector('[data-abs-group=""]');
    const groupBtns      = [...bar.querySelectorAll('.group-btn[data-abs-group]:not([data-abs-group=""])')];
    const collapsedLabel = document.getElementById('abs-group-collapsed-label');
    const collapsedChk   = document.getElementById('abs-group-start-collapsed');

    const refresh = () => {
        const hasGroup = state.currentAbsGroup.length > 0;
        if (detailBtn) detailBtn.classList.toggle('active', !hasGroup);
        groupBtns.forEach(b => {
            const idx = state.currentAbsGroup.indexOf(b.dataset.absGroup);
            b.classList.toggle('active', idx >= 0);
            if (idx >= 0) b.dataset.order = idx + 1;
            else delete b.dataset.order;
        });
        if (collapsedLabel) collapsedLabel.classList.toggle('hidden', !hasGroup);
    };

    if (detailBtn) {
        detailBtn.addEventListener('click', () => {
            state.currentAbsGroup = [];
            refresh();
            applyAbsFilters();
        });
    }

    groupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const g = btn.dataset.absGroup;
            const idx = state.currentAbsGroup.indexOf(g);
            if (idx >= 0) state.currentAbsGroup.splice(idx, 1);
            else state.currentAbsGroup.push(g);
            refresh();
            applyAbsFilters();
        });
    });

    if (collapsedChk) {
        collapsedChk.addEventListener('change', () => {
            state.absGroupStartCollapsed = collapsedChk.checked;
            if (state.currentAbsGroup.length > 0) applyAbsFilters();
        });
    }
}

