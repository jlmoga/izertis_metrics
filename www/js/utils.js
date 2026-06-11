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