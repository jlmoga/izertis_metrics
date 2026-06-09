// =============================================================================
// UPLOAD — Gestió de càrrega de fitxers (input + drag & drop)
// =============================================================================

import { state } from '../state.js';
import { t } from '../config/i18n.js';
import { saveToDB } from '../services/db.js';
import { readFile, readAbsenceFile } from '../services/excel.js';
import { applyFilters, applyAbsFilters } from './filters.js';
import { updateHomeDashboard } from './home.js';

export async function handleImputacionsFiles(files) {
    if (!files || files.length === 0) return;
    const excelFiles = Array.from(files).filter(f => f.name.endsWith('.xlsx'));
    if (excelFiles.length === 0) { alert(t('noFilesErr')); return; }

    const uploadBoxImp = document.getElementById('upload-box-imputacions');
    uploadBoxImp.innerHTML = `<i class="ph ph-spinner-gap upload-icon" style="animation: spin 1s linear infinite;"></i><h2>${t('processing')}...</h2>`;

    state.currentData = [];
    for (const file of excelFiles) {
        try { state.currentData = state.currentData.concat(await readFile(file)); }
        catch (e) { /* fitxer invàlid, continuem */ }
    }

    await saveToDB('imputacions_data', state.currentData);
    await saveToDB('total_files', excelFiles.length);
    await saveToDB('imputacions_updated', new Date().getTime());

    applyFilters();
    await updateHomeDashboard();
    document.getElementById('upload-imputacions').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
}

export async function handleAbsenciesFiles(files) {
    if (!files || files.length === 0) return;
    const excelFiles = Array.from(files).filter(f => f.name.endsWith('.xlsx'));
    if (excelFiles.length === 0) { alert(t('noFilesErr')); return; }

    const uploadBoxAbs = document.getElementById('upload-box-absencies');
    uploadBoxAbs.innerHTML = `<i class="ph ph-spinner-gap upload-icon" style="animation: spin 1s linear infinite;"></i><h2>${t('processing')}...</h2>`;

    state.absData = [];
    for (const file of excelFiles) {
        try { state.absData = state.absData.concat(await readAbsenceFile(file)); }
        catch (e) { /* fitxer invàlid, continuem */ }
    }

    await saveToDB('absencies_data', state.absData);
    await saveToDB('absencies_updated', new Date().getTime());
    await saveToDB('total_abs_files', excelFiles.length);

    applyAbsFilters();
    await updateHomeDashboard();
    document.getElementById('upload-absencies').classList.add('hidden');
    document.getElementById('absencies-results-section').classList.remove('hidden');
}

export function setupUploadHandlers() {
    const folderInputImp = document.getElementById('folderInputImp');
    const folderInputAbs = document.getElementById('folderInputAbs');
    const uploadBoxImp = document.getElementById('upload-box-imputacions');
    const uploadBoxAbs = document.getElementById('upload-box-absencies');

    const setupBox = (box, inp, handler) => {
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
            if (e.dataTransfer.items) handler(e.dataTransfer.files);
        });
        box.addEventListener('click', (e) => {
            if (e.target !== inp && e.target.className !== 'custom-file-upload') inp.click();
        });
    };

    setupBox(uploadBoxImp, folderInputImp, handleImputacionsFiles);
    setupBox(uploadBoxAbs, folderInputAbs, handleAbsenciesFiles);

    folderInputImp.addEventListener('change', (e) => handleImputacionsFiles(e.target.files));
    folderInputAbs.addEventListener('change', (e) => handleAbsenciesFiles(e.target.files));

    return { folderInputImp, folderInputAbs };
}
