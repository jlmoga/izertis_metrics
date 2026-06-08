// =============================================================================
// SORT — Lògica d'ordenació i configuració dels capçals de taula clicables
// =============================================================================

import { state } from '../state.js';
import { parseDateToTime } from '../utils.js';
import { renderTable, renderAbsTable } from './table.js';

export function sortData() {
    if (!state.currentSort.column) return;
    state.filteredData.sort((a, b) => {
        let valA = a[state.currentSort.column];
        let valB = b[state.currentSort.column];
        if (state.currentSort.column === 'date') {
            valA = parseDateToTime(valA);
            valB = parseDateToTime(valB);
        } else {
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
        }
        if (valA < valB) return state.currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return state.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

export function sortAbsData() {
    if (!state.currentAbsSort.column) return;
    const isDateCol = state.currentAbsSort.column === 'dateStart' || state.currentAbsSort.column === 'dateEnd';
    state.filteredAbsData.sort((a, b) => {
        let valA = a[state.currentAbsSort.column];
        let valB = b[state.currentAbsSort.column];
        if (isDateCol) {
            valA = parseDateToTime(valA);
            valB = parseDateToTime(valB);
        } else {
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
        }
        if (valA < valB) return state.currentAbsSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return state.currentAbsSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

export function setupImpSortHandlers() {
    document.querySelectorAll('#dataTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            if (state.filteredData.length === 0) return;
            const column = th.dataset.sort;
            if (state.currentSort.column === column) {
                state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
                th.classList.toggle('desc', state.currentSort.direction === 'desc');
            } else {
                document.querySelectorAll('#dataTable th.sortable').forEach(t => t.classList.remove('active', 'desc'));
                state.currentSort.column = column;
                state.currentSort.direction = 'asc';
                th.classList.add('active');
            }
            sortData();
            renderTable(state.filteredData);
        });
    });
}

export function setupAbsSortHandlers() {
    document.querySelectorAll('#absencesTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            if (state.filteredAbsData.length === 0) return;
            const column = th.dataset.sortAbs;
            if (state.currentAbsSort.column === column) {
                state.currentAbsSort.direction = state.currentAbsSort.direction === 'asc' ? 'desc' : 'asc';
                th.classList.toggle('desc', state.currentAbsSort.direction === 'desc');
            } else {
                document.querySelectorAll('#absencesTable th.sortable').forEach(t => t.classList.remove('active', 'desc'));
                state.currentAbsSort.column = column;
                state.currentAbsSort.direction = 'asc';
                th.classList.add('active');
            }
            sortAbsData();
            renderAbsTable(state.filteredAbsData);
        });
    });
}
