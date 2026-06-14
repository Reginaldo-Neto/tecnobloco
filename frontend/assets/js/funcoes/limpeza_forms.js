'use strict';
/**
 * LimpezaForms — Renderers de modal para as 13 funções do setor de Limpeza.
 */

// ── Local helpers ─────────────────────────────────────────────────────────────

function _limp_statusBadge(s) {
  const m = { pendente:'warning', aceita:'info', em_andamento:'info', concluida:'success', concluido:'success', cancelada:'muted', cancelado:'muted', agendada:'info' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml((s||'—').replace(/_/g,' '))}</span>`;
}
function _limp_urgBadge(u) {
  const m = { alta:'danger', media:'warning', baixa:'success' };
  return `<span class="badge badge-${m[u]||'muted'}">${escapeHtml(u||'—')}</span>`;
}
function _limp_fmtD(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return '—'; }
}
function _limp_fmtDT(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }); } catch { return '—'; }
}

// ── F01 — Ver Solicitações de Limpeza ─────────────────────────────────────────

async function _limp_f01(user) {
  const { el } = openModal({
    title: '🧹 Solicitações de Limpeza',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="limp-sol-fil-status" style="width:160px;">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="aceita">Aceita</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select class="form-control" id="limp-sol-fil-urgencia" style="width:140px;">
          <option value="">Todas urgências</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="limp-sol-buscar">🔍 Filtrar</button>
      </div>
      <div id="limp-sol-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  async function load() {
    const status   = el.querySelector('#limp-sol-fil-status').value;
    const urgencia = el.querySelector('#limp-sol-fil-urgencia').value;
    const qs = [status&&`status=${status}`, urgencia&&`urgencia=${urgencia}`].filter(Boolean).join('&');
    el.querySelector('#limp-sol-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/solicitacoes' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#limp-sol-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-sol-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>ID</th><th>Local</th><th>Tipo</th><th>Urgência</th><th>Status</th><th>Solicitante</th><th>Data</th></tr></thead>
            <tbody>
              ${rows.map(r => `
              <tr>
                <td>#${r.id}</td>
                <td>${escapeHtml(r.local_setor||r.local||'—')}</td>
                <td>${escapeHtml((r.tipo_servico||r.tipo||'—').replace(/_/g,' '))}</td>
                <td>${_limp_urgBadge(r.urgencia)}</td>
                <td>${_limp_statusBadge(r.status)}</td>
                <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                <td>${_limp_fmtDT(r.criado_em||r.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch(err) {
      el.querySelector('#limp-sol-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-sol-buscar').addEventListener('click', load);
  load();
}

// ── F02 — Gerenciar Solicitações ──────────────────────────────────────────────

async function _limp_f02(user) {
  const { el } = openModal({
    title: '📋 Gerenciar Solicitações de Limpeza',
    size: 'xl',
    body: `<div id="limp-ger-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  async function load() {
    el.querySelector('#limp-ger-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/solicitacoes?status=pendente');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) {
        el.querySelector('#limp-ger-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">✅</span><span class="empty-state-title">Nenhuma solicitação pendente</span></div>`;
        return;
      }
      el.querySelector('#limp-ger-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>ID</th><th>Local</th><th>Urgência</th><th>Status</th><th>Solicitante</th><th>Data</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
              <tr data-id="${r.id}">
                <td>#${r.id}</td>
                <td>${escapeHtml(r.local_setor||r.local||'—')}</td>
                <td>${_limp_urgBadge(r.urgencia)}</td>
                <td>${_limp_statusBadge(r.status)}</td>
                <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                <td>${_limp_fmtDT(r.criado_em||r.created_at)}</td>
                <td style="display:flex;gap:4px;">
                  <button class="btn btn-sm btn-primary limp-aceitar-btn" data-id="${r.id}">Aceitar</button>
                  <button class="btn btn-sm btn-success limp-concluir-btn" data-id="${r.id}">Concluir</button>
                  <button class="btn btn-sm btn-danger limp-cancelar-btn" data-id="${r.id}">Cancelar</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      el.querySelector('#limp-ger-list').addEventListener('click', async e => {
        const btn = e.target.closest('button[data-id]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        let status = '';
        if (btn.classList.contains('limp-aceitar-btn'))  status = 'aceita';
        if (btn.classList.contains('limp-concluir-btn')) status = 'concluida';
        if (btn.classList.contains('limp-cancelar-btn')) status = 'cancelada';
        if (!status) return;
        await _withSubmit(btn, async () => {
          await API.put(`/limpeza/solicitacoes/${id}`, { status });
          load();
        });
      });
    } catch(err) {
      el.querySelector('#limp-ger-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  load();
}

// ── F03 — Cronograma de Rotina ────────────────────────────────────────────────

async function _limp_f03(user) {
  const { el } = openModal({
    title: '📅 Cronograma de Rotina',
    size: 'lg',
    body: `<div id="limp-rot-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  try {
    const d = await API.get('/limpeza/rotinas');
    const rows = Array.isArray(d) ? d : (d.data || []);
    if (!rows.length) { el.querySelector('#limp-rot-list').innerHTML = _empty(); return; }
    const freqMap = { diaria:'Diária', semanal:'Semanal', quinzenal:'Quinzenal', mensal:'Mensal' };
    const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    el.querySelector('#limp-rot-list').innerHTML = `
      <table class="table table-hover">
        <thead><tr><th>Nome</th><th>Local/Setor</th><th>Frequência</th><th>Dia</th><th>Horário</th><th>Responsável</th></tr></thead>
        <tbody>
          ${rows.map(r => `
          <tr>
            <td><strong>${escapeHtml(r.nome)}</strong>${r.descricao ? `<br><small style="color:var(--text-muted)">${escapeHtml(r.descricao)}</small>` : ''}</td>
            <td>${escapeHtml(r.local_setor||'—')}</td>
            <td><span class="badge badge-info">${freqMap[r.frequencia]||r.frequencia}</span></td>
            <td>${r.dia_semana != null ? diasSemana[r.dia_semana] : '—'}</td>
            <td>${escapeHtml(r.horario||'—')}</td>
            <td>${escapeHtml(r.responsavel_nome||'—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch(err) {
    el.querySelector('#limp-rot-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
  }
}

// ── F04 — Checklist de Execução ───────────────────────────────────────────────

async function _limp_f04(user) {
  const today = new Date().toISOString().split('T')[0];
  const { el } = openModal({
    title: '✅ Checklist de Execução',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
        <label style="font-size:var(--font-size-sm);color:var(--text-muted);">Data:</label>
        <input type="date" class="form-control" id="limp-ck-data" value="${today}" style="width:160px;">
        <button class="btn btn-sm btn-secondary" id="limp-ck-buscar">🔍 Carregar</button>
      </div>
      <div id="limp-ck-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-ck-novo-btn">+ Registrar Limpeza</button>`,
  });

  async function load() {
    const data = el.querySelector('#limp-ck-data').value;
    el.querySelector('#limp-ck-list').innerHTML = _spinner();
    try {
      const d = await API.get(`/limpeza/checklist?data=${data}`);
      const obj = d.data || d;
      const registros = obj.registros || [];
      const rotinas   = obj.rotinas || [];
      const executadas = new Set(registros.map(r => r.rotina_id).filter(Boolean));

      let html = '';
      if (rotinas.length) {
        html += `<div style="margin-bottom:16px;"><strong style="font-size:var(--font-size-sm);color:var(--text-muted);">ROTINAS DIÁRIAS</strong>
          <table class="table" style="margin-top:8px;">
            <thead><tr><th>Rotina</th><th>Local</th><th>Horário</th><th>Status</th></tr></thead>
            <tbody>
              ${rotinas.map(r => `
              <tr>
                <td>${escapeHtml(r.nome)}</td>
                <td>${escapeHtml(r.local_setor||'—')}</td>
                <td>${escapeHtml(r.horario||'—')}</td>
                <td>${executadas.has(r.id) ? '<span class="badge badge-success">✅ Feito</span>' : '<span class="badge badge-warning">⏳ Pendente</span>'}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>`;
      }

      html += `<strong style="font-size:var(--font-size-sm);color:var(--text-muted);">REGISTROS DO DIA (${registros.length})</strong>`;
      if (!registros.length) {
        html += '<div class="empty-state" style="margin-top:8px;"><span class="empty-state-icon">📋</span><span class="empty-state-title">Nenhum registro nesta data</span></div>';
      } else {
        html += `<table class="table table-hover" style="margin-top:8px;">
          <thead><tr><th>Horário</th><th>Local</th><th>Rotina</th><th>Responsável</th><th>Obs</th></tr></thead>
          <tbody>
            ${registros.map(r => `
            <tr>
              <td>${_limp_fmtDT(r.horario_execucao)}</td>
              <td>${escapeHtml(r.local_setor||'—')}</td>
              <td>${escapeHtml(r.rotina_nome||'—')}</td>
              <td>${escapeHtml(r.usuario_nome||'—')}</td>
              <td>${escapeHtml(r.observacao||'—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
      }
      el.querySelector('#limp-ck-list').innerHTML = html;
    } catch(err) {
      el.querySelector('#limp-ck-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-ck-buscar').addEventListener('click', load);

  el.querySelector('#limp-ck-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Registrar Limpeza',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Local/Setor *</label>
          <input type="text" class="form-control" id="limp-ck-local" placeholder="Ex: Banheiro masculino, Refeitório..."></div>
        <div class="form-group"><label class="form-label">Descrição do que foi feito *</label>
          <textarea class="form-control" id="limp-ck-desc" rows="3" placeholder="Ex: Limpeza completa, higienização de piso..."></textarea></div>
        <div class="form-group"><label class="form-label">Observações</label>
          <input type="text" class="form-control" id="limp-ck-obs" placeholder="Opcional"></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-ck-salvar">Registrar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-ck-salvar'), async () => {
      const local_setor = elF.querySelector('#limp-ck-local').value.trim();
      const descricao   = elF.querySelector('#limp-ck-desc').value.trim();
      const observacao  = elF.querySelector('#limp-ck-obs').value.trim();
      if (!local_setor || !descricao) throw new Error('Local e descrição são obrigatórios');
      await API.post('/limpeza/checklist', { local_setor, descricao, observacao: observacao||undefined });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F05 — Gestão de Resíduos ──────────────────────────────────────────────────

async function _limp_f05(user) {
  const { el } = openModal({
    title: '♻️ Gestão de Resíduos',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <input type="date" class="form-control" id="limp-res-ini" style="width:160px;" placeholder="Data início">
        <input type="date" class="form-control" id="limp-res-fim" style="width:160px;" placeholder="Data fim">
        <button class="btn btn-sm btn-secondary" id="limp-res-buscar">🔍 Filtrar</button>
      </div>
      <div id="limp-res-totais" style="margin-bottom:12px;"></div>
      <div id="limp-res-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-res-novo-btn">+ Registrar Resíduo</button>`,
  });

  async function load() {
    const ini = el.querySelector('#limp-res-ini').value;
    const fim = el.querySelector('#limp-res-fim').value;
    const qs = [ini&&`data_inicio=${ini}`, fim&&`data_fim=${fim}`].filter(Boolean).join('&');
    el.querySelector('#limp-res-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/residuos' + (qs ? '?' + qs : ''));
      const obj = d.data || d;
      const registros = Array.isArray(obj) ? obj : (obj.registros || []);
      const totais    = obj.totais || [];

      if (totais.length) {
        el.querySelector('#limp-res-totais').innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${totais.map(t => `<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:var(--border-radius);padding:8px 14px;font-size:var(--font-size-sm);">
              <div style="color:var(--text-muted);">${escapeHtml(t.tipo||'—')}</div>
              <div style="font-size:1.2rem;font-weight:700;">${t.total_kg} kg</div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${t.registros} registros</div>
            </div>`).join('')}
          </div>`;
      }

      if (!registros.length) { el.querySelector('#limp-res-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-res-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Data</th><th>Tipo</th><th>Local Origem</th><th>Peso (kg)</th><th>Destinação</th><th>Responsável</th></tr></thead>
            <tbody>
              ${registros.map(r => `
              <tr>
                <td>${_limp_fmtD(r.data_coleta)}</td>
                <td><span class="badge badge-info">${escapeHtml(r.tipo||'—')}</span></td>
                <td>${escapeHtml(r.local_origem||'—')}</td>
                <td>${r.peso_kg} kg</td>
                <td>${escapeHtml(r.destinacao||'—')}</td>
                <td>${escapeHtml(r.usuario_nome||'—')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch(err) {
      el.querySelector('#limp-res-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-res-buscar').addEventListener('click', load);

  el.querySelector('#limp-res-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Registrar Resíduo',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Tipo *</label>
          <select class="form-control" id="limp-res-tipo">
            <option value="organico">Orgânico</option>
            <option value="reciclavel">Reciclável</option>
            <option value="perigoso">Perigoso</option>
            <option value="rejeito">Rejeito</option>
            <option value="eletronico">Eletrônico</option>
          </select></div>
        <div class="form-group"><label class="form-label">Local de Origem *</label>
          <input type="text" class="form-control" id="limp-res-local" placeholder="Ex: Produção, Refeitório..."></div>
        <div class="form-group"><label class="form-label">Peso (kg) *</label>
          <input type="number" class="form-control" id="limp-res-peso" min="0.01" step="0.01" placeholder="0.00"></div>
        <div class="form-group"><label class="form-label">Destinação</label>
          <input type="text" class="form-control" id="limp-res-dest" placeholder="Ex: Cooperativa de reciclagem, Aterro..."></div>
        <div class="form-group"><label class="form-label">Data da Coleta</label>
          <input type="date" class="form-control" id="limp-res-data" value="${new Date().toISOString().split('T')[0]}"></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-res-salvar">Registrar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-res-salvar'), async () => {
      const tipo        = elF.querySelector('#limp-res-tipo').value;
      const local_origem = elF.querySelector('#limp-res-local').value.trim();
      const peso_kg     = elF.querySelector('#limp-res-peso').value;
      const destinacao  = elF.querySelector('#limp-res-dest').value.trim();
      const data_coleta = elF.querySelector('#limp-res-data').value;
      if (!local_origem || !peso_kg) throw new Error('Local e peso são obrigatórios');
      await API.post('/limpeza/residuos', { tipo, local_origem, peso_kg, destinacao: destinacao||undefined, data_coleta });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F06 — Solicitação de Caçambas ─────────────────────────────────────────────

async function _limp_f06(user) {
  const { el } = openModal({
    title: '🗑️ Solicitação de Caçambas',
    size: 'xl',
    body: `<div id="limp-cac-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-cac-novo-btn">+ Nova Solicitação</button>`,
  });

  async function load() {
    el.querySelector('#limp-cac-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/cacambas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#limp-cac-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-cac-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Local</th><th>Tipo</th><th>Motivo</th><th>Status</th><th>Data Prevista</th><th>Solicitante</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.local||'—')}</td>
                <td>${escapeHtml((r.tipo_cacamba||'—').replace(/_/g,' '))}</td>
                <td>${escapeHtml((r.motivo||'—').replace(/_/g,' '))}</td>
                <td>${_limp_statusBadge(r.status)}</td>
                <td>${_limp_fmtD(r.data_prevista)}</td>
                <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                <td>${['pendente','agendada'].includes(r.status) ? `<button class="btn btn-sm btn-success limp-cac-concluir" data-id="${r.id}">Concluir</button>` : ''}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      el.querySelector('#limp-cac-list').addEventListener('click', async e => {
        const btn = e.target.closest('.limp-cac-concluir');
        if (!btn) return;
        await _withSubmit(btn, async () => {
          await API.put(`/limpeza/cacambas/${btn.getAttribute('data-id')}/status`, { status: 'concluida' });
          load();
        });
      });
    } catch(err) {
      el.querySelector('#limp-cac-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-cac-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Nova Solicitação de Caçamba',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Local *</label>
          <input type="text" class="form-control" id="limp-cac-local" placeholder="Ex: Pátio de entulho, Lateral do galpão..."></div>
        <div class="form-group"><label class="form-label">Tipo de Caçamba</label>
          <select class="form-control" id="limp-cac-tipo">
            <option value="misto">Misto</option>
            <option value="entulho">Entulho</option>
            <option value="organico">Orgânico</option>
            <option value="industrial">Industrial</option>
          </select></div>
        <div class="form-group"><label class="form-label">Motivo</label>
          <select class="form-control" id="limp-cac-motivo">
            <option value="cheia">Cheia</option>
            <option value="troca">Troca periódica</option>
            <option value="urgencia">Urgência</option>
          </select></div>
        <div class="form-group"><label class="form-label">Data Prevista</label>
          <input type="date" class="form-control" id="limp-cac-data"></div>
        <div class="form-group"><label class="form-label">Descrição</label>
          <textarea class="form-control" id="limp-cac-desc" rows="2" placeholder="Detalhes adicionais..."></textarea></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-cac-salvar">Solicitar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-cac-salvar'), async () => {
      const local        = elF.querySelector('#limp-cac-local').value.trim();
      const tipo_cacamba = elF.querySelector('#limp-cac-tipo').value;
      const motivo       = elF.querySelector('#limp-cac-motivo').value;
      const data_prevista = elF.querySelector('#limp-cac-data').value;
      const descricao    = elF.querySelector('#limp-cac-desc').value.trim();
      if (!local) throw new Error('Local é obrigatório');
      await API.post('/limpeza/cacambas', { local, tipo_cacamba, motivo, data_prevista: data_prevista||undefined, descricao: descricao||undefined });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F07 — Lavagem de Pátio ────────────────────────────────────────────────────

async function _limp_f07(user) {
  const { el } = openModal({
    title: '🚿 Lavagem de Pátio',
    size: 'xl',
    body: `<div id="limp-lav-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-lav-novo-btn">+ Agendar Lavagem</button>`,
  });

  async function load() {
    el.querySelector('#limp-lav-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/lavagem-patio');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#limp-lav-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-lav-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Área</th><th>Tipo</th><th>Data Agendada</th><th>Horário</th><th>Status</th><th>Solicitante</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.area||'—')}</td>
                <td>${escapeHtml((r.tipo||'—').replace(/_/g,' '))}</td>
                <td>${_limp_fmtD(r.data_agendada)}</td>
                <td>${escapeHtml(r.horario_previsto||'—')}</td>
                <td>${_limp_statusBadge(r.status)}</td>
                <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                <td>${r.status==='agendada'||r.status==='pendente' ? `<button class="btn btn-sm btn-success limp-lav-concluir" data-id="${r.id}">Concluir</button>` : ''}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      el.querySelector('#limp-lav-list').addEventListener('click', async e => {
        const btn = e.target.closest('.limp-lav-concluir');
        if (!btn) return;
        await _withSubmit(btn, async () => {
          await API.put(`/limpeza/lavagem-patio/${btn.getAttribute('data-id')}/status`, { status: 'concluida' });
          load();
        });
      });
    } catch(err) {
      el.querySelector('#limp-lav-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-lav-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Agendar Lavagem de Pátio',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Área *</label>
          <input type="text" class="form-control" id="limp-lav-area" placeholder="Ex: Estacionamento, Pátio principal, Calçada..."></div>
        <div class="form-group"><label class="form-label">Tipo de Lavagem</label>
          <select class="form-control" id="limp-lav-tipo">
            <option value="lavagem_pesada">Lavagem Pesada</option>
            <option value="varrição">Varrição</option>
            <option value="hidrojateamento">Hidrojateamento</option>
          </select></div>
        <div class="form-group"><label class="form-label">Data Agendada *</label>
          <input type="date" class="form-control" id="limp-lav-data"></div>
        <div class="form-group"><label class="form-label">Horário Previsto</label>
          <input type="time" class="form-control" id="limp-lav-horario"></div>
        <div class="form-group"><label class="form-label">Observações</label>
          <textarea class="form-control" id="limp-lav-obs" rows="2"></textarea></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-lav-salvar">Agendar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-lav-salvar'), async () => {
      const area           = elF.querySelector('#limp-lav-area').value.trim();
      const tipo           = elF.querySelector('#limp-lav-tipo').value;
      const data_agendada  = elF.querySelector('#limp-lav-data').value;
      const horario_previsto = elF.querySelector('#limp-lav-horario').value;
      const observacoes    = elF.querySelector('#limp-lav-obs').value.trim();
      if (!area || !data_agendada) throw new Error('Área e data são obrigatórias');
      await API.post('/limpeza/lavagem-patio', { area, tipo, data_agendada, horario_previsto: horario_previsto||undefined, observacoes: observacoes||undefined });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F08 — Estoque de Material de Limpeza (DML) ────────────────────────────────

async function _limp_f08(user) {
  const { el } = openModal({
    title: '📦 Estoque de Material de Limpeza (DML)',
    size: 'xl',
    body: `<div id="limp-est-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-est-novo-btn">+ Novo Item</button>`,
  });

  async function load() {
    el.querySelector('#limp-est-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/estoque');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#limp-est-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-est-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Nome</th><th>Categoria</th><th>Qtd Atual</th><th>Qtd Mínima</th><th>Unidade</th><th>Localização</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => {
                const critico = r.quantidade_atual <= r.quantidade_minima;
                return `
                <tr style="${critico ? 'background:rgba(239,68,68,0.06);' : ''}">
                  <td><strong>${escapeHtml(r.nome)}</strong>${critico ? ' <span style="color:#f87171;font-size:11px;">⚠️ CRÍTICO</span>' : ''}</td>
                  <td><span class="badge badge-muted">${escapeHtml((r.categoria||'—').replace(/_/g,' '))}</span></td>
                  <td style="font-weight:700;${critico ? 'color:#f87171;' : ''}">${r.quantidade_atual}</td>
                  <td>${r.quantidade_minima}</td>
                  <td>${escapeHtml(r.unidade||'—')}</td>
                  <td>${escapeHtml(r.localizacao||'—')}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary limp-est-mov" data-id="${r.id}" data-nome="${escapeHtml(r.nome)}">Movimentar</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;

      el.querySelector('#limp-est-list').addEventListener('click', e => {
        const btn = e.target.closest('.limp-est-mov');
        if (!btn) return;
        const itemId = btn.getAttribute('data-id');
        const nome   = btn.getAttribute('data-nome');
        const { el: elM } = openModal({
          title: `📦 Movimentar: ${nome}`,
          size: 'sm',
          body: `
            <div class="form-group"><label class="form-label">Tipo *</label>
              <select class="form-control" id="limp-est-tipo">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste de inventário</option>
              </select></div>
            <div class="form-group"><label class="form-label">Quantidade *</label>
              <input type="number" class="form-control" id="limp-est-qtd" min="0.01" step="0.01"></div>
            <div class="form-group"><label class="form-label">Motivo</label>
              <input type="text" class="form-control" id="limp-est-motivo" placeholder="Ex: Compra nota 1234, Uso diário..."></div>`,
          footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
                   <button class="btn btn-primary" id="limp-est-mov-salvar">Confirmar</button>`,
        });
        _withSubmit(elM.querySelector('#limp-est-mov-salvar'), async () => {
          const tipo      = elM.querySelector('#limp-est-tipo').value;
          const quantidade = elM.querySelector('#limp-est-qtd').value;
          const motivo    = elM.querySelector('#limp-est-motivo').value.trim();
          if (!quantidade) throw new Error('Quantidade é obrigatória');
          await API.post(`/limpeza/estoque/${itemId}/movimento`, { tipo, quantidade, motivo: motivo||undefined });
          elM.querySelector('.modal-close').click();
          load();
        });
      });
    } catch(err) {
      el.querySelector('#limp-est-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-est-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Novo Item no Estoque',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Nome *</label>
          <input type="text" class="form-control" id="limp-est-nome" placeholder="Ex: Detergente Industrial, Mop..."></div>
        <div class="form-group"><label class="form-label">Categoria</label>
          <select class="form-control" id="limp-est-cat">
            <option value="produto_quimico">Produto Químico</option>
            <option value="utensilio">Utensílio</option>
            <option value="equipamento">Equipamento</option>
            <option value="descartavel">Descartável</option>
            <option value="epi">EPI</option>
          </select></div>
        <div class="form-group"><label class="form-label">Unidade</label>
          <input type="text" class="form-control" id="limp-est-unid" value="UN" placeholder="UN, KG, L, M..."></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="form-group"><label class="form-label">Qtd Atual</label>
            <input type="number" class="form-control" id="limp-est-qtda" value="0" min="0"></div>
          <div class="form-group"><label class="form-label">Qtd Mínima</label>
            <input type="number" class="form-control" id="limp-est-qtdm" value="0" min="0"></div>
        </div>
        <div class="form-group"><label class="form-label">Localização</label>
          <input type="text" class="form-control" id="limp-est-loc" placeholder="Ex: Prateleira A, DML Galpão 2..."></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-est-salvar">Cadastrar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-est-salvar'), async () => {
      const nome             = elF.querySelector('#limp-est-nome').value.trim();
      const categoria        = elF.querySelector('#limp-est-cat').value;
      const unidade          = elF.querySelector('#limp-est-unid').value.trim() || 'UN';
      const quantidade_atual = elF.querySelector('#limp-est-qtda').value;
      const quantidade_minima = elF.querySelector('#limp-est-qtdm').value;
      const localizacao      = elF.querySelector('#limp-est-loc').value.trim();
      if (!nome) throw new Error('Nome é obrigatório');
      await API.post('/limpeza/estoque', { nome, categoria, unidade, quantidade_atual, quantidade_minima, localizacao: localizacao||undefined });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F09 — Controle de Consumo de Descartáveis ─────────────────────────────────

async function _limp_f09(user) {
  const { el } = openModal({
    title: '🧻 Controle de Consumo de Descartáveis',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
        <label style="font-size:var(--font-size-sm);color:var(--text-muted);">Período:</label>
        <input type="month" class="form-control" id="limp-desc-periodo" style="width:160px;" value="${new Date().toISOString().slice(0,7)}">
        <button class="btn btn-sm btn-secondary" id="limp-desc-buscar">🔍 Carregar</button>
      </div>
      <div id="limp-desc-resumo" style="margin-bottom:12px;"></div>
      <div id="limp-desc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-desc-novo-btn">+ Registrar Consumo</button>`,
  });

  async function load() {
    const periodo = el.querySelector('#limp-desc-periodo').value;
    el.querySelector('#limp-desc-list').innerHTML = _spinner();
    try {
      const d = await API.get(`/limpeza/descartaveis?periodo=${periodo}`);
      const obj = d.data || d;
      const registros = obj.registros || [];
      const resumo    = obj.resumo || [];

      if (resumo.length) {
        el.querySelector('#limp-desc-resumo').innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${resumo.map(t => `<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:var(--border-radius);padding:8px 14px;font-size:var(--font-size-sm);">
              <div style="color:var(--text-muted);">${escapeHtml((t.tipo||'—').replace(/_/g,' '))}</div>
              <div style="font-size:1.2rem;font-weight:700;">${t.total_quantidade}</div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${t.setores} setor(es)</div>
            </div>`).join('')}
          </div>`;
      } else {
        el.querySelector('#limp-desc-resumo').innerHTML = '';
      }

      if (!registros.length) { el.querySelector('#limp-desc-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-desc-list').innerHTML = `
        <table class="table table-hover">
          <thead><tr><th>Setor</th><th>Tipo</th><th>Quantidade</th><th>Unidade</th><th>Período</th><th>Responsável</th></tr></thead>
          <tbody>
            ${registros.map(r => `
            <tr>
              <td>${escapeHtml(r.setor||'—')}</td>
              <td>${escapeHtml((r.tipo||'—').replace(/_/g,' '))}</td>
              <td>${r.quantidade}</td>
              <td>${escapeHtml(r.unidade||'—')}</td>
              <td>${escapeHtml(r.periodo_ref||'—')}</td>
              <td>${escapeHtml(r.usuario_nome||'—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } catch(err) {
      el.querySelector('#limp-desc-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-desc-buscar').addEventListener('click', load);

  el.querySelector('#limp-desc-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Registrar Consumo de Descartável',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Setor *</label>
          <input type="text" class="form-control" id="limp-desc-setor" placeholder="Ex: Banheiro masculino, Refeitório..."></div>
        <div class="form-group"><label class="form-label">Tipo *</label>
          <select class="form-control" id="limp-desc-tipo">
            <option value="papel_toalha">Papel Toalha</option>
            <option value="papel_higienico">Papel Higiênico</option>
            <option value="sabonete">Sabonete</option>
            <option value="alcool_gel">Álcool Gel</option>
            <option value="outro">Outro</option>
          </select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="form-group"><label class="form-label">Quantidade *</label>
            <input type="number" class="form-control" id="limp-desc-qtd" min="0.01" step="0.01" placeholder="0"></div>
          <div class="form-group"><label class="form-label">Unidade</label>
            <input type="text" class="form-control" id="limp-desc-unid" value="UN" placeholder="UN, Rolos, L..."></div>
        </div>
        <div class="form-group"><label class="form-label">Período Ref.</label>
          <input type="month" class="form-control" id="limp-desc-per" value="${new Date().toISOString().slice(0,7)}"></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-desc-salvar">Registrar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-desc-salvar'), async () => {
      const setor      = elF.querySelector('#limp-desc-setor').value.trim();
      const tipo       = elF.querySelector('#limp-desc-tipo').value;
      const quantidade = elF.querySelector('#limp-desc-qtd').value;
      const unidade    = elF.querySelector('#limp-desc-unid').value.trim() || 'UN';
      const periodo_ref = elF.querySelector('#limp-desc-per').value;
      if (!setor || !quantidade) throw new Error('Setor e quantidade são obrigatórios');
      await API.post('/limpeza/descartaveis', { setor, tipo, quantidade, unidade, periodo_ref });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F10 — Solicitação de Compra de Insumos ────────────────────────────────────

async function _limp_f10(user) {
  const { el } = openModal({
    title: '🛒 Solicitação de Compra de Insumos',
    size: 'xl',
    body: `<div id="limp-cmp-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-cmp-novo-btn">+ Nova Solicitação</button>`,
  });

  async function load() {
    el.querySelector('#limp-cmp-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/compras');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#limp-cmp-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-cmp-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Item</th><th>Qtd</th><th>Valor Est.</th><th>Urgência</th><th>Status</th><th>Solicitante</th><th>Data</th></tr></thead>
            <tbody>
              ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.item_descricao||'—')}</td>
                <td>${r.quantidade} ${escapeHtml(r.unidade||'')}</td>
                <td>${r.valor_estimado ? 'R$ ' + Number(r.valor_estimado).toLocaleString('pt-BR', {minimumFractionDigits:2}) : '—'}</td>
                <td>${_limp_urgBadge(r.urgencia)}</td>
                <td>${_limp_statusBadge(r.status)}</td>
                <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                <td>${_limp_fmtD(r.criado_em||r.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch(err) {
      el.querySelector('#limp-cmp-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-cmp-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Nova Solicitação de Compra',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Item *</label>
          <input type="text" class="form-control" id="limp-cmp-item" placeholder="Ex: Detergente industrial 5L, Luvas de borracha..."></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="form-group"><label class="form-label">Quantidade *</label>
            <input type="number" class="form-control" id="limp-cmp-qtd" min="1" placeholder="0"></div>
          <div class="form-group"><label class="form-label">Unidade</label>
            <input type="text" class="form-control" id="limp-cmp-unid" value="UN" placeholder="UN, L, KG..."></div>
        </div>
        <div class="form-group"><label class="form-label">Valor Estimado (R$)</label>
          <input type="number" class="form-control" id="limp-cmp-valor" min="0" step="0.01" placeholder="0,00"></div>
        <div class="form-group"><label class="form-label">Urgência</label>
          <select class="form-control" id="limp-cmp-urgencia">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
          </select></div>
        <div class="form-group"><label class="form-label">Justificativa</label>
          <textarea class="form-control" id="limp-cmp-just" rows="2" placeholder="Motivo do pedido..."></textarea></div>
        <div class="form-group"><label class="form-label">Fornecedor Sugerido</label>
          <input type="text" class="form-control" id="limp-cmp-forn" placeholder="Opcional"></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-cmp-salvar">Solicitar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-cmp-salvar'), async () => {
      const item_descricao      = elF.querySelector('#limp-cmp-item').value.trim();
      const quantidade          = elF.querySelector('#limp-cmp-qtd').value;
      const unidade             = elF.querySelector('#limp-cmp-unid').value.trim() || 'UN';
      const valor_estimado      = elF.querySelector('#limp-cmp-valor').value;
      const urgencia            = elF.querySelector('#limp-cmp-urgencia').value;
      const justificativa       = elF.querySelector('#limp-cmp-just').value.trim();
      const fornecedor_sugerido = elF.querySelector('#limp-cmp-forn').value.trim();
      if (!item_descricao || !quantidade) throw new Error('Item e quantidade são obrigatórios');
      await API.post('/limpeza/compras', { item_descricao, quantidade, unidade, valor_estimado: valor_estimado||undefined, urgencia, justificativa: justificativa||undefined, fornecedor_sugerido: fornecedor_sugerido||undefined });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F11 — Ver Escala e Datas ──────────────────────────────────────────────────

async function _limp_f11(user) {
  const { el } = openModal({
    title: '📅 Escala da Equipe de Limpeza',
    size: 'lg',
    body: `<div id="limp-esc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  try {
    const d = await API.get('/limpeza/escalas');
    const rows = Array.isArray(d) ? d : (d.data || []);
    if (!rows.length) { el.querySelector('#limp-esc-list').innerHTML = _empty(); return; }
    const turnoLabel = { manha:'Manhã', tarde:'Tarde', noite:'Noite', integral:'Integral', folga:'Folga' };
    el.querySelector('#limp-esc-list').innerHTML = `
      <table class="table table-hover">
        <thead><tr><th>Funcionário</th><th>Turno</th><th>Início</th><th>Fim</th><th>Tipo</th><th>Obs</th></tr></thead>
        <tbody>
          ${rows.map(r => `
          <tr>
            <td>${escapeHtml(r.nome_exibir||r.funcionario_nome||'—')}</td>
            <td><span class="badge badge-info">${turnoLabel[r.turno]||r.turno||'—'}</span></td>
            <td>${_limp_fmtD(r.data_inicio)}</td>
            <td>${_limp_fmtD(r.data_fim)}</td>
            <td>${escapeHtml((r.tipo||'normal').replace(/_/g,' '))}</td>
            <td>${escapeHtml(r.observacao||'—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch(err) {
    el.querySelector('#limp-esc-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
  }
}

// ── F12 — Definir Rotinas de Limpeza ─────────────────────────────────────────

async function _limp_f12(user) {
  const { el } = openModal({
    title: '⚙️ Definir Rotinas de Limpeza',
    size: 'xl',
    body: `<div id="limp-def-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-def-novo-btn">+ Nova Rotina</button>`,
  });

  async function load() {
    el.querySelector('#limp-def-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/rotinas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      const freqMap = { diaria:'Diária', semanal:'Semanal', quinzenal:'Quinzenal', mensal:'Mensal' };
      if (!rows.length) { el.querySelector('#limp-def-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-def-list').innerHTML = `
        <table class="table table-hover">
          <thead><tr><th>Nome</th><th>Local</th><th>Frequência</th><th>Horário</th><th>Responsável</th><th>Ação</th></tr></thead>
          <tbody>
            ${rows.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.nome)}</strong></td>
              <td>${escapeHtml(r.local_setor||'—')}</td>
              <td><span class="badge badge-info">${freqMap[r.frequencia]||r.frequencia}</span></td>
              <td>${escapeHtml(r.horario||'—')}</td>
              <td>${escapeHtml(r.responsavel_nome||'—')}</td>
              <td><button class="btn btn-sm btn-danger limp-def-del" data-id="${r.id}">Remover</button></td>
            </tr>`).join('')}
          </tbody>
        </table>`;

      el.querySelector('#limp-def-list').addEventListener('click', async e => {
        const btn = e.target.closest('.limp-def-del');
        if (!btn) return;
        if (!confirm('Remover esta rotina?')) return;
        await _withSubmit(btn, async () => {
          await API.delete(`/limpeza/rotinas/${btn.getAttribute('data-id')}`);
          load();
        });
      });
    } catch(err) {
      el.querySelector('#limp-def-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-def-novo-btn').addEventListener('click', () => {
    const { el: elF } = openModal({
      title: '+ Nova Rotina de Limpeza',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Nome da Tarefa *</label>
          <input type="text" class="form-control" id="limp-def-nome" placeholder="Ex: Limpeza dos banheiros masculinos"></div>
        <div class="form-group"><label class="form-label">Local/Setor *</label>
          <input type="text" class="form-control" id="limp-def-local" placeholder="Ex: Banheiro bloco A"></div>
        <div class="form-group"><label class="form-label">Descrição</label>
          <textarea class="form-control" id="limp-def-desc" rows="2" placeholder="Detalhes do que deve ser feito..."></textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="form-group"><label class="form-label">Frequência</label>
            <select class="form-control" id="limp-def-freq">
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select></div>
          <div class="form-group"><label class="form-label">Horário</label>
            <input type="time" class="form-control" id="limp-def-horario"></div>
        </div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-def-salvar">Cadastrar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-def-salvar'), async () => {
      const nome        = elF.querySelector('#limp-def-nome').value.trim();
      const local_setor = elF.querySelector('#limp-def-local').value.trim();
      const descricao   = elF.querySelector('#limp-def-desc').value.trim();
      const frequencia  = elF.querySelector('#limp-def-freq').value;
      const horario     = elF.querySelector('#limp-def-horario').value;
      if (!nome || !local_setor) throw new Error('Nome e local são obrigatórios');
      await API.post('/limpeza/rotinas', { nome, local_setor, descricao: descricao||undefined, frequencia, horario: horario||undefined });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── F13 — Gerenciar Escalas da Limpeza ────────────────────────────────────────

async function _limp_f13(user) {
  const { el } = openModal({
    title: '📆 Gerenciar Escalas da Limpeza',
    size: 'xl',
    body: `<div id="limp-gesc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="limp-gesc-novo-btn">+ Nova Escala</button>`,
  });

  async function load() {
    el.querySelector('#limp-gesc-list').innerHTML = _spinner();
    try {
      const d = await API.get('/limpeza/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      const turnoLabel = { manha:'Manhã', tarde:'Tarde', noite:'Noite', integral:'Integral', folga:'Folga' };
      if (!rows.length) { el.querySelector('#limp-gesc-list').innerHTML = _empty(); return; }
      el.querySelector('#limp-gesc-list').innerHTML = `
        <table class="table table-hover">
          <thead><tr><th>Funcionário</th><th>Turno</th><th>Início</th><th>Fim</th><th>Tipo</th><th>Cadastrado por</th><th>Ação</th></tr></thead>
          <tbody>
            ${rows.map(r => `
            <tr>
              <td>${escapeHtml(r.nome_exibir||r.funcionario_nome||'—')}</td>
              <td><span class="badge badge-info">${turnoLabel[r.turno]||r.turno||'—'}</span></td>
              <td>${_limp_fmtD(r.data_inicio)}</td>
              <td>${_limp_fmtD(r.data_fim)}</td>
              <td>${escapeHtml((r.tipo||'normal').replace(/_/g,' '))}</td>
              <td>${escapeHtml(r.criado_por_nome||'—')}</td>
              <td><button class="btn btn-sm btn-danger limp-gesc-del" data-id="${r.id}">Remover</button></td>
            </tr>`).join('')}
          </tbody>
        </table>`;

      el.querySelector('#limp-gesc-list').addEventListener('click', async e => {
        const btn = e.target.closest('.limp-gesc-del');
        if (!btn) return;
        if (!confirm('Remover esta escala?')) return;
        await _withSubmit(btn, async () => {
          await API.delete(`/limpeza/escalas/${btn.getAttribute('data-id')}`);
          load();
        });
      });
    } catch(err) {
      el.querySelector('#limp-gesc-list').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(err.message||'Erro')}</span></div>`;
    }
  }

  el.querySelector('#limp-gesc-novo-btn').addEventListener('click', async () => {
    // Carrega usuários para o select
    let usuarios = [];
    try {
      const ud = await API.get('/limpeza/usuarios');
      usuarios = Array.isArray(ud) ? ud : (ud.data || []);
    } catch {}

    const { el: elF } = openModal({
      title: '+ Nova Escala',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Funcionário</label>
          <select class="form-control" id="limp-gesc-user">
            <option value="">— Selecionar usuário do sistema —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)} (${escapeHtml(u.departamento||'')})</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Ou nome manual (se externo)</label>
          <input type="text" class="form-control" id="limp-gesc-nome" placeholder="Nome do funcionário terceirizado..."></div>
        <div class="form-group"><label class="form-label">Turno</label>
          <select class="form-control" id="limp-gesc-turno">
            <option value="integral">Integral</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
            <option value="folga">Folga</option>
          </select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="form-group"><label class="form-label">Data Início *</label>
            <input type="date" class="form-control" id="limp-gesc-ini"></div>
          <div class="form-group"><label class="form-label">Data Fim *</label>
            <input type="date" class="form-control" id="limp-gesc-fim"></div>
        </div>
        <div class="form-group"><label class="form-label">Tipo</label>
          <select class="form-control" id="limp-gesc-tipo">
            <option value="normal">Normal</option>
            <option value="ferias">Férias</option>
            <option value="feriado">Feriado</option>
            <option value="plantao">Plantão</option>
          </select></div>
        <div class="form-group"><label class="form-label">Observação</label>
          <input type="text" class="form-control" id="limp-gesc-obs" placeholder="Opcional"></div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button>
               <button class="btn btn-primary" id="limp-gesc-salvar">Salvar</button>`,
    });
    _withSubmit(elF.querySelector('#limp-gesc-salvar'), async () => {
      const usuario_id     = elF.querySelector('#limp-gesc-user').value;
      const funcionario_nome = elF.querySelector('#limp-gesc-nome').value.trim();
      const turno          = elF.querySelector('#limp-gesc-turno').value;
      const data_inicio    = elF.querySelector('#limp-gesc-ini').value;
      const data_fim       = elF.querySelector('#limp-gesc-fim').value;
      const tipo           = elF.querySelector('#limp-gesc-tipo').value;
      const observacao     = elF.querySelector('#limp-gesc-obs').value.trim();
      if (!usuario_id && !funcionario_nome) throw new Error('Selecione um usuário ou informe um nome');
      if (!data_inicio || !data_fim) throw new Error('Datas são obrigatórias');
      await API.post('/limpeza/escalas', {
        usuario_id: usuario_id || undefined,
        funcionario_nome: funcionario_nome || undefined,
        turno, data_inicio, data_fim, tipo,
        observacao: observacao || undefined,
      });
      elF.querySelector('.modal-close').click();
      load();
    });
  });

  load();
}

// ── Registro no objeto global FuncoesLimpeza ─────────────────────────────────

window.LimpezaForms = {
  f01: _limp_f01, f02: _limp_f02, f03: _limp_f03, f04: _limp_f04,
  f05: _limp_f05, f06: _limp_f06, f07: _limp_f07, f08: _limp_f08,
  f09: _limp_f09, f10: _limp_f10, f11: _limp_f11, f12: _limp_f12,
  f13: _limp_f13,
};
