'use strict';
/**
 * Modais do módulo de Administração Master.
 */
const AdminForms = {

  f01GerenciarUsuarios: async (user) => {
    const { el, setFooter } = openModal({ title: '👤 Gerenciar Usuários', size: 'xl', body: _spinner() });
    const load = async (busca = '') => {
      const q = busca ? `?busca=${encodeURIComponent(busca)}` : '';
      const r = await API.get(`/admin/usuarios${q}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar usuários.'); return; }
      const rows = r.data.map(u => `<tr>
        <td>${escapeHtml(u.nome || '—')}</td>
        <td>${escapeHtml(u.email || '—')}</td>
        <td>${escapeHtml(u.departamento_nome || '—')}</td>
        <td>${escapeHtml(u.cargo_nome || '—')}</td>
        <td>${['Menor Aprendiz','Estagiário','Auxiliar','Operador','Supervisor','Gerente','Diretor','Admin'][u.nivel_acesso] || u.nivel_acesso}</td>
        <td>${u.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="AdminForms._editarUsuario(${u.id})">Editar</button>
        </td>
      </tr>`).join('');
      el.innerHTML = `<div class="input-group mb-3">
        <input id="busca-usuario" class="form-control" placeholder="Buscar por nome ou e-mail..." value="${escapeHtml(busca)}">
        <button class="btn btn-outline-secondary" id="btn-buscar-usr">Buscar</button>
      </div>` + (rows ? `<table class="table table-sm table-hover"><thead><tr><th>Nome</th><th>E-mail</th><th>Depto</th><th>Cargo</th><th>Nível</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum usuário encontrado.'));
      document.getElementById('btn-buscar-usr').onclick = () => load(document.getElementById('busca-usuario').value);
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-usuario">+ Novo Usuário</button>`);
    document.getElementById('btn-novo-usuario').onclick = async () => {
      const [rD, rC] = await Promise.all([API.get('/admin/departamentos'), API.get('/admin/cargos')]);
      const dOpts = (rD.data || []).map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
      const cOpts = (rC.data || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
      el.innerHTML = `<form id="form-usuario">
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Nome Completo *</label><input name="nome" class="form-control" required></div>
          <div class="col-6"><label class="form-label">CPF</label><input name="cpf" id="novo-usr-cpf" class="form-control" placeholder="000.000.000-00" maxlength="14" inputmode="numeric"></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">E-mail *</label><input name="email" type="email" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Senha Inicial *</label><input name="senha" type="password" class="form-control" required minlength="6"></div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Departamento</label><select name="departamento_id" class="form-select"><option value="">Selecione...</option>${dOpts}</select></div>
          <div class="col-6"><label class="form-label">Cargo <small style="color:var(--text-muted);font-weight:400;">(título do emprego)</small></label><select name="cargo_id" class="form-select"><option value="">Selecione...</option>${cOpts}</select></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Nível de Acesso *</label>
          <select name="nivel_acesso" class="form-select" required>
            <option value="0">0 — Menor Aprendiz</option>
            <option value="1">1 — Estagiário</option>
            <option value="2">2 — Auxiliar</option>
            <option value="3">3 — Operador</option>
            <option value="4">4 — Supervisor</option>
            <option value="5">5 — Gerente</option>
            <option value="6">6 — Diretor</option>
            <option value="7">7 — Admin</option>
          </select>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-usuario">Criar Usuário</button>`);
      // CPF mask
      const cpfEl = document.getElementById('novo-usr-cpf');
      if (cpfEl) cpfEl.addEventListener('input', function() {
        const d = this.value.replace(/\D/g,'').slice(0,11);
        let m = d;
        if (d.length > 9)      m = d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
        else if (d.length > 6) m = d.replace(/(\d{3})(\d{3})(\d{1,3})/,'$1.$2.$3');
        else if (d.length > 3) m = d.replace(/(\d{3})(\d{1,3})/,'$1.$2');
        if (this.value !== m) this.value = m;
      });
      document.getElementById('btn-salvar-usuario').onclick = async () => {
        const f = document.getElementById('form-usuario');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-usuario'), async () => {
          const res = await API.post('/admin/usuarios', body);
          if (res.success) { showToast('Usuário criado!', 'success'); AdminForms.f01GerenciarUsuarios(user); }
          else showToast(res.message || 'Erro ao criar.', 'danger');
        });
      };
    };
  },

  _editarUsuario: async (id) => {
    const r = await API.get(`/admin/usuarios/${id}`);
    if (!r || !r.success) { showToast('Erro ao carregar usuário.', 'danger'); return; }
    const u = r.data;
    const [rD, rC] = await Promise.all([API.get('/admin/departamentos'), API.get('/admin/cargos')]);
    const dOpts = (rD.data || []).map(d => `<option value="${d.id}" ${d.id == u.departamento_id ? 'selected' : ''}>${d.nome}</option>`).join('');
    const cOpts = (rC.data || []).map(c => `<option value="${c.id}" ${c.id == u.cargo_id ? 'selected' : ''}>${c.nome}</option>`).join('');
    const { el, setFooter } = openModal({ title: `Editar: ${u.nome}`, size: 'lg', body: `<form id="form-edit-usr">
      <div class="mb-3"><label class="form-label">Nome *</label><input name="nome" class="form-control" value="${u.nome}" required></div>
      <div class="mb-3"><label class="form-label">E-mail *</label><input name="email" type="email" class="form-control" value="${u.email}" required></div>
      <div class="mb-3"><label class="form-label">Nova Senha (deixe em branco para manter)</label><input name="senha" type="password" class="form-control" minlength="6"></div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">Departamento</label><select name="departamento_id" class="form-select"><option value="">Selecione...</option>${dOpts}</select></div>
        <div class="col-6"><label class="form-label">Cargo</label><select name="cargo_id" class="form-select"><option value="">Selecione...</option>${cOpts}</select></div>
      </div>
      <div class="row g-2 mt-1">
        <div class="col-6"><label class="form-label">Nível</label>
          <select name="nivel_acesso" class="form-select">
            ${[0,1,2,3,4,5,6,7].map(n => `<option value="${n}" ${u.nivel_acesso == n ? 'selected' : ''}>${n} — ${['Menor Aprendiz','Estagiário','Auxiliar','Operador','Supervisor','Gerente','Diretor','Admin'][n]}</option>`).join('')}
          </select>
        </div>
        <div class="col-6"><label class="form-label">Status</label>
          <select name="ativo" class="form-select">
            <option value="1" ${u.ativo ? 'selected' : ''}>Ativo</option>
            <option value="0" ${!u.ativo ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>
    </form>` });
    setFooter(`<button class="btn btn-success" id="btn-atualizar-usr">Salvar Alterações</button>`);
    document.getElementById('btn-atualizar-usr').onclick = async () => {
      const f = document.getElementById('form-edit-usr');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const body = Object.fromEntries(new FormData(f).entries());
      if (!body.senha) delete body.senha;
      await _withSubmit(document.getElementById('btn-atualizar-usr'), async () => {
        const res = await API.put(`/admin/usuarios/${id}`, body);
        if (res.success) showToast('Usuário atualizado!', 'success');
        else showToast(res.message || 'Erro ao atualizar.', 'danger');
      });
    };
  },

  f02GerenciarDepartamentos: async (user) => {
    const { el, setFooter } = openModal({ title: '🏢 Departamentos', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/admin/departamentos');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar departamentos.'); return; }
      const rows = r.data.map(d => `<tr>
        <td>${d.nome}</td>
        <td>${d.descricao || '—'}</td>
        <td>${d.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Nome</th><th>Descrição</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum departamento cadastrado.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-depto">+ Novo Departamento</button>`);
    document.getElementById('btn-novo-depto').onclick = () => {
      el.innerHTML = `<form id="form-depto">
        <div class="mb-3"><label class="form-label">Nome *</label><input name="nome" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Descrição</label><textarea name="descricao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-depto">Salvar</button>`);
      document.getElementById('btn-salvar-depto').onclick = async () => {
        const f = document.getElementById('form-depto');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-depto'), async () => {
          const res = await API.post('/admin/departamentos', body);
          if (res.success) { showToast('Departamento criado!', 'success'); AdminForms.f02GerenciarDepartamentos(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f03GerenciarCargos: async (user) => {
    const { el, setFooter } = openModal({ title: '🎯 Cargos e Níveis de Acesso', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/admin/cargos');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar cargos.'); return; }
      const rows = r.data.map(c => `<tr>
        <td>${c.nome}</td>
        <td>${c.nivel_acesso != null ? c.nivel_acesso : '—'}</td>
        <td>${c.departamento_nome || '—'}</td>
        <td>${c.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Cargo</th><th>Nível Padrão</th><th>Departamento</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum cargo cadastrado.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-cargo">+ Novo Cargo</button>`);
    document.getElementById('btn-novo-cargo').onclick = async () => {
      const rD = await API.get('/admin/departamentos');
      const dOpts = (rD.data || []).map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
      el.innerHTML = `<form id="form-cargo">
        <div class="mb-3"><label class="form-label">Nome do Cargo *</label><input name="nome" class="form-control" required></div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Departamento</label><select name="departamento_id" class="form-select"><option value="">Selecione...</option>${dOpts}</select></div>
          <div class="col-6"><label class="form-label">Nível de Acesso Padrão</label>
            <select name="nivel_acesso" class="form-select">
              ${[0,1,2,3,4,5,6].map(n => `<option value="${n}">${n} — ${['Menor Aprendiz','Estagiário','Auxiliar','Operador','Supervisor','Gerente','Diretor'][n]}</option>`).join('')}
            </select>
          </div>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-cargo">Salvar</button>`);
      document.getElementById('btn-salvar-cargo').onclick = async () => {
        const f = document.getElementById('form-cargo');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-cargo'), async () => {
          const res = await API.post('/admin/cargos', body);
          if (res.success) { showToast('Cargo criado!', 'success'); AdminForms.f03GerenciarCargos(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f04LogAuditoria: async (user) => {
    const { el } = openModal({ title: '📋 Log de Auditoria', size: 'xl', body: `
      <div class="row g-2 mb-3">
        <div class="col-3"><input id="filt-usuario" class="form-control form-control-sm" placeholder="Usuário..."></div>
        <div class="col-3"><select id="filt-tipo" class="form-select form-select-sm">
          <option value="">Todos os tipos</option>
          <option value="CRIACAO">Criação</option>
          <option value="ALTERACAO">Alteração</option>
          <option value="EXCLUSAO">Exclusão</option>
          <option value="LOGIN">Login</option>
        </select></div>
        <div class="col-3"><input id="filt-data-ini" type="date" class="form-control form-control-sm" placeholder="De..."></div>
        <div class="col-3"><button class="btn btn-primary btn-sm w-100" id="btn-filtrar-audit">Filtrar</button></div>
      </div>
      <div id="audit-resultado">${_spinner()}</div>
    ` });
    const carregar = async () => {
      const params = new URLSearchParams();
      const u = document.getElementById('filt-usuario')?.value; if (u) params.set('usuario', u);
      const t = document.getElementById('filt-tipo')?.value; if (t) params.set('tipo_evento', t);
      const d = document.getElementById('filt-data-ini')?.value; if (d) params.set('data_inicio', d);
      params.set('limit', '50');
      const res = document.getElementById('audit-resultado');
      if (res) res.innerHTML = _spinner();
      const r = await API.get(`/admin/auditoria?${params}`);
      if (!r.success || !res) return;
      const rows = r.data.map(log => `<tr>
        <td>${_fmtDate(log.criado_em)}</td>
        <td>${log.usuario_nome || '—'}</td>
        <td><span class="badge bg-${log.tipo_evento === 'CRIACAO' ? 'success' : log.tipo_evento === 'EXCLUSAO' ? 'danger' : 'warning'}">${log.tipo_evento}</span></td>
        <td>${log.tabela_afetada || '—'}</td>
        <td>${log.registro_id || '—'}</td>
      </tr>`).join('');
      res.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Data</th><th>Usuário</th><th>Tipo</th><th>Tabela</th><th>ID</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum log encontrado.');
    };
    await carregar();
    document.getElementById('btn-filtrar-audit')?.addEventListener('click', carregar);
  },

  f05BugReports: async (user) => {
    const { el } = openModal({ title: '🐛 Bug Reports', size: 'xl', body: _spinner() });
    const r = await API.get('/admin/bugs?limit=30');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar bug reports.'); return; }
    const rows = r.data.map(b => `<tr>
      <td>${b.id}</td>
      <td>${escapeHtml(b.titulo?.substring(0, 50) || '—')}</td>
      <td>${escapeHtml(b.reporter_nome || '—')}</td>
      <td>${b.severidade ? `<span class="badge bg-${b.severidade === 'critico' ? 'danger' : b.severidade === 'alto' ? 'warning' : 'info'}">${b.severidade}</span>` : '—'}</td>
      <td>${_badge(b.status)}</td>
      <td>${_fmtDate(b.criado_em)}</td>
      ${user.nivel_acesso >= 6 ? `<td>
        <select class="form-select form-select-sm" style="width:auto" onchange="AdminForms._atualizarBug(${b.id}, this.value)">
          <option value="aberto" ${b.status==='aberto'?'selected':''}>Aberto</option>
          <option value="em_analise" ${b.status==='em_analise'?'selected':''}>Em Análise</option>
          <option value="resolvido" ${b.status==='resolvido'?'selected':''}>Resolvido</option>
          <option value="fechado" ${b.status==='fechado'?'selected':''}>Fechado</option>
        </select>
      </td>` : '<td>—</td>'}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>#</th><th>Título</th><th>Reporter</th><th>Severidade</th><th>Status</th><th>Data</th><th>Ação</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum bug report.');
  },

  _atualizarBug: async (id, status) => {
    const res = await API.put(`/admin/bugs/${id}`, { status });
    if (res.success) showToast('Bug atualizado!', 'success');
    else showToast(res.message || 'Erro ao atualizar.', 'danger');
  },
};

window.AdminForms = AdminForms;
