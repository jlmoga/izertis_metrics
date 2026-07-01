// =============================================================================
// PRINT — Generació de l'informe d'impressió en una nova finestra
// =============================================================================

import { state } from '../state.js';
import { t, currentLang } from '../config/i18n.js';

export function generatePrintReport(type) {
    const isAbs = type === 'abs';
    const title = isAbs ? t('btnGoAbsencies') : t('appTitle');

    const stats = isAbs
        ? {
            req:     { label: t('statTotalAbsencies'), value: document.getElementById('abs-total-requests').textContent },
            days:    { label: t('statTotalDays'),      value: document.getElementById('abs-total-days').textContent },
            pending: { label: t('statPending'),         value: document.getElementById('abs-pending').textContent }
          }
        : {
            rows:   { label: t('statRows'),   value: document.getElementById('total-rows').textContent },
            hours:  { label: t('statTotalHours'), value: document.getElementById('total-hours').textContent }
          };

    const charts = [];
    if (isAbs) {
        if (state.absStatusChart) charts.push({ label: t('chartAbsStatusTitle'), src: state.absStatusChart.toBase64Image() });
        if (state.absTypeChart)   charts.push({ label: t('chartAbsTypeTitle'),   src: state.absTypeChart.toBase64Image() });
    } else {
        if (state.hoursChart)       charts.push({ label: t('chartTitleHours'),     src: state.hoursChart.toBase64Image() });
        if (state.trendHoursChart)  charts.push({ label: t('chartTitleEvolHours'), src: state.trendHoursChart.toBase64Image() });
    }

    const tables = isAbs
        ? [
            { title: t('printDetailAbsencies'), html: document.getElementById('absencesTable').outerHTML },
            { title: t('titleOvertime'),        html: document.getElementById('overtimeTable').outerHTML }
          ]
        : [{
            title: t('printDetailImputacions'),
            html: document.getElementById('dataTable').outerHTML
          }];

    const locale = currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-GB' : 'ca-ES';

    // Filtres aplicats a la vista (apareixen sota el títol, abans dels quadres de valors).
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const fmtDate = (v) => {
        if (!v) return '';
        const [y, m, d] = v.split('-');
        return (y && m && d) ? new Date(+y, +m - 1, +d).toLocaleDateString(locale) : v;
    };
    const selVals = (id) => {
        const sel = document.getElementById(id);
        if (!sel) return t('optAll');
        const vals = Array.from(sel.selectedOptions).map(o => o.value).filter(v => v !== 'ALL');
        return vals.length ? vals.join(', ') : t('optAll');
    };
    const dStart = fmtDate(document.getElementById(isAbs ? 'filter-abs-date-start' : 'filter-date-start')?.value);
    const dEnd   = fmtDate(document.getElementById(isAbs ? 'filter-abs-date-end'   : 'filter-date-end')?.value);
    const period = (dStart || dEnd) ? `${dStart || '…'} – ${dEnd || '…'}` : t('optAll');
    const filters = isAbs
        ? [
            { label: t('printPeriod'),  value: period },
            { label: t('lblClients'),   value: selVals('filter-abs-clients') },
            { label: t('lblUsers'),     value: selVals('filter-abs-users') },
            { label: t('lblAbsStatus'), value: selVals('filter-abs-status') }
          ]
        : [
            { label: t('printPeriod'),  value: period },
            { label: t('lblClients'),   value: selVals('filter-clients') },
            { label: t('lblProjects'),  value: selVals('filter-projects') },
            { label: t('lblTasks'),     value: selVals('filter-tasks') },
            { label: t('lblUsers'),     value: selVals('filter-users') }
          ];

    const colsLayout = charts.length > 2 ? 'repeat(3, 1fr)' : '1fr 1fr';
    const colsGap    = charts.length > 2 ? '15px' : '30px';
    const tableSize  = isAbs ? '9pt' : '8pt';

    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
<style>
body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; background: #fff; }
.header { border-bottom: 3px solid #346B84; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
h1 { margin: 0; color: #346B84; font-size: 24pt; font-weight: 700; }
.filters-summary { margin-bottom: 30px; padding: 16px 20px; border: 1px solid #eee; border-radius: 12px; background: #f8f9fa; }
.filters-summary-title { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 700; }
.filters-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 30px; }
.filter-item { font-size: 10pt; }
.filter-item .filter-label { color: #666; font-weight: 600; }
.filter-item .filter-value { color: #1a1a1a; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
.stat-card { border: 1px solid #eee; padding: 20px; border-radius: 12px; background: #fff; }
.stat-title { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.stat-value { font-size: 18pt; font-weight: 700; color: #000; }
.section-title { font-size: 14pt; color: #346B84; margin-bottom: 20px; border-left: 4px solid #346B84; padding-left: 15px; font-weight: 700; margin-top: 30px; }
.charts-row { display: grid; grid-template-columns: ${colsLayout}; gap: ${colsGap}; margin-bottom: 40px; }
.chart-box { border: 1px solid #eee; padding: 20px; border-radius: 12px; text-align: center; background: #fff; }
.chart-box h3 { font-size: 11pt; margin-bottom: 15px; color: #444; font-weight: 600; }
.chart-box img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
.table-container { width: 100%; margin-top: 10px; }
table { width: 100%; border-collapse: collapse; font-size: ${tableSize}; }
th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
th { background: #f8f9fa; font-weight: 700; color: #333; text-transform: uppercase; }
tr:nth-child(even) { background: #fafafa; }
.number-col { text-align: right; }
.sort-icon, .filter-group, .group-toggle-icon { display: none; }
.highlight-col { font-weight: 600; background: #f0f4f8 !important; }
.group-header-row td { background: #346B84 !important; color: #fff !important; font-weight: 700; }
.group-header-row.group-level-2 td { background: rgba(52,107,132,0.55) !important; color: #fff !important; }
.summary-entity-header { min-width: 160px; }
.summary-month-header { text-align: center; background: #e8f0f7 !important; border-left: 1px solid #ccc; font-size: 0.9em; text-transform: none; font-weight: 700; }
.summary-total-header { text-align: center; background: #d0e4f0 !important; border-left: 2px solid #346B84; font-weight: 700; }
.summary-sub-header { font-size: 0.75em; }
.summary-total-sub { background: #e8f0f7 !important; border-left: 2px solid #346B84; }
.month-group-end { border-right: 1px solid rgba(52,107,132,0.3); }
.summary-total-cell { border-left: 2px solid #346B84; background: #f5f8fb !important; }
@media print { body { padding: 0; } .chart-box, tr, .stat-card { page-break-inside: avoid; } }
</style>
</head>
<body>
<div class="header">
    <h1>${title}</h1>
    <div style="font-size:10pt;color:#999;">${new Date().toLocaleDateString(locale)}</div>
</div>
<div class="filters-summary">
    <div class="filters-summary-title">${t('printFilters')}</div>
    <div class="filters-summary-grid">
        ${filters.map(f => `<div class="filter-item"><span class="filter-label">${esc(f.label)}:</span> <span class="filter-value">${esc(f.value)}</span></div>`).join('')}
    </div>
</div>
<div class="stats-grid">
    ${Object.values(stats).map(s => `<div class="stat-card"><div class="stat-title">${s.label}</div><div class="stat-value">${s.value}</div></div>`).join('')}
</div>
<div class="section-title">${isAbs ? t('lblAbsStatus') : t('printStats')}</div>
<div class="charts-row">
    ${charts.map(c => `<div class="chart-box"><h3>${c.label}</h3><img src="${c.src}"></div>`).join('')}
</div>
${tables.map(tb => `<div class="section-title">${tb.title}</div><div class="table-container">${tb.html}</div>`).join('')}
<script>window.onload = () => setTimeout(() => window.print(), 500);<\/script>
</body>
</html>`);
    printWin.document.close();
}
