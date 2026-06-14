'use strict';
/**
 * Modais do setor Jurídico / Compliance.
 */
const JuridicoForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title: '📅 Escala do Jurídico', size: 'lg', body: _spinner() });
    const r = await API.get('/juridico/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Profissional</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02Contratos: async (user) => {
    const { el, setFooter } = openModal({ title: '📜 Contratos', size: 'xl', body: _spinner() });
    const r = await API.get('/juridico/contratos?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar contratos.'); return; }
    const hoje = new Date();
    const rows = r.data.map(c => {
      const venc = new Date(c.data_fim);
      const dias = Math.ceil((venc - hoje) / 86400000);
      const alertaCls = dias <= 30 && c.status === 'vigente' ? 'table-warning' : '';
      return `<tr class="${alertaCls}">
        <td>${c.numero}</td>
        <td>${c.objeto?.substring(0, 40) || '—'}</td>
        <td>${c.contraparte}</td>
        <td>${c.tipo || '—'}</td>
        <td>${_fmtDate(c.data_inicio)} – ${_fmtDate(c.data_fim)}</td>
        <td>${_badge(c.status)}</td>
      </tr>`;
    }).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>#</th><th>Objeto</th><th>Contraparte</th><th>Tipo</th><th>Vigência</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum contrato cadastrado.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-contrato">+ Novo Contrato</button>`);
      document.getElementById('btn-novo-contrato').onclick = () => {
        el.innerHTML = `<form id="form-contrato">
          <div class="mb-3"><label class="form-label">Objeto / Título *</label><input name="objeto" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Contraparte *</label><input name="contraparte" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Tipo de Contrato</label>
              <select name="tipo" class="form-select">
                <option value="servico">Serviço</option><option value="fornecimento">Fornecimento</option>
                <option value="locacao">Locação</option><option value="trabalhista">Trabalhista</option>
                <option value="confidencialidade">Confidencialidade</option><option value="outros">Outros</option>
              </select>
            </div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">Início da Vigência *</label><input name="data_inicio" type="date" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Fim da Vigência *</label><input name="data_fim" type="date" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Valor (se aplicável)</label><input name="valor" type="number" step="0.01" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Observações</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-contrato">Salvar</button>`);
        document.getElementById('btn-salvar-contrato').onclick = async () => {
          const f = document.getElementById('form-contrato');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-contrato'), async () => {
            const res = await API.post('/juridico/contratos', body);
            if (res.success) { showToast(`Contrato ${res.data?.numero || ''} criado!`, 'success'); JuridicoForms.f02Contratos(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f03Processos: async (user) => {
    const { el, setFooter } = openModal({ title: '⚖️ Processos Judiciais / Administrativos', size: 'xl', body: _spinner() });
    const r = await API.get('/juridico/processos?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar processos.'); return; }
    const rows = r.data.map(p => `<tr>
      <td>${p.numero_processo}</td>
      <td>${p.tipo || '—'}</td>
      <td>${p.vara_tribunal || '—'}</td>
      <td>${p.assunto?.substring(0, 40) || '—'}</td>
      <td>${p.advogado_responsavel || '—'}</td>
      <td>${_badge(p.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Número</th><th>Tipo</th><th>Vara/Tribunal</th><th>Assunto</th><th>Advogado</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum processo cadastrado.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-processo">+ Novo Processo</button>`);
      document.getElementById('btn-novo-processo').onclick = () => {
        el.innerHTML = `<form id="form-processo">
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Número do Processo *</label><input name="numero_processo" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required>
                <option value="trabalhista">Trabalhista</option><option value="civel">Cível</option>
                <option value="tributario">Tributário</option><option value="administrativo">Administrativo</option><option value="outros">Outros</option>
              </select>
            </div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Assunto *</label><input name="assunto" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Vara / Tribunal</label><input name="vara_tribunal" class="form-control"></div>
            <div class="col-6"><label class="form-label">Advogado Responsável</label><input name="advogado_responsavel" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Valor da Causa</label><input name="valor_causa" type="number" step="0.01" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Observações</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-processo">Salvar</button>`);
        document.getElementById('btn-salvar-processo').onclick = async () => {
          const f = document.getElementById('form-processo');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-processo'), async () => {
            const res = await API.post('/juridico/processos', body);
            if (res.success) { showToast('Processo cadastrado!', 'success'); JuridicoForms.f03Processos(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f04AgendaPrazos: async (user) => {
    const { el, setFooter } = openModal({ title: '⏰ Agenda de Prazos', size: 'xl', body: _spinner() });
    const r = await API.get('/juridico/prazos?limit=30');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar prazos.'); return; }
    const hoje = new Date();
    const rows = r.data.map(p => {
      const prazo = new Date(p.data_prazo);
      const dias = Math.ceil((prazo - hoje) / 86400000);
      const cls = dias < 0 ? 'table-danger' : dias <= 7 ? 'table-warning' : '';
      return `<tr class="${cls}">
        <td>${p.descricao}</td>
        <td>${p.tipo || '—'}</td>
        <td>${p.processo_numero || p.contrato_numero || '—'}</td>
        <td>${_fmtDate(p.data_prazo)}</td>
        <td>${dias < 0 ? '<span class="badge bg-danger">Vencido</span>' : dias === 0 ? '<span class="badge bg-warning">Hoje</span>' : `<span class="badge bg-${dias <= 7 ? 'warning' : 'info'}">${dias}d</span>`}</td>
        <td>${_badge(p.status)}</td>
      </tr>`;
    }).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Descrição</th><th>Tipo</th><th>Referência</th><th>Prazo</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum prazo cadastrado.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-prazo">+ Novo Prazo</button>`);
      document.getElementById('btn-novo-prazo').onclick = async () => {
        const [rP, rC] = await Promise.all([API.get('/juridico/processos'), API.get('/juridico/contratos')]);
        const procOpts = (rP.data || []).map(p => `<option value="${p.id}">Proc: ${p.numero_processo}</option>`).join('');
        const contOpts = (rC.data || []).map(c => `<option value="${c.id}">CT: ${c.numero}</option>`).join('');
        el.innerHTML = `<form id="form-prazo">
          <div class="mb-3"><label class="form-label">Descrição do Prazo *</label><input name="descricao" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Tipo</label>
              <select name="tipo" class="form-select">
                <option value="processual">Processual</option><option value="contratual">Contratual</option>
                <option value="administrativo">Administrativo</option><option value="outros">Outros</option>
              </select>
            </div>
            <div class="col-6"><label class="form-label">Data do Prazo *</label><input name="data_prazo" type="date" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Processo (opcional)</label>
            <select name="processo_id" class="form-select"><option value="">Nenhum</option>${procOpts}</select>
          </div>
          <div class="mb-3"><label class="form-label">Contrato (opcional)</label>
            <select name="contrato_id" class="form-select"><option value="">Nenhum</option>${contOpts}</select>
          </div>
          <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-prazo">Salvar</button>`);
        document.getElementById('btn-salvar-prazo').onclick = async () => {
          const f = document.getElementById('form-prazo');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-prazo'), async () => {
            const res = await API.post('/juridico/prazos', body);
            if (res.success) { showToast('Prazo cadastrado!', 'success'); JuridicoForms.f04AgendaPrazos(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f05GerenciarEscalas: async (user) => {
    const { el, setFooter } = openModal({ title: '📅 Gerenciar Escalas do Jurídico', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/juridico/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="JuridicoForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Profissional</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/juridico/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-jur">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-jur').onclick = () => {
      el.innerHTML = `<form id="form-esc-jur">
        <div class="mb-3"><label class="form-label">Profissional</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
        <div class="mb-3"><label class="form-label">Nome (externo)</label><input name="nome_externo" class="form-control"></div>
        <div class="mb-3"><label class="form-label">Turno *</label>
          <select name="turno" class="form-select" required>
            <option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="integral">Integral</option>
          </select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Início *</label><input name="data_inicio" type="date" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Fim *</label><input name="data_fim" type="date" class="form-control" required></div>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-jur">Salvar</button>`);
      document.getElementById('btn-salvar-esc-jur').onclick = async () => {
        const f = document.getElementById('form-esc-jur');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-jur'), async () => {
          const res = await API.post('/juridico/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); JuridicoForms.f05GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/juridico/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },
};

window.JuridicoForms = JuridicoForms;
