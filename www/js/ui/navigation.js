// =============================================================================
// NAVIGATION — Navegació entre les pantalles Home / Imputacions / Absències
// =============================================================================

import { state } from '../state.js';
import { applyTranslations } from '../config/i18n.js';
import { updateHomeDashboard } from './home.js';

export function setupNavigation() {
    const homeScreen = document.getElementById('home-screen');
    const imputacionsScreen = document.getElementById('imputacions-screen');
    const absenciesScreen = document.getElementById('absencies-screen');
    const btnGoImputacions = document.getElementById('btn-go-imputacions');
    const btnGoAbsencies = document.getElementById('btn-go-absencies');
    const btnBackHome = document.getElementById('btn-back-home');
    const resultsSection = document.getElementById('results-section');
    const absResultsSection = document.getElementById('absencies-results-section');
    const headerTitle = document.querySelector('header h1');

    if (!btnGoImputacions || !btnGoAbsencies || !btnBackHome) return {};

    btnGoImputacions.addEventListener('click', () => {
        homeScreen.classList.add('hidden');
        absenciesScreen.classList.add('hidden');
        imputacionsScreen.classList.remove('hidden');
        btnBackHome.classList.remove('hidden');
        headerTitle.setAttribute('data-i18n', 'appTitle');
        applyTranslations();

        if (state.currentData.length === 0) {
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

        if (state.absData.length === 0) {
            document.getElementById('upload-absencies').classList.remove('hidden');
            absResultsSection.classList.add('hidden');
        } else {
            document.getElementById('upload-absencies').classList.add('hidden');
            absResultsSection.classList.remove('hidden');
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

    return { btnGoImputacions, btnGoAbsencies };
}
