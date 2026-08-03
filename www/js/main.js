// =============================================================================
// MAIN — Punt d'entrada: inicialització i cablejat d'events
//
// Ordre d'inicialització:
//   1. Tema (body.className) — abans que res per evitar flash
//   2. i18n (traduccions i idioma)
//   3. Modal de configuració
//   4. Navegació entre pantalles
//   5. Handlers de càrrega de fitxers
//   6. Handlers d'ordenació i filtres
//   7. Botons d'impressió i reset
//   8. Recuperació de dades guardades (IndexedDB)
// =============================================================================

import { applyTranslations, currentLang, setLang } from './config/i18n.js';
import { initTheme, setTheme } from './config/theme.js';
import { getFromDB } from './services/db.js';
import { state } from './state.js';
import { normalizeName } from './utils.js';
import { setupNavigation } from './ui/navigation.js';
import { setupSidebarMode } from './ui/sidebar.js';
import { setupAppLauncher } from './ui/appLauncher.js';
import { setupCollapsibleSections } from './ui/collapsible.js';
import { setupUploadHandlers } from './ui/upload.js';
import { applyFilters, applyAbsFilters, setupFilterHandlers, setupAbsFilterHandlers, setupFilterToggles, setupGroupingHandlers, setupAbsGroupingHandlers, setupExportXlsx, setupExportAbsXlsx, initDefaultDates, ensureDateRangeCoversData } from './ui/filters.js';
import { setupImpSortHandlers, setupAbsSortHandlers } from './ui/sort.js';
import { renderTable } from './ui/table.js';
import { updateChart, updateOvertimeTypeChart, updateOvertimeByUserChart } from './ui/charts.js';
import { renderOvertimeTable, setupOvertimeSortHandlers, setupOvertimeTypeFilterHandlers } from './ui/overtime.js';
import { updateHomeDashboard, setupEvoExport } from './ui/home.js';
import { generatePrintReport } from './ui/print.js';
import { setupFacturacio } from './ui/facturacio.js';
import { injectSectionHeaders } from './ui/appHeader.js';

// 0. Header parcial (async, no bloqueja la resta d'inicialització)
injectSectionHeaders();

// 1. Tema
const themeSelect = document.getElementById('theme-select');
initTheme(themeSelect);

// 2. i18n
const langSelect = document.getElementById('lang-select');
if (langSelect) langSelect.value = currentLang;
applyTranslations();

// 3. Modal de configuració
const settingsModal = document.getElementById('settings-modal');
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnCloseSettings2 = document.getElementById('btn-close-settings-2');

const closeModal = () => settingsModal.classList.add('hidden-modal');
btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden-modal'));
btnCloseSettings.addEventListener('click', closeModal);
btnCloseSettings2.addEventListener('click', closeModal);
settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeModal(); });

// Canvi de tema
if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
        if (state.currentData.length > 0) updateChart(state.filteredData);
    });
}

// Client de correu
const mailClientSelect = document.getElementById('mail-client-select');
if (mailClientSelect) {
    mailClientSelect.value = localStorage.getItem('moga_mail_client') || 'desktop';
    mailClientSelect.addEventListener('change', (e) => {
        localStorage.setItem('moga_mail_client', e.target.value);
    });
}

// Canvi d'idioma
if (langSelect) {
    langSelect.addEventListener('change', async (e) => {
        setLang(e.target.value);
        applyTranslations();
        await updateHomeDashboard();
        if (state.currentData.length > 0) {
            renderTable(state.filteredData);
            updateChart(state.filteredData);
        }
    });
}

// 4. Navegació i mode de sidebar
setupSidebarMode();
setupAppLauncher();
setupCollapsibleSections();
setupFacturacio();
const { btnGoImputacions, btnGoAbsencies } = setupNavigation();

// 5. Càrrega de fitxers (input + drag & drop)
const { folderInputImp, folderInputAbs } = setupUploadHandlers();

// 6. Ordenació i filtres
initDefaultDates();
setupImpSortHandlers();
setupAbsSortHandlers();
setupOvertimeSortHandlers();
setupOvertimeTypeFilterHandlers();
setupFilterHandlers();
setupAbsFilterHandlers();
setupFilterToggles();
setupGroupingHandlers();
setupAbsGroupingHandlers();
setupExportXlsx();
setupExportAbsXlsx();
setupEvoExport();

// 7. Impressió
const btnPrintImp = document.getElementById('btn-print-imp');
const btnPrintAbs = document.getElementById('btn-print-abs');
if (btnPrintImp) btnPrintImp.addEventListener('click', () => generatePrintReport('imp'));
if (btnPrintAbs) btnPrintAbs.addEventListener('click', () => generatePrintReport('abs'));

// Botons de reset de dades (obren la pantalla de càrrega directament)
const btnResetData = document.getElementById('btn-reset-data');
const btnResetAbsData = document.getElementById('btn-reset-abs-data');
if (btnResetData) btnResetData.addEventListener('click', () => { closeModal(); btnGoImputacions.click(); folderInputImp.click(); });
if (btnResetAbsData) btnResetAbsData.addEventListener('click', () => { closeModal(); btnGoAbsencies.click(); folderInputAbs.click(); });

// 8. Recuperar dades guardades de l'última sessió
try {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden-modal');

    const savedData = await getFromDB('imputacions_data');
    const savedAbsData = await getFromDB('absencies_data');

    if (savedAbsData && savedAbsData.length > 0) {
        state.absData = savedAbsData.map(r => ({ ...r, user: normalizeName(r.user) }));
        ensureDateRangeCoversData('abs');
        applyAbsFilters();
        document.getElementById('upload-absencies').classList.add('hidden');
        document.getElementById('absencies-results-section').classList.remove('hidden');
        document.getElementById('filters-absencies').classList.remove('hidden');
    }

    if (savedData && savedData.length > 0) {
        state.currentData = savedData.map(r => ({ ...r, user: normalizeName(r.user) }));
        ensureDateRangeCoversData('imp');
        applyFilters();
        document.getElementById('upload-imputacions').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
    }

    await updateHomeDashboard();
    renderOvertimeTable();
    updateOvertimeTypeChart();
    updateOvertimeByUserChart();

    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.classList.add('hidden-modal');
    }, 800);

} catch (err) {
    console.warn('No saved data or db error:', err);
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden-modal');
}
