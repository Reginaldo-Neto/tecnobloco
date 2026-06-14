'use strict';
/**
 * Modais do setor de Vendas.
 */
const VendasForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title: '📅 Escala de Vendas', size: 'lg', body: _spinner() });
    const r = await API.get('/vendas/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Vendedor</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02PedidosVenda: async (user) => {
    const { el, setFooter } = openModal({ title: '🛍️ Pedidos de Venda', size: 'xl', body: _spinner() });
    const r = await API.get('/vendas/pedidos?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos.'); return; }
    const rows = r.data.map(p => `<tr>
      <td>${p.codigo || p.id}</td>
      <td>${p.cliente_nome || '—'}</td>
      <td>${p.vendedor_nome || '—'}</td>
      <td>${_fmtMoney(p.valor_total)}</td>
      <td>${_badge(p.status)}</td>
      <td>${_fmtDate(p.criado_em)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Código</th><th>Cliente</th><th>Vendedor</th><th>Total</th><th>Status</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum pedido de venda.');
    if (user.nivel_acesso >= 3) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-pv">+ Novo Pedido</button>`);
      document.getElementById('btn-novo-pv').onclick = async () => {
        const rCli = await API.get('/vendas/clientes?limit=200');
        const cliOpts = (rCli.data || []).map(c => `<option value="${c.id}">${c.razao_social || c.nome_fantasia}</option>`).join('');
        el.innerHTML = `<form id="form-pv">
          <div class="mb-3"><label class="form-label">Cliente *</label>
            <select name="cliente_id" class="form-select" required><option value="">Selecione...</option>${cliOpts}</select>
          </div>
          <div class="mb-3"><label class="form-label">Itens do Pedido *</label>
            <textarea name="descricao_itens" class="form-control" rows="4" required placeholder="Produto, quantidade, valor unitário..."></textarea>
          </div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Valor Total *</label><input name="valor_total" type="number" step="0.01" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Data de Entrega Prevista</label><input name="data_entrega_prevista" type="date" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-pv">Criar Pedido</button>`);
        document.getElementById('btn-salvar-pv').onclick = async () => {
          const f = document.getElementById('form-pv');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-pv'), async () => {
            const res = await API.post('/vendas/pedidos', body);
            if (res.success) { showToast('Pedido criado!', 'success'); VendasForms.f02PedidosVenda(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f03Clientes: async (user) => {
    const { el, setFooter } = openModal({ title: '👥 Clientes', size: 'xl', body: _spinner() });
    const load = async (busca = '') => {
      const q = busca ? `?busca=${encodeURIComponent(busca)}` : '';
      const r = await API.get(`/vendas/clientes${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar clientes.'); return; }
      const rows = r.data.map(c => `<tr>
        <td>${c.razao_social || c.nome_fantasia}</td>
        <td>${c.cpf_cnpj || '—'}</td>
        <td>${c.tipo || '—'}</td>
        <td>${c.telefone || '—'}</td>
        <td>${c.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
      </tr>`).join('');
      el.innerHTML = `<div class="input-group mb-3">
        <input id="busca-cliente" class="form-control" placeholder="Buscar por nome, CPF/CNPJ..." value="${busca}">
        <button class="btn btn-outline-secondary" id="btn-buscar-cliente">Buscar</button>
      </div>` + (rows ? `<table class="table table-sm table-hover"><thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Tipo</th><th>Telefone</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum cliente encontrado.'));
      document.getElementById('btn-buscar-cliente').onclick = () => load(document.getElementById('busca-cliente').value);
    };
    await load();
    if (user.nivel_acesso >= 3) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-cliente">+ Novo Cliente</button>`);
      document.getElementById('btn-novo-cliente').onclick = () => {
        el.innerHTML = `<form id="form-cliente">
          <div class="mb-3"><label class="form-label">Razão Social / Nome *</label><input name="razao_social" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">CPF/CNPJ</label><input name="cpf_cnpj" class="form-control"></div>
            <div class="col-6"><label class="form-label">Tipo</label>
              <select name="tipo" class="form-select"><option value="PF">Pessoa Física</option><option value="PJ">Pessoa Jurídica</option></select>
            </div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">Telefone</label><input name="telefone" class="form-control"></div>
            <div class="col-6"><label class="form-label">E-mail</label><input name="email" type="email" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Endereço</label><input name="endereco" class="form-control"></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-cliente">Salvar</button>`);
        document.getElementById('btn-salvar-cliente').onclick = async () => {
          const f = document.getElementById('form-cliente');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-cliente'), async () => {
            const res = await API.post('/vendas/clientes', body);
            if (res.success) { showToast('Cliente criado!', 'success'); VendasForms.f03Clientes(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f04ExpedicaoPedidos: async (user) => {
    const { el } = openModal({ title: '🚚 Expedição de Pedidos', size: 'xl', body: _spinner() });
    const r = await API.get('/vendas/pedidos?status=em_separacao&limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos.'); return; }
    const rows = r.data.map(p => `<tr>
      <td>${p.codigo || p.id}</td>
      <td>${p.cliente_nome || '—'}</td>
      <td>${_fmtMoney(p.valor_total)}</td>
      <td>${_badge(p.status)}</td>
      ${user.nivel_acesso >= 3 ? `<td><button class="btn btn-primary btn-sm" onclick="VendasForms._atualizarStatus(${p.id},'expedido')">Marcar Expedido</button></td>` : '<td>—</td>'}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Código</th><th>Cliente</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum pedido pronto para expedição.');
  },

  f05FaturamentoPedido: async (user) => {
    const { el } = openModal({ title: '💰 Faturamento de Pedidos', size: 'xl', body: _spinner() });
    const r = await API.get('/vendas/pedidos?status=expedido&limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedidos.'); return; }
    const totalFat = r.data.reduce((s, p) => s + Number(p.valor_total || 0), 0);
    const rows = r.data.map(p => `<tr>
      <td>${p.codigo || p.id}</td>
      <td>${p.cliente_nome || '—'}</td>
      <td>${_fmtMoney(p.valor_total)}</td>
      <td>${_fmtDate(p.criado_em)}</td>
      ${user.nivel_acesso >= 4 ? `<td><button class="btn btn-success btn-sm" onclick="VendasForms._atualizarStatus(${p.id},'faturado')">Faturar</button></td>` : '<td>—</td>'}
    </tr>`).join('');
    el.innerHTML = `<div class="alert alert-info mb-3">Total a faturar: <strong>${_fmtMoney(totalFat)}</strong></div>` +
      (rows ? `<table class="table table-sm"><thead><tr><th>Código</th><th>Cliente</th><th>Total</th><th>Data</th><th>Ação</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum pedido para faturar.'));
  },

  _atualizarStatus: async (id, status) => {
    const res = await API.put(`/vendas/pedidos/${id}/status`, { status });
    if (res.success) showToast(`Pedido ${status}!`, 'success');
    else showToast(res.message || 'Erro ao atualizar.', 'danger');
  },

  f06GerenciarEscalas: async (user) => {
    const { el, setFooter } = openModal({ title: '📅 Gerenciar Escalas de Vendas', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/vendas/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="VendasForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Vendedor</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/vendas/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-vnd">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-vnd').onclick = () => {
      el.innerHTML = `<form id="form-esc-vnd">
        <div class="mb-3"><label class="form-label">Vendedor</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
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
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-vnd">Salvar</button>`);
      document.getElementById('btn-salvar-esc-vnd').onclick = async () => {
        const f = document.getElementById('form-esc-vnd');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-vnd'), async () => {
          const res = await API.post('/vendas/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); VendasForms.f06GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/vendas/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },
};

window.VendasForms = VendasForms;
