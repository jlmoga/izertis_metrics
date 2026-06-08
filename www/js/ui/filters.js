// =============================================================================
// FILTERS — Filtrat de dades d'imputacions i absències
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';
import { parseDateToTime, formatCurrency } from '../utils.js';
import { sortData, sortAbsData } from './sort.js';
import { renderTable, renderAbsTable, renderGroupedTable, renderGroupedAbsTable, renderSummaryView } from './table.js';
import { updateChart, updateAbsCharts } from './charts.js';
import { renderOvertimeTable } from './overtime.js';
import { updateHomeDashboard } from './home.js';

// --- DOM refs imputacions ---
const filterDateStart = document.getElementById('filter-date-start');
const filterDateEnd = document.getElementById('filter-date-end');
const filterClients = document.getElementById('filter-clients');
const filterProjects = document.getElementById('filter-projects');
const filterUsers = document.getElementById('filter-users');
const filtersSection = document.getElementById('filters-section');
const totalRowsEl = document.getElementById('total-rows');
const totalHoursEl = document.getElementById('total-hours');
const totalAmountEl = document.getElementById('total-amount');

// --- DOM refs absències ---
const filterAbsDateStart = document.getElementById('filter-abs-date-start');
const filterAbsDateEnd = document.getElementById('filter-abs-date-end');
const filterAbsUsers = document.getElementById('filter-abs-users');
const filterAbsStatus = document.getElementById('filter-abs-status');
const absTotalRequestsEl = document.getElementById('abs-total-requests');
const absTotalDaysEl = document.getElementById('abs-total-days');
const absPendingEl = document.getElementById('abs-pending');

// Guard per evitar sincronitzacions recursives entre els dos filtres
let syncingFilters = false;

// Copia dates i tècnics d'un conjunt de filtres a l'altre
function syncDatesAndUsers(fromImp) {
    if (fromImp) {
        if (filterAbsDateStart) filterAbsDateStart.value = filterDateStart.value;
        if (filterAbsDateEnd)   filterAbsDateEnd.value   = filterDateEnd.value;
        const sel = Array.from(filterUsers.selectedOptions).map(o => o.value);
        Array.from(filterAbsUsers.options).forEach(opt => { opt.selected = sel.includes(opt.value); });
    } else {
        if (filterDateStart) filterDateStart.value = filterAbsDateStart.value;
        if (filterDateEnd)   filterDateEnd.value   = filterAbsDateEnd.value;
        const sel = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
        Array.from(filterUsers.options).forEach(opt => { opt.selected = sel.includes(opt.value); });
    }
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
    const SIX_MONTHS = 6;
    let pStart = filterDateStart.value ? new Date(filterDateStart.value) : null;
    let pEnd = filterDateEnd.value ? new Date(filterDateEnd.value) : null;

    // Garantia: sempre hi ha un rang de 6 mesos
    if (!pStart && !pEnd) {
        pEnd = new Date();
        pStart = new Date(pEnd);
        pStart.setMonth(pStart.getMonth() - SIX_MONTHS);
        filterDateStart.value = pStart.toISOString().split('T')[0];
        filterDateEnd.value = pEnd.toISOString().split('T')[0];
    } else if (pStart && !pEnd) {
        pEnd = new Date(pStart);
        pEnd.setMonth(pEnd.getMonth() + SIX_MONTHS);
        filterDateEnd.value = pEnd.toISOString().split('T')[0];
    } else if (!pStart && pEnd) {
        pStart = new Date(pEnd);
        pStart.setMonth(pStart.getMonth() - SIX_MONTHS);
        filterDateStart.value = pStart.toISOString().split('T')[0];
    } else {
        const diffMonths = (pEnd.getFullYear() - pStart.getFullYear()) * 12 + (pEnd.getMonth() - pStart.getMonth());
        if (diffMonths > SIX_MONTHS || (diffMonths === SIX_MONTHS && pEnd.getDate() > pStart.getDate())) {
            pEnd = new Date(pStart);
            pEnd.setMonth(pEnd.getMonth() + SIX_MONTHS);
            filterDateEnd.value = pEnd.toISOString().split('T')[0];
        }
    }

    const startTs = pStart ? parseDateToTime(filterDateStart.value) : 0;
    const endTs = pEnd ? parseDateToTime(filterDateEnd.value) + (24 * 60 * 60 * 1000 - 1) : Infinity;

    const selectedClientsRaw = Array.from(filterClients.selectedOptions).map(o => o.value);
    const selectedClients = selectedClientsRaw.includes('ALL') ? [] : selectedClientsRaw;
    const selectedProjectsRaw = Array.from(filterProjects.selectedOptions).map(o => o.value);
    const selectedProjects = selectedProjectsRaw.includes('ALL') ? [] : selectedProjectsRaw;
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
        if (selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
        return true;
    });

    // Recalcular opcions disponibles per cada filtre (excloent el propi)
    const getOptionsFor = (ignore) => state.currentData.filter(row => {
        if (!rowMatchesDate(row)) return false;
        if (ignore !== 'client' && selectedClients.length > 0 && !selectedClients.includes(row.client)) return false;
        if (ignore !== 'project' && selectedProjects.length > 0 && !selectedProjects.includes(row.project)) return false;
        if (ignore !== 'user' && selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
        return true;
    });

    rebuildSelect(filterClients, [...new Set(getOptionsFor('client').map(r => r.client).filter(Boolean))].sort(), selectedClients);
    rebuildSelect(filterProjects, [...new Set(getOptionsFor('project').map(r => r.project).filter(Boolean))].sort(), selectedProjects);
    rebuildSelect(filterUsers, [...new Set(getOptionsFor('user').map(r => r.user).filter(Boolean))].sort(), selectedUsers);

    totalRowsEl.textContent = state.filteredData.length;
    totalHoursEl.textContent = state.filteredData.reduce((acc, r) => acc + (r.hours || 0), 0).toFixed(2);
    totalAmountEl.textContent = formatCurrency(state.filteredData.reduce((acc, r) => acc + (r._importedCalculated || 0), 0));
    filtersSection.classList.remove('hidden');

    if (state.viewMode === 'summary') {
        renderSummaryView(state.filteredData);
    } else if (state.currentGroup.length > 0) {
        renderGroupedTable(state.filteredData, state.currentGroup, state.groupStartCollapsed);
    } else {
        sortData();
        renderTable(state.filteredData);
    }
    updateChart(state.filteredData);
    renderOvertimeTable();

    if (!syncingFilters && state.absData.length > 0) {
        syncingFilters = true;
        syncDatesAndUsers(true);
        applyAbsFilters();
        syncingFilters = false;
    }
}

