// =============================================================================
// SIDEBAR — Gestió dels modes de visualització de la columna lateral
// Modes: 'links' (icona+text), 'icons' (només icona), 'hidden' (amagada)
// =============================================================================

const STORAGE_KEY = 'moga_sidebar_mode';
const MODES = ['links', 'icons', 'hidden'];

export function setupSidebarMode() {
    const body = document.body;
    const modeBtns = document.querySelectorAll('.sidebar-mode-btn');
    const restoreBtn = document.getElementById('btn-sidebar-restore');

    const saved = localStorage.getItem(STORAGE_KEY) || 'links';
    applyMode(saved);

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyMode(btn.dataset.mode);
        });
    });

    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => applyMode('links'));
    }

    function applyMode(mode) {
        MODES.forEach(m => body.classList.remove(`sidebar-mode-${m}`));
        if (mode !== 'links') body.classList.add(`sidebar-mode-${mode}`);

        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        localStorage.setItem(STORAGE_KEY, mode);
    }
}
