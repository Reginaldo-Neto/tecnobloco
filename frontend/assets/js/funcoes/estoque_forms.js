'use strict';
/**
 * Modais do setor de Estoque e Compras.
 * Usa _estoqueModal() local — retorna { el, setFooter, close }.
 */

function _estoqueModal(opts) {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  const sz = opts.size ? ` modal-${opts.size}` : '';
  bd.innerHTML = `
    <div class="modal${sz}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">${opts.title || ''}</h3>
        <button class="modal-close" aria-label="Fechar">✕</button>
      </div>
      <div class="modal-body">${opts.body || ''}</div>
      <div class="modal-footer" style="display:none"></div>
    </div>`;
  document.body.appendChild(bd);
  const bodyEl   = bd.querySelector('.modal-body');
  const footerEl = bd.querySelector('.modal-footer');
  const close    = () => bd.remove();
  bd.querySelector('.modal-close').addEventListener('click', close);
  bd.addEventListener('click', (e) => { if (e.target === bd) close(); });
  document.addEventListener('keydown', function _onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', _onKey); }
  });
  function setFooter(html) { footerEl.innerHTML = html; footerEl.style.display = ''; }
  return { el: bodyEl, setFooter, close };
}

const EstoqueForms = {

  // ── f01: Ver Escala ───────────────────────────────────────────────────────────

  f01VerEscala: async (user) => {
    const { el } = _estoqueModal({ title: '📅 Escala de Estoque', size: 'lg', body: _spinner() });
    const r = await API.get('/estoque/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhuma escala cadastrada.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${escapeHtml(e.nome_exibir || e.nome_externo || '—')}</td>
      <td><span class="badge badge-info">${escapeHtml(e.turno)}</span></td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${e.data_fim ? _fmtDate(e.data_fim) : '—'}</td>
      <td>${escapeHtml(e.observacao || '—')}</td>
    </tr>`).join('');
    el.innerHTML = `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
      <thead><tr><th>Operador</th><th>Turno</th><th>Início</th><th>Fim</th><th>Obs.</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  },

  // ── f02: Entrada de Nota Fiscal ───────────────────────────────────────────────

  f02EntradaNotaFiscal: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '📥 Entrada de Nota Fiscal', size: 'xl', body: _spinner() });

    const load = async () => {
      el.innerHTML = _spinner();
      const [rM, rP] = await Promise.all([
        API.get('/estoque/movimentacoes?tipo=entrada&limit=30'),
        API.get('/estoque/produtos'),
      ]);
      const movs  = (rM && rM.success) ? (rM.data || []) : [];
      const prods = (rP && rP.success) ? (rP.data || []) : [];
      const prodOpts = prods.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.codigo || String(p.id))})</option>`).join('');

      const totalQtd = movs.reduce((s, m) => s + Number(m.quantidade || 0), 0);
      const rows = movs.map(e => `<tr>
        <td>${escapeHtml(e.lote || '—')}</td>
        <td>${escapeHtml(e.produto_nome || '—')}</td>
        <td>${escapeHtml(e.produto_codigo || '—')}</td>
        <td>${Number(e.quantidade).toFixed(3)} ${escapeHtml(e.unidade_medida || '')}</td>
        <td>${e.custo_unitario ? _fmtMoney(e.custo_unitario) : '—'}</td>
        <td>${_fmtDateTime(e.criado_em)}</td>
        <td>${escapeHtml(e.usuario_nome || '—')}</td>
      </tr>`).join('');

      el.innerHTML = `
        <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <span class="badge badge-info">${movs.length} entradas</span>
          <span class="badge badge-success">Total: ${totalQtd.toFixed(3)} un.</span>
        </div>
        ${rows ? `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
          <thead><tr><th>NF/Lote</th><th>Produto</th><th>Código</th><th>Quantidade</th><th>Custo Unit.</th><th>Data/Hora</th><th>Operador</th></tr></thead>
          <tbody>${rows}</tbody></table></div>` : _empty('Nenhuma entrada registrada.')}`;

      if (user.nivel_acesso >= 3) {
        setFooter(`<button class="btn btn-primary" id="btn-nova-nf">+ Registrar Entrada</button>`);
        document.getElementById('btn-nova-nf').onclick = () => {
          el.innerHTML = `<form id="form-nf">
            <div class="row g-2">
              <div class="col-6"><label class="form-label">Produto *</label>
                <select name="produto_id" class="form-select" required><option value="">Selecione...</option>${prodOpts}</select>
              </div>
              <div class="col-3"><label class="form-label">Quantidade *</label><input name="quantidade" type="number" step="0.001" min="0.001" class="form-control" required></div>
              <div class="col-3"><label class="form-label">Custo Unit. (R$)</label><input name="custo_unitario" type="number" step="0.01" min="0" class="form-control"></div>
            </div>
            <div class="row g-2 mt-1">
              <div class="col-6"><label class="form-label">NF / Lote</label><input name="lote" class="form-control" placeholder="Ex: NF-12345 ou Lote ABC"></div>
              <div class="col-6"><label class="form-label">Validade</label><input name="validade" type="date" class="form-control"></div>
            </div>
            <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
          </form>`;
          setFooter(`
            <button class="btn btn-secondary" id="btn-voltar-nf">← Voltar</button>
            <button class="btn btn-success" id="btn-salvar-nf">Salvar Entrada</button>`);
          document.getElementById('btn-voltar-nf').onclick = load;
          document.getElementById('btn-salvar-nf').onclick = async () => {
            const f = document.getElementById('form-nf');
            if (!f.checkValidity()) { f.reportValidity(); return; }
            const body = Object.fromEntries(new FormData(f).entries());
            body.tipo = 'entrada';
            await _withSubmit(document.getElementById('btn-salvar-nf'), async () => {
              const res = await API.post('/estoque/movimentacoes', body);
              if (res.success) { showToast('Entrada registrada!', 'success'); await load(); }
              else showToast(res.message || 'Erro ao salvar.', 'danger');
            });
          };
        };
      }
    };

    await load();
  },

  // ── f03: Endereçamento de Produtos ────────────────────────────────────────────

  f03Enderecamento: async (user) => {
    const { el } = _estoqueModal({ title: '🗺️ Endereçamento de Produtos', size: 'xl', body: _spinner() });

    // Single delegated listener — survives innerHTML re-renders because el itself persists
    if (user.nivel_acesso >= 3) {
      el.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.btn-editar-loc');
        if (!btn) return;
        EstoqueForms._editarLocalizacao(Number(btn.dataset.id), btn.dataset.loc, btn.dataset.nome);
      });
    }

    const load = async (search = '') => {
      el.innerHTML = _spinner();
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const r = await API.get(`/estoque/produtos${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar produtos.'); return; }

      const rows = r.data.map(p => `<tr>
        <td>${escapeHtml(p.codigo || '—')}</td>
        <td>${escapeHtml(p.nome)}</td>
        <td>${escapeHtml(p.categoria_nome || '—')}</td>
        <td>${p.localizacao ? `<span class="badge badge-info">${escapeHtml(p.localizacao)}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>${Number(p.estoque_atual || 0).toFixed(3)} ${escapeHtml(p.unidade_medida || '')}</td>
        ${user.nivel_acesso >= 3
          ? `<td><button class="btn btn-sm btn-secondary btn-editar-loc"
               data-id="${p.id}"
               data-loc="${escapeHtml(p.localizacao || '')}"
               data-nome="${escapeHtml(p.nome)}">✏️ Editar</button></td>`
          : '<td>—</td>'}
      </tr>`).join('');

      el.innerHTML = `
        <div class="mb-3" style="display:flex;gap:8px;align-items:center;">
          <input type="text" class="form-control" id="est-search-loc" placeholder="Buscar produto..." value="${escapeHtml(search)}" style="max-width:320px;">
          <button class="btn btn-secondary" id="btn-buscar-loc">🔍 Buscar</button>
          <span class="badge badge-secondary" style="margin-left:auto;">${r.data.length} produtos</span>
        </div>
        ${rows ? `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
          <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Localização</th><th>Saldo</th>${user.nivel_acesso >= 3 ? '<th>Ação</th>' : ''}</tr></thead>
          <tbody>${rows}</tbody></table></div>` : _empty('Nenhum produto encontrado.')}`;

      document.getElementById('btn-buscar-loc').onclick = () => load(document.getElementById('est-search-loc').value.trim());
      document.getElementById('est-search-loc').addEventListener('keydown', (e) => { if (e.key === 'Enter') load(e.target.value.trim()); });
    };

    await load();
  },

  _editarLocalizacao: async (id, localAtual, nome) => {
    const novaLoc = prompt(`Nova localização para "${nome}":\n(Ex: A-01-02, Pallet-5, Prateleira-3)`, localAtual);
    if (novaLoc === null) return;
    const res = await API.patch(`/estoque/produtos/${id}/localizacao`, { localizacao: novaLoc });
    if (res.success) showToast('Localização atualizada!', 'success');
    else showToast(res.message || 'Erro ao atualizar.', 'danger');
  },

  // ── f04: Gestão de Pallets ────────────────────────────────────────────────────

  f04GestaoPallets: async (user) => {
    const { el } = _estoqueModal({ title: '🏭 Gestão de Pallets / Posições', size: 'xl', body: _spinner() });
    const r = await API.get('/estoque/produtos');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar produtos.'); return; }

    const grupos = {};
    const semLoc = [];
    for (const p of r.data) {
      if (!p.localizacao) { semLoc.push(p); continue; }
      const prefix = p.localizacao.split('-')[0] || p.localizacao;
      if (!grupos[prefix]) grupos[prefix] = [];
      grupos[prefix].push(p);
    }

    const totalPosicoes = Object.keys(grupos).length;

    let html = `<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <span class="badge badge-secondary">${r.data.length} produtos</span>
      <span class="badge badge-info">${totalPosicoes} posições ocupadas</span>
      ${semLoc.length ? `<span class="badge badge-warning">${semLoc.length} sem localização</span>` : ''}
    </div>`;

    for (const [pos, prods] of Object.entries(grupos).sort()) {
      const saldoPos = prods.reduce((s, p) => s + Number(p.estoque_atual || 0), 0);
      html += `<div class="content-card" style="margin-bottom:10px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong>📍 ${escapeHtml(pos)}</strong>
          <span class="badge badge-info">${prods.length} ite${prods.length > 1 ? 'ns' : 'm'}</span>
        </div>
        <div style="overflow-x:auto;"><table class="table table-sm" style="margin:0;">
          <thead><tr><th>Código</th><th>Produto</th><th>Localização</th><th>Saldo</th><th>Un.</th></tr></thead>
          <tbody>${prods.map(p => `<tr>
            <td>${escapeHtml(p.codigo || '—')}</td>
            <td>${escapeHtml(p.nome)}</td>
            <td><span class="badge badge-secondary">${escapeHtml(p.localizacao)}</span></td>
            <td>${Number(p.estoque_atual || 0).toFixed(3)}</td>
            <td>${escapeHtml(p.unidade_medida || '')}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    }

    if (semLoc.length) {
      html += `<div class="content-card" style="padding:12px;border-color:rgba(251,146,60,0.5);">
        <strong>⚠️ Sem localização definida (${semLoc.length} produtos)</strong>
        <div style="overflow-x:auto;margin-top:8px;"><table class="table table-sm" style="margin:0;">
          <thead><tr><th>Código</th><th>Produto</th><th>Saldo</th><th>Un.</th></tr></thead>
          <tbody>${semLoc.map(p => `<tr>
            <td>${escapeHtml(p.codigo || '—')}</td>
            <td>${escapeHtml(p.nome)}</td>
            <td>${Number(p.estoque_atual || 0).toFixed(3)}</td>
            <td>${escapeHtml(p.unidade_medida || '')}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    }

    el.innerHTML = html || _empty('Nenhum produto cadastrado.');
  },

  // ── f05: Movimentação Interna ─────────────────────────────────────────────────

  f05MovimentacaoInterna: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '🔄 Movimentação Interna', size: 'xl', body: _spinner() });
    const tipoLabels = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste', transferencia: 'Transferência', perda: 'Perda' };
    const tipoBadge  = { entrada: 'success', saida: 'danger', ajuste: 'warning', transferencia: 'info', perda: 'danger' };
    let filtroAtual  = '';

    const load = async (tipo = '') => {
      filtroAtual = tipo;
      el.innerHTML = _spinner();
      const q = tipo ? `?tipo=${tipo}&limit=30` : '?limit=30';
      const r = await API.get(`/estoque/movimentacoes${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar movimentações.'); return; }

      const rows = r.data.map(m => `<tr>
        <td>${escapeHtml(m.produto_nome || m.produto_codigo || '—')}</td>
        <td><span class="badge badge-${tipoBadge[m.tipo] || 'muted'}">${escapeHtml(tipoLabels[m.tipo] || m.tipo)}</span></td>
        <td>${Number(m.quantidade).toFixed(3)} ${escapeHtml(m.unidade_medida || '')}</td>
        <td>${escapeHtml(m.lote || '—')}</td>
        <td>${escapeHtml(m.usuario_nome || '—')}</td>
        <td>${_fmtDateTime(m.criado_em)}</td>
      </tr>`).join('');

      const filtros = ['', 'entrada', 'saida', 'ajuste', 'transferencia'];
      el.innerHTML = `
        <div class="mb-3" style="display:flex;gap:6px;flex-wrap:wrap;">
          ${filtros.map(t => `<button class="btn btn-sm ${filtroAtual === t ? 'btn-primary' : 'btn-secondary'}"
            onclick="EstoqueForms._filtrarMov('${t}')">${t === '' ? 'Todos' : tipoLabels[t] || t}</button>`).join('')}
        </div>
        ${rows ? `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
          <thead><tr><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Lote</th><th>Operador</th><th>Data/Hora</th></tr></thead>
          <tbody>${rows}</tbody></table></div>` : _empty('Nenhuma movimentação registrada.')}`;
    };

    EstoqueForms._filtrarMov = (t) => load(t);

    await load();

    if (user.nivel_acesso >= 3) {
      const rP = await API.get('/estoque/produtos');
      const prodOpts = (rP.data || []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.codigo || '')})</option>`).join('');
      setFooter(`<button class="btn btn-primary" id="btn-nova-mov-est">+ Registrar Movimentação</button>`);
      document.getElementById('btn-nova-mov-est').onclick = () => {
        el.innerHTML = `<form id="form-mov-est">
          <div class="mb-3"><label class="form-label">Produto *</label>
            <select name="produto_id" class="form-select" required><option value="">Selecione...</option>${prodOpts}</select>
          </div>
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <div class="col-4"><label class="form-label">Quantidade *</label><input name="quantidade" type="number" step="0.001" min="0.001" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Custo Unit. (R$)</label><input name="custo_unitario" type="number" step="0.01" min="0" class="form-control"></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
            <div class="col-6"><label class="form-label">Validade</label><input name="validade" type="date" class="form-control"></div>
          </div>
          <div class="mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`
          <button class="btn btn-secondary" id="btn-voltar-mov">← Voltar</button>
          <button class="btn btn-success" id="btn-salvar-mov-est">Salvar</button>`);
        document.getElementById('btn-voltar-mov').onclick = () => load(filtroAtual);
        document.getElementById('btn-salvar-mov-est').onclick = async () => {
          const f = document.getElementById('form-mov-est');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-mov-est'), async () => {
            const res = await API.post('/estoque/movimentacoes', body);
            if (res.success) { showToast('Movimentação registrada!', 'success'); await load(filtroAtual); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f06: Gerenciamento de Estoques ────────────────────────────────────────────

  f06GerenciamentoEstoques: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '📦 Gerenciamento de Estoques', size: 'xl', body: _spinner() });
    let produtosCache = [];
    let estadoAtual   = { filtro: 'todos', search: '' };

    const load = async (filtro = 'todos', search = '') => {
      estadoAtual = { filtro, search };
      el.innerHTML = _spinner();
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filtro === 'critico') params.set('abaixo_minimo', '1');
      const r = await API.get(`/estoque/produtos?${params}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar estoque.'); return; }

      const todos    = r.data;
      const criticos = todos.filter(p => Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0));
      const normais  = todos.filter(p => Number(p.estoque_atual || 0) >  Number(p.estoque_minimo || 0));
      const lista    = filtro === 'critico' ? criticos : filtro === 'normal' ? normais : todos;
      produtosCache  = lista;

      const rows = lista.map(item => {
        const saldo = Number(item.estoque_atual || 0);
        const min   = Number(item.estoque_minimo || 0);
        const max   = Number(item.estoque_maximo || 0);
        const alerta = saldo <= min
          ? '<span class="badge badge-danger">Crítico</span>'
          : (max > 0 && saldo >= max ? '<span class="badge badge-warning">Excesso</span>' : '<span class="badge badge-success">Normal</span>');
        return `<tr>
          <td>${escapeHtml(item.codigo || '—')}</td>
          <td>${escapeHtml(item.nome)}</td>
          <td>${escapeHtml(item.categoria_nome || '—')}</td>
          <td><strong>${saldo.toFixed(3)}</strong> ${escapeHtml(item.unidade_medida || '')}</td>
          <td>${min.toFixed(3)}</td>
          <td>${max > 0 ? max.toFixed(3) : '—'}</td>
          <td>${item.localizacao ? escapeHtml(item.localizacao) : '—'}</td>
          <td>${alerta}</td>
          ${user.nivel_acesso >= 4
            ? `<td><button class="btn btn-sm btn-secondary" onclick="EstoqueForms._editarProduto(${item.id})">✏️</button></td>`
            : '<td></td>'}
        </tr>`;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
          ${['todos','critico','normal'].map(f => `<button class="btn btn-sm ${filtro===f?'btn-primary':'btn-secondary'}"
            onclick="EstoqueForms._filtroEst('${f}')">${f==='todos'?'Todos':f==='critico'?'⚠️ Crítico':'✅ Normal'}</button>`).join('')}
          <input type="text" class="form-control form-control-sm" id="est-search-prod" placeholder="Buscar produto..."
            style="max-width:200px;" value="${escapeHtml(search)}">
          <button class="btn btn-sm btn-secondary" id="btn-buscar-prod">🔍</button>
          <span class="badge badge-secondary" style="margin-left:auto;">${lista.length} itens</span>
          ${criticos.length ? `<span class="badge badge-danger">⚠️ ${criticos.length} críticos</span>` : ''}
        </div>
        ${rows ? `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
          <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Saldo</th><th>Mín</th><th>Máx</th><th>Local</th><th>Alerta</th>${user.nivel_acesso>=4?'<th></th>':''}</tr></thead>
          <tbody>${rows}</tbody></table></div>`
          : _empty('Nenhum produto encontrado.', user.nivel_acesso >= 4
            ? `<button class="btn btn-primary" onclick="document.getElementById('btn-novo-prod').click()">+ Novo Produto</button>`
            : '')}`;

      document.getElementById('btn-buscar-prod').onclick = () => load(filtro, document.getElementById('est-search-prod').value.trim());
      document.getElementById('est-search-prod').addEventListener('keydown', (e) => { if (e.key === 'Enter') load(filtro, e.target.value.trim()); });
    };

    EstoqueForms._filtroEst = (f) => load(f, estadoAtual.search);

    EstoqueForms._editarProduto = async (id) => {
      const p = produtosCache.find(x => x.id === id);
      if (!p) return;
      const rC = await API.get('/estoque/categorias');
      const cats = (rC && rC.data) ? rC.data : [];
      const catOpts = cats.map(c => `<option value="${c.id}" ${p.categoria_id == c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>`).join('');
      el.innerHTML = `<form id="form-edit-prod">
        <div class="row g-2">
          <div class="col-3"><label class="form-label">Código</label><input name="codigo_display" class="form-control" value="${escapeHtml(p.codigo || '')}" disabled></div>
          <div class="col-9"><label class="form-label">Nome *</label><input name="nome" class="form-control" value="${escapeHtml(p.nome)}" required></div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-5"><label class="form-label">Categoria</label>
            <select name="categoria_id" class="form-select"><option value="">— Sem categoria —</option>${catOpts}</select>
          </div>
          <div class="col-3"><label class="form-label">Unidade</label>
            <select name="unidade_medida" class="form-select">
              ${['un','kg','L','m','cx','pc','g','ml','t'].map(u => `<option value="${u}" ${p.unidade_medida===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="col-4"><label class="form-label">Custo Unit. (R$)</label><input name="custo_unitario" type="number" step="0.01" min="0" class="form-control" value="${p.custo_unitario || 0}"></div>
        </div>
        <div class="mt-2"><label class="form-label">Localização</label><input name="localizacao" class="form-control" value="${escapeHtml(p.localizacao || '')}"></div>
      </form>`;
      setFooter(`
        <button class="btn btn-secondary" id="btn-voltar-edit-prod">← Voltar</button>
        <button class="btn btn-success" id="btn-salvar-edit-prod">💾 Salvar Alterações</button>`);
      document.getElementById('btn-voltar-edit-prod').onclick = () => load(estadoAtual.filtro, estadoAtual.search);
      document.getElementById('btn-salvar-edit-prod').onclick = async () => {
        const f = document.getElementById('form-edit-prod');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        delete body.codigo_display;
        await _withSubmit(document.getElementById('btn-salvar-edit-prod'), async () => {
          const res = await API.put(`/estoque/produtos/${id}`, body);
          if (res.success) { showToast('Produto atualizado!', 'success'); await load(estadoAtual.filtro, estadoAtual.search); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };

    await load();

    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-prod">+ Novo Produto</button>`);
      document.getElementById('btn-novo-prod').onclick = async () => {
        const rC = await API.get('/estoque/categorias');
        const cats = (rC && rC.data) ? rC.data : [];
        const catOpts = cats.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
        el.innerHTML = `<form id="form-produto">
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Código</label><input name="codigo" class="form-control" placeholder="Auto se vazio"></div>
            <div class="col-8"><label class="form-label">Nome *</label><input name="nome" class="form-control" required placeholder="Nome do produto"></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-4"><label class="form-label">Categoria</label>
              <select name="categoria_id" class="form-select"><option value="">— Sem categoria —</option>${catOpts}</select>
            </div>
            <div class="col-4"><label class="form-label">Unidade *</label>
              <select name="unidade_medida" class="form-select" required>
                <option value="un">un</option><option value="kg">kg</option><option value="L">L</option>
                <option value="m">m</option><option value="cx">cx</option><option value="pc">pc</option>
                <option value="g">g</option><option value="ml">ml</option><option value="t">t</option>
              </select>
            </div>
            <div class="col-4"><label class="form-label">Custo Unit. (R$)</label><input name="custo_unitario" type="number" step="0.01" min="0" value="0" class="form-control"></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-4"><label class="form-label">Saldo Inicial</label><input name="estoque_atual" type="number" step="0.001" min="0" value="0" class="form-control"></div>
            <div class="col-4"><label class="form-label">Estoque Mínimo</label><input name="estoque_minimo" type="number" step="0.001" min="0" value="0" class="form-control"></div>
            <div class="col-4"><label class="form-label">Estoque Máximo</label><input name="estoque_maximo" type="number" step="0.001" min="0" value="0" class="form-control"></div>
          </div>
          <div class="mt-2"><label class="form-label">Localização</label><input name="localizacao" class="form-control" placeholder="Ex: A-01-02, Pallet-3"></div>
        </form>`;
        setFooter(`
          <button class="btn btn-secondary" id="btn-voltar-prod">← Voltar</button>
          <button class="btn btn-success" id="btn-salvar-prod">💾 Criar Produto</button>`);
        document.getElementById('btn-voltar-prod').onclick = () => load(estadoAtual.filtro, estadoAtual.search);
        document.getElementById('btn-salvar-prod').onclick = async () => {
          const f = document.getElementById('form-produto');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-prod'), async () => {
            const res = await API.post('/estoque/produtos', body);
            if (res.success) { showToast(`Produto criado! Código: ${res.data.codigo}`, 'success'); await load(); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f07: Separação de Pedidos ─────────────────────────────────────────────────

  f07SeparacaoPedidos: async (user) => {
    const { el } = _estoqueModal({ title: '📋 Separação de Pedidos (Picking)', size: 'xl', body: _spinner() });
    const r = await API.get('/estoque/separacao');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhuma ordem de produção pendente para separação.'); return; }

    const rows = r.data.map(p => `<tr>
      <td>${escapeHtml(p.codigo || String(p.id))}</td>
      <td>${escapeHtml(p.produto_nome || '—')}</td>
      <td>${escapeHtml(p.produto_codigo || '—')}</td>
      <td>${Number(p.quantidade_planejada || 0).toFixed(3)}</td>
      <td>${p.estoque_atual != null ? Number(p.estoque_atual).toFixed(3) : '—'}</td>
      <td>${p.localizacao ? `<span class="badge badge-info">${escapeHtml(p.localizacao)}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${_badge(p.status)}</td>
    </tr>`).join('');

    el.innerHTML = `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
      <thead><tr><th>OP</th><th>Produto</th><th>Código</th><th>Qtd Planejada</th><th>Saldo Estoque</th><th>Localização</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  },

  // ── f08: Conferência de Expedição ─────────────────────────────────────────────

  f08ConferenciaExpedicao: async (user) => {
    const { el } = _estoqueModal({ title: '🚛 Conferência de Expedição', size: 'xl', body: _spinner() });
    const r = await API.get('/estoque/expedicao?limit=30');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar expedições.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhum pedido aguardando conferência.'); return; }

    const rows = r.data.map(e => `<tr>
      <td>${escapeHtml(e.numero_pedido || e.codigo || String(e.id))}</td>
      <td>${escapeHtml(e.fornecedor_nome || e.solicitante_nome || '—')}</td>
      <td>${_fmtMoney(e.valor_total)}</td>
      <td>${_badge(e.status)}</td>
      <td>${_fmtDate(e.data_solicitacao)}</td>
      <td>${escapeHtml((e.observacao || '').substring(0, 50))}${(e.observacao || '').length > 50 ? '…' : ''}</td>
    </tr>`).join('');

    el.innerHTML = `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
      <thead><tr><th>Pedido</th><th>Fornecedor / Solicitante</th><th>Valor Total</th><th>Status</th><th>Data</th><th>Obs.</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  },

  // ── f09: Impressão de Etiquetas ───────────────────────────────────────────────

  f09ImpressaoEtiquetas: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '🏷️ Impressão de Etiquetas', size: 'lg', body: _spinner() });
    const r = await API.get('/estoque/produtos');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar produtos.'); return; }

    const prodOpts = r.data.map(p =>
      `<option value="${p.id}"
        data-nome="${escapeHtml(p.nome)}"
        data-codigo="${escapeHtml(p.codigo || String(p.id))}"
        data-un="${escapeHtml(p.unidade_medida || 'un')}"
        data-loc="${escapeHtml(p.localizacao || '')}">${escapeHtml(p.nome)} (${escapeHtml(p.codigo || String(p.id))})</option>`
    ).join('');

    el.innerHTML = `
      <div class="mb-3"><label class="form-label">Produto *</label>
        <select id="etq-produto" class="form-select"><option value="">Selecione...</option>${prodOpts}</select>
      </div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">Lote / NF (opcional)</label><input id="etq-lote" class="form-control" placeholder="Lote / NF"></div>
        <div class="col-3"><label class="form-label">Validade</label><input id="etq-validade" type="date" class="form-control"></div>
        <div class="col-3"><label class="form-label">Qtd etiquetas</label><input id="etq-qty" type="number" min="1" max="100" value="1" class="form-control"></div>
      </div>
      <div id="etq-preview" style="margin-top:16px;"></div>`;

    const atualizar = () => EstoqueForms._previewEtiqueta();
    document.getElementById('etq-produto').addEventListener('change', atualizar);
    document.getElementById('etq-lote').addEventListener('input', atualizar);
    document.getElementById('etq-validade').addEventListener('change', atualizar);

    setFooter(`<button class="btn btn-primary" id="btn-imprimir-etq">🖨️ Imprimir Etiqueta(s)</button>`);
    document.getElementById('btn-imprimir-etq').onclick = () => {
      if (!document.getElementById('etq-produto').value) { showToast('Selecione um produto.', 'warning'); return; }
      EstoqueForms._imprimirEtiqueta();
    };
  },

  _previewEtiqueta: () => {
    const sel = document.getElementById('etq-produto');
    const opt = sel.selectedOptions[0];
    if (!opt || !opt.value) { document.getElementById('etq-preview').innerHTML = ''; return; }
    const lote = document.getElementById('etq-lote').value;
    const val  = document.getElementById('etq-validade').value;
    const valStr = val ? new Date(val + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    document.getElementById('etq-preview').innerHTML = `
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Prévia:</p>
      <div style="display:inline-block;border:2px dashed var(--border-color);border-radius:8px;padding:14px 18px;font-family:monospace;min-width:220px;">
        <div style="font-size:10px;color:var(--text-muted);">Tecnobloco — ESTOQUE</div>
        <div style="font-size:15px;font-weight:700;margin:4px 0;">${escapeHtml(opt.dataset.nome)}</div>
        <div style="font-size:12px;">Cód: <strong>${escapeHtml(opt.dataset.codigo)}</strong></div>
        ${lote ? `<div style="font-size:11px;">Lote: ${escapeHtml(lote)}</div>` : ''}
        ${valStr ? `<div style="font-size:11px;">Val: <strong>${escapeHtml(valStr)}</strong></div>` : ''}
        ${opt.dataset.loc ? `<div style="font-size:11px;">Local: ${escapeHtml(opt.dataset.loc)}</div>` : ''}
        <div style="margin-top:6px;font-size:10px;color:var(--text-muted);">${new Date().toLocaleDateString('pt-BR')}</div>
      </div>`;
  },

  _imprimirEtiqueta: () => {
    const sel = document.getElementById('etq-produto');
    const opt = sel.selectedOptions[0];
    const qty = Math.max(1, Math.min(100, parseInt(document.getElementById('etq-qty').value) || 1));
    const lote = document.getElementById('etq-lote').value;
    const val  = document.getElementById('etq-validade').value;
    const valStr = val ? new Date(val + 'T00:00:00').toLocaleDateString('pt-BR') : '';

    let etqs = '';
    for (let i = 0; i < qty; i++) {
      etqs += `<div style="display:inline-block;border:1px solid #000;padding:8px 12px;margin:4px;width:230px;font-family:Arial,sans-serif;font-size:12px;vertical-align:top;">
        <div style="font-size:10px;color:#555;">Tecnobloco — Gestão de Estoque</div>
        <div style="font-size:14px;font-weight:700;margin:4px 0;">${escapeHtml(opt.dataset.nome)}</div>
        <div>Cód: <strong>${escapeHtml(opt.dataset.codigo)}</strong></div>
        ${lote ? `<div>Lote: ${escapeHtml(lote)}</div>` : ''}
        ${valStr ? `<div>Val: <strong style="color:#c00;">${escapeHtml(valStr)}</strong></div>` : ''}
        ${opt.dataset.loc ? `<div>Local: ${escapeHtml(opt.dataset.loc)}</div>` : ''}
        <div style="font-size:10px;color:#888;margin-top:4px;">${new Date().toLocaleDateString('pt-BR')}</div>
      </div>`;
    }

    const w = window.open('', '_blank');
    if (!w) { showToast('Popup bloqueado pelo navegador. Permita popups para imprimir.', 'warning'); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>Etiquetas</title>
      <style>@media print{body{margin:0;} @page{margin:5mm;}}</style></head>
      <body style="padding:8px;">${etqs}<script>window.onload=function(){window.print();window.close();};<\/script></body></html>`);
    w.document.close();
  },

  // ── f10: Gerenciar Requisições de Materiais ───────────────────────────────────

  f10GerenciarRequisicaoMateriais: async (user) => {
    const { el } = _estoqueModal({ title: '📋 Requisições de Materiais', size: 'xl', body: _spinner() });
    let filtroReqAtual = 'pendente';

    const load = async (status = 'pendente') => {
      filtroReqAtual = status;
      el.innerHTML = _spinner();
      const q = status ? `?status=${status}` : '';
      const r = await API.get(`/estoque/solicitacoes${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar requisições.'); return; }

      const statusTabs = ['pendente', 'aprovada', 'em_cotacao', 'concluida', 'rejeitada', ''];
      const tabsHtml = `<div class="mb-3" style="display:flex;gap:6px;flex-wrap:wrap;">
        ${statusTabs.map(sf => `<button class="btn btn-sm ${filtroReqAtual===sf?'btn-primary':'btn-secondary'}"
          onclick="EstoqueForms._filtroReq('${sf}')">${sf||'Todas'}</button>`).join('')}
      </div>`;

      if (!r.data.length) {
        el.innerHTML = tabsHtml + _empty(`Nenhuma requisição ${status ? `com status "${status}"` : ''} encontrada.`);
        return;
      }

      const rows = r.data.map(s => `<tr>
        <td>${escapeHtml(s.numero || String(s.id))}</td>
        <td>${escapeHtml(s.solicitante_nome || '—')}</td>
        <td>${escapeHtml((s.descricao || s.item || '—').substring(0, 50))}</td>
        <td>${_badge(s.urgencia || 'media')}</td>
        <td>${_badge(s.status)}</td>
        <td>${_fmtDate(s.criado_em)}</td>
        ${user.nivel_acesso >= 4 ? `<td style="white-space:nowrap;">
          ${s.status === 'pendente' ? `
            <button class="btn btn-sm btn-success" onclick="EstoqueForms._aprovarReq(${s.id},'aprovada')" style="margin-right:3px;">✓</button>
            <button class="btn btn-sm btn-danger" onclick="EstoqueForms._aprovarReq(${s.id},'rejeitada')">✗</button>` : ''}
          ${s.status === 'aprovada' ? `<button class="btn btn-sm btn-info" onclick="EstoqueForms._aprovarReq(${s.id},'concluida')">Concluir</button>` : ''}
          ${!['pendente','aprovada'].includes(s.status) ? `<span style="font-size:12px;color:var(--text-muted);">${escapeHtml(s.aprovado_por_nome||'—')}</span>` : ''}
        </td>` : '<td>—</td>'}
      </tr>`).join('');

      el.innerHTML = tabsHtml + `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>#</th><th>Solicitante</th><th>Descrição</th><th>Urgência</th><th>Status</th><th>Data</th><th>Ação</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    };

    EstoqueForms._filtroReq = (s) => load(s);
    EstoqueForms._aprovarReq = async (id, novoStatus) => {
      const obs = novoStatus === 'rejeitada' ? (prompt('Motivo da rejeição:') || '') : '';
      const res = await API.put(`/estoque/solicitacoes/${id}`, { status: novoStatus, observacao: obs });
      if (res.success) { showToast(`Requisição ${novoStatus}!`, novoStatus === 'aprovada' || novoStatus === 'concluida' ? 'success' : 'warning'); load(filtroReqAtual); }
      else showToast(res.message || 'Erro ao atualizar.', 'danger');
    };

    await load('pendente');
  },

  // ── f11: Controle de Validade ─────────────────────────────────────────────────

  f11ControleValidade: async (user) => {
    const { el } = _estoqueModal({ title: '⏰ Controle de Validade (FEFO)', size: 'xl', body: _spinner() });
    const r = await API.get('/estoque/validade?dias_alerta=60');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados de validade.'); return; }
    if (!r.data.length) {
      el.innerHTML = _empty('Nenhum item com vencimento próximo nos próximos 60 dias.', '<span class="badge badge-success" style="font-size:14px;">✅ Estoque dentro da validade</span>');
      return;
    }

    const hoje = new Date();
    const vencidos = r.data.filter(i => new Date(i.validade) < hoje);
    const criticos = r.data.filter(i => { const d = new Date(i.validade); const dias = Math.ceil((d-hoje)/86400000); return dias >= 0 && dias <= 7; });
    const alertas  = r.data.filter(i => { const d = new Date(i.validade); const dias = Math.ceil((d-hoje)/86400000); return dias > 7 && dias <= 30; });
    const normais  = r.data.filter(i => { const d = new Date(i.validade); return Math.ceil((d-hoje)/86400000) > 30; });

    const rows = r.data.map(item => {
      const venc = new Date(item.validade);
      const dias = Math.ceil((venc - hoje) / 86400000);
      const rowStyle = dias < 0 ? 'style="background:rgba(239,68,68,0.08)"' : dias <= 7 ? 'style="background:rgba(251,146,60,0.08)"' : '';
      const situacao = dias < 0
        ? `<span class="badge badge-danger">Vencido há ${Math.abs(dias)}d</span>`
        : dias === 0 ? `<span class="badge badge-danger">Vence HOJE</span>`
        : dias <= 7  ? `<span class="badge badge-warning">${dias} dias</span>`
        : dias <= 30 ? `<span class="badge badge-info">${dias} dias</span>`
        : `<span class="badge badge-success">${dias} dias</span>`;
      return `<tr ${rowStyle}>
        <td>${escapeHtml(item.produto_nome || '—')}</td>
        <td>${escapeHtml(item.produto_codigo || '—')}</td>
        <td>${escapeHtml(item.lote || '—')}</td>
        <td>${Number(item.quantidade).toFixed(3)} ${escapeHtml(item.unidade_medida || '')}</td>
        <td>${_fmtDate(item.validade)}</td>
        <td>${situacao}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
        ${vencidos.length  ? `<span class="badge badge-danger">🚨 ${vencidos.length} vencidos</span>` : ''}
        ${criticos.length  ? `<span class="badge badge-warning">⚠️ ${criticos.length} críticos (≤7d)</span>` : ''}
        ${alertas.length   ? `<span class="badge badge-info">📅 ${alertas.length} em alerta (≤30d)</span>` : ''}
        ${normais.length   ? `<span class="badge badge-success">✅ ${normais.length} ok (>30d)</span>` : ''}
      </div>
      <div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>Produto</th><th>Código</th><th>Lote</th><th>Quantidade</th><th>Validade</th><th>Situação</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
  },

  // ── f12: Bloqueio / Quarentena de Lote ───────────────────────────────────────

  f12BloqueioLote: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '🔒 Bloqueio / Quarentena de Lote', size: 'xl', body: _spinner() });
    let filtroBloq = 'bloqueado';

    const load = async (status = 'bloqueado') => {
      filtroBloq = status;
      el.innerHTML = _spinner();
      const q = status ? `?status=${status}` : '';
      const r = await API.get(`/estoque/bloqueios${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar bloqueios.'); return; }

      const statusTabs = ['bloqueado', 'liberado', 'descartado', ''];
      const tabsHtml = `<div class="mb-3" style="display:flex;gap:6px;">
        ${statusTabs.map(s => `<button class="btn btn-sm ${filtroBloq===s?'btn-primary':'btn-secondary'}"
          onclick="EstoqueForms._filtroBloq('${s}')">${s||'Todos'}</button>`).join('')}
      </div>`;

      if (!r.data.length) {
        el.innerHTML = tabsHtml + _empty(`Nenhum lote ${status||''} encontrado.`);
        return;
      }

      const rows = r.data.map(b => `<tr>
        <td>${escapeHtml(b.lote)}</td>
        <td>${escapeHtml(b.produto_nome || '—')}</td>
        <td style="max-width:200px;">${escapeHtml((b.motivo || '').substring(0, 60))}${(b.motivo||'').length>60?'…':''}</td>
        <td>${_badge(b.status)}</td>
        <td>${_fmtDate(b.data_bloqueio)}</td>
        <td>${escapeHtml(b.bloqueado_por_nome || '—')}</td>
        ${user.nivel_acesso >= 4 && b.status === 'bloqueado' ? `<td style="white-space:nowrap;">
          <button class="btn btn-sm btn-success" onclick="EstoqueForms._liberarLote(${b.id},'liberado')" style="margin-right:3px;">Liberar</button>
          <button class="btn btn-sm btn-danger" onclick="EstoqueForms._liberarLote(${b.id},'descartado')">Descartar</button>
        </td>` : '<td>—</td>'}
      </tr>`).join('');

      el.innerHTML = tabsHtml + `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>Lote</th><th>Produto</th><th>Motivo</th><th>Status</th><th>Data Bloqueio</th><th>Bloqueado por</th>${user.nivel_acesso>=4?'<th>Ação</th>':''}</tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    };

    EstoqueForms._filtroBloq = (s) => load(s);
    EstoqueForms._liberarLote = async (id, status) => {
      if (!confirm(`Confirmar ${status === 'liberado' ? 'liberação' : 'descarte'} do lote?`)) return;
      const res = await API.put(`/estoque/bloqueios/${id}`, { status });
      if (res.success) { showToast(`Lote ${status}!`, status === 'liberado' ? 'success' : 'warning'); load(filtroBloq); }
      else showToast(res.message || 'Erro ao atualizar.', 'danger');
    };

    await load('bloqueado');

    if (user.nivel_acesso >= 4) {
      const rP = await API.get('/estoque/produtos');
      const prodOpts = (rP.data || []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.codigo || '')})</option>`).join('');

      setFooter(`<button class="btn btn-warning" id="btn-bloquear-lote">🔒 Bloquear Lote</button>`);
      document.getElementById('btn-bloquear-lote').onclick = () => {
        el.innerHTML = `<form id="form-bloqueio">
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Produto *</label>
              <select name="produto_id" class="form-select" required><option value="">Selecione...</option>${prodOpts}</select>
            </div>
            <div class="col-6"><label class="form-label">Número do Lote *</label>
              <input name="lote" class="form-control" required placeholder="Ex: L2024-001">
            </div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Motivo do Bloqueio / Quarentena *</label>
            <textarea name="motivo" class="form-control" rows="3" required
              placeholder="Descreva o motivo: contaminação suspeita, divergência de análise, avaria..."></textarea>
          </div>
        </form>`;
        setFooter(`
          <button class="btn btn-secondary" id="btn-voltar-bloq">← Voltar</button>
          <button class="btn btn-danger" id="btn-salvar-bloq">🔒 Confirmar Bloqueio</button>`);
        document.getElementById('btn-voltar-bloq').onclick = () => load('bloqueado');
        document.getElementById('btn-salvar-bloq').onclick = async () => {
          const f = document.getElementById('form-bloqueio');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-bloq'), async () => {
            const res = await API.post('/estoque/bloqueios', body);
            if (res.success) { showToast('Lote bloqueado!', 'warning'); load('bloqueado'); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f13: Inventário Cíclico ───────────────────────────────────────────────────

  f13InventarioCiclico: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '🔢 Inventário Cíclico', size: 'xl', body: _spinner() });

    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/estoque/inventarios?limit=20');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar inventários.'); return; }
      if (!r.data.length) {
        el.innerHTML = _empty('Nenhum inventário registrado.',
          user.nivel_acesso >= 3 ? `<button class="btn btn-primary" onclick="document.getElementById('btn-novo-inv').click()">+ Iniciar Inventário</button>` : '');
        return;
      }

      const rows = r.data.map(inv => {
        const total   = inv.total_itens || 0;
        const contado = inv.itens_contados || 0;
        const pct     = total > 0 ? Math.round(contado / total * 100) : 0;
        return `<tr>
          <td>${escapeHtml(inv.codigo || String(inv.id))}</td>
          <td>${escapeHtml(inv.descricao || '—')}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;min-width:80px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width .3s;"></div>
              </div>
              <span style="font-size:12px;white-space:nowrap;">${contado}/${total} (${pct}%)</span>
            </div>
          </td>
          <td>${_badge(inv.status)}</td>
          <td>${escapeHtml(inv.responsavel_nome || '—')}</td>
          <td>${_fmtDate(inv.criado_em)}</td>
          <td style="white-space:nowrap;">
            ${inv.status === 'em_andamento' && user.nivel_acesso >= 3 ? `
              <button class="btn btn-sm btn-info" onclick="EstoqueForms._verInventario(${inv.id})" style="margin-right:3px;">Ver Itens</button>
              ${user.nivel_acesso >= 4 ? `<button class="btn btn-sm btn-success" onclick="EstoqueForms._concluirInventario(${inv.id})">Concluir</button>` : ''}
            ` : '—'}
          </td>
        </tr>`;
      }).join('');

      el.innerHTML = `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>Código</th><th>Descrição</th><th>Progresso</th><th>Status</th><th>Responsável</th><th>Data</th><th>Ação</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;

      EstoqueForms._reloadInv = load;
    };

    EstoqueForms._concluirInventario = async (id) => {
      if (!confirm('Concluir este inventário? Os itens não contados serão marcados como divergentes.')) return;
      const res = await API.post(`/estoque/inventarios/${id}/concluir`, {});
      if (res.success) { showToast('Inventário concluído!', 'success'); load(); }
      else showToast(res.message || 'Erro ao concluir.', 'danger');
    };

    EstoqueForms._verInventario = async (invId) => {
      el.innerHTML = _spinner();
      const [rItens, rProds] = await Promise.all([
        API.get(`/estoque/inventarios/${invId}/itens`),
        API.get('/estoque/produtos'),
      ]);
      if (!rItens || !rItens.success) { el.innerHTML = _empty('Erro ao carregar itens.'); return; }

      const prodLivre = (rProds && rProds.data ? rProds.data : []).filter(p => !rItens.data.some(i => i.produto_id === p.id));
      const addOpts   = prodLivre.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.codigo||'')})</option>`).join('');

      const rows = rItens.data.map(item => {
        const dif = item.diferenca != null ? Number(item.diferenca) : null;
        const difHtml = dif != null
          ? (dif === 0 ? '<span class="badge badge-success">0</span>'
            : dif > 0 ? `<span class="badge badge-info">+${dif.toFixed(3)}</span>`
            : `<span class="badge badge-danger">${dif.toFixed(3)}</span>`)
          : '—';
        return `<tr>
          <td>${escapeHtml(item.produto_nome || '—')}</td>
          <td>${escapeHtml(item.produto_codigo || '—')}</td>
          <td>${Number(item.quantidade_sistema || 0).toFixed(3)}</td>
          <td>
            ${item.quantidade_contada != null
              ? `<strong>${Number(item.quantidade_contada).toFixed(3)}</strong>`
              : `<input type="number" step="0.001" min="0" class="form-control form-control-sm" style="width:110px;"
                  placeholder="Contar..." onchange="EstoqueForms._contarItem(${invId},${item.id},this.value)">`}
          </td>
          <td>${difHtml}</td>
        </tr>`;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <button class="btn btn-sm btn-secondary" onclick="EstoqueForms._reloadInv()">← Voltar à lista</button>
          ${addOpts ? `<div style="display:flex;gap:6px;align-items:center;">
            <select id="add-item-inv" class="form-select form-select-sm" style="max-width:240px;">
              <option value="">Adicionar produto...</option>${addOpts}
            </select>
            <button class="btn btn-sm btn-primary" onclick="EstoqueForms._addItemInv(${invId})">Adicionar</button>
          </div>` : ''}
        </div>
        ${rows ? `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
          <thead><tr><th>Produto</th><th>Código</th><th>Saldo Sistema</th><th>Contado</th><th>Diferença</th></tr></thead>
          <tbody>${rows}</tbody></table></div>` : _empty('Nenhum produto adicionado ainda.')}`;
    };

    EstoqueForms._contarItem = async (invId, itemId, qty) => {
      const res = await API.patch(`/estoque/inventarios/${invId}/itens/${itemId}`, { quantidade_contada: qty });
      if (res.success) showToast('Contagem salva!', 'success');
      else showToast(res.message || 'Erro ao salvar contagem.', 'danger');
    };

    EstoqueForms._addItemInv = async (invId) => {
      const sel = document.getElementById('add-item-inv');
      if (!sel.value) { showToast('Selecione um produto.', 'warning'); return; }
      const res = await API.post(`/estoque/inventarios/${invId}/itens`, { produto_id: sel.value });
      if (res.success) { showToast('Produto adicionado!', 'success'); EstoqueForms._verInventario(invId); }
      else showToast(res.message || 'Erro ao adicionar.', 'danger');
    };

    await load();

    if (user.nivel_acesso >= 3) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-inv">+ Novo Inventário</button>`);
      document.getElementById('btn-novo-inv').onclick = () => {
        const hoje = new Date().toISOString().split('T')[0];
        el.innerHTML = `<form id="form-inv">
          <div class="mb-3"><label class="form-label">Código (opcional)</label><input name="codigo" class="form-control" placeholder="Gerado automaticamente se vazio"></div>
          <div class="mb-3"><label class="form-label">Descrição / Área *</label><input name="descricao" class="form-control" required placeholder="Ex: Câmara Fria, Embalagens, Matéria-Prima..."></div>
          <div class="mb-3"><label class="form-label">Data Início *</label><input name="data_inicio" type="date" class="form-control" value="${hoje}" required></div>
          <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`
          <button class="btn btn-secondary" id="btn-voltar-inv">← Voltar</button>
          <button class="btn btn-success" id="btn-salvar-inv">Iniciar Inventário</button>`);
        document.getElementById('btn-voltar-inv').onclick = load;
        document.getElementById('btn-salvar-inv').onclick = async () => {
          const f = document.getElementById('form-inv');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-inv'), async () => {
            const res = await API.post('/estoque/inventarios', body);
            if (res.success) { showToast(`Inventário ${res.data.codigo} iniciado!`, 'success'); await load(); }
            else showToast(res.message || 'Erro ao criar.', 'danger');
          });
        };
      };
    }
  },

  // ── f14: Ajuste de Estoque ────────────────────────────────────────────────────

  f14AjusteEstoque: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '⚖️ Ajuste de Estoque', size: 'lg', body: _spinner() });
    const rP = await API.get('/estoque/produtos');
    if (!rP || !rP.success) { el.innerHTML = _empty('Erro ao carregar produtos.'); return; }

    const prodOpts = rP.data.map(p =>
      `<option value="${p.id}" data-saldo="${Number(p.estoque_atual||0).toFixed(3)}" data-un="${escapeHtml(p.unidade_medida||'un')}">
        ${escapeHtml(p.nome)} (${escapeHtml(p.codigo||'')} — Saldo: ${Number(p.estoque_atual||0).toFixed(3)} ${escapeHtml(p.unidade_medida||'')})
      </option>`
    ).join('');

    el.innerHTML = `<form id="form-ajuste">
      <div class="mb-3"><label class="form-label">Produto *</label>
        <select name="produto_id" id="ajuste-produto" class="form-select" required>
          <option value="">Selecione...</option>${prodOpts}
        </select>
      </div>
      <div id="ajuste-saldo-info" style="padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:6px;margin-bottom:14px;font-size:13px;color:var(--text-muted);">
        Selecione um produto para ver o saldo atual
      </div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">Tipo *</label>
          <select name="tipo" class="form-select" required>
            <option value="ajuste">Ajuste (soma ao saldo)</option>
            <option value="perda">Perda / Quebra (subtrai do saldo)</option>
          </select>
        </div>
        <div class="col-6"><label class="form-label">Quantidade *</label>
          <input name="quantidade" type="number" step="0.001" min="0.001" class="form-control" required
            placeholder="Informe o valor positivo">
        </div>
      </div>
      <div class="mt-3"><label class="form-label">Motivo do Ajuste *</label>
        <select id="ajuste-motivo-sel" class="form-select mb-2">
          <option value="">Selecione o motivo...</option>
          <option value="Inventário físico — divergência corrigida">Inventário físico — divergência</option>
          <option value="Perda por avaria">Perda por avaria</option>
          <option value="Perda por vencimento">Perda por vencimento</option>
          <option value="Erro de lançamento anterior corrigido">Erro de lançamento anterior</option>
          <option value="Quebra operacional">Quebra operacional</option>
          <option value="outro">Outro (descrever abaixo)</option>
        </select>
        <textarea id="ajuste-obs" class="form-control" rows="2" placeholder="Detalhe o motivo se necessário..."></textarea>
      </div>
    </form>`;

    document.getElementById('ajuste-produto').addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      const div = document.getElementById('ajuste-saldo-info');
      if (opt && opt.value) {
        div.innerHTML = `Saldo atual: <strong style="color:var(--text-primary);">${opt.dataset.saldo} ${opt.dataset.un}</strong>`;
      } else {
        div.innerHTML = 'Selecione um produto para ver o saldo atual';
      }
    });

    document.getElementById('ajuste-motivo-sel').addEventListener('change', (e) => {
      const obs = document.getElementById('ajuste-obs');
      if (e.target.value && e.target.value !== 'outro') obs.value = e.target.value;
    });

    setFooter(`<button class="btn btn-warning" id="btn-salvar-ajuste">⚖️ Confirmar Ajuste</button>`);
    document.getElementById('btn-salvar-ajuste').onclick = async () => {
      const f = document.getElementById('form-ajuste');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const fd      = new FormData(f);
      const motivo  = document.getElementById('ajuste-obs').value.trim() || document.getElementById('ajuste-motivo-sel').value;
      if (!motivo) { showToast('Informe o motivo do ajuste.', 'warning'); return; }
      const body = {
        produto_id:  fd.get('produto_id'),
        tipo:        fd.get('tipo'),
        quantidade:  fd.get('quantidade'),
        observacao:  motivo,
      };
      if (!confirm(`Confirmar ajuste de ${body.quantidade} unidades?`)) return;
      await _withSubmit(document.getElementById('btn-salvar-ajuste'), async () => {
        const res = await API.post('/estoque/movimentacoes', body);
        if (res.success) { showToast('Ajuste registrado com sucesso!', 'success'); EstoqueForms.f14AjusteEstoque(user); }
        else showToast(res.message || 'Erro ao registrar ajuste.', 'danger');
      });
    };
  },

  // ── f15: Estoque Mínimo e Máximo ──────────────────────────────────────────────

  f15EstoqueMinMax: async (user) => {
    const { el } = _estoqueModal({ title: '📊 Gestão de Estoque Mínimo e Máximo', size: 'xl', body: _spinner() });
    const r = await API.get('/estoque/produtos');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar produtos.'); return; }

    const rows = r.data.map(p => {
      const saldo = Number(p.estoque_atual || 0);
      const min   = Number(p.estoque_minimo || 0);
      const max   = Number(p.estoque_maximo || 0);
      const alerta = saldo <= min ? 'border-left:3px solid #ef4444;' : (max > 0 && saldo >= max ? 'border-left:3px solid #fb923c;' : '');
      return `<tr style="${alerta}">
        <td>${escapeHtml(p.codigo || '—')}</td>
        <td>${escapeHtml(p.nome)}</td>
        <td>${escapeHtml(p.unidade_medida || '')}</td>
        <td><strong>${saldo.toFixed(3)}</strong></td>
        <td><input type="number" step="0.001" min="0" class="form-control form-control-sm" style="width:90px;" id="min-${p.id}" value="${min}"></td>
        <td><input type="number" step="0.001" min="0" class="form-control form-control-sm" style="width:90px;" id="max-${p.id}" value="${max || ''}" placeholder="—"></td>
        <td><button class="btn btn-sm btn-success" onclick="EstoqueForms._salvarMinMax(${p.id})">💾</button></td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
        Edite os valores e clique em 💾 para salvar linha a linha.
        <span class="badge badge-danger" style="margin-left:8px;">Vermelho = abaixo do mínimo</span>
        <span class="badge badge-warning" style="margin-left:4px;">Laranja = acima do máximo</span>
      </p>
      <div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>Código</th><th>Produto</th><th>Un.</th><th>Saldo Atual</th><th>Mínimo</th><th>Máximo</th><th>Salvar</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;

    EstoqueForms._salvarMinMax = async (id) => {
      const min = document.getElementById(`min-${id}`)?.value ?? 0;
      const max = document.getElementById(`max-${id}`)?.value ?? 0;
      const res = await API.patch(`/estoque/produtos/${id}/minmax`, {
        estoque_minimo: min || 0,
        estoque_maximo: max || 0,
      });
      if (res.success) showToast('Min/Max atualizado!', 'success');
      else showToast(res.message || 'Erro ao salvar.', 'danger');
    };
  },

  // ── f16: Curva ABC ────────────────────────────────────────────────────────────

  f16CurvaABC: async (user) => {
    const { el } = _estoqueModal({ title: '📊 Curva ABC de Materiais', size: 'xl', body: _spinner() });
    const r = await API.get('/estoque/curva-abc');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao calcular curva ABC.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhum dado de consumo disponível. Registre saídas de estoque para gerar a curva.'); return; }

    const totalValor = r.data.reduce((s, i) => s + Number(i.valor_consumo || 0), 0);
    const porClasse  = { A: r.data.filter(i => i.classe==='A'), B: r.data.filter(i => i.classe==='B'), C: r.data.filter(i => i.classe==='C') };
    const clsBadge   = { A: 'badge-danger', B: 'badge-warning', C: 'badge-success' };
    const clsColor   = { A: '#ef4444', B: '#fb923c', C: '#22c55e' };
    const clsDesc    = { A: '≈80% do valor', B: '≈15% do valor', C: '≈5% do valor' };

    const rows = r.data.map(item => `<tr>
      <td><span class="badge ${clsBadge[item.classe]||'badge-muted'}">${item.classe}</span></td>
      <td>${escapeHtml(item.codigo || '—')}</td>
      <td>${escapeHtml(item.nome || '—')}</td>
      <td>${Number(item.total_saida || 0).toFixed(3)} ${escapeHtml(item.unidade_medida||'')}</td>
      <td>${_fmtMoney(item.valor_consumo)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:80px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min(Number(item.pct_acumulado||0),100)}%;height:100%;background:${clsColor[item.classe]||'#7c3aed'};border-radius:3px;"></div>
          </div>
          <span style="font-size:12px;">${Number(item.pct_acumulado||0).toFixed(1)}%</span>
        </div>
      </td>
    </tr>`).join('');

    el.innerHTML = `
      <div class="row g-3 mb-3">
        ${['A','B','C'].map(c => `<div class="col-4">
          <div class="content-card" style="padding:14px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:${clsColor[c]};">Classe ${c}</div>
            <div style="font-size:16px;font-weight:600;margin:4px 0;">${porClasse[c].length} produtos</div>
            <div style="font-size:12px;color:var(--text-muted);">${clsDesc[c]}</div>
          </div>
        </div>`).join('')}
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
        Período: últimos 365 dias · Total consumido: <strong>${_fmtMoney(totalValor)}</strong>
      </div>
      <div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>Classe</th><th>Código</th><th>Produto</th><th>Qtd Consumida</th><th>Valor Consumo</th><th>% Acumulado</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
  },

  // ── f17: Gerenciar Solicitações de Uso ────────────────────────────────────────

  f17GerenciarSolicitacaoUso: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '📤 Solicitações de Uso de Materiais', size: 'xl', body: _spinner() });
    let tabAtual = 'pendente';

    const load = async (status = 'pendente') => {
      tabAtual = status;
      el.innerHTML = _spinner();
      const q = status ? `?status=${status}` : '';
      const r = await API.get(`/estoque/solicitacoes${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar solicitações.'); return; }

      const urgBadge = { urgente: 'badge-danger', alta: 'badge-warning', media: 'badge-info', baixa: 'badge-muted' };
      const tabs = ['pendente', 'aprovada', 'concluida', 'rejeitada', ''];
      const tabsHtml = `<div class="mb-3" style="display:flex;gap:6px;flex-wrap:wrap;">
        ${tabs.map(sf => `<button class="btn btn-sm ${tabAtual===sf?'btn-primary':'btn-secondary'}"
          onclick="EstoqueForms._tabSolUso('${sf}')">${sf||'Todas'}</button>`).join('')}
      </div>`;

      if (!r.data.length) {
        el.innerHTML = tabsHtml + _empty(`Nenhuma solicitação ${status ? `"${status}"` : ''} encontrada.`);
        return;
      }

      const rows = r.data.map(s => `<tr>
        <td>${escapeHtml(s.numero || String(s.id))}</td>
        <td>${escapeHtml(s.solicitante_nome || '—')}</td>
        <td>${escapeHtml((s.descricao || s.item || '—').substring(0, 50))}</td>
        <td>${escapeHtml(s.quantidade_solicitada || '—')}</td>
        <td><span class="badge ${urgBadge[s.urgencia]||'badge-muted'}">${escapeHtml(s.urgencia||'—')}</span></td>
        <td>${_badge(s.status)}</td>
        <td>${_fmtDate(s.criado_em)}</td>
        ${user.nivel_acesso >= 4 ? `<td style="white-space:nowrap;">
          ${s.status === 'pendente' ? `
            <button class="btn btn-sm btn-success" onclick="EstoqueForms._atualizarSolUso(${s.id},'aprovada')" style="margin-right:3px;" title="Aprovar">✓</button>
            <button class="btn btn-sm btn-danger" onclick="EstoqueForms._atualizarSolUso(${s.id},'rejeitada')" title="Rejeitar">✗</button>` : ''}
          ${s.status === 'aprovada' ? `<button class="btn btn-sm btn-info" onclick="EstoqueForms._atualizarSolUso(${s.id},'concluida')">✓ Liberar</button>` : ''}
          ${!['pendente','aprovada'].includes(s.status) ? `<span style="font-size:11px;color:var(--text-muted);">${escapeHtml(s.aprovado_por_nome||'—')}</span>` : ''}
        </td>` : `<td>${escapeHtml(s.aprovado_por_nome||'—')}</td>`}
      </tr>`).join('');

      el.innerHTML = tabsHtml + `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>#</th><th>Solicitante</th><th>Descrição</th><th>Qtd</th><th>Urgência</th><th>Status</th><th>Data</th><th>${user.nivel_acesso>=4?'Ação':'Aprovado por'}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    };

    EstoqueForms._tabSolUso = (s) => load(s);
    EstoqueForms._atualizarSolUso = async (id, novoStatus) => {
      const obs = novoStatus === 'rejeitada' ? (prompt('Motivo da rejeição:') || '') : '';
      const res = await API.put(`/estoque/solicitacoes/${id}`, { status: novoStatus, observacao: obs });
      if (res.success) {
        showToast(`Solicitação ${novoStatus}!`, ['aprovada','concluida'].includes(novoStatus) ? 'success' : 'warning');
        load(tabAtual);
      } else showToast(res.message || 'Erro.', 'danger');
    };

    await load();
  },

  // ── f18: Gerenciar Escalas ────────────────────────────────────────────────────

  f18GerenciarEscalas: async (user) => {
    const { el, setFooter } = _estoqueModal({ title: '📆 Gerenciar Escalas do Estoque', size: 'lg', body: _spinner() });
    const rU = await API.get('/estoque/usuarios');
    const usrOpts = (rU && rU.data ? rU.data : []).map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');

    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/estoque/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      if (!r.data.length) { el.innerHTML = _empty('Nenhuma escala cadastrada.'); return; }

      const rows = r.data.map(e => `<tr>
        <td>${escapeHtml(e.nome_exibir || e.nome_externo || '—')}</td>
        <td><span class="badge badge-info">${escapeHtml(e.turno)}</span></td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${e.data_fim ? _fmtDate(e.data_fim) : '—'}</td>
        <td>${escapeHtml(e.observacao || '—')}</td>
        <td><button class="btn btn-sm btn-danger" onclick="EstoqueForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');

      el.innerHTML = `<div style="overflow-x:auto;"><table class="table table-sm table-hover">
        <thead><tr><th>Operador</th><th>Turno</th><th>Início</th><th>Fim</th><th>Obs.</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    };

    EstoqueForms._excluirEscala = async (id) => {
      if (!confirm('Excluir esta escala?')) return;
      const res = await API.delete(`/estoque/escalas/${id}`);
      if (res.success) { showToast('Escala excluída.', 'success'); load(); }
      else showToast(res.message || 'Erro ao excluir.', 'danger');
    };

    await load();

    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-est">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-est').onclick = () => {
      const hoje = new Date().toISOString().split('T')[0];
      el.innerHTML = `<form id="form-esc-est">
        <div class="mb-3"><label class="form-label">Operador (interno)</label>
          <select name="usuario_id" class="form-select"><option value="">— Usuário externo —</option>${usrOpts}</select>
        </div>
        <div class="mb-3"><label class="form-label">Nome Externo</label>
          <input name="nome_externo" class="form-control" placeholder="Preencha se não for usuário do sistema">
        </div>
        <div class="mb-3"><label class="form-label">Turno *</label>
          <select name="turno" class="form-select" required>
            <option value="manha">Manhã</option><option value="tarde">Tarde</option>
            <option value="noite">Noite</option><option value="integral">Integral</option>
          </select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Início *</label><input name="data_inicio" type="date" class="form-control" value="${hoje}" required></div>
          <div class="col-6"><label class="form-label">Fim</label><input name="data_fim" type="date" class="form-control"></div>
        </div>
        <div class="mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`
        <button class="btn btn-secondary" id="btn-voltar-esc">← Voltar</button>
        <button class="btn btn-success" id="btn-salvar-esc-est">Salvar Escala</button>`);
      document.getElementById('btn-voltar-esc').onclick = load;
      document.getElementById('btn-salvar-esc-est').onclick = async () => {
        const f = document.getElementById('form-esc-est');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        if (!body.usuario_id && !body.nome_externo) { showToast('Informe o operador ou nome externo.', 'warning'); return; }
        await _withSubmit(document.getElementById('btn-salvar-esc-est'), async () => {
          const res = await API.post('/estoque/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); await load(); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },
};

window.EstoqueForms = EstoqueForms;
