'use strict';
/**
 * SacForms — Renderers de modal para as funções do SAC.
 */

// ── Local helpers ─────────────────────────────────────────────────────────────

function _sac_statusBadge(s) {
  const m = { aberto:'warning', em_analise:'info', aguardando_cliente:'muted', resolvido:'success', fechado:'muted', cancelado:'danger' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—').replace(/_/g,' ')}</span>`;
}
function _sac_prioBadge(p) {
  const m = { baixa:'success', media:'info', alta:'warning', urgente:'danger' };
  return `<span class="badge badge-${m[p]||'muted'}">${escapeHtml(p||'—')}</span>`;
}
function _sac_fmtDT(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }); } catch { return '—'; }
}
function _sac_fmtD(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return '—'; }
}
function _sac_rowBg(p) {
  if (p === 'urgente') return 'style="background:rgba(239,68,68,0.06);"';
  if (p === 'alta')    return 'style="background:rgba(251,146,60,0.06);"';
  return '';
}
function _sac_canalIcon(c) {
  const m = { telefone:'📞', whatsapp:'💬', email:'📧', portal:'🌐', presencial:'🏢' };
  return m[c] || '📋';
}
function _sac_recallBadge(s) {
  const m = { ativo:'danger', em_andamento:'warning', concluido:'success', cancelado:'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}

// ── f01 Gerenciar Tickets ─────────────────────────────────────────────────────

async function _sac_f01(user) {
  const { el, close } = openModal({
    title: '🎫 Gerenciar Tickets de Reclamação',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="sac-tk-fil-status" style="width:160px;">
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_analise">Em análise</option>
          <option value="aguardando_cliente">Aguardando cliente</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select class="form-control" id="sac-tk-fil-prio" style="width:140px;">
          <option value="">Todas prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select class="form-control" id="sac-tk-fil-cat" style="width:160px;">
          <option value="">Todas categorias</option>
          <option value="embalagem">Embalagem</option>
          <option value="qualidade_produto">Qualidade do Produto</option>
          <option value="entrega">Entrega</option>
          <option value="atendimento">Atendimento</option>
          <option value="cobranca">Cobrança</option>
          <option value="outro">Outro</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sac-tk-buscar">🔍 Filtrar</button>
      </div>
      <div id="sac-tk-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sac-tk-novo-btn">+ Novo Ticket</button>`,
  });

  async function loadTickets() {
    const status   = el.querySelector('#sac-tk-fil-status').value;
    const prio     = el.querySelector('#sac-tk-fil-prio').value;
    const cat      = el.querySelector('#sac-tk-fil-cat').value;
    const qs = [status&&`status=${status}`, prio&&`prioridade=${prio}`, cat&&`categoria=${cat}`].filter(Boolean).join('&');
    el.querySelector('#sac-tk-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/tickets' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-tk-list').innerHTML = _empty(); return; }
      el.querySelector('#sac-tk-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Código</th><th>Cliente</th><th>Título</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Canal</th><th>SLA</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => {
                const slaVencido = r.prazo_sla && new Date(r.prazo_sla) < new Date() && !['resolvido','fechado','cancelado'].includes(r.status);
                return `
                <tr ${_sac_rowBg(r.prioridade)}>
                  <td><code>${escapeHtml(r.codigo||'—')}</code></td>
                  <td>${escapeHtml(r.cliente_nome||'—')}</td>
                  <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.titulo||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml((r.categoria||'').replace(/_/g,' '))}</span></td>
                  <td>${_sac_prioBadge(r.prioridade)}</td>
                  <td>${_sac_statusBadge(r.status)}</td>
                  <td>${_sac_canalIcon(r.canal_entrada)} ${escapeHtml(r.canal_entrada||'—')}</td>
                  <td>${slaVencido ? '<span style="color:#f87171;font-size:12px;font-weight:600;">⚠ Vencido</span>' : _sac_fmtDT(r.prazo_sla)}</td>
                  <td><button class="btn btn-xs btn-secondary sac-tk-ver" data-id="${r.id}">Ver</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sac-tk-ver').forEach(btn =>
        btn.addEventListener('click', () => _sac_verTicket(btn.dataset.id, loadTickets))
      );
    } catch(e) {
      el.querySelector('#sac-tk-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sac-tk-buscar').addEventListener('click', loadTickets);
  el.querySelector('#sac-tk-novo-btn').addEventListener('click', () => _sac_novoTicket(user, loadTickets));
  loadTickets();
}

async function _sac_verTicket(id, onUpdate) {
  let data;
  try { const d = await API.get('/sac/tickets/' + id); data = d.data || d; }
  catch(e) { showToast('Erro ao carregar ticket: ' + e.message, 'error'); return; }

  const hist = data.historico || [];
  const slaVencido = data.prazo_sla && new Date(data.prazo_sla) < new Date() && !['resolvido','fechado','cancelado'].includes(data.status);

  const { el, close } = openModal({
    title: `🎫 ${escapeHtml(data.codigo||'')} — ${escapeHtml(data.titulo||'')}`,
    size: 'lg',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;font-size:13px;">
        <div><strong>Cliente:</strong> ${escapeHtml(data.cliente_nome||'—')}<br>
             <strong>Contato:</strong> ${escapeHtml(data.cliente_contato||'—')}</div>
        <div><strong>Categoria:</strong> <span class="badge badge-muted">${escapeHtml((data.categoria||'').replace(/_/g,' '))}</span><br>
             <strong>Prioridade:</strong> ${_sac_prioBadge(data.prioridade)}<br>
             <strong>Status:</strong> ${_sac_statusBadge(data.status)}</div>
        <div><strong>Canal:</strong> ${_sac_canalIcon(data.canal_entrada)} ${escapeHtml(data.canal_entrada||'—')}</div>
        <div><strong>Prazo SLA:</strong> <span style="${slaVencido?'color:#f87171;font-weight:600;':''}">${_sac_fmtDT(data.prazo_sla)}${slaVencido?' ⚠':''}  </span></div>
        ${data.lote_vinculado ? `<div><strong>Lote vinculado:</strong> <code>${escapeHtml(data.lote_vinculado)}</code></div>` : ''}
        <div><strong>Atendente:</strong> ${escapeHtml(data.atendente_nome||'Não atribuído')}</div>
        <div><strong>Abertura:</strong> ${_sac_fmtDT(data.data_abertura)}</div>
        <div><strong>Fechamento:</strong> ${_sac_fmtDT(data.data_fechamento)}</div>
      </div>
      <div style="margin-bottom:12px;">
        <strong>Descrição:</strong>
        <p style="background:rgba(255,255,255,0.03);padding:10px;border-radius:6px;margin:4px 0;font-size:13px;">${escapeHtml(data.descricao||'')}</p>
      </div>
      ${data.resolucao ? `<div style="margin-bottom:12px;"><strong>Resolução:</strong><p style="background:rgba(34,197,94,0.06);padding:10px;border-radius:6px;margin:4px 0;font-size:13px;">${escapeHtml(data.resolucao)}</p></div>` : ''}
      <hr style="border-color:var(--border-color);margin:12px 0;">
      <div style="font-weight:600;margin-bottom:8px;">Histórico (${hist.length})</div>
      <div style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${hist.length ? hist.map(h => `
          <div style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:6px;">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${escapeHtml(h.usuario_nome||'—')} · <span class="badge badge-muted" style="font-size:10px;">${escapeHtml(h.tipo||'')}</span> · ${_sac_fmtDT(h.created_at)}</div>
            <div style="font-size:13px;">${escapeHtml(h.descricao||'')}</div>
          </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;">Sem histórico.</div>'}
      </div>
      <div class="form-group"><label class="form-label">Adicionar comentário</label>
        <textarea class="form-control" id="sac-tk-coment" rows="2" placeholder="Comentário interno..."></textarea></div>
      ${!['resolvido','fechado','cancelado'].includes(data.status) ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
        <select class="form-control" id="sac-tk-novo-status" style="width:190px;">
          <option value="">Alterar status...</option>
          <option value="em_analise">Em análise</option>
          <option value="aguardando_cliente">Aguardando cliente</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <input class="form-control" id="sac-tk-resolucao" style="flex:1;min-width:200px;" placeholder="Resolução (se resolvido)...">
      </div>` : ''}
      <div id="sac-tk-det-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-tk-close">Fechar</button>
             <button class="btn btn-secondary" id="sac-tk-coment-btn">Comentar</button>
             ${!['resolvido','fechado','cancelado'].includes(data.status) ? `<button class="btn btn-primary" id="sac-tk-status-btn">Atualizar Status</button>` : ''}`,
  });

  el.querySelector('#sac-tk-close').addEventListener('click', close);

  el.querySelector('#sac-tk-coment-btn').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const txt = el.querySelector('#sac-tk-coment').value.trim();
      if (!txt) return;
      try {
        await API.post(`/sac/tickets/${id}/comentario`, { comentario: txt });
        showToast('Comentário adicionado', 'success');
        close(); if (typeof onUpdate === 'function') onUpdate();
      } catch(err) {
        el.querySelector('#sac-tk-det-err').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
      }
    });
  });

  const btnStatus = el.querySelector('#sac-tk-status-btn');
  if (btnStatus) {
    btnStatus.addEventListener('click', function() {
      _withSubmit(this, async () => {
        const status = el.querySelector('#sac-tk-novo-status').value;
        if (!status) { el.querySelector('#sac-tk-det-err').innerHTML = '<div class="form-error">Selecione um status.</div>'; return; }
        try {
          await API.put(`/sac/tickets/${id}/status`, {
            status,
            resolucao: el.querySelector('#sac-tk-resolucao')?.value.trim() || null,
          });
          showToast('Status atualizado!', 'success');
          close(); if (typeof onUpdate === 'function') onUpdate();
        } catch(err) {
          el.querySelector('#sac-tk-det-err').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }
}

async function _sac_novoTicket(user, onCreated) {
  const { el, close } = openModal({
    title: '+ Novo Ticket de Reclamação',
    size: 'md',
    body: `
      <div class="form-group"><label class="form-label">Cliente *</label>
        <input class="form-control" id="sac-nt-cliente" placeholder="Nome do cliente..."></div>
      <div class="form-group"><label class="form-label">Contato (telefone/e-mail)</label>
        <input class="form-control" id="sac-nt-contato" placeholder="(99) 9999-9999 ou email@..."></div>
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-control" id="sac-nt-titulo" placeholder="Descreva brevemente o problema..."></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Categoria</label>
          <select class="form-control" id="sac-nt-cat">
            <option value="embalagem">Embalagem</option>
            <option value="qualidade_produto">Qualidade do Produto</option>
            <option value="entrega">Entrega</option>
            <option value="atendimento">Atendimento</option>
            <option value="cobranca">Cobrança</option>
            <option value="outro" selected>Outro</option>
          </select></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Prioridade</label>
          <select class="form-control" id="sac-nt-prio">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Canal</label>
          <select class="form-control" id="sac-nt-canal">
            <option value="telefone">Telefone</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="portal" selected>Portal</option>
            <option value="presencial">Presencial</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Descrição detalhada *</label>
        <textarea class="form-control" id="sac-nt-desc" rows="4" placeholder="Descreva o problema em detalhes..."></textarea></div>
      <div id="sac-nt-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-nt-cancel">Cancelar</button>
             <button class="btn btn-primary" id="sac-nt-ok">Abrir Ticket</button>`,
  });
  el.querySelector('#sac-nt-cancel').addEventListener('click', close);
  el.querySelector('#sac-nt-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#sac-nt-err');
      errDiv.innerHTML = '';
      const cliente = el.querySelector('#sac-nt-cliente').value.trim();
      const titulo  = el.querySelector('#sac-nt-titulo').value.trim();
      const desc    = el.querySelector('#sac-nt-desc').value.trim();
      if (!cliente || !titulo || !desc) { errDiv.innerHTML = '<div class="form-error">Cliente, título e descrição são obrigatórios.</div>'; return; }
      try {
        const r = await API.post('/sac/tickets', {
          titulo, descricao: desc,
          categoria:  el.querySelector('#sac-nt-cat').value,
          prioridade: el.querySelector('#sac-nt-prio').value,
          canal_entrada: el.querySelector('#sac-nt-canal').value,
          cliente_nome: cliente,
          cliente_contato: el.querySelector('#sac-nt-contato').value.trim() || null,
        });
        const created = r.data || r;
        showToast(`Ticket ${created.codigo} criado!`, 'success');
        close(); if (typeof onCreated === 'function') onCreated();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f02 Registrar Atendimento Avulso ──────────────────────────────────────────

async function _sac_f02(user) {
  const { el, close } = openModal({
    title: '📝 Registrar Atendimento Avulso',
    size: 'lg',
    body: `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">
        Registre atendimentos recebidos por telefone ou WhatsApp que não geraram ticket automático.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:2;min-width:160px;"><label class="form-label">Nome do Cliente *</label>
          <input class="form-control" id="sac-av-cliente" placeholder="Nome completo..."></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Canal *</label>
          <select class="form-control" id="sac-av-canal">
            <option value="telefone">Telefone</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="presencial">Presencial</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Contato (telefone/e-mail)</label>
        <input class="form-control" id="sac-av-contato" placeholder="(99) 99999-9999 ou email@..."></div>
      <div class="form-group"><label class="form-label">Descrição do Atendimento *</label>
        <textarea class="form-control" id="sac-av-desc" rows="4" placeholder="Descreva o que foi conversado, a dúvida ou reclamação do cliente..."></textarea></div>
      <div class="form-group"><label class="form-label">Resultado / Encaminhamento</label>
        <textarea class="form-control" id="sac-av-result" rows="2" placeholder="Como foi resolvido, encaminhado ou o que foi prometido ao cliente..."></textarea></div>
      <div id="sac-av-err"></div>
      <div id="sac-av-lista" style="margin-top:16px;"></div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-secondary" id="sac-av-hist-btn">📋 Ver Histórico de Hoje</button>
             <button class="btn btn-primary" id="sac-av-ok">Registrar</button>`,
  });

  el.querySelector('#sac-av-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#sac-av-err');
      errDiv.innerHTML = '';
      const cliente = el.querySelector('#sac-av-cliente').value.trim();
      const desc    = el.querySelector('#sac-av-desc').value.trim();
      if (!cliente || !desc) { errDiv.innerHTML = '<div class="form-error">Cliente e descrição são obrigatórios.</div>'; return; }
      try {
        await API.post('/sac/atendimentos', {
          canal:           el.querySelector('#sac-av-canal').value,
          cliente_nome:    cliente,
          cliente_contato: el.querySelector('#sac-av-contato').value.trim() || null,
          descricao:       desc,
          resultado:       el.querySelector('#sac-av-result').value.trim() || null,
        });
        showToast('Atendimento registrado!', 'success');
        // Clear form
        ['#sac-av-cliente','#sac-av-contato','#sac-av-desc','#sac-av-result'].forEach(s => { el.querySelector(s).value = ''; });
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });

  el.querySelector('#sac-av-hist-btn').addEventListener('click', async function() {
    const lista = el.querySelector('#sac-av-lista');
    lista.innerHTML = _spinner();
    try {
      const today = new Date().toISOString().split('T')[0];
      const d = await API.get(`/sac/atendimentos?data_inicio=${today}&data_fim=${today}`);
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { lista.innerHTML = '<div style="color:var(--text-muted);font-size:13px;margin-top:8px;">Nenhum atendimento registrado hoje.</div>'; return; }
      lista.innerHTML = `<div style="font-weight:600;margin-bottom:8px;font-size:13px;">Atendimentos de hoje (${rows.length})</div>` +
        rows.map(r => `
          <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:6px;padding:10px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-weight:600;font-size:13px;">${_sac_canalIcon(r.canal)} ${escapeHtml(r.cliente_nome)}</span>
              <span style="font-size:12px;color:var(--text-muted);">${_sac_fmtDT(r.created_at)}</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(r.descricao||'').slice(0,120)}${(r.descricao||'').length>120?'...':''}</div>
          </div>`).join('');
    } catch(e) { lista.innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  });
}

// ── f03 Vínculo com a Qualidade ───────────────────────────────────────────────

async function _sac_f03(user) {
  let tickets = [];
  try {
    const d = await API.get('/sac/tickets?status=aberto');
    tickets = Array.isArray(d) ? d : (d.data || []);
    // also get em_analise
    const d2 = await API.get('/sac/tickets?status=em_analise');
    tickets = tickets.concat(Array.isArray(d2) ? d2 : (d2.data || []));
  } catch(e) { showToast('Erro ao carregar tickets: ' + e.message, 'error'); return; }

  const { el, close } = openModal({
    title: '🔗 Vínculo com a Qualidade — Rastreabilidade',
    size: 'md',
    body: `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">
        Associe uma reclamação a um lote de produção para alertar o setor de Qualidade sobre possíveis problemas sistêmicos.
      </p>
      <div class="form-group"><label class="form-label">Ticket de Reclamação *</label>
        <select class="form-control" id="sac-vq-ticket">
          <option value="">— Selecione o ticket —</option>
          ${tickets.map(t => `<option value="${t.id}">[${escapeHtml(t.codigo)}] ${escapeHtml(t.cliente_nome)} — ${escapeHtml(t.titulo.slice(0,60))}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Número do Lote de Produção *</label>
        <input class="form-control" id="sac-vq-lote" placeholder="Ex: LOT-2026-04-001"></div>
      <div class="form-group"><label class="form-label">Observação para o setor de Qualidade</label>
        <textarea class="form-control" id="sac-vq-obs" rows="3" placeholder="Descreva o problema identificado e a relação com o lote..."></textarea></div>
      <div style="padding:12px;background:rgba(251,146,60,0.08);border-radius:8px;font-size:13px;color:#fb923c;margin-top:8px;">
        ⚠️ Ao vincular um lote, o setor de Qualidade será notificado para verificar o lote e confirmar se o problema é pontual ou sistêmico.
      </div>
      <div id="sac-vq-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-vq-cancel">Cancelar</button>
             <button class="btn btn-warning" id="sac-vq-ok">Vincular Lote e Alertar Qualidade</button>`,
  });
  el.querySelector('#sac-vq-cancel').addEventListener('click', close);
  el.querySelector('#sac-vq-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#sac-vq-err');
      errDiv.innerHTML = '';
      const ticketId = el.querySelector('#sac-vq-ticket').value;
      const lote     = el.querySelector('#sac-vq-lote').value.trim();
      if (!ticketId) { errDiv.innerHTML = '<div class="form-error">Selecione um ticket.</div>'; return; }
      if (!lote)     { errDiv.innerHTML = '<div class="form-error">Número do lote é obrigatório.</div>'; return; }
      try {
        await API.put(`/sac/tickets/${ticketId}/lote`, {
          lote_vinculado: lote,
          observacao_qualidade: el.querySelector('#sac-vq-obs').value.trim() || null,
        });
        showToast('Lote vinculado! Qualidade notificada.', 'success');
        close();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f04 Gestão de Garantias e Trocas ─────────────────────────────────────────

async function _sac_f04(user) {
  const { el, close } = openModal({
    title: '🔄 Gestão de Garantias e Trocas',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select class="form-control" id="sac-gt-fil" style="width:160px;">
          <option value="pendente">Pendentes</option>
          <option value="aprovada">Aprovadas</option>
          <option value="rejeitada">Rejeitadas</option>
          <option value="">Todas</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sac-gt-buscar">Filtrar</button>
      </div>
      <div id="sac-gt-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sac-gt-nova-btn">+ Nova Solicitação</button>`,
  });

  async function loadGarantias() {
    const status = el.querySelector('#sac-gt-fil').value;
    el.querySelector('#sac-gt-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/garantias' + (status ? `?status=${status}` : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-gt-list').innerHTML = _empty(); return; }
      const stBadge = s => ({ pendente:'warning', aprovada:'success', rejeitada:'danger', concluida:'muted' })[s] || 'muted';
      el.querySelector('#sac-gt-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Ticket</th><th>Cliente</th><th>Tipo</th><th>Descrição</th><th>Status</th><th>Valor</th><th>Data</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><code>${escapeHtml(r.ticket_codigo||'Avulso')}</code></td>
                  <td>${escapeHtml(r.cliente_nome||'—')}</td>
                  <td><span class="badge badge-info">${escapeHtml(r.tipo||'—')}</span></td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.descricao||'—')}</td>
                  <td><span class="badge badge-${stBadge(r.status)}">${escapeHtml(r.status||'—')}</span></td>
                  <td>${r.valor_credito ? _fmtMoney(r.valor_credito) : '—'}</td>
                  <td>${_sac_fmtD(r.data_solicitacao)}</td>
                  <td>${r.status === 'pendente' ? `<button class="btn btn-xs btn-primary sac-gt-resp" data-id="${r.id}">Responder</button>` : `<span style="font-size:11px;color:var(--text-muted);">${escapeHtml(r.aprovador_nome||'—')}</span>`}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sac-gt-resp').forEach(btn =>
        btn.addEventListener('click', () => _sac_responderGarantia(btn.dataset.id, loadGarantias))
      );
    } catch(e) { el.querySelector('#sac-gt-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  el.querySelector('#sac-gt-buscar').addEventListener('click', loadGarantias);
  el.querySelector('#sac-gt-nova-btn').addEventListener('click', () => _sac_novaGarantia(loadGarantias));
  loadGarantias();
}

async function _sac_novaGarantia(onCreated) {
  let tickets = [];
  try {
    const d = await API.get('/sac/tickets?status=aberto');
    tickets = Array.isArray(d) ? d : (d.data || []);
  } catch {}

  const { el, close } = openModal({
    title: '+ Nova Solicitação de Garantia/Troca',
    size: 'md',
    body: `
      <div class="form-group"><label class="form-label">Ticket relacionado (opcional)</label>
        <select class="form-control" id="sac-ng-ticket">
          <option value="">— Sem ticket vinculado —</option>
          ${tickets.map(t => `<option value="${t.id}">[${escapeHtml(t.codigo)}] ${escapeHtml(t.cliente_nome)}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Tipo *</label>
        <select class="form-control" id="sac-ng-tipo">
          <option value="troca">Troca do produto</option>
          <option value="credito">Crédito na conta</option>
          <option value="devolucao">Devolução financeira</option>
          <option value="reparo">Reparo</option>
        </select></div>
      <div class="form-group"><label class="form-label">Descrição *</label>
        <textarea class="form-control" id="sac-ng-desc" rows="3" placeholder="Detalhe o que o cliente solicitou..."></textarea></div>
      <div class="form-group"><label class="form-label">Valor do crédito (R$) — se aplicável</label>
        <input class="form-control" id="sac-ng-valor" type="number" min="0" step="0.01" placeholder="0,00"></div>
      <div id="sac-ng-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-ng-cancel">Cancelar</button>
             <button class="btn btn-primary" id="sac-ng-ok">Enviar Solicitação</button>`,
  });
  el.querySelector('#sac-ng-cancel').addEventListener('click', close);
  el.querySelector('#sac-ng-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const desc = el.querySelector('#sac-ng-desc').value.trim();
      const errDiv = el.querySelector('#sac-ng-err');
      errDiv.innerHTML = '';
      if (!desc) { errDiv.innerHTML = '<div class="form-error">Descrição é obrigatória.</div>'; return; }
      try {
        await API.post('/sac/garantias', {
          ticket_id:   el.querySelector('#sac-ng-ticket').value || null,
          tipo:        el.querySelector('#sac-ng-tipo').value,
          descricao:   desc,
          valor_credito: el.querySelector('#sac-ng-valor').value || null,
        });
        showToast('Solicitação criada!', 'success');
        close(); if (typeof onCreated === 'function') onCreated();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

async function _sac_responderGarantia(id, onDone) {
  const { el, close } = openModal({
    title: '⚖️ Responder Solicitação de Garantia',
    size: 'sm',
    body: `
      <div class="form-group"><label class="form-label">Decisão *</label>
        <select class="form-control" id="sac-rg-dec">
          <option value="aprovada">✅ Aprovar</option>
          <option value="rejeitada">❌ Rejeitar</option>
        </select></div>
      <div class="form-group"><label class="form-label">Observação</label>
        <textarea class="form-control" id="sac-rg-obs" rows="2" placeholder="Justifique sua decisão..."></textarea></div>
      <div id="sac-rg-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-rg-cancel">Cancelar</button>
             <button class="btn btn-primary" id="sac-rg-ok">Confirmar</button>`,
  });
  el.querySelector('#sac-rg-cancel').addEventListener('click', close);
  el.querySelector('#sac-rg-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#sac-rg-err');
      errDiv.innerHTML = '';
      try {
        await API.put(`/sac/garantias/${id}/responder`, {
          status: el.querySelector('#sac-rg-dec').value,
          observacao: el.querySelector('#sac-rg-obs').value.trim() || null,
        });
        showToast('Respondido!', 'success');
        close(); if (typeof onDone === 'function') onDone();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f05 Classificação de Motivos ──────────────────────────────────────────────

async function _sac_f05(user) {
  const { el, close } = openModal({
    title: '🏷️ Classificação de Motivos de Reclamação',
    size: 'lg',
    body: `<div id="sac-mo-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sac-mo-novo-btn">+ Novo Motivo</button>`,
  });

  async function loadMotivos() {
    el.querySelector('#sac-mo-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/motivos');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-mo-list').innerHTML = _empty(); return; }
      // Group by categoria
      const grupos = {};
      rows.forEach(r => { if (!grupos[r.categoria]) grupos[r.categoria] = []; grupos[r.categoria].push(r); });
      el.querySelector('#sac-mo-list').innerHTML = Object.entries(grupos).map(([cat, items]) => `
        <div style="margin-bottom:14px;">
          <div style="font-weight:600;font-size:13px;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(cat)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${items.map(m => `
              <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid var(--border-color);border-radius:20px;padding:4px 12px;">
                <span style="font-size:13px;">${escapeHtml(m.nome)}</span>
                <button class="btn btn-xs btn-danger sac-mo-del" data-id="${m.id}" data-nome="${escapeHtml(m.nome)}" style="padding:0 5px;border-radius:50%;line-height:1;">×</button>
              </div>`).join('')}
          </div>
        </div>`).join('');
      el.querySelectorAll('.sac-mo-del').forEach(btn => {
        btn.addEventListener('click', function() {
          _withSubmit(this, async () => {
            if (!confirm(`Excluir motivo "${btn.dataset.nome}"?`)) return;
            try {
              await API.delete('/sac/motivos/' + btn.dataset.id);
              showToast('Motivo excluído', 'success');
              loadMotivos();
            } catch(err) { showToast('Erro: ' + err.message, 'error'); }
          });
        });
      });
    } catch(e) { el.querySelector('#sac-mo-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  el.querySelector('#sac-mo-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Motivo',
      size: 'sm',
      body: `
        <div class="form-group"><label class="form-label">Nome do Motivo *</label>
          <input class="form-control" id="sac-nm-nome" placeholder="Ex: Embalagem Amassada, Produto Vencido..."></div>
        <div class="form-group"><label class="form-label">Categoria</label>
          <select class="form-control" id="sac-nm-cat">
            <option value="Embalagem">Embalagem</option>
            <option value="Qualidade">Qualidade do Produto</option>
            <option value="Entrega">Entrega</option>
            <option value="Atendimento">Atendimento</option>
            <option value="Cobrança">Cobrança</option>
            <option value="Geral" selected>Geral</option>
          </select></div>
        <div id="sac-nm-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sac-nm-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sac-nm-ok">Criar</button>`,
    });
    e2.querySelector('#sac-nm-cancel').addEventListener('click', c2);
    e2.querySelector('#sac-nm-ok').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const nome = e2.querySelector('#sac-nm-nome').value.trim();
        if (!nome) { e2.querySelector('#sac-nm-err').innerHTML = '<div class="form-error">Nome obrigatório.</div>'; return; }
        try {
          await API.post('/sac/motivos', { nome, categoria: e2.querySelector('#sac-nm-cat').value });
          showToast('Motivo criado!', 'success');
          c2(); loadMotivos();
        } catch(err) { e2.querySelector('#sac-nm-err').innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  });

  loadMotivos();
}

// ── f06 NPS ───────────────────────────────────────────────────────────────────

async function _sac_f06(user) {
  const { el, close } = openModal({
    title: '⭐ Monitoramento de Satisfação — NPS',
    size: 'lg',
    body: `<div id="sac-nps-body">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" id="sac-nps-close">Fechar</button>`,
  });
  el.querySelector('#sac-nps-close').addEventListener('click', close);
  try {
    const d = await API.get('/sac/nps');
    const nps = d.data || d;
    const notaLabel = ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];
    const scoreColor = nps.nps_score === null ? '#94a3b8' : nps.nps_score >= 50 ? '#4ade80' : nps.nps_score >= 0 ? '#fb923c' : '#f87171';
    el.querySelector('#sac-nps-body').innerHTML = `
      <div style="text-align:center;padding:16px 0;margin-bottom:16px;border-bottom:1px solid var(--border-color);">
        <div style="font-size:14px;color:var(--text-muted);margin-bottom:4px;">NPS Score (últimos 30 dias)</div>
        <div style="font-size:52px;font-weight:800;color:${scoreColor};">${nps.nps_score !== null ? nps.nps_score : '—'}</div>
        <div style="font-size:13px;color:var(--text-muted);">Baseado em ${nps.total_avaliacoes||0} avaliação(ões)</div>
        <div style="display:flex;gap:16px;justify-content:center;margin-top:10px;font-size:13px;">
          <span>🟢 Promotores: <strong>${nps.promotores||0}</strong></span>
          <span>🟡 Neutros: <strong>${nps.neutros||0}</strong></span>
          <span>🔴 Detratores: <strong>${nps.detratores||0}</strong></span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Nota média: <strong>${nps.media ? Number(nps.media).toFixed(1) : '—'}</strong> / 5.0</div>
      </div>
      <div style="font-weight:600;margin-bottom:10px;font-size:14px;">Distribuição por nota</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${[5,4,3,2,1].map(nota => {
          const item = (nps.porNota||[]).find(n => Number(n.nota) === nota);
          const total = nps.total_avaliacoes || 1;
          const count = item ? Number(item.total) : 0;
          const pct   = Math.round((count / total) * 100);
          const barColor = nota >= 4 ? '#4ade80' : nota === 3 ? '#fb923c' : '#f87171';
          return `
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:80px;font-size:13px;">${notaLabel[nota]}</span>
              <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:18px;overflow:hidden;">
                <div style="width:${pct}%;background:${barColor};height:100%;border-radius:4px;transition:width 0.6s;"></div>
              </div>
              <span style="width:50px;font-size:12px;color:var(--text-muted);text-align:right;">${count} (${pct}%)</span>
            </div>`;
        }).join('')}
      </div>
      ${!nps.total_avaliacoes ? `<div style="margin-top:16px;padding:12px;background:rgba(59,130,246,0.08);border-radius:8px;font-size:13px;color:#60a5fa;">ℹ️ Nenhuma avaliação registrada nos últimos 30 dias. As notas são preenchidas pelos atendentes ao fechar tickets.</div>` : ''}`;
  } catch(e) {
    el.querySelector('#sac-nps-body').innerHTML = `<div class="form-error">Erro ao carregar NPS: ${escapeHtml(e.message)}</div>`;
  }
}

// ── f07 Comunicação em Massa ──────────────────────────────────────────────────

async function _sac_f07(user) {
  const { el, close } = openModal({
    title: '📣 Comunicação e Suporte em Massa',
    size: 'lg',
    body: `
      <div id="sac-com-lista" style="margin-bottom:14px;max-height:160px;overflow-y:auto;">${_spinner()}</div>
      <hr style="border-color:var(--border-color);margin:10px 0;">
      <div style="font-weight:600;margin-bottom:10px;">Novo Comunicado</div>
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-control" id="sac-cm-titulo" placeholder="Ex: Aviso de Férias Coletivas..."></div>
      <div class="form-group"><label class="form-label">Canal de Envio</label>
        <select class="form-control" id="sac-cm-canal">
          <option value="email">E-mail</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="portal">Portal do Cliente</option>
          <option value="todos">Todos os canais</option>
        </select></div>
      <div class="form-group"><label class="form-label">Mensagem *</label>
        <textarea class="form-control" id="sac-cm-msg" rows="5" placeholder="Digite a mensagem que será enviada para os clientes..."></textarea></div>
      <div id="sac-cm-err"></div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sac-cm-ok">📤 Enviar Comunicado</button>`,
  });

  // Load recent comunicados
  try {
    const d = await API.get('/sac/comunicados');
    const rows = Array.isArray(d) ? d : (d.data || []);
    el.querySelector('#sac-com-lista').innerHTML = rows.length ? `
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Comunicados recentes</div>
      ${rows.slice(0,5).map(r => `
        <div style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:6px;margin-bottom:4px;display:flex;justify-content:space-between;">
          <span style="font-size:13px;">${escapeHtml(r.titulo)}</span>
          <span style="font-size:11px;color:var(--text-muted);">${_sac_canalIcon(r.canal)} ${_sac_fmtD(r.created_at)}</span>
        </div>`).join('')}` : '<div style="color:var(--text-muted);font-size:13px;">Nenhum comunicado enviado ainda.</div>';
  } catch {}

  el.querySelector('#sac-cm-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#sac-cm-err');
      errDiv.innerHTML = '';
      const titulo  = el.querySelector('#sac-cm-titulo').value.trim();
      const mensagem = el.querySelector('#sac-cm-msg').value.trim();
      if (!titulo || !mensagem) { errDiv.innerHTML = '<div class="form-error">Título e mensagem são obrigatórios.</div>'; return; }
      try {
        await API.post('/sac/comunicados', { titulo, mensagem, canal: el.querySelector('#sac-cm-canal').value });
        showToast('Comunicado registrado!', 'success');
        el.querySelector('#sac-cm-titulo').value = '';
        el.querySelector('#sac-cm-msg').value = '';
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f08 Gestão de Recall ──────────────────────────────────────────────────────

async function _sac_f08(user) {
  const { el, close } = openModal({
    title: '🚨 Gestão de Recall',
    size: 'xl',
    body: `<div id="sac-rc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-danger" id="sac-rc-novo-btn">🚨 Disparar Recall</button>`,
  });

  async function loadRecall() {
    el.querySelector('#sac-rc-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/recall');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-rc-list').innerHTML = '<div class="empty-state"><span class="empty-state-icon">✅</span><span class="empty-state-title">Nenhum recall ativo. Sistema seguro.</span></div>'; return; }
      const urgBadge = u => ({ medio:'info', alto:'warning', critico:'danger' })[u] || 'muted';
      el.querySelector('#sac-rc-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Código</th><th>Produto</th><th>Lote</th><th>Urgência</th><th>Status</th><th>Responsável</th><th>Início</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr ${r.status === 'ativo' ? 'style="background:rgba(239,68,68,0.06);"' : ''}>
                  <td><code>${escapeHtml(r.codigo)}</code></td>
                  <td><strong>${escapeHtml(r.produto)}</strong></td>
                  <td>${escapeHtml(r.lote||'—')}</td>
                  <td><span class="badge badge-${urgBadge(r.nivel_urgencia)}">${escapeHtml(r.nivel_urgencia)}</span></td>
                  <td>${_sac_recallBadge(r.status)}</td>
                  <td>${escapeHtml(r.responsavel_nome||'—')}</td>
                  <td>${_sac_fmtD(r.data_inicio)}</td>
                  <td>${!['concluido','cancelado'].includes(r.status) ? `<button class="btn btn-xs btn-warning sac-rc-up" data-id="${r.id}">Atualizar</button>` : ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sac-rc-up').forEach(btn =>
        btn.addEventListener('click', () => _sac_atualizarRecall(btn.dataset.id, loadRecall))
      );
    } catch(e) { el.querySelector('#sac-rc-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  el.querySelector('#sac-rc-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '🚨 Disparar Procedimento de Recall',
      size: 'md',
      body: `
        <div style="padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;margin-bottom:14px;font-size:13px;color:#f87171;">
          ⚠️ <strong>AÇÃO CRÍTICA.</strong> Esta operação inicia o procedimento formal de recall de produto. Certifique-se de ter autorização da gerência.
        </div>
        <div class="form-group"><label class="form-label">Produto afetado *</label>
          <input class="form-control" id="sac-nr-produto" placeholder="Ex: Iogurte Natural 200ml"></div>
        <div class="form-group"><label class="form-label">Número do Lote</label>
          <input class="form-control" id="sac-nr-lote" placeholder="LOT-2026-04-001"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;"><label class="form-label">Nível de Urgência *</label>
            <select class="form-control" id="sac-nr-urg">
              <option value="medio">Médio — Risco baixo</option>
              <option value="alto" selected>Alto — Risco à saúde</option>
              <option value="critico">Crítico — Risco grave imediato</option>
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Motivo / Risco *</label>
          <textarea class="form-control" id="sac-nr-motivo" rows="3" placeholder="Descreva o motivo do recall e o risco identificado..."></textarea></div>
        <div class="form-group"><label class="form-label">Plano de ação / Instruções</label>
          <textarea class="form-control" id="sac-nr-desc" rows="3" placeholder="Descreva o plano de recolhimento..."></textarea></div>
        <div id="sac-nr-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sac-nr-cancel">Cancelar</button>
               <button class="btn btn-danger" id="sac-nr-ok">🚨 Confirmar Recall</button>`,
    });
    e2.querySelector('#sac-nr-cancel').addEventListener('click', c2);
    e2.querySelector('#sac-nr-ok').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const errDiv = e2.querySelector('#sac-nr-err');
        errDiv.innerHTML = '';
        const produto = e2.querySelector('#sac-nr-produto').value.trim();
        const motivo  = e2.querySelector('#sac-nr-motivo').value.trim();
        if (!produto || !motivo) { errDiv.innerHTML = '<div class="form-error">Produto e motivo são obrigatórios.</div>'; return; }
        try {
          const r = await API.post('/sac/recall', {
            produto, motivo,
            lote:           e2.querySelector('#sac-nr-lote').value.trim() || null,
            nivel_urgencia: e2.querySelector('#sac-nr-urg').value,
            descricao:      e2.querySelector('#sac-nr-desc').value.trim() || null,
          });
          const created = r.data || r;
          showToast(`Recall ${created.codigo} disparado!`, 'error');
          c2(); loadRecall();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  });

  loadRecall();
}

async function _sac_atualizarRecall(id, onDone) {
  const { el, close } = openModal({
    title: '📋 Atualizar Recall',
    size: 'sm',
    body: `
      <div class="form-group"><label class="form-label">Novo Status *</label>
        <select class="form-control" id="sac-ur-status">
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select></div>
      <div class="form-group"><label class="form-label">Observação de fechamento</label>
        <textarea class="form-control" id="sac-ur-obs" rows="2" placeholder="Descreva o resultado do recall..."></textarea></div>
      <div id="sac-ur-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-ur-cancel">Cancelar</button>
             <button class="btn btn-primary" id="sac-ur-ok">Salvar</button>`,
  });
  el.querySelector('#sac-ur-cancel').addEventListener('click', close);
  el.querySelector('#sac-ur-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#sac-ur-err');
      errDiv.innerHTML = '';
      try {
        await API.put(`/sac/recall/${id}/status`, {
          status: el.querySelector('#sac-ur-status').value,
          observacao: el.querySelector('#sac-ur-obs').value.trim() || null,
        });
        showToast('Recall atualizado!', 'success');
        close(); if (typeof onDone === 'function') onDone();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f09 Relatórios de SLA ─────────────────────────────────────────────────────

async function _sac_f09(user) {
  const { el, close } = openModal({
    title: '📊 Relatórios de SLA — Indicadores de Tempo de Resposta',
    size: 'xl',
    body: `<div id="sac-sla-body">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" id="sac-sla-close">Fechar</button>`,
  });
  el.querySelector('#sac-sla-close').addEventListener('click', close);
  try {
    const d = await API.get('/sac/relatorio-sla');
    const sla = d.data || d;
    const catLabel = { embalagem:'Embalagem', qualidade_produto:'Qualidade', entrega:'Entrega', atendimento:'Atendimento', cobranca:'Cobrança', outro:'Outro' };
    const foraPrazo = Number(sla.foraPrazo || 0);
    const totalAtivos = Number(sla.totalAtivos || 0);
    el.querySelector('#sac-sla-body').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);">Em aberto</div>
          <div style="font-size:28px;font-weight:700;">${sla.totalAtivos||0}</div>
        </div>
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);">Dentro do prazo</div>
          <div style="font-size:28px;font-weight:700;color:#4ade80;">${sla.dentroPrazo||0}</div>
        </div>
        <div style="background:rgba(239,68,68,${foraPrazo>0?'0.08':'0.02'});border:1px solid rgba(239,68,68,${foraPrazo>0?'0.3':'0.1'});border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);">Fora do prazo</div>
          <div style="font-size:28px;font-weight:700;color:${foraPrazo>0?'#f87171':'var(--text-primary)'};">${foraPrazo}</div>
        </div>
      </div>
      ${(sla.porCategoria||[]).length ? `
        <div style="font-weight:600;margin-bottom:10px;">Por Categoria (últimos 30 dias)</div>
        <div style="overflow-x:auto;margin-bottom:16px;">
          <table class="table" style="font-size:13px;">
            <thead><tr><th>Categoria</th><th>Total</th><th>Resolvidos</th><th>Abertos</th><th>SLA Médio (horas)</th></tr></thead>
            <tbody>
              ${sla.porCategoria.map(r => `
                <tr>
                  <td>${escapeHtml(catLabel[r.categoria]||r.categoria)}</td>
                  <td>${r.total}</td>
                  <td><span style="color:#4ade80;">${r.resolvidos}</span></td>
                  <td>${r.abertos}</td>
                  <td>${r.sla_medio_horas != null ? r.sla_medio_horas + 'h' : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
      ${(sla.porMes||[]).length ? `
        <div style="font-weight:600;margin-bottom:10px;">Tendência Mensal (6 meses)</div>
        <div style="display:flex;gap:8px;align-items:flex-end;height:80px;overflow-x:auto;">
          ${(() => {
            const maxTotal = Math.max(...sla.porMes.map(r => Number(r.total)), 1);
            return sla.porMes.map(r => {
              const pct = Math.round((Number(r.total) / maxTotal) * 100);
              const [ano, mes] = r.mes.split('-');
              return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:48px;">
                <div style="font-size:11px;color:var(--text-muted);">${r.total}</div>
                <div style="width:36px;background:rgba(59,130,246,0.6);border-radius:4px 4px 0 0;height:${pct}%;">&nbsp;</div>
                <div style="font-size:11px;color:var(--text-muted);">${mes}/${ano.slice(2)}</div>
              </div>`;
            }).join('');
          })()}
        </div>` : ''}
      ${!totalAtivos && !(sla.porCategoria||[]).length ? '<div style="color:var(--text-muted);font-size:13px;margin-top:10px;">Nenhum dado disponível para o período.</div>' : ''}`;
  } catch(e) {
    el.querySelector('#sac-sla-body').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
  }
}

// ── f10 Histórico do Cliente ──────────────────────────────────────────────────

async function _sac_f10(user) {
  const { el, close } = openModal({
    title: '👤 Histórico Completo do Cliente',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input class="form-control" id="sac-hc-busca" placeholder="🔍 Digite o nome do cliente..." style="flex:1;">
        <button class="btn btn-secondary" id="sac-hc-buscar">Buscar</button>
      </div>
      <div id="sac-hc-result"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-hc-close">Fechar</button>`,
  });
  el.querySelector('#sac-hc-close').addEventListener('click', close);

  async function buscarHistorico() {
    const nome = el.querySelector('#sac-hc-busca').value.trim();
    if (!nome) return;
    const resultDiv = el.querySelector('#sac-hc-result');
    resultDiv.innerHTML = _spinner();
    try {
      const d = await API.get(`/sac/historico-cliente?cliente_nome=${encodeURIComponent(nome)}`);
      const data = d.data || d;
      const tickets = data.tickets || [];
      const atends  = data.atendimentos || [];
      if (!tickets.length && !atends.length) {
        resultDiv.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🔍</span><span class="empty-state-title">Nenhum histórico encontrado para "${escapeHtml(nome)}"</span></div>`;
        return;
      }
      resultDiv.innerHTML = `
        ${tickets.length ? `
          <div style="font-weight:600;margin-bottom:8px;">Tickets (${tickets.length})</div>
          <div style="overflow-x:auto;margin-bottom:16px;">
            <table class="table" style="font-size:13px;">
              <thead><tr><th>Código</th><th>Título</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Abertura</th></tr></thead>
              <tbody>
                ${tickets.map(t => `
                  <tr>
                    <td><code>${escapeHtml(t.codigo||'—')}</code></td>
                    <td>${escapeHtml(t.titulo||'—')}</td>
                    <td><span class="badge badge-muted">${escapeHtml((t.categoria||'').replace(/_/g,' '))}</span></td>
                    <td>${_sac_prioBadge(t.prioridade)}</td>
                    <td>${_sac_statusBadge(t.status)}</td>
                    <td>${_sac_fmtDT(t.data_abertura)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : ''}
        ${atends.length ? `
          <div style="font-weight:600;margin-bottom:8px;">Atendimentos Avulsos (${atends.length})</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${atends.map(a => `
              <div style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:6px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                  <span>${_sac_canalIcon(a.canal)} ${escapeHtml(a.canal||'—')}</span>
                  <span style="color:var(--text-muted);font-size:11px;">${_sac_fmtDT(a.created_at)} · ${escapeHtml(a.usuario_nome||'—')}</span>
                </div>
                <div>${escapeHtml((a.descricao||'').slice(0,120))}${(a.descricao||'').length>120?'...':''}</div>
              </div>`).join('')}
          </div>` : ''}`;
    } catch(e) { resultDiv.innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  el.querySelector('#sac-hc-buscar').addEventListener('click', buscarHistorico);
  el.querySelector('#sac-hc-busca').addEventListener('keydown', e => { if (e.key === 'Enter') buscarHistorico(); });
}

// ── f11 Templates de Resposta ─────────────────────────────────────────────────

async function _sac_f11(user) {
  const podEditar = user && user.nivel_acesso >= 4;

  const { el, close } = openModal({
    title: '📄 Templates de Resposta',
    size: 'xl',
    body: `<div id="sac-tp-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             ${podEditar ? `<button class="btn btn-primary" id="sac-tp-novo-btn">+ Novo Template</button>` : ''}`,
  });

  async function loadTemplates() {
    el.querySelector('#sac-tp-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/templates');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-tp-list').innerHTML = _empty(); return; }
      const grupos = {};
      rows.forEach(r => { if (!grupos[r.categoria]) grupos[r.categoria] = []; grupos[r.categoria].push(r); });
      el.querySelector('#sac-tp-list').innerHTML = Object.entries(grupos).map(([cat, items]) => `
        <div style="margin-bottom:16px;">
          <div style="font-weight:600;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${escapeHtml(cat)}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${items.map(t => `
              <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <div style="font-weight:600;">${escapeHtml(t.titulo)}</div>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-xs btn-secondary sac-tp-ver" data-id="${t.id}">Ver</button>
                    ${podEditar ? `<button class="btn btn-xs btn-secondary sac-tp-edit" data-id="${t.id}">Editar</button>
                    <button class="btn btn-xs btn-danger sac-tp-del" data-id="${t.id}" data-titulo="${escapeHtml(t.titulo)}">×</button>` : ''}
                  </div>
                </div>
                <div style="font-size:12px;color:var(--text-muted);">Assunto: ${escapeHtml(t.assunto||'—')}</div>
              </div>`).join('')}
          </div>
        </div>`).join('');

      el.querySelectorAll('.sac-tp-ver').forEach(btn =>
        btn.addEventListener('click', () => _sac_verTemplate(btn.dataset.id))
      );
      if (podEditar) {
        el.querySelectorAll('.sac-tp-edit').forEach(btn =>
          btn.addEventListener('click', async () => {
            const d2 = await API.get('/sac/templates/' + btn.dataset.id);
            _sac_editarTemplate(d2.data || d2, loadTemplates);
          })
        );
        el.querySelectorAll('.sac-tp-del').forEach(btn => {
          btn.addEventListener('click', function() {
            _withSubmit(this, async () => {
              if (!confirm(`Excluir template "${btn.dataset.titulo}"?`)) return;
              try { await API.delete('/sac/templates/' + btn.dataset.id); showToast('Template excluído', 'success'); loadTemplates(); }
              catch(err) { showToast('Erro: ' + err.message, 'error'); }
            });
          });
        });
      }
    } catch(e) { el.querySelector('#sac-tp-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  const novoBtn = el.querySelector('#sac-tp-novo-btn');
  if (novoBtn) novoBtn.addEventListener('click', () => _sac_editarTemplate(null, loadTemplates));
  loadTemplates();
}

async function _sac_verTemplate(id) {
  let t;
  try { const d = await API.get('/sac/templates/' + id); t = d.data || d; }
  catch(e) { showToast('Erro: ' + e.message, 'error'); return; }
  const { el, close } = openModal({
    title: `📄 ${escapeHtml(t.titulo||'')}`,
    size: 'lg',
    body: `
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Assunto: ${escapeHtml(t.assunto||'—')} · Categoria: ${escapeHtml(t.categoria||'—')}</div>
      <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.7;">${escapeHtml(t.corpo||'')}</div>`,
    footer: `<button class="btn btn-secondary" id="sac-tv-close">Fechar</button>`,
  });
  el.querySelector('#sac-tv-close').addEventListener('click', close);
}

async function _sac_editarTemplate(t, onSaved) {
  const isNew = !t;
  const { el, close } = openModal({
    title: isNew ? '+ Novo Template' : '✏️ Editar Template',
    size: 'lg',
    body: `
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-control" id="sac-te-titulo" value="${isNew ? '' : escapeHtml(t.titulo||'')}"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:2;min-width:200px;"><label class="form-label">Assunto do e-mail</label>
          <input class="form-control" id="sac-te-assunto" value="${isNew ? '' : escapeHtml(t.assunto||'')}"></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Categoria</label>
          <select class="form-control" id="sac-te-cat">
            ${['Geral','Reclamação','Devolução','Entrega','Cobrança','Produto'].map(c =>
              `<option value="${c}" ${!isNew && t.categoria===c?'selected':''}>${c}</option>`
            ).join('')}
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Corpo da mensagem *</label>
        <textarea class="form-control" id="sac-te-corpo" rows="10">${isNew ? '' : escapeHtml(t.corpo||'')}</textarea></div>
      <div id="sac-te-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-te-cancel">Cancelar</button>
             <button class="btn btn-primary" id="sac-te-ok">${isNew ? 'Criar' : 'Salvar'}</button>`,
  });
  el.querySelector('#sac-te-cancel').addEventListener('click', close);
  el.querySelector('#sac-te-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const titulo = el.querySelector('#sac-te-titulo').value.trim();
      const corpo  = el.querySelector('#sac-te-corpo').value.trim();
      const errDiv = el.querySelector('#sac-te-err');
      errDiv.innerHTML = '';
      if (!titulo || !corpo) { errDiv.innerHTML = '<div class="form-error">Título e corpo são obrigatórios.</div>'; return; }
      try {
        const payload = { titulo, corpo, assunto: el.querySelector('#sac-te-assunto').value.trim()||titulo, categoria: el.querySelector('#sac-te-cat').value };
        if (isNew) await API.post('/sac/templates', payload);
        else       await API.put('/sac/templates/' + t.id, payload);
        showToast(isNew ? 'Template criado!' : 'Template salvo!', 'success');
        close(); if (typeof onSaved === 'function') onSaved();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f12 Base de Conhecimento SAC ──────────────────────────────────────────────

async function _sac_f12(user) {
  const podEditar = user && user.nivel_acesso >= 2;

  const { el, close } = openModal({
    title: '📚 Base de Conhecimento SAC (Wiki)',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input class="form-control" id="sac-bk-busca" placeholder="🔍 Buscar artigos..." style="flex:1;">
        <button class="btn btn-sm btn-secondary" id="sac-bk-buscar">Buscar</button>
      </div>
      <div id="sac-bk-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             ${podEditar ? `<button class="btn btn-primary" id="sac-bk-novo-btn">+ Novo Artigo</button>` : ''}`,
  });

  async function loadArtigos() {
    const busca = el.querySelector('#sac-bk-busca').value.trim();
    el.querySelector('#sac-bk-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/base-conhecimento' + (busca ? `?busca=${encodeURIComponent(busca)}` : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-bk-list').innerHTML = _empty(); return; }
      el.querySelector('#sac-bk-list').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${rows.map(r => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;" class="sac-bk-item" data-id="${r.id}">
              <div>
                <div style="font-weight:600;margin-bottom:3px;">${escapeHtml(r.titulo)}</div>
                <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(r.categoria)} · Por ${escapeHtml(r.autor_nome||'—')} · ${_sac_fmtD(r.updated_at)}</div>
              </div>
              <span class="badge badge-muted">${escapeHtml(r.categoria)}</span>
            </div>`).join('')}
        </div>`;
      el.querySelectorAll('.sac-bk-item').forEach(item =>
        item.addEventListener('click', () => _sac_verArtigoConhecimento(item.dataset.id, podEditar, loadArtigos))
      );
    } catch(e) { el.querySelector('#sac-bk-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  el.querySelector('#sac-bk-buscar').addEventListener('click', loadArtigos);
  el.querySelector('#sac-bk-busca').addEventListener('keydown', e => { if (e.key === 'Enter') loadArtigos(); });
  const novoBtn = el.querySelector('#sac-bk-novo-btn');
  if (novoBtn) novoBtn.addEventListener('click', () => _sac_editarArtigoConhecimento(null, loadArtigos));
  loadArtigos();
}

async function _sac_verArtigoConhecimento(id, podEditar, onUpdate) {
  let art;
  try { const d = await API.get('/sac/base-conhecimento/' + id); art = d.data || d; }
  catch(e) { showToast('Erro: ' + e.message, 'error'); return; }
  const { el, close } = openModal({
    title: `📄 ${escapeHtml(art.titulo||'')}`,
    size: 'lg',
    body: `
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;"><span class="badge badge-muted">${escapeHtml(art.categoria)}</span> · Por ${escapeHtml(art.autor_nome||'—')} · ${_sac_fmtD(art.updated_at)}</div>
      <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.7;">${escapeHtml(art.conteudo||'')}</div>`,
    footer: `<button class="btn btn-secondary" id="sac-ba-close">Fechar</button>
             ${podEditar ? `<button class="btn btn-secondary" id="sac-ba-edit">Editar</button>
             <button class="btn btn-danger" id="sac-ba-del">Excluir</button>` : ''}`,
  });
  el.querySelector('#sac-ba-close').addEventListener('click', close);
  const editBtn = el.querySelector('#sac-ba-edit');
  if (editBtn) editBtn.addEventListener('click', () => { close(); _sac_editarArtigoConhecimento(art, onUpdate); });
  const delBtn = el.querySelector('#sac-ba-del');
  if (delBtn) delBtn.addEventListener('click', function() {
    _withSubmit(this, async () => {
      if (!confirm('Excluir artigo?')) return;
      try {
        await API.delete('/sac/base-conhecimento/' + id);
        showToast('Artigo excluído', 'success');
        close(); if (typeof onUpdate === 'function') onUpdate();
      } catch(err) { showToast('Erro: ' + err.message, 'error'); }
    });
  });
}

async function _sac_editarArtigoConhecimento(art, onSaved) {
  const isNew = !art;
  const { el, close } = openModal({
    title: isNew ? '+ Novo Artigo Wiki' : '✏️ Editar Artigo',
    size: 'lg',
    body: `
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-control" id="sac-ea-titulo" value="${isNew ? '' : escapeHtml(art.titulo||'')}"></div>
      <div class="form-group"><label class="form-label">Categoria</label>
        <select class="form-control" id="sac-ea-cat">
          ${['Geral','Produto','Processo','Atendimento','Cobrança','Entrega','Garantia'].map(c =>
            `<option value="${c}" ${!isNew && art.categoria===c?'selected':''}>${c}</option>`
          ).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Conteúdo *</label>
        <textarea class="form-control" id="sac-ea-conteudo" rows="10">${isNew ? '' : escapeHtml(art.conteudo||'')}</textarea></div>
      <div id="sac-ea-err"></div>`,
    footer: `<button class="btn btn-secondary" id="sac-ea-cancel">Cancelar</button>
             <button class="btn btn-primary" id="sac-ea-ok">${isNew ? 'Criar' : 'Salvar'}</button>`,
  });
  el.querySelector('#sac-ea-cancel').addEventListener('click', close);
  el.querySelector('#sac-ea-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const titulo   = el.querySelector('#sac-ea-titulo').value.trim();
      const conteudo = el.querySelector('#sac-ea-conteudo').value.trim();
      const errDiv   = el.querySelector('#sac-ea-err');
      errDiv.innerHTML = '';
      if (!titulo || !conteudo) { errDiv.innerHTML = '<div class="form-error">Título e conteúdo são obrigatórios.</div>'; return; }
      try {
        const payload = { titulo, conteudo, categoria: el.querySelector('#sac-ea-cat').value };
        if (isNew) await API.post('/sac/base-conhecimento', payload);
        else       await API.put('/sac/base-conhecimento/' + art.id, payload);
        showToast(isNew ? 'Artigo criado!' : 'Artigo salvo!', 'success');
        close(); if (typeof onSaved === 'function') onSaved();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f13 Chat Centralizado (informativo + ticket rápido) ───────────────────────

async function _sac_f13(user) {
  const { el: elChat } = openModal({
    title: '💬 Chat Centralizado (Omnichannel)',
    size: 'md',
    body: `
      <p style="font-size:14px;color:var(--text-muted);line-height:1.7;margin-bottom:16px;">
        Interface de atendimento em tempo real que unifica mensagens do Site, App e WhatsApp em uma única tela.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:28px;margin-bottom:4px;">💬</div>
          <div style="font-size:13px;font-weight:600;">WhatsApp</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Integração via API</div>
        </div>
        <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:28px;margin-bottom:4px;">🌐</div>
          <div style="font-size:13px;font-weight:600;">Portal / Site</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Chat em tempo real</div>
        </div>
        <div style="background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.2);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:28px;margin-bottom:4px;">📱</div>
          <div style="font-size:13px;font-weight:600;">App Mobile</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Notificações push</div>
        </div>
        <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:28px;margin-bottom:4px;">📧</div>
          <div style="font-size:13px;font-weight:600;">E-mail</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Caixa unificada</div>
        </div>
      </div>
      <div style="padding:12px;background:rgba(251,146,60,0.08);border-radius:8px;font-size:13px;color:#fb923c;">
        ⚠️ Integração com plataforma de chat em implementação. Atendimentos recebidos por estes canais devem ser registrados manualmente como Atendimento Avulso.
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sac-chat-atend-btn">Registrar Atendimento Manual</button>`,
  });
  elChat.querySelector('#sac-chat-atend-btn')?.addEventListener('click', () => _sac_f02(user));
}

// ── f14 Ver Escalas SAC ───────────────────────────────────────────────────────

async function _sac_f14(user) {
  const { el, close } = openModal({
    title: '📅 Escala e Plantão — SAC',
    size: 'lg',
    body: `<div id="sac-ve-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" id="sac-ve-close">Fechar</button>`,
  });
  el.querySelector('#sac-ve-close').addEventListener('click', close);
  try {
    const d = await API.get('/sac/escalas');
    const rows = Array.isArray(d) ? d : (d.data || []);
    if (!rows.length) { el.querySelector('#sac-ve-list').innerHTML = _empty(); return; }
    const turnoIcon = { manha:'🌅', tarde:'🌤️', noite:'🌙', comercial:'💼', plantao:'🛡️' };
    el.querySelector('#sac-ve-list').innerHTML = `
      <div style="overflow-x:auto;">
        <table class="table">
          <thead><tr><th>Atendente</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.usuario_nome||'—')}</td>
                <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                <td>${_sac_fmtD(r.data_inicio)}</td>
                <td>${_sac_fmtD(r.data_fim)}</td>
                <td>${escapeHtml(r.observacao||'—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    el.querySelector('#sac-ve-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
  }
}

// ── f15 Gerenciar Escalas SAC ─────────────────────────────────────────────────

async function _sac_f15(user) {
  let usuarios = [];
  try { const d = await API.get('/sac/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '📆 Gerenciar Escalas do SAC',
    size: 'xl',
    body: `<div id="sac-ge-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sac-ge-novo-btn">+ Nova Escala</button>`,
  });

  async function loadEscalas() {
    el.querySelector('#sac-ge-list').innerHTML = _spinner();
    try {
      const d = await API.get('/sac/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sac-ge-list').innerHTML = _empty(); return; }
      const turnoIcon = { manha:'🌅', tarde:'🌤️', noite:'🌙', comercial:'💼', plantao:'🛡️' };
      el.querySelector('#sac-ge-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Atendente</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.usuario_nome||'—')}</td>
                  <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${_sac_fmtD(r.data_inicio)}</td>
                  <td>${_sac_fmtD(r.data_fim)}</td>
                  <td>${escapeHtml(r.observacao||'—')}</td>
                  <td><button class="btn btn-xs btn-danger sac-ge-del" data-id="${r.id}">Excluir</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sac-ge-del').forEach(btn => {
        btn.addEventListener('click', function() {
          _withSubmit(this, async () => {
            if (!confirm('Excluir esta escala?')) return;
            try {
              await API.delete('/sac/escalas/' + btn.dataset.id);
              showToast('Escala excluída', 'success');
              loadEscalas();
            } catch(err) { showToast('Erro: ' + err.message, 'error'); }
          });
        });
      });
    } catch(e) { el.querySelector('#sac-ge-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`; }
  }

  el.querySelector('#sac-ge-novo-btn').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Escala SAC',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Atendente</label>
          <select class="form-control" id="sac-ne-user">
            <option value="">— Nome manual (externo) —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Nome (se não cadastrado)</label>
          <input class="form-control" id="sac-ne-nome" placeholder="Nome do atendente..."></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Turno</label>
            <select class="form-control" id="sac-ne-turno">
              <option value="comercial">Comercial</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
              <option value="plantao">Plantão</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Tipo</label>
            <select class="form-control" id="sac-ne-tipo">
              <option value="normal">Normal</option>
              <option value="plantao">Plantão</option>
              <option value="ferias">Férias</option>
              <option value="feriado">Feriado</option>
            </select></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data Início *</label>
            <input class="form-control" id="sac-ne-ini" type="date" value="${today}"></div>
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data Fim *</label>
            <input class="form-control" id="sac-ne-fim" type="date" value="${today}"></div>
        </div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="sac-ne-obs" rows="2"></textarea></div>
        <div id="sac-ne-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sac-ne-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sac-ne-ok">Salvar</button>`,
    });
    e2.querySelector('#sac-ne-cancel').addEventListener('click', c2);
    e2.querySelector('#sac-ne-ok').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const errDiv = e2.querySelector('#sac-ne-err');
        errDiv.innerHTML = '';
        const uid   = e2.querySelector('#sac-ne-user').value;
        const nome  = e2.querySelector('#sac-ne-nome').value.trim();
        const dtIni = e2.querySelector('#sac-ne-ini').value;
        const dtFim = e2.querySelector('#sac-ne-fim').value;
        if (!uid && !nome) { errDiv.innerHTML = '<div class="form-error">Selecione um atendente ou informe o nome.</div>'; return; }
        if (!dtIni || !dtFim) { errDiv.innerHTML = '<div class="form-error">Datas são obrigatórias.</div>'; return; }
        try {
          await API.post('/sac/escalas', {
            usuario_id:    uid || null,
            atendente_nome: nome || null,
            turno:         e2.querySelector('#sac-ne-turno').value,
            tipo:          e2.querySelector('#sac-ne-tipo').value,
            data_inicio:   dtIni,
            data_fim:      dtFim,
            observacao:    e2.querySelector('#sac-ne-obs').value.trim() || null,
          });
          showToast('Escala criada!', 'success');
          c2(); loadEscalas();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  });

  loadEscalas();
}

// ── Export ────────────────────────────────────────────────────────────────────

const SacForms = {
  f01GerenciarTickets:           (user) => _sac_f01(user),
  f02RegistrarAtendimentoAvulso: (user) => _sac_f02(user),
  f03VinculoQualidade:           (user) => _sac_f03(user),
  f04GestaoGarantiasTrocas:      (user) => _sac_f04(user),
  f05ClassificacaoMotivos:       (user) => _sac_f05(user),
  f06MonitoramentoNPS:           (user) => _sac_f06(user),
  f07ComunicacaoMassa:           (user) => _sac_f07(user),
  f08GestaoRecall:               (user) => _sac_f08(user),
  f09RelatoriosSLA:              (user) => _sac_f09(user),
  f10HistoricoCliente:           (user) => _sac_f10(user),
  f11TemplatesResposta:          (user) => _sac_f11(user),
  f12BaseConhecimento:           (user) => _sac_f12(user),
  f13ChatCentralizado:           (user) => _sac_f13(user),
  f14VerEscala:                  (user) => _sac_f14(user),
  f15GerenciarEscalas:           (user) => _sac_f15(user),
};

window.SacForms = SacForms;
