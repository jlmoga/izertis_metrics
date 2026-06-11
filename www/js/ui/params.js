// =============================================================================
// PARAMS — Visualització de la configuració de clients i projectes
// =============================================================================

import { t } from '../config/i18n.js';

let configData = null;

async function fetchConfig() {
    if (configData) return configData;
    try {
        const res = await fetch('config.json', { cache: 'no-store' });
        configData = await res.json();
    } catch { configData = { customers: [] }; }
    return configData;
}

function field(labelKey, value, type = 'input', opts = {}) {
    const label = t(labelKey);
    const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (type === 'textarea') {
        return `<div class="params-field">
            <label class="params-label">${esc(label)}</label>
            <textarea class="params-input" readonly rows="${opts.rows || 3}">${esc(value)}</textarea>
        </div>`;
    }
    if (type === 'boolean') {
        const cls = value ? 'params-badge params-badge--yes' : 'params-badge params-badge--no';
        const text = value ? t('factValidationYes') : t('factValidationNo');
        return `<div class="params-field params-field--inline">
            <label class="params-label">${esc(label)}</label>
            <span class="${cls}">${text}</span>
        </div>`;
    }
    if (type === 'select') {
        const options = (opts.options || []).map(o =>
            `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`
        ).join('');
        return `<div class="params-field">
            <label class="params-label">${esc(label)}</label>
            <select class="params-input" disabled>${options}</select>
        </div>`;
    }
    return `<div class="params-field">
        <label class="params-label">${esc(label)}</label>
        <input class="params-input" type="text" readonly value="${esc(value)}">
    </div>`;
}

function renderProjectCard(proj, index) {
    const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const costOptions = [
        { value: 'hours', label: t('paramsOptHours') },
        { value: 'days',  label: t('paramsOptDays') },
        { value: 'fixed', label: t('paramsOptFixed') },
    ];
    return `
    <div class="params-project-card" id="params-proj-${index}">
        <button class="params-project-header" data-proj="${index}" aria-expanded="false">
            <i class="ph ph-caret-right params-project-caret"></i>
            <span class="params-project-title">${esc(proj.project_id || t('paramsUnnamed'))}</span>
            <span class="params-project-desc">${esc(proj.project_description || '')}</span>
        </button>
        <div class="params-project-body hidden">
            <div class="params-fields-grid">
                ${field('paramsLblProjectId',   proj.project_id,          'input')}
                ${field('paramsLblProjectDesc',  proj.project_description, 'input')}
                ${field('paramsLblNavision',     proj.project_navision_code, 'input')}
                ${field('paramsLblCostCalc',     proj.cost_calculation,    'select', { options: costOptions })}
                ${field('paramsLblCostFixed',    proj.cost_fixed ?? '',    'input')}
                ${field('paramsLblHPD',          proj.hours_per_day ?? '', 'input')}
                ${field('paramsLblTimeMat',      proj.is_time_materials,   'boolean')}
                ${field('paramsLblOkReq',        proj.ok_required,         'boolean')}
            </div>
            <div class="params-fields-grid params-fields-grid--full">
                ${field('paramsLblValIntro',  proj.validation_intro,        'textarea', { rows: 3 })}
                ${field('paramsLblValObs',    proj.validation_observations, 'textarea', { rows: 3 })}
                ${field('paramsLblOMOIntro',  proj.OMO_intro,               'textarea', { rows: 2 })}
                ${field('paramsLblOMOObs',    proj.OMO_observations,        'textarea', { rows: 3 })}
            </div>
        </div>
    </div>`;
}

function renderDetail(customer) {
    const panel = document.getElementById('params-detail');
    if (!panel) return;
    const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const projects = customer.projects || [];

    panel.innerHTML = `
        <div class="params-detail-header">
            <h2 class="params-detail-title">${esc(customer.customer_name || customer.customer_id)}</h2>
        </div>

        <section class="params-section">
            <h3 class="params-section-title"><i class="ph ph-building-office"></i> ${t('paramsCustomerInfo')}</h3>
            <div class="params-fields-grid">
                ${field('paramsLblCustomerId',   customer.customer_id,   'input')}
                ${field('paramsLblCustomerName', customer.customer_name, 'input')}
            </div>
            <div class="params-fields-grid params-fields-grid--full">
                ${field('paramsLblMailsVal',  customer.list_mails_validation, 'textarea', { rows: 2 })}
                ${field('paramsLblMailsOMO',  customer.list_mails_OMO,        'textarea', { rows: 2 })}
                ${field('paramsLblValIntro',  customer.customer_validation_intro,        'textarea', { rows: 3 })}
                ${field('paramsLblValObs',    customer.customer_validation_observations, 'textarea', { rows: 2 })}
            </div>
        </section>

        <section class="params-section">
            <h3 class="params-section-title"><i class="ph ph-folder-open"></i> ${t('paramsProjects')} <span class="params-project-count">${projects.length}</span></h3>
            <div class="params-projects-list">
                ${projects.map((p, i) => renderProjectCard(p, i)).join('')}
            </div>
        </section>`;

    panel.querySelectorAll('.params-project-header').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx  = btn.dataset.proj;
            const body = document.querySelector(`#params-proj-${idx} .params-project-body`);
            const caret = btn.querySelector('.params-project-caret');
            const open = !body.classList.contains('hidden');
            body.classList.toggle('hidden', open);
            caret.classList.toggle('params-project-caret--open', !open);
            btn.setAttribute('aria-expanded', String(!open));
        });
    });
}

export async function setupParams() {
    const config = await fetchConfig();
    const listEl = document.getElementById('params-customers-list');
    const detailEl = document.getElementById('params-detail');
    if (!listEl || !detailEl) return;

    const customers = config.customers?.filter(c => c.customer_id) || [];

    listEl.innerHTML = customers.map((c, i) => `
        <button class="params-customer-item" data-idx="${i}">
            <span class="params-customer-name">${String(c.customer_name || c.customer_id).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
            <span class="params-customer-sub">${(c.projects || []).length} ${t('paramsProjects').toLowerCase()}</span>
        </button>`).join('');

    if (customers.length > 0) {
        renderDetail(customers[0]);
        listEl.querySelector('.params-customer-item')?.classList.add('active');
    } else {
        detailEl.innerHTML = `<p class="params-empty">${t('paramsNoCustomers')}</p>`;
    }

    listEl.addEventListener('click', e => {
        const btn = e.target.closest('.params-customer-item');
        if (!btn) return;
        listEl.querySelectorAll('.params-customer-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderDetail(customers[parseInt(btn.dataset.idx)]);
    });
}
