// Estat mutable compartit per tots els mòduls.
// Tots els mòduls importem { state } i llegim/escrivim state.xyz.
export const state = {
    currentData: [],
    filteredData: [],
    absData: [],
    filteredAbsData: [],
    currentGroup: [],
    groupStartCollapsed: false,
    currentAbsGroup: [],
    absGroupStartCollapsed: false,
    currentSort: { column: null, direction: 'asc' },
    currentAbsSort: { column: null, direction: 'asc' },
    currentOvertimeSort: { column: 'date', direction: 'desc' },
    hoursChart: null,
    trendHoursChart: null,
    absStatusChart: null,
    absTypeChart: null,
    overtimeTypeChart: null,
    overtimeUserChart: null,
};
