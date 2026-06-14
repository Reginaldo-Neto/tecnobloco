'use strict';
/**
 * Modais do setor Financeiro.
 */
const FinanceiroForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title: '📅 Escala do Financeiro', size: 'lg', body: _spinner() });
    const r = await API.get('/financeiro/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Colaborador</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02ContasPagar: async (user) => {
    const { el, setFooter } = openModal({ title: '💸 Contas a Pagar', size: 'xl', body: _spinner() });
    const r = await API.get('/financeiro/contas-pagar');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar contas.'); return; }
    const rows = r.data.map(c => `<tr>
      <td>${c.descricao}</td>
      <td>${c.fornecedor_nome || '—'}</td>
      <td>${_fmtMoney(c.valor)}</td>
      <td>${_fmtDate(c.data_vencimento)}</td>
      <td>${_badge(c.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Descrição</th><th>Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma conta a pagar.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-cp">+ Nova Conta</button>`);
      document.getElementById('btn-nova-cp').onclick = () => FinanceiroForms._formContaPagar(user, el, setFooter);
    }
  },

  _formContaPagar: (user, el, setFooter) => {
    el.innerHTML = `<form id="form-cp">
      <div class="mb-3"><label class="form-label">Descrição *</label><input name="descricao" class="form-control" required></div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">Valor *</label><input name="valor" type="number" step="0.01" class="form-control" required></div>
        <div class="col-6"><label class="form-label">Vencimento *</label><input name="data_vencimento" type="date" class="form-control" required></div>
      </div>
      <div class="mb-3 mt-2"><label class="form-label">Categoria</label>
        <select name="categoria" class="form-select">
          <option value="fornecedor">Fornecedor</option>
          <option value="imposto">Imposto</option>
          <option value="servico">Serviço</option>
          <option value="salario">Salário</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
    </form>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-success'; btn.textContent = 'Salvar';
    setFooter(btn.outerHTML);
    document.querySelector('[data-modal-footer] .btn-success, .modal-footer .btn-success').onclick = async () => {
      const f = document.getElementById('form-cp');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const fd = new FormData(f);
      const body = Object.fromEntries(fd.entries());
      _withSubmit(document.querySelector('[data-modal-footer] .btn-success, .modal-footer .btn-success'), async () => {
        const res = await API.post('/financeiro/contas-pagar', body);
        if (res.success) { showToast('Conta registrada!', 'success'); FinanceiroForms.f02ContasPagar(user); }
        else showToast(res.message || 'Erro ao salvar.', 'danger');
      });
    };
  },

  f03ContasReceber: async (user) => {
    const { el, setFooter } = openModal({ title: '💰 Contas a Receber', size: 'xl', body: _spinner() });
    const r = await API.get('/financeiro/contas-receber');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar contas.'); return; }
    const rows = r.data.map(c => `<tr>
      <td>${c.descricao}</td>
      <td>${c.cliente_nome || '—'}</td>
      <td>${_fmtMoney(c.valor)}</td>
      <td>${_fmtDate(c.data_vencimento)}</td>
      <td>${_badge(c.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Descrição</th><th>Cliente</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma conta a receber.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-cr">+ Nova Conta</button>`);
      document.getElementById('btn-nova-cr').onclick = () => {
        el.innerHTML = `<form id="form-cr">
          <div class="mb-3"><label class="form-label">Descrição *</label><input name="descricao" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Valor *</label><input name="valor" type="number" step="0.01" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Vencimento *</label><input name="data_vencimento" type="date" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Categoria</label>
            <select name="categoria" class="form-select">
              <option value="venda">Venda</option><option value="servico">Serviço</option><option value="outros">Outros</option>
            </select>
          </div>
          <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-cr">Salvar</button>`);
        document.getElementById('btn-salvar-cr').onclick = async () => {
          const f = document.getElementById('form-cr');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-cr'), async () => {
            const res = await API.post('/financeiro/contas-receber', body);
            if (res.success) { showToast('Conta registrada!', 'success'); FinanceiroForms.f03ContasReceber(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f04FluxoCaixa: async (user) => {
    const { el } = openModal({ title: '📊 Fluxo de Caixa', size: 'xl', body: _spinner() });
    const r = await API.get('/financeiro/fluxo-caixa');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados.'); return; }
    const { entradas = [], saidas = [], saldo = 0 } = r.data;
    const totalE = entradas.reduce((s, x) => s + Number(x.valor || 0), 0);
    const totalS = saidas.reduce((s, x) => s + Number(x.valor || 0), 0);
    el.innerHTML = `
      <div class="row g-3 mb-3">
        <div class="col-4"><div class="card text-center p-3 bg-success text-white"><h5>${_fmtMoney(totalE)}</h5><small>Entradas</small></div></div>
        <div class="col-4"><div class="card text-center p-3 bg-danger text-white"><h5>${_fmtMoney(totalS)}</h5><small>Saídas</small></div></div>
        <div class="col-4"><div class="card text-center p-3 ${saldo >= 0 ? 'bg-primary' : 'bg-warning'} text-white"><h5>${_fmtMoney(saldo)}</h5><small>Saldo</small></div></div>
      </div>
      <h6>Entradas</h6>
      ${entradas.length ? `<table class="table table-sm"><thead><tr><th>Descrição</th><th>Valor</th><th>Data</th></tr></thead><tbody>
        ${entradas.map(e => `<tr><td>${e.descricao}</td><td>${_fmtMoney(e.valor)}</td><td>${_fmtDate(e.data_vencimento)}</td></tr>`).join('')}
      </tbody></table>` : '<p class="text-muted">Nenhuma entrada.</p>'}
      <h6>Saídas</h6>
      ${saidas.length ? `<table class="table table-sm"><thead><tr><th>Descrição</th><th>Valor</th><th>Data</th></tr></thead><tbody>
        ${saidas.map(s => `<tr><td>${s.descricao}</td><td>${_fmtMoney(s.valor)}</td><td>${_fmtDate(s.data_vencimento)}</td></tr>`).join('')}
      </tbody></table>` : '<p class="text-muted">Nenhuma saída.</p>'}`;
  },

  f05PlanoConta: async (user) => {
    const { el, setFooter } = openModal({ title: '📋 Plano de Contas', size: 'lg', body: _spinner() });
    const r = await API.get('/financeiro/plano-contas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar plano de contas.'); return; }
    const rows = r.data.map(c => `<tr>
      <td>${c.codigo}</td><td>${c.nome}</td><td>${c.tipo}</td><td>${c.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Código</th><th>Nome</th><th>Tipo</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma conta cadastrada.');
    if (user.nivel_acesso >= 5) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-pc">+ Nova Conta</button>`);
      document.getElementById('btn-nova-pc').onclick = () => {
        el.innerHTML = `<form id="form-pc">
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Código *</label><input name="codigo" class="form-control" required></div>
            <div class="col-8"><label class="form-label">Nome *</label><input name="nome" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Tipo *</label>
            <select name="tipo" class="form-select" required>
              <option value="receita">Receita</option><option value="despesa">Despesa</option><option value="ativo">Ativo</option><option value="passivo">Passivo</option>
            </select>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-pc">Salvar</button>`);
        document.getElementById('btn-salvar-pc').onclick = async () => {
          const f = document.getElementById('form-pc');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-pc'), async () => {
            const res = await API.post('/financeiro/plano-contas', body);
            if (res.success) { showToast('Conta criada!', 'success'); FinanceiroForms.f05PlanoConta(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f06Fornecedores: async (user) => {
    const { el, setFooter } = openModal({ title: '🏭 Fornecedores', size: 'xl', body: _spinner() });
    const r = await API.get('/financeiro/fornecedores');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar fornecedores.'); return; }
    const rows = r.data.map(f => `<tr>
      <td>${f.razao_social}</td><td>${f.cnpj_cpf || '—'}</td><td>${f.telefone || '—'}</td><td>${f.email || '—'}</td>
      <td>${f.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Razão Social</th><th>CNPJ/CPF</th><th>Telefone</th><th>E-mail</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum fornecedor cadastrado.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-forn">+ Novo Fornecedor</button>`);
      document.getElementById('btn-novo-forn').onclick = () => {
        el.innerHTML = `<form id="form-forn">
          <div class="mb-3"><label class="form-label">Razão Social *</label><input name="razao_social" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">CNPJ/CPF</label><input name="cnpj_cpf" class="form-control"></div>
            <div class="col-6"><label class="form-label">Telefone</label><input name="telefone" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">E-mail</label><input name="email" type="email" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Endereço</label><input name="endereco" class="form-control"></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-forn">Salvar</button>`);
        document.getElementById('btn-salvar-forn').onclick = async () => {
          const f = document.getElementById('form-forn');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-forn'), async () => {
            const res = await API.post('/financeiro/fornecedores', body);
            if (res.success) { showToast('Fornecedor criado!', 'success'); FinanceiroForms.f06Fornecedores(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f07MovimentosBancarios: async (user) => {
    const { el, setFooter } = openModal({ title: '🏦 Movimentos Bancários', size: 'xl', body: _spinner() });
    const r = await API.get('/financeiro/movimentos');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar movimentos.'); return; }
    const rows = r.data.map(m => `<tr>
      <td>${_fmtDate(m.data_movimento)}</td>
      <td>${m.tipo === 'credito' ? '<span class="badge bg-success">Crédito</span>' : '<span class="badge bg-danger">Débito</span>'}</td>
      <td>${m.descricao}</td>
      <td>${_fmtMoney(m.valor)}</td>
      <td>${m.conciliado ? '<span class="badge bg-success">Sim</span>' : '<span class="badge bg-warning">Não</span>'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Conciliado</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum movimento registrado.');
    if (user.nivel_acesso >= 5) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-mov">+ Novo Lançamento</button>`);
      document.getElementById('btn-novo-mov').onclick = () => {
        el.innerHTML = `<form id="form-mov">
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required><option value="credito">Crédito</option><option value="debito">Débito</option></select>
            </div>
            <div class="col-6"><label class="form-label">Data *</label><input name="data_movimento" type="date" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Descrição *</label><input name="descricao" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Valor *</label><input name="valor" type="number" step="0.01" class="form-control" required></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-mov">Salvar</button>`);
        document.getElementById('btn-salvar-mov').onclick = async () => {
          const f = document.getElementById('form-mov');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-mov'), async () => {
            const res = await API.post('/financeiro/movimentos', body);
            if (res.success) { showToast('Lançamento registrado!', 'success'); FinanceiroForms.f07MovimentosBancarios(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f08CentrosCusto: async (user) => {
    const { el, setFooter } = openModal({ title: '🏷️ Centros de Custo', size: 'lg', body: _spinner() });
    const r = await API.get('/financeiro/centros-custo');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar centros de custo.'); return; }
    const rows = r.data.map(c => `<tr>
      <td>${c.codigo}</td><td>${c.nome}</td><td>${c.departamento || '—'}</td>
      <td>${c.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Código</th><th>Nome</th><th>Departamento</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum centro de custo cadastrado.');
    if (user.nivel_acesso >= 5) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-cc">+ Novo Centro</button>`);
      document.getElementById('btn-novo-cc').onclick = () => {
        el.innerHTML = `<form id="form-cc">
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Código *</label><input name="codigo" class="form-control" required></div>
            <div class="col-8"><label class="form-label">Nome *</label><input name="nome" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Departamento</label><input name="departamento" class="form-control"></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-cc">Salvar</button>`);
        document.getElementById('btn-salvar-cc').onclick = async () => {
          const f = document.getElementById('form-cc');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-cc'), async () => {
            const res = await API.post('/financeiro/centros-custo', body);
            if (res.success) { showToast('Centro de custo criado!', 'success'); FinanceiroForms.f08CentrosCusto(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f09Adiantamentos: async (user) => {
    const { el } = openModal({ title: '💵 Adiantamentos Financeiros', size: 'lg', body: _spinner() });
    const r = await API.get('/financeiro/adiantamentos');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar adiantamentos.'); return; }
    const rows = r.data.map(a => `<tr>
      <td>${a.colaborador_nome || '—'}</td>
      <td>${_fmtMoney(a.valor)}</td>
      <td>${_fmtDate(a.data_solicitacao)}</td>
      <td>${_badge(a.status)}</td>
      ${user.nivel_acesso >= 5 && a.status === 'pendente' ? `<td><button class="btn btn-success btn-sm" onclick="FinanceiroForms._aprovarAdiantamento(${a.id}, 'aprovado', '${user.id}')">Aprovar</button> <button class="btn btn-danger btn-sm" onclick="FinanceiroForms._aprovarAdiantamento(${a.id}, 'reprovado', '${user.id}')">Reprovar</button></td>` : `<td>—</td>`}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Colaborador</th><th>Valor</th><th>Solicitado em</th><th>Status</th><th>Ação</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum adiantamento pendente.');
  },

  _aprovarAdiantamento: async (id, status, userId) => {
    const res = await API.put(`/rh/adiantamentos/${id}`, { status, aprovado_por: userId });
    if (res.success) showToast(`Adiantamento ${status}!`, status === 'aprovado' ? 'success' : 'warning');
    else showToast(res.message || 'Erro ao atualizar.', 'danger');
  },

  f10GerenciarEscalas: async (user) => {
    const { el, setFooter } = openModal({ title: '📅 Gerenciar Escalas do Financeiro', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/financeiro/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="FinanceiroForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Colaborador</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/financeiro/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-fin">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-fin').onclick = () => {
      el.innerHTML = `<form id="form-esc-fin">
        <div class="mb-3"><label class="form-label">Colaborador</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
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
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-fin">Salvar</button>`);
      document.getElementById('btn-salvar-esc-fin').onclick = async () => {
        const f = document.getElementById('form-esc-fin');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-fin'), async () => {
          const res = await API.post('/financeiro/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); FinanceiroForms.f10GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/financeiro/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },
};

window.FinanceiroForms = FinanceiroForms;
