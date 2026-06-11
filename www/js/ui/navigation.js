// =============================================================================
// NAVIGATION — Navegació entre les pantalles Home / Imputacions / Absències
// =============================================================================

import { state } from '../state.js';
import { applyTranslations } from '../config/i18n.js';
import { updateHomeDashboard } from './home.js';
import { renderFacturacio } from './facturacio.js';
import { setupParams } from './params.js';

export function setupNavigation() {
    const homeScreen = document.getElementById('home-screen');
    const imputacionsScreen = document.getElementById('imputacions-screen');
    const absenciesScreen = document.getElementById('absencies-screen');
    const facturacioScreen = document.getElementById('facturacio-screen');
    const btnGoImputacions = document.getElementById('btn-go-imputacions');
    const btnGoAbsencies = document.getElementById('btn-go-absencies');
    const btnBackHome = document.getElementById('btn-back-home');
    const resultsSection = document.getElementById('results-section');
    const absResultsSection = document.getElementById('absencies-results-section');
    const headerTitle = document.querySelector('header h1');
    const headerIcon  = document.getElementById('header-icon');

    function setHeaderIcon(iconClass) {
        if (headerIcon) headerIcon.className = `ph ${iconClass}`;
    }

    const navHome = document.getElementById('nav-home');
    const navImputacions = document.getElementById('nav-imputacions');
    const navAbsencies = document.getElementById('nav-absencies');
    const navFacturacio = document.getElementById('nav-facturacio');
    const navParams = document.getElementById('nav-params');
    const paramsScreen = document.getElementById('params-screen');
    const sidebarItems = [navHome, navImputacions, navAbsencies, navFacturacio, navParams].filter(Boolean);

    if (!btnGoImputacions || !btnGoAbsencies || !btnBackHome) return {};

    function setActive(id) {
        sidebarItems.forEach(item => item.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    }

    function hideAllScreens() {
        homeScreen.classList.add('hidden');
        imputacionsScreen.classList.add('hidden');
        absenciesScreen.classList.add('hidden');
        facturacioScreen.classList.add('hidden');
        if (paramsScreen) paramsScreen.classList.add('hidden');
    }

    function goToParams() {
        hideAllScreens();
        if (paramsScreen) paramsScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'btnParams');
        setHeaderIcon('ph-sliders');
        applyTranslations();
        setActive('nav-params');
        setupParams();
    }

    function goToFacturacio() {
        hideAllScreens();
        facturacioScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'titleFacturacio');
        setHeaderIcon('ph-invoice');
        applyTranslations();
        setActive('nav-facturacio');
        renderFacturacio();
    }

    function goToImputacions() {
        hideAllScreens();
        imputacionsScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'appTitle');
        setHeaderIcon('ph-table');
        applyTranslations();
        setActive('nav-imputacions');

        if (state.currentData.length === 0) {
            document.getElementById('upload-imputacions').classList.remove('hidden');
            resultsSection.classList.add('hidden');
        } else {
            document.getElementById('upload-imputacions').classList.add('hidden');
            resultsSection.classList.remove('hidden');
        }
    }

    function goToAbsencies() {
        hideAllScreens();
        absenciesScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'btnGoAbsencies');
        setHeaderIcon('ph-calendar-blank');
        applyTranslations();
        setActive('nav-absencies');

        if (state.absData.length === 0) {
            document.getElementById('upload-absencies').classList.remove('hidden');
            absResultsSection.classList.add('hidden');
        } else {
            document.getElementById('upload-absencies').classList.add('hidden');
            absResultsSection.classList.remove('hidden');
        }
    }

    async function goToHome() {
        hideAllScreens();
        homeScreen.classList.remove('hidden');
        btnBackHome.classList.add('hidden');
        headerTitle.setAttribute('data-i18n', 'homeTitle');
        setHeaderIcon('ph-house');
        applyTranslations();
        setActive('nav-home');
        await updateHomeDashboard();
    }

    btnGoImputacions.addEventListener('click', goToImputacions);
    btnGoAbsencies.addEventListener('click', goToAbsencies);
    btnBackHome.addEventListener('click', goToHome);

    if (navHome) navHome.addEventListener('click', goToHome);
    if (navImputacions) navImputacions.addEventListener('click', goToImputacions);
    if (navAbsencies) navAbsencies.addEventListener('click', goToAbsencies);
    if (navFacturacio) navFacturacio.addEventListener('click', goToFacturacio);
    if (navParams) navParams.addEventListener('click', goToParams);

    return { btnGoImputacions, btnGoAbsencies };
}
