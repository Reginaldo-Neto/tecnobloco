'use strict';
/**
 * Modais do setor de Segurança do Trabalho.
 */
const SegurancaForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title: '📅 Escala de Segurança do Trabalho', size: 'lg', body: _spinner() });
    const r = await API.get('/seguranca/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Técnico</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02Ocorrencias: async (user) => {
    const { el, setFooter } = openModal({ title: '⚠️ Ocorrências de Segurança', size: 'xl', body: _spinner() });
    const r = await API.get('/seguranca/ocorrencias?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar ocorrências.'); return; }
    const rows = r.data.map(o => `<tr>
      <td>${o.tipo ? o.tipo.replace('_', ' ') : '—'}</td>
      <td>${o.departamento || '—'}</td>
      <td>${o.envolvido_nome || '—'}</td>
      <td>${o.descricao?.substring(0, 50) || '—'}</td>
      <td>${_badge(o.status)}</td>
      <td>${_fmtDate(o.data_ocorrencia)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Tipo</th><th>Departamento</th><th>Envolvido</th><th>Descrição</th><th>Status</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma ocorrência registrada.');
    if (user.nivel_acesso >= 3) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-ocorr">+ Registrar Ocorrência</button>`);
      document.getElementById('btn-nova-ocorr').onclick = () => {
        el.innerHTML = `<form id="form-ocorr">
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required>
                <option value="acidente_com_afastamento">Acidente c/ Afastamento</option>
                <option value="acidente_sem_afastamento">Acidente s/ Afastamento</option>
                <option value="incidente">Incidente</option>
                <option value="quase_acidente">Quase-Acidente</option>
                <option value="doenca_ocupacional">Doença Ocupacional</option>
              </select>
            </div>
            <div class="col-6"><label class="form-label">Data da Ocorrência *</label><input name="data_ocorrencia" type="date" class="form-control" required></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">Departamento *</label><input name="departamento" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Envolvido</label><input name="envolvido_nome" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Descrição *</label><textarea name="descricao" class="form-control" rows="3" required></textarea></div>
          <div class="mb-3"><label class="form-label">Causa Raiz</label><textarea name="causa_raiz" class="form-control" rows="2"></textarea></div>
          <div class="mb-3"><label class="form-label">Ação Imediata</label><textarea name="acao_imediata" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-ocorr">Registrar</button>`);
        document.getElementById('btn-salvar-ocorr').onclick = async () => {
          const f = document.getElementById('form-ocorr');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-ocorr'), async () => {
            const res = await API.post('/seguranca/ocorrencias', body);
            if (res.success) { showToast('Ocorrência registrada!', 'success'); SegurancaForms.f02Ocorrencias(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f03RegistrarCAT: async (user) => {
    const { el, setFooter } = openModal({ title: '📄 Comunicação de Acidente de Trabalho (CAT)', size: 'xl', body: _spinner() });
    const r = await API.get('/seguranca/cats?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar CATs.'); return; }
    const rows = r.data.map(c => `<tr>
      <td>${c.numero_cat || c.id}</td>
      <td>${c.acidentado_nome}</td>
      <td>${c.tipo_cat || '—'}</td>
      <td>${_fmtDate(c.data_acidente)}</td>
      <td>${_badge(c.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>CAT</th><th>Acidentado</th><th>Tipo</th><th>Data</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma CAT registrada.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-cat">+ Emitir CAT</button>`);
      document.getElementById('btn-nova-cat').onclick = () => {
        el.innerHTML = `<form id="form-cat">
          <div class="mb-3"><label class="form-label">Nome do Acidentado *</label><input name="acidentado_nome" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Tipo de CAT *</label>
              <select name="tipo_cat" class="form-select" required>
                <option value="inicial">Inicial</option><option value="reabertura">Reabertura</option><option value="comunicacao_obito">Comunicação de Óbito</option>
              </select>
            </div>
            <div class="col-4"><label class="form-label">Data do Acidente *</label><input name="data_acidente" type="date" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Hora do Acidente</label><input name="hora_acidente" type="time" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Local do Acidente *</label><input name="local_acidente" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Descrição do Acidente *</label><textarea name="descricao" class="form-control" rows="3" required></textarea></div>
          <div class="mb-3"><label class="form-label">Parte do Corpo Atingida</label><input name="parte_corpo" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Há Afastamento?</label>
            <select name="afastamento" class="form-select">
              <option value="0">Não</option><option value="1">Sim</option>
            </select>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-cat">Emitir CAT</button>`);
        document.getElementById('btn-salvar-cat').onclick = async () => {
          const f = document.getElementById('form-cat');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-cat'), async () => {
            const res = await API.post('/seguranca/cats', body);
            if (res.success) { showToast(`CAT ${res.data?.numero_cat || ''} emitida!`, 'success'); SegurancaForms.f03RegistrarCAT(user); }
            else showToast(res.message || 'Erro ao emitir.', 'danger');
          });
        };
      };
    }
  },

  f04Inspecoes: async (user) => {
    const { el, setFooter } = openModal({ title: '🔍 Inspeções de Segurança', size: 'xl', body: _spinner() });
    const r = await API.get('/seguranca/inspecoes?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar inspeções.'); return; }
    const rows = r.data.map(i => `<tr>
      <td>${i.departamento}</td>
      <td>${i.inspetor_nome || '—'}</td>
      <td>${i.total_itens || 0} itens</td>
      <td>${i.nao_conformidades || 0} NCs</td>
      <td>${_badge(i.status)}</td>
      <td>${_fmtDate(i.data_inspecao)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Departamento</th><th>Inspetor</th><th>Itens</th><th>NCs</th><th>Status</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma inspeção registrada.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-insp">+ Nova Inspeção</button>`);
      document.getElementById('btn-nova-insp').onclick = () => {
        const itensInspecao = ['EPI em uso', 'Sinalização', 'Extintores', 'Saídas de emergência', 'Organização', 'Maquinário', 'Iluminação', 'Ergonomia'];
        el.innerHTML = `<form id="form-insp">
          <div class="row g-2 mb-3">
            <div class="col-6"><label class="form-label">Departamento *</label><input name="departamento" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Data *</label><input name="data_inspecao" type="date" class="form-control" required></div>
          </div>
          <h6>Itens Verificados</h6>
          <div class="row g-2 mb-3">
            ${itensInspecao.map(item => `<div class="col-6">
              <div class="d-flex align-items-center gap-2">
                <label class="flex-grow-1">${item}</label>
                <select name="item_${item.replace(/\s/g,'_')}" class="form-select form-select-sm" style="width:auto">
                  <option value="ok">OK</option><option value="nc">NC</option><option value="na">N/A</option>
                </select>
              </div>
            </div>`).join('')}
          </div>
          <div class="mb-3"><label class="form-label">Observações</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-insp">Salvar</button>`);
        document.getElementById('btn-salvar-insp').onclick = async () => {
          const f = document.getElementById('form-insp');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const fd = new FormData(f);
          const body = { departamento: fd.get('departamento'), data_inspecao: fd.get('data_inspecao'), observacao: fd.get('observacao'), itens: {} };
          itensInspecao.forEach(item => { body.itens[item] = fd.get(`item_${item.replace(/\s/g,'_')}`); });
          body.nao_conformidades = Object.values(body.itens).filter(v => v === 'nc').length;
          body.total_itens = Object.values(body.itens).filter(v => v !== 'na').length;
          body.itens = JSON.stringify(body.itens);
          await _withSubmit(document.getElementById('btn-salvar-insp'), async () => {
            const res = await API.post('/seguranca/inspecoes', body);
            if (res.success) { showToast('Inspeção registrada!', 'success'); SegurancaForms.f04Inspecoes(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f05Treinamentos: async (user) => {
    const { el, setFooter } = openModal({ title: '🎓 Treinamentos de Segurança', size: 'xl', body: _spinner() });
    const r = await API.get('/seguranca/treinamentos?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar treinamentos.'); return; }
    const rows = r.data.map(t => `<tr>
      <td>${t.titulo}</td>
      <td>${t.nr_relacionada || '—'}</td>
      <td>${t.carga_horaria || '—'}h</td>
      <td>${t.participantes_count || 0} part.</td>
      <td>${_fmtDate(t.data_realizacao)}</td>
      <td>${_badge(t.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Título</th><th>NR</th><th>Carga</th><th>Participantes</th><th>Data</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum treinamento registrado.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-treino-seg">+ Novo Treinamento</button>`);
      document.getElementById('btn-novo-treino-seg').onclick = async () => {
        const rU = await API.get('/seguranca/colaboradores');
        const colab = rU.data || [];
        el.innerHTML = `<form id="form-treino-seg">
          <div class="mb-3"><label class="form-label">Título do Treinamento *</label><input name="titulo" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-4"><label class="form-label">NR Relacionada</label><input name="nr_relacionada" class="form-control" placeholder="Ex: NR-35"></div>
            <div class="col-4"><label class="form-label">Carga Horária (h)</label><input name="carga_horaria" type="number" step="0.5" class="form-control"></div>
            <div class="col-4"><label class="form-label">Data *</label><input name="data_realizacao" type="date" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Instrutor</label><input name="instrutor" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Participantes</label>
            <select name="participantes" class="form-select" multiple style="height:120px">
              ${colab.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
            </select>
            <small class="text-muted">Segure Ctrl para selecionar múltiplos</small>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-treino-seg">Salvar</button>`);
        document.getElementById('btn-salvar-treino-seg').onclick = async () => {
          const f = document.getElementById('form-treino-seg');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const fd = new FormData(f);
          const body = Object.fromEntries(fd.entries());
          body.participantes = JSON.stringify(fd.getAll('participantes'));
          body.participantes_count = fd.getAll('participantes').length;
          await _withSubmit(document.getElementById('btn-salvar-treino-seg'), async () => {
            const res = await API.post('/seguranca/treinamentos', body);
            if (res.success) { showToast('Treinamento registrado!', 'success'); SegurancaForms.f05Treinamentos(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f06GerenciarEscalas: async (user) => {
    const { el, setFooter } = openModal({ title: '📅 Gerenciar Escalas de Segurança', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/seguranca/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="SegurancaForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Técnico</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/seguranca/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-seg">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-seg').onclick = () => {
      el.innerHTML = `<form id="form-esc-seg">
        <div class="mb-3"><label class="form-label">Técnico</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
        <div class="mb-3"><label class="form-label">Nome (externo)</label><input name="nome_externo" class="form-control"></div>
        <div class="mb-3"><label class="form-label">Turno *</label>
          <select name="turno" class="form-select" required>
            <option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option><option value="plantao">Plantão</option>
          </select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Início *</label><input name="data_inicio" type="date" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Fim *</label><input name="data_fim" type="date" class="form-control" required></div>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-seg">Salvar</button>`);
      document.getElementById('btn-salvar-esc-seg').onclick = async () => {
        const f = document.getElementById('form-esc-seg');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-seg'), async () => {
          const res = await API.post('/seguranca/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); SegurancaForms.f06GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/seguranca/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },
};

window.SegurancaForms = SegurancaForms;
