// =============================================================================
// DB — Helpers d'IndexedDB per persistir dades entre sessions
// =============================================================================

import { t } from '../config/i18n.js';

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
            console.error('Error literal de IndexedDB:', e.target.error);
            alert(t('errorDB').replace('{msg}', e.target.error.message));
            reject(e.target.error);
        };
    });
}

export function saveToDB(key, data) {
    return initDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    }));
}

export function getFromDB(key) {
    return initDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    }));
}