export function applyAbsFilters() {
    const selectedUsersRaw = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
    const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;
    const selectedStatusRaw = Array.from(filterAbsStatus.selectedOptions).map(o => o.value);
    const selectedStatus = selectedStatusRaw.includes('ALL') ? [] : selectedStatusRaw;
    const startDate = filterAbsDateStart.value ? parseDateToTime(filterAbsDateStart.value) : null;
    const endDate = filterAbsDateEnd.value ? parseDateToTime(filterAbsDateEnd.value) : null;

    state.filteredAbsData = state.absData.filter(row => {
        if (selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
        if (selectedStatus.length > 0 && !selectedStatus.includes(row.status)) return false;
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
        syncDatesAndUsers(false);
        applyFilters();
        syncingFilters = false;
    }
}

export function setupFilterHandlers() {
    [filterDateStart, filterDateEnd, filterClients, filterProjects, filterUsers].forEach(el => {
        el.addEventListener('change', applyFilters);
    });

    const btnClearFilters = document.getElementById('btn-clear-filters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            filterDateStart.value = '';
            filterDateEnd.value = '';
            Array.from(filterClients.options).forEach(opt => opt.selected = false);
            Array.from(filterProjects.options).forEach(opt => opt.selected = false);
            Array.from(filterUsers.options).forEach(opt => opt.selected = false);
            applyFilters();
        });
    }
}

export function setupAbsFilterHandlers() {
    [filterAbsUsers, filterAbsStatus, filterAbsDateStart, filterAbsDateEnd].forEach(el => {
        el.addEventListener('change', applyAbsFilters);
    });

    const btnClearAbsFilters = document.getElementById('btn-clear-abs-filters');
    if (btnClearAbsFilters) {
        btnClearAbsFilters.addEventListener('click', () => {
            Array.from(filterAbsUsers.options).forEach(opt => opt.selected = false);
            Array.from(filterAbsStatus.options).forEach(opt => opt.selected = false);
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

export function setupViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const groupingBar = document.getElementById('grouping-bar');
    const impTableContainer = document.getElementById('imp-table-container');
    const summarySection = document.getElementById('summary-section');

    const applyViewMode = () => {
        const isSummary = state.viewMode === 'summary';
        viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === state.viewMode));
        if (groupingBar) groupingBar.classList.toggle('hidden', isSummary);
        if (impTableContainer) impTableContainer.classList.toggle('hidden', isSummary);
        if (summarySection) summarySection.classList.toggle('hidden', !isSummary);
    };

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.viewMode = btn.dataset.view;
            applyViewMode();
            if (state.currentData.length > 0) applyFilters();
        });
    });

    applyViewMode();
}
