// =============================================================================
// NAVIGATION — Navegació entre les pantalles Home / Imputacions / Absències
// =============================================================================

import { state } from '../state.js';
import { applyTranslations } from '../config/i18n.js';
import { updateHomeDashboard } from './home.js';
import { renderFacturacio } from './facturacio.js';

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

    const navHome = document.getElementById('nav-home');
    const navImputacions = document.getElementById('nav-imputacions');
    const navAbsencies = document.getElementById('nav-absencies');
    const navFacturacio = document.getElementById('nav-facturacio');
    const sidebarItems = [navHome, navImputacions, navAbsencies, navFacturacio].filter(Boolean);

    if (!btnGoImputacions || !btnGoAbsencies || !btnBackHome) return {};

    function setActive(id) {
        sidebarItems.forEach(item => item.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    }

    function goToFacturacio() {
        homeScreen.classList.add('hidden');
        imputacionsScreen.classList.add('hidden');
        absenciesScreen.classList.add('hidden');
        facturacioScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'titleFacturacio');
        applyTranslations();
        setActive('nav-facturacio');
        renderFacturacio();
    }

    function goToImputacions() {
        homeScreen.classList.add('hidden');
        absenciesScreen.classList.add('hidden');
        facturacioScreen.classList.add('hidden');
        imputacionsScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'appTitle');
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
        homeScreen.classList.add('hidden');
        imputacionsScreen.classList.add('hidden');
        facturacioScreen.classList.add('hidden');
        absenciesScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'btnGoAbsencies');
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
        imputacionsScreen.classList.add('hidden');
        absenciesScreen.classList.add('hidden');
        facturacioScreen.classList.add('hidden');
        homeScreen.classList.remove('hidden');
        btnBackHome.classList.add('hidden');
        headerTitle.setAttribute('data-i18n', 'homeTitle');
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

    return { btnGoImputacions, btnGoAbsencies };
}
