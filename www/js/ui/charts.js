// =============================================================================
// CHARTS — Gràfics Chart.js: facturables, evolució d'hores/import, absències
// =============================================================================

import { state } from '../state.js';
import { t, currentLang } from '../config/i18n.js';
import { parseDateToTime } from '../utils.js';

export function updateChart(data) {
    let billable = 0;
    let nonBillable = 0;
    const monthlyData = {};

    data.forEach(row => {
        if (row.isBillable) billable += row.hours;
        else nonBillable += row.hours;

        const time = parseDateToTime(row.date);
        if (time > 0) {
            const dateObj = new Date(time);
            const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[key]) {
                const localeTag = currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-GB' : 'ca-ES';
                monthlyData[key] = {
                    label: dateObj.toLocaleDateString(localeTag, { month: 'short', year: 'numeric' }),
                    totalHours: 0,
                    totalImport: 0
                };
            }
            monthlyData[key].totalHours += row.hours;
            monthlyData[key].totalImport += (row._importedCalculated || 0);
        }
    });

    const sortedKeys = Object.keys(monthlyData).sort();
    const labelsMonthly = [], dataHoursMonthly = [], dataImportMonthly = [];
    sortedKeys.forEach(k => {
        labelsMonthly.push(monthlyData[k].label);
        dataHoursMonthly.push(monthlyData[k].totalHours.toFixed(2));
        dataImportMonthly.push(monthlyData[k].totalImport.toFixed(2));
    });

    const isLight = document.body.classList.contains('theme-light');
    const dColor = isLight ? '#202020' : '#F8F8F8';
    const dGridLines = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    const lblBillable = `${t('chartBillable')} (${billable.toFixed(2)}${t('chartHoursUnit')})`;
    const lblNonBillable = `${t('chartNonBillable')} (${nonBillable.toFixed(2)}${t('chartHoursUnit')})`;

    // --- Gràfic circular: facturables vs no facturables ---
    if (state.hoursChart) {
        state.hoursChart.data.datasets[0].data = [billable, nonBillable];
        state.hoursChart.data.labels = [lblBillable, lblNonBillable];
        state.hoursChart.options.plugins.title.text = t('chartTitleHours');
        state.hoursChart.options.plugins.title.color = dColor;
        state.hoursChart.options.plugins.legend.labels.color = dColor;
        state.hoursChart.update();
    } else {
        Chart.defaults.font.family = 'Inter';
        state.hoursChart = new Chart(document.getElementById('hoursChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [lblBillable, lblNonBillable],
                datasets: [{ data: [billable, nonBillable], backgroundColor: ['#6b8434', '#84346b'], borderWidth: 0, hoverOffset: 4 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: dColor } },
                    title: { display: true, text: t('chartTitleHours'), color: dColor, font: { size: 14 } },
                    tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed + ' ' + t('chartHoursUnit') } }
                }
            }
        });
    }

    // --- Línia: evolució d'hores ---
    if (state.trendHoursChart) {
        state.trendHoursChart.data.labels = labelsMonthly;
        state.trendHoursChart.data.datasets[0].data = dataHoursMonthly;
        state.trendHoursChart.data.datasets[0].label = t('chartLabelTotalHours');
        state.trendHoursChart.options.plugins.title.text = t('chartTitleEvolHours');
        state.trendHoursChart.options.plugins.title.color = dColor;
        state.trendHoursChart.options.scales.x.ticks.color = dColor;
        state.trendHoursChart.options.scales.y.ticks.color = dColor;
        state.trendHoursChart.options.scales.x.grid.color = dGridLines;
        state.trendHoursChart.options.scales.y.grid.color = dGridLines;
        state.trendHoursChart.update();
    } else {
        state.trendHoursChart = new Chart(document.getElementById('trendHoursChart').getContext('2d'), {
            type: 'line',
            data: { labels: labelsMonthly, datasets: [{ label: t('chartLabelTotalHours'), data: dataHoursMonthly, borderColor: '#346B84', backgroundColor: 'rgba(52,107,132,0.2)', fill: true, tension: 0.3 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, title: { display: true, text: t('chartTitleEvolHours'), color: dColor, font: { size: 14 } } },
                scales: { y: { beginAtZero: true, grid: { color: dGridLines }, ticks: { color: dColor } }, x: { grid: { color: dGridLines }, ticks: { color: dColor } } }
            }
        });
    }

    // --- Línia: evolució de facturació ---
    if (state.trendImportChart) {
        state.trendImportChart.data.labels = labelsMonthly;
        state.trendImportChart.data.datasets[0].data = dataImportMonthly;
        state.trendImportChart.data.datasets[0].label = t('chartLabelFacturat');
        state.trendImportChart.options.plugins.title.text = t('chartTitleEvolImport');
        state.trendImportChart.options.plugins.title.color = dColor;
        state.trendImportChart.options.scales.x.ticks.color = dColor;
        state.trendImportChart.options.scales.y.ticks.color = dColor;
        state.trendImportChart.options.scales.x.grid.color = dGridLines;
        state.trendImportChart.options.scales.y.grid.color = dGridLines;
        state.trendImportChart.update();
    } else {
        state.trendImportChart = new Chart(document.getElementById('trendImportChart').getContext('2d'), {
            type: 'line',
            data: { labels: labelsMonthly, datasets: [{ label: t('chartLabelFacturat'), data: dataImportMonthly, borderColor: '#6b8434', backgroundColor: 'rgba(107,132,52,0.2)', fill: true, tension: 0.3 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, title: { display: true, text: t('chartTitleEvolImport'), color: dColor, font: { size: 14 } } },
                scales: { y: { beginAtZero: true, grid: { color: dGridLines }, ticks: { color: dColor } }, x: { grid: { color: dGridLines }, ticks: { color: dColor } } }
            }
        });
    }
}

export function createAbsBarChart(ctx, labels, values, total, title) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: title, data: values, backgroundColor: ['#73EDFF', '#FF7675', '#55EFC4', '#FAB1A0', '#A29BFE', '#FDCB6E'], borderRadius: 6, borderWidth: 0 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            layout: { padding: { right: 50, left: 10, top: 10, bottom: 10 } },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F8F8F8', font: { size: 9 } } },
                y: { grid: { display: false }, ticks: { color: '#F8F8F8', font: { size: 9 } } }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: title, color: document.body.classList.contains('theme-light') ? '#202020' : '#F8F8F8', font: { size: 15, weight: '600' }, padding: { bottom: 10 } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(2)}%)` } }
            }
        }
    });
}

export function updateAbsCharts(data) {
    if (!data || data.length === 0) {
        if (state.absStatusChart) { state.absStatusChart.destroy(); state.absStatusChart = null; }
        if (state.absTypeChart) { state.absTypeChart.destroy(); state.absTypeChart = null; }
        return;
    }

    const countsStatus = {};
    data.forEach(r => countsStatus[r.status] = (countsStatus[r.status] || 0) + 1);
    if (state.absStatusChart) state.absStatusChart.destroy();
    state.absStatusChart = createAbsBarChart(
        document.getElementById('absStatusChart').getContext('2d'),
        Object.keys(countsStatus), Object.values(countsStatus), data.length, t('chartAbsStatusTitle')
    );

    const ctxTypeCanvas = document.getElementById('absTypeChart');
    if (ctxTypeCanvas) {
        const countsType = {};
        data.forEach(r => countsType[r.type] = (countsType[r.type] || 0) + 1);
        if (state.absTypeChart) state.absTypeChart.destroy();
        state.absTypeChart = createAbsBarChart(
            ctxTypeCanvas.getContext('2d'),
            Object.keys(countsType), Object.values(countsType), data.length, t('chartAbsTypeTitle')
        );
    }
}
