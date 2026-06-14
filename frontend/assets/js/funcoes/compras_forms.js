'use strict';
/**
 * Modais do setor de Compras.
 */
const ComprasForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title: '📅 Escala de Compras', size: 'lg', body: _spinner() });
    const r = await API.get('/compras/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Comprador</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02PedidosCompra: async (user) => {
    const { el, setFooter } = openModal({ title: '🛒 Pedidos de Compra', size: 'xl', body: _spinner() });
    const r = await API.get('/compras/pedidos?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos.'); return; }
    const rows = r.data.map(p => `<tr>
      <td>${p.numero || p.id}</td>
      <td>${p.fornecedor_nome || '—'}</td>
      <td>${_fmtMoney(p.valor_total)}</td>
      <td>${_fmtDate(p.data_pedido)}</td>
      <td>${_badge(p.status)}</td>
      ${user.nivel_acesso >= 4 && p.status === 'pendente' ? `<td>
        <button class="btn btn-success btn-sm" onclick="ComprasForms._atualizarPedido(${p.id},'aprovado')">Aprovar</button>
        <button class="btn btn-danger btn-sm ms-1" onclick="ComprasForms._atualizarPedido(${p.id},'cancelado')">Cancelar</button>
      </td>` : '<td>—</td>'}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>#</th><th>Fornecedor</th><th>Valor</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum pedido de compra.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-pc">+ Novo Pedido</button>`);
      document.getElementById('btn-novo-pc').onclick = () => {
        el.innerHTML = `<form id="form-pc-compra">
          <div class="mb-3"><label class="form-label">Fornecedor *</label><input name="fornecedor_nome" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Valor Total *</label><input name="valor_total" type="number" step="0.01" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Data de Entrega Prevista</label><input name="data_entrega_prevista" type="date" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Itens do Pedido</label><textarea name="descricao_itens" class="form-control" rows="4" placeholder="Descreva os itens a serem comprados..."></textarea></div>
          <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-pc-compra">Salvar</button>`);
        document.getElementById('btn-salvar-pc-compra').onclick = async () => {
          const f = document.getElementById('form-pc-compra');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-pc-compra'), async () => {
            const res = await API.post('/compras/pedidos', body);
            if (res.success) { showToast('Pedido criado!', 'success'); ComprasForms.f02PedidosCompra(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  _atualizarPedido: async (id, status) => {
    const res = await API.put(`/compras/pedidos/${id}`, { status });
    if (res.success) showToast(`Pedido ${status}!`, status === 'aprovado' ? 'success' : 'warning');
    else showToast(res.message || 'Erro ao atualizar.', 'danger');
  },

  f03Fornecedores: async (user) => {
    const { el, setFooter } = openModal({ title: '🏭 Fornecedores', size: 'xl', body: _spinner() });
    const r = await API.get('/compras/fornecedores');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar fornecedores.'); return; }
    const rows = r.data.map(f => `<tr>
      <td>${f.razao_social}</td>
      <td>${f.cnpj_cpf || '—'}</td>
      <td>${f.telefone || '—'}</td>
      <td>${f.email || '—'}</td>
      <td>${f.avaliacao ? `${f.avaliacao}/5 ⭐` : '—'}</td>
      <td>${f.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Razão Social</th><th>CNPJ/CPF</th><th>Telefone</th><th>E-mail</th><th>Avaliação</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum fornecedor cadastrado.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-forn-compras">+ Novo Fornecedor</button>`);
      document.getElementById('btn-novo-forn-compras').onclick = () => {
        el.innerHTML = `<form id="form-forn-compras">
          <div class="mb-3"><label class="form-label">Razão Social *</label><input name="razao_social" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">CNPJ/CPF</label><input name="cnpj_cpf" class="form-control"></div>
            <div class="col-6"><label class="form-label">Telefone</label><input name="telefone" class="form-control"></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">E-mail</label><input name="email" type="email" class="form-control"></div>
            <div class="col-6"><label class="form-label">Categoria</label><input name="categoria" class="form-control" placeholder="Ex: Embalagens, Químicos..."></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Endereço</label><input name="endereco" class="form-control"></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-forn-compras">Salvar</button>`);
        document.getElementById('btn-salvar-forn-compras').onclick = async () => {
          const f = document.getElementById('form-forn-compras');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-forn-compras'), async () => {
            const res = await API.post('/compras/fornecedores', body);
            if (res.success) { showToast('Fornecedor criado!', 'success'); ComprasForms.f03Fornecedores(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f04Cotacoes: async (user) => {
    const { el, setFooter } = openModal({ title: '💱 Cotações', size: 'xl', body: _spinner() });
    // Cotações ficam aninhadas a pedidos — listar pedidos aprovados/pendentes com cotações
    const r = await API.get('/compras/pedidos?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos.'); return; }
    const rows = r.data.map(p => `<tr>
      <td>${p.numero || p.id}</td>
      <td>${p.fornecedor_nome || '—'}</td>
      <td>${_fmtMoney(p.valor_total)}</td>
      <td>${_badge(p.status)}</td>
      <td>${_fmtDate(p.data_pedido || p.criado_em)}</td>
      <td><button class="btn btn-outline-primary btn-sm" onclick="ComprasForms._verCotacoesPedido(${p.id}, '${(p.numero || p.id)}')">Ver Cotações</button></td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>#</th><th>Fornecedor</th><th>Valor</th><th>Status</th><th>Data</th><th>Cotações</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum pedido de compra.');
  },

  _verCotacoesPedido: async (pedidoId, numero) => {
    const { el, setFooter } = openModal({ title: `Cotações do Pedido ${numero}`, size: 'lg', body: _spinner() });
    const r = await API.get(`/compras/pedidos/${pedidoId}/cotacoes`);
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar cotações.'); return; }
    const rows = r.data.map(c => `<tr>
      <td>${c.fornecedor_nome || '—'}</td>
      <td>${_fmtMoney(c.valor_unitario)}</td>
      <td>${_fmtMoney(c.valor_total)}</td>
      <td>${c.prazo_entrega || '—'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Fornecedor</th><th>Vlr Unit.</th><th>Vlr Total</th><th>Prazo</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma cotação para este pedido.');
    setFooter(`<button class="btn btn-primary" id="btn-add-cot">+ Adicionar Cotação</button>`);
    document.getElementById('btn-add-cot').onclick = () => {
      el.innerHTML = `<form id="form-cot">
        <div class="mb-3"><label class="form-label">Fornecedor *</label><input name="fornecedor_nome" class="form-control" required></div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Valor Unitário *</label><input name="valor_unitario" type="number" step="0.01" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Prazo de Entrega</label><input name="prazo_entrega" class="form-control" placeholder="Ex: 5 dias úteis"></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-cot">Salvar Cotação</button>`);
      document.getElementById('btn-salvar-cot').onclick = async () => {
        const f = document.getElementById('form-cot');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-cot'), async () => {
          const res = await API.post(`/compras/pedidos/${pedidoId}/cotacoes`, body);
          if (res.success) { showToast('Cotação adicionada!', 'success'); ComprasForms._verCotacoesPedido(pedidoId, numero); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f05SolicitacoesInternas: async (user) => {
    const { el } = openModal({ title: '📝 Solicitações Internas', size: 'xl', body: _spinner() });
    const r = await API.get('/compras/solicitacoes?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar solicitações.'); return; }
    const rows = r.data.map(s => `<tr>
      <td>${s.numero || s.id}</td>
      <td>${s.solicitante_nome || '—'}</td>
      <td>${s.departamento_origem || '—'}</td>
      <td>${s.descricao?.substring(0, 40) || '—'}</td>
      <td>${_badge(s.status)}</td>
      <td>${_fmtDate(s.criado_em)}</td>
      ${user.nivel_acesso >= 3 && s.status === 'pendente' ? `<td>
        <button class="btn btn-success btn-sm" onclick="ComprasForms._aprovarSolicitacao(${s.id})">Aprovar</button>
      </td>` : '<td>—</td>'}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>#</th><th>Solicitante</th><th>Departamento</th><th>Descrição</th><th>Status</th><th>Data</th><th>Ação</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma solicitação pendente.');
  },

  _aprovarSolicitacao: async (id) => {
    const res = await API.post(`/compras/solicitacoes/${id}/gerar`, {});
    if (res.success) showToast('Pedido de compra gerado!', 'success');
    else showToast(res.message || 'Erro ao gerar pedido.', 'danger');
  },

  f06ReceberMercadoria: async (user) => {
    const { el, setFooter } = openModal({ title: '📦 Receber Mercadoria', size: 'lg', body: _spinner() });
    const r = await API.get('/compras/pedidos?status=aprovado&limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos aprovados.'); return; }
    const opts = r.data.map(p => `<option value="${p.id}">PC-${p.numero || p.id} — ${p.fornecedor_nome}</option>`).join('');
    el.innerHTML = `<p class="text-muted mb-3">Selecione o pedido de compra para registrar o recebimento.</p>`;
    setFooter(`<button class="btn btn-primary" id="btn-registrar-recebimento">Registrar Recebimento</button>`);
    document.getElementById('btn-registrar-recebimento').onclick = () => {
      el.innerHTML = `<form id="form-recebimento">
        <div class="mb-3"><label class="form-label">Pedido de Compra *</label>
          <select name="pedido_id" class="form-select" required>
            <option value="">Selecione...</option>${opts}
          </select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Número NF</label><input name="numero_nf" class="form-control"></div>
          <div class="col-6"><label class="form-label">Data de Recebimento *</label><input name="data_recebimento" type="date" class="form-control" required></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Itens Recebidos Conforme?</label>
          <select name="conforme" class="form-select">
            <option value="1">Sim, conforme o pedido</option>
            <option value="0">Não, há divergências</option>
          </select>
        </div>
        <div class="mb-3"><label class="form-label">Observação / Divergências</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-recebimento">Confirmar Recebimento</button>`);
      document.getElementById('btn-salvar-recebimento').onclick = async () => {
        const f = document.getElementById('form-recebimento');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-recebimento'), async () => {
          const { pedido_id, ...dados } = body;
          const res = await API.post(`/compras/pedidos/${pedido_id}/receber`, dados);
          if (res.success) { showToast('Recebimento registrado!', 'success'); ComprasForms.f06ReceberMercadoria(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f07GerenciarEscalas: async (user) => {
    const { el, setFooter } = openModal({ title: '📅 Gerenciar Escalas de Compras', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/compras/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="ComprasForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Comprador</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/compras/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-comp">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-comp').onclick = () => {
      el.innerHTML = `<form id="form-esc-comp">
        <div class="mb-3"><label class="form-label">Comprador</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
        <div class="mb-3"><label class="form-label">Nome (externo)</label><input name="nome_externo" class="form-control"></div>
        <div class="mb-3"><label class="form-label">Turno *</label>
          <select name="turno" class="form-select" required>
            <option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option><option value="integral">Integral</option>
          </select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Início *</label><input name="data_inicio" type="date" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Fim *</label><input name="data_fim" type="date" class="form-control" required></div>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-comp">Salvar</button>`);
      document.getElementById('btn-salvar-esc-comp').onclick = async () => {
        const f = document.getElementById('form-esc-comp');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-comp'), async () => {
          const res = await API.post('/compras/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); ComprasForms.f07GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/compras/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },
};

window.ComprasForms = ComprasForms;
