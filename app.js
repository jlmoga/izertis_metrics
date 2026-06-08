document.addEventListener('DOMContentLoaded', async () => {
    // ---- INTERNACIONALITZACIÓ (i18n) ----
    const translations = {
        ca: {
            appTitle: "Quadre d'Imputacions",
            homeTitle: "Quadre de facturació dels serveis de Banca Izertis",
            btnGoImputacions: "Quadre d'imputacions",
            btnGoAbsencies: "Quadre d'absències",
            selectFolderTitle: "Selecciona la carpeta",
            selectFolderDescImp: "Tria la carpeta que conté els arxius d'imputacions.",
            selectFolderDescAbs: "Tria la carpeta que conté els arxius d'absències.",
            statTotalHours: "Total Hores Imputades",
            statTotalAbsenciesHours: "Hores Absència",
            statConflicts: "Conflictes Jornada",
            titleGlobalSummary: "Situació des de l'inici",
            titleMonthlySituation: "Situació a mes de",
            titleClientSummary: "Resum per Client (últims 30 dies)",
            titleRecentAlerts: "Últims Conflictes Detectats (30 dies)",
            colAbsHours: "HORES",
            homeEmptyState: "Actualitza les dades d'imputacions i absències per poder mostrar informació de l'estat",
            btnChooseFolder: "Tria carpeta d'Excels",
            btnUpdateDataImp: "Carregar Imputacions",
            btnUpdateDataAbs: "Carregar Absències",
            filtersTitleAbs: "Filtres d'Absències",
            colAbsenceH: "MANQUEN (h)",
            lastUpdatedImp: "Imputacions",
            lastUpdatedAbs: "Absències",
            lblNoClient: "Sense Client",
            lblNoRecentData: "No hi ha dades recents (30 dies)",
            lblNoConflicts: "No s'han detectat conflictes recents",
            statTotalAbsencies: "Total Sol·licituds",
            statTotalDays: "Total Dies Absents",
            statPending: "Pendents d'Aprovació",
            colAbsUser: "SOL·LICITANT",
            colAbsType: "TIPUS",
            colAbsStatus: "ESTAT",
            colAbsDateStart: "DATA INICI",
            colAbsDateEnd: "DATA FI",
            colAbsDays: "DIES",
            colAbsApprover: "APROVADOR",
            lblAbsStatus: "Estat de Sol·licitud",
            chartAbsStatusTitle: "Estat de les absències",
            chartAbsTypeTitle: "Tipus d'absències",
            statFiles: "Total Arxius Processats",
            statRows: "Total Imputacions",
            statAmount: "Import Facturable Estimat",
            colDate: "DATA",
            colUser: "TÈCNIC",
            colClient: "CLIENT",
            colProject: "PROJECTE",
            colTask: "TASCA",
            colBillable: "FACTURABLE",
            colRate: "IMPORT HORA",
            colTotalHours: "HORES TOTALS",
            colTotalImport: "IMPORT TOTAL",
            filtersTitle: "Filtres de Dades",
            btnClearFilters: "Netejar Filtres",
            lblDateStart: "Data Inici",
            lblDateEnd: "Data Fi",
            lblClients: "Clients",
            lblProjects: "Projectes",
            lblUsers: "Tècnics",
            processing: "Processant",
            processingFiles: "arxius...",
            pleaseWait: "Si us plau, espera un moment.",
            noFilesErr: "No s'ha trobat cap arxiu .xlsx vàlid a la selecció.",
            badgeYes: "SÍ",
            badgeNo: "NO",
            chartBillable: "Facturables",
            chartNonBillable: "No Facturables",
            chartTitleHours: "Hores Imputades",
            chartTitleEvolHours: "Evolució d'Hores",
            chartTitleEvolImport: "Evolució de Facturació (€)",
            chartLabelTotalHours: "Hores Totals Imputades",
            chartLabelFacturat: "Import Facturat (€)",
            chartHoursUnit: "h",
            settingsTitle: "Configuració",
            settingsLang: "Idioma:",
            themeLabel: "Tema:",
            themeDefault: "Per defecte",
            themeLight: "Clar",
            themeDark: "Fosc",
            settingsData: "Dades:",
            btnUpdateData: "Carregar Noves Dades",
            btnClose: "Tancar",
            disclaimerMaxMonths: "* Es mostren/permeten màxim 6 mesos de dades alhora.",
            btnPrint: "Imprimir Informe",
            titleOvertime: "Excés de Jornada (Conflictes)",
            colOverImputation: "IMPUTACIÓ (h)",
            colOverAbsence: "ABSÈNCIA (h)",
            colOverTotal: "CÒMPUT DEL DIA (h)",
            loadingData: "Recuperant dades guardades...",
            months: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
            lblImputacions: "imputacions",
            lblAbsencies: "absències",
            lblOvertimeWarning: "Aquest tècnic té una absència registrada aquest dia",
            optCatalan: "Català",
            optSpanish: "Castellà",
            optAll: "(Veure tots/totes)"
        },
        es: {
            appTitle: "Cuadro de Imputaciones",
            homeTitle: "Cuadro de facturación de los servicios de Banca Izertis",
            btnGoImputacions: "Cuadro de imputaciones",
            btnGoAbsencies: "Cuadro de ausencias",
            selectFolderTitle: "Selecciona la carpeta",
            selectFolderDescImp: "Elige la carpeta que contiene los archivos de imputaciones.",
            selectFolderDescAbs: "Elige la carpeta que contiene los archivos de ausencias.",
            statTotalHours: "Total Horas Imputadas",
            statTotalAbsenciesHours: "Horas Ausencia",
            statConflicts: "Conflictos Jornada",
            titleGlobalSummary: "Situación desde el inicio",
            titleMonthlySituation: "Situación a mes de",
            titleClientSummary: "Resumen por Cliente (últims 30 dies)",
            titleRecentAlerts: "Últimos Conflictos Detectados (30 días)",
            colAbsHours: "HORAS",
            homeEmptyState: "Actualice los datos de imputaciones y ausencias para poder mostrar información del estado",
            btnChooseFolder: "Elegir carpeta de Excels",
            btnUpdateDataImp: "Cargar Imputaciones",
            btnUpdateDataAbs: "Cargar Ausencias",
            filtersTitleAbs: "Filtros de Ausencias",
            colAbsenceH: "FALTAN (h)",
            lastUpdatedImp: "Imputaciones",
            lastUpdatedAbs: "Ausencias",
            lblNoClient: "Sin Cliente",
            lblNoRecentData: "No hay datos recientes (30 días)",
            lblNoConflicts: "No se han detectado conflictos recientes",
            statTotalAbsencies: "Total Solicitudes",
            statTotalDays: "Total Días Ausentes",
            statPending: "Pendientes de Aprobación",
            colAbsUser: "SOLICITANTE",
            colAbsType: "TIPO",
            colAbsStatus: "ESTADO",
            colAbsDateStart: "FECHA INICIO",
            colAbsDateEnd: "FECHA FIN",
            colAbsDays: "DÍAS",
            colAbsApprover: "APROBADOR",
            lblAbsStatus: "Estado de Solicitud",
            chartAbsStatusTitle: "Estado de las ausencias",
            chartAbsTypeTitle: "Tipo de ausencias",
            statFiles: "Total Archivos Procesados",
            statRows: "Total Imputacions",
            statAmount: "Importe Facturable Estimado",
            colDate: "FECHA",
            colUser: "TÉCNICO",
            colClient: "CLIENTE",
            colProject: "PROYECTO",
            colTask: "TAREA",
            colBillable: "FACTURABLE",
            colRate: "IMPORTE HORA",
            colTotalHours: "HORAS TOTALES",
            colTotalImport: "IMPORTE TOTAL",
            filtersTitle: "Filtros de Datos",
            btnClearFilters: "Limpiar Filtros",
            lblDateStart: "Fecha Inicio",
            lblDateEnd: "Fecha Fin",
            lblClients: "Clientes",
            lblProjects: "Proyectos",
            lblUsers: "Técnicos",
            processing: "Procesando",
            processingFiles: "archivos...",
            pleaseWait: "Por favor, espera un momento.",
            noFilesErr: "No se ha encontrado ningún archivo .xlsx válido en la selección.",
            badgeYes: "SÍ",
            badgeNo: "NO",
            chartBillable: "Facturables",
            chartNonBillable: "No Facturables",
            chartTitleHours: "Horas Imputadas",
            chartTitleEvolHours: "Evolución de Horas",
            chartTitleEvolImport: "Evolución de Facturación (€)",
            chartLabelTotalHours: "Horas Totales Imputadas",
            chartLabelFacturat: "Importe Facturado (€)",
            chartHoursUnit: "h",
            settingsTitle: "Configuración",
            settingsLang: "Idioma:",
            themeLabel: "Tema:",
            themeDefault: "Por defecto",
            themeLight: "Claro",
            themeDark: "Oscuro",
            settingsData: "Datos:",
            btnUpdateData: "Cargar Nuevos Datos",
            btnClose: "Cerrar",
            disclaimerMaxMonths: "* Se muestran/permiten máximo 6 meses de datos a la vez.",
            btnPrint: "Imprimir Informe",
            titleOvertime: "Exceso de Jornada (Conflictos)",
            colOverImputation: "IMPUTACIÓN (h)",
            colOverAbsence: "AUSENCIA (h)",
            colOverTotal: "CÓMPUTO DEL DÍA (h)",
            loadingData: "Recuperando datos guardados...",
            months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            lblImputacions: "imputaciones",
            lblAbsencies: "ausencias",
            lblOvertimeWarning: "Este técnico tiene una ausencia registrada este día",
            optCatalan: "Catalán",
            optSpanish: "Castellano",
            optAll: "(Ver todos/todas)"
        }

    };

    let currentLang = localStorage.getItem('moga_lang');
    if (!currentLang) {
        const browserLang = navigator.language || navigator.userLanguage;
        currentLang = (browserLang && browserLang.startsWith('es')) ? 'es' : 'ca';
    }
    const t = (key) => translations[currentLang][key] || key;

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang] && translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });
        document.documentElement.lang = currentLang;
    }

    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnCloseSettings2 = document.getElementById('btn-close-settings-2');
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = currentLang;
    const themeSelect = document.getElementById('theme-select');

    // Inicialitzar Tema carregant des de LocalStorage
    const savedTheme = localStorage.getItem('moga_theme') || 'theme-light';
    const appliedTheme = (savedTheme === 'default') ? 'theme-light' : savedTheme;
    document.body.className = appliedTheme;
    if(themeSelect) themeSelect.value = appliedTheme;

    btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden-modal'));
    
    // UI Navigation logic
    const homeScreen = document.getElementById('home-screen');
    const imputacionsScreen = document.getElementById('imputacions-screen');
    const absenciesScreen = document.getElementById('absencies-screen');
    const btnGoImputacions = document.getElementById('btn-go-imputacions');
    const btnGoAbsencies = document.getElementById('btn-go-absencies');
    const btnBackHome = document.getElementById('btn-back-home');

    if (btnGoImputacions && btnGoAbsencies && btnBackHome) {
        const headerTitle = document.querySelector('header h1');
        
        btnGoImputacions.addEventListener('click', () => {
            homeScreen.classList.add('hidden');
            absenciesScreen.classList.add('hidden'); // Assegurar-nos que l'altra està oculta
            imputacionsScreen.classList.remove('hidden');
            btnBackHome.classList.remove('hidden');
            headerTitle.setAttribute('data-i18n', 'appTitle');
            applyTranslations();

            if (currentData.length === 0) {
                document.getElementById('upload-imputacions').classList.remove('hidden');
                resultsSection.classList.add('hidden');
            } else {
                document.getElementById('upload-imputacions').classList.add('hidden');
                resultsSection.classList.remove('hidden');
            }
        });

        btnGoAbsencies.addEventListener('click', () => {
            homeScreen.classList.add('hidden');
            imputacionsScreen.classList.add('hidden');
            absenciesScreen.classList.remove('hidden');
            btnBackHome.classList.remove('hidden');
            headerTitle.setAttribute('data-i18n', 'btnGoAbsencies');
            applyTranslations();

            if (absData.length === 0) {
                document.getElementById('upload-absencies').classList.remove('hidden');
                document.getElementById('absencies-results-section').classList.add('hidden');
            } else {
                document.getElementById('upload-absencies').classList.add('hidden');
                document.getElementById('absencies-results-section').classList.remove('hidden');
            }
        });

        btnBackHome.addEventListener('click', async () => {
            imputacionsScreen.classList.add('hidden');
            absenciesScreen.classList.add('hidden');
            homeScreen.classList.remove('hidden');
            btnBackHome.classList.add('hidden');
            headerTitle.setAttribute('data-i18n', 'homeTitle');
            applyTranslations();
            await updateHomeDashboard();
        });
    }

    // Funció robusta d'impressió (Crea una nova finestra amb imatges estàtiques)
    async function generatePrintReport(type) {
        const isAbs = (type === 'abs');
        const title = isAbs ? t('btnGoAbsencies') : t('appTitle');
        
        let stats = {};
        if (isAbs) {
            stats = {
                req: { label: t('statTotalAbsencies'), value: document.getElementById('abs-total-requests').textContent },
                days: { label: t('statTotalDays'), value: document.getElementById('abs-total-days').textContent },
                pending: { label: t('statPending'), value: document.getElementById('abs-pending').textContent }
            };
        } else {
            stats = {
                files: { label: t('statFiles'), value: document.getElementById('total-files').textContent },
                rows: { label: t('statRows'), value: document.getElementById('total-rows').textContent },
                amount: { label: t('statAmount'), value: document.getElementById('total-amount').textContent }
            };
        }

        const charts = [];
        if (isAbs) {
            if (absStatusChart) charts.push({ label: t('chartAbsStatusTitle'), src: absStatusChart.toBase64Image() });
            if (absTypeChart) charts.push({ label: t('chartAbsTypeTitle'), src: absTypeChart.toBase64Image() });
        } else {
            if (hoursChart) charts.push({ label: t('chartTitleHours'), src: hoursChart.toBase64Image() });
            if (trendHoursChart) charts.push({ label: t('chartTitleEvolHours'), src: trendHoursChart.toBase64Image() });
            if (trendImportChart) charts.push({ label: t('chartTitleEvolImport'), src: trendImportChart.toBase64Image() });
        }

        const tables = [];
        if (isAbs) {
            tables.push({ title: "Detall de les Sol·licituds", html: document.getElementById('absencesTable').outerHTML });
            tables.push({ title: t('titleOvertime'), html: document.getElementById('overtimeTable').outerHTML });
        } else {
            tables.push({ title: "Detall de les Imputacions", html: document.getElementById('dataTable').outerHTML });
        }

        const printWin = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html lang="${currentLang}">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; background: #fff; }
                    .header { border-bottom: 3px solid #346B84; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    h1 { margin: 0; color: #346B84; font-size: 24pt; font-weight: 700; }
                    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                    .stat-card { border: 1px solid #eee; padding: 20px; border-radius: 12px; background: #fff; }
                    .stat-title { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                    .stat-value { font-size: 18pt; font-weight: 700; color: #000; }
                    .section-title { font-size: 14pt; color: #346B84; margin-bottom: 20px; border-left: 4px solid #346B84; padding-left: 15px; font-weight: 700; margin-top: 30px; }
                    .charts-row { display: grid; grid-template-columns: ${charts.length > 2 ? 'repeat(3, 1fr)' : '1fr 1fr'}; gap: ${charts.length > 2 ? '15px' : '30px'}; margin-bottom: 40px; }
                    .chart-box { border: 1px solid #eee; padding: 20px; border-radius: 12px; text-align: center; background: #fff; }
                    .chart-box h3 { font-size: 11pt; margin-bottom: 15px; color: #444; font-weight: 600; }
                    .chart-box img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                    .table-container { width: 100%; margin-top: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: ${isAbs ? '9pt' : '8pt'}; }
                    th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
                    th { background: #f8f9fa; font-weight: 700; color: #333; text-transform: uppercase; }
                    tr:nth-child(even) { background: #fafafa; }
                    .sort-icon, .filter-group { display: none; }
                    .highlight-col { font-weight: 600; background: #f0f4f8 !important; }
                    @media print {
                        body { padding: 0; }
                        .chart-box, tr, .stat-card { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <div style="font-size: 10pt; color: #999;">${new Date().toLocaleDateString(currentLang === 'ca' ? 'ca-ES' : 'es-ES')}</div>
                </div>
                
                <div class="stats-grid">
                    ${Object.values(stats).map(s => `
                        <div class="stat-card">
                            <div class="stat-title">${s.label}</div>
                            <div class="stat-value">${s.value}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="section-title">${isAbs ? t('lblAbsStatus') : "Estadístiques i Gràfics"}</div>
                <div class="charts-row">
                    ${charts.map(c => `
                        <div class="chart-box">
                            <h3>${c.label}</h3>
                            <img src="${c.src}">
                        </div>
                    `).join('')}
                </div>

                ${tables.map(tb => `
                    <div class="section-title">${tb.title}</div>
                    <div class="table-container">
                        ${tb.html}
                    </div>
                `).join('')}

                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWin.document.write(html);
        printWin.document.close();
    }

    // Botons d'impressió
    const btnPrintImp = document.getElementById('btn-print-imp');
    const btnPrintAbs = document.getElementById('btn-print-abs');

    if (btnPrintImp) btnPrintImp.addEventListener('click', () => generatePrintReport('imp'));
    if (btnPrintAbs) btnPrintAbs.addEventListener('click', () => generatePrintReport('abs'));


    const closeModal = () => settingsModal.classList.add('hidden-modal');
    btnCloseSettings.addEventListener('click', closeModal);
    btnCloseSettings2.addEventListener('click', closeModal);
    settingsModal.addEventListener('click', (e) => {
        if(e.target === settingsModal) closeModal();
    });

    if(themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            localStorage.setItem('moga_theme', theme);
            document.body.className = theme;
            if (currentData.length > 0) {
                updateChart(filteredData);
            }
        });
    }

    langSelect.addEventListener('change', async (e) => {
        currentLang = e.target.value;
        localStorage.setItem('moga_lang', currentLang);
        applyTranslations();
        await updateHomeDashboard();
        
        if (currentData.length > 0) {
            renderTable(filteredData);
            updateChart(filteredData);
        }
    });

    // Iniciar traducció base
    applyTranslations();

    // ---- INDEXEDDB HELPER ----
    const DB_NAME = 'ImputacionsDB';
    const STORE_NAME = 'data';

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => {
                console.error("Error literal de IndexedDB:", e.target.error);
                alert("Error de base de dades: " + e.target.error.message + ". Comprova si el teu navegador té bloquejat l'emmagatzematge local.");
                reject(e.target.error);
            };
        });
    }

    function saveToDB(key, data) {
        return initDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(data, key);
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e.target.error);
            });
        });
    }

    function getFromDB(key) {
        return initDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e.target.error);
            });
        });
    }

    // Config: Botó esborrar dades
    const btnResetData = document.getElementById('btn-reset-data');
    const btnResetAbsData = document.getElementById('btn-reset-abs-data');
    
    if (btnResetData) {
        btnResetData.addEventListener('click', () => {
            closeModal();
            btnGoImputacions.click();
            folderInputImp.click();
        });
    }
    if (btnResetAbsData) {
        btnResetAbsData.addEventListener('click', () => {
            closeModal();
            btnGoAbsencies.click();
            folderInputAbs.click();
        });
    }

    // ---- LÒGICA DE FUNCIONAMENT DE L'APP ----
    const resultsSection = document.getElementById('results-section');
    const tableBody = document.getElementById('tableBody');
    const totalFilesEl = document.getElementById('total-files');
    const totalRowsEl = document.getElementById('total-rows');
    const totalAmountEl = document.getElementById('total-amount');

    // UI Absències
    const absResultsSection = document.getElementById('absencies-results-section');
    const absTotalRequestsEl = document.getElementById('abs-total-requests');
    const absTotalDaysEl = document.getElementById('abs-total-days');
    const absPendingEl = document.getElementById('abs-pending');
    const overtimeTableBody = document.getElementById('overtimeTableBody');
    const filterAbsDateStart = document.getElementById('filter-abs-date-start');
    const filterAbsDateEnd = document.getElementById('filter-abs-date-end');
    const filterAbsUsers = document.getElementById('filter-abs-users');
    const filterAbsStatus = document.getElementById('filter-abs-status');
    const btnClearAbsFilters = document.getElementById('btn-clear-abs-filters');

    const uploadImputacions = document.getElementById('upload-imputacions');
    const uploadAbsencies = document.getElementById('upload-absencies');
    const folderInputImp = document.getElementById('folderInputImp');
    const folderInputAbs = document.getElementById('folderInputAbs');
    const uploadBoxImp = document.getElementById('upload-box-imputacions');
    const uploadBoxAbs = document.getElementById('upload-box-absencies');

    let currentData = [];
    let filteredData = [];
    let absData = [];
    let filteredAbsData = [];
    let currentSort = { column: null, direction: 'asc' };
    let currentAbsSort = { column: null, direction: 'asc' };
    let hoursChart = null;
    let trendHoursChart = null;
    let trendImportChart = null;
    let absStatusChart = null;
    let absTypeChart = null;
    let currentOvertimeSort = { column: 'date', direction: 'desc' };

    const filtersSection = document.getElementById('filters-section');
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const filterClients = document.getElementById('filter-clients');
    const filterProjects = document.getElementById('filter-projects');
    const filterUsers = document.getElementById('filter-users');
    const btnClearFilters = document.getElementById('btn-clear-filters');

    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            if (filteredData.length === 0) return;
            
            const column = th.dataset.sort;
            
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                th.classList.toggle('desc', currentSort.direction === 'desc');
            } else {
                document.querySelectorAll('th.sortable').forEach(t => {
                    t.classList.remove('active', 'desc');
                });
                currentSort.column = column;
                currentSort.direction = 'asc';
                th.classList.add('active');
            }
            
            sortData();
            renderTable(filteredData);
        });
    });

    document.querySelectorAll('#absencesTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            if (filteredAbsData.length === 0) return;
            
            const column = th.dataset.sortAbs;
            
            if (currentAbsSort.column === column) {
                currentAbsSort.direction = currentAbsSort.direction === 'asc' ? 'desc' : 'asc';
                th.classList.toggle('desc', currentAbsSort.direction === 'desc');
            } else {
                document.querySelectorAll('#absencesTable th.sortable').forEach(t => {
                    t.classList.remove('active', 'desc');
                });
                currentAbsSort.column = column;
                currentAbsSort.direction = 'asc';
                th.classList.add('active');
            }
            
            sortAbsData();
            renderAbsTable(filteredAbsData);
        });
    });

    [filterDateStart, filterDateEnd, filterClients, filterProjects, filterUsers].forEach(el => {
        el.addEventListener('change', applyFilters);
    });

    btnClearFilters.addEventListener('click', () => {
        filterDateStart.value = '';
        filterDateEnd.value = '';
        Array.from(filterClients.options).forEach(opt => opt.selected = false);
        Array.from(filterProjects.options).forEach(opt => opt.selected = false);
        Array.from(filterUsers.options).forEach(opt => opt.selected = false);
        applyFilters();
    });

    function parseDateToTime(dStr) {
        if(!dStr) return 0;
        // Si ja és un objecte Date, normalitzem a mitjanit local
        if (dStr instanceof Date) return new Date(dStr.getFullYear(), dStr.getMonth(), dStr.getDate()).getTime();
        
        // Format DD/MM/YYYY
        const parts = dStr.split('/');
        if(parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]).getTime();
        
        // Format YYYY-MM-DD (comú en inputs type="date")
        const ymd = dStr.split('-');
        if(ymd.length === 3) {
            // Assegurar-nos que són números per evitar problemes amb el constructor
            return new Date(parseInt(ymd[0]), parseInt(ymd[1])-1, parseInt(ymd[2])).getTime();
        }

        const d = new Date(dStr);
        // Per a qualsevol altre format, intentem normalitzar a mitjanit local
        return isNaN(d) ? 0 : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
    function parseDateToDateObj(dStr) {
        if(!dStr) return null;
        const parts = dStr.split('/');
        if(parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]);
        const d = new Date(dStr);
        return isNaN(d) ? null : d;
    }

    function sortData() {
        if (!currentSort.column) return;
        
        filteredData.sort((a, b) => {
            let valA = a[currentSort.column];
            let valB = b[currentSort.column];
            
            if (currentSort.column === 'date') {
                valA = parseDateToTime(valA);
                valB = parseDateToTime(valB);
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
            }
            if (typeof valB === 'string' && currentSort.column !== 'date') {
                valB = valB.toLowerCase();
            }
            
            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function sortAbsData() {
        if (!currentAbsSort.column) return;
        
        filteredAbsData.sort((a, b) => {
            let valA = a[currentAbsSort.column];
            let valB = b[currentAbsSort.column];
            
            if (currentAbsSort.column === 'dateStart' || currentAbsSort.column === 'dateEnd') {
                valA = parseDateToTime(valA);
                valB = parseDateToTime(valB);
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
            }
            if (typeof valB === 'string' && (currentAbsSort.column !== 'dateStart' && currentAbsSort.column !== 'dateEnd')) {
                valB = valB.toLowerCase();
            }
            
            if (valA < valB) return currentAbsSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentAbsSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    [uploadBoxImp, uploadBoxAbs].forEach((box, i) => {
        const inp = i === 0 ? folderInputImp : folderInputAbs;
        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.style.borderColor = 'var(--accent-hover)';
            box.style.transform = 'translateY(-5px)';
        });
        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            box.style.borderColor = 'var(--accent-color)';
            box.style.transform = 'none';
        });
        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.style.borderColor = 'var(--accent-color)';
            box.style.transform = 'none';
            if (e.dataTransfer.items) {
                if (i === 0) handleImputacionsFiles(e.dataTransfer.files);
                else handleAbsenciesFiles(e.dataTransfer.files);
            }
        });
        box.addEventListener('click', (e) => {
            if(e.target !== inp && e.target.className !== 'custom-file-upload') {
                inp.click();
            }
        });
    });

    folderInputImp.addEventListener('change', (e) => handleImputacionsFiles(e.target.files));
    folderInputAbs.addEventListener('change', (e) => handleAbsenciesFiles(e.target.files));

    async function handleImputacionsFiles(files) {
        if (!files || files.length === 0) return;
        const excelFiles = Array.from(files).filter(f => f.name.endsWith('.xlsx'));
        if (excelFiles.length === 0) { alert(t('noFilesErr')); return; }

        uploadBoxImp.innerHTML = `<i class="ph ph-spinner-gap upload-icon" style="animation: spin 1s linear infinite;"></i><h2>${t('processing')}...</h2>`;
        
        currentData = [];
        for (const file of excelFiles) {
            try {
                const data = await readFile(file);
                currentData = currentData.concat(data);
            } catch (e) {}
        }

        await saveToDB('imputacions_data', currentData);
        await saveToDB('total_files', excelFiles.length); // Mantinc record de fitxers d'imputacions
        await saveToDB('imputacions_updated', new Date().getTime());
        
        applyFilters(); 
        await updateHomeDashboard();
        uploadImputacions.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    }

    async function handleAbsenciesFiles(files) {
        if (!files || files.length === 0) return;
        const excelFiles = Array.from(files).filter(f => f.name.endsWith('.xlsx'));
        if (excelFiles.length === 0) { alert(t('noFilesErr')); return; }

        uploadBoxAbs.innerHTML = `<i class="ph ph-spinner-gap upload-icon" style="animation: spin 1s linear infinite;"></i><h2>${t('processing')}...</h2>`;
        
        absData = [];
        for (const file of excelFiles) {
            try {
                const data = await readAbsenceFile(file);
                absData = absData.concat(data);
            } catch (e) {}
        }

        await saveToDB('absencies_data', absData);
        await saveToDB('absencies_updated', new Date().getTime());
        
        applyAbsFilters();
        await updateHomeDashboard();
        uploadAbsencies.classList.add('hidden');
        absResultsSection.classList.remove('hidden');
    }

    function applyAbsFilters() {
        const selectedUsersRaw = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
        const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;
        const selectedStatusRaw = Array.from(filterAbsStatus.selectedOptions).map(o => o.value);
        const selectedStatus = selectedStatusRaw.includes('ALL') ? [] : selectedStatusRaw;
        const startDate = filterAbsDateStart.value ? parseDateToTime(filterAbsDateStart.value) : null;
        const endDate = filterAbsDateEnd.value ? parseDateToTime(filterAbsDateEnd.value) : null;

        filteredAbsData = absData.filter(row => {
            if (selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
            if (selectedStatus.length > 0 && !selectedStatus.includes(row.status)) return false;
            
            if (startDate || endDate) {
                const rowTime = parseDateToTime(row.dateStart);
                if (startDate && rowTime < startDate) return false;
                if (endDate && rowTime > endDate) return false;
            }
            
            return true;
        });

        // Actualitzar selectors (filters dinàmics)
        const updateSelect = (selectEl, allData, field) => {
            const currentSelected = Array.from(selectEl.selectedOptions).map(o => o.value);
            const vals = [...new Set(allData.map(r => r[field]).filter(Boolean))].sort();
            selectEl.innerHTML = '';
            
            // Opció "Tots"
            const optAll = document.createElement('option');
            optAll.value = 'ALL';
            optAll.textContent = t('optAll');
            if (currentSelected.includes('ALL')) optAll.selected = true;
            selectEl.appendChild(optAll);

            vals.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v;
                if (currentSelected.includes(v)) opt.selected = true;
                selectEl.appendChild(opt);
            });
        };

        updateSelect(filterAbsUsers, absData, 'user');
        updateSelect(filterAbsStatus, absData, 'status');

        absTotalRequestsEl.textContent = filteredAbsData.length;
        const totalDays = filteredAbsData.reduce((acc, r) => acc + (parseFloat(r.days) || 0), 0);
        absTotalDaysEl.textContent = totalDays.toFixed(1);
        
        const pendingCount = filteredAbsData.filter(r => 
            ['pendent', 'pendiente', 'en espera'].some(s => r.status.toLowerCase().includes(s))
        ).length;
        absPendingEl.textContent = pendingCount;

        renderAbsTable(filteredAbsData);
        updateAbsCharts(filteredAbsData);
        renderOvertimeTable();
        updateHomeDashboard();
    }

    function renderAbsTable(data) {
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

    [filterAbsUsers, filterAbsStatus, filterAbsDateStart, filterAbsDateEnd].forEach(el => {
        el.addEventListener('change', applyAbsFilters);
    });

    // Toggle Filtres
    const setupToggle = (btnId, sectionId, storageKey) => {
        const btn = document.getElementById(btnId);
        const section = document.getElementById(sectionId);
        if (btn && section) {
            // Recuperar estat guardat
            const isMinimized = localStorage.getItem(storageKey) === 'true';
            if (isMinimized) section.classList.add('minimized');

            btn.addEventListener('click', () => {
                const minimized = section.classList.toggle('minimized');
                localStorage.setItem(storageKey, minimized);
            });
        }
    };

    setupToggle('btn-toggle-filters', 'filters-section', 'filters_imputacions_minimized');
    setupToggle('btn-toggle-abs-filters', 'filters-absencies', 'filters_absencies_minimized');

    if (btnClearAbsFilters) {
        btnClearAbsFilters.addEventListener('click', () => {
            Array.from(filterAbsUsers.options).forEach(opt => opt.selected = false);
            Array.from(filterAbsStatus.options).forEach(opt => opt.selected = false);
            filterAbsDateStart.value = '';
            filterAbsDateEnd.value = '';
            applyAbsFilters();
        });
    }

    // Ordenació taula Excés de jornada
    document.querySelectorAll('#overtimeTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort-overtime');
            if (currentOvertimeSort.column === column) {
                currentOvertimeSort.direction = currentOvertimeSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentOvertimeSort.column = column;
                currentOvertimeSort.direction = 'asc';
            }

            // Actualitzar icones
            document.querySelectorAll('#overtimeTable .sort-icon').forEach(icon => {
                icon.className = 'ph ph-caret-up sort-icon';
            });
            const icon = th.querySelector('.sort-icon');
            icon.className = `ph ph-caret-${currentOvertimeSort.direction === 'asc' ? 'up' : 'down'} sort-icon active`;

            renderOvertimeTable();
        });
    });

    function updateAbsCharts(data) {
        if (!data || data.length === 0) {
            if (absStatusChart) { absStatusChart.destroy(); absStatusChart = null; }
            if (absTypeChart) { absTypeChart.destroy(); absTypeChart = null; }
            return;
        }

        // --- Gràfic Estats ---
        const countsStatus = {};
        data.forEach(r => countsStatus[r.status] = (countsStatus[r.status] || 0) + 1);
        const labelsStatus = Object.keys(countsStatus);
        const valuesStatus = Object.values(countsStatus);
        const total = data.length;

        const ctxStatus = document.getElementById('absStatusChart').getContext('2d');
        if (absStatusChart) absStatusChart.destroy();

        absStatusChart = createAbsBarChart(ctxStatus, labelsStatus, valuesStatus, total, t('chartAbsStatusTitle'));

        // --- Gràfic Tipus ---
        const countsType = {};
        data.forEach(r => countsType[r.type] = (countsType[r.type] || 0) + 1);
        const labelsType = Object.keys(countsType);
        const valuesType = Object.values(countsType);

        const ctxTypeCanvas = document.getElementById('absTypeChart');
        if (ctxTypeCanvas) {
            const ctxType = ctxTypeCanvas.getContext('2d');
            if (absTypeChart) absTypeChart.destroy();
            absTypeChart = createAbsBarChart(ctxType, labelsType, valuesType, total, t('chartAbsTypeTitle'));
        }
    }

    function getConflicts(data, absData, userFilter = [], start = null, end = null) {
        if (!data || !absData || data.length === 0 || absData.length === 0) return [];

        const impMap = {};
        data.forEach(row => {
            if (userFilter.length > 0 && !userFilter.includes(row.user)) return;
            
            const time = parseDateToTime(row.date);
            if (start && time < start) return;
            if (end && time > end) return;

            const key = `${row.user}|${row.date}`;
            impMap[key] = (impMap[key] || 0) + (parseFloat(row.hours) || 0);
        });

        const conflictsList = [];
        Object.keys(impMap).forEach(key => {
            const [user, dateStr] = key.split('|');
            const impHours = impMap[key];

            const userAbsences = absData.filter(a => a.user === user);
            let dayAbsenceHours = 0;

            userAbsences.forEach(abs => {
                if (isDateInRange(dateStr, abs.dateStart, abs.dateEnd)) {
                    const dailyHours = (parseFloat(abs.days) > 0) ? (parseFloat(abs.hours) / parseFloat(abs.days)) : parseFloat(abs.hours);
                    dayAbsenceHours += dailyHours;
                }
            });

            if (dayAbsenceHours > 0) {
                const totalCompute = impHours + dayAbsenceHours;
                // Considerem conflicte si el còmput és diferent d'una jornada estàndard (ex: 8.5h)
                // Per compatibilitat amb el que ja tenies, exposem tot el que coincideix amb absència
                conflictsList.push({
                    date: dateStr,
                    user,
                    impHours,
                    absHours: dayAbsenceHours,
                    totalCompute,
                    diff: totalCompute - 8.5
                });
            }
        });
        return conflictsList;
    }

    function renderOvertimeTable() {
        if (!overtimeTableBody) return;
        overtimeTableBody.innerHTML = '';

        if (!currentData || currentData.length === 0 || !absData || absData.length === 0) {
            overtimeTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-secondary);">Cal carregar tant Imputacions com Absències per detectar conflictes.</td></tr>';
            return;
        }
        
        const selectedUsers = Array.from(filterAbsUsers.selectedOptions).map(o => o.value);
        const startDate = filterAbsDateStart.value ? parseDateToTime(filterAbsDateStart.value) : null;
        const endDate = filterAbsDateEnd.value ? parseDateToTime(filterAbsDateEnd.value) : null;

        const conflicts = getConflicts(currentData, absData, selectedUsers, startDate, endDate);

        if (conflicts.length === 0) {
            overtimeTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No s\'han detectat conflictes de jornada per al període seleccionat.</td></tr>';
            return;
        }

        // Ordenar segons l'estat actual
        conflicts.sort((a, b) => {
            let valA = a[currentOvertimeSort.column === 'date' ? 'date' : 'user'];
            let valB = b[currentOvertimeSort.column === 'date' ? 'date' : 'user'];

            if (currentOvertimeSort.column === 'date') {
                valA = parseDateToTime(valA);
                valB = parseDateToTime(valB);
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }

            if (valA < valB) return currentOvertimeSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentOvertimeSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        conflicts.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.date}</td>
                <td style="font-weight:600;">${c.user}</td>
                <td class="number-col">${c.impHours.toFixed(2)}h</td>
                <td class="number-col">${c.absHours.toFixed(2)}h</td>
                <td class="number-col highlight-col" style="font-weight:700; color:var(--accent-color);">${c.totalCompute.toFixed(2)}h</td>
            `;
            overtimeTableBody.appendChild(tr);
        });
    }

    async function updateHomeDashboard() {
        const homeDashboard = document.getElementById('home-dashboard');
        const homeEmptyState = document.getElementById('home-empty-state');
        const hasData = currentData.length > 0 || absData.length > 0;
        
        if (!hasData) {
            if (homeDashboard) homeDashboard.classList.add('hidden');
            if (homeEmptyState) homeEmptyState.classList.remove('hidden');
            return;
        }

        if (homeDashboard) homeDashboard.classList.remove('hidden');
        if (homeEmptyState) homeEmptyState.classList.add('hidden');

        // 1. Stats Globals
        const totalHours = currentData.reduce((sum, row) => sum + (row.hours || 0), 0);
        const totalAmount = currentData.reduce((sum, row) => sum + (row._importedCalculated || 0), 0);
        const totalAbsHours = absData.reduce((sum, row) => sum + (row.hours || 0), 0);
        
        const conflictsAll = getConflicts(currentData, absData);
        const totalConflictsCount = conflictsAll.filter(c => Math.abs(c.diff) > 0.01).length;

        document.getElementById('home-total-hours').textContent = totalHours.toFixed(1);
        document.getElementById('home-total-amount').textContent = totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
        document.getElementById('home-total-abs-hours').textContent = totalAbsHours.toFixed(1);
        document.getElementById('home-total-conflicts').textContent = totalConflictsCount;

        // --- Monthly Stats Summary ---
        const now = new Date();
        const currMonth = now.getMonth();
        const currYear = now.getFullYear();
        
        const names = t('months');
        
        const monthTitle = document.getElementById('home-month-title');
        if (monthTitle) monthTitle.textContent = `${t('titleMonthlySituation')} ${names[currMonth]} ${currYear}`;

        const filterByMonth = (data, m, y, dateField = 'date') => data.filter(r => {
            const d = parseDateToDateObj(r[dateField]);
            return d && d.getMonth() === m && d.getFullYear() === y;
        });

        const cData = filterByMonth(currentData, currMonth, currYear, 'date');
        const cAbs = filterByMonth(absData, currMonth, currYear, 'dateStart');

        const mHours = cData.reduce((s, r) => s + (r.hours || 0), 0);
        const mAmount = cData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
        const mAbsHours = cAbs.reduce((s, r) => s + (r.hours || 0), 0);
        const mConflicts = getConflicts(cData, absData).filter(c => Math.abs(c.diff) > 0.01).length;

        if (document.getElementById('home-curr-hours')) document.getElementById('home-curr-hours').textContent = mHours.toFixed(1);
        if (document.getElementById('home-curr-amount')) document.getElementById('home-curr-amount').textContent = mAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
        if (document.getElementById('home-curr-abs-hours')) document.getElementById('home-curr-abs-hours').textContent = mAbsHours.toFixed(1);
        if (document.getElementById('home-curr-conflicts')) document.getElementById('home-curr-conflicts').textContent = mConflicts;

        // --- Previous Month Stats Summary ---
        const prevMonth = currMonth === 0 ? 11 : currMonth - 1;
        const prevYear = currMonth === 0 ? currYear - 1 : currYear;

        const prevTitle = document.getElementById('home-prev-month-title');
        if (prevTitle) prevTitle.textContent = `${t('titleMonthlySituation')} ${names[prevMonth]} ${prevYear}`;

        const pData = filterByMonth(currentData, prevMonth, prevYear, 'date');
        const pAbs = filterByMonth(absData, prevMonth, prevYear, 'dateStart');

        const pmHours = pData.reduce((s, r) => s + (r.hours || 0), 0);
        const pmAmount = pData.reduce((s, r) => s + (r._importedCalculated || 0), 0);
        const pmAbsHours = pAbs.reduce((s, r) => s + (r.hours || 0), 0);
        const pmConflicts = getConflicts(pData, absData).filter(c => Math.abs(c.diff) > 0.01).length;

        if (document.getElementById('home-prev-hours')) document.getElementById('home-prev-hours').textContent = pmHours.toFixed(1);
        if (document.getElementById('home-prev-amount')) document.getElementById('home-prev-amount').textContent = pmAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
        if (document.getElementById('home-prev-abs-hours')) document.getElementById('home-prev-abs-hours').textContent = pmAbsHours.toFixed(1);
        if (document.getElementById('home-prev-conflicts')) document.getElementById('home-prev-conflicts').textContent = pmConflicts;

        // --- Timestamps ---
        const formatTS = (ts) => {
            if (!ts) return '-';
            return new Date(ts).toLocaleString(currentLang === 'ca' ? 'ca-ES' : 'es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        };
        
        const tsImp = await getFromDB('imputacions_updated');
        const tsAbs = await getFromDB('absencies_updated');
        if (document.getElementById('last-updated-imp')) document.getElementById('last-updated-imp').textContent = formatTS(tsImp);
        if (document.getElementById('last-updated-abs')) document.getElementById('last-updated-abs').textContent = formatTS(tsAbs);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const thirtyDaysTime = thirtyDaysAgo.getTime();

        // 2. Client Summary (filtrat 30 dies)
        const clientStats = {};
        currentData.forEach(row => {
            const rowTime = parseDateToTime(row.date);
            if (rowTime < thirtyDaysTime) return;

            if (!clientStats[row.client]) {
                clientStats[row.client] = { hours: 0, amount: 0 };
            }
            clientStats[row.client].hours += (row.hours || 0);
            clientStats[row.client].amount += (row._importedCalculated || 0);
        });

        const sortedClients = Object.entries(clientStats)
            .sort((a, b) => b[1].hours - a[1].hours)
            .slice(0, 5);

        const clientBody = document.getElementById('homeClientBody');
        if (clientBody) {
            clientBody.innerHTML = sortedClients.map(([client, stat]) => `
                <tr>
                    <td>${client || t('lblNoClient')}</td>
                    <td class="number-col">${stat.hours.toFixed(1)}</td>
                    <td class="number-col">${stat.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                </tr>
            `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoRecentData')}</td></tr>`;
        }

        // 3. Alerts Summary (filtrat 30 dies)
        const alertsBody = document.getElementById('homeAlertsBody');
        if (alertsBody) {
            const conflictsFiltered = conflictsAll
                .sort((a, b) => parseDateToTime(b.date) - parseDateToTime(a.date))
                .filter(c => parseDateToTime(c.date) >= thirtyDaysTime && Math.abs(c.diff) > 0.1)
                .slice(0, 5);

            alertsBody.innerHTML = conflictsFiltered.map(c => `
                <tr>
                    <td>${c.date}</td>
                    <td style="font-weight:600">${c.user}</td>
                    <td class="number-col" style="color:var(--danger-color); font-weight:bold">${Math.abs(c.diff).toFixed(1)}h</td>
                </tr>
            `).join('') || `<tr><td colspan="3" style="text-align:center">${t('lblNoConflicts')}</td></tr>`;
        }
    }



    function isDateInRange(targetDateStr, startStr, endStr) {
        const target = parseDateToTime(targetDateStr);
        const start = parseDateToTime(startStr);
        const end = parseDateToTime(endStr);
        return target >= start && target <= end;
    }

    function createAbsBarChart(ctx, labels, values, total, title) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: values,
                    backgroundColor: [
                        '#73EDFF', '#FF7675', '#55EFC4', '#FAB1A0', '#A29BFE', '#FDCB6E'
                    ],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { right: 50, left: 10, top: 10, bottom: 10 }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#F8F8F8', font: { size: 9 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#F8F8F8', font: { size: 9 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: title,
                        color: document.body.classList.contains('theme-light') ? '#202020' : '#F8F8F8',
                        font: { size: 15, weight: '600' },
                        padding: { bottom: 10 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${val} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function applyFilters() {
        const SIX_MONTHS = 6;
        let pStart = filterDateStart.value ? new Date(filterDateStart.value) : null;
        let pEnd = filterDateEnd.value ? new Date(filterDateEnd.value) : null;

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
        } else if (pStart && pEnd) {
            const diffMonths = (pEnd.getFullYear() - pStart.getFullYear()) * 12 + (pEnd.getMonth() - pStart.getMonth());
            if (diffMonths > SIX_MONTHS || (diffMonths === SIX_MONTHS && pEnd.getDate() > pStart.getDate())) {
                pEnd = new Date(pStart);
                pEnd.setMonth(pEnd.getMonth() + SIX_MONTHS);
                filterDateEnd.value = pEnd.toISOString().split('T')[0];
            }
        }

        const startDateTimestamp = pStart ? parseDateToTime(filterDateStart.value) : 0;
        const endDateTimestamp = pEnd ? parseDateToTime(filterDateEnd.value) + (24 * 60 * 60 * 1000 - 1) : Infinity;

        const selectedClientsRaw = Array.from(filterClients.selectedOptions).map(o => o.value);
        const selectedClients = selectedClientsRaw.includes('ALL') ? [] : selectedClientsRaw;
        const selectedProjectsRaw = Array.from(filterProjects.selectedOptions).map(o => o.value);
        const selectedProjects = selectedProjectsRaw.includes('ALL') ? [] : selectedProjectsRaw;
        const selectedUsersRaw = Array.from(filterUsers.selectedOptions).map(o => o.value);
        const selectedUsers = selectedUsersRaw.includes('ALL') ? [] : selectedUsersRaw;

        const rowMatchesDate = (row) => {
            const rowTime = parseDateToTime(row.date);
            if (rowTime > 0) {
                if (rowTime < startDateTimestamp || rowTime > endDateTimestamp) return false;
            } else {
                if (startDateTimestamp > 0 || endDateTimestamp !== Infinity) return false;
            }
            return true;
        };

        filteredData = currentData.filter(row => {
            if (!rowMatchesDate(row)) return false;
            if (selectedClients.length > 0 && !selectedClients.includes(row.client)) return false;
            if (selectedProjects.length > 0 && !selectedProjects.includes(row.project)) return false;
            if (selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
            return true;
        });

        const getOptionsFor = (filterToIgnore) => {
            return currentData.filter(row => {
                if (!rowMatchesDate(row)) return false;
                if (filterToIgnore !== 'client' && selectedClients.length > 0 && !selectedClients.includes(row.client)) return false;
                if (filterToIgnore !== 'project' && selectedProjects.length > 0 && !selectedProjects.includes(row.project)) return false;
                if (filterToIgnore !== 'user' && selectedUsers.length > 0 && !selectedUsers.includes(row.user)) return false;
                return true;
            });
        };

        const uniqueClients = [...new Set(getOptionsFor('client').map(r => r.client).filter(Boolean))].sort();
        const uniqueProjects = [...new Set(getOptionsFor('project').map(r => r.project).filter(Boolean))].sort();
        const uniqueUsers = [...new Set(getOptionsFor('user').map(r => r.user).filter(Boolean))].sort();

        const updateSelect = (selectEl, validValues, selectedValues) => {
            selectEl.innerHTML = '';
            
            // Opció "Tots"
            const optAll = document.createElement('option');
            optAll.value = 'ALL';
            optAll.textContent = t('optAll');
            if (selectedValues.includes('ALL')) optAll.selected = true;
            selectEl.appendChild(optAll);

            validValues.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                if (selectedValues.includes(val)) opt.selected = true;
                selectEl.appendChild(opt);
            });
        };

        updateSelect(filterClients, uniqueClients, selectedClients);
        updateSelect(filterProjects, uniqueProjects, selectedProjects);
        updateSelect(filterUsers, uniqueUsers, selectedUsers);

        totalRowsEl.textContent = filteredData.length;
        
        const total = filteredData.reduce((acc, row) => acc + (row._importedCalculated || 0), 0);
        totalAmountEl.textContent = formatCurrency(total);

        filtersSection.classList.remove('hidden');

        sortData();
        renderTable(filteredData);
        updateChart(filteredData);
        renderOvertimeTable();
    }

    function updateChart(data) {
        let billable = 0;
        let nonBillable = 0;
        
        const monthlyData = {};
        
        data.forEach(row => {
            if (row.isBillable) {
                billable += row.hours;
            } else {
                nonBillable += row.hours;
            }

            const time = parseDateToTime(row.date);
            if (time > 0) {
                const dateObj = new Date(time);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const key = `${year}-${month}`;
                
                if (!monthlyData[key]) {
                    const localeTag = currentLang === 'ca' ? 'ca-ES' : 'es-ES';
                    const monthLoc = dateObj.toLocaleDateString(localeTag, { month: 'short', year: 'numeric' });
                    monthlyData[key] = { label: monthLoc, totalHours: 0, totalImport: 0 };
                }
                
                monthlyData[key].totalHours += row.hours;
                monthlyData[key].totalImport += (row._importedCalculated || 0);
            }
        });

        const sortedKeys = Object.keys(monthlyData).sort();
        const labelsMonthly = [];
        const dataHoursMonthly = [];
        const dataImportMonthly = [];
        
        sortedKeys.forEach(k => {
            labelsMonthly.push(monthlyData[k].label);
            dataHoursMonthly.push(monthlyData[k].totalHours.toFixed(2));
            dataImportMonthly.push(monthlyData[k].totalImport.toFixed(2));
        });

        const isLight = document.body.classList.contains('theme-light');
        const dColor = isLight ? '#202020' : '#F8F8F8';
        const dGridLines = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

        const lblBillable = `${t('chartBillable')} (${billable.toFixed(1)}${t('chartHoursUnit')})`;
        const lblNonBillable = `${t('chartNonBillable')} (${nonBillable.toFixed(1)}${t('chartHoursUnit')})`;

        if (hoursChart) {
            hoursChart.data.datasets[0].data = [billable, nonBillable];
            hoursChart.data.labels = [lblBillable, lblNonBillable];
            hoursChart.options.plugins.title.text = t('chartTitleHours');
            hoursChart.options.plugins.title.color = dColor;
            hoursChart.options.plugins.legend.labels.color = dColor;
            hoursChart.update();
        } else {
            const ctx1 = document.getElementById('hoursChart').getContext('2d');
            Chart.defaults.font.family = 'Inter';
            
            hoursChart = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: [lblBillable, lblNonBillable],
                    datasets: [{
                        data: [billable, nonBillable],
                        backgroundColor: ['#6b8434', '#84346b'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: dColor } },
                        title: { display: true, text: t('chartTitleHours'), color: dColor, font: { size: 14 } },
                        tooltip: { callbacks: { label: function(context) { return context.label + ': ' + context.parsed + ' ' + t('chartHoursUnit'); } } }
                    }
                }
            });
        }

        if (trendHoursChart) {
            trendHoursChart.data.labels = labelsMonthly;
            trendHoursChart.data.datasets[0].data = dataHoursMonthly;
            trendHoursChart.data.datasets[0].label = t('chartLabelTotalHours');
            trendHoursChart.options.plugins.title.text = t('chartTitleEvolHours');
            trendHoursChart.options.plugins.title.color = dColor;
            trendHoursChart.options.scales.x.ticks.color = dColor;
            trendHoursChart.options.scales.y.ticks.color = dColor;
            trendHoursChart.options.scales.x.grid.color = dGridLines;
            trendHoursChart.options.scales.y.grid.color = dGridLines;
            trendHoursChart.update();
        } else {
            const ctx2 = document.getElementById('trendHoursChart').getContext('2d');
            trendHoursChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: labelsMonthly,
                    datasets: [{
                        label: t('chartLabelTotalHours'),
                        data: dataHoursMonthly,
                        borderColor: '#346B84',
                        backgroundColor: 'rgba(52, 107, 132, 0.2)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: true, text: t('chartTitleEvolHours'), color: dColor, font: { size: 14 } } },
                    scales: { 
                        y: { beginAtZero: true, grid: { color: dGridLines }, ticks: { color: dColor } },
                        x: { grid: { color: dGridLines }, ticks: { color: dColor } }
                    }
                }
            });
        }

        if (trendImportChart) {
            trendImportChart.data.labels = labelsMonthly;
            trendImportChart.data.datasets[0].data = dataImportMonthly;
            trendImportChart.data.datasets[0].label = t('chartLabelFacturat');
            trendImportChart.options.plugins.title.text = t('chartTitleEvolImport');
            trendImportChart.options.plugins.title.color = dColor;
            trendImportChart.options.scales.x.ticks.color = dColor;
            trendImportChart.options.scales.y.ticks.color = dColor;
            trendImportChart.options.scales.x.grid.color = dGridLines;
            trendImportChart.options.scales.y.grid.color = dGridLines;
            trendImportChart.update();
        } else {
            const ctx3 = document.getElementById('trendImportChart').getContext('2d');
            trendImportChart = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: labelsMonthly,
                    datasets: [{
                        label: t('chartLabelFacturat'),
                        data: dataImportMonthly,
                        borderColor: '#6b8434',
                        backgroundColor: 'rgba(107, 132, 52, 0.2)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: true, text: t('chartTitleEvolImport'), color: dColor, font: { size: 14 } } },
                    scales: { 
                        y: { beginAtZero: true, grid: { color: dGridLines }, ticks: { color: dColor } }, 
                        x: { grid: { color: dGridLines }, ticks: { color: dColor } } 
                    }
                }
            });
        }
    }

    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                try {
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    let json = XLSX.utils.sheet_to_json(worksheet);
                    
                    json = json.map(row => {
                        const date = row['DATE'] || row['Date'] || row['Data'] || '';
                        const parsedDate = date instanceof Date ? date.toLocaleDateString() : date;
                        
                        const user = row['USER'] || row['User'] || '';
                        const client = row['CLIENT'] || row['Client'] || '';
                        const project = row['PROJECT'] || row['Project'] || '';
                        const task = row['TASK'] || row['Task'] || '';
                        
                        const isBillableRaw = row['IS BILLABLE'] !== undefined ? row['IS BILLABLE'] : (row['Is Billable'] !== undefined ? row['Is Billable'] : false);
                        let isBillable = false;
                        if (typeof isBillableRaw === 'boolean') {
                            isBillable = isBillableRaw;
                        } else if (typeof isBillableRaw === 'string') {
                            isBillable = ['yes', 'true', 'sí', 'si', '1'].includes(isBillableRaw.toLowerCase());
                        } else if (typeof isBillableRaw === 'number') {
                            isBillable = isBillableRaw === 1;
                        }

                        const rate = parseFloat(row['BILLABLE RATE'] || row['Billable Rate'] || 0);
                        const hours = parseFloat(row['TOTAL HOURS'] || row['Total Hours'] || 0);
                        
                        const calcAmount = rate * hours;

                        return {
                            date: parsedDate,
                            user: normalizeName(user),
                            client: client,
                            project: project,
                            task: task,
                            isBillable: isBillable,
                            rate: isNaN(rate) ? 0 : rate,
                            hours: isNaN(hours) ? 0 : hours,
                            _importedCalculated: isNaN(calcAmount) ? 0 : calcAmount
                        };
                    });
                    
                    resolve(json);
                } catch(err) {
                    reject(err);
                }
            };

            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    function readAbsenceFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                try {
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    
                    const result = json.map(row => {
                        // All keys in lowercase for flexible matching
                        const rowKeys = Object.keys(row);
                        const rowKeysLower = rowKeys.map(k => k.toLowerCase().trim());

                        const getV = (labels) => {
                            for (const l of labels) {
                                const lLower = l.toLowerCase().trim();
                                const idx = rowKeysLower.indexOf(lLower);
                                if (idx !== -1) return row[rowKeys[idx]];
                            }
                            return undefined;
                        };

                        const user = getV(['Nom del sol·licitant', 'Nombre del solicitante', 'Solicitant']) || '';
                        const approver = getV(['Nom de l\'aprovador', 'Nombre del aprobador', 'Aprovador', 'Aprobador', 'Aprovat per']) || '';
                        const type = getV(['Tipus', 'Tipo', 'Tipus d\'absència', 'Tipo de ausencia']) || '';
                        const status = getV(['Estat de la sol·licitud', 'Estado de la solicitud', 'Estat', 'Estado']) || '';
                        
                        const dateStartRaw = getV(['Data d\'inici de la sol·licitud', 'Fecha de inicio de la solicitud', 'Data inici', 'Fecha inicio', 'Inici']) || '';
                        const dateEndRaw = getV(['Data de finalització de la sol·licitud', 'Fecha de finalización de la solicitud', 'Data fi', 'Fecha fin', 'Finalització']) || '';
                        
                        const dateStart = dateStartRaw instanceof Date ? dateStartRaw.toLocaleDateString() : dateStartRaw;
                        const dateEnd = dateEndRaw instanceof Date ? dateEndRaw.toLocaleDateString() : dateEndRaw;
                        
                        const days = getV(['Dies laborals d\'absència', 'Dies laborals dabsència', 'Días laborales de ausencia', 'Días laborales de ausencia']) || 0;
                        const minutesRaw = getV(['Minuts laborals d\'absència', 'Minuts laborals dabsència', 'Minutos laborales de ausencia', 'Minutos']) || 0;
                        const hours = parseFloat(minutesRaw) / 60;
                        const consumesTime = getV(['Consumeix temps', 'Consume tiempo']) || '';

                        return {
                            user: normalizeName(user), approver, type, status, dateStart, dateEnd, days, hours, consumesTime
                        };
                    });
                    resolve(result);
                } catch(err) { reject(err); }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    function renderTable(data) {
        tableBody.innerHTML = '';

        data.forEach(row => {
            const tr = document.createElement('tr');
            
            // LÒGICA DE UNIÓ (JOIN): Cercar absències per a aquest usuari i data
            const hasAbsence = absData.some(abs => 
                abs.user === row.user && abs.dateStart === row.date
            );

            const isBillableBadge = row.isBillable 
                ? `<span class="badge badge-yes">${t('badgeYes')}</span>` 
                : `<span class="badge badge-no">${t('badgeNo')}</span>`;

            const absenceWarning = hasAbsence 
                ? `<i class="ph ph-warning-circle" style="color: var(--danger-color); margin-left: 5px;" title="${t('lblOvertimeWarning')}"></i>`
                : '';

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

    function formatCurrency(value) {
        const localeTag = currentLang === 'ca' ? 'ca-ES' : 'es-ES';
        return new Intl.NumberFormat(localeTag, { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(value);
    }

    function normalizeName(name) {
        if (!name) return '';
        return name.toString()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Treu accents
            .replace(/[^A-Z0-9\s]/g, "")    // Treu símbols no estàndards
            .trim();
    }

    // Al carregar l'app, mirem si hi ha dades a la memòria cau per no tornar a demanar
    try {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.classList.remove('hidden-modal');

        const savedData = await getFromDB('imputacions_data');
        const savedAbsData = await getFromDB('absencies_data');
        
        if (savedAbsData && savedAbsData.length > 0) {
            absData = savedAbsData.map(r => ({ ...r, user: normalizeName(r.user) }));
            applyAbsFilters();
            document.getElementById('upload-absencies').classList.add('hidden');
            absResultsSection.classList.remove('hidden');
        }

        if (savedData && savedData.length > 0) {
            currentData = savedData.map(r => ({ ...r, user: normalizeName(r.user) }));
            const savedFiles = await getFromDB('total_files') || 1;
            if (totalFilesEl) {
                totalFilesEl.textContent = savedFiles;
                totalFilesEl.dataset.value = savedFiles;
            }
            
            applyFilters();
            
            document.getElementById('upload-imputacions').classList.add('hidden');
            resultsSection.classList.remove('hidden');
        }
        await updateHomeDashboard();
        renderOvertimeTable();
        
        // Amagar l'overlay després d'un segon per donar feedback visual
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.classList.add('hidden-modal');
        }, 800);

    } catch (err) {
        console.warn('No saved data or db error:', err);
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.classList.add('hidden-modal');
    }
});
