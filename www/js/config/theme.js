// =============================================================================
// THEME — Inicialització i canvi de tema (Clar / Fosc)
// =============================================================================

export function initTheme(themeSelect) {
    const saved = localStorage.getItem('moga_theme') || 'theme-light';
    const applied = saved === 'default' ? 'theme-light' : saved;
    document.body.className = applied;
    if (themeSelect) themeSelect.value = applied;
}

export function setTheme(theme) {
    localStorage.setItem('moga_theme', theme);
    document.body.className = theme;
}
