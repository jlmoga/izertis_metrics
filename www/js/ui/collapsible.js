// =============================================================================
// COLLAPSIBLE — Seccions col·lapsables del home
// =============================================================================

const SECTIONS = ['section-year', 'section-curr', 'section-prev', 'section-evolucio', 'section-abs-detail', 'section-overtime'];

export function setupCollapsibleSections() {
    SECTIONS.forEach(id => {
        const section = document.getElementById(id);
        if (!section) return;

        const header = section.querySelector('.stats-row-header');
        if (!header) return;

        const stored = localStorage.getItem(`moga_collapsed_${id}`);
        if (stored === 'true') section.classList.add('collapsed');

        header.addEventListener('click', () => {
            const isNowCollapsed = section.classList.toggle('collapsed');
            localStorage.setItem(`moga_collapsed_${id}`, isNowCollapsed);
        });
    });
}
