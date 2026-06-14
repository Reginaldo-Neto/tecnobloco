'use strict';
/**
 * ManutencaoForms — Renderers de modal para as funções do setor de Manutenção.
 */

// ── Local helpers ─────────────────────────────────────────────────────────────

// Shared helper: open a "Criar OS" sub-modal, call onCreated() on success
async function _mnt_abrirFormCriarOS(user, onCreated) {
  const equips = await (async () => {
    try { const d = await API.get('/manutencao/equipamentos'); return Array.isArray(d) ? d : (d.data || []); } catch { return []; }
  })();
  const today = new Date().toISOString().split('T')[0];
  const { el: e2, close: c2 } = openModal({
    title: 'Nova Ordem de Serviço',
    size: 'md',
    body: `
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Tipo</label>
          <select class="form-control" id="nos-tipo">
            <option value="corretiva" selected>Corretiva</option>
            <option value="preventiva">Preventiva</option>
            <option value="preditiva">Preditiva</option>
            <option value="emergencial">Emergencial</option>
          </select></div>
        <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Prioridade</label>
          <select class="form-control" id="nos-prio">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Equipamento</label>
        <select class="form-control" id="nos-equip">
          <option value="">— Sem equipamento específico —</option>
          ${equips.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}${e.localizacao ? ' — ' + escapeHtml(e.localizacao) : ''}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Descrição do Problema *</label>
        <textarea class="form-control" id="nos-desc" rows="4" placeholder="Descreva detalhadamente o problema ou serviço a realizar..."></textarea></div>
      <div class="form-group"><label class="form-label">Data de Previsão</label>
        <input class="form-control" id="nos-prev" type="date" min="${today}"></div>
      <div id="nos-error"></div>`,
    footer: `<button class="btn btn-secondary" id="nos-cancel">Cancelar</button>
             <button class="btn btn-primary" id="nos-ok">Criar OS</button>`,
  });
  e2.querySelector('#nos-cancel').addEventListener('click', c2);
  e2.querySelector('#nos-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const descricao = e2.querySelector('#nos-desc').value.trim();
      const errDiv = e2.querySelector('#nos-error');
      errDiv.innerHTML = '';
      if (!descricao) { errDiv.innerHTML = '<div class="form-error">Descrição é obrigatória.</div>'; return; }
      try {
        const r = await API.post('/manutencao/os', {
          tipo: e2.querySelector('#nos-tipo').value,
          prioridade: e2.querySelector('#nos-prio').value,
          equipamento_id: e2.querySelector('#nos-equip').value || null,
          descricao,
          data_previsao: e2.querySelector('#nos-prev').value || null,
        });
        const created = r.data || r;
        showToast(`OS ${created.codigo} criada com sucesso!`, 'success');
        c2();
        if (typeof onCreated === 'function') onCreated();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message || 'Erro ao criar OS')}</div>`; }
    });
  });
}

function _mnt_statusBadge(s) {
  const m = { aberta: 'warning', em_andamento: 'info', aguardando_peca: 'muted', concluida: 'success', cancelada: 'danger' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _mnt_tipoBadge(t) {
  const m = { corretiva: 'danger', preventiva: 'info', preditiva: 'success', emergencial: 'danger' };
  return `<span class="badge badge-${m[t]||'muted'}">${escapeHtml(t||'—')}</span>`;
}
function _mnt_rowBg(p) {
  if (p === 'critica') return 'style="background:rgba(239,68,68,0.06);"';
  if (p === 'alta')    return 'style="background:rgba(251,146,60,0.06);"';
  return '';
}
function _mnt_prevColor(dias) {
  if (dias < 0)  return 'color:#f87171;font-weight:600;';
  if (dias <= 7) return 'color:#fb923c;font-weight:600;';
  return 'color:#4ade80;';
}
async function _mnt_loadOpts(ep) {
  try { const d = await API.get(ep); return Array.isArray(d) ? d : (d.data || []); }
  catch { return []; }
}
function _mnt_selOpts(arr, vf, lf, ph) {
  return `<option value="">— ${escapeHtml(ph||'Selecione')} —</option>` +
    arr.map(r => `<option value="${escapeHtml(String(r[vf]))}">${escapeHtml(r[lf]||'')}</option>`).join('');
}
function _mnt_tabs(tabs, activeId) {
  return `<div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border-color);padding-bottom:8px;">
    ${tabs.map(t => `<button class="btn btn-sm ${t.id===activeId?'btn-primary':'btn-secondary'}" data-tab-btn="${t.id}">${t.label}</button>`).join('')}
  </div>
  ${tabs.map(t => `<div data-tab="${t.id}" style="display:${t.id===activeId?'block':'none'};">${t.html||''}</div>`).join('')}`;
}
function _mnt_bindTabs(el) {
  el.querySelectorAll('[data-tab-btn]').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-tab-btn');
      el.querySelectorAll('[data-tab-btn]').forEach(b => b.classList.replace('btn-primary','btn-secondary'));
      this.classList.replace('btn-secondary','btn-primary');
      el.querySelectorAll('[data-tab]').forEach(p => { p.style.display = p.getAttribute('data-tab') === id ? 'block' : 'none'; });
    });
  });
}

// ── ManutencaoForms object ────────────────────────────────────────────────────

const ManutencaoForms = {

  // ── f01 Ver OS Respondidas ───────────────────────────────────────────────────

  async f01VerOsRespondidas(user) {
    const u = user || (window.API && await API.getUser && API.getUser()) || {};
    const nivel = u.nivel_acesso || 0;
    const tabs = [
      { id: 'minhas', label: '📋 Minhas OS', html: `<div id="f01-minhas-wrap"><div class="page-loader"><span class="spinner"></span></div></div>` },
    ];
    if (nivel >= 3) tabs.push({ id: 'todas', label: '📂 Todas as OS', html: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="f01-fil-status" style="width:auto;">
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="aguardando_peca">Aguardando Peça</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select class="form-control" id="f01-fil-prio" style="width:auto;">
          <option value="">Todas prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="f01-filtrar">Filtrar</button>
      </div>
      <div id="f01-todas-wrap"><div class="page-loader"><span class="spinner"></span></div></div>` });

    const { el, close } = openModal({
      title: 'Ordens de Serviço',
      size: 'lg',
      body: _mnt_tabs(tabs, 'minhas'),
      footer: `<button class="btn btn-primary" id="f01-nova-os">+ Nova OS</button>
               <button class="btn btn-secondary" id="f01-close">Fechar</button>`,
    });
    el.querySelector('#f01-close').addEventListener('click', close);
    el.querySelector('#f01-nova-os').addEventListener('click', () => {
      _mnt_abrirFormCriarOS(u, () => {
        // Reload minhas OS tab after creation
        API.get('/manutencao/os/minhas').then(d => _renderOsTable(Array.isArray(d) ? d : (d.data||[]), 'f01-minhas-wrap')).catch(()=>{});
      });
    });
    _mnt_bindTabs(el);

    function _renderOsTable(rows, wrapId) {
      const wrap = el.querySelector(`#${wrapId}`);
      if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📭</span><span class="empty-state-title">Nenhuma OS encontrada</span></div>`; return; }
      wrap.innerHTML = `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr>
        <th>Código</th><th>Equipamento</th><th>Tipo</th><th>Prioridade</th><th>Status</th><th>Abertura</th><th></th>
      </tr></thead><tbody>
        ${rows.map(r => `<tr ${_mnt_rowBg(r.prioridade)}>
          <td><code>${escapeHtml(r.codigo||'—')}</code></td>
          <td>${escapeHtml(r.equipamento_nome||'—')}</td>
          <td>${_mnt_tipoBadge(r.tipo)}</td>
          <td>${_prioridadeBadge(r.prioridade)}</td>
          <td>${_mnt_statusBadge(r.status)}</td>
          <td>${_fmtDate(r.data_abertura)}</td>
          <td><button class="btn btn-sm btn-secondary mnt-detail-btn" data-id="${r.id}">Detalhes</button></td>
        </tr>`).join('')}
      </tbody></table></div>`;
      wrap.querySelectorAll('.mnt-detail-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
          const id = this.getAttribute('data-id');
          try {
            const d = await API.get(`/manutencao/os/${id}`);
            const os = d.data || d;
            const apts = os.apontamentos || [];
            const { close: c2 } = openModal({
              title: `OS ${escapeHtml(os.codigo||'#'+id)}`,
              size: 'lg',
              body: `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                  <div><strong>Equipamento:</strong> ${escapeHtml(os.equipamento_nome||'—')}</div>
                  <div><strong>Tipo:</strong> ${_mnt_tipoBadge(os.tipo)}</div>
                  <div><strong>Prioridade:</strong> ${_prioridadeBadge(os.prioridade)}</div>
                  <div><strong>Status:</strong> ${_mnt_statusBadge(os.status)}</div>
                  <div><strong>Solicitante:</strong> ${escapeHtml(os.solicitante_nome||'—')}</div>
                  <div><strong>Técnico:</strong> ${escapeHtml(os.tecnico_nome||'—')}</div>
                  <div><strong>Abertura:</strong> ${_fmtDate(os.data_abertura)}</div>
                  <div><strong>Previsão:</strong> ${_fmtDate(os.data_previsao)}</div>
                </div>
                <div class="form-group"><strong>Descrição:</strong><div style="margin-top:4px;padding:10px;background:rgba(0,0,0,0.2);border-radius:6px;">${escapeHtml(os.descricao||'—')}</div></div>
                ${os.observacao_tecnico ? `<div class="form-group"><strong>Observação Técnico:</strong><div style="margin-top:4px;padding:10px;background:rgba(0,0,0,0.2);border-radius:6px;">${escapeHtml(os.observacao_tecnico)}</div></div>` : ''}
                ${apts.length ? `<h4 style="margin:12px 0 8px;">Apontamentos (${apts.length})</h4>
                  <table class="table"><thead><tr><th>Data</th><th>Técnico</th><th>Horas</th><th>Serviço</th><th>Peça</th></tr></thead><tbody>
                  ${apts.map(a => `<tr>
                    <td>${_fmtDate(a.data_apontamento)}</td>
                    <td>${escapeHtml(a.tecnico_nome||'—')}</td>
                    <td>${a.horas_trabalhadas||'—'}</td>
                    <td>${escapeHtml(a.descricao_servico||'—')}</td>
                    <td>${escapeHtml(a.peca_nome||'—')}${a.qtd_pecas?' ('+a.qtd_pecas+')':''}</td>
                  </tr>`).join('')}
                  </tbody></table>` : '<p style="color:var(--text-muted);margin-top:8px;">Nenhum apontamento registrado.</p>'}`,
              footer: `<button class="btn btn-secondary" id="os-detail-close">Fechar</button>`,
            });
            document.getElementById('os-detail-close').addEventListener('click', c2);
          } catch(err) { showToast('Erro ao carregar OS: ' + (err.message||''), 'danger'); }
        });
      });
    }

    // Load minhas OS
    (async () => {
      try {
        const d = await API.get('/manutencao/os/minhas');
        _renderOsTable(Array.isArray(d) ? d : (d.data||[]), 'f01-minhas-wrap');
      } catch(err) { el.querySelector('#f01-minhas-wrap').innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar</span></div>'; }
    })();

    // Load todas OS
    if (nivel >= 3) {
      (async () => {
        try {
          const d = await API.get('/manutencao/os');
          _renderOsTable(Array.isArray(d) ? d : (d.data||[]), 'f01-todas-wrap');
        } catch {}
      })();
      el.querySelector('#f01-filtrar') && el.querySelector('#f01-filtrar').addEventListener('click', async () => {
        const status = el.querySelector('#f01-fil-status').value;
        const prioridade = el.querySelector('#f01-fil-prio').value;
        const qs = new URLSearchParams();
        if (status) qs.set('status', status);
        if (prioridade) qs.set('prioridade', prioridade);
        try {
          const d = await API.get('/manutencao/os?' + qs.toString());
          _renderOsTable(Array.isArray(d) ? d : (d.data||[]), 'f01-todas-wrap');
        } catch(err) { showToast('Erro ao filtrar', 'danger'); }
      });
    }
  },

  // ── f02 Gerenciar OS ──────────────────────────────────────────────────────────

  async f02GerenciarOS(user) {
    const { el, close } = openModal({
      title: 'Gerenciar Ordens de Serviço',
      size: 'lg',
      body: `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <select class="form-control" id="f02-fil-status" style="width:auto;">
            <option value="">Todos status</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="aguardando_peca">Aguardando Peça</option>
            <option value="concluida">Concluída</option>
          </select>
          <select class="form-control" id="f02-fil-prio" style="width:auto;">
            <option value="">Todas prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          <select class="form-control" id="f02-fil-tipo" style="width:auto;">
            <option value="">Todos tipos</option>
            <option value="corretiva">Corretiva</option>
            <option value="preventiva">Preventiva</option>
            <option value="preditiva">Preditiva</option>
            <option value="emergencial">Emergencial</option>
          </select>
          <button class="btn btn-sm btn-primary" id="f02-filtrar">Filtrar</button>
        </div>
        <div id="f02-wrap"><div class="page-loader"><span class="spinner"></span></div></div>`,
      footer: `<button class="btn btn-primary" id="f02-nova-os">+ Nova OS</button>
               <button class="btn btn-secondary" id="f02-close">Fechar</button>`,
    });
    el.querySelector('#f02-close').addEventListener('click', close);
    el.querySelector('#f02-nova-os').addEventListener('click', () => _mnt_abrirFormCriarOS(user, loadOS));

    async function loadOS() {
      const qs = new URLSearchParams();
      ['status','prio','tipo'].forEach(k => {
        const v = el.querySelector(`#f02-fil-${k}`)?.value;
        if (v) qs.set(k === 'prio' ? 'prioridade' : k, v);
      });
      const wrap = el.querySelector('#f02-wrap');
      wrap.innerHTML = `<div class="page-loader"><span class="spinner"></span></div>`;
      try {
        const d = await API.get('/manutencao/os?' + qs.toString());
        const rows = Array.isArray(d) ? d : (d.data||[]);
        if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📭</span><span class="empty-state-title">Nenhuma OS encontrada</span></div>`; return; }
        wrap.innerHTML = `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr>
          <th>Código</th><th>Equipamento</th><th>Tipo</th><th>Prioridade</th><th>Status</th><th>Ações</th>
        </tr></thead><tbody>
          ${rows.map(r => `<tr ${_mnt_rowBg(r.prioridade)}>
            <td><code>${escapeHtml(r.codigo||'—')}</code></td>
            <td>${escapeHtml(r.equipamento_nome||'—')}</td>
            <td>${_mnt_tipoBadge(r.tipo)}</td>
            <td>${_prioridadeBadge(r.prioridade)}</td>
            <td>${_mnt_statusBadge(r.status)}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-sm btn-secondary mnt-upd-btn" data-id="${r.id}" data-status="${escapeHtml(r.status)}">Atualizar</button>
              <button class="btn btn-sm btn-secondary mnt-apt-btn" data-id="${r.id}" style="margin-left:4px;">Apontar</button>
            </td>
          </tr>`).join('')}
        </tbody></table></div>`;

        wrap.querySelectorAll('.mnt-upd-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const { el: el2, close: c2 } = openModal({
              title: 'Atualizar Status da OS',
              size: 'md',
              body: `<div class="form-group"><label class="form-label">Novo Status <span style="color:var(--danger)">*</span></label>
                <select class="form-control" id="f02-new-status">
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_peca">Aguardando Peça</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select></div>
                <div class="form-group"><label class="form-label">Observação do Técnico</label>
                  <textarea class="form-control" id="f02-obs" rows="3" placeholder="Descreva a situação atual..."></textarea></div>`,
              footer: `<button class="btn btn-secondary" id="f02-upd-cancel">Cancelar</button>
                       <button class="btn btn-primary" id="f02-upd-ok">Atualizar</button>`,
            });
            el2.querySelector('#f02-upd-cancel').addEventListener('click', c2);
            el2.querySelector('#f02-upd-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                const status = el2.querySelector('#f02-new-status').value;
                const obs = el2.querySelector('#f02-obs').value.trim();
                try {
                  await API.put(`/manutencao/os/${id}/status`, { status, observacao_tecnico: obs });
                  showToast('Status atualizado com sucesso!', 'success');
                  c2(); loadOS();
                } catch(err) { showToast(err.message||'Erro ao atualizar', 'danger'); }
              });
            });
          });
        });

        wrap.querySelectorAll('.mnt-apt-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const today = new Date().toISOString().split('T')[0];
            const { el: el3, close: c3 } = openModal({
              title: 'Registrar Apontamento',
              size: 'md',
              body: `<div style="display:flex;gap:10px;">
                <div class="form-group" style="flex:1;"><label class="form-label">Data *</label><input class="form-control" id="f02-apt-data" type="date" value="${today}"></div>
                <div class="form-group" style="flex:1;"><label class="form-label">Horas Trabalhadas</label><input class="form-control" id="f02-apt-horas" type="number" min="0" step="0.5" placeholder="Ex: 2.5"></div>
              </div>
              <div class="form-group"><label class="form-label">Descrição do Serviço *</label><textarea class="form-control" id="f02-apt-desc" rows="3" placeholder="Descreva o serviço realizado..."></textarea></div>`,
              footer: `<button class="btn btn-secondary" id="f02-apt-cancel">Cancelar</button>
                       <button class="btn btn-primary" id="f02-apt-ok">Registrar</button>`,
            });
            el3.querySelector('#f02-apt-cancel').addEventListener('click', c3);
            el3.querySelector('#f02-apt-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                const data_apontamento = el3.querySelector('#f02-apt-data').value;
                const horas_trabalhadas = el3.querySelector('#f02-apt-horas').value;
                const descricao_servico = el3.querySelector('#f02-apt-desc').value.trim();
                if (!data_apontamento) { showToast('Informe a data', 'danger'); return; }
                if (!descricao_servico) { showToast('Informe a descrição do serviço', 'danger'); return; }
                try {
                  await API.post(`/manutencao/os/${id}/apontar`, { data_apontamento, horas_trabalhadas: Number(horas_trabalhadas)||null, descricao_servico });
                  showToast('Apontamento registrado!', 'success'); c3();
                } catch(err) { showToast(err.message||'Erro ao apontar', 'danger'); }
              });
            });
          });
        });
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar OS</span></div>`; }
    }

    el.querySelector('#f02-filtrar').addEventListener('click', loadOS);
    loadOS();
  },

  // ── f03 Apontamento de Horas e Materiais ──────────────────────────────────────

  async f03ApontamentoHorasMateriais(user) {
    const today = new Date().toISOString().split('T')[0];
    const { el, close } = openModal({
      title: 'Apontamento de Horas e Materiais',
      size: 'lg',
      body: `
        <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:12px;">Nova Entrada</h4>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:2;min-width:200px;">
            <label class="form-label">Ordem de Serviço *</label>
            <select class="form-control" id="f03-os"><option value="">Carregando...</option></select>
          </div>
          <div class="form-group" style="flex:1;min-width:120px;">
            <label class="form-label">Data *</label>
            <input class="form-control" id="f03-data" type="date" value="${today}">
          </div>
          <div class="form-group" style="flex:1;min-width:100px;">
            <label class="form-label">Horas</label>
            <input class="form-control" id="f03-horas" type="number" min="0" step="0.5" placeholder="2.5">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição do Serviço *</label>
          <textarea class="form-control" id="f03-desc" rows="3" placeholder="Descreva o trabalho realizado..."></textarea>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:2;min-width:200px;">
            <label class="form-label">Peça Consumida (opcional)</label>
            <select class="form-control" id="f03-peca"><option value="">— Nenhuma —</option></select>
          </div>
          <div class="form-group" style="flex:1;min-width:100px;">
            <label class="form-label">Quantidade</label>
            <input class="form-control" id="f03-qtd" type="number" min="0" step="0.5">
          </div>
        </div>
        <div id="f03-error"></div>
        <hr style="margin:16px 0;">
        <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;">Apontamentos Recentes</h4>
        <div id="f03-hist-wrap"><div class="page-loader"><span class="spinner"></span></div></div>`,
      footer: `<button class="btn btn-secondary" id="f03-cancel">Cancelar</button>
               <button class="btn btn-primary" id="f03-submit">Registrar Apontamento</button>`,
    });
    el.querySelector('#f03-cancel').addEventListener('click', close);

    // Load OS options
    (async () => {
      const os = await _mnt_loadOpts('/manutencao/os?status=aberta');
      const os2 = await _mnt_loadOpts('/manutencao/os?status=em_andamento');
      const all = [...os, ...os2];
      el.querySelector('#f03-os').innerHTML = _mnt_selOpts(all, 'id', 'codigo', 'Selecione a OS') +
        all.map(r => `<option value="${r.id}">${escapeHtml(r.codigo||'OS#'+r.id)} — ${escapeHtml(r.equipamento_nome||'sem equipamento')}</option>`).join('');
      // simpler — replace full list
      el.querySelector('#f03-os').innerHTML = `<option value="">— Selecione a OS —</option>` +
        all.map(r => `<option value="${r.id}">${escapeHtml(r.codigo||'OS#'+r.id)} — ${escapeHtml(r.equipamento_nome||'')}</option>`).join('');
    })();

    // Load parts
    (async () => {
      const pecas = await _mnt_loadOpts('/manutencao/pecas');
      el.querySelector('#f03-peca').innerHTML = `<option value="">— Nenhuma —</option>` +
        pecas.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (saldo: ${p.saldo_atual})</option>`).join('');
    })();

    // Load history
    async function loadHist() {
      const wrap = el.querySelector('#f03-hist-wrap');
      try {
        const d = await API.get('/manutencao/os/minhas');
        const rows = Array.isArray(d) ? d : (d.data||[]);
        if (!rows.length) { wrap.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">Nenhum registro ainda.</p>`; return; }
        wrap.innerHTML = `<div style="overflow-x:auto;max-height:200px;overflow-y:auto;">
          <table class="table table-hover" style="font-size:0.85rem;">
            <thead><tr><th>OS</th><th>Equipamento</th><th>Status</th><th>Abertura</th></tr></thead>
            <tbody>${rows.slice(0,10).map(r => `<tr>
              <td><code>${escapeHtml(r.codigo||'—')}</code></td>
              <td>${escapeHtml(r.equipamento_nome||'—')}</td>
              <td>${_mnt_statusBadge(r.status)}</td>
              <td>${_fmtDate(r.data_abertura)}</td>
            </tr>`).join('')}</tbody>
          </table></div>`;
      } catch { wrap.innerHTML = ''; }
    }
    loadHist();

    el.querySelector('#f03-submit').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const os_id = el.querySelector('#f03-os').value;
        const data_apontamento = el.querySelector('#f03-data').value;
        const horas_trabalhadas = el.querySelector('#f03-horas').value;
        const descricao_servico = el.querySelector('#f03-desc').value.trim();
        const peca_id = el.querySelector('#f03-peca').value;
        const qtd_pecas = el.querySelector('#f03-qtd').value;
        const errDiv = el.querySelector('#f03-error');
        errDiv.innerHTML = '';
        if (!os_id)           { errDiv.innerHTML = '<div class="form-error">Selecione a OS.</div>'; return; }
        if (!data_apontamento){ errDiv.innerHTML = '<div class="form-error">Informe a data.</div>'; return; }
        if (!descricao_servico){ errDiv.innerHTML = '<div class="form-error">Descreva o serviço.</div>'; return; }
        try {
          await API.post(`/manutencao/os/${os_id}/apontar`, {
            data_apontamento,
            horas_trabalhadas: horas_trabalhadas ? Number(horas_trabalhadas) : null,
            descricao_servico,
            peca_id: peca_id || null,
            qtd_pecas: qtd_pecas ? Number(qtd_pecas) : null,
          });
          showToast('Apontamento registrado com sucesso!', 'success');
          el.querySelector('#f03-desc').value = '';
          el.querySelector('#f03-horas').value = '';
          el.querySelector('#f03-qtd').value = '';
          el.querySelector('#f03-peca').value = '';
          loadHist();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro ao registrar')}</div>`; }
      });
    });
  },

  // ── f04 Plano Mestre de Manutenção ────────────────────────────────────────────

  async f04PlanoMestreManutencao(user) {
    const { el, close } = openModal({
      title: 'Plano Mestre de Manutenção',
      size: 'lg',
      body: _mnt_tabs([
        { id: 'planos', label: '📋 Planos Preventivos', html: `<div id="f04-planos-wrap"><div class="page-loader"><span class="spinner"></span></div></div>` },
        { id: 'novo',   label: '➕ Novo Plano', html: `
          <form id="f04-form" novalidate>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:2;min-width:200px;"><label class="form-label">Equipamento</label><select class="form-control" id="f04-equip"><option value="">— Selecione —</option></select></div>
              <div class="form-group" style="flex:2;min-width:200px;"><label class="form-label">Título *</label><input class="form-control" id="f04-titulo" maxlength="200" placeholder="Ex: Troca de filtro de óleo"></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Tipo *</label>
                <select class="form-control" id="f04-tipo">
                  <option value="preventiva">Preventiva</option>
                  <option value="preditiva">Preditiva</option>
                  <option value="lubrificacao">Lubrificação</option>
                  <option value="calibracao">Calibração</option>
                  <option value="inspecao">Inspeção</option>
                  <option value="utilidades">Utilidades</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Frequência</label>
                <select class="form-control" id="f04-freq">
                  <option value="diaria">Diária</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal" selected>Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Próxima Data *</label><input class="form-control" id="f04-data" type="date"></div>
              <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Duração (h)</label><input class="form-control" id="f04-dur" type="number" min="0" step="0.5"></div>
            </div>
            <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-control" id="f04-desc" rows="2"></textarea></div>
            <div class="form-group"><label class="form-label">Checklist (um item por linha)</label><textarea class="form-control" id="f04-check" rows="3" placeholder="Verificar nível de óleo&#10;Limpar filtros&#10;Lubrificar rolamentos"></textarea></div>
            <div id="f04-error"></div>
          </form>` },
      ], 'planos'),
      footer: `<button class="btn btn-secondary" id="f04-close">Fechar</button>
               <button class="btn btn-primary" id="f04-salvar" style="display:none;">Criar Plano</button>`,
    });
    el.querySelector('#f04-close').addEventListener('click', close);
    _mnt_bindTabs(el);

    // Show/hide save button
    el.querySelectorAll('[data-tab-btn]').forEach(btn => {
      btn.addEventListener('click', function() {
        el.querySelector('#f04-salvar').style.display = this.getAttribute('data-tab-btn') === 'novo' ? '' : 'none';
      });
    });

    // Load equipamentos
    (async () => {
      const equips = await _mnt_loadOpts('/manutencao/equipamentos');
      el.querySelector('#f04-equip').innerHTML = `<option value="">— Nenhum específico —</option>` +
        equips.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('');
    })();

    // Load planos
    async function loadPlanos() {
      const wrap = el.querySelector('#f04-planos-wrap');
      try {
        const d = await API.get('/manutencao/preventiva');
        const rows = Array.isArray(d) ? d : (d.data||[]);
        if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📅</span><span class="empty-state-title">Nenhum plano preventivo cadastrado</span></div>`; return; }
        wrap.innerHTML = `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr>
          <th>Equipamento</th><th>Título</th><th>Tipo</th><th>Frequência</th><th>Próxima Data</th><th>Responsável</th><th>Ações</th>
        </tr></thead><tbody>
          ${rows.map(r => {
            const dias = Number(r.dias_ate_vencimento);
            const dateStyle = _mnt_prevColor(dias);
            return `<tr>
              <td>${escapeHtml(r.equipamento_nome||'—')}</td>
              <td>${escapeHtml(r.titulo)}</td>
              <td><span class="badge badge-info">${escapeHtml(r.tipo)}</span></td>
              <td>${escapeHtml(r.frequencia_tipo)}</td>
              <td><span style="${dateStyle}">${_fmtDate(r.proxima_data)}</span>${dias < 0 ? ' <span class="badge badge-danger">VENCIDA</span>' : dias <= 7 ? ' <span class="badge badge-warning">'+dias+'d</span>' : ''}</td>
              <td>${escapeHtml(r.responsavel_nome||'—')}</td>
              <td><button class="btn btn-sm btn-primary mnt-exec-btn" data-id="${r.id}">▶ Executar</button>
                  <button class="btn btn-sm btn-secondary mnt-inativ-btn" data-id="${r.id}" data-ativo="${r.ativo}" style="margin-left:4px;">${r.ativo?'Desativar':'Ativar'}</button></td>
            </tr>`;
          }).join('')}
        </tbody></table></div>`;

        wrap.querySelectorAll('.mnt-exec-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const { el: e2, close: c2 } = openModal({
              title: 'Registrar Execução',
              size: 'sm',
              body: `<div class="form-group"><label class="form-label">Observações</label><textarea class="form-control" id="f04-exec-obs" rows="3" placeholder="Descreva o que foi feito..."></textarea></div>`,
              footer: `<button class="btn btn-secondary" id="f04-exec-cancel">Cancelar</button><button class="btn btn-primary" id="f04-exec-ok">Confirmar Execução</button>`,
            });
            e2.querySelector('#f04-exec-cancel').addEventListener('click', c2);
            e2.querySelector('#f04-exec-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                const obs = e2.querySelector('#f04-exec-obs').value.trim();
                try {
                  const r = await API.post(`/manutencao/preventiva/${id}/executar`, { observacoes: obs });
                  const pr = r.data || r;
                  showToast(`Executada! Próxima: ${_fmtDate(pr.proxima_data)}`, 'success');
                  c2(); loadPlanos();
                } catch(err) { showToast(err.message||'Erro', 'danger'); }
              });
            });
          });
        });

        wrap.querySelectorAll('.mnt-inativ-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');
            const ativo = this.getAttribute('data-ativo') === '1' ? 0 : 1;
            try {
              await API.put(`/manutencao/preventiva/${id}`, { ativo });
              showToast(ativo ? 'Plano ativado!' : 'Plano desativado!', 'success');
              loadPlanos();
            } catch(err) { showToast(err.message||'Erro', 'danger'); }
          });
        });
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar planos</span></div>`; }
    }
    loadPlanos();

    el.querySelector('#f04-salvar').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const titulo = el.querySelector('#f04-titulo').value.trim();
        const proxima_data = el.querySelector('#f04-data').value;
        const errDiv = el.querySelector('#f04-error');
        errDiv.innerHTML = '';
        if (!titulo)       { errDiv.innerHTML = '<div class="form-error">Informe o título.</div>'; return; }
        if (!proxima_data) { errDiv.innerHTML = '<div class="form-error">Informe a próxima data.</div>'; return; }
        const checkText = el.querySelector('#f04-check').value;
        const checklist = checkText.split('\n').map(s => s.trim()).filter(Boolean);
        try {
          await API.post('/manutencao/preventiva', {
            equipamento_id: el.querySelector('#f04-equip').value || null,
            titulo,
            tipo: el.querySelector('#f04-tipo').value,
            frequencia_tipo: el.querySelector('#f04-freq').value,
            proxima_data,
            duracao_estimada_h: el.querySelector('#f04-dur').value || null,
            descricao: el.querySelector('#f04-desc').value.trim() || null,
            checklist,
          });
          showToast('Plano preventivo criado com sucesso!', 'success');
          el.querySelector('#f04-form').reset();
          // Switch to planos tab
          el.querySelector('[data-tab-btn="planos"]').click();
          loadPlanos();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  },

  // ── f05 Árvore de Ativos ──────────────────────────────────────────────────────

  async f05ArvoreAtivos(user) {
    const u = user || {};
    const nivel = u.nivel_acesso || 0;
    const { el, close } = openModal({
      title: 'Árvore de Ativos',
      size: 'lg',
      body: `
        ${nivel >= 4 ? `<div style="text-align:right;margin-bottom:12px;"><button class="btn btn-sm btn-primary" id="f05-add-btn">+ Adicionar Nó</button></div>` : ''}
        <div id="f05-tree-wrap"><div class="page-loader"><span class="spinner"></span></div></div>`,
      footer: `<button class="btn btn-secondary" id="f05-close">Fechar</button>`,
    });
    el.querySelector('#f05-close').addEventListener('click', close);

    const TIPO_BADGE = { fabrica: 'info', setor: 'muted', equipamento: 'success', componente: 'muted', sistema: 'warning' };
    const TIPO_INDENT = { fabrica: 0, setor: 1, equipamento: 2, componente: 3, sistema: 2 };

    function buildTree(nodes) {
      const byParent = {};
      nodes.forEach(n => {
        const k = n.parent_id || 'root';
        if (!byParent[k]) byParent[k] = [];
        byParent[k].push(n);
      });
      function renderNode(n, depth) {
        const indent = depth * 20;
        const children = byParent[n.id] || [];
        const hasChildren = children.length > 0;
        const childId = `f05-children-${n.id}`;
        return `<div style="margin-left:${indent}px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:6px;">
            ${hasChildren ? `<button class="btn btn-sm" style="min-width:24px;padding:0 4px;" data-toggle="${childId}">▼</button>` : '<span style="min-width:24px;display:inline-block;"></span>'}
            <span class="badge badge-${TIPO_BADGE[n.tipo]||'muted'}" style="font-size:0.7rem;">${escapeHtml(n.tipo)}</span>
            <strong>${escapeHtml(n.codigo)}</strong>
            <span>${escapeHtml(n.nome)}</span>
            ${n.localizacao ? `<span style="color:var(--text-muted);font-size:0.8rem;">📍 ${escapeHtml(n.localizacao)}</span>` : ''}
            ${n.equip_nome ? `<span style="color:var(--text-muted);font-size:0.8rem;">🔧 ${escapeHtml(n.equip_nome)}</span>` : ''}
          </div>
          ${hasChildren ? `<div id="${childId}">${children.map(c => renderNode(c, depth+1)).join('')}</div>` : ''}
        </div>`;
      }
      const roots = byParent['root'] || [];
      return roots.map(n => renderNode(n, 0)).join('') || `<div class="empty-state"><span class="empty-state-icon">🌳</span><span class="empty-state-title">Árvore de ativos vazia</span></div>`;
    }

    async function loadTree() {
      const wrap = el.querySelector('#f05-tree-wrap');
      try {
        const d = await API.get('/manutencao/ativos');
        const nodes = Array.isArray(d) ? d : (d.data||[]);
        wrap.innerHTML = buildTree(nodes);
        wrap.querySelectorAll('[data-toggle]').forEach(btn => {
          btn.addEventListener('click', function() {
            const target = document.getElementById(this.getAttribute('data-toggle'));
            if (!target) return;
            const hidden = target.style.display === 'none';
            target.style.display = hidden ? '' : 'none';
            this.textContent = hidden ? '▼' : '▶';
          });
        });
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar</span></div>`; }
    }
    loadTree();

    if (nivel >= 4) {
      el.querySelector('#f05-add-btn').addEventListener('click', async () => {
        const equips = await _mnt_loadOpts('/manutencao/equipamentos');
        const d = await API.get('/manutencao/ativos');
        const ativos = Array.isArray(d) ? d : (d.data||[]);
        const { el: e2, close: c2 } = openModal({
          title: 'Adicionar Nó na Árvore',
          size: 'md',
          body: `<div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Código *</label><input class="form-control" id="f05-n-cod" maxlength="50" placeholder="FAB-01"></div>
            <div class="form-group" style="flex:2;min-width:200px;"><label class="form-label">Nome *</label><input class="form-control" id="f05-n-nome" maxlength="200"></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Tipo *</label>
              <select class="form-control" id="f05-n-tipo">
                <option value="fabrica">Fábrica</option>
                <option value="setor">Setor</option>
                <option value="equipamento">Equipamento</option>
                <option value="componente" selected>Componente</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Nó Pai</label>
              <select class="form-control" id="f05-n-parent">
                <option value="">— Raiz —</option>
                ${ativos.map(a => `<option value="${a.id}">${escapeHtml(a.codigo+' — '+a.nome)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Localização</label><input class="form-control" id="f05-n-loc" maxlength="200"></div>
          <div class="form-group"><label class="form-label">Equipamento Vinculado</label>
            <select class="form-control" id="f05-n-equip">
              <option value="">— Nenhum —</option>
              ${equips.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('')}
            </select>
          </div>
          <div id="f05-n-error"></div>`,
          footer: `<button class="btn btn-secondary" id="f05-n-cancel">Cancelar</button><button class="btn btn-primary" id="f05-n-ok">Adicionar</button>`,
        });
        e2.querySelector('#f05-n-cancel').addEventListener('click', c2);
        e2.querySelector('#f05-n-ok').addEventListener('click', function() {
          _withSubmit(this, async () => {
            const codigo = e2.querySelector('#f05-n-cod').value.trim();
            const nome = e2.querySelector('#f05-n-nome').value.trim();
            const errDiv = e2.querySelector('#f05-n-error');
            errDiv.innerHTML = '';
            if (!codigo) { errDiv.innerHTML = '<div class="form-error">Código obrigatório.</div>'; return; }
            if (!nome)   { errDiv.innerHTML = '<div class="form-error">Nome obrigatório.</div>'; return; }
            try {
              await API.post('/manutencao/ativos', {
                codigo, nome,
                tipo: e2.querySelector('#f05-n-tipo').value,
                parent_id: e2.querySelector('#f05-n-parent').value || null,
                localizacao: e2.querySelector('#f05-n-loc').value.trim() || null,
                equipamento_id: e2.querySelector('#f05-n-equip').value || null,
              });
              showToast('Nó adicionado com sucesso!', 'success');
              c2(); loadTree();
            } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
          });
        });
      });
    }
  },

  // ── f06 Prontuário do Equipamento ─────────────────────────────────────────────

  async f06ProntuarioEquipamento(user) {
    const { el, close } = openModal({
      title: 'Prontuário do Equipamento',
      size: 'lg',
      body: `<div class="form-group">
        <label class="form-label">Selecione o Equipamento</label>
        <select class="form-control" id="f06-equip"><option value="">Carregando...</option></select>
      </div>
      <div id="f06-prontuario-wrap"></div>`,
      footer: `<button class="btn btn-secondary" id="f06-close">Fechar</button>
               <button class="btn btn-primary" id="f06-ver">Ver Prontuário</button>`,
    });
    el.querySelector('#f06-close').addEventListener('click', close);

    (async () => {
      const equips = await _mnt_loadOpts('/manutencao/equipamentos');
      el.querySelector('#f06-equip').innerHTML = `<option value="">— Selecione um equipamento —</option>` +
        equips.map(e => `<option value="${e.id}">${escapeHtml(e.nome)} — ${escapeHtml(e.localizacao||'')}</option>`).join('');
    })();

    el.querySelector('#f06-ver').addEventListener('click', async function() {
      const id = el.querySelector('#f06-equip').value;
      if (!id) { showToast('Selecione um equipamento.', 'danger'); return; }
      const wrap = el.querySelector('#f06-prontuario-wrap');
      wrap.innerHTML = `<div class="page-loader"><span class="spinner"></span></div>`;
      try {
        const d = await API.get(`/manutencao/equipamentos/${id}/prontuario`);
        const p = d.data || d;
        const eq = p.equipamento || {};
        const STATUS_COLOR = { operacional: '#4ade80', em_manutencao: '#fb923c', inativo: '#6b7280', sucata: '#f87171' };
        wrap.innerHTML = `
          <hr style="margin:16px 0;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
            <div><strong>Nome:</strong> ${escapeHtml(eq.nome||'—')}</div>
            <div><strong>Status:</strong> <span style="color:${STATUS_COLOR[eq.status]||'inherit'}">● ${escapeHtml(eq.status||'—')}</span></div>
            <div><strong>Fabricante:</strong> ${escapeHtml(eq.fabricante||'—')}</div>
            <div><strong>Modelo:</strong> ${escapeHtml(eq.modelo||'—')}</div>
            <div><strong>Localização:</strong> ${escapeHtml(eq.localizacao||'—')}</div>
            <div><strong>Nº Série:</strong> ${escapeHtml(eq.num_serie||'—')}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total OS</span></div><div class="stat-card-value" style="font-size:1.5rem;">${p.totais?.total_os||0}</div></div>
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total Horas</span></div><div class="stat-card-value" style="font-size:1.5rem;">${Number(p.totais?.total_horas||0).toFixed(1)}h</div></div>
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Custo Total</span></div><div class="stat-card-value" style="font-size:1.5rem;">${_fmtMoney(p.totais?.custo_total)}</div></div>
          </div>
          <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;">Histórico de OS (${(p.os||[]).length})</h4>
          ${(p.os||[]).length ? `<div style="overflow-x:auto;max-height:200px;overflow-y:auto;">
            <table class="table table-hover" style="font-size:0.85rem;"><thead><tr>
              <th>Código</th><th>Tipo</th><th>Prioridade</th><th>Status</th><th>Técnico</th><th>Abertura</th><th>Horas</th>
            </tr></thead><tbody>
              ${(p.os).map(o => `<tr>
                <td><code>${escapeHtml(o.codigo||'—')}</code></td>
                <td>${_mnt_tipoBadge(o.tipo)}</td>
                <td>${_prioridadeBadge(o.prioridade)}</td>
                <td>${_mnt_statusBadge(o.status)}</td>
                <td>${escapeHtml(o.tecnico_nome||'—')}</td>
                <td>${_fmtDate(o.data_abertura)}</td>
                <td>${Number(o.total_horas||0).toFixed(1)}</td>
              </tr>`).join('')}
            </tbody></table></div>` : '<p style="color:var(--text-muted);">Nenhuma OS registrada.</p>'}`;
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`; }
    });
  },

  // ── f07 Gestão de Estoque de Peças ────────────────────────────────────────────

  async f07GestaoEstoquePecas(user) {
    const { el, close } = openModal({
      title: 'Estoque de Peças (MRO)',
      size: 'lg',
      body: _mnt_tabs([
        { id: 'estoque', label: '📦 Estoque', html: `
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <input class="form-control" id="f07-busca" placeholder="Buscar peça..." style="flex:2;">
            <select class="form-control" id="f07-cat" style="flex:1;">
              <option value="">Todas categorias</option>
              ${['rolamento','correia','filtro','lubrificante','eletrico','hidraulico','pneumatico','vedacao','fixacao','outro'].map(c =>
                `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-secondary" id="f07-filtrar">Filtrar</button>
          </div>
          <div id="f07-estoque-wrap"><div class="page-loader"><span class="spinner"></span></div></div>` },
        { id: 'cadastrar', label: '➕ Cadastrar Peça', html: `
          <form id="f07-form" novalidate>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Código</label><input class="form-control" id="f07-cod" maxlength="50" placeholder="ROL-001"></div>
              <div class="form-group" style="flex:3;min-width:200px;"><label class="form-label">Nome *</label><input class="form-control" id="f07-nome" maxlength="200"></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Categoria *</label>
                <select class="form-control" id="f07-cat2">
                  ${['rolamento','correia','filtro','lubrificante','eletrico','hidraulico','pneumatico','vedacao','fixacao','outro'].map(c =>
                    `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Unidade</label><input class="form-control" id="f07-uni" value="un" maxlength="20"></div>
              <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Saldo Inicial</label><input class="form-control" id="f07-si" type="number" min="0" step="1" value="0"></div>
              <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Saldo Mínimo *</label><input class="form-control" id="f07-sm" type="number" min="0" step="1" value="1"></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Localização</label><input class="form-control" id="f07-loc" placeholder="Ex: Prateleira A-3"></div>
              <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Preço Unit (R$)</label><input class="form-control" id="f07-preco" type="number" min="0" step="0.01"></div>
            </div>
            <div id="f07-error"></div>
          </form>` },
      ], 'estoque'),
      footer: `<button class="btn btn-secondary" id="f07-close">Fechar</button>
               <button class="btn btn-primary" id="f07-salvar" style="display:none;">Cadastrar Peça</button>`,
    });
    el.querySelector('#f07-close').addEventListener('click', close);
    _mnt_bindTabs(el);
    el.querySelectorAll('[data-tab-btn]').forEach(btn => {
      btn.addEventListener('click', function() {
        el.querySelector('#f07-salvar').style.display = this.getAttribute('data-tab-btn') === 'cadastrar' ? '' : 'none';
      });
    });

    async function loadEstoque() {
      const busca = el.querySelector('#f07-busca').value.trim();
      const cat = el.querySelector('#f07-cat').value;
      const qs = new URLSearchParams();
      if (busca) qs.set('busca', busca);
      if (cat)   qs.set('categoria', cat);
      const wrap = el.querySelector('#f07-estoque-wrap');
      wrap.innerHTML = `<div class="page-loader"><span class="spinner"></span></div>`;
      try {
        const d = await API.get('/manutencao/pecas?' + qs.toString());
        const rows = Array.isArray(d) ? d : (d.data||[]);
        if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📦</span><span class="empty-state-title">Nenhuma peça encontrada</span></div>`; return; }
        wrap.innerHTML = `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr>
          <th>Código</th><th>Nome</th><th>Categoria</th><th>Saldo</th><th>Mínimo</th><th>Localização</th><th>Preço</th><th></th>
        </tr></thead><tbody>
          ${rows.map(r => `<tr>
            <td><code>${escapeHtml(r.codigo||'—')}</code></td>
            <td>${escapeHtml(r.nome)}</td>
            <td><span class="badge badge-muted">${escapeHtml(r.categoria)}</span></td>
            <td style="${r.estoque_critico ? 'color:#f87171;font-weight:600;' : ''}">${r.saldo_atual}${r.estoque_critico ? ' ⚠️' : ''}</td>
            <td>${r.saldo_minimo}</td>
            <td>${escapeHtml(r.localizacao_estoque||'—')}</td>
            <td>${_fmtMoney(r.preco_unitario)}</td>
            <td><button class="btn btn-sm btn-secondary mnt-mov-btn" data-id="${r.id}" data-nome="${escapeHtml(r.nome)}">Movimentar</button></td>
          </tr>`).join('')}
        </tbody></table></div>`;

        wrap.querySelectorAll('.mnt-mov-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const nome = this.getAttribute('data-nome');
            const { el: e2, close: c2 } = openModal({
              title: `Movimentar: ${nome}`,
              size: 'sm',
              body: `<div style="display:flex;gap:10px;">
                <div class="form-group" style="flex:1;"><label class="form-label">Tipo *</label>
                  <select class="form-control" id="f07-mov-tipo">
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="ajuste">Ajuste de Inventário</option>
                  </select>
                </div>
                <div class="form-group" style="flex:1;"><label class="form-label">Quantidade *</label>
                  <input class="form-control" id="f07-mov-qtd" type="number" min="0.5" step="0.5">
                </div>
              </div>
              <div class="form-group"><label class="form-label">Motivo</label>
                <textarea class="form-control" id="f07-mov-motivo" rows="2" placeholder="Descreva a movimentação..."></textarea>
              </div>
              <div id="f07-mov-error"></div>`,
              footer: `<button class="btn btn-secondary" id="f07-mov-cancel">Cancelar</button><button class="btn btn-primary" id="f07-mov-ok">Registrar</button>`,
            });
            e2.querySelector('#f07-mov-cancel').addEventListener('click', c2);
            e2.querySelector('#f07-mov-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                const tipo = e2.querySelector('#f07-mov-tipo').value;
                const qtd = e2.querySelector('#f07-mov-qtd').value;
                const motivo = e2.querySelector('#f07-mov-motivo').value.trim();
                const errDiv = e2.querySelector('#f07-mov-error');
                errDiv.innerHTML = '';
                if (!qtd || Number(qtd) <= 0) { errDiv.innerHTML = '<div class="form-error">Informe a quantidade.</div>'; return; }
                try {
                  const r = await API.post(`/manutencao/pecas/${id}/movimentar`, { tipo, quantidade: Number(qtd), motivo });
                  const res = r.data || r;
                  showToast(`Movimentação registrada! Saldo atual: ${res.saldo_atual}`, 'success');
                  c2(); loadEstoque();
                } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
              });
            });
          });
        });
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar estoque</span></div>`; }
    }
    loadEstoque();
    el.querySelector('#f07-filtrar').addEventListener('click', loadEstoque);

    el.querySelector('#f07-salvar').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const nome = el.querySelector('#f07-nome').value.trim();
        const saldo_minimo = el.querySelector('#f07-sm').value;
        const errDiv = el.querySelector('#f07-error');
        errDiv.innerHTML = '';
        if (!nome) { errDiv.innerHTML = '<div class="form-error">Nome obrigatório.</div>'; return; }
        if (!saldo_minimo || Number(saldo_minimo) < 0) { errDiv.innerHTML = '<div class="form-error">Saldo mínimo inválido.</div>'; return; }
        try {
          await API.post('/manutencao/pecas', {
            codigo: el.querySelector('#f07-cod').value.trim() || null,
            nome, categoria: el.querySelector('#f07-cat2').value,
            unidade: el.querySelector('#f07-uni').value || 'un',
            saldo_inicial: Number(el.querySelector('#f07-si').value) || 0,
            saldo_minimo: Number(saldo_minimo),
            localizacao_estoque: el.querySelector('#f07-loc').value.trim() || null,
            preco_unitario: el.querySelector('#f07-preco').value || null,
          });
          showToast('Peça cadastrada com sucesso!', 'success');
          el.querySelector('#f07-form').reset();
          el.querySelector('[data-tab-btn="estoque"]').click();
          loadEstoque();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  },

  // ── f08 Solicitação de Compra de Peças ────────────────────────────────────────

  async f08SolicitacaoCompraPecas(user) {
    // Reuse global F07 if available
    if (typeof GlobalForms !== 'undefined' && typeof GlobalForms.f07SolicitarCompra === 'function') {
      return GlobalForms.f07SolicitarCompra(user);
    }
    // Standalone fallback
    const { el, close } = openModal({
      title: 'Solicitar Compra de Peças',
      size: 'md',
      body: `<form id="f08-form" novalidate>
        <div class="form-group"><label class="form-label">Descrição do Item *</label>
          <input class="form-control" id="f08-item" maxlength="300" placeholder="Ex: Rolamento 6205 2RS — para bomba centrífuga"></div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1;"><label class="form-label">Quantidade *</label>
            <input class="form-control" id="f08-qtd" type="number" min="1" step="1" value="1"></div>
          <div class="form-group" style="flex:1;"><label class="form-label">Urgência</label>
            <select class="form-control" id="f08-urg">
              <option value="baixa">Baixa (normal)</option>
              <option value="media" selected>Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Justificativa *</label>
          <textarea class="form-control" id="f08-just" rows="3" placeholder="Explique a necessidade e onde será usada a peça..."></textarea></div>
        <div id="f08-error"></div>
      </form>`,
      footer: `<button class="btn btn-secondary" id="f08-cancel">Cancelar</button>
               <button class="btn btn-primary" id="f08-submit">Solicitar Compra</button>`,
    });
    el.querySelector('#f08-cancel').addEventListener('click', close);
    el.querySelector('#f08-submit').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const item_descricao = el.querySelector('#f08-item').value.trim();
        const quantidade = el.querySelector('#f08-qtd').value;
        const justificativa = el.querySelector('#f08-just').value.trim();
        const errDiv = el.querySelector('#f08-error');
        errDiv.innerHTML = '';
        if (!item_descricao) { errDiv.innerHTML = '<div class="form-error">Informe o item.</div>'; return; }
        if (!quantidade || Number(quantidade) < 1) { errDiv.innerHTML = '<div class="form-error">Quantidade inválida.</div>'; return; }
        if (!justificativa) { errDiv.innerHTML = '<div class="form-error">Justificativa obrigatória.</div>'; return; }
        try {
          await API.post('/global/compras', {
            item_descricao, quantidade: Number(quantidade),
            urgencia: el.querySelector('#f08-urg').value,
            justificativa,
          });
          showToast('Solicitação de compra enviada com sucesso!', 'success');
          close();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  },

  // ── f09 Controle de Ferramentas ───────────────────────────────────────────────

  async f09ControleFerramentas(user) {
    const u = user || {};
    const nivel = u.nivel_acesso || 0;
    const { el, close } = openModal({
      title: 'Controle de Ferramentas',
      size: 'lg',
      body: _mnt_tabs([
        { id: 'ferramentas', label: '🔨 Ferramentas', html: `<div id="f09-list-wrap"><div class="page-loader"><span class="spinner"></span></div></div>` },
        ...(nivel >= 4 ? [{ id: 'cadastrar', label: '➕ Cadastrar', html: `
          <form id="f09-form">
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Código</label><input class="form-control" id="f09-cod" maxlength="50"></div>
              <div class="form-group" style="flex:3;min-width:200px;"><label class="form-label">Nome *</label><input class="form-control" id="f09-nome" maxlength="200"></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Tipo *</label>
                <select class="form-control" id="f09-tipo">
                  <option value="medicao">Medição</option>
                  <option value="corte">Corte</option>
                  <option value="aperto">Aperto</option>
                  <option value="eletrica">Elétrica</option>
                  <option value="pneumatica">Pneumática</option>
                  <option value="hidraulica">Hidráulica</option>
                  <option value="seguranca">Segurança</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Nº Série</label><input class="form-control" id="f09-serie" maxlength="100"></div>
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Localização</label><input class="form-control" id="f09-loc" maxlength="100"></div>
              <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Próxima Calibração</label><input class="form-control" id="f09-calib" type="date"></div>
            </div>
            <div id="f09-cad-error"></div>
          </form>` }] : []),
      ], 'ferramentas'),
      footer: `<button class="btn btn-secondary" id="f09-close">Fechar</button>
               ${nivel >= 4 ? '<button class="btn btn-primary" id="f09-salvar" style="display:none;">Cadastrar</button>' : ''}`,
    });
    el.querySelector('#f09-close').addEventListener('click', close);
    _mnt_bindTabs(el);
    if (nivel >= 4) {
      el.querySelectorAll('[data-tab-btn]').forEach(btn => {
        btn.addEventListener('click', function() {
          el.querySelector('#f09-salvar').style.display = this.getAttribute('data-tab-btn') === 'cadastrar' ? '' : 'none';
        });
      });
    }

    const today = new Date();
    async function loadFerramentas() {
      const wrap = el.querySelector('#f09-list-wrap');
      try {
        const d = await API.get('/manutencao/ferramentas');
        const rows = Array.isArray(d) ? d : (d.data||[]);
        if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🔨</span><span class="empty-state-title">Nenhuma ferramenta cadastrada</span></div>`; return; }
        const ST_BADGE = { disponivel: 'success', em_uso: 'warning', em_manutencao: 'info', extraviada: 'danger', sucata: 'muted' };
        wrap.innerHTML = `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr>
          <th>Código</th><th>Nome</th><th>Tipo</th><th>Status</th><th>Usuário Atual</th><th>Calibração</th><th>Ação</th>
        </tr></thead><tbody>
          ${rows.map(r => {
            const calibDate = r.calibracao_proxima ? new Date(r.calibracao_proxima) : null;
            const calibOverdue = calibDate && calibDate < today;
            return `<tr>
              <td><code>${escapeHtml(r.codigo||'—')}</code></td>
              <td>${escapeHtml(r.nome)}</td>
              <td><span class="badge badge-muted">${escapeHtml(r.tipo)}</span></td>
              <td><span class="badge badge-${ST_BADGE[r.status]||'muted'}">${escapeHtml(r.status)}</span></td>
              <td>${escapeHtml(r.usuario_atual_nome||'—')}</td>
              <td style="${calibOverdue ? 'color:#f87171;font-weight:600;' : ''}">${_fmtDate(r.calibracao_proxima)}${calibOverdue ? ' ⚠️' : ''}</td>
              <td>
                ${r.status === 'disponivel' ? `<button class="btn btn-sm btn-primary mnt-checkout-btn" data-id="${r.id}">Retirar</button>` : ''}
                ${r.status === 'em_uso' ? `<button class="btn btn-sm btn-secondary mnt-checkin-btn" data-id="${r.id}">Devolver</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody></table></div>`;

        wrap.querySelectorAll('.mnt-checkout-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const { el: e2, close: c2 } = openModal({
              title: 'Retirar Ferramenta',
              size: 'sm',
              body: `<div class="form-group"><label class="form-label">Data Devolução Prevista</label>
                <input class="form-control" id="f09-ret-data" type="datetime-local"></div>
                <div class="form-group"><label class="form-label">Observação</label>
                <textarea class="form-control" id="f09-ret-obs" rows="2"></textarea></div>`,
              footer: `<button class="btn btn-secondary" id="f09-ret-cancel">Cancelar</button><button class="btn btn-primary" id="f09-ret-ok">Confirmar Retirada</button>`,
            });
            e2.querySelector('#f09-ret-cancel').addEventListener('click', c2);
            e2.querySelector('#f09-ret-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                try {
                  await API.put(`/manutencao/ferramentas/${id}/checkout`, {
                    data_devolucao_prevista: e2.querySelector('#f09-ret-data').value || null,
                    observacao: e2.querySelector('#f09-ret-obs').value.trim() || null,
                  });
                  showToast('Ferramenta retirada!', 'success'); c2(); loadFerramentas();
                } catch(err) { showToast(err.message||'Erro', 'danger'); }
              });
            });
          });
        });

        wrap.querySelectorAll('.mnt-checkin-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const { el: e2, close: c2 } = openModal({
              title: 'Devolver Ferramenta',
              size: 'sm',
              body: `<div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                  <input type="checkbox" id="f09-dev-avaria"> Ferramenta avariada
                </label></div>
                <div class="form-group"><label class="form-label">Observação</label>
                <textarea class="form-control" id="f09-dev-obs" rows="2"></textarea></div>`,
              footer: `<button class="btn btn-secondary" id="f09-dev-cancel">Cancelar</button><button class="btn btn-primary" id="f09-dev-ok">Confirmar Devolução</button>`,
            });
            e2.querySelector('#f09-dev-cancel').addEventListener('click', c2);
            e2.querySelector('#f09-dev-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                try {
                  await API.put(`/manutencao/ferramentas/${id}/checkin`, {
                    avariada: e2.querySelector('#f09-dev-avaria').checked,
                    observacao: e2.querySelector('#f09-dev-obs').value.trim() || null,
                  });
                  showToast('Ferramenta devolvida!', 'success'); c2(); loadFerramentas();
                } catch(err) { showToast(err.message||'Erro', 'danger'); }
              });
            });
          });
        });
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar</span></div>`; }
    }
    loadFerramentas();

    if (nivel >= 4) {
      el.querySelector('#f09-salvar')?.addEventListener('click', function() {
        _withSubmit(this, async () => {
          const nome = el.querySelector('#f09-nome').value.trim();
          const errDiv = el.querySelector('#f09-cad-error');
          errDiv.innerHTML = '';
          if (!nome) { errDiv.innerHTML = '<div class="form-error">Nome obrigatório.</div>'; return; }
          try {
            await API.post('/manutencao/ferramentas', {
              codigo: el.querySelector('#f09-cod').value.trim() || null,
              nome, tipo: el.querySelector('#f09-tipo').value,
              numero_serie: el.querySelector('#f09-serie').value.trim() || null,
              localizacao: el.querySelector('#f09-loc').value.trim() || null,
              calibracao_proxima: el.querySelector('#f09-calib').value || null,
            });
            showToast('Ferramenta cadastrada!', 'success');
            el.querySelector('#f09-form').reset();
            el.querySelector('[data-tab-btn="ferramentas"]').click();
            loadFerramentas();
          } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
        });
      });
    }
  },

  // ── f10 Mapa de Lubrificação ──────────────────────────────────────────────────

  async f10MapaLubrificacao(user) {
    const u = user || {};
    const nivel = u.nivel_acesso || 0;
    const { el, close } = openModal({
      title: 'Mapa de Lubrificação',
      size: 'lg',
      body: `
        ${nivel >= 4 ? `<div style="text-align:right;margin-bottom:12px;"><button class="btn btn-sm btn-primary" id="f10-add-btn">+ Novo Ponto de Lubrificação</button></div>` : ''}
        <div id="f10-wrap"><div class="page-loader"><span class="spinner"></span></div></div>`,
      footer: `<button class="btn btn-secondary" id="f10-close">Fechar</button>`,
    });
    el.querySelector('#f10-close').addEventListener('click', close);

    async function loadLubrificacao() {
      const wrap = el.querySelector('#f10-wrap');
      try {
        const d = await API.get('/manutencao/preventiva?tipo=lubrificacao');
        const rows = Array.isArray(d) ? d : (d.data||[]);
        if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🛢️</span><span class="empty-state-title">Nenhum ponto de lubrificação cadastrado</span></div>`; return; }
        wrap.innerHTML = `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr>
          <th>Equipamento</th><th>Ponto</th><th>Frequência</th><th>Última Execução</th><th>Próxima Data</th><th>Responsável</th><th>Ação</th>
        </tr></thead><tbody>
          ${rows.map(r => {
            const dias = Number(r.dias_ate_vencimento);
            const dateStyle = _mnt_prevColor(dias);
            return `<tr>
              <td>${escapeHtml(r.equipamento_nome||'—')}</td>
              <td>${escapeHtml(r.titulo)}</td>
              <td><span class="badge badge-muted">${escapeHtml(r.frequencia_tipo)}</span></td>
              <td>${_fmtDate(r.ultima_data)}</td>
              <td><span style="${dateStyle}">${_fmtDate(r.proxima_data)}</span>${dias < 0 ? ' <span class="badge badge-danger">VENCIDA</span>' : ''}</td>
              <td>${escapeHtml(r.responsavel_nome||'—')}</td>
              <td><button class="btn btn-sm btn-primary mnt-lubr-exec-btn" data-id="${r.id}">✓ Registrar</button></td>
            </tr>`;
          }).join('')}
        </tbody></table></div>`;

        wrap.querySelectorAll('.mnt-lubr-exec-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const { el: e2, close: c2 } = openModal({
              title: 'Registrar Lubrificação',
              size: 'sm',
              body: `<div class="form-group"><label class="form-label">Observações</label><textarea class="form-control" id="f10-obs" rows="3" placeholder="Ex: Óleo 10W-30, 50ml..."></textarea></div>`,
              footer: `<button class="btn btn-secondary" id="f10-exec-cancel">Cancelar</button><button class="btn btn-primary" id="f10-exec-ok">Confirmar</button>`,
            });
            e2.querySelector('#f10-exec-cancel').addEventListener('click', c2);
            e2.querySelector('#f10-exec-ok').addEventListener('click', function() {
              _withSubmit(this, async () => {
                try {
                  await API.post(`/manutencao/preventiva/${id}/executar`, { observacoes: e2.querySelector('#f10-obs').value.trim() });
                  showToast('Lubrificação registrada!', 'success'); c2(); loadLubrificacao();
                } catch(err) { showToast(err.message||'Erro', 'danger'); }
              });
            });
          });
        });
      } catch(err) { wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">Erro ao carregar</span></div>`; }
    }
    loadLubrificacao();

    if (nivel >= 4) {
      el.querySelector('#f10-add-btn').addEventListener('click', async () => {
        const equips = await _mnt_loadOpts('/manutencao/equipamentos');
        const { el: e2, close: c2 } = openModal({
          title: 'Novo Ponto de Lubrificação',
          size: 'md',
          body: `<div class="form-group"><label class="form-label">Equipamento</label>
            <select class="form-control" id="f10-n-equip">
              <option value="">— Nenhum específico —</option>
              ${equips.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('')}
            </select></div>
            <div class="form-group"><label class="form-label">Ponto de Lubrificação *</label>
              <input class="form-control" id="f10-n-titulo" placeholder="Ex: Mancal dianteiro da bomba"></div>
            <div style="display:flex;gap:10px;">
              <div class="form-group" style="flex:1;"><label class="form-label">Frequência</label>
                <select class="form-control" id="f10-n-freq">
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal" selected>Mensal</option>
                  <option value="trimestral">Trimestral</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;"><label class="form-label">Próxima Data *</label>
                <input class="form-control" id="f10-n-data" type="date"></div>
            </div>
            <div class="form-group"><label class="form-label">Descrição (tipo de lubrificante, quantidade)</label>
              <textarea class="form-control" id="f10-n-desc" rows="2"></textarea></div>
            <div id="f10-n-error"></div>`,
          footer: `<button class="btn btn-secondary" id="f10-n-cancel">Cancelar</button><button class="btn btn-primary" id="f10-n-ok">Criar</button>`,
        });
        e2.querySelector('#f10-n-cancel').addEventListener('click', c2);
        e2.querySelector('#f10-n-ok').addEventListener('click', function() {
          _withSubmit(this, async () => {
            const titulo = e2.querySelector('#f10-n-titulo').value.trim();
            const proxima_data = e2.querySelector('#f10-n-data').value;
            const errDiv = e2.querySelector('#f10-n-error');
            errDiv.innerHTML = '';
            if (!titulo)       { errDiv.innerHTML = '<div class="form-error">Informe o ponto.</div>'; return; }
            if (!proxima_data) { errDiv.innerHTML = '<div class="form-error">Informe a data.</div>'; return; }
            try {
              await API.post('/manutencao/preventiva', {
                equipamento_id: e2.querySelector('#f10-n-equip').value || null,
                titulo, tipo: 'lubrificacao',
                frequencia_tipo: e2.querySelector('#f10-n-freq').value,
                proxima_data,
                descricao: e2.querySelector('#f10-n-desc').value.trim() || null,
              });
              showToast('Ponto de lubrificação criado!', 'success'); c2(); loadLubrificacao();
            } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
          });
        });
      });
    }
  },

};

// f11-f19 are merged in from manutencao_forms_part2.js at runtime
// (combined into this file after build)

window.ManutencaoForms = ManutencaoForms;
