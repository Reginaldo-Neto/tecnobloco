'use strict';
/**
 * RhForms — Renderers de modal para as funções de RH.
 */

const RhForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title:'📅 Escala de RH', size:'lg', body: _spinner() });
    try {
      const d = await API.get('/rh/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('.modal-body').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.nome_exibir||'—')}</td><td>${escapeHtml(r.turno||'—')}</td><td>${_fmtDate(r.data_inicio)}</td><td>${_fmtDate(r.data_fim)||'—'}</td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    } catch(e) { el.querySelector('.modal-body').innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(e.message)}</span></div>`; }
  },

  f02GerenciarColaboradores: async (user) => {
    const { el } = openModal({ title:'👥 Colaboradores', size:'xl',
      body: `<div style="display:flex;gap:8px;margin-bottom:12px;"><input class="form-control" id="rh-col-search" placeholder="Buscar por nome..." style="flex:1;"><button class="btn btn-sm btn-secondary" id="rh-col-buscar">🔍</button></div><div id="rh-col-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button><button class="btn btn-primary" id="rh-col-novo">+ Novo Colaborador</button>`,
    });
    async function load() {
      el.querySelector('#rh-col-list').innerHTML = _spinner();
      const q = el.querySelector('#rh-col-search').value;
      const d = await API.get('/rh/colaboradores' + (q ? `?search=${encodeURIComponent(q)}` : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rh-col-list').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr><th>Nome</th><th>CPF</th><th>Departamento</th><th>Cargo</th><th>Admissão</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.nome_completo||'—')}</td><td>${escapeHtml(r.cpf||'—')}</td><td>${escapeHtml(r.departamento_nome||'—')}</td><td>${escapeHtml(r.cargo_nome||'—')}</td><td>${_fmtDate(r.data_admissao)}</td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    }
    load();
    el.querySelector('#rh-col-buscar').addEventListener('click', load);
    el.querySelector('#rh-col-novo').addEventListener('click', async () => {
      const depts = await _loadOpts('/rh/departamentos');
      const cargos = await _loadOpts('/rh/cargos');
      const { el: f, close } = openModal({ title:'+ Novo Colaborador', size:'md',
        body: `<div class="form-group"><label>Nome Completo *</label><input class="form-control" id="rh-nc-nome"></div>
               <div class="form-group"><label>CPF *</label><input class="form-control" id="rh-nc-cpf" placeholder="000.000.000-00"></div>
               <div class="form-group"><label>Data Admissão *</label><input class="form-control" type="date" id="rh-nc-admissao"></div>
               <div class="form-group"><label>Departamento</label><select class="form-control" id="rh-nc-dept"><option value="">—</option>${_optsHtml(depts,'id','nome')}</select></div>
               <div class="form-group"><label>Cargo</label><select class="form-control" id="rh-nc-cargo"><option value="">—</option>${_optsHtml(cargos,'id','nome')}</select></div>
               <div class="form-group"><label>Salário</label><input class="form-control" type="number" step="0.01" id="rh-nc-salario"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button><button class="btn btn-primary" id="rh-nc-save">Salvar</button>`,
      });
      f.querySelector('#rh-nc-save').addEventListener('click', () => _withSubmit(f.querySelector('#rh-nc-save'), async () => {
        await API.post('/rh/colaboradores', { nome_completo: f.querySelector('#rh-nc-nome').value, cpf: f.querySelector('#rh-nc-cpf').value, data_admissao: f.querySelector('#rh-nc-admissao').value, departamento_id: f.querySelector('#rh-nc-dept').value||null, cargo_id: f.querySelector('#rh-nc-cargo').value||null, salario: f.querySelector('#rh-nc-salario').value||null });
        close(); load();
      }));
    });
  },

  f03RegistroPonto: async (user) => {
    const { el } = openModal({ title:'⏱️ Registro de Ponto', size:'lg',
      body: `<div id="rh-ponto-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button><button class="btn btn-primary" id="rh-ponto-reg">+ Registrar Ponto</button>`,
    });
    async function load() {
      el.querySelector('#rh-ponto-list').innerHTML = _spinner();
      const d = await API.get('/rh/ponto');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rh-ponto-list').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>Tipo</th><th>Data/Hora</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.colaborador_nome||'—')}</td><td><span class="badge badge-info">${escapeHtml(r.tipo||'—')}</span></td><td>${_fmtDate(r.data_hora)}</td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    }
    load();
    el.querySelector('#rh-ponto-reg').addEventListener('click', async () => {
      const cols = await _loadOpts('/rh/colaboradores');
      const { el: f, close } = openModal({ title:'Registrar Ponto', size:'sm',
        body: `<div class="form-group"><label>Colaborador *</label><select class="form-control" id="rp-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="form-group"><label>Tipo *</label><select class="form-control" id="rp-tipo"><option value="entrada">Entrada</option><option value="saida_almoco">Saída Almoço</option><option value="retorno_almoco">Retorno Almoço</option><option value="saida">Saída</option></select></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button><button class="btn btn-primary" id="rp-save">Registrar</button>`,
      });
      f.querySelector('#rp-save').addEventListener('click', () => _withSubmit(f.querySelector('#rp-save'), async () => {
        await API.post('/rh/ponto', { colaborador_id: f.querySelector('#rp-col').value, tipo: f.querySelector('#rp-tipo').value });
        close(); load();
      }));
    });
  },

  f04GerenciarFerias: async (user) => {
    const { el } = openModal({ title:'🏖️ Férias', size:'xl',
      body: `<div id="rh-fer-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button><button class="btn btn-primary" id="rh-fer-nova">+ Agendar Férias</button>`,
    });
    async function load() {
      const d = await API.get('/rh/ferias');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rh-fer-list').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>Início</th><th>Fim</th><th>Status</th><th>Aprovado Por</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.colaborador_nome||'—')}</td><td>${_fmtDate(r.data_inicio)}</td><td>${_fmtDate(r.data_fim)}</td><td>${_badge(r.status)}</td><td>${escapeHtml(r.aprovado_por_nome||'—')}</td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    }
    load();
    el.querySelector('#rh-fer-nova').addEventListener('click', async () => {
      const cols = await _loadOpts('/rh/colaboradores');
      const { el: f, close } = openModal({ title:'Agendar Férias', size:'sm',
        body: `<div class="form-group"><label>Colaborador *</label><select class="form-control" id="rf-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="form-group"><label>Início *</label><input class="form-control" type="date" id="rf-ini"></div>
               <div class="form-group"><label>Fim *</label><input class="form-control" type="date" id="rf-fim"></div>
               <div class="form-group"><label>Dias Aprovados</label><input class="form-control" type="number" id="rf-dias" value="30"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button><button class="btn btn-primary" id="rf-save">Salvar</button>`,
      });
      f.querySelector('#rf-save').addEventListener('click', () => _withSubmit(f.querySelector('#rf-save'), async () => {
        await API.post('/rh/ferias', { colaborador_id: f.querySelector('#rf-col').value, data_inicio: f.querySelector('#rf-ini').value, data_fim: f.querySelector('#rf-fim').value, dias_aprovados: f.querySelector('#rf-dias').value });
        close(); load();
      }));
    });
  },

  f05ControleEPI: async (user) => {
    const { el } = openModal({ title:'🦺 Controle de EPI', size:'xl',
      body: `<div id="rh-epi-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button><button class="btn btn-primary" id="rh-epi-entregar">+ Registrar Entrega</button>`,
    });
    async function load() {
      const d = await API.get('/rh/epis/entregas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rh-epi-list').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>EPI</th><th>Quantidade</th><th>Data Entrega</th><th>Entregue Por</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.colaborador_nome||'—')}</td><td>${escapeHtml(r.epi_nome||'—')}</td><td>${r.quantidade||'—'}</td><td>${_fmtDate(r.data_entrega)}</td><td>${escapeHtml(r.entregue_por_nome||'—')}</td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    }
    load();
    el.querySelector('#rh-epi-entregar').addEventListener('click', async () => {
      const epis = await _loadOpts('/rh/epis');
      const cols = await _loadOpts('/rh/colaboradores');
      const { el: f, close } = openModal({ title:'Registrar Entrega de EPI', size:'sm',
        body: `<div class="form-group"><label>Colaborador *</label><select class="form-control" id="re-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="form-group"><label>EPI *</label><select class="form-control" id="re-epi"><option value="">—</option>${_optsHtml(epis,'id','nome')}</select></div>
               <div class="form-group"><label>Quantidade</label><input class="form-control" type="number" id="re-qtd" value="1"></div>
               <div class="form-group"><label>Data Entrega</label><input class="form-control" type="date" id="re-data"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button><button class="btn btn-primary" id="re-save">Registrar</button>`,
      });
      f.querySelector('#re-save').addEventListener('click', () => _withSubmit(f.querySelector('#re-save'), async () => {
        await API.post('/rh/epis/entregas', { colaborador_id: f.querySelector('#re-col').value, epi_id: f.querySelector('#re-epi').value, quantidade: f.querySelector('#re-qtd').value, data_entrega: f.querySelector('#re-data').value });
        close(); load();
      }));
    });
  },

  f06Treinamentos: async (user) => {
    const { el } = openModal({ title:'📚 Treinamentos', size:'xl',
      body: `<div id="rh-tr-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button><button class="btn btn-primary" id="rh-tr-novo">+ Novo Treinamento</button>`,
    });
    async function load() {
      const d = await API.get('/rh/treinamentos');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rh-tr-list').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Nome</th><th>Carga Horária</th><th>Modalidade</th><th>Obrigatório</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.nome||'—')}</td><td>${r.carga_horaria||'—'}h</td><td>${escapeHtml(r.modalidade||'—')}</td><td>${r.obrigatorio?'✅':'—'}</td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    }
    load();
    el.querySelector('#rh-tr-novo').addEventListener('click', () => {
      const { el: f, close } = openModal({ title:'+ Novo Treinamento', size:'sm',
        body: `<div class="form-group"><label>Nome *</label><input class="form-control" id="rt-nome"></div>
               <div class="form-group"><label>Carga Horária (h)</label><input class="form-control" type="number" id="rt-ch" value="8"></div>
               <div class="form-group"><label>Modalidade</label><select class="form-control" id="rt-mod"><option value="presencial">Presencial</option><option value="ead">EAD</option><option value="hibrido">Híbrido</option></select></div>
               <div class="form-group"><label>Validade (meses)</label><input class="form-control" type="number" id="rt-val"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button><button class="btn btn-primary" id="rt-save">Salvar</button>`,
      });
      f.querySelector('#rt-save').addEventListener('click', () => _withSubmit(f.querySelector('#rt-save'), async () => {
        await API.post('/rh/treinamentos', { nome: f.querySelector('#rt-nome').value, carga_horaria: f.querySelector('#rt-ch').value, modalidade: f.querySelector('#rt-mod').value, validade_meses: f.querySelector('#rt-val').value||null });
        close(); load();
      }));
    });
  },

  f07Holerites: async (user) => {
    const { el } = openModal({ title:'💵 Holerites', size:'xl',
      body: `<div id="rh-hol-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
    });
    const d = await API.get('/rh/holerites');
    const rows = Array.isArray(d) ? d : (d.data || []);
    el.querySelector('#rh-hol-list').innerHTML = rows.length
      ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>Mês</th><th>Ano</th><th>Bruto</th><th>Líquido</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.usuario_nome||'—')}</td><td>${r.mes||'—'}</td><td>${r.ano||'—'}</td><td>${_fmtMoney(r.salario_bruto)}</td><td>${_fmtMoney(r.salario_liquido)}</td></tr>`).join('')}</tbody></table></div>`
      : _empty();
  },

  f08Adiantamentos: async (user) => {
    const { el } = openModal({ title:'💰 Adiantamentos', size:'xl',
      body: `<div id="rh-adi-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
    });
    const d = await API.get('/rh/adiantamentos');
    const rows = Array.isArray(d) ? d : (d.data || []);
    el.querySelector('#rh-adi-list').innerHTML = rows.length
      ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>Valor</th><th>Status</th><th>Aprovado Por</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.usuario_nome||'—')}</td><td>${_fmtMoney(r.valor)}</td><td>${_badge(r.status)}</td><td>${escapeHtml(r.aprovado_por_nome||'—')}</td></tr>`).join('')}</tbody></table></div>`
      : _empty();
  },

  f09ListaRamais: async (user) => {
    const { el } = openModal({ title:'📞 Lista de Ramais', size:'lg',
      body: _spinner(),
    });
    const d = await API.get('/rh/ramais');
    const rows = Array.isArray(d) ? d : (d.data || []);
    el.querySelector('.modal-body').innerHTML = rows.length
      ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Nome</th><th>Departamento</th><th>Ramal</th><th>Celular</th><th>Cargo</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.nome||'—')}</td><td>${escapeHtml(r.dept_nome||'—')}</td><td>${escapeHtml(r.ramal||'—')}</td><td>${escapeHtml(r.celular||'—')}</td><td>${escapeHtml(r.cargo||'—')}</td></tr>`).join('')}</tbody></table></div>`
      : _empty();
  },

  f10DenunciasEtica: async (user) => {
    const { el } = openModal({ title:'🔒 Denúncias de Ética', size:'xl',
      body: _spinner(),
    });
    const d = await API.get('/rh/denuncias');
    const rows = Array.isArray(d) ? d : (d.data || []);
    el.querySelector('.modal-body').innerHTML = rows.length
      ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Protocolo</th><th>Categoria</th><th>Status</th><th>Data</th></tr></thead><tbody>${rows.map(r=>`<tr><td><code>${escapeHtml(r.protocolo||'—')}</code></td><td>${escapeHtml(r.categoria||'—')}</td><td>${_badge(r.status)}</td><td>${_fmtDate(r.criado_em)}</td></tr>`).join('')}</tbody></table></div>`
      : _empty();
  },

  f11DocumentosPessoais: async (user) => {
    const { el } = openModal({ title:'📄 Documentos Pessoais', size:'xl',
      body: _spinner(),
    });
    const d = await API.get('/rh/documentos?validado=0');
    const rows = Array.isArray(d) ? d : (d.data || []);
    el.querySelector('.modal-body').innerHTML = rows.length
      ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>Tipo</th><th>Validado</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.usuario_nome||'—')}</td><td>${escapeHtml(r.tipo||'—')}</td><td>${r.validado?'✅':'⏳'}</td></tr>`).join('')}</tbody></table></div>`
      : _empty();
  },

  f12GerenciarEscalas: async (user) => {
    const { el } = openModal({ title:'📆 Gerenciar Escalas de RH', size:'lg',
      body: `<div id="rh-esc-list">${_spinner()}</div>`,
      footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button><button class="btn btn-primary" id="rh-esc-nova">+ Nova Escala</button>`,
    });
    async function load() {
      const d = await API.get('/rh/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rh-esc-list').innerHTML = rows.length
        ? `<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Colaborador</th><th>Turno</th><th>Início</th><th>Fim</th><th>Ação</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.nome_exibir||'—')}</td><td>${escapeHtml(r.turno||'—')}</td><td>${_fmtDate(r.data_inicio)}</td><td>${_fmtDate(r.data_fim)||'—'}</td><td><button class="btn btn-xs btn-danger" data-id="${r.id}">🗑</button></td></tr>`).join('')}</tbody></table></div>`
        : _empty();
    }
    load();
    el.querySelector('#rh-esc-list').addEventListener('click', async e => {
      const btn = e.target.closest('[data-id]'); if (!btn) return;
      if (!confirm('Excluir esta escala?')) return;
      await API.delete('/rh/escalas/' + btn.dataset.id); load();
    });
    el.querySelector('#rh-esc-nova').addEventListener('click', async () => {
      const users = await _loadOpts('/rh/usuarios');
      const { el: f, close } = openModal({ title:'+ Nova Escala', size:'sm',
        body: `<div class="form-group"><label>Usuário</label><select class="form-control" id="re-usr"><option value="">— Externo —</option>${_optsHtml(users,'id','nome')}</select></div>
               <div class="form-group"><label>Nome Externo</label><input class="form-control" id="re-ext" placeholder="(se não é usuário do sistema)"></div>
               <div class="form-group"><label>Turno *</label><select class="form-control" id="re-turno"><option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option><option value="integral">Integral</option></select></div>
               <div class="form-group"><label>Data Início *</label><input class="form-control" type="date" id="re-ini"></div>
               <div class="form-group"><label>Data Fim</label><input class="form-control" type="date" id="re-fim"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Cancelar</button><button class="btn btn-primary" id="re-save">Salvar</button>`,
      });
      f.querySelector('#re-save').addEventListener('click', () => _withSubmit(f.querySelector('#re-save'), async () => {
        await API.post('/rh/escalas', { usuario_id: f.querySelector('#re-usr').value||null, nome_externo: f.querySelector('#re-ext').value||null, turno: f.querySelector('#re-turno').value, data_inicio: f.querySelector('#re-ini').value, data_fim: f.querySelector('#re-fim').value||null });
        close(); load();
      }));
    });
  },

  // ── f13: Ficha Completa do Colaborador ────────────────────────────────────────
  f13FichaColaborador: async (user) => {
    // Primeiro pede qual colaborador
    const cols = await _loadOpts('/rh/colaboradores');
    const { el, setFooter, close: closeOuter } = openModal({ title:'📋 Ficha Completa', size:'md',
      body: `<div class="form-group"><label>Selecione o Colaborador *</label><select class="form-control" id="rh-fc-sel"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>`,
    });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="rh-fc-abrir">Abrir Ficha</button>`);
    el.querySelector('#rh-fc-abrir').addEventListener('click', async () => {
      const cid = el.querySelector('#rh-fc-sel').value;
      if (!cid) { showToast('Selecione um colaborador', 'warning'); return; }
      closeOuter();
      const { el: fe, setFooter: sf } = openModal({ title:'📋 Ficha do Colaborador', size:'xl', body: _spinner() });
      sf(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>`);
      try {
        const r = await API.get('/rh/colaboradores/' + cid + '/ficha');
        const d = r.data || r;
        const _row = (l, v) => v ? `<tr><th style="width:40%;font-size:12px;color:var(--text-muted)">${l}</th><td>${escapeHtml(String(v))}</td></tr>` : '';
        const _sec = (t) => `<tr><td colspan="2" style="background:rgba(124,58,237,.15);font-weight:700;padding:6px 12px;font-size:12px;letter-spacing:.5px;text-transform:uppercase;">${t}</td></tr>`;
        fe.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <table class="table table-sm">
              ${_sec('Dados Pessoais')}
              ${_row('Nome',d.nome_completo)}${_row('Nome Social',d.nome_social)}${_row('CPF',d.cpf)}${_row('RG',d.rg)}
              ${_row('Nascimento',d.data_nascimento?new Date(d.data_nascimento).toLocaleDateString('pt-BR'):'')}
              ${_row('Gênero',d.genero)}${_row('Estado Civil',d.estado_civil)}${_row('Raça/Cor',d.raca_cor)}
              ${_row('Mãe',d.nome_mae)}${_row('Pai',d.nome_pai)}${_row('Nacionalidade',d.nacionalidade)}
              ${_row('Naturalidade',d.naturalidade_cidade?(d.naturalidade_cidade+' – '+d.naturalidade_uf):'')}
              ${_sec('Contato')}
              ${_row('Telefone',d.telefone)}${_row('Telefone 2',d.telefone2)}${_row('E-mail pessoal',d.email_pessoal)}
              ${_row('E-mail corporativo',d.email_corporativo)}${_row('Ramal',d.ramal)}
              ${_sec('Endereço')}
              ${_row('Logradouro',d.logradouro?(d.logradouro+', '+d.numero+(d.complemento?' '+d.complemento:'')):'')}
              ${_row('Bairro',d.bairro)}${_row('Cidade/UF',d.cidade?(d.cidade+'/'+d.uf):'')}${_row('CEP',d.cep)}
            </table>
          </div>
          <div>
            <table class="table table-sm">
              ${_sec('Contrato')}
              ${_row('Departamento',d.departamento_nome)}${_row('Cargo',d.cargo_nome)}
              ${_row('Admissão',d.data_admissao?new Date(d.data_admissao).toLocaleDateString('pt-BR'):'')}
              ${_row('Tipo',d.tipo_contrato)}${_row('Turno',d.turno)}${_row('Matrícula',d.matricula)}
              ${_row('Salário','R$ '+Number(d.salario||0).toFixed(2))}
              ${_sec('Documentos')}
              ${_row('PIS/PASEP',d.pis_pasep)}${_row('CTPS',d.ctps_numero?(d.ctps_numero+'/'+d.ctps_serie+'-'+d.ctps_uf):'')}
              ${_row('Título Eleitor',d.titulo_eleitor)}${_row('Reservista',d.reservista)}
              ${_row('Passaporte',d.passaporte)}
              ${_sec('Banco')}
              ${_row('Banco',d.banco)}${_row('Agência/Conta',d.banco_agencia?(d.banco_agencia+' / '+d.banco_conta+' ('+d.banco_tipo_conta+')'):'')}
              ${_row('PIX',d.banco_pix)}
              ${_sec('Saúde')}
              ${_row('Tipo Sanguíneo',d.tipo_sanguineo)}${_row('Convênio',d.convenio_saude)}
              ${d.deficiencia?`<tr><td colspan="2"><span class="badge badge-warning">PCD: ${escapeHtml(d.deficiencia_tipo||'Sim')}</span></td></tr>`:''}
            </table>
          </div>
        </div>
        ${d.saude&&d.saude.length?`<h5 style="margin:12px 0 6px;font-size:13px">Saúde/Alergias</h5><table class="table table-sm"><thead><tr><th>Tipo</th><th>Descrição</th><th>Gravidade</th></tr></thead><tbody>${d.saude.map(s=>`<tr><td>${escapeHtml(s.tipo)}</td><td>${escapeHtml(s.descricao)}</td><td>${escapeHtml(s.gravidade||'—')}</td></tr>`).join('')}</tbody></table>`:''}
        ${d.dependentes&&d.dependentes.length?`<h5 style="margin:12px 0 6px;font-size:13px">Dependentes</h5><table class="table table-sm"><thead><tr><th>Nome</th><th>Parentesco</th><th>IR</th><th>Plano Saúde</th></tr></thead><tbody>${d.dependentes.map(x=>`<tr><td>${escapeHtml(x.nome)}</td><td>${escapeHtml(x.grau_parentesco)}</td><td>${x.ir?'✅':'—'}</td><td>${x.plano_saude?'✅':'—'}</td></tr>`).join('')}</tbody></table>`:''}
        ${d.contatos_emergencia&&d.contatos_emergencia.length?`<h5 style="margin:12px 0 6px;font-size:13px">Contatos de Emergência</h5><table class="table table-sm"><thead><tr><th>Nome</th><th>Parentesco</th><th>Telefone</th></tr></thead><tbody>${d.contatos_emergencia.map(x=>`<tr><td>${escapeHtml(x.nome)}</td><td>${escapeHtml(x.grau_parentesco)}</td><td>${escapeHtml(x.telefone)}</td></tr>`).join('')}</tbody></table>`:''}
        ${d.beneficios&&d.beneficios.length?`<h5 style="margin:12px 0 6px;font-size:13px">Benefícios Ativos</h5><table class="table table-sm"><thead><tr><th>Tipo</th><th>Valor</th><th>Início</th></tr></thead><tbody>${d.beneficios.filter(b=>b.ativo).map(b=>`<tr><td>${escapeHtml(b.tipo.replace(/_/g,' '))}</td><td>${_fmtMoney(b.valor)}</td><td>${_fmtDate(b.data_inicio)}</td></tr>`).join('')}</tbody></table>`:''}
        ${d.historico_salarial&&d.historico_salarial.length?`<h5 style="margin:12px 0 6px;font-size:13px">Histórico Salarial</h5><table class="table table-sm"><thead><tr><th>Salário</th><th>Motivo</th><th>Vigência</th></tr></thead><tbody>${d.historico_salarial.map(h=>`<tr><td>${_fmtMoney(h.salario)}</td><td>${escapeHtml(h.motivo)}</td><td>${_fmtDate(h.data_vigencia)}</td></tr>`).join('')}</tbody></table>`:''}
        `;
      } catch(e) { fe.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span><span class="empty-state-title">${escapeHtml(e.message)}</span></div>`; }
    });
  },

  // ── f14: Afastamentos ──────────────────────────────────────────────────────────
  f14Afastamentos: async (user) => {
    const { el, setFooter } = openModal({ title:'🏥 Afastamentos', size:'xl', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>${user.nivel_acesso>=3?'<button class="btn btn-primary" id="rh-af-novo">+ Registrar Afastamento</button>':''}`);
    async function load() {
      el.innerHTML = _spinner();
      try {
        const r = await API.get('/rh/afastamentos');
        const rows = Array.isArray(r) ? r : (r.data || []);
        el.innerHTML = rows.length
          ? `<div style="overflow-x:auto"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Dias</th><th>CID</th><th>Status</th>${user.nivel_acesso>=4?'<th>Ação</th>':''}</tr></thead><tbody>
              ${rows.map(r=>`<tr>
                <td>${escapeHtml(r.colaborador_nome||'—')}</td>
                <td>${escapeHtml((r.tipo||'—').replace(/_/g,' '))}</td>
                <td>${_fmtDate(r.data_inicio)}</td><td>${_fmtDate(r.data_fim)}</td>
                <td>${r.dias||'—'}</td><td>${escapeHtml(r.cid||'—')}</td>
                <td>${_badge(r.status)}</td>
                ${user.nivel_acesso>=4?`<td style="white-space:nowrap">
                  ${r.status==='pendente'?`<button class="btn btn-xs btn-success me-1" data-act="validar" data-id="${r.id}">✅</button><button class="btn btn-xs btn-danger me-1" data-act="rejeitar" data-id="${r.id}">❌</button>`:''}
                  ${user.nivel_acesso>=5?`<button class="btn btn-xs btn-danger" data-act="excluir" data-id="${r.id}">🗑</button>`:''}
                </td>`:''}
              </tr>`).join('')}
            </tbody></table></div>`
          : _empty();
      } catch(e) { el.innerHTML = _empty(e.message); }
    }
    await load();
    el.addEventListener('click', async e => {
      const btn = e.target.closest('[data-act]'); if (!btn) return;
      const { act, id } = btn.dataset;
      if (act === 'excluir') { if (!confirm('Excluir afastamento?')) return; await API.delete('/rh/afastamentos/'+id); await load(); return; }
      const status = act === 'validar' ? 'validado' : 'rejeitado';
      await API.put('/rh/afastamentos/'+id, { status }); await load();
    });
    el.querySelector('#rh-af-novo')?.addEventListener('click', async () => {
      const cols = await _loadOpts('/rh/colaboradores');
      const { el: f, close } = openModal({ title:'+ Registrar Afastamento', size:'md',
        body: `<div class="form-group"><label>Colaborador *</label><select class="form-control" id="raf-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="form-group"><label>Tipo *</label><select class="form-control" id="raf-tipo"><option value="atestado_medico">Atestado Médico</option><option value="licenca_maternidade">Licença Maternidade</option><option value="licenca_paternidade">Licença Paternidade</option><option value="acidente_trabalho">Acidente de Trabalho</option><option value="doenca">Doença</option><option value="outros">Outros</option></select></div>
               <div class="form-group"><label>Data Início *</label><input class="form-control" type="date" id="raf-ini"></div>
               <div class="form-group"><label>Data Fim</label><input class="form-control" type="date" id="raf-fim"></div>
               <div class="form-group"><label>Dias</label><input class="form-control" type="number" id="raf-dias" min="1"></div>
               <div class="form-group"><label>CID</label><input class="form-control" id="raf-cid" placeholder="Ex: J00"></div>
               <div class="form-group"><label>Médico</label><input class="form-control" id="raf-med"></div>
               <div class="form-group"><label>Observação</label><textarea class="form-control" id="raf-obs" rows="2"></textarea></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="raf-save">Salvar</button>`,
      });
      f.querySelector('#raf-save').addEventListener('click', () => _withSubmit(f.querySelector('#raf-save'), async () => {
        await API.post('/rh/afastamentos', { colaborador_id: f.querySelector('#raf-col').value, tipo: f.querySelector('#raf-tipo').value, data_inicio: f.querySelector('#raf-ini').value, data_fim: f.querySelector('#raf-fim').value||null, dias: f.querySelector('#raf-dias').value||null, cid: f.querySelector('#raf-cid').value||null, medico: f.querySelector('#raf-med').value||null, observacao: f.querySelector('#raf-obs').value||null });
        close(); await load();
      }));
    });
  },

  // ── f15: Advertências ────────────────────────────────────────────────────────
  f15Advertencias: async (user) => {
    const { el, setFooter } = openModal({ title:'⚠️ Advertências e Ocorrências', size:'xl', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="rh-adv-nova">+ Registrar Advertência</button>`);
    async function load() {
      el.innerHTML = _spinner();
      try {
        const r = await API.get('/rh/advertencias');
        const rows = Array.isArray(r) ? r : (r.data || []);
        el.innerHTML = rows.length
          ? `<div style="overflow-x:auto"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Tipo</th><th>Motivo</th><th>Data</th><th>Ciente</th><th>Registrado Por</th>${user.nivel_acesso>=6?'<th>Ação</th>':''}</tr></thead><tbody>
              ${rows.map(r=>`<tr>
                <td>${escapeHtml(r.colaborador_nome||'—')}</td>
                <td>${_badge(r.tipo)}</td>
                <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.motivo||'—')}</td>
                <td>${_fmtDate(r.data_ocorrencia)}</td>
                <td>${r.colaborador_ciente?'✅':'⏳'}</td>
                <td>${escapeHtml(r.registrado_por_nome||'—')}</td>
                ${user.nivel_acesso>=6?`<td><button class="btn btn-xs btn-danger" data-id="${r.id}">🗑</button></td>`:''}
              </tr>`).join('')}
            </tbody></table></div>`
          : _empty();
      } catch(e) { el.innerHTML = _empty(e.message); }
    }
    await load();
    el.addEventListener('click', async e => {
      const btn = e.target.closest('[data-id]'); if (!btn) return;
      if (!confirm('Excluir esta advertência permanentemente?')) return;
      await API.delete('/rh/advertencias/'+btn.dataset.id); await load();
    });
    el.querySelector('#rh-adv-nova').addEventListener('click', async () => {
      const cols = await _loadOpts('/rh/colaboradores');
      const { el: f, close } = openModal({ title:'+ Registrar Advertência', size:'md',
        body: `<div class="form-group"><label>Colaborador *</label><select class="form-control" id="ra-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="form-group"><label>Tipo *</label><select class="form-control" id="ra-tipo"><option value="verbal">Verbal</option><option value="escrita">Escrita</option><option value="suspensao">Suspensão</option><option value="justa_causa">Justa Causa</option></select></div>
               <div class="form-group"><label>Motivo *</label><textarea class="form-control" id="ra-motivo" rows="3"></textarea></div>
               <div class="form-group"><label>Data da Ocorrência *</label><input class="form-control" type="date" id="ra-data"></div>
               <div class="form-group" id="ra-susp-wrap" style="display:none"><label>Dias de Suspensão</label><input class="form-control" type="number" id="ra-susp" min="1"></div>
               <div class="form-group"><label>Testemunha 1</label><input class="form-control" id="ra-t1"></div>
               <div class="form-group"><label>Testemunha 2</label><input class="form-control" id="ra-t2"></div>
               <div class="form-group"><label><input type="checkbox" id="ra-ciente"> Colaborador ciente</label></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="ra-save">Registrar</button>`,
      });
      f.querySelector('#ra-tipo').addEventListener('change', function() {
        f.querySelector('#ra-susp-wrap').style.display = this.value === 'suspensao' ? '' : 'none';
      });
      f.querySelector('#ra-save').addEventListener('click', () => _withSubmit(f.querySelector('#ra-save'), async () => {
        await API.post('/rh/advertencias', { colaborador_id: f.querySelector('#ra-col').value, tipo: f.querySelector('#ra-tipo').value, motivo: f.querySelector('#ra-motivo').value, data_ocorrencia: f.querySelector('#ra-data').value, dias_suspensao: f.querySelector('#ra-susp').value||null, testemunha1: f.querySelector('#ra-t1').value||null, testemunha2: f.querySelector('#ra-t2').value||null, colaborador_ciente: f.querySelector('#ra-ciente').checked });
        close(); await load();
      }));
    });
  },

  // ── f16: Movimentações de Pessoal ─────────────────────────────────────────────
  f16MovimentacoesPessoal: async (user) => {
    const { el, setFooter } = openModal({ title:'🔀 Movimentações de Pessoal', size:'xl', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="rh-mov-nova">+ Registrar Movimentação</button>`);
    async function load() {
      el.innerHTML = _spinner();
      try {
        const r = await API.get('/rh/movimentacoes');
        const rows = Array.isArray(r) ? r : (r.data || []);
        el.innerHTML = rows.length
          ? `<div style="overflow-x:auto"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Tipo</th><th>De → Para</th><th>Vigência</th><th>Aprovado Por</th></tr></thead><tbody>
              ${rows.map(r=>`<tr>
                <td>${escapeHtml(r.colaborador_nome||'—')}</td>
                <td>${_badge(r.tipo)}</td>
                <td style="font-size:12px">${r.depto_anterior_nome?escapeHtml(r.depto_anterior_nome)+' →':''}${r.depto_novo_nome?' '+escapeHtml(r.depto_novo_nome):''}${r.cargo_anterior_nome?' | '+escapeHtml(r.cargo_anterior_nome)+' →':''}${r.cargo_novo_nome?' '+escapeHtml(r.cargo_novo_nome):''}</td>
                <td>${_fmtDate(r.data_vigencia)}</td>
                <td>${escapeHtml(r.aprovado_por_nome||'—')}</td>
              </tr>`).join('')}
            </tbody></table></div>`
          : _empty();
      } catch(e) { el.innerHTML = _empty(e.message); }
    }
    await load();
    el.querySelector('#rh-mov-nova').addEventListener('click', async () => {
      const [cols, depts, cargos] = await Promise.all([_loadOpts('/rh/colaboradores'), _loadOpts('/rh/departamentos'), _loadOpts('/rh/cargos')]);
      const { el: f, close } = openModal({ title:'+ Registrar Movimentação', size:'md',
        body: `<div class="form-group"><label>Colaborador *</label><select class="form-control" id="rm-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="form-group"><label>Tipo *</label><select class="form-control" id="rm-tipo"><option value="promocao">Promoção</option><option value="transferencia">Transferência</option><option value="rebaixamento">Rebaixamento</option><option value="mudanca_turno">Mudança de Turno</option><option value="mudanca_cargo">Mudança de Cargo</option><option value="mudanca_departamento">Mudança de Departamento</option></select></div>
               <div class="form-group"><label>Descrição *</label><textarea class="form-control" id="rm-desc" rows="2"></textarea></div>
               <div class="form-group"><label>Depto Anterior</label><select class="form-control" id="rm-da"><option value="">—</option>${_optsHtml(depts,'id','nome')}</select></div>
               <div class="form-group"><label>Depto Novo</label><select class="form-control" id="rm-dn"><option value="">—</option>${_optsHtml(depts,'id','nome')}</select></div>
               <div class="form-group"><label>Cargo Anterior</label><select class="form-control" id="rm-ca"><option value="">—</option>${_optsHtml(cargos,'id','nome')}</select></div>
               <div class="form-group"><label>Cargo Novo</label><select class="form-control" id="rm-cn"><option value="">—</option>${_optsHtml(cargos,'id','nome')}</select></div>
               <div class="form-group"><label>Data Vigência *</label><input class="form-control" type="date" id="rm-vig"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="rm-save">Salvar</button>`,
      });
      f.querySelector('#rm-save').addEventListener('click', () => _withSubmit(f.querySelector('#rm-save'), async () => {
        await API.post('/rh/movimentacoes', { colaborador_id: f.querySelector('#rm-col').value, tipo: f.querySelector('#rm-tipo').value, descricao: f.querySelector('#rm-desc').value, depto_anterior: f.querySelector('#rm-da').value||null, depto_novo: f.querySelector('#rm-dn').value||null, cargo_anterior: f.querySelector('#rm-ca').value||null, cargo_novo: f.querySelector('#rm-cn').value||null, data_vigencia: f.querySelector('#rm-vig').value });
        close(); await load();
      }));
    });
  },

  // ── f17: Organograma / Headcount ──────────────────────────────────────────────
  f17Organograma: async (user) => {
    const { el, setFooter } = openModal({ title:'🏢 Organograma / Headcount', size:'lg', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>`);
    try {
      const r = await API.get('/rh/organograma');
      const rows = Array.isArray(r) ? r : (r.data || []);
      const total = rows.reduce((s,x)=>s+(Number(x.ativos)||0), 0);
      el.innerHTML = `
        <div style="margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap">
          <div style="background:rgba(124,58,237,.15);border-radius:8px;padding:12px 20px;text-align:center">
            <div style="font-size:2rem;font-weight:800;color:#a78bfa">${total}</div>
            <div style="font-size:12px;color:var(--text-muted)">Colaboradores Ativos</div>
          </div>
        </div>
        <div style="overflow-x:auto"><table class="table table-hover">
          <thead><tr><th>Departamento</th><th>Ativos</th><th>Inativos</th><th>Total</th><th>Distribuição</th></tr></thead>
          <tbody>${rows.map(r=>{
            const pct = total > 0 ? Math.round((Number(r.ativos)||0)/total*100) : 0;
            return `<tr>
              <td><strong>${escapeHtml(r.dept_nome||'—')}</strong></td>
              <td><span class="badge badge-success">${r.ativos||0}</span></td>
              <td><span class="badge badge-muted">${r.inativos||0}</span></td>
              <td>${r.total||0}</td>
              <td style="width:180px">
                <div style="background:rgba(255,255,255,.1);border-radius:4px;height:8px;overflow:hidden">
                  <div style="background:#7c3aed;height:100%;width:${pct}%;transition:width .4s"></div>
                </div>
                <small style="color:var(--text-muted)">${pct}%</small>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;
    } catch(e) { el.innerHTML = _empty(e.message); }
  },

  // ── f18: Aniversariantes do Mês ───────────────────────────────────────────────
  f18Aniversariantes: async (user) => {
    const mes = new Date().getMonth() + 1;
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const { el, setFooter } = openModal({ title:`🎂 Aniversariantes — ${meses[mes-1]}`, size:'lg', body: _spinner() });
    const mesSelect = `<select class="form-control form-control-sm" id="rh-aniv-mes" style="width:auto;display:inline-block">${meses.map((m,i)=>`<option value="${i+1}"${i+1===mes?' selected':''}>${m}</option>`).join('')}</select>`;
    setFooter(`<label style="display:flex;align-items:center;gap:8px;color:var(--text-muted);font-size:13px">Mês: ${mesSelect}</label><button class="btn btn-secondary ms-auto" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>`);
    async function load(m) {
      el.innerHTML = _spinner();
      try {
        const r = await API.get('/rh/aniversariantes?mes='+m);
        const rows = Array.isArray(r) ? r : (r.data || []);
        if (!rows.length) { el.innerHTML = _empty('Nenhum aniversariante neste mês.'); return; }
        el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
          ${rows.map(r=>`
            <div style="background:rgba(255,255,255,.04);border:1px solid var(--border-color);border-radius:8px;padding:14px;text-align:center">
              <div style="font-size:2rem;margin-bottom:6px">🎂</div>
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${escapeHtml(r.nome_completo)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(r.departamento_nome||'—')}</div>
              <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(r.cargo_nome||'—')}</div>
              <div style="margin-top:8px"><span class="badge badge-info">Dia ${r.dia}</span></div>
            </div>`).join('')}
        </div>`;
      } catch(e) { el.innerHTML = _empty(e.message); }
    }
    await load(mes);
    // footer is in setFooter — need to wire after render
    setTimeout(() => {
      const sel = document.getElementById('rh-aniv-mes');
      if (sel) sel.addEventListener('change', () => load(sel.value));
    }, 100);
  },

  // ── f19: Canal de Denúncia Anônima ────────────────────────────────────────────
  f19CanalDenuncia: async (user) => {
    const { el, setFooter } = openModal({ title:'🔒 Canal de Ética — Nova Denúncia', size:'md',
      body: `<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Sua denúncia é confidencial. Guarde o protocolo gerado para acompanhamento.</p>
             <div class="form-group"><label>Categoria *</label><select class="form-control" id="rh-den-cat"><option value="">—</option><option value="assedio_moral">Assédio Moral</option><option value="assedio_sexual">Assédio Sexual</option><option value="discriminacao">Discriminação</option><option value="fraude">Fraude / Corrupção</option><option value="seguranca">Segurança do Trabalho</option><option value="outros">Outros</option></select></div>
             <div class="form-group"><label>Departamento Envolvido</label><select class="form-control" id="rh-den-dept"><option value="">—</option></select></div>
             <div class="form-group"><label>Descrição *</label><textarea class="form-control" id="rh-den-desc" rows="5" placeholder="Descreva o ocorrido com o máximo de detalhes possível..."></textarea></div>`,
    });
    _loadOpts('/rh/departamentos').then(depts => {
      const sel = document.getElementById('rh-den-dept');
      if (sel) sel.innerHTML = `<option value="">—</option>${_optsHtml(depts,'id','nome')}`;
    });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="rh-den-env">Enviar Denúncia</button>`);
    el.querySelector('#rh-den-env').addEventListener('click', () => _withSubmit(el.querySelector('#rh-den-env'), async () => {
      const r = await API.post('/rh/denuncias', { categoria: el.querySelector('#rh-den-cat').value, descricao: el.querySelector('#rh-den-desc').value, departamento_envolvido_id: el.querySelector('#rh-den-dept').value||null });
      const proto = (r.data||r).protocolo || '—';
      el.innerHTML = `<div style="text-align:center;padding:24px">
        <div style="font-size:3rem;margin-bottom:12px">✅</div>
        <p style="font-weight:700;margin-bottom:8px">Denúncia registrada com sucesso</p>
        <p style="color:var(--text-muted);font-size:13px">Guarde o protocolo abaixo para acompanhamento:</p>
        <div style="background:rgba(124,58,237,.15);border-radius:8px;padding:12px 20px;margin:12px auto;display:inline-block;font-size:1.4rem;font-weight:800;letter-spacing:2px;color:#a78bfa">${escapeHtml(proto)}</div>
      </div>`;
      document.getElementById('rh-den-env')?.remove();
    }));
  },

  // ── f20: Solicitar Adiantamento ───────────────────────────────────────────────
  f20SolicitarAdiantamento: async (user) => {
    const { el, setFooter } = openModal({ title:'💰 Solicitar Adiantamento Salarial', size:'sm',
      body: `<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Sua solicitação será enviada para aprovação do RH.</p>
             <div class="form-group"><label>Valor *</label><input class="form-control" type="number" step="0.01" min="1" id="rh-sad-val" placeholder="0,00"></div>
             <div class="form-group"><label>Motivo</label><textarea class="form-control" id="rh-sad-mot" rows="3" placeholder="Opcional..."></textarea></div>`,
    });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="rh-sad-env">Solicitar</button>`);
    el.querySelector('#rh-sad-env').addEventListener('click', () => _withSubmit(el.querySelector('#rh-sad-env'), async () => {
      await API.post('/rh/adiantamentos', { valor: el.querySelector('#rh-sad-val').value, motivo: el.querySelector('#rh-sad-mot').value||null });
      el.innerHTML = `<div style="text-align:center;padding:24px"><div style="font-size:3rem">✅</div><p style="margin-top:12px;font-weight:700">Solicitação enviada!</p><p style="color:var(--text-muted);font-size:13px">Aguarde a aprovação do RH.</p></div>`;
      document.getElementById('rh-sad-env')?.remove();
    }));
  },

  // ── f21: CNH — Alerta de Vencimento ──────────────────────────────────────────
  f21AlertaCnh: async (user) => {
    const { el, setFooter } = openModal({ title:'🪪 CNH — Vencimentos', size:'lg', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>`);
    try {
      const [proximas, vencidas] = await Promise.all([
        API.get('/rh/cnh/proximas-vencer?dias=60'),
        API.get('/rh/cnh/vencidas'),
      ]);
      const pRows = Array.isArray(proximas) ? proximas : (proximas.data || []);
      const vRows = Array.isArray(vencidas) ? vencidas : (vencidas.data || []);
      const _tbl = (rows, danger) => rows.length
        ? `<table class="table table-sm"><thead><tr><th>Colaborador</th><th>Departamento</th><th>Categoria</th><th>Vencimento</th></tr></thead><tbody>
            ${rows.map(r=>`<tr><td>${escapeHtml(r.nome_completo||'—')}</td><td>${escapeHtml(r.departamento_nome||'—')}</td><td><strong>${escapeHtml(r.categoria||'—')}</strong></td><td><span class="badge badge-${danger?'danger':'warning'}">${_fmtDate(r.data_validade)}</span></td></tr>`).join('')}
           </tbody></table>`
        : `<p style="color:var(--text-muted);font-size:13px">Nenhum registro.</p>`;
      el.innerHTML = `
        <h5 style="color:#f87171;margin-bottom:8px">🔴 CNHs Vencidas (${vRows.length})</h5>
        ${_tbl(vRows, true)}
        <h5 style="color:#fb923c;margin:16px 0 8px">🟡 Vencem em até 60 dias (${pRows.length})</h5>
        ${_tbl(pRows, false)}`;
    } catch(e) { el.innerHTML = _empty(e.message); }
  },

  // ── f22: Gestão de EPIs — Estoque ────────────────────────────────────────────
  f22GestaoEpiEstoque: async (user) => {
    const { el, setFooter } = openModal({ title:'🦺 Gestão de EPI — Estoque', size:'lg', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>${user.nivel_acesso>=4?'<button class="btn btn-primary" id="rh-epi-cadastrar">+ Cadastrar EPI</button>':''}`);
    async function load() {
      el.innerHTML = _spinner();
      try {
        const r = await API.get('/rh/epis');
        const rows = Array.isArray(r) ? r : (r.data || []);
        el.innerHTML = rows.length
          ? `<div style="overflow-x:auto"><table class="table table-hover"><thead><tr><th>EPI</th><th>CA Nº</th><th>Estoque Atual</th><th>Estoque Mínimo</th><th>Validade (meses)</th><th>Status</th></tr></thead><tbody>
              ${rows.map(r=>`<tr>
                <td><strong>${escapeHtml(r.nome||'—')}</strong></td>
                <td>${escapeHtml(r.ca_numero||'—')}</td>
                <td><strong>${r.estoque_atual??0}</strong></td>
                <td>${r.estoque_minimo??0}</td>
                <td>${r.validade_meses||'—'}</td>
                <td>${Number(r.estoque_atual)<=Number(r.estoque_minimo)?'<span class="badge badge-danger">Abaixo do mínimo</span>':'<span class="badge badge-success">OK</span>'}</td>
              </tr>`).join('')}
            </tbody></table></div>`
          : _empty('Nenhum EPI cadastrado.');
      } catch(e) { el.innerHTML = _empty(e.message); }
    }
    await load();
    el.querySelector('#rh-epi-cadastrar')?.addEventListener('click', () => {
      const { el: f, close } = openModal({ title:'+ Cadastrar EPI', size:'sm',
        body: `<div class="form-group"><label>Nome *</label><input class="form-control" id="epi-nome"></div>
               <div class="form-group"><label>CA Nº</label><input class="form-control" id="epi-ca"></div>
               <div class="form-group"><label>Validade (meses)</label><input class="form-control" type="number" id="epi-val"></div>
               <div class="form-group"><label>Estoque Atual</label><input class="form-control" type="number" id="epi-est" value="0"></div>
               <div class="form-group"><label>Estoque Mínimo</label><input class="form-control" type="number" id="epi-min" value="5"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="epi-save">Salvar</button>`,
      });
      f.querySelector('#epi-save').addEventListener('click', () => _withSubmit(f.querySelector('#epi-save'), async () => {
        await API.post('/rh/epis', { nome: f.querySelector('#epi-nome').value, ca_numero: f.querySelector('#epi-ca').value||null, validade_meses: f.querySelector('#epi-val').value||null, estoque_atual: f.querySelector('#epi-est').value||0, estoque_minimo: f.querySelector('#epi-min').value||0 });
        close(); await load();
      }));
    });
  },

  // ── f23: Recrutamento & Seleção ───────────────────────────────────────────
  f23Recrutamento: async (user) => {
    const { el, setFooter } = openModal({ title:'🎯 Recrutamento & Seleção', size:'xl', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="rec-nova-vaga">+ Nova Vaga</button>`);

    async function renderPipeline(vaga) {
      el.innerHTML = _spinner();
      const [cands] = await Promise.all([API.get(`/rh/vagas/${vaga.id}/candidatos`)]);
      const rows = Array.isArray(cands) ? cands : (cands.data || []);
      const etapas = [
        { key:'triagem',           label:'Triagem' },
        { key:'entrevista_rh',     label:'Entrev. RH' },
        { key:'teste_tecnico',     label:'Teste Técnico' },
        { key:'entrevista_gestor', label:'Entrev. Gestor' },
        { key:'proposta',          label:'Proposta' },
        { key:'aprovado',          label:'Aprovado' },
        { key:'reprovado',         label:'Reprovado' },
      ];
      const cols = etapas.map(e => {
        const cards = rows.filter(r => r.etapa === e.key);
        return `<div class="kanban-col ${e.key}">
          <div class="kanban-col-header">${escapeHtml(e.label)}<span class="kanban-col-count">${cards.length}</span></div>
          <div class="kanban-items">${cards.length
            ? cards.map(c => `<div class="kanban-card" data-id="${c.id}">
                <div class="kanban-card-name">${escapeHtml(c.nome)}</div>
                <div class="kanban-card-meta">${escapeHtml(c.email||'—')}</div>
                <div class="kanban-card-footer">
                  ${c.nota ? `<span class="chip chip-info">★ ${c.nota}</span>` : ''}
                  ${c.data_entrevista ? `<span class="chip">${_fmtDate(c.data_entrevista)}</span>` : ''}
                </div>
              </div>`).join('')
            : `<div style="padding:8px 4px;text-align:center;color:var(--text-muted);font-size:12px;">Nenhum</div>`}
          </div>
        </div>`;
      }).join('');
      el.innerHTML = `
        <div class="d-flex align-center gap-2 mb-3">
          <button class="btn btn-sm btn-ghost" id="rec-back">← Voltar</button>
          <div>
            <div style="font-weight:600;color:var(--text-primary);">${escapeHtml(vaga.titulo)}</div>
            <div class="text-xs text-muted">${escapeHtml(vaga.departamento_nome||'')} · ${escapeHtml(vaga.tipo_contrato||'')} · ${escapeHtml(vaga.modalidade||'')}</div>
          </div>
          <button class="btn btn-sm btn-primary ml-auto" id="rec-add-cand">+ Candidato</button>
        </div>
        <div class="kanban-board">${cols}</div>`;
      el.querySelector('#rec-back').addEventListener('click', () => renderVagas());
      el.querySelector('#rec-add-cand').addEventListener('click', async () => {
        const resps = await _loadOpts('/rh/usuarios');
        const { el: f, close } = openModal({ title:'+ Novo Candidato', size:'md',
          body: `<div class="form-group"><label class="form-label required">Nome</label><input class="form-control" id="c-nome"></div>
                 <div class="row g-2 mb-3"><div class="col-6"><label class="form-label">E-mail</label><input class="form-control" id="c-email" type="email"></div><div class="col-6"><label class="form-label">Telefone</label><input class="form-control" id="c-tel"></div></div>
                 <div class="form-group"><label class="form-label">LinkedIn</label><input class="form-control" id="c-li" placeholder="https://linkedin.com/in/..."></div>
                 <div class="form-group"><label class="form-label">Responsável</label><select class="form-select" id="c-resp"><option value="">—</option>${_optsHtml(resps,'id','nome')}</select></div>
                 <div class="form-group"><label class="form-label">Observação</label><textarea class="form-control" id="c-obs" rows="2"></textarea></div>`,
          footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="c-save">Salvar</button>`,
        });
        f.querySelector('#c-save').addEventListener('click', () => _withSubmit(f.querySelector('#c-save'), async () => {
          await API.post(`/rh/vagas/${vaga.id}/candidatos`, {
            nome: f.querySelector('#c-nome').value,
            email: f.querySelector('#c-email').value||null,
            telefone: f.querySelector('#c-tel').value||null,
            linkedin: f.querySelector('#c-li').value||null,
            responsavel_id: f.querySelector('#c-resp').value||null,
            observacao: f.querySelector('#c-obs').value||null,
          });
          close(); renderPipeline(vaga);
        }));
      });
      // Click on card → edit etapa/nota
      el.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('click', async () => {
          const cid = card.dataset.id;
          const cand = rows.find(r => String(r.id) === String(cid));
          if (!cand) return;
          const etOpts = etapas.map(e => `<option value="${e.key}" ${cand.etapa===e.key?'selected':''}>${e.label}</option>`).join('');
          const { el: f2, close: c2 } = openModal({ title:`✏️ ${escapeHtml(cand.nome)}`, size:'sm',
            body: `<div class="form-group"><label class="form-label">Etapa</label><select class="form-select" id="ec-etapa">${etOpts}</select></div>
                   <div class="form-group"><label class="form-label">Nota (0-10)</label><input class="form-control" type="number" min="0" max="10" step="0.1" id="ec-nota" value="${cand.nota||''}"></div>
                   <div class="form-group"><label class="form-label">Data Entrevista</label><input class="form-control" type="datetime-local" id="ec-dt" value="${cand.data_entrevista||''}"></div>
                   <div class="form-group"><label class="form-label">Observação</label><textarea class="form-control" id="ec-obs" rows="3">${escapeHtml(cand.observacao||'')}</textarea></div>`,
            footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="ec-save">Salvar</button>`,
          });
          f2.querySelector('#ec-save').addEventListener('click', () => _withSubmit(f2.querySelector('#ec-save'), async () => {
            await API.put(`/rh/vagas/${vaga.id}/candidatos/${cid}`, {
              etapa: f2.querySelector('#ec-etapa').value,
              nota: f2.querySelector('#ec-nota').value||null,
              data_entrevista: f2.querySelector('#ec-dt').value||null,
              observacao: f2.querySelector('#ec-obs').value||null,
            });
            c2(); renderPipeline(vaga);
          }));
        });
      });
    }

    async function renderVagas() {
      el.innerHTML = _spinner();
      setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="rec-nova-vaga">+ Nova Vaga</button>`);
      const depts = await _loadOpts('/rh/departamentos');
      const cargos = await _loadOpts('/rh/cargos');
      const d = await API.get('/rh/vagas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      const statusColors = { aberta:'success', pausada:'warning', encerrada:'secondary' };
      const priColors = { normal:'secondary', alta:'warning', urgente:'danger' };
      el.innerHTML = rows.length
        ? `<div class="table-wrapper"><table class="table table-hover"><thead><tr><th>Vaga</th><th>Departamento</th><th>Tipo</th><th>Prioridade</th><th>Vagas</th><th>Limite</th><th>Status</th><th></th></tr></thead>
           <tbody>${rows.map(r => `<tr>
             <td><div style="font-weight:600">${escapeHtml(r.titulo)}</div><div class="text-xs text-muted">${escapeHtml(r.modalidade||'')}</div></td>
             <td>${escapeHtml(r.departamento_nome||'—')}</td>
             <td><span class="chip">${escapeHtml(r.tipo_contrato||'—')}</span></td>
             <td>${_badge(r.prioridade, priColors)}</td>
             <td style="text-align:center">${r.vagas_qtd||1}</td>
             <td>${_fmtDate(r.data_limite)||'—'}</td>
             <td>${_badge(r.status, statusColors)}</td>
             <td class="table-actions"><button class="btn btn-sm btn-ghost" data-vagaid="${r.id}" data-vagatitle="${escapeHtml(r.titulo)}" data-vagadata='${JSON.stringify({id:r.id,titulo:r.titulo,departamento_nome:r.departamento_nome,tipo_contrato:r.tipo_contrato,modalidade:r.modalidade})}'>Pipeline →</button></td>
           </tr>`).join('')}</tbody></table></div>`
        : _empty('🎯','Nenhuma vaga cadastrada','Clique em "+ Nova Vaga" para começar');
      el.querySelectorAll('[data-vagadata]').forEach(btn => {
        btn.addEventListener('click', () => renderPipeline(JSON.parse(btn.dataset.vagadata)));
      });
      el.querySelector('#rec-nova-vaga')?.addEventListener('click', () => {
        const { el: f, close } = openModal({ title:'+ Nova Vaga', size:'lg',
          body: `<div class="form-group"><label class="form-label required">Título da Vaga</label><input class="form-control" id="nv-titulo"></div>
                 <div class="row g-2 mb-3">
                   <div class="col-6"><label class="form-label">Departamento</label><select class="form-select" id="nv-dept"><option value="">—</option>${_optsHtml(depts,'id','nome')}</select></div>
                   <div class="col-6"><label class="form-label">Cargo</label><select class="form-select" id="nv-cargo"><option value="">—</option>${_optsHtml(cargos,'id','nome')}</select></div>
                 </div>
                 <div class="row g-2 mb-3">
                   <div class="col-4"><label class="form-label">Tipo Contrato</label><select class="form-select" id="nv-tipo"><option value="clt">CLT</option><option value="pj">PJ</option><option value="estagio">Estágio</option><option value="temporario">Temporário</option><option value="aprendiz">Aprendiz</option></select></div>
                   <div class="col-4"><label class="form-label">Modalidade</label><select class="form-select" id="nv-mod"><option value="presencial">Presencial</option><option value="hibrido">Híbrido</option><option value="remoto">Remoto</option></select></div>
                   <div class="col-4"><label class="form-label">Qtd. Vagas</label><input class="form-control" type="number" min="1" id="nv-qtd" value="1"></div>
                 </div>
                 <div class="row g-2 mb-3">
                   <div class="col-6"><label class="form-label">Salário Mínimo</label><input class="form-control" type="number" step="0.01" id="nv-smin"></div>
                   <div class="col-6"><label class="form-label">Salário Máximo</label><input class="form-control" type="number" step="0.01" id="nv-smax"></div>
                 </div>
                 <div class="row g-2 mb-3">
                   <div class="col-6"><label class="form-label">Prioridade</label><select class="form-select" id="nv-pri"><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
                   <div class="col-6"><label class="form-label">Prazo Limite</label><input class="form-control" type="date" id="nv-limite"></div>
                 </div>
                 <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-control" id="nv-desc" rows="3"></textarea></div>
                 <div class="form-group"><label class="form-label">Requisitos</label><textarea class="form-control" id="nv-req" rows="2"></textarea></div>`,
          footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="nv-save">Publicar Vaga</button>`,
        });
        f.querySelector('#nv-save').addEventListener('click', () => _withSubmit(f.querySelector('#nv-save'), async () => {
          await API.post('/rh/vagas', {
            titulo: f.querySelector('#nv-titulo').value,
            departamento_id: f.querySelector('#nv-dept').value||null,
            cargo_id: f.querySelector('#nv-cargo').value||null,
            tipo_contrato: f.querySelector('#nv-tipo').value,
            modalidade: f.querySelector('#nv-mod').value,
            vagas_qtd: f.querySelector('#nv-qtd').value||1,
            salario_min: f.querySelector('#nv-smin').value||null,
            salario_max: f.querySelector('#nv-smax').value||null,
            prioridade: f.querySelector('#nv-pri').value,
            data_limite: f.querySelector('#nv-limite').value||null,
            descricao: f.querySelector('#nv-desc').value||null,
            requisitos: f.querySelector('#nv-req').value||null,
          });
          close(); renderVagas();
        }));
      });
    }

    renderVagas();
  },

  // ── f24: Onboarding ───────────────────────────────────────────────────────
  f24Onboarding: async (user) => {
    const { el, setFooter } = openModal({ title:'🚀 Onboarding — Integração', size:'lg', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>`);

    async function renderChecklist(colab) {
      el.innerHTML = _spinner();
      setFooter(`<button class="btn btn-ghost" id="ob-back">← Voltar</button><button class="btn btn-sm btn-secondary ml-auto" id="ob-padrao">📋 Checklist Padrão</button><button class="btn btn-primary" id="ob-add">+ Adicionar Etapa</button>`);
      const d = await API.get(`/rh/onboarding/${colab.id}`);
      const rows = Array.isArray(d) ? d : (d.data || []);
      const done = rows.filter(r => r.concluido).length;
      const pct = rows.length ? Math.round((done/rows.length)*100) : 0;
      const catColors = { documentacao:'primary', sistemas:'info', equipamentos:'warning', treinamento:'success', apresentacao:'cyan', outros:'secondary' };
      el.innerHTML = `
        <div class="d-flex align-center gap-3 mb-3">
          <div class="profile-avatar sm">${escapeHtml((colab.nome_completo||'?').slice(0,2).toUpperCase())}</div>
          <div><div style="font-weight:600">${escapeHtml(colab.nome_completo)}</div><div class="text-xs text-muted">${escapeHtml(colab.cargo_nome||'')} · ${escapeHtml(colab.departamento_nome||'')}</div></div>
        </div>
        <div class="step-progress mb-4">
          <div class="step-progress-bar"><div class="step-progress-fill" style="width:${pct}%"></div></div>
          <div class="step-progress-label">${done}/${rows.length} etapas</div>
          <div class="step-progress-pct">${pct}%</div>
        </div>
        ${rows.length ? `<div class="checklist">${rows.map(r => `
          <div class="checklist-item clickable ${r.concluido?'done':''}" data-id="${r.id}">
            <div class="checklist-check">${r.concluido?'✓':''}</div>
            <div class="checklist-label">
              ${escapeHtml(r.etapa)}
              ${r.descricao?`<div class="text-xs text-muted">${escapeHtml(r.descricao)}</div>`:''}
            </div>
            <span class="chip chip-${catColors[r.categoria]||'secondary'}">${escapeHtml(r.categoria||'outros')}</span>
            <span class="checklist-meta">${_fmtDate(r.data_limite)||''}</span>
          </div>`).join('')}</div>`
        : `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Checklist vazio</div><div class="empty-state-text">Clique em "Checklist Padrão" para gerar automaticamente ou "+ Adicionar Etapa" para personalizar.</div></div>`}`;

      el.querySelectorAll('.checklist-item.clickable:not(.done)').forEach(item => {
        item.addEventListener('click', async () => {
          if (!confirm('Marcar esta etapa como concluída?')) return;
          await API.put(`/rh/onboarding/${colab.id}/${item.dataset.id}`, { concluido: 1 });
          showToast('Etapa concluída!','success'); renderChecklist(colab);
        });
      });
      el.querySelector('#ob-back').addEventListener('click', renderColabs);
      el.querySelector('#ob-padrao').addEventListener('click', async () => {
        if (!confirm('Isso criará um checklist padrão (11 etapas). Continuar?')) return;
        await API.post(`/rh/onboarding/${colab.id}/padrao`);
        showToast('Checklist padrão criado!','success'); renderChecklist(colab);
      });
      el.querySelector('#ob-add').addEventListener('click', () => {
        const { el: f, close } = openModal({ title:'+ Nova Etapa', size:'sm',
          body: `<div class="form-group"><label class="form-label required">Etapa</label><input class="form-control" id="oe-etapa"></div>
                 <div class="form-group"><label class="form-label">Descrição</label><input class="form-control" id="oe-desc"></div>
                 <div class="form-group"><label class="form-label">Categoria</label><select class="form-select" id="oe-cat"><option value="documentacao">Documentação</option><option value="sistemas">Sistemas</option><option value="equipamentos">Equipamentos</option><option value="treinamento">Treinamento</option><option value="apresentacao">Apresentação</option><option value="outros">Outros</option></select></div>
                 <div class="form-group"><label class="form-label">Prazo</label><input class="form-control" type="date" id="oe-prazo"></div>`,
          footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="oe-save">Salvar</button>`,
        });
        f.querySelector('#oe-save').addEventListener('click', () => _withSubmit(f.querySelector('#oe-save'), async () => {
          await API.post(`/rh/onboarding/${colab.id}`, {
            etapa: f.querySelector('#oe-etapa').value,
            descricao: f.querySelector('#oe-desc').value||null,
            categoria: f.querySelector('#oe-cat').value,
            data_limite: f.querySelector('#oe-prazo').value||null,
          });
          close(); renderChecklist(colab);
        }));
      });
    }

    async function renderColabs() {
      el.innerHTML = _spinner();
      setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>`);
      const d = await API.get('/rh/colaboradores?ativo=1');
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.innerHTML = `
        <div class="search-inline mb-3"><span class="search-inline-icon">🔍</span><input class="form-control" id="ob-search" placeholder="Filtrar colaborador..."></div>
        <div id="ob-list">${rows.length ? `<div class="table-wrapper"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Cargo</th><th>Departamento</th><th>Admissão</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><div class="d-flex align-center gap-2"><div class="profile-avatar xs">${escapeHtml((r.nome_completo||'?').slice(0,2).toUpperCase())}</div>${escapeHtml(r.nome_completo)}</div></td><td>${escapeHtml(r.cargo_nome||'—')}</td><td>${escapeHtml(r.departamento_nome||'—')}</td><td>${_fmtDate(r.data_admissao)}</td><td><button class="btn btn-sm btn-primary" data-colab='${JSON.stringify({id:r.id,nome_completo:r.nome_completo,cargo_nome:r.cargo_nome,departamento_nome:r.departamento_nome})}'>Ver Checklist</button></td></tr>`).join('')}</tbody></table></div>` : _empty()}</div>`;
      el.querySelectorAll('[data-colab]').forEach(btn => {
        btn.addEventListener('click', () => renderChecklist(JSON.parse(btn.dataset.colab)));
      });
      el.querySelector('#ob-search').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        el.querySelectorAll('tbody tr').forEach(tr => {
          tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    renderColabs();
  },

  // ── f25: Avaliação de Desempenho ──────────────────────────────────────────
  f25AvaliacaoDesempenho: async (user) => {
    const { el, setFooter } = openModal({ title:'📊 Avaliação de Desempenho', size:'xl', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="av-nova">+ Nova Avaliação</button>`);

    const competencias = [
      { key:'c_produtividade',   label:'Produtividade' },
      { key:'c_qualidade',       label:'Qualidade' },
      { key:'c_pontualidade',    label:'Pontualidade' },
      { key:'c_trabalho_equipe', label:'Trabalho em Equipe' },
      { key:'c_proatividade',    label:'Proatividade' },
      { key:'c_comunicacao',     label:'Comunicação' },
      { key:'c_lideranca',       label:'Liderança' },
      { key:'c_conhecimento',    label:'Conhecimento Técnico' },
    ];

    async function load() {
      el.innerHTML = _spinner();
      const d = await API.get('/rh/avaliacoes');
      const rows = Array.isArray(d) ? d : (d.data || []);
      const resColors = { insatisfatorio:'danger', precisa_melhorar:'warning', satisfatorio:'info', bom:'primary', excelente:'success' };
      el.innerHTML = rows.length
        ? `<div class="table-wrapper"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Avaliador</th><th>Período</th><th>Tipo</th><th>Nota Geral</th><th>Resultado</th><th>Promovível</th></tr></thead><tbody>
           ${rows.map(r => `<tr>
             <td>${escapeHtml(r.colaborador_nome||'—')}</td>
             <td>${escapeHtml(r.avaliador_nome||'—')}</td>
             <td><code>${escapeHtml(r.periodo)}</code></td>
             <td><span class="chip">${escapeHtml(r.tipo||'gestor')}</span></td>
             <td><strong>${r.nota_geral ? Number(r.nota_geral).toFixed(1) : '—'}</strong></td>
             <td>${_badge(r.resultado, resColors)}</td>
             <td>${r.promovivel ? '<span class="badge badge-success">✓ Sim</span>' : '<span class="badge" style="background:rgba(255,255,255,.06);color:var(--text-muted);">Não</span>'}</td>
           </tr>`).join('')}
           </tbody></table></div>`
        : _empty('📊','Nenhuma avaliação registrada');
    }

    load();

    el.querySelector('#av-nova').addEventListener('click', async () => {
      const [cols, avaliadores] = await Promise.all([_loadOpts('/rh/colaboradores'), _loadOpts('/rh/usuarios')]);
      const scoreRow = (c) => `
        <div class="form-group">
          <label class="form-label">${c.label}</label>
          <div class="score-group" data-field="${c.key}">
            ${[1,2,3,4,5].map(n=>`<button type="button" class="score-btn" data-val="${n}">${n}</button>`).join('')}
            <input type="hidden" name="${c.key}" value="">
            <span class="score-label text-xs text-muted">1=Ruim · 5=Excelente</span>
          </div>
        </div>`;
      const { el: f, close } = openModal({ title:'+ Nova Avaliação', size:'lg',
        body: `
          <div class="tab-nav">
            <button class="tab-item active" data-tab="geral">Geral</button>
            <button class="tab-item" data-tab="competencias">Competências</button>
            <button class="tab-item" data-tab="resultado">Resultado</button>
          </div>
          <div class="tab-pane active" data-tab="geral">
            <div class="row g-2 mb-3">
              <div class="col-6"><label class="form-label required">Colaborador</label><select class="form-select" id="av-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
              <div class="col-6"><label class="form-label required">Avaliador</label><select class="form-select" id="av-aval"><option value="">—</option>${_optsHtml(avaliadores,'id','nome')}</select></div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6"><label class="form-label required">Período (ex: 2025-T1)</label><input class="form-control" id="av-per" placeholder="2025-SEM1"></div>
              <div class="col-6"><label class="form-label">Tipo</label><select class="form-select" id="av-tipo"><option value="gestor">Gestor</option><option value="auto_avaliacao">Auto-avaliação</option><option value="360">360°</option><option value="periodo_experiencia">Período de Experiência</option></select></div>
            </div>
          </div>
          <div class="tab-pane" data-tab="competencias">
            ${competencias.map(scoreRow).join('')}
          </div>
          <div class="tab-pane" data-tab="resultado">
            <div class="form-group"><label class="form-label">Pontos Fortes</label><textarea class="form-control" id="av-forte" rows="3"></textarea></div>
            <div class="form-group"><label class="form-label">Pontos de Melhoria</label><textarea class="form-control" id="av-melhoria" rows="3"></textarea></div>
            <div class="form-group"><label class="form-label">Plano de Ação</label><textarea class="form-control" id="av-plano" rows="3"></textarea></div>
            <div class="form-group"><label class="form-label">Metas Próximo Ciclo</label><textarea class="form-control" id="av-metas" rows="2"></textarea></div>
            <div class="form-check mt-3"><input class="form-check-input" type="checkbox" id="av-promo"><label class="form-check-label" for="av-promo">Colaborador promovível neste ciclo</label></div>
          </div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="av-save">Salvar Avaliação</button>`,
      });
      initComponents(f.closest('.modal-backdrop'));
      f.querySelector('#av-save').addEventListener('click', () => _withSubmit(f.querySelector('#av-save'), async () => {
        const payload = {
          colaborador_id: f.querySelector('#av-col').value,
          avaliador_id: f.querySelector('#av-aval').value,
          periodo: f.querySelector('#av-per').value,
          tipo: f.querySelector('#av-tipo').value,
          pontos_fortes: f.querySelector('#av-forte').value||null,
          pontos_melhoria: f.querySelector('#av-melhoria').value||null,
          plano_acao: f.querySelector('#av-plano').value||null,
          metas_proximas: f.querySelector('#av-metas').value||null,
          promovivel: f.querySelector('#av-promo').checked ? 1 : 0,
        };
        competencias.forEach(c => {
          const inp = f.querySelector(`[name="${c.key}"]`);
          payload[c.key] = inp?.value ? parseInt(inp.value) : null;
        });
        await API.post(`/rh/colaboradores/${payload.colaborador_id}/avaliacoes`, payload);
        close(); load();
      }));
    });
  },

  // ── f26: Saúde Ocupacional (ASO) ──────────────────────────────────────────
  f26SaudeOcupacional: async (user) => {
    const { el, setFooter } = openModal({ title:'🏥 Saúde Ocupacional (ASO)', size:'lg', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="aso-novo">+ Registrar ASO</button>`);

    async function load() {
      el.innerHTML = _spinner();
      const [d, vencendo, vencidos] = await Promise.all([
        API.get('/rh/aso'),
        API.get('/rh/aso/vencendo'),
        API.get('/rh/aso/vencidos'),
      ]);
      const rows = Array.isArray(d) ? d : (d.data || []);
      const nVenc = (Array.isArray(vencendo) ? vencendo : (vencendo.data||[])).length;
      const nVencidos = (Array.isArray(vencidos) ? vencidos : (vencidos.data||[])).length;
      const resColors = { apto:'success', apto_restricoes:'warning', inapto:'danger' };
      const tipoMap = { admissional:'Admissional', periodico:'Periódico', retorno_trabalho:'Retorno Trab.', mudanca_funcao:'Mudança Função', demissional:'Demissional' };
      el.innerHTML = `
        <div class="metric-group mb-4">
          <div class="metric-cell"><div class="metric-val">${rows.length}</div><div class="metric-lbl">Total ASOs</div></div>
          <div class="metric-cell"><div class="metric-val ${nVenc>0?'neutral':''}">${nVenc}</div><div class="metric-lbl">Vencendo (30d)</div></div>
          <div class="metric-cell"><div class="metric-val ${nVencidos>0?'negative':''}">${nVencidos}</div><div class="metric-lbl">Vencidos</div></div>
        </div>
        ${nVencidos > 0 ? `<div class="alert-banner alert-banner-danger mb-3"><span class="alert-banner-icon">⚠️</span><div class="alert-banner-text">${nVencidos} colaborador(es) com ASO vencido — necessário renovação imediata.</div></div>` : ''}
        ${nVenc > 0 ? `<div class="alert-banner alert-banner-warning mb-3"><span class="alert-banner-icon">🕐</span><div class="alert-banner-text">${nVenc} ASO(s) vencendo nos próximos 30 dias.</div></div>` : ''}
        ${rows.length ? `<div class="table-wrapper"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Tipo</th><th>Data Exame</th><th>Validade</th><th>Resultado</th><th>Médico/CRM</th></tr></thead><tbody>
        ${rows.map(r => `<tr>
          <td>${escapeHtml(r.colaborador_nome||'—')}</td>
          <td><span class="chip">${escapeHtml(tipoMap[r.tipo]||r.tipo)}</span></td>
          <td>${_fmtDate(r.data_exame)}</td>
          <td>${_fmtDate(r.data_validade)||'—'}</td>
          <td>${_badge(r.resultado, resColors)}</td>
          <td>${escapeHtml(r.medico||'—')}${r.crm?` <span class="text-xs text-muted">CRM ${escapeHtml(r.crm)}</span>`:''}</td>
        </tr>`).join('')}
        </tbody></table></div>` : _empty('🏥','Nenhum ASO registrado')}`;
    }

    load();

    el.querySelector('#aso-novo').addEventListener('click', async () => {
      const cols = await _loadOpts('/rh/colaboradores');
      const { el: f, close } = openModal({ title:'+ Registrar ASO', size:'md',
        body: `<div class="form-group"><label class="form-label required">Colaborador</label><select class="form-select" id="aso-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label required">Tipo</label><select class="form-select" id="aso-tipo"><option value="admissional">Admissional</option><option value="periodico">Periódico</option><option value="retorno_trabalho">Retorno ao Trabalho</option><option value="mudanca_funcao">Mudança de Função</option><option value="demissional">Demissional</option></select></div>
                 <div class="col-6"><label class="form-label required">Data do Exame</label><input class="form-control" type="date" id="aso-data"></div>
               </div>
               <div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label">Data de Validade</label><input class="form-control" type="date" id="aso-val"></div>
                 <div class="col-6"><label class="form-label">Resultado</label><select class="form-select" id="aso-res"><option value="apto">Apto</option><option value="apto_restricoes">Apto c/ Restrições</option><option value="inapto">Inapto</option></select></div>
               </div>
               <div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label">Médico</label><input class="form-control" id="aso-med"></div>
                 <div class="col-6"><label class="form-label">CRM</label><input class="form-control" id="aso-crm"></div>
               </div>
               <div class="form-group"><label class="form-label">Clínica</label><input class="form-control" id="aso-clinica"></div>
               <div class="form-group"><label class="form-label">Restrições / Observação</label><textarea class="form-control" id="aso-obs" rows="2"></textarea></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="aso-save">Registrar</button>`,
      });
      f.querySelector('#aso-save').addEventListener('click', () => _withSubmit(f.querySelector('#aso-save'), async () => {
        const colId = f.querySelector('#aso-col').value;
        await API.post(`/rh/colaboradores/${colId}/aso`, {
          tipo: f.querySelector('#aso-tipo').value,
          data_exame: f.querySelector('#aso-data').value,
          data_validade: f.querySelector('#aso-val').value||null,
          resultado: f.querySelector('#aso-res').value,
          medico: f.querySelector('#aso-med').value||null,
          crm: f.querySelector('#aso-crm').value||null,
          clinica: f.querySelector('#aso-clinica').value||null,
          restricoes: f.querySelector('#aso-obs').value||null,
        });
        close(); load();
      }));
    });
  },

  // ── f27: Cardápio do Refeitório ───────────────────────────────────────────
  f27Cardapio: async (user) => {
    const { el, setFooter } = openModal({ title:'🍽️ Cardápio do Refeitório', size:'lg', body: _spinner() });
    const canEdit = user.nivel_acesso >= 4;

    async function load(semana) {
      el.innerHTML = _spinner();
      const d = await API.get(`/rh/cardapio?semana=${semana||''}`);
      const rows = Array.isArray(d) ? d : (d.data || []);

      // Group by day
      const dias = {};
      rows.forEach(r => { if(!dias[r.data_cardapio]) dias[r.data_cardapio] = []; dias[r.data_cardapio].push(r); });

      const semanas = Array.from({length:7}).map((_,i) => {
        const ref = new Date(); ref.setDate(ref.getDate() - ref.getDay() + 1 + (i===0?0:i===1?7:i===-1?-7:0));
        return ref.toISOString().slice(0,10);
      });

      const refeicaoEmoji = { cafe_manha:'☕', almoco:'🍽️', jantar:'🌙', lanche:'🥪' };
      const refeicaoLabel = { cafe_manha:'Café', almoco:'Almoço', jantar:'Jantar', lanche:'Lanche' };

      el.innerHTML = `
        <div class="filter-bar mb-3">
          <label class="form-label" style="margin:0">Semana:</label>
          <input class="form-control" type="week" id="cd-semana" style="width:auto">
          ${canEdit ? `<button class="btn btn-sm btn-primary ml-auto" id="cd-add">+ Adicionar/Editar</button>` : ''}
        </div>
        ${Object.keys(dias).length ? Object.entries(dias).map(([data, refeicoes]) => `
          <div class="card mb-3">
            <div class="card-header"><div class="card-title">📅 ${_fmtDate(data)}</div></div>
            <div class="card-body">
              <div class="row g-2">
                ${refeicoes.map(r => `
                  <div class="col-6">
                    <div style="background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius);padding:12px">
                      <div style="font-weight:600;margin-bottom:6px">${refeicaoEmoji[r.refeicao]||''} ${refeicaoLabel[r.refeicao]||r.refeicao}</div>
                      ${r.prato_principal?`<div class="text-sm"><strong>Prato:</strong> ${escapeHtml(r.prato_principal)}</div>`:''}
                      ${r.acompanhamento1?`<div class="text-xs text-muted">+ ${escapeHtml(r.acompanhamento1)}</div>`:''}
                      ${r.acompanhamento2?`<div class="text-xs text-muted">+ ${escapeHtml(r.acompanhamento2)}</div>`:''}
                      ${r.salada?`<div class="text-xs">🥗 ${escapeHtml(r.salada)}</div>`:''}
                      ${r.sobremesa?`<div class="text-xs">🍮 ${escapeHtml(r.sobremesa)}</div>`:''}
                      ${r.suco?`<div class="text-xs">🧃 ${escapeHtml(r.suco)}</div>`:''}
                      ${r.calorias_aprox?`<div class="text-xs text-muted mt-1">~${r.calorias_aprox} kcal</div>`:''}
                    </div>
                  </div>`).join('')}
              </div>
            </div>
          </div>`).join('')
        : _empty('🍽️','Cardápio não cadastrado','Nenhuma refeição para esta semana.')}`;

      if (canEdit) el.querySelector('#cd-add')?.addEventListener('click', () => openFormCardapio());
      el.querySelector('#cd-semana')?.addEventListener('change', e => load(e.target.value));
    }

    function openFormCardapio() {
      const { el: f, close } = openModal({ title:'🍽️ Adicionar Refeição', size:'md',
        body: `<div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label required">Data</label><input class="form-control" type="date" id="cd-data"></div>
                 <div class="col-6"><label class="form-label required">Refeição</label><select class="form-select" id="cd-ref"><option value="cafe_manha">☕ Café da Manhã</option><option value="almoco" selected>🍽️ Almoço</option><option value="jantar">🌙 Jantar</option><option value="lanche">🥪 Lanche</option></select></div>
               </div>
               <div class="form-group"><label class="form-label">Prato Principal</label><input class="form-control" id="cd-prato"></div>
               <div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label">Acompanhamento 1</label><input class="form-control" id="cd-ac1"></div>
                 <div class="col-6"><label class="form-label">Acompanhamento 2</label><input class="form-control" id="cd-ac2"></div>
               </div>
               <div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label">Salada</label><input class="form-control" id="cd-sal"></div>
                 <div class="col-6"><label class="form-label">Sobremesa</label><input class="form-control" id="cd-sob"></div>
               </div>
               <div class="row g-2 mb-3">
                 <div class="col-8"><label class="form-label">Suco</label><input class="form-control" id="cd-suco"></div>
                 <div class="col-4"><label class="form-label">Kcal aprox.</label><input class="form-control" type="number" id="cd-kcal"></div>
               </div>
               <div class="form-group"><label class="form-label">Observação</label><input class="form-control" id="cd-obs"></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="cd-save">Salvar</button>`,
      });
      f.querySelector('#cd-save').addEventListener('click', () => _withSubmit(f.querySelector('#cd-save'), async () => {
        await API.post('/rh/cardapio', {
          data_cardapio: f.querySelector('#cd-data').value,
          refeicao: f.querySelector('#cd-ref').value,
          prato_principal: f.querySelector('#cd-prato').value||null,
          acompanhamento1: f.querySelector('#cd-ac1').value||null,
          acompanhamento2: f.querySelector('#cd-ac2').value||null,
          salada: f.querySelector('#cd-sal').value||null,
          sobremesa: f.querySelector('#cd-sob').value||null,
          suco: f.querySelector('#cd-suco').value||null,
          calorias_aprox: f.querySelector('#cd-kcal').value||null,
          observacao: f.querySelector('#cd-obs').value||null,
        });
        close(); load();
      }));
    }

    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button>${canEdit?'<button class="btn btn-primary" id="cd-footer-add">+ Adicionar</button>':''}`);
    if (canEdit) el.querySelector('#cd-footer-add')?.addEventListener('click', () => openFormCardapio());
    load();
  },

  // ── f28: Banco de Horas ───────────────────────────────────────────────────
  f28BancoHoras: async (user) => {
    const { el, setFooter } = openModal({ title:'⏰ Banco de Horas', size:'lg', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-primary" id="bh-novo">+ Lançamento</button>`);

    async function load() {
      el.innerHTML = _spinner();
      const d = await API.get('/rh/banco-horas');
      const rows = Array.isArray(d) ? d : (d.data || []);

      // Aggregate saldo per employee
      const saldos = {};
      rows.forEach(r => {
        if (!saldos[r.colaborador_id]) saldos[r.colaborador_id] = { nome: r.colaborador_nome, credito: 0, debito: 0 };
        const h = parseFloat(r.horas)||0;
        if (r.tipo === 'credito' || r.tipo === 'ajuste') saldos[r.colaborador_id].credito += h;
        else saldos[r.colaborador_id].debito += h;
      });

      const tipoColors = { credito:'success', debito:'danger', ajuste:'info', compensacao:'warning' };
      el.innerHTML = `
        <div class="tab-nav">
          <button class="tab-item active" data-tab="resumo">Resumo</button>
          <button class="tab-item" data-tab="lancamentos">Lançamentos</button>
        </div>
        <div class="tab-pane active" data-tab="resumo">
          ${Object.values(saldos).length ? `<div class="table-wrapper"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Crédito</th><th>Débito</th><th>Saldo</th></tr></thead><tbody>
          ${Object.values(saldos).map(s => {
            const saldo = s.credito - s.debito;
            return `<tr>
              <td>${escapeHtml(s.nome||'—')}</td>
              <td class="money positive">+${s.credito.toFixed(2)}h</td>
              <td class="money negative">-${s.debito.toFixed(2)}h</td>
              <td class="money ${saldo>=0?'positive':'negative'}">${saldo>=0?'+':''}${saldo.toFixed(2)}h</td>
            </tr>`;
          }).join('')}
          </tbody></table></div>` : _empty('⏰','Nenhum lançamento de banco de horas')}
        </div>
        <div class="tab-pane" data-tab="lancamentos">
          ${rows.length ? `<div class="table-wrapper"><table class="table table-hover"><thead><tr><th>Colaborador</th><th>Data</th><th>Tipo</th><th>Horas</th><th>Motivo</th></tr></thead><tbody>
          ${rows.map(r => `<tr>
            <td>${escapeHtml(r.colaborador_nome||'—')}</td>
            <td>${_fmtDate(r.data_lancamento)}</td>
            <td>${_badge(r.tipo, tipoColors)}</td>
            <td class="money ${(r.tipo==='credito'||r.tipo==='ajuste')?'positive':'negative'}">${(r.tipo==='credito'||r.tipo==='ajuste')?'+':'−'}${parseFloat(r.horas).toFixed(2)}h</td>
            <td class="text-muted text-sm">${escapeHtml(r.motivo||'—')}</td>
          </tr>`).join('')}
          </tbody></table></div>` : _empty()}
        </div>`;
      initTabNav(el.closest('.modal-backdrop'));
    }

    load();

    el.querySelector('#bh-novo').addEventListener('click', async () => {
      const [cols, aprovadores] = await Promise.all([_loadOpts('/rh/colaboradores'), _loadOpts('/rh/usuarios')]);
      const { el: f, close } = openModal({ title:'+ Lançamento Banco de Horas', size:'sm',
        body: `<div class="form-group"><label class="form-label required">Colaborador</label><select class="form-select" id="bh-col"><option value="">—</option>${_optsHtml(cols,'id','nome_completo')}</select></div>
               <div class="row g-2 mb-3">
                 <div class="col-6"><label class="form-label required">Data</label><input class="form-control" type="date" id="bh-data"></div>
                 <div class="col-6"><label class="form-label required">Tipo</label><select class="form-select" id="bh-tipo"><option value="credito">Crédito</option><option value="debito">Débito</option><option value="compensacao">Compensação</option><option value="ajuste">Ajuste</option></select></div>
               </div>
               <div class="form-group"><label class="form-label required">Horas</label><input class="form-control" type="number" step="0.25" min="0.25" id="bh-horas" placeholder="Ex: 2.5"></div>
               <div class="form-group"><label class="form-label">Motivo</label><input class="form-control" id="bh-motivo"></div>
               <div class="form-group"><label class="form-label">Aprovado por</label><select class="form-select" id="bh-aprov"><option value="">—</option>${_optsHtml(aprovadores,'id','nome')}</select></div>`,
        footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button class="btn btn-primary" id="bh-save">Salvar</button>`,
      });
      f.querySelector('#bh-save').addEventListener('click', () => _withSubmit(f.querySelector('#bh-save'), async () => {
        const colId = f.querySelector('#bh-col').value;
        await API.post(`/rh/colaboradores/${colId}/banco-horas`, {
          data_lancamento: f.querySelector('#bh-data').value,
          tipo: f.querySelector('#bh-tipo').value,
          horas: f.querySelector('#bh-horas').value,
          motivo: f.querySelector('#bh-motivo').value||null,
          aprovado_por: f.querySelector('#bh-aprov').value||null,
        });
        close(); load();
      }));
    });
  },

  // ── f29: Relatórios de RH ─────────────────────────────────────────────────
  f29RelatoriosRH: async (user) => {
    const { el, setFooter } = openModal({ title:'📈 Relatórios de RH', size:'xl', body: _spinner() });
    setFooter(`<button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Fechar</button><button class="btn btn-sm btn-ghost" id="rel-print">🖨️ Imprimir</button>`);

    el.innerHTML = `
      <div class="tab-nav">
        <button class="tab-item active" data-tab="turnover">Turnover</button>
        <button class="tab-item" data-tab="absenteismo">Absenteísmo</button>
      </div>
      <div class="tab-pane active" data-tab="turnover">
        <div class="filter-bar mb-3">
          <label class="form-label" style="margin:0">Ano:</label>
          <input class="form-control" type="number" id="rel-ano-tv" value="${new Date().getFullYear()}" style="width:90px">
          <button class="btn btn-sm btn-primary" id="rel-buscar-tv">Filtrar</button>
        </div>
        <div id="rel-tv-content">${_spinner()}</div>
      </div>
      <div class="tab-pane" data-tab="absenteismo">
        <div class="filter-bar mb-3">
          <label class="form-label" style="margin:0">Início:</label>
          <input class="form-control" type="date" id="rel-inicio-ab" style="width:auto">
          <label class="form-label" style="margin:0">Fim:</label>
          <input class="form-control" type="date" id="rel-fim-ab" style="width:auto">
          <button class="btn btn-sm btn-primary" id="rel-buscar-ab">Filtrar</button>
        </div>
        <div id="rel-ab-content">${_spinner()}</div>
      </div>`;

    initTabNav(el.closest('.modal-backdrop'));

    async function loadTurnover() {
      const ano = el.querySelector('#rel-ano-tv').value || new Date().getFullYear();
      el.querySelector('#rel-tv-content').innerHTML = _spinner();
      const d = await API.get(`/rh/relatorios/turnover?ano=${ano}`);
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rel-tv-content').innerHTML = rows.length
        ? `<div class="table-wrapper"><table class="table"><thead><tr><th>Mês</th><th>Admissões</th><th>Demissões</th><th>Taxa Turnover</th></tr></thead><tbody>
           ${rows.map(r => {
             const taxa = r.admissoes + r.demissoes > 0 ? ((r.demissoes/(r.admissoes||1))*100).toFixed(1) : '0.0';
             return `<tr>
               <td><strong>${escapeHtml(r.mes_nome||r.mes)}</strong></td>
               <td class="money positive">+${r.admissoes}</td>
               <td class="money negative">-${r.demissoes}</td>
               <td>${_badge(parseFloat(taxa) > 5 ? 'alta' : 'normal', {alta:'danger',normal:'success'})} ${taxa}%</td>
             </tr>`;
           }).join('')}
           </tbody></table></div>`
        : _empty('📈','Nenhum dado de turnover para este período');
    }

    async function loadAbsenteismo() {
      const inicio = el.querySelector('#rel-inicio-ab').value;
      const fim = el.querySelector('#rel-fim-ab').value;
      if (!inicio || !fim) { el.querySelector('#rel-ab-content').innerHTML = `<div class="alert-banner alert-banner-info"><span class="alert-banner-icon">ℹ️</span><div>Selecione o período para gerar o relatório.</div></div>`; return; }
      el.querySelector('#rel-ab-content').innerHTML = _spinner();
      const d = await API.get(`/rh/relatorios/absenteismo?inicio=${inicio}&fim=${fim}`);
      const rows = Array.isArray(d) ? d : (d.data || []);
      el.querySelector('#rel-ab-content').innerHTML = rows.length
        ? `<div class="table-wrapper"><table class="table"><thead><tr><th>Colaborador</th><th>Departamento</th><th>Total Dias</th><th>Ocorrências</th></tr></thead><tbody>
           ${rows.map(r => `<tr>
             <td>${escapeHtml(r.colaborador_nome||'—')}</td>
             <td>${escapeHtml(r.departamento_nome||'—')}</td>
             <td class="money ${r.total_dias>3?'negative':'neutral'}">${r.total_dias} dia(s)</td>
             <td>${r.ocorrencias}</td>
           </tr>`).join('')}
           </tbody></table></div>`
        : _empty('📉','Nenhum afastamento no período');
    }

    el.querySelector('#rel-buscar-tv').addEventListener('click', loadTurnover);
    el.querySelector('#rel-buscar-ab').addEventListener('click', loadAbsenteismo);
    el.querySelector('#rel-print').addEventListener('click', () => window.print());

    loadTurnover();
    // default: last 30 days for absenteismo
    const hoje = new Date().toISOString().slice(0,10);
    const mes = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
    el.querySelector('#rel-inicio-ab').value = mes;
    el.querySelector('#rel-fim-ab').value = hoje;
    loadAbsenteismo();
  },

};

window.RhForms = RhForms;
