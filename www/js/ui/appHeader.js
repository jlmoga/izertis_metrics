// =============================================================================
// APP HEADER — Carrega el partial header.html i l'injecta a cada secció
// =============================================================================

export async function injectSectionHeaders() {
    let html;
    try {
        const res = await fetch('partials/header.html');
        if (!res.ok) return;
        html = await res.text();
    } catch {
        return;
    }

    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();

    const ids = ['home-screen', 'imputacions-screen', 'absencies-screen', 'facturacio-screen'];

    for (const id of ids) {
        const container = document.getElementById(id);
        if (!container) continue;
        container.prepend(tpl.content.cloneNode(true));
    }
}
