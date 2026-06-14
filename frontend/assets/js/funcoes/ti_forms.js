'use strict';
/**
 * TiForms — Renderers de modal para as funções do setor de TI.
 */

// ── Local helpers ─────────────────────────────────────────────────────────────

function _ti_statusBadge(s) {
  const m = { aberto: 'warning', em_andamento: 'info', aguardando: 'muted', resolvido: 'success', fechado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _ti_prioBadge(p) {
  const m = { baixa: 'success', media: 'info', alta: 'warning', critica: 'danger' };
  return `<span class="badge badge-${m[p]||'muted'}">${escapeHtml(p||'—')}</span>`;
}
function _ti_sevBadge(s) {
  const m = { baixa: 'success', media: 'info', alta: 'warning', critica: 'danger' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _ti_bugStatusBadge(s) {
  const m = { aberto: 'warning', em_analise: 'info', confirmado: 'danger', corrigido: 'success', invalido: 'muted', fechado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _ti_ativoBadge(s) {
  const m = { disponivel: 'success', em_uso: 'info', manutencao: 'warning', descartado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _ti_fmtD(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return '—'; }
}
function _ti_fmtDT(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return '—'; }
}
function _ti_rowBg(p) {
  if (p === 'critica') return 'style="background:rgba(239,68,68,0.06);"';
  if (p === 'alta')    return 'style="background:rgba(251,146,60,0.06);"';
  return '';
}

// ── f01 Gestão de Chamados (Helpdesk) ─────────────────────────────────────────

async function _ti_f01(user) {
  const { el, close } = openModal({
    title: '🎫 Gestão de Chamados — Helpdesk',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="ti-ch-fil-status" style="width:140px;">
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em andamento</option>
          <option value="aguardando">Aguardando</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
        </select>
        <select class="form-control" id="ti-ch-fil-prio" style="width:140px;">
          <option value="">Todas prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select class="form-control" id="ti-ch-fil-cat" style="width:150px;">
          <option value="">Todas categorias</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="rede">Rede</option>
          <option value="acesso">Acesso</option>
          <option value="email">E-mail</option>
          <option value="outro">Outro</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="ti-ch-buscar">🔍 Filtrar</button>
      </div>
      <div id="ti-ch-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="ti-ch-novo-btn">+ Novo Chamado</button>`,
  });

  async function loadChamados() {
    const s = el.querySelector('#ti-ch-fil-status').value;
    const p = el.querySelector('#ti-ch-fil-prio').value;
    const c = el.querySelector('#ti-ch-fil-cat').value;
    const qs = [s && `status=${s}`, p && `prioridade=${p}`, c && `categoria=${c}`].filter(Boolean).join('&');
    el.querySelector('#ti-ch-list').innerHTML = _spinner();
    try {
      const d = await API.get('/ti/chamados' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#ti-ch-list').innerHTML = _empty(); return; }
      el.querySelector('#ti-ch-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Código</th><th>Título</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Solicitante</th><th>Abertura</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr ${_ti_rowBg(r.prioridade)}>
                  <td><code>${escapeHtml(r.codigo||'—')}</code></td>
                  <td>${escapeHtml(r.titulo||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.categoria||'—')}</span></td>
                  <td>${_ti_prioBadge(r.prioridade)}</td>
                  <td>${_ti_statusBadge(r.status)}</td>
                  <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                  <td>${_ti_fmtDT(r.data_abertura)}</td>
                  <td><button class="btn btn-xs btn-secondary ti-ch-ver" data-id="${r.id}">Ver</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.ti-ch-ver').forEach(btn => {
        btn.addEventListener('click', () => _ti_verChamado(btn.dataset.id, loadChamados));
      });
    } catch(e) {
      el.querySelector('#ti-ch-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#ti-ch-buscar').addEventListener('click', loadChamados);
  el.querySelector('#ti-ch-novo-btn').addEventListener('click', () => _ti_novoChamado(user, loadChamados));
  loadChamados();
}

async function _ti_verChamado(id, onUpdate) {
  let data;
  try {
    const d = await API.get('/ti/chamados/' + id);
    data = d.data || d;
  } catch(e) {
    showToast('Erro ao carregar chamado: ' + e.message, 'error'); return;
  }
  const ch = data;
  const comentarios = data.comentarios || [];

  const { el: e2, close: c2 } = openModal({
    title: `🎫 Chamado ${escapeHtml(ch.codigo||'')}`,
    size: 'lg',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><strong>Título:</strong><br>${escapeHtml(ch.titulo)}</div>
        <div><strong>Categoria:</strong> <span class="badge badge-muted">${escapeHtml(ch.categoria||'—')}</span><br>
             <strong>Prioridade:</strong> ${_ti_prioBadge(ch.prioridade)}<br>
             <strong>Status:</strong> ${_ti_statusBadge(ch.status)}</div>
      </div>
      <div style="margin-bottom:12px;"><strong>Descrição:</strong>
        <p style="background:rgba(255,255,255,0.03);padding:10px;border-radius:6px;margin:4px 0;">${escapeHtml(ch.descricao||'')}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:13px;color:var(--text-muted);">
        <div>Solicitante: ${escapeHtml(ch.solicitante_nome||'—')}</div>
        <div>Atendente: ${escapeHtml(ch.atendente_nome||'—')}</div>
        <div>Abertura: ${_ti_fmtDT(ch.data_abertura)}</div>
        <div>Fechamento: ${_ti_fmtDT(ch.data_fechamento)}</div>
      </div>
      ${ch.resolucao ? `<div style="margin-bottom:12px;"><strong>Resolução:</strong><p style="background:rgba(34,197,94,0.06);padding:10px;border-radius:6px;margin:4px 0;">${escapeHtml(ch.resolucao)}</p></div>` : ''}
      <hr style="border-color:var(--border-color);margin:12px 0;">
      <div style="margin-bottom:8px;"><strong>Comentários (${comentarios.length})</strong></div>
      <div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
        ${comentarios.length ? comentarios.map(c => `
          <div style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:6px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${escapeHtml(c.usuario_nome||'—')} · ${_ti_fmtDT(c.created_at)}</div>
            <div style="font-size:13px;">${escapeHtml(c.comentario)}</div>
          </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;">Nenhum comentário.</div>'}
      </div>
      <div class="form-group"><label class="form-label">Adicionar comentário</label>
        <textarea class="form-control" id="ti-ch-novo-coment" rows="2" placeholder="Digite seu comentário..."></textarea>
      </div>
      <div id="ti-ch-det-err"></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;" id="ti-ch-det-actions">
        ${!['resolvido','fechado'].includes(ch.status) ? `
          <select class="form-control" id="ti-ch-novo-status" style="width:170px;">
            <option value="">Alterar status...</option>
            <option value="em_andamento">Em andamento</option>
            <option value="aguardando">Aguardando</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
          <textarea class="form-control" id="ti-ch-resolucao" rows="1" placeholder="Resolução (se resolvido)..." style="flex:1;min-width:200px;"></textarea>
        ` : ''}
      </div>`,
    footer: `<button class="btn btn-secondary" id="ti-det-close">Fechar</button>
             <button class="btn btn-secondary" id="ti-det-coment-btn">Comentar</button>
             ${!['resolvido','fechado'].includes(ch.status) ? `<button class="btn btn-primary" id="ti-det-status-btn">Atualizar Status</button>` : ''}`,
  });

  e2.querySelector('#ti-det-close').addEventListener('click', c2);

  e2.querySelector('#ti-det-coment-btn').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const txt = e2.querySelector('#ti-ch-novo-coment').value.trim();
      if (!txt) return;
      try {
        await API.post(`/ti/chamados/${id}/comentario`, { comentario: txt });
        showToast('Comentário adicionado', 'success');
        c2(); if (typeof onUpdate === 'function') onUpdate();
      } catch(err) {
        e2.querySelector('#ti-ch-det-err').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
      }
    });
  });

  const btnStatus = e2.querySelector('#ti-det-status-btn');
  if (btnStatus) {
    btnStatus.addEventListener('click', function() {
      _withSubmit(this, async () => {
        const status = e2.querySelector('#ti-ch-novo-status').value;
        if (!status) { e2.querySelector('#ti-ch-det-err').innerHTML = '<div class="form-error">Selecione um status.</div>'; return; }
        const resolucao = e2.querySelector('#ti-ch-resolucao')?.value.trim() || null;
        try {
          await API.put(`/ti/chamados/${id}/status`, { status, resolucao });
          showToast('Status atualizado', 'success');
          c2(); if (typeof onUpdate === 'function') onUpdate();
        } catch(err) {
          e2.querySelector('#ti-ch-det-err').innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }
}

async function _ti_novoChamado(user, onCreated) {
  const { el: e2, close: c2 } = openModal({
    title: '+ Novo Chamado',
    size: 'md',
    body: `
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-control" id="ti-nc-titulo" placeholder="Descreva o problema em poucas palavras..."></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Categoria</label>
          <select class="form-control" id="ti-nc-cat">
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="rede">Rede</option>
            <option value="acesso">Acesso</option>
            <option value="email">E-mail</option>
            <option value="outro" selected>Outro</option>
          </select></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Prioridade</label>
          <select class="form-control" id="ti-nc-prio">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Descrição detalhada *</label>
        <textarea class="form-control" id="ti-nc-desc" rows="4" placeholder="Descreva o problema com detalhes..."></textarea></div>
      <div id="ti-nc-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-nc-cancel">Cancelar</button>
             <button class="btn btn-primary" id="ti-nc-ok">Abrir Chamado</button>`,
  });
  e2.querySelector('#ti-nc-cancel').addEventListener('click', c2);
  e2.querySelector('#ti-nc-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const titulo = e2.querySelector('#ti-nc-titulo').value.trim();
      const descricao = e2.querySelector('#ti-nc-desc').value.trim();
      const errDiv = e2.querySelector('#ti-nc-err');
      errDiv.innerHTML = '';
      if (!titulo || !descricao) { errDiv.innerHTML = '<div class="form-error">Título e descrição são obrigatórios.</div>'; return; }
      try {
        const r = await API.post('/ti/chamados', {
          titulo,
          descricao,
          categoria: e2.querySelector('#ti-nc-cat').value,
          prioridade: e2.querySelector('#ti-nc-prio').value,
        });
        const created = r.data || r;
        showToast(`Chamado ${created.codigo} aberto com sucesso!`, 'success');
        c2(); if (typeof onCreated === 'function') onCreated();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro ao criar chamado')}</div>`; }
    });
  });
}

// ── f02 Reset de Senhas ───────────────────────────────────────────────────────

async function _ti_f02(user) {
  let usuarios = [];
  try {
    const d = await API.get('/ti/usuarios');
    usuarios = Array.isArray(d) ? d : (d.data || []);
  } catch(e) { showToast('Erro ao carregar usuários: ' + e.message, 'error'); return; }

  const { el, close } = openModal({
    title: '🔑 Reset de Senhas',
    size: 'md',
    body: `
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">
        Selecione o usuário para redefinir a senha. Uma senha temporária aleatória será gerada e exibida.
        O usuário deverá alterá-la no próximo login.
      </p>
      <div class="form-group"><label class="form-label">Usuário *</label>
        <select class="form-control" id="ti-rs-user">
          <option value="">— Selecione o usuário —</option>
          ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento ? ' (' + escapeHtml(u.departamento) + ')' : ''}</option>`).join('')}
        </select></div>
      <div id="ti-rs-result"></div>
      <div id="ti-rs-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-rs-close">Fechar</button>
             <button class="btn btn-danger" id="ti-rs-ok">Resetar Senha</button>`,
  });
  el.querySelector('#ti-rs-close').addEventListener('click', close);
  el.querySelector('#ti-rs-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const uid = el.querySelector('#ti-rs-user').value;
      const errDiv = el.querySelector('#ti-rs-err');
      const resultDiv = el.querySelector('#ti-rs-result');
      errDiv.innerHTML = ''; resultDiv.innerHTML = '';
      if (!uid) { errDiv.innerHTML = '<div class="form-error">Selecione um usuário.</div>'; return; }
      try {
        const r = await API.post(`/ti/usuarios/${uid}/reset-senha`, {});
        const { novaSenha, usuario } = r.data || r;
        resultDiv.innerHTML = `
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:14px;margin-top:10px;">
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">Senha resetada para <strong>${escapeHtml(usuario||'—')}</strong></div>
            <div style="font-size:20px;font-weight:700;letter-spacing:4px;color:#4ade80;font-family:monospace;">${escapeHtml(novaSenha)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">⚠️ Informe esta senha ao usuário. Ela não será exibida novamente.</div>
          </div>`;
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro ao resetar senha')}</div>`; }
    });
  });
}

// ── f03 Base de Conhecimento ──────────────────────────────────────────────────

async function _ti_f03(user) {
  const podEditar = user && (user.nivel_acesso >= 2) && (user.departamento === 'TI' || user.nivel_acesso >= 6);

  const { el, close } = openModal({
    title: '📚 Base de Conhecimento',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <input class="form-control" id="ti-bk-busca" placeholder="🔍 Buscar artigos..." style="flex:1;min-width:180px;">
        <select class="form-control" id="ti-bk-cat" style="width:160px;">
          <option value="">Todas categorias</option>
          <option value="Geral">Geral</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Rede">Rede</option>
          <option value="Segurança">Segurança</option>
          <option value="Procedimentos">Procedimentos</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="ti-bk-buscar-btn">Buscar</button>
      </div>
      <div id="ti-bk-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             ${podEditar ? `<button class="btn btn-primary" id="ti-bk-novo-btn">+ Novo Artigo</button>` : ''}`,
  });

  async function loadArtigos() {
    const busca = el.querySelector('#ti-bk-busca').value.trim();
    const cat   = el.querySelector('#ti-bk-cat').value;
    const qs = [busca && `busca=${encodeURIComponent(busca)}`, cat && `categoria=${encodeURIComponent(cat)}`].filter(Boolean).join('&');
    el.querySelector('#ti-bk-list').innerHTML = _spinner();
    try {
      const d = await API.get('/ti/base-conhecimento' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#ti-bk-list').innerHTML = _empty(); return; }
      el.querySelector('#ti-bk-list').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${rows.map(r => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:12px;cursor:pointer;" class="ti-bk-item" data-id="${r.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:600;">${escapeHtml(r.titulo)}</div>
                <span class="badge badge-muted">${escapeHtml(r.categoria)}</span>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                Por ${escapeHtml(r.autor_nome||'—')} · Atualizado ${_ti_fmtD(r.updated_at)}
              </div>
            </div>`).join('')}
        </div>`;
      el.querySelectorAll('.ti-bk-item').forEach(item => {
        item.addEventListener('click', () => _ti_verArtigo(item.dataset.id, podEditar, loadArtigos));
      });
    } catch(e) {
      el.querySelector('#ti-bk-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#ti-bk-buscar-btn').addEventListener('click', loadArtigos);
  el.querySelector('#ti-bk-busca').addEventListener('keydown', e => { if (e.key === 'Enter') loadArtigos(); });
  const novoBtn = el.querySelector('#ti-bk-novo-btn');
  if (novoBtn) novoBtn.addEventListener('click', () => _ti_editarArtigo(null, loadArtigos));
  loadArtigos();
}

async function _ti_verArtigo(id, podEditar, onUpdate) {
  let art;
  try { const d = await API.get('/ti/base-conhecimento/' + id); art = d.data || d; }
  catch(e) { showToast('Erro ao carregar artigo: ' + e.message, 'error'); return; }
  const { el, close } = openModal({
    title: `📄 ${escapeHtml(art.titulo)}`,
    size: 'lg',
    body: `
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
        <span class="badge badge-muted">${escapeHtml(art.categoria)}</span>
        Por ${escapeHtml(art.autor_nome||'—')} · Atualizado ${_ti_fmtDT(art.updated_at)}
      </div>
      <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;line-height:1.7;white-space:pre-wrap;font-size:14px;">${escapeHtml(art.conteudo)}</div>`,
    footer: `<button class="btn btn-secondary" id="ti-art-close">Fechar</button>
             ${podEditar ? `<button class="btn btn-secondary" id="ti-art-edit">Editar</button>
             <button class="btn btn-danger" id="ti-art-del">Excluir</button>` : ''}`,
  });
  el.querySelector('#ti-art-close').addEventListener('click', close);
  const editBtn = el.querySelector('#ti-art-edit');
  if (editBtn) editBtn.addEventListener('click', () => { close(); _ti_editarArtigo(art, onUpdate); });
  const delBtn = el.querySelector('#ti-art-del');
  if (delBtn) delBtn.addEventListener('click', function() {
    _withSubmit(this, async () => {
      if (!confirm('Excluir artigo "' + art.titulo + '"?')) return;
      try {
        await API.delete('/ti/base-conhecimento/' + id);
        showToast('Artigo excluído', 'success');
        close(); if (typeof onUpdate === 'function') onUpdate();
      } catch(err) { showToast('Erro: ' + err.message, 'error'); }
    });
  });
}

async function _ti_editarArtigo(art, onSaved) {
  const isNew = !art;
  const { el, close } = openModal({
    title: isNew ? '+ Novo Artigo' : '✏️ Editar Artigo',
    size: 'lg',
    body: `
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-control" id="ti-art-titulo" value="${isNew ? '' : escapeHtml(art.titulo)}" placeholder="Título do artigo..."></div>
      <div class="form-group"><label class="form-label">Categoria</label>
        <select class="form-control" id="ti-art-cat">
          ${['Geral','Hardware','Software','Rede','Segurança','Procedimentos'].map(c =>
            `<option value="${c}" ${!isNew && art.categoria===c ? 'selected':''}>${c}</option>`
          ).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Conteúdo *</label>
        <textarea class="form-control" id="ti-art-conteudo" rows="10" placeholder="Escreva o conteúdo do artigo...">${isNew ? '' : escapeHtml(art.conteudo)}</textarea></div>
      <div id="ti-art-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-art-form-cancel">Cancelar</button>
             <button class="btn btn-primary" id="ti-art-form-ok">${isNew ? 'Criar' : 'Salvar'}</button>`,
  });
  el.querySelector('#ti-art-form-cancel').addEventListener('click', close);
  el.querySelector('#ti-art-form-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const titulo   = el.querySelector('#ti-art-titulo').value.trim();
      const conteudo = el.querySelector('#ti-art-conteudo').value.trim();
      const errDiv   = el.querySelector('#ti-art-err');
      errDiv.innerHTML = '';
      if (!titulo || !conteudo) { errDiv.innerHTML = '<div class="form-error">Título e conteúdo são obrigatórios.</div>'; return; }
      try {
        const payload = { titulo, conteudo, categoria: el.querySelector('#ti-art-cat').value };
        if (isNew) await API.post('/ti/base-conhecimento', payload);
        else       await API.put('/ti/base-conhecimento/' + art.id, payload);
        showToast(isNew ? 'Artigo criado!' : 'Artigo atualizado!', 'success');
        close(); if (typeof onSaved === 'function') onSaved();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro ao salvar')}</div>`; }
    });
  });
}

// ── f04 E-mails Corporativos (informativo) ────────────────────────────────────

async function _ti_f04(user) {
  openModal({
    title: '📧 Gestão de E-mails Corporativos',
    size: 'md',
    body: `
      <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:16px;">
        Esta função gerencia as contas de e-mail corporativo do domínio da empresa. As ações são executadas diretamente
        no servidor de e-mail (Exchange/Google Workspace) e registradas no sistema para auditoria.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-weight:600;margin-bottom:4px;">📬 Nova conta de e-mail</div>
          <div style="font-size:13px;color:var(--text-muted);">Criar e-mail para novo colaborador.</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-weight:600;margin-bottom:4px;">🗑️ Desativar conta</div>
          <div style="font-size:13px;color:var(--text-muted);">Bloquear e-mail de colaborador desligado.</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-weight:600;margin-bottom:4px;">👥 Grupos de distribuição</div>
          <div style="font-size:13px;color:var(--text-muted);">Gerenciar listas de distribuição por setor.</div>
        </div>
      </div>
      <div style="margin-top:16px;padding:12px;background:rgba(251,146,60,0.08);border-radius:8px;font-size:13px;color:#fb923c;">
        ⚠️ Integração com servidor de e-mail pendente. Abra um chamado TI para ações urgentes.
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="ti-email-chamado-btn">Abrir Chamado</button>`,
  });
  document.getElementById('ti-email-chamado-btn')?.addEventListener('click', () => _ti_novoChamado(user));
}

// ── f05 Gestão de Ativos (Hardware/Software) ──────────────────────────────────

async function _ti_f05(user) {
  const { el, close } = openModal({
    title: '💻 Gestão de Ativos — Hardware & Software',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="ti-at-fil-tipo" style="width:160px;">
          <option value="">Todos os tipos</option>
          <option value="notebook">Notebook</option>
          <option value="desktop">Desktop</option>
          <option value="monitor">Monitor</option>
          <option value="impressora">Impressora</option>
          <option value="servidor">Servidor</option>
          <option value="roteador">Roteador</option>
          <option value="switch">Switch</option>
          <option value="telefone">Telefone</option>
          <option value="celular">Celular</option>
          <option value="licenca_software">Licença Software</option>
          <option value="periferico">Periférico</option>
          <option value="outro">Outro</option>
        </select>
        <select class="form-control" id="ti-at-fil-status" style="width:140px;">
          <option value="">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="em_uso">Em uso</option>
          <option value="manutencao">Manutenção</option>
          <option value="descartado">Descartado</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="ti-at-buscar">🔍 Filtrar</button>
      </div>
      <div id="ti-at-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="ti-at-novo-btn">+ Cadastrar Ativo</button>`,
  });

  async function loadAtivos() {
    const tipo   = el.querySelector('#ti-at-fil-tipo').value;
    const status = el.querySelector('#ti-at-fil-status').value;
    const qs = [tipo && `tipo=${tipo}`, status && `status=${status}`].filter(Boolean).join('&');
    el.querySelector('#ti-at-list').innerHTML = _spinner();
    try {
      const d = await API.get('/ti/ativos' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#ti-at-list').innerHTML = _empty(); return; }
      el.querySelector('#ti-at-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Código</th><th>Nome</th><th>Tipo</th><th>Status</th><th>Responsável</th><th>Localização</th><th>Garantia</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><code>${escapeHtml(r.codigo||'—')}</code></td>
                  <td>${escapeHtml(r.nome||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${_ti_ativoBadge(r.status)}</td>
                  <td>${escapeHtml(r.responsavel_nome||'—')}</td>
                  <td>${escapeHtml(r.localizacao||'—')}</td>
                  <td>${_ti_fmtD(r.garantia_ate)}</td>
                  <td><button class="btn btn-xs btn-secondary ti-at-ver" data-id="${r.id}">Ver</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.ti-at-ver').forEach(btn => {
        btn.addEventListener('click', () => _ti_verAtivo(btn.dataset.id, loadAtivos));
      });
    } catch(e) {
      el.querySelector('#ti-at-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#ti-at-buscar').addEventListener('click', loadAtivos);
  el.querySelector('#ti-at-novo-btn').addEventListener('click', () => _ti_novoAtivo(loadAtivos));
  loadAtivos();
}

async function _ti_verAtivo(id, onUpdate) {
  let data;
  try { const d = await API.get('/ti/ativos/' + id); data = d.data || d; }
  catch(e) { showToast('Erro ao carregar ativo: ' + e.message, 'error'); return; }

  const { el, close } = openModal({
    title: `💻 ${escapeHtml(data.nome||'')}`,
    size: 'lg',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;font-size:14px;">
        <div><strong>Código:</strong> <code>${escapeHtml(data.codigo||'—')}</code></div>
        <div><strong>Tipo:</strong> <span class="badge badge-muted">${escapeHtml(data.tipo||'—')}</span></div>
        <div><strong>Status:</strong> ${_ti_ativoBadge(data.status)}</div>
        <div><strong>Responsável:</strong> ${escapeHtml(data.responsavel_nome||'—')}</div>
        <div><strong>Marca/Modelo:</strong> ${escapeHtml((data.marca||'')+(data.modelo?' '+data.modelo:''))}</div>
        <div><strong>Nº Série:</strong> ${escapeHtml(data.numero_serie||'—')}</div>
        <div><strong>Localização:</strong> ${escapeHtml(data.localizacao||'—')}</div>
        <div><strong>Garantia até:</strong> ${_ti_fmtD(data.garantia_ate)}</div>
        <div><strong>Aquisição:</strong> ${_ti_fmtD(data.data_aquisicao)}</div>
        <div><strong>Valor:</strong> ${data.valor_aquisicao != null ? _fmtMoney(data.valor_aquisicao) : '—'}</div>
      </div>
      ${data.observacoes ? `<div style="margin-bottom:12px;"><strong>Observações:</strong><p style="margin:4px 0;font-size:13px;">${escapeHtml(data.observacoes)}</p></div>` : ''}
      <hr style="border-color:var(--border-color);margin:12px 0;">
      <div style="margin-bottom:8px;"><strong>Histórico de Movimentações (${(data.movimentacoes||[]).length})</strong></div>
      <div style="max-height:180px;overflow-y:auto;">
        ${(data.movimentacoes||[]).length ? `
          <table class="table" style="font-size:12px;">
            <thead><tr><th>Tipo</th><th>Destino</th><th>Responsável</th><th>Data</th></tr></thead>
            <tbody>
              ${data.movimentacoes.map(m => `
                <tr><td><span class="badge badge-muted">${escapeHtml(m.tipo||'—')}</span></td>
                    <td>${escapeHtml(m.usuario_destino_nome||m.localizacao_destino||'—')}</td>
                    <td>${escapeHtml(m.responsavel_nome||'—')}</td>
                    <td>${_ti_fmtDT(m.data_movimentacao)}</td></tr>`).join('')}
            </tbody>
          </table>` : '<div style="color:var(--text-muted);font-size:13px;">Nenhuma movimentação registrada.</div>'}
      </div>`,
    footer: `<button class="btn btn-secondary" id="ti-av-close">Fechar</button>
             <button class="btn btn-secondary" id="ti-av-mov-btn">Movimentar</button>`,
  });
  el.querySelector('#ti-av-close').addEventListener('click', close);
  el.querySelector('#ti-av-mov-btn').addEventListener('click', () => {
    close(); _ti_movimentarAtivo(data, onUpdate);
  });
}

async function _ti_novoAtivo(onCreated) {
  const { el, close } = openModal({
    title: '+ Cadastrar Ativo TI',
    size: 'lg',
    body: `
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:2;min-width:160px;"><label class="form-label">Nome *</label>
          <input class="form-control" id="ti-na-nome" placeholder="Ex: Notebook Dell Latitude..."></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Tipo *</label>
          <select class="form-control" id="ti-na-tipo">
            <option value="notebook">Notebook</option>
            <option value="desktop">Desktop</option>
            <option value="monitor">Monitor</option>
            <option value="impressora">Impressora</option>
            <option value="servidor">Servidor</option>
            <option value="roteador">Roteador</option>
            <option value="switch">Switch</option>
            <option value="telefone">Telefone</option>
            <option value="celular">Celular</option>
            <option value="licenca_software">Licença Software</option>
            <option value="periferico">Periférico</option>
            <option value="outro" selected>Outro</option>
          </select></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Marca</label>
          <input class="form-control" id="ti-na-marca" placeholder="Ex: Dell, HP, Lenovo..."></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Modelo</label>
          <input class="form-control" id="ti-na-modelo" placeholder="Ex: Latitude 5430..."></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Nº Série</label>
          <input class="form-control" id="ti-na-serie" placeholder="Número de série..."></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data Aquisição</label>
          <input class="form-control" id="ti-na-dt-aquis" type="date"></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Valor (R$)</label>
          <input class="form-control" id="ti-na-valor" type="number" min="0" step="0.01" placeholder="0,00"></div>
        <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Garantia até</label>
          <input class="form-control" id="ti-na-garantia" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">Localização</label>
        <input class="form-control" id="ti-na-local" placeholder="Ex: Sala TI, Rack Servidor A..."></div>
      <div class="form-group"><label class="form-label">Observações</label>
        <textarea class="form-control" id="ti-na-obs" rows="2"></textarea></div>
      <div id="ti-na-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-na-cancel">Cancelar</button>
             <button class="btn btn-primary" id="ti-na-ok">Cadastrar</button>`,
  });
  el.querySelector('#ti-na-cancel').addEventListener('click', close);
  el.querySelector('#ti-na-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const nome = el.querySelector('#ti-na-nome').value.trim();
      const errDiv = el.querySelector('#ti-na-err');
      errDiv.innerHTML = '';
      if (!nome) { errDiv.innerHTML = '<div class="form-error">Nome é obrigatório.</div>'; return; }
      try {
        const r = await API.post('/ti/ativos', {
          nome,
          tipo:           el.querySelector('#ti-na-tipo').value,
          marca:          el.querySelector('#ti-na-marca').value.trim() || null,
          modelo:         el.querySelector('#ti-na-modelo').value.trim() || null,
          numero_serie:   el.querySelector('#ti-na-serie').value.trim() || null,
          data_aquisicao: el.querySelector('#ti-na-dt-aquis').value || null,
          valor_aquisicao:el.querySelector('#ti-na-valor').value || null,
          garantia_ate:   el.querySelector('#ti-na-garantia').value || null,
          localizacao:    el.querySelector('#ti-na-local').value.trim() || null,
          observacoes:    el.querySelector('#ti-na-obs').value.trim() || null,
        });
        const created = r.data || r;
        showToast(`Ativo ${created.codigo} cadastrado!`, 'success');
        close(); if (typeof onCreated === 'function') onCreated();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro ao cadastrar')}</div>`; }
    });
  });
}

async function _ti_movimentarAtivo(ativo, onDone) {
  let usuarios = [];
  try { const d = await API.get('/ti/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: `↔️ Movimentar: ${escapeHtml(ativo.nome||'')}`,
    size: 'md',
    body: `
      <div class="form-group"><label class="form-label">Tipo de Movimentação *</label>
        <select class="form-control" id="ti-mv-tipo">
          <option value="entrega">Entrega (atribuir a usuário)</option>
          <option value="devolucao">Devolução (liberar ativo)</option>
          <option value="manutencao">Enviar para Manutenção</option>
          <option value="descarte">Descarte</option>
        </select></div>
      <div class="form-group" id="ti-mv-dest-wrap"><label class="form-label">Usuário Destino</label>
        <select class="form-control" id="ti-mv-dest">
          <option value="">— Selecione —</option>
          ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
        </select></div>
      <div class="form-group" id="ti-mv-local-wrap"><label class="form-label">Localização Destino</label>
        <input class="form-control" id="ti-mv-local" placeholder="Ex: Depósito TI, Assistência Técnica..."></div>
      <div class="form-group"><label class="form-label">Observação</label>
        <textarea class="form-control" id="ti-mv-obs" rows="2"></textarea></div>
      <div id="ti-mv-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-mv-cancel">Cancelar</button>
             <button class="btn btn-primary" id="ti-mv-ok">Registrar Movimentação</button>`,
  });
  el.querySelector('#ti-mv-cancel').addEventListener('click', close);
  el.querySelector('#ti-mv-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#ti-mv-err');
      errDiv.innerHTML = '';
      try {
        await API.post(`/ti/ativos/${ativo.id}/movimentar`, {
          tipo:               el.querySelector('#ti-mv-tipo').value,
          usuario_destino_id: el.querySelector('#ti-mv-dest').value || null,
          localizacao_destino:el.querySelector('#ti-mv-local').value.trim() || null,
          observacao:         el.querySelector('#ti-mv-obs').value.trim() || null,
        });
        showToast('Movimentação registrada!', 'success');
        close(); if (typeof onDone === 'function') onDone();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f06 Infraestrutura e Redes ────────────────────────────────────────────────

async function _ti_f06(user) {
  openModal({
    title: '🖧 Infraestrutura e Redes',
    size: 'md',
    body: `
      <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:16px;">
        Monitoramento e gestão da infraestrutura de TI: servidores, rede, firewall, backups e controle de acesso físico.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">🖥️ Servidores</div>
          <div style="font-size:12px;color:var(--text-muted);">Gerencie ativos de servidor via <strong>Gestão de Ativos</strong> (F5) com tipo "servidor".</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">🌐 Rede / Firewall</div>
          <div style="font-size:12px;color:var(--text-muted);">Abra um chamado de categoria "Rede" para alterações na infraestrutura de rede.</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">💾 Backup</div>
          <div style="font-size:12px;color:var(--text-muted);">Agende janelas de backup via <strong>Gerenciar Escalas</strong> (F10) com tipo "backup".</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">🔒 Controle de Acesso</div>
          <div style="font-size:12px;color:var(--text-muted);">Ativação/bloqueio de crachás via sistema de Segurança (módulo Segurança).</div>
        </div>
      </div>
      <div style="padding:12px;background:rgba(59,130,246,0.08);border-radius:8px;font-size:13px;color:#60a5fa;">
        ℹ️ Para monitoramento em tempo real de servidores, utilize ferramentas externas (Zabbix, Grafana) integradas via chamado.
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="ti-infra-chamado-btn">Abrir Chamado Rede</button>`,
  });
  document.getElementById('ti-infra-chamado-btn')?.addEventListener('click', () => _ti_novoChamado(user));
}

// ── f07 Gerenciar Bugs ────────────────────────────────────────────────────────

async function _ti_f07(user) {
  const { el, close } = openModal({
    title: '🐛 Triagem de Bugs — Gerenciar Denúncias',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="ti-bug-fil-status" style="width:150px;">
          <option value="">Todos</option>
          <option value="aberto">Aberto</option>
          <option value="em_analise">Em análise</option>
          <option value="confirmado">Confirmado</option>
          <option value="corrigido">Corrigido</option>
          <option value="invalido">Inválido</option>
          <option value="fechado">Fechado</option>
        </select>
        <select class="form-control" id="ti-bug-fil-sev" style="width:130px;">
          <option value="">Todas severidades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="ti-bug-buscar">Filtrar</button>
      </div>
      <div id="ti-bug-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  async function loadBugs() {
    const status = el.querySelector('#ti-bug-fil-status').value;
    const sev    = el.querySelector('#ti-bug-fil-sev').value;
    const qs = [status && `status=${status}`, sev && `severidade=${sev}`].filter(Boolean).join('&');
    el.querySelector('#ti-bug-list').innerHTML = _spinner();
    try {
      const d = await API.get('/ti/bugs' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#ti-bug-list').innerHTML = _empty(); return; }
      el.querySelector('#ti-bug-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Título</th><th>Módulo</th><th>Severidade</th><th>Status</th><th>Reportado por</th><th>Data</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr ${_ti_rowBg(r.severidade)}>
                  <td>${escapeHtml(r.titulo||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.modulo||'—')}</span></td>
                  <td>${_ti_sevBadge(r.severidade)}</td>
                  <td>${_ti_bugStatusBadge(r.status)}</td>
                  <td>${escapeHtml(r.reportado_por_nome||'—')}</td>
                  <td>${_ti_fmtDT(r.data_report)}</td>
                  <td><button class="btn btn-xs btn-secondary ti-bug-ver" data-id="${r.id}">Triar</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.ti-bug-ver').forEach(btn => {
        btn.addEventListener('click', () => _ti_verBug(btn.dataset.id, loadBugs));
      });
    } catch(e) {
      el.querySelector('#ti-bug-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#ti-bug-buscar').addEventListener('click', loadBugs);
  loadBugs();
}

async function _ti_verBug(id, onUpdate) {
  let bug;
  try {
    const d = await API.get('/ti/bugs/' + id);
    bug = d.data || d;
    if (!bug || !bug.id) { showToast('Bug não encontrado', 'error'); return; }
  } catch(e) { showToast('Erro: ' + e.message, 'error'); return; }

  const { el, close } = openModal({
    title: `🐛 Bug: ${escapeHtml(bug.titulo||'')}`,
    size: 'lg',
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;font-size:13px;">
        <div><strong>Módulo:</strong> ${escapeHtml(bug.modulo||'—')}</div>
        <div><strong>Severidade:</strong> ${_ti_sevBadge(bug.severidade)}</div>
        <div><strong>Status:</strong> ${_ti_bugStatusBadge(bug.status)}</div>
        <div><strong>Reportado por:</strong> ${escapeHtml(bug.reportado_por_nome||'—')}</div>
        <div><strong>Data Report:</strong> ${_ti_fmtDT(bug.data_report)}</div>
        <div><strong>Responsável:</strong> ${escapeHtml(bug.responsavel_nome||'—')}</div>
      </div>
      <div style="margin-bottom:10px;"><strong>Descrição:</strong>
        <p style="background:rgba(255,255,255,0.03);padding:10px;border-radius:6px;margin:4px 0;font-size:13px;">${escapeHtml(bug.descricao||'')}</p>
      </div>
      ${bug.reproducao ? `<div style="margin-bottom:10px;"><strong>Passos p/ reproduzir:</strong>
        <p style="background:rgba(255,255,255,0.03);padding:10px;border-radius:6px;margin:4px 0;font-size:13px;">${escapeHtml(bug.reproducao)}</p></div>` : ''}
      <hr style="border-color:var(--border-color);margin:12px 0;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Novo Status</label>
          <select class="form-control" id="ti-bug-novo-status">
            <option value="em_analise">Em análise</option>
            <option value="confirmado">Confirmado</option>
            <option value="corrigido">Corrigido</option>
            <option value="invalido">Inválido</option>
            <option value="fechado">Fechado</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Resolução / Comentário</label>
        <textarea class="form-control" id="ti-bug-resolucao" rows="3" placeholder="Descreva o resultado da análise ou a correção aplicada...">${escapeHtml(bug.resolucao||'')}</textarea></div>
      <div id="ti-bug-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-bug-close">Fechar</button>
             <button class="btn btn-primary" id="ti-bug-save">Salvar Triagem</button>`,
  });
  el.querySelector('#ti-bug-close').addEventListener('click', close);
  el.querySelector('#ti-bug-save').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#ti-bug-err');
      errDiv.innerHTML = '';
      try {
        await API.put(`/ti/bugs/${id}/status`, {
          status:    el.querySelector('#ti-bug-novo-status').value,
          resolucao: el.querySelector('#ti-bug-resolucao').value.trim() || null,
        });
        showToast('Bug atualizado!', 'success');
        close(); if (typeof onUpdate === 'function') onUpdate();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f08 Ver Escalas (leitura) ─────────────────────────────────────────────────

async function _ti_f08(user) {
  const { el, close } = openModal({
    title: '📅 Escala e Datas de Manutenção — TI',
    size: 'lg',
    body: `<div id="ti-esc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" id="ti-esc-close">Fechar</button>`,
  });
  el.querySelector('#ti-esc-close').addEventListener('click', close);
  try {
    const d = await API.get('/ti/escalas');
    const rows = Array.isArray(d) ? d : (d.data || []);
    if (!rows.length) { el.querySelector('#ti-esc-list').innerHTML = _empty(); return; }
    const turnoIcon = { manha: '🌅', tarde: '🌤️', noite: '🌙', plantao: '🛡️' };
    const tipoIcon  = { plantao: '🛡️', janela_manutencao: '🔧', backup: '💾', outro: '📌' };
    el.querySelector('#ti-esc-list').innerHTML = `
      <div style="overflow-x:auto;">
        <table class="table">
          <thead><tr><th>Técnico</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.usuario_nome||'—')}</td>
                <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                <td>${tipoIcon[r.tipo]||''} ${escapeHtml(r.tipo||'—')}</td>
                <td>${_ti_fmtD(r.data_inicio)}</td>
                <td>${_ti_fmtD(r.data_fim)}</td>
                <td>${escapeHtml(r.observacao||'—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    el.querySelector('#ti-esc-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
  }
}

// ── f09 Solicitações de Exclusão ──────────────────────────────────────────────

async function _ti_f09(user) {
  const { el, close } = openModal({
    title: '🗑️ Solicitações de Exclusão de Documentos',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select class="form-control" id="ti-se-fil-status" style="width:150px;">
          <option value="pendente">Pendentes</option>
          <option value="aprovada">Aprovadas</option>
          <option value="rejeitada">Rejeitadas</option>
          <option value="">Todas</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="ti-se-buscar">Filtrar</button>
      </div>
      <div id="ti-se-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  async function loadSolicits() {
    const status = el.querySelector('#ti-se-fil-status').value;
    const qs = status ? `status=${status}` : '';
    el.querySelector('#ti-se-list').innerHTML = _spinner();
    try {
      const d = await API.get('/ti/solicitacoes-exclusao' + (qs ? '?' + qs : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#ti-se-list').innerHTML = _empty(); return; }
      const stBadge = s => ({ pendente:'warning', aprovada:'success', rejeitada:'danger' })[s] || 'muted';
      el.querySelector('#ti-se-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Descrição</th><th>Tabela</th><th>Motivo</th><th>Status</th><th>Solicitante</th><th>Data</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.descricao||'—')}</td>
                  <td><code>${escapeHtml(r.tabela_referencia||'—')}</code></td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.motivo||'')}">${escapeHtml(r.motivo||'—')}</td>
                  <td><span class="badge badge-${stBadge(r.status)}">${escapeHtml(r.status||'—')}</span></td>
                  <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                  <td>${_ti_fmtDT(r.data_solicitacao)}</td>
                  <td>${r.status === 'pendente' ? `<button class="btn btn-xs btn-primary ti-se-resp" data-id="${r.id}" data-descricao="${escapeHtml(r.descricao||'')}">Responder</button>` : `<span style="color:var(--text-muted);font-size:12px;">${escapeHtml(r.aprovador_nome||'—')}</span>`}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.ti-se-resp').forEach(btn => {
        btn.addEventListener('click', () => _ti_responderSolicExclusao(btn.dataset.id, btn.dataset.descricao, loadSolicits));
      });
    } catch(e) {
      el.querySelector('#ti-se-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#ti-se-buscar').addEventListener('click', loadSolicits);
  loadSolicits();
}

async function _ti_responderSolicExclusao(id, descricao, onDone) {
  const { el, close } = openModal({
    title: '⚖️ Responder Solicitação',
    size: 'md',
    body: `
      <p style="margin-bottom:12px;"><strong>Descrição:</strong> ${escapeHtml(descricao||'')}</p>
      <div class="form-group"><label class="form-label">Decisão *</label>
        <select class="form-control" id="ti-se-dec">
          <option value="aprovada">✅ Aprovar exclusão</option>
          <option value="rejeitada">❌ Rejeitar solicitação</option>
        </select></div>
      <div class="form-group"><label class="form-label">Justificativa</label>
        <textarea class="form-control" id="ti-se-just" rows="3" placeholder="Explique sua decisão..."></textarea></div>
      <div id="ti-se-err"></div>`,
    footer: `<button class="btn btn-secondary" id="ti-se-cancel">Cancelar</button>
             <button class="btn btn-primary" id="ti-se-ok">Confirmar</button>`,
  });
  el.querySelector('#ti-se-cancel').addEventListener('click', close);
  el.querySelector('#ti-se-ok').addEventListener('click', function() {
    _withSubmit(this, async () => {
      const errDiv = el.querySelector('#ti-se-err');
      errDiv.innerHTML = '';
      try {
        await API.put(`/ti/solicitacoes-exclusao/${id}/responder`, {
          status:                  el.querySelector('#ti-se-dec').value,
          justificativa_resposta:  el.querySelector('#ti-se-just').value.trim() || null,
        });
        showToast('Solicitação respondida!', 'success');
        close(); if (typeof onDone === 'function') onDone();
      } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
    });
  });
}

// ── f10 Gerenciar Escalas TI ──────────────────────────────────────────────────

async function _ti_f10(user) {
  let usuarios = [];
  try { const d = await API.get('/ti/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '📆 Gerenciar Escalas e Agendamentos — TI',
    size: 'xl',
    body: `
      <div id="ti-eg-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="ti-eg-novo-btn">+ Nova Escala</button>`,
  });

  async function loadEscalas() {
    el.querySelector('#ti-eg-list').innerHTML = _spinner();
    try {
      const d = await API.get('/ti/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#ti-eg-list').innerHTML = _empty(); return; }
      const turnoIcon = { manha: '🌅', tarde: '🌤️', noite: '🌙', plantao: '🛡️' };
      const tipoIcon  = { plantao: '🛡️', janela_manutencao: '🔧', backup: '💾', outro: '📌' };
      el.querySelector('#ti-eg-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Técnico</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.usuario_nome||'—')}</td>
                  <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                  <td>${tipoIcon[r.tipo]||''} ${escapeHtml(r.tipo||'—')}</td>
                  <td>${_ti_fmtD(r.data_inicio)}</td>
                  <td>${_ti_fmtD(r.data_fim)}</td>
                  <td>${escapeHtml(r.observacao||'—')}</td>
                  <td><button class="btn btn-xs btn-danger ti-eg-del" data-id="${r.id}">Excluir</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.ti-eg-del').forEach(btn => {
        btn.addEventListener('click', function() {
          _withSubmit(this, async () => {
            if (!confirm('Excluir esta escala?')) return;
            try {
              await API.delete('/ti/escalas/' + btn.dataset.id);
              showToast('Escala excluída', 'success');
              loadEscalas();
            } catch(err) { showToast('Erro: ' + err.message, 'error'); }
          });
        });
      });
    } catch(e) {
      el.querySelector('#ti-eg-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#ti-eg-novo-btn').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Escala TI',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Técnico</label>
          <select class="form-control" id="ti-ne-user">
            <option value="">— Externo / Nome manual —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Nome (se externo)</label>
          <input class="form-control" id="ti-ne-nome" placeholder="Nome do técnico externo..."></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Turno</label>
            <select class="form-control" id="ti-ne-turno">
              <option value="plantao">Plantão</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:150px;"><label class="form-label">Tipo</label>
            <select class="form-control" id="ti-ne-tipo">
              <option value="plantao">Plantão</option>
              <option value="janela_manutencao">Janela de Manutenção</option>
              <option value="backup">Backup</option>
              <option value="outro">Outro</option>
            </select></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data Início *</label>
            <input class="form-control" id="ti-ne-ini" type="date" value="${today}"></div>
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data Fim *</label>
            <input class="form-control" id="ti-ne-fim" type="date" value="${today}"></div>
        </div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="ti-ne-obs" rows="2"></textarea></div>
        <div id="ti-ne-err"></div>`,
      footer: `<button class="btn btn-secondary" id="ti-ne-cancel">Cancelar</button>
               <button class="btn btn-primary" id="ti-ne-ok">Salvar</button>`,
    });
    e2.querySelector('#ti-ne-cancel').addEventListener('click', c2);
    e2.querySelector('#ti-ne-ok').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const errDiv = e2.querySelector('#ti-ne-err');
        errDiv.innerHTML = '';
        const uid    = e2.querySelector('#ti-ne-user').value;
        const nome   = e2.querySelector('#ti-ne-nome').value.trim();
        const dtIni  = e2.querySelector('#ti-ne-ini').value;
        const dtFim  = e2.querySelector('#ti-ne-fim').value;
        if (!uid && !nome) { errDiv.innerHTML = '<div class="form-error">Selecione um técnico ou informe o nome.</div>'; return; }
        if (!dtIni || !dtFim) { errDiv.innerHTML = '<div class="form-error">Datas são obrigatórias.</div>'; return; }
        try {
          await API.post('/ti/escalas', {
            usuario_id:   uid || null,
            tecnico_nome: nome || null,
            turno:        e2.querySelector('#ti-ne-turno').value,
            tipo:         e2.querySelector('#ti-ne-tipo').value,
            data_inicio:  dtIni,
            data_fim:     dtFim,
            observacao:   e2.querySelector('#ti-ne-obs').value.trim() || null,
          });
          showToast('Escala criada!', 'success');
          c2(); loadEscalas();
        } catch(err) { errDiv.innerHTML = `<div class="form-error">${escapeHtml(err.message||'Erro')}</div>`; }
      });
    });
  });

  loadEscalas();
}

// ── Export (singleton) ────────────────────────────────────────────────────────

const TiForms = {
  f01GestaoChamados:          (user) => _ti_f01(user),
  f02ResetSenhas:             (user) => _ti_f02(user),
  f03BaseConhecimento:        (user) => _ti_f03(user),
  f04GestaoEmails:            (user) => _ti_f04(user),
  f05GestaoAtivos:            (user) => _ti_f05(user),
  f06Infraestrutura:          (user) => _ti_f06(user),
  f07GerenciarBugs:           (user) => _ti_f07(user),
  f08VerEscalas:              (user) => _ti_f08(user),
  f09SolicitacoesExclusao:    (user) => _ti_f09(user),
  f10GerenciarEscalas:        (user) => _ti_f10(user),
};

window.TiForms = TiForms;
