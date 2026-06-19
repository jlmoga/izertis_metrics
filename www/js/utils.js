// =============================================================================
// UTILS — Funcions pures reutilitzables (dates, moneda, noms)
// =============================================================================

import { currentLang } from './config/i18n.js';

export function parseDateToTime(dStr) {
    if (!dStr) return 0;
    if (dStr instanceof Date) return new Date(dStr.getFullYear(), dStr.getMonth(), dStr.getDate()).getTime();
    const parts = dStr.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    const ymd = dStr.split('-');
    if (ymd.length === 3) return new Date(parseInt(ymd[0]), parseInt(ymd[1]) - 1, parseInt(ymd[2])).getTime();
    const d = new Date(dStr);
    return isNaN(d) ? 0 : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function parseDateToDateObj(dStr) {
    if (!dStr) return null;
    const parts = dStr.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    const d = new Date(dStr);
    return isNaN(d) ? null : d;
}

export function isDateInRange(targetDateStr, startStr, endStr) {
    const target = parseDateToTime(targetDateStr);
    const start = parseDateToTime(startStr);
    const end = parseDateToTime(endStr);
    return target >= start && target <= end;
}

export function formatCurrency(value) {
    const localeTag = currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-GB' : 'ca-ES';
    return new Intl.NumberFormat(localeTag, { style: 'currency', currency: 'EUR' }).format(value);
}

export function isRejectedStatus(status) {
    if (!status) return false;
    const s = status.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.includes('rebutj') || s.includes('rebuig') || s.includes('rechaz') || s.includes('denegat') || s.includes('denegado') || s.includes('reject');
}

export function normalizeName(name) {
    if (!name) return '';
    return name.toString()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9\s]/g, '')
        .trim();
}

// Clau de nom robusta a l'ordre dels cognoms (tokens ordenats alfab\u00e8ticament),
// usada per casar t\u00e8cnics entre imputacions i abs\u00e8ncies.
export function absNameKey(name) {
    return name
        ? name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9\s]/g, '').trim()
              .split(/\s+/).filter(Boolean).sort().join(' ')
        : '?';
}

// Mapa t\u00e8cnic \u2192 client predominant (aquell on imputa m\u00e9s hores), a partir de les imputacions.
export function buildUserClientMap(imputData) {
    const userHours = {};
    imputData.forEach(r => {
        const u = absNameKey(r.user);
        const c = r.client || '?';
        if (!userHours[u]) userHours[u] = {};
        userHours[u][c] = (userHours[u][c] || 0) + (r.hours || 0);
    });
    const map = {};
    Object.entries(userHours).forEach(([u, clients]) => {
        map[u] = Object.entries(clients).sort((a, b) => b[1] - a[1])[0][0];
    });
    return map;
}

// Conjunt de t\u00e8cnics (nom normalitzat) d'absData el client predominant dels quals
// (segons les imputacions) est\u00e0 entre els clients indicats.
export function usersForClients(imputData, absData, clients) {
    const map = buildUserClientMap(imputData);
    const allowed = new Set();
    absData.forEach(row => {
        if (clients.includes(map[absNameKey(row.user)] || '?')) allowed.add(row.user);
    });
    return allowed;
}