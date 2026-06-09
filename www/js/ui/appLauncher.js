// =============================================================================
// APP LAUNCHER — Panell de waffle amb accessos a aplicacions externes
// =============================================================================

export function setupAppLauncher() {
    const btn = document.getElementById('btn-app-launcher');
    const panel = document.getElementById('app-launcher');
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        panel.setAttribute('aria-hidden', !isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btn) {
            panel.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            panel.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
            btn.focus();
        }
    });
}
