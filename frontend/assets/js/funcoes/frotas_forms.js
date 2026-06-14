'use strict';
/**
 * Modais do setor de Gestão de Frotas.
 */

/**
 * Wrapper local de modal para o setor de Frotas.
 * Retorna { el: modalBody, setFooter, close } — API esperada por todas as funções deste arquivo.
 * 'el' aponta para o <div class="modal-body">, permitindo el.innerHTML = ... sem destruir o header.
 */
function _frotaModal(opts) {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  const sz = opts.size ? ` modal-${opts.size}` : '';
  bd.innerHTML = `
    <div class="modal${sz}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">${opts.title || ''}</h3>
        <button class="modal-close" data-bs-dismiss="modal" aria-label="Fechar">✕</button>
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
const FrotasForms = {

  f01VerEscala: async (user) => {
    const { el } = _frotaModal({ title: '📅 Escala de Frota', size: 'lg', body: _spinner() });
    const r = await API.get('/frota/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Motorista</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02GerenciarVeiculos: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🚗 Gerenciar Veículos', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/veiculos');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar veículos.'); return; }
    const allRows = r.data;
    let filtroStatus = 'todos';

    const statusTabLabels = { todos: 'Todos', disponivel: 'Disponível', em_uso: 'Em Uso', manutencao: 'Manutenção', inativo: 'Inativo' };
    const statusTabCors  = { todos: 'secondary', disponivel: 'success', em_uso: 'info', manutencao: 'warning', inativo: 'dark' };

    const renderTabela = (lista) => {
      const filtrada = filtroStatus === 'todos' ? lista : lista.filter(v => v.status === filtroStatus);
      const counts = {};
      ['todos','disponivel','em_uso','manutencao','inativo'].forEach(s =>
        counts[s] = s === 'todos' ? lista.length : lista.filter(v => v.status === s).length);

      const tabs = Object.keys(statusTabLabels).map(s => `
        <button class="btn btn-sm btn-${filtroStatus === s ? statusTabCors[s] : 'outline-' + statusTabCors[s]} me-1 mb-2"
          onclick="FrotasForms._filtrarVeiculos('${s}')">
          ${statusTabLabels[s]} <span class="badge bg-light text-dark">${counts[s]}</span>
        </button>`).join('');

      const rows = filtrada.map(v => `<tr>
        <td><code>${v.placa}</code></td>
        <td>${v.modelo || '—'}${v.marca ? ' <small class="text-muted">/ ' + v.marca + '</small>' : ''}</td>
        <td>${v.ano || '—'}</td>
        <td>${v.tipo || '—'}</td>
        <td>${v.km_atual != null ? Number(v.km_atual).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td>${_badge(v.status)}</td>
        ${user.nivel_acesso >= 4 ? `<td><button class="btn btn-sm btn-outline-primary py-0" onclick="FrotasForms._editarVeiculo(${v.id},'${v.placa}','${(v.modelo||'').replace(/'/g,"\\'")}',${v.km_atual||0},'${v.status}',event)">✏️</button></td>` : '<td></td>'}
      </tr>`).join('');

      return `<div class="mb-2">${tabs}</div>
        <div class="mb-2"><input id="filtro-veic" class="form-control form-control-sm" placeholder="Buscar por placa ou modelo..." oninput="(()=>{const q=this.value.toLowerCase();document.querySelectorAll('#tabela-veic tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')})()" /></div>` +
        (rows ? `<div style="overflow-x:auto"><table class="table table-sm table-hover" id="tabela-veic">
          <thead><tr><th>Placa</th><th>Modelo</th><th>Ano</th><th>Tipo</th><th>KM Atual</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>` : _empty(`Nenhum veículo ${filtroStatus !== 'todos' ? 'com status "' + statusTabLabels[filtroStatus] + '"' : 'cadastrado'}.`,
          user.nivel_acesso >= 4 ? `<button class="btn btn-sm btn-primary" id="btn-empty-novo-veic">+ Cadastrar Veículo</button>` : ''));
    };

    FrotasForms._filtrarVeiculos = (s) => { filtroStatus = s; el.innerHTML = renderTabela(allRows); bindBtnNovoVeiculo(); };

    const bindBtnNovoVeiculo = () => {
      document.getElementById('btn-empty-novo-veic')?.addEventListener('click', () => document.getElementById('btn-novo-veiculo')?.click());
    };

    el.innerHTML = renderTabela(allRows);
    bindBtnNovoVeiculo();

    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-veiculo">+ Novo Veículo</button>`);
      document.getElementById('btn-novo-veiculo').onclick = () => {
        el.innerHTML = `<form id="form-veiculo">
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Placa *</label><input name="placa" class="form-control" required style="text-transform:uppercase"></div>
            <div class="col-4"><label class="form-label">Modelo *</label><input name="modelo" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Ano</label><input name="ano" type="number" class="form-control" min="1990" max="2030"></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-4"><label class="form-label">Renavam</label><input name="renavam" class="form-control"></div>
            <div class="col-4"><label class="form-label">KM Inicial</label><input name="km_atual" type="number" class="form-control" value="0"></div>
            <div class="col-4"><label class="form-label">Tipo</label>
              <select name="tipo" class="form-select">
                <option value="carro">Carro</option><option value="caminhao">Caminhão</option>
                <option value="moto">Moto</option><option value="van">Van</option>
                <option value="trator">Trator</option><option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-veiculo">Salvar</button>`);
        document.getElementById('btn-salvar-veiculo').onclick = async () => {
          const f = document.getElementById('form-veiculo');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          body.placa = body.placa.toUpperCase();
          await _withSubmit(document.getElementById('btn-salvar-veiculo'), async () => {
            const res = await API.post('/frota/veiculos', body);
            if (res.success) { showToast('Veículo cadastrado!', 'success'); FrotasForms.f02GerenciarVeiculos(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  _editarVeiculo: async (id, placa, modelo, km, status, event) => {
    event.stopPropagation();
    const body = `<form id="form-edit-veic">
      <div class="row g-2 mb-2">
        <div class="col-4"><label class="form-label">Placa</label><input class="form-control" value="${placa}" readonly disabled></div>
        <div class="col-4"><label class="form-label">Modelo</label><input name="modelo" class="form-control" value="${modelo}"></div>
        <div class="col-4"><label class="form-label">KM Atual</label><input name="km_atual" type="number" class="form-control" value="${km}"></div>
      </div>
      <div class="mb-2"><label class="form-label">Status</label>
        <select name="status" class="form-select">
          <option value="disponivel"${status==='disponivel'?' selected':''}>Disponível</option>
          <option value="em_uso"${status==='em_uso'?' selected':''}>Em Uso</option>
          <option value="manutencao"${status==='manutencao'?' selected':''}>Em Manutenção</option>
          <option value="inativo"${status==='inativo'?' selected':''}>Inativo</option>
        </select>
      </div>
    </form>`;
    const { el: el2, setFooter: sf } = _frotaModal({ title: `✏️ Editar Veículo — ${placa}`, size: 'md', body });
    sf(`<button class="btn btn-success" id="btn-save-veic-edit">Salvar Alterações</button>`);
    document.getElementById('btn-save-veic-edit').onclick = async () => {
      const f = document.getElementById('form-edit-veic');
      const data = Object.fromEntries(new FormData(f).entries());
      const btn = document.getElementById('btn-save-veic-edit');
      await _withSubmit(btn, async () => {
        const res = await API.put(`/frota/veiculos/${id}`, data);
        if (res.success) { showToast('Veículo atualizado!', 'success'); document.querySelector('[data-bs-dismiss="modal"]')?.click(); }
        else showToast(res.message || 'Erro ao atualizar.', 'danger');
      });
    };
  },

  f03RegistrarViagem: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🗺️ Registrar Viagem', size: 'lg', body: _spinner() });
    const [rV, rM] = await Promise.all([API.get('/frota/veiculos?status=disponivel'), API.get('/frota/motoristas')]);
    const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
    const motOpts = (rM.data || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
    el.innerHTML = `<form id="form-viagem">
      <div class="mb-3"><label class="form-label">Veículo *</label>
        <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
      </div>
      <div class="mb-3"><label class="form-label">Motorista *</label>
        <select name="motorista_id" class="form-select" required><option value="">Selecione...</option>${motOpts}</select>
      </div>
      <div class="mb-3"><label class="form-label">Destino *</label><input name="destino" class="form-control" required></div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">KM Saída *</label><input name="km_saida" type="number" class="form-control" required></div>
        <div class="col-6"><label class="form-label">Motivo / Finalidade</label><input name="motivo" class="form-control"></div>
      </div>
    </form>`;
    setFooter(`<button class="btn btn-success" id="btn-salvar-viagem">Iniciar Viagem</button>`);
    document.getElementById('btn-salvar-viagem').onclick = async () => {
      const f = document.getElementById('form-viagem');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const body = Object.fromEntries(new FormData(f).entries());
      await _withSubmit(document.getElementById('btn-salvar-viagem'), async () => {
        const res = await API.post('/frota/viagens', body);
        if (res.success) showToast('Viagem iniciada!', 'success');
        else showToast(res.message || 'Erro ao registrar.', 'danger');
      });
    };
  },

  f03bHistoricoViagens: async (user) => {
    const { el } = _frotaModal({ title: '🗺️ Histórico de Viagens', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/viagens');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar viagens.'); return; }
    const totKm = r.data.reduce((s, v) => s + Number(v.km_percorridos || 0), 0);
    const rows = r.data.map(v => `<tr>
      <td><code>${v.placa || '—'}</code></td>
      <td>${v.motorista_nome || '—'}</td>
      <td>${v.destino || '—'}</td>
      <td>${_fmtDate(v.data_saida)}</td>
      <td>${v.km_saida ? Number(v.km_saida).toLocaleString('pt-BR') : '—'}</td>
      <td>${v.km_chegada ? Number(v.km_chegada).toLocaleString('pt-BR') : '—'}</td>
      <td>${v.km_percorridos ? Number(v.km_percorridos).toLocaleString('pt-BR') + ' km' : '—'}</td>
      <td>${_badge(v.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows
      ? `<div class="row g-2 mb-2 align-items-center">
          <div class="col"><input class="form-control form-control-sm" placeholder="Buscar por placa, motorista ou destino..." oninput="(()=>{const q=this.value.toLowerCase();document.querySelectorAll('#tabela-viagens tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')})()" /></div>
          <div class="col-auto small text-muted">${r.data.length} viagens · ${Number(totKm).toLocaleString('pt-BR')} km total</div>
        </div>
        <div style="overflow-x:auto"><table class="table table-sm table-hover" id="tabela-viagens">
          <thead><tr><th>Veículo</th><th>Motorista</th><th>Destino</th><th>Saída</th><th>KM Saída</th><th>KM Chegada</th><th>Percorrido</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`
      : _empty('Nenhuma viagem registrada.', `<button class="btn btn-sm btn-primary" onclick="document.querySelector('[data-bs-dismiss=modal]')?.click()">Fechar e Registrar Viagem</button>`);
  },

  f04FinalizarViagem: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🏁 Finalizar Viagem', size: 'lg', body: _spinner() });
    const r = await API.get('/frota/viagens?status=em_andamento');
    if (!r.success || !r.data.length) { el.innerHTML = _empty('Nenhuma viagem em andamento.'); return; }
    const opts = r.data.map(v => `<option value="${v.id}">${v.placa || v.veiculo_placa || '?'} — ${v.destino} (${v.motorista_nome || '?'})</option>`).join('');
    el.innerHTML = `<form id="form-fim-viagem">
      <div class="mb-3"><label class="form-label">Viagem em Andamento *</label>
        <select name="viagem_id" class="form-select" required><option value="">Selecione...</option>${opts}</select>
      </div>
      <div class="mb-3"><label class="form-label">KM de Chegada *</label><input name="km_chegada" type="number" class="form-control" required></div>
      <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
    </form>`;
    setFooter(`<button class="btn btn-success" id="btn-finalizar-viagem">Finalizar</button>`);
    document.getElementById('btn-finalizar-viagem').onclick = async () => {
      const f = document.getElementById('form-fim-viagem');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const body = Object.fromEntries(new FormData(f).entries());
      const { viagem_id, ...data } = body;
      await _withSubmit(document.getElementById('btn-finalizar-viagem'), async () => {
        const res = await API.put(`/frota/viagens/${viagem_id}/finalizar`, data);
        if (res.success) showToast('Viagem finalizada!', 'success');
        else showToast(res.message || 'Erro ao finalizar.', 'danger');
      });
    };
  },

  f05Abastecimento: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '⛽ Abastecimentos', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/abastecimentos?limit=50');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar abastecimentos.'); return; }
    const totalLitros = r.data.reduce((s, a) => s + Number(a.litros || 0), 0);
    const totalValor  = r.data.reduce((s, a) => s + Number(a.valor_total || 0), 0);
    const rows = r.data.map(a => `<tr>
      <td><code>${a.placa || '—'}</code></td>
      <td>${Number(a.litros).toLocaleString('pt-BR',{maximumFractionDigits:2})} L</td>
      <td>${_fmtMoney(a.valor_total)}</td>
      <td>${a.km_atual ? Number(a.km_atual).toLocaleString('pt-BR') + ' km' : '—'}</td>
      <td>${_fmtDate(a.data_abastecimento)}</td>
      <td><span class="badge bg-secondary">${a.tipo_combustivel || '—'}</span></td>
      <td>${a.posto || '—'}</td>
    </tr>`).join('');
    el.innerHTML = rows
      ? `<div class="row g-2 mb-2 align-items-center">
          <div class="col"><input id="filtro-abast" class="form-control form-control-sm" placeholder="Buscar por placa, posto ou combustível..." oninput="(()=>{const q=this.value.toLowerCase();document.querySelectorAll('#tabela-abast tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')})()" /></div>
          <div class="col-auto small text-muted">${r.data.length} registros · ${totalLitros.toLocaleString('pt-BR',{maximumFractionDigits:0})} L · ${_fmtMoney(totalValor)}</div>
        </div>
        <div style="overflow-x:auto"><table class="table table-sm table-hover" id="tabela-abast"><thead><tr><th>Veículo</th><th>Litros</th><th>Valor</th><th>KM</th><th>Data</th><th>Combustível</th><th>Posto</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : _empty('Nenhum abastecimento registrado.', `<button class="btn btn-sm btn-primary" id="btn-empty-abast">+ Registrar Abastecimento</button>`);
    setFooter(`<button class="btn btn-primary" id="btn-novo-abast">+ Registrar Abastecimento</button>`);
    document.getElementById('btn-novo-abast').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
      el.innerHTML = `<form id="form-abast">
        <div class="mb-3"><label class="form-label">Veículo *</label>
          <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
        </div>
        <div class="row g-2">
          <div class="col-4"><label class="form-label">Litros *</label><input name="litros" type="number" step="0.01" class="form-control" required></div>
          <div class="col-4"><label class="form-label">Valor Total *</label><input name="valor_total" type="number" step="0.01" class="form-control" required></div>
          <div class="col-4"><label class="form-label">KM Atual</label><input name="km_atual" type="number" class="form-control"></div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-6"><label class="form-label">Tipo de Combustível</label>
            <select name="tipo_combustivel" class="form-select">
              <option value="diesel">Diesel</option><option value="gasolina">Gasolina</option>
              <option value="etanol">Etanol</option><option value="gnv">GNV</option>
            </select>
          </div>
          <div class="col-6"><label class="form-label">Data *</label><input name="data_abastecimento" type="date" class="form-control" required></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Posto / Fornecedor</label><input name="posto" class="form-control"></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-abast">Salvar</button>`);
      document.getElementById('btn-salvar-abast').onclick = async () => {
        const f = document.getElementById('form-abast');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-abast'), async () => {
          const res = await API.post('/frota/abastecimentos', body);
          if (res.success) { showToast('Abastecimento registrado!', 'success'); FrotasForms.f05Abastecimento(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f06Manutencao: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🔧 Manutenções', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/manutencoes?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar manutenções.'); return; }
    const rows = r.data.map(m => `<tr>
      <td><code>${m.placa || '—'}</code></td>
      <td>${m.tipo === 'preventiva' ? '<span class="badge bg-info">Preventiva</span>' : '<span class="badge bg-danger">Corretiva</span>'}</td>
      <td>${m.descricao?.substring(0, 40) || '—'}</td>
      <td>${m.fornecedor || '—'}</td>
      <td>${_fmtMoney(m.valor_real || m.valor_estimado)}</td>
      <td>${_badge(m.status)}</td>
      ${user.nivel_acesso >= 4 && m.status !== 'concluida' && m.status !== 'cancelada' ? `<td><button class="btn btn-sm btn-outline-success py-0" onclick="FrotasForms._concluirManutencao(${m.id},event)">✓</button></td>` : '<td></td>'}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Veículo</th><th>Tipo</th><th>Descrição</th><th>Oficina</th><th>Custo</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma manutenção registrada.', user.nivel_acesso >= 3 ? `<button class="btn btn-sm btn-primary" onclick="document.getElementById('btn-nova-manut')?.click()">+ Registrar Manutenção</button>` : '');
    if (user.nivel_acesso >= 3) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-manut">+ Nova Manutenção</button>`);
      document.getElementById('btn-nova-manut').onclick = async () => {
        const rV = await API.get('/frota/veiculos');
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
        el.innerHTML = `<form id="form-manut">
          <div class="mb-3"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required>
                <option value="preventiva">Preventiva</option><option value="corretiva">Corretiva</option>
              </select>
            </div>
            <div class="col-6"><label class="form-label">Data de Entrada</label><input name="data_entrada" type="date" class="form-control"></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Descrição *</label><textarea name="descricao" class="form-control" rows="3" required></textarea></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Oficina / Fornecedor</label><input name="fornecedor" class="form-control"></div>
            <div class="col-6"><label class="form-label">Custo Estimado</label><input name="valor_estimado" type="number" step="0.01" class="form-control"></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-manut">Salvar</button>`);
        document.getElementById('btn-salvar-manut').onclick = async () => {
          const f = document.getElementById('form-manut');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-manut'), async () => {
            const res = await API.post('/frota/manutencoes', body);
            if (res.success) { showToast('Manutenção registrada!', 'success'); FrotasForms.f06Manutencao(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f07Multas: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🚨 Multas de Trânsito', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/multas?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar multas.'); return; }
    const rows = r.data.map(m => `<tr>
      <td><code>${m.placa || '—'}</code></td>
      <td>${m.motorista_nome || '—'}</td>
      <td>${m.descricao?.substring(0, 40) || '—'}</td>
      <td>${_fmtMoney(m.valor)}</td>
      <td>${_fmtDate(m.data_infracao)}</td>
      <td>${m.status_pagamento === 'pago' ? '<span class="badge bg-success">Pago</span>' : m.status_pagamento === 'contestado' ? '<span class="badge bg-warning text-dark">Contestado</span>' : '<span class="badge bg-danger">Pendente</span>'}</td>
      ${user.nivel_acesso >= 4 && m.status_pagamento === 'pendente' ? `<td><button class="btn btn-sm btn-outline-success py-0" onclick="FrotasForms._pagarMulta(${m.id},event)">💳 Pagar</button></td>` : '<td></td>'}
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>Veículo</th><th>Motorista</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Pagamento</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma multa registrada.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-multa">+ Registrar Multa</button>`);
      document.getElementById('btn-nova-multa').onclick = async () => {
        const [rV, rM] = await Promise.all([API.get('/frota/veiculos'), API.get('/frota/motoristas')]);
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
        const motOpts = (rM.data || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
        el.innerHTML = `<form id="form-multa">
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Veículo *</label>
              <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
            </div>
            <div class="col-6"><label class="form-label">Motorista</label>
              <select name="motorista_id" class="form-select"><option value="">Selecione...</option>${motOpts}</select>
            </div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Descrição da Infração *</label><input name="descricao" class="form-control" required placeholder="Ex: Excesso de velocidade — Rod. BR-050 km 120"></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Valor *</label><input name="valor" type="number" step="0.01" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Data da Infração *</label><input name="data_infracao" type="date" class="form-control" required></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-multa">Salvar</button>`);
        document.getElementById('btn-salvar-multa').onclick = async () => {
          const f = document.getElementById('form-multa');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-multa'), async () => {
            const res = await API.post('/frota/multas', body);
            if (res.success) { showToast('Multa registrada!', 'success'); FrotasForms.f07Multas(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f08Checklist: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '✅ Checklist de Veículo', size: 'lg', body: _spinner() });
    const r = await API.get('/frota/checklists?limit=10');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar checklists.'); return; }
    const rows = r.data.map(c => `<tr>
      <td><code>${c.placa || '—'}</code></td>
      <td>${c.tipo === 'pre_viagem' ? 'Pré-Viagem' : c.tipo === 'pos_viagem' ? 'Pós-Viagem' : 'Mensal'}</td>
      <td>${c.usuario_nome || '—'}</td>
      <td>${Array.isArray(c.itens_nok) ? c.itens_nok.length : (typeof c.itens_nok === 'string' ? JSON.parse(c.itens_nok || '[]').length : 0)} NC(s)</td>
      <td>${_fmtDate(c.criado_em)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Veículo</th><th>Tipo</th><th>Motorista</th><th>NCs</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum checklist registrado.');
    setFooter(`<button class="btn btn-primary" id="btn-novo-checklist">+ Novo Checklist</button>`);
    document.getElementById('btn-novo-checklist').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
      const itens = ['Pneus', 'Freios', 'Óleo', 'Água', 'Luzes', 'Estepe', 'Macaco', 'Documentos'];
      el.innerHTML = `<form id="form-checklist">
        <div class="row g-2 mb-3">
          <div class="col-6"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="col-6"><label class="form-label">Tipo *</label>
            <select name="tipo" class="form-select" required>
              <option value="pre_viagem">Pré-Viagem (Saída)</option>
              <option value="pos_viagem">Pós-Viagem (Retorno)</option>
              <option value="mensal">Inspeção Mensal</option>
            </select>
          </div>
        </div>
        <h6>Itens</h6>
        <div class="row g-2">
          ${itens.map(item => `<div class="col-6">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="item_${item.toLowerCase()}" id="ci_${item.toLowerCase()}" value="ok">
              <label class="form-check-label" for="ci_${item.toLowerCase()}">${item} OK</label>
            </div>
          </div>`).join('')}
        </div>
        <div class="mb-3 mt-3"><label class="form-label">Observações / Não Conformidades</label><textarea name="observacao" class="form-control" rows="3"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-checklist">Salvar Checklist</button>`);
      document.getElementById('btn-salvar-checklist').onclick = async () => {
        const f = document.getElementById('form-checklist');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const fd = new FormData(f);
        const itens_ok = [], itens_nok = [];
        itens.forEach(item => {
          if (fd.get(`item_${item.toLowerCase()}`) === 'ok') itens_ok.push(item);
          else itens_nok.push(item);
        });
        const body = {
          veiculo_id: fd.get('veiculo_id'),
          tipo: fd.get('tipo'),
          observacao: fd.get('observacao'),
          itens_ok: JSON.stringify(itens_ok),
          itens_nok: JSON.stringify(itens_nok),
        };
        await _withSubmit(document.getElementById('btn-salvar-checklist'), async () => {
          const res = await API.post('/frota/checklists', body);
          if (res.success) { showToast('Checklist salvo!', 'success'); FrotasForms.f08Checklist(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f09GerenciarEscalas: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '📅 Gerenciar Escalas da Frota', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="FrotasForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Motorista</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/frota/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-frt">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-frt').onclick = () => {
      el.innerHTML = `<form id="form-esc-frt">
        <div class="mb-3"><label class="form-label">Motorista</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
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
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-frt">Salvar</button>`);
      document.getElementById('btn-salvar-esc-frt').onclick = async () => {
        const f = document.getElementById('form-esc-frt');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-frt'), async () => {
          const res = await API.post('/frota/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); FrotasForms.f09GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _concluirManutencao: async (id, event) => {
    event.target.disabled = true;
    const { el: el2, setFooter: sf } = _frotaModal({ title: '✓ Concluir Manutenção', size: 'sm',
      body: `<form id="form-conc-manut">
        <div class="mb-3"><label class="form-label">Valor Real (R$)</label>
          <input name="valor_real" type="number" step="0.01" class="form-control" placeholder="0,00">
        </div>
        <div class="mb-3"><label class="form-label">Data de Conclusão</label>
          <input name="data_conclusao" type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="mb-3"><label class="form-label">Observação</label>
          <textarea name="observacao" class="form-control" rows="2"></textarea>
        </div>
      </form>` });
    sf(`<button class="btn btn-success" id="btn-conc-manut">Marcar como Concluída</button>`);
    document.getElementById('btn-conc-manut').onclick = async () => {
      const f = document.getElementById('form-conc-manut');
      const data = Object.fromEntries(new FormData(f).entries());
      data.status = 'concluida';
      if (!data.valor_real) delete data.valor_real;
      const btn = document.getElementById('btn-conc-manut');
      await _withSubmit(btn, async () => {
        const res = await API.put(`/frota/manutencoes/${id}`, data);
        if (res.success) { showToast('Manutenção concluída!', 'success'); document.querySelector('[data-bs-dismiss="modal"]')?.click(); }
        else { event.target.disabled = false; showToast(res.message || 'Erro.', 'danger'); }
      });
    };
  },

  _pagarMulta: async (id, event) => {
    event.target.disabled = true;
    if (!confirm('Confirmar pagamento desta multa?')) { event.target.disabled = false; return; }
    const res = await API.put(`/frota/multas/${id}`, { status_pagamento: 'pago' });
    if (res.success) showToast('Multa marcada como paga!', 'success');
    else { event.target.disabled = false; showToast(res.message || 'Erro.', 'danger'); }
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/frota/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },

  // ── f10 Localização de Motoristas ─────────────────────────────────────────────
  f10LocalizacaoMotoristas: async (user) => {
    const { el } = _frotaModal({ title: '📍 Localização de Motoristas', size: 'lg', body: _spinner() });
    const r = await API.get('/frota/localizacao');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar localização.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhum motorista em rota no momento.'); return; }
    const rows = r.data.map(v => `<tr>
      <td>${v.placa} — ${v.modelo || ''}</td>
      <td>${v.motorista_nome || '—'}</td>
      <td>${v.destino || '—'}</td>
      <td>${_badge(v.viagem_status)}</td>
      <td>${_fmtDate(v.data_saida)}</td>
    </tr>`).join('');
    el.innerHTML = `<div class="alert alert-info py-2 mb-3">Exibe viagens em andamento / agendadas</div>
      <table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Motorista</th><th>Destino</th><th>Status</th><th>Saída</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  // ── f04 Gestão de Motoristas / CNH ────────────────────────────────────────────
  f04GestaoMotoristas: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '👤 Gestão de Motoristas / CNH', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/motoristas-cnh');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar motoristas.'); return; }
      const hoje = new Date().toISOString().split('T')[0];
      const em30 = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
      const rows = r.data.map(m => {
        const cnhVencida = m.cnh_validade && m.cnh_validade < hoje;
        const cnhProxima = m.cnh_validade && m.cnh_validade <= em30 && !cnhVencida;
        const cnhTag = cnhVencida ? '<span class="badge bg-danger ms-1">VENCIDA</span>' : cnhProxima ? '<span class="badge bg-warning text-dark ms-1">A VENCER</span>' : '';
        const toxVenc = m.toxicologico_validade && m.toxicologico_validade < hoje ? '<span class="badge bg-danger">VENCIDO</span>' : _fmtDate(m.toxicologico_validade);
        const rowCor = cnhVencida ? ' class="table-danger"' : cnhProxima ? ' class="table-warning"' : '';
        return `<tr${rowCor}>
          <td>${m.nome}</td><td>${m.cnh_numero || '—'}</td><td>${m.cnh_categoria || '—'}</td>
          <td>${_fmtDate(m.cnh_validade)}${cnhTag}</td><td>${toxVenc}</td><td>${_fmtDate(m.aso_validade)}</td><td>${_badge(m.status)}</td>
        </tr>`;
      }).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Nome</th><th>CNH Nº</th><th>Cat.</th><th>Validade CNH</th><th>Toxicológico</th><th>ASO</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum motorista cadastrado.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-mot">+ Cadastrar Motorista</button>`);
    document.getElementById('btn-novo-mot').onclick = () => {
      el.innerHTML = `<form id="form-mot">
        <div class="row g-2">
          <div class="col-8"><label class="form-label">Nome Completo *</label><input name="nome" class="form-control" required></div>
          <div class="col-4"><label class="form-label">CPF</label><input name="cpf" class="form-control"></div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-4"><label class="form-label">Nº CNH *</label><input name="cnh_numero" class="form-control" required></div>
          <div class="col-4"><label class="form-label">Categoria *</label>
            <select name="cnh_categoria" class="form-select" required>
              <option value="B">B</option><option value="C">C</option><option value="D">D</option>
              <option value="E">E</option><option value="AB">AB</option><option value="AC">AC</option>
            </select>
          </div>
          <div class="col-4"><label class="form-label">Validade CNH *</label><input name="cnh_validade" type="date" class="form-control" required></div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-6"><label class="form-label">Validade Toxicológico</label><input name="toxicologico_validade" type="date" class="form-control"></div>
          <div class="col-6"><label class="form-label">Validade ASO</label><input name="aso_validade" type="date" class="form-control"></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-mot">Salvar</button>`);
      document.getElementById('btn-salvar-mot').onclick = async () => {
        const f = document.getElementById('form-mot');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-mot'), async () => {
          const res = await API.post('/frota/motoristas-cnh', body);
          if (res.success) { showToast('Motorista cadastrado!', 'success'); FrotasForms.f04GestaoMotoristas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  // ── f05 Rotas de Coleta ────────────────────────────────────────────────────────
  f05RotasColeta: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🚛 Rotas de Coleta', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/rotas?tipo=coleta');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar rotas.'); return; }
      const rows = r.data.map(rt => `<tr>
        <td>${rt.nome}</td><td>${rt.descricao?.substring(0,40) || '—'}</td>
        <td>${rt.km_total ? rt.km_total + ' km' : '—'}</td>
        <td>${rt.tempo_estimado_min ? rt.tempo_estimado_min + ' min' : '—'}</td>
        <td>${rt.veiculo_padrao_placa || '—'}</td><td>${_badge(rt.status)}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Nome</th><th>Descrição</th><th>KM</th><th>Tempo Est.</th><th>Veículo Padrão</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhuma rota de coleta cadastrada.');
    };
    await load();
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-rota-c">+ Nova Rota</button>`);
      document.getElementById('btn-nova-rota-c').onclick = async () => {
        const rV = await API.get('/frota/veiculos');
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
        el.innerHTML = `<form id="form-rota-c"><input type="hidden" name="tipo" value="coleta">
          <div class="mb-3"><label class="form-label">Nome da Rota *</label><input name="nome" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Descrição / Pontos de Parada</label><textarea name="descricao" class="form-control" rows="3"></textarea></div>
          <div class="row g-2">
            <div class="col-4"><label class="form-label">KM Total</label><input name="km_total" type="number" step="0.1" class="form-control"></div>
            <div class="col-4"><label class="form-label">Tempo Est. (min)</label><input name="tempo_estimado_min" type="number" class="form-control"></div>
            <div class="col-4"><label class="form-label">Veículo Padrão</label>
              <select name="veiculo_padrao_id" class="form-select"><option value="">—</option>${veicOpts}</select>
            </div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-rota-c">Salvar</button>`);
        document.getElementById('btn-salvar-rota-c').onclick = async () => {
          const f = document.getElementById('form-rota-c');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-rota-c'), async () => {
            const res = await API.post('/frota/rotas', body);
            if (res.success) { showToast('Rota criada!', 'success'); FrotasForms.f05RotasColeta(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f06 Consumo de Veículos ────────────────────────────────────────────────────
  f06ConsumoVeiculos: async (user) => {
    const { el } = _frotaModal({ title: '⛽ Consumo de Veículos', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/consumo');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados de consumo.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhum dado de abastecimento encontrado.'); return; }
    const rows = r.data.map(c => {
      const kml = parseFloat(c.km_por_litro);
      const cor = !kml ? '' : kml >= 4 ? 'color:#4ade80' : kml >= 2.5 ? 'color:#fb923c' : 'color:#f87171';
      return `<tr>
        <td><code>${c.placa}</code></td><td>${c.modelo || '—'}</td>
        <td style="text-align:center">${c.total_abastecimentos}</td>
        <td>${Number(c.total_litros || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L</td>
        <td>${_fmtMoney(c.custo_total)}</td>
        <td>${c.km_rodados ? Number(c.km_rodados).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td><strong style="${cor}">${kml ? kml + ' km/L' : '—'}</strong></td>
      </tr>`;
    }).join('');
    el.innerHTML = `
      <div class="alert alert-info py-2 mb-3 small">Eficiência: <span style="color:#4ade80">≥4 km/L</span> bom · <span style="color:#fb923c">≥2.5</span> atenção · <span style="color:#f87171">&lt;2.5</span> ruim</div>
      <table class="table table-sm table-hover">
        <thead><tr><th>Placa</th><th>Modelo</th><th style="text-align:center">Abast.</th><th>Total Litros</th><th>Custo Total</th><th>KM Rodados</th><th>Eficiência</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  // ── f07 Depreciação de Veículos ────────────────────────────────────────────────
  f07DepreciacaoVeiculos: async (user) => {
    const { el } = _frotaModal({ title: '📉 Depreciação de Veículos', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/depreciacao');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados.'); return; }
    const rows = r.data.map(v => {
      const pct = Math.min(v.depreciacao_pct || 0, 100);
      const cor = pct >= 80 ? 'danger' : pct >= 50 ? 'warning' : 'success';
      return `<tr>
        <td>${v.placa}</td><td>${v.modelo || '—'} ${v.marca || ''}</td>
        <td>${v.ano || '—'}</td><td>${v.idade_anos} ano(s)</td>
        <td>${v.km_atual ? Number(v.km_atual).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td><div class="progress" style="min-width:80px"><div class="progress-bar bg-${cor}" style="width:${pct}%">${pct}%</div></div></td>
      </tr>`;
    }).join('');
    el.innerHTML = `<div class="alert alert-info py-2 mb-3 small">Depreciação estimada: 10% ao ano (linear). Referência gerencial.</div>
      <table class="table table-sm table-hover">
        <thead><tr><th>Placa</th><th>Modelo</th><th>Ano</th><th>Idade</th><th>KM Atual</th><th>Depreciação</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
  },

  // ── f08 Rotas de Entrega ───────────────────────────────────────────────────────
  f08RotaEntrega: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '📦 Rotas de Entrega', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/rotas?tipo=entrega');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar rotas.'); return; }
      const rows = r.data.map(rt => `<tr>
        <td>${rt.nome}</td><td>${rt.descricao?.substring(0,40) || '—'}</td>
        <td>${rt.km_total ? rt.km_total + ' km' : '—'}</td>
        <td>${rt.tempo_estimado_min ? rt.tempo_estimado_min + ' min' : '—'}</td>
        <td>${_badge(rt.status)}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Nome</th><th>Descrição</th><th>KM</th><th>Tempo Est.</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhuma rota de entrega cadastrada.');
    };
    await load();
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-rota-e">+ Nova Rota</button>`);
      document.getElementById('btn-nova-rota-e').onclick = async () => {
        const rV = await API.get('/frota/veiculos');
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
        el.innerHTML = `<form id="form-rota-e"><input type="hidden" name="tipo" value="entrega">
          <div class="mb-3"><label class="form-label">Nome da Rota *</label><input name="nome" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Descrição / Pontos de Entrega</label><textarea name="descricao" class="form-control" rows="3"></textarea></div>
          <div class="row g-2">
            <div class="col-4"><label class="form-label">KM Total</label><input name="km_total" type="number" step="0.1" class="form-control"></div>
            <div class="col-4"><label class="form-label">Tempo Est. (min)</label><input name="tempo_estimado_min" type="number" class="form-control"></div>
            <div class="col-4"><label class="form-label">Veículo Padrão</label>
              <select name="veiculo_padrao_id" class="form-select"><option value="">—</option>${veicOpts}</select>
            </div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-rota-e">Salvar</button>`);
        document.getElementById('btn-salvar-rota-e').onclick = async () => {
          const f = document.getElementById('form-rota-e');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-rota-e'), async () => {
            const res = await API.post('/frota/rotas', body);
            if (res.success) { showToast('Rota criada!', 'success'); FrotasForms.f08RotaEntrega(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f09 Solicitação de Uso de Veículos ────────────────────────────────────────
  f09SolicitacaoUsoVeiculos: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🔑 Solicitação de Uso de Veículos', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/solicitacoes-uso');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar solicitações.'); return; }
      const rows = r.data.map(s => {
        const botoes = (user.nivel_acesso >= 4 && s.status === 'pendente')
          ? `<button class="btn btn-success btn-sm me-1" onclick="FrotasForms._responderSolicitacao(${s.id},'aprovada',event)">Aprovar</button>
             <button class="btn btn-danger btn-sm" onclick="FrotasForms._responderSolicitacao(${s.id},'negada',event)">Negar</button>` : '';
        return `<tr>
          <td>${s.solicitante_nome || '—'}</td><td>${s.departamento_origem || '—'}</td>
          <td>${s.destino}</td><td>${_fmtDate(s.data_necessidade)}</td>
          <td>${_badge(s.status)}</td><td>${botoes}</td>
        </tr>`;
      }).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Solicitante</th><th>Setor</th><th>Destino</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhuma solicitação encontrada.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-nova-solic">+ Nova Solicitação</button>`);
    document.getElementById('btn-nova-solic').onclick = () => {
      el.innerHTML = `<form id="form-solic">
        <div class="mb-3"><label class="form-label">Destino *</label><input name="destino" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Motivo</label><textarea name="motivo" class="form-control" rows="2"></textarea></div>
        <div class="row g-2">
          <div class="col-4"><label class="form-label">Data Necessária *</label><input name="data_necessidade" type="date" class="form-control" required></div>
          <div class="col-4"><label class="form-label">Hora Saída</label><input name="hora_saida" type="time" class="form-control"></div>
          <div class="col-4"><label class="form-label">Hora Retorno</label><input name="hora_retorno" type="time" class="form-control"></div>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-solic">Enviar Solicitação</button>`);
      document.getElementById('btn-salvar-solic').onclick = async () => {
        const f = document.getElementById('form-solic');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-solic'), async () => {
          const res = await API.post('/frota/solicitacoes-uso', body);
          if (res.success) { showToast('Solicitação enviada!', 'success'); FrotasForms.f09SolicitacaoUsoVeiculos(user); }
          else showToast(res.message || 'Erro ao enviar.', 'danger');
        });
      };
    };
  },

  _responderSolicitacao: async (id, status, event) => {
    event.target.disabled = true;
    const res = await API.put(`/frota/solicitacoes-uso/${id}`, { status });
    if (res.success) showToast(status === 'aprovada' ? 'Aprovada!' : 'Negada.', status === 'aprovada' ? 'success' : 'warning');
    else showToast(res.message || 'Erro.', 'danger');
  },

  // ── f11 Dados Técnicos dos Caminhões ──────────────────────────────────────────
  f11DadosCaminhoes: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🔩 Dados Técnicos dos Caminhões', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/dados-tecnicos');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados.'); return; }
      const rows = r.data.map(d => `<tr>
        <td>${d.placa}</td><td>${_fmtDate(d.data_registro)}</td>
        <td>${d.km_odometro ? Number(d.km_odometro).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td>${_badge(d.nivel_oleo)}</td><td>${_badge(d.nivel_agua)}</td>
        <td>${_badge(d.freios)}</td><td>${_badge(d.iluminacao)}</td>
        <td>${d.registrado_por_nome || '—'}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Data</th><th>Hodômetro</th><th>Óleo</th><th>Água</th><th>Freios</th><th>Luz</th><th>Registrado por</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum dado técnico registrado.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-dado-tec">+ Registrar</button>`);
    document.getElementById('btn-novo-dado-tec').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
      el.innerHTML = `<form id="form-dado-tec">
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="col-3"><label class="form-label">Data</label><input name="data_registro" type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="col-3"><label class="form-label">Hodômetro (km)</label><input name="km_odometro" type="number" class="form-control"></div>
        </div>
        <div class="row g-2">
          <div class="col-3"><label class="form-label">Nível Óleo</label>
            <select name="nivel_oleo" class="form-select">
              <option value="ok">OK</option><option value="baixo">Baixo</option><option value="trocar">Trocar</option>
            </select></div>
          <div class="col-3"><label class="form-label">Nível Água</label>
            <select name="nivel_agua" class="form-select">
              <option value="ok">OK</option><option value="baixo">Baixo</option><option value="verificar">Verificar</option>
            </select></div>
          <div class="col-3"><label class="form-label">Freios</label>
            <select name="freios" class="form-select">
              <option value="ok">OK</option><option value="verificar">Verificar</option><option value="urgente">Urgente</option>
            </select></div>
          <div class="col-3"><label class="form-label">Iluminação</label>
            <select name="iluminacao" class="form-select">
              <option value="ok">OK</option><option value="verificar">Verificar</option>
            </select></div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-3"><label class="form-label">Nível ARLA</label>
            <select name="nivel_arla" class="form-select">
              <option value="ok">OK</option><option value="baixo">Baixo</option><option value="trocar">Trocar</option>
            </select></div>
          <div class="col-9"><label class="form-label">Pressão dos Pneus</label>
            <input name="pressao_pneus" class="form-control" placeholder="Ex: DE=110 DD=110 TE=105 TD=105 psi"></div>
        </div>
        <div class="mt-2"><label class="form-label">Observações</label><textarea name="observacoes" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-dado-tec">Salvar</button>`);
      document.getElementById('btn-salvar-dado-tec').onclick = async () => {
        const f = document.getElementById('form-dado-tec');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-dado-tec'), async () => {
          const res = await API.post('/frota/dados-tecnicos', body);
          if (res.success) { showToast('Dados registrados!', 'success'); FrotasForms.f11DadosCaminhoes(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  // ── f12 Plano de Manutenção Preventiva ────────────────────────────────────────
  f12PlanoManutencaoPreventiva: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '📋 Plano de Manutenção Preventiva', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/preventiva');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar plano.'); return; }
      const rows = r.data.map(p => `<tr>
        <td>${p.placa || '—'}</td><td>${p.tipo_servico}</td>
        <td>${p.descricao?.substring(0,30) || '—'}</td>
        <td>${p.intervalo_km ? Number(p.intervalo_km).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td>${p.km_proxima ? Number(p.km_proxima).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td>${_fmtDate(p.data_proxima)}</td><td>${_badge(p.status)}</td>
        ${user.nivel_acesso >= 4 ? `<td><button class="btn btn-sm btn-outline-success" onclick="FrotasForms._executarPreventiva(${p.id},event)">Executado</button></td>` : '<td></td>'}
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Serviço</th><th>Descrição</th><th>Intervalo</th><th>Próx. KM</th><th>Próx. Data</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum plano preventivo cadastrado.');
    };
    await load();
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-prev">+ Adicionar ao Plano</button>`);
      document.getElementById('btn-novo-prev').onclick = async () => {
        const rV = await API.get('/frota/veiculos');
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
        el.innerHTML = `<form id="form-prev">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Veículo *</label>
              <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
            </div>
            <div class="col-6"><label class="form-label">Tipo de Serviço *</label>
              <select name="tipo_servico" class="form-select" required>
                <option value="troca_oleo">Troca de Óleo</option>
                <option value="revisao_freios">Revisão de Freios</option>
                <option value="troca_filtros">Troca de Filtros</option>
                <option value="alinhamento">Alinhamento/Balanceamento</option>
                <option value="revisao_geral">Revisão Geral</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>
          <div class="mb-2"><label class="form-label">Descrição</label><input name="descricao" class="form-control"></div>
          <div class="row g-2">
            <div class="col-3"><label class="form-label">Intervalo (km)</label><input name="intervalo_km" type="number" class="form-control"></div>
            <div class="col-3"><label class="form-label">Intervalo (dias)</label><input name="intervalo_dias" type="number" class="form-control"></div>
            <div class="col-3"><label class="form-label">KM Última Exec.</label><input name="km_ultima_execucao" type="number" class="form-control"></div>
            <div class="col-3"><label class="form-label">Data Última Exec.</label><input name="data_ultima_execucao" type="date" class="form-control"></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-prev">Salvar</button>`);
        document.getElementById('btn-salvar-prev').onclick = async () => {
          const f = document.getElementById('form-prev');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-prev'), async () => {
            const res = await API.post('/frota/preventiva', body);
            if (res.success) { showToast('Plano atualizado!', 'success'); FrotasForms.f12PlanoManutencaoPreventiva(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  _executarPreventiva: async (id, event) => {
    event.target.disabled = true;
    const km = prompt('Informe o KM atual de execução:');
    if (!km) { event.target.disabled = false; return; }
    const res = await API.put(`/frota/preventiva/${id}`, {
      km_ultima_execucao: km,
      data_ultima_execucao: new Date().toISOString().split('T')[0],
      status: 'em_dia'
    });
    if (res.success) showToast('Manutenção executada registrada!', 'success');
    else showToast(res.message || 'Erro.', 'danger');
  },

  // ── f13 Histórico de Manutenção Corretiva ─────────────────────────────────────
  f13HistoricoManutencaoCorretiva: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🔧 Histórico — Manutenção Corretiva', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/manutencoes');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar manutenções.'); return; }
    const rows = r.data.map(m => `<tr>
      <td>${m.placa || '—'}</td><td>${m.descricao?.substring(0,40) || '—'}</td>
      <td>${m.fornecedor || '—'}</td><td>${_fmtMoney(m.valor_real || m.valor_estimado)}</td>
      <td>${_fmtDate(m.criado_em)}</td><td>${_badge(m.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover">
      <thead><tr><th>Veículo</th><th>Descrição</th><th>Fornecedor</th><th>Valor</th><th>Data</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>` : _empty('Nenhuma manutenção corretiva registrada.');
    if (user.nivel_acesso >= 3) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-corr">+ Registrar Corretiva</button>`);
      document.getElementById('btn-nova-corr').onclick = async () => {
        const rV = await API.get('/frota/veiculos');
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
        el.innerHTML = `<form id="form-corr">
          <div class="mb-2"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="mb-2"><label class="form-label">Descrição do Problema *</label><textarea name="descricao" class="form-control" rows="3" required></textarea></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Oficina / Fornecedor</label><input name="fornecedor" class="form-control"></div>
            <div class="col-6"><label class="form-label">Valor Estimado</label><input name="valor_estimado" type="number" step="0.01" class="form-control"></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-corr">Abrir OS</button>`);
        document.getElementById('btn-salvar-corr').onclick = async () => {
          const f = document.getElementById('form-corr');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = { ...Object.fromEntries(new FormData(f).entries()), tipo: 'corretiva' };
          await _withSubmit(document.getElementById('btn-salvar-corr'), async () => {
            const res = await API.post('/frota/manutencoes', body);
            if (res.success) { showToast('OS aberta!', 'success'); FrotasForms.f13HistoricoManutencaoCorretiva(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f14 Gestão de Pneus ────────────────────────────────────────────────────────
  f14GestaoPneus: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🔄 Gestão de Pneus', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/pneus');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pneus.'); return; }
      const rows = r.data.map(p => `<tr>
        <td>${p.placa || '—'}</td><td>${p.numero_fogo || '—'}</td>
        <td>${p.marca || '—'} ${p.dimensao ? '(' + p.dimensao + ')' : ''}</td>
        <td>${p.posicao || '—'}</td><td>${_fmtDate(p.data_instalacao)}</td>
        <td>${p.km_rodados ? Number(p.km_rodados).toLocaleString('pt-BR') + ' km' : '—'}</td>
        <td>${_badge(p.status)}</td>
        <td><button class="btn btn-xs btn-sm btn-outline-secondary" onclick="FrotasForms._atualizarPneu(${p.id},'${p.posicao||''}','${p.status}',event)">↻</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Nº Fogo</th><th>Marca/Dim.</th><th>Posição</th><th>Instalação</th><th>KM</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum pneu cadastrado.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-pneu">+ Registrar Pneu</button>`);
    document.getElementById('btn-novo-pneu').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
      el.innerHTML = `<form id="form-pneu">
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="col-6"><label class="form-label">Nº de Fogo</label><input name="numero_fogo" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Marca</label><input name="marca" class="form-control"></div>
          <div class="col-4"><label class="form-label">Dimensão</label><input name="dimensao" class="form-control" placeholder="275/80R22.5"></div>
          <div class="col-4"><label class="form-label">Posição</label>
            <select name="posicao" class="form-select">
              <option value="">—</option>
              <option value="dianteiro_esq">Dianteiro Esq.</option><option value="dianteiro_dir">Dianteiro Dir.</option>
              <option value="traseiro_esq_int">Traseiro Esq. Int.</option><option value="traseiro_esq_ext">Traseiro Esq. Ext.</option>
              <option value="traseiro_dir_int">Traseiro Dir. Int.</option><option value="traseiro_dir_ext">Traseiro Dir. Ext.</option>
              <option value="estepe">Estepe</option>
            </select>
          </div>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">KM de Instalação</label><input name="km_instalacao" type="number" class="form-control"></div>
          <div class="col-6"><label class="form-label">Data Instalação</label><input name="data_instalacao" type="date" class="form-control"></div>
        </div>
        <div class="mt-2"><label class="form-label">Observação</label><input name="observacao" class="form-control"></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-pneu">Salvar</button>`);
      document.getElementById('btn-salvar-pneu').onclick = async () => {
        const f = document.getElementById('form-pneu');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-pneu'), async () => {
          const res = await API.post('/frota/pneus', body);
          if (res.success) { showToast('Pneu registrado!', 'success'); FrotasForms.f14GestaoPneus(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _atualizarPneu: async (id, posicaoAtual, statusAtual, event) => {
    event.stopPropagation();
    const posOpts = ['dianteiro_esq','dianteiro_dir','traseiro_esq_int','traseiro_esq_ext','traseiro_dir_int','traseiro_dir_ext','estepe','estoque'];
    const body = `<form id="form-upd-pneu">
      <div class="mb-3"><label class="form-label">Nova Posição / Localização</label>
        <select name="posicao" class="form-select">
          ${posOpts.map(p=>`<option value="${p}"${p===posicaoAtual?' selected':''}>${p.replace(/_/g,' ')}</option>`).join('')}
        </select>
      </div>
      <div class="mb-3"><label class="form-label">Status</label>
        <select name="status" class="form-select">
          <option value="em_uso"${statusAtual==='em_uso'?' selected':''}>Em Uso</option>
          <option value="estoque"${statusAtual==='estoque'?' selected':''}>Estoque</option>
          <option value="recapado"${statusAtual==='recapado'?' selected':''}>Recapado</option>
          <option value="descartado"${statusAtual==='descartado'?' selected':''}>Descartado</option>
        </select>
      </div>
      <div class="mb-3"><label class="form-label">KM Rodados (total acumulado)</label>
        <input name="km_rodados" type="number" class="form-control">
      </div>
    </form>`;
    const { el: el2, setFooter: sf } = _frotaModal({ title: '↻ Rodízio / Atualizar Pneu', size: 'sm', body });
    sf(`<button class="btn btn-success" id="btn-upd-pneu">Salvar</button>`);
    document.getElementById('btn-upd-pneu').onclick = async () => {
      const f = document.getElementById('form-upd-pneu');
      const data = Object.fromEntries(new FormData(f).entries());
      if (!data.km_rodados) delete data.km_rodados;
      const btn = document.getElementById('btn-upd-pneu');
      await _withSubmit(btn, async () => {
        const res = await API.put(`/frota/pneus/${id}`, data);
        if (res.success) { showToast('Pneu atualizado!', 'success'); document.querySelector('[data-bs-dismiss="modal"]')?.click(); }
        else showToast(res.message || 'Erro.', 'danger');
      });
    };
  },

  // ── f15 Manutenção de Refrigeração ────────────────────────────────────────────
  f15ManutencaoRefrigeracao: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '❄️ Manutenção de Refrigeração (Thermo King)', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/refrigeracao');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const rows = r.data.map(rr => `<tr>
        <td>${rr.placa || '—'}</td><td>${rr.tipo}</td>
        <td>${rr.temperatura_set != null ? rr.temperatura_set + '°C' : '—'}</td>
        <td>${rr.temperatura_real != null ? rr.temperatura_real + '°C' : '—'}</td>
        <td>${_badge(rr.nivel_gas)}</td><td>${_fmtMoney(rr.valor)}</td>
        <td>${_fmtDate(rr.data_registro)}</td><td>${_badge(rr.status)}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Tipo</th><th>Temp. Set</th><th>Temp. Real</th><th>Nível Gás</th><th>Valor</th><th>Data</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum registro de refrigeração.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-nova-refrig">+ Registrar Manutenção</button>`);
    document.getElementById('btn-nova-refrig').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
      el.innerHTML = `<form id="form-refrig">
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="col-6"><label class="form-label">Tipo</label>
            <select name="tipo" class="form-select">
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
              <option value="calibracao">Calibração / Carga de Gás</option>
            </select>
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">Temp. Set (°C)</label><input name="temperatura_set" type="number" step="0.1" class="form-control"></div>
          <div class="col-3"><label class="form-label">Temp. Real (°C)</label><input name="temperatura_real" type="number" step="0.1" class="form-control"></div>
          <div class="col-3"><label class="form-label">Pressão Alta (bar)</label><input name="pressao_alta" type="number" step="0.1" class="form-control"></div>
          <div class="col-3"><label class="form-label">Pressão Baixa (bar)</label><input name="pressao_baixa" type="number" step="0.1" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Nível de Gás</label>
            <select name="nivel_gas" class="form-select">
              <option value="ok">OK</option><option value="baixo">Baixo</option><option value="critico">Crítico</option>
            </select>
          </div>
          <div class="col-4"><label class="form-label">Fornecedor</label><input name="fornecedor" class="form-control"></div>
          <div class="col-4"><label class="form-label">Valor (R$)</label><input name="valor" type="number" step="0.01" class="form-control"></div>
        </div>
        <div class="mb-2"><label class="form-label">Descrição</label><textarea name="descricao" class="form-control" rows="2"></textarea></div>
        <div class="mb-2"><label class="form-label">Data</label><input name="data_registro" type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-refrig">Salvar</button>`);
      document.getElementById('btn-salvar-refrig').onclick = async () => {
        const f = document.getElementById('form-refrig');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-refrig'), async () => {
          const res = await API.post('/frota/refrigeracao', body);
          if (res.success) { showToast('Registrado!', 'success'); FrotasForms.f15ManutencaoRefrigeracao(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  // ── f16 Higienização de Tanques ────────────────────────────────────────────────
  f16HigienizacaoTanques: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🧴 Higienização de Tanques Rodoviários', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/higienizacoes');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const rows = r.data.map(h => `<tr>
        <td>${h.placa || '—'}</td><td>${h.tipo}</td>
        <td>${h.produto_quimico || '—'}</td>
        <td>${h.concentracao ? h.concentracao + '%' : '—'}</td>
        <td>${h.temperatura_agua ? h.temperatura_agua + '°C' : '—'}</td>
        <td>${h.duracao_min ? h.duracao_min + ' min' : '—'}</td>
        <td>${_fmtDate(h.data_higienizacao)}</td>
        <td>${h.aprovado ? '<span class="badge bg-success">Aprovado</span>' : '<span class="badge bg-warning">Pendente</span>'}
          ${!h.aprovado && user.nivel_acesso >= 4 ? `<button class="btn btn-sm btn-success ms-1" onclick="FrotasForms._aprovarHigienizacao(${h.id},event)">✓</button>` : ''}
        </td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Tipo</th><th>Produto</th><th>Conc.</th><th>Temp.</th><th>Duração</th><th>Data</th><th>Aprovação</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhuma higienização registrada.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-nova-hig">+ Registrar Higienização</button>`);
    document.getElementById('btn-nova-hig').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
      el.innerHTML = `<form id="form-hig">
        <div class="mb-2"><label class="form-label">Veículo *</label>
          <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Tipo de CIP</label>
            <select name="tipo" class="form-select">
              <option value="CIP">CIP Completo</option><option value="pre_lavagem">Pré-lavagem</option><option value="sanitizacao">Sanitização</option>
            </select>
          </div>
          <div class="col-6"><label class="form-label">Produto Químico</label><input name="produto_quimico" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">Concentração (%)</label><input name="concentracao" type="number" step="0.1" class="form-control"></div>
          <div class="col-3"><label class="form-label">Temp. Água (°C)</label><input name="temperatura_agua" type="number" step="0.1" class="form-control"></div>
          <div class="col-3"><label class="form-label">Duração (min)</label><input name="duracao_min" type="number" class="form-control"></div>
          <div class="col-3"><label class="form-label">Volume Água (L)</label><input name="volume_agua_litros" type="number" step="0.1" class="form-control"></div>
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-hig">Registrar</button>`);
      document.getElementById('btn-salvar-hig').onclick = async () => {
        const f = document.getElementById('form-hig');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-hig'), async () => {
          const res = await API.post('/frota/higienizacoes', body);
          if (res.success) { showToast('Higienização registrada!', 'success'); FrotasForms.f16HigienizacaoTanques(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _aprovarHigienizacao: async (id, event) => {
    event.target.disabled = true;
    const res = await API.put(`/frota/higienizacoes/${id}/aprovar`, {});
    if (res.success) showToast('Higienização aprovada!', 'success');
    else showToast(res.message || 'Erro.', 'danger');
  },

  // ── f17 / f18 — delegam para funções já existentes ───────────────────────────
  f17ControleAbastecimento: async (user) => FrotasForms.f05Abastecimento(user),
  f18GestaoMultas:          async (user) => FrotasForms.f07Multas(user),

  // ── f19 Controle de Pedágios ──────────────────────────────────────────────────
  f19ControlePedagios: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🛣️ Controle de Pedágios', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/pedagogios');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pedágios.'); return; }
      const rows = r.data.map(p => `<tr>
        <td>${p.placa || '—'}</td><td>${p.praca || '—'}</td><td>${p.rodovia || '—'}</td>
        <td>${_fmtMoney(p.valor)}</td><td>${_fmtDate(p.data_passagem)}</td>
        <td>${p.tag_semparar || '—'}</td>
        <td>${p.conciliado ? '<span class="badge bg-success">Conciliado</span>' : '<span class="badge bg-warning">Pendente</span>'}
          ${!p.conciliado && user.nivel_acesso >= 4 ? `<button class="btn btn-sm btn-outline-success ms-1" onclick="FrotasForms._conciliarPedagio(${p.id},event)">✓</button>` : ''}
        </td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Praça</th><th>Rodovia</th><th>Valor</th><th>Data</th><th>Tag</th><th>Situação</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum pedágio registrado.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-novo-ped">+ Registrar Pedágio</button>`);
    document.getElementById('btn-novo-ped').onclick = async () => {
      const rV = await API.get('/frota/veiculos');
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
      el.innerHTML = `<form id="form-ped">
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Veículo</label>
            <select name="veiculo_id" class="form-select"><option value="">—</option>${veicOpts}</select>
          </div>
          <div class="col-6"><label class="form-label">Valor (R$) *</label><input name="valor" type="number" step="0.01" class="form-control" required></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Praça</label><input name="praca" class="form-control"></div>
          <div class="col-4"><label class="form-label">Rodovia</label><input name="rodovia" class="form-control"></div>
          <div class="col-4"><label class="form-label">Tag Sem Parar</label><input name="tag_semparar" class="form-control"></div>
        </div>
        <div class="mb-2"><label class="form-label">Data / Hora da Passagem *</label>
          <input name="data_passagem" type="datetime-local" class="form-control" required>
        </div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-ped">Registrar</button>`);
      document.getElementById('btn-salvar-ped').onclick = async () => {
        const f = document.getElementById('form-ped');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-ped'), async () => {
          const res = await API.post('/frota/pedagogios', body);
          if (res.success) { showToast('Pedágio registrado!', 'success'); FrotasForms.f19ControlePedagios(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _conciliarPedagio: async (id, event) => {
    event.target.disabled = true;
    const res = await API.put(`/frota/pedagogios/${id}/conciliar`, {});
    if (res.success) showToast('Pedágio conciliado!', 'success');
    else showToast(res.message || 'Erro.', 'danger');
  },

  // ── f20 Checklist de Saída e Retorno ──────────────────────────────────────────
  f20ChecklistSaidaRetorno: async (user) => FrotasForms.f08Checklist(user),

  // ── f21 Registro de Sinistros ─────────────────────────────────────────────────
  f21RegistroSinistros: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🚨 Registro de Sinistros', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/sinistros');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar sinistros.'); return; }
      const rows = r.data.map(s => `<tr>
        <td><code>${s.placa || '—'}</code></td><td>${s.tipo}</td><td>${s.local || '—'}</td>
        <td>${s.descricao?.substring(0,40) || '—'}</td>
        <td>${_fmtMoney(s.valor_prejuizo)}</td>
        <td>${_fmtDate(s.data_sinistro)}</td><td>${_badge(s.status)}</td>
        ${user.nivel_acesso >= 4 ? `<td><button class="btn btn-sm btn-outline-secondary" onclick="FrotasForms._atualizarSinistro(${s.id},'${s.status}',event)">↻</button></td>` : '<td></td>'}
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Tipo</th><th>Local</th><th>Descrição</th><th>Prejuízo</th><th>Data</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum sinistro registrado.');
    };
    await load();
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-sin">+ Registrar Sinistro</button>`);
      document.getElementById('btn-novo-sin').onclick = async () => {
        const [rV, rM] = await Promise.all([API.get('/frota/veiculos'), API.get('/frota/motoristas')]);
        const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
        const motOpts  = (rM.data || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
        el.innerHTML = `<form id="form-sin">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Veículo *</label>
              <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
            </div>
            <div class="col-6"><label class="form-label">Motorista</label>
              <select name="motorista_id" class="form-select"><option value="">—</option>${motOpts}</select>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required>
                <option value="acidente">Acidente</option><option value="roubo">Roubo</option>
                <option value="furto">Furto</option><option value="incendio">Incêndio</option><option value="outros">Outros</option>
              </select>
            </div>
            <div class="col-6"><label class="form-label">Data do Sinistro *</label><input name="data_sinistro" type="date" class="form-control" required></div>
          </div>
          <div class="mb-2"><label class="form-label">Local</label><input name="local" class="form-control"></div>
          <div class="mb-2"><label class="form-label">Descrição *</label><textarea name="descricao" class="form-control" rows="3" required></textarea></div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Boletim de Ocorrência</label><input name="boletim_ocorrencia" class="form-control"></div>
            <div class="col-4"><label class="form-label">Seguradora</label><input name="seguradora" class="form-control"></div>
            <div class="col-4"><label class="form-label">Valor Prejuízo (R$)</label><input name="valor_prejuizo" type="number" step="0.01" class="form-control"></div>
          </div>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" name="terceiros_envolvidos" value="1" id="chk-terc">
            <label class="form-check-label" for="chk-terc">Terceiros envolvidos</label>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-danger" id="btn-salvar-sin">Registrar Sinistro</button>`);
        document.getElementById('btn-salvar-sin').onclick = async () => {
          const f = document.getElementById('form-sin');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-sin'), async () => {
            const res = await API.post('/frota/sinistros', body);
            if (res.success) { showToast('Sinistro registrado!', 'success'); FrotasForms.f21RegistroSinistros(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  _atualizarSinistro: async (id, statusAtual, event) => {
    event.stopPropagation();
    const body = `<form id="form-upd-sin">
      <div class="mb-3"><label class="form-label">Status do Sinistro</label>
        <select name="status" class="form-select">
          <option value="aberto"${statusAtual==='aberto'?' selected':''}>Aberto</option>
          <option value="em_analise"${statusAtual==='em_analise'?' selected':''}>Em Análise</option>
          <option value="indenizado"${statusAtual==='indenizado'?' selected':''}>Indenizado</option>
          <option value="encerrado"${statusAtual==='encerrado'?' selected':''}>Encerrado</option>
        </select>
      </div>
      <div class="mb-3"><label class="form-label">Seguradora</label><input name="seguradora" class="form-control"></div>
      <div class="mb-3"><label class="form-label">Nº do Sinistro (seguradora)</label><input name="numero_sinistro" class="form-control"></div>
      <div class="mb-3"><label class="form-label">Valor do Prejuízo (R$)</label><input name="valor_prejuizo" type="number" step="0.01" class="form-control"></div>
    </form>`;
    const { el: el2, setFooter: sf } = _frotaModal({ title: '↻ Atualizar Sinistro', size: 'sm', body });
    sf(`<button class="btn btn-success" id="btn-upd-sin">Salvar</button>`);
    document.getElementById('btn-upd-sin').onclick = async () => {
      const f = document.getElementById('form-upd-sin');
      const data = Object.fromEntries(new FormData(f).entries());
      Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });
      const btn = document.getElementById('btn-upd-sin');
      await _withSubmit(btn, async () => {
        const res = await API.put(`/frota/sinistros/${id}`, data);
        if (res.success) { showToast('Sinistro atualizado!', 'success'); document.querySelector('[data-bs-dismiss="modal"]')?.click(); }
        else showToast(res.message || 'Erro.', 'danger');
      });
    };
  },

  // ── f22 Qualidade de Materiais por Fornecedor ────────────────────────────────
  f22QualidadeLeiteProdutor: async (user) => {
    const { el } = _frotaModal({ title: '📦 Qualidade de Materiais por Fornecedor', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/qualidade-leite');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados.'); return; }
    if (!r.data.length) { el.innerHTML = _empty('Nenhum dado de qualidade disponível.'); return; }
    const rows = r.data.map(v => `<tr>
      <td>${v.placa}</td><td>${v.total_viagens}</td><td>${_fmtDate(v.ultima_coleta)}</td>
    </tr>`).join('');
    el.innerHTML = `<div class="alert alert-info py-2 mb-3 small">Integração com análise laboratorial em implantação. Dados de recebimento exibidos por rota.</div>
      <table class="table table-sm table-hover">
        <thead><tr><th>Veículo / Rota</th><th>Total de Entregas</th><th>Último Recebimento</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
  },

  // ── f23 Tanques Comunitários ───────────────────────────────────────────────────
  f23TanquesComunitarios: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🏭 Tanques Comunitários', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/tanques-comunitarios');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar tanques.'); return; }
      const rows = r.data.map(t => `<tr>
        <td>${t.nome}</td><td>${t.municipio || '—'}</td>
        <td>${t.capacidade_litros ? Number(t.capacidade_litros).toLocaleString('pt-BR') + ' L' : '—'}</td>
        <td>${t.responsavel || '—'}</td><td>${t.telefone || '—'}</td>
        <td>${t.latitude && t.longitude ? `<a href="https://maps.google.com/?q=${t.latitude},${t.longitude}" target="_blank" class="btn btn-sm btn-outline-primary">Mapa</a>` : '—'}</td>
        <td>${_badge(t.status)}</td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Nome</th><th>Município</th><th>Capacidade</th><th>Responsável</th><th>Tel.</th><th>GPS</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhum tanque comunitário cadastrado.');
    };
    await load();
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-novo-tanq">+ Cadastrar Tanque</button>`);
      document.getElementById('btn-novo-tanq').onclick = () => {
        el.innerHTML = `<form id="form-tanq">
          <div class="row g-2 mb-2">
            <div class="col-8"><label class="form-label">Nome do Tanque *</label><input name="nome" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Município</label><input name="municipio" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Capacidade (L)</label><input name="capacidade_litros" type="number" class="form-control"></div>
            <div class="col-4"><label class="form-label">Latitude</label><input name="latitude" type="number" step="any" class="form-control" placeholder="-23.5505"></div>
            <div class="col-4"><label class="form-label">Longitude</label><input name="longitude" type="number" step="any" class="form-control" placeholder="-46.6333"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Responsável</label><input name="responsavel" class="form-control"></div>
            <div class="col-6"><label class="form-label">Telefone</label><input name="telefone" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-tanq">Salvar</button>`);
        document.getElementById('btn-salvar-tanq').onclick = async () => {
          const f = document.getElementById('form-tanq');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-tanq'), async () => {
            const res = await API.post('/frota/tanques-comunitarios', body);
            if (res.success) { showToast('Tanque cadastrado!', 'success'); FrotasForms.f23TanquesComunitarios(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  // ── f24 Histórico de Captação ─────────────────────────────────────────────────
  f24HistoricoCaptacao: async (user) => {
    const { el } = _frotaModal({ title: '📊 Histórico de Captação', size: 'xl', body: _spinner() });
    const hoje = new Date().toISOString().split('T')[0];
    const ha30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const load = async (di, df) => {
      const r = await API.get(`/frota/captacao?data_inicio=${di}&data_fim=${df}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar captação.'); return; }
      const rows = r.data.map(v => `<tr>
        <td>${v.placa || '—'}</td><td>${v.motorista_nome || '—'}</td>
        <td>${v.destino || '—'}</td><td>${_fmtDate(v.data_saida)}</td>
        <td>${_fmtDate(v.data_chegada)}</td><td>${_badge(v.status)}</td>
      </tr>`).join('');
      el.innerHTML = `<div class="row g-2 mb-3">
          <div class="col-4"><label class="form-label">De</label><input id="cap_di" type="date" class="form-control" value="${di}"></div>
          <div class="col-4"><label class="form-label">Até</label><input id="cap_df" type="date" class="form-control" value="${df}"></div>
          <div class="col-4 d-flex align-items-end"><button class="btn btn-outline-primary w-100" id="btn-filtrar-cap">Filtrar</button></div>
        </div>` +
        (rows ? `<table class="table table-sm table-hover">
          <thead><tr><th>Veículo</th><th>Motorista</th><th>Rota/Destino</th><th>Saída</th><th>Chegada</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody></table>` : _empty('Nenhum registro no período.'));
      document.getElementById('btn-filtrar-cap').onclick = () =>
        load(document.getElementById('cap_di').value, document.getElementById('cap_df').value);
    };
    await load(ha30, hoje);
  },

  // ── f25 Captura de Pesagem ────────────────────────────────────────────────────
  f25CapturaPesagem: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '⚖️ Captura de Pesagem', size: 'xl', body: _spinner() });
    const load = async () => {
      const r = await API.get('/frota/pesagens');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar pesagens.'); return; }
      const rows = r.data.map(p => {
        const liq = p.peso_bruto && p.peso_tara ? (p.peso_bruto - p.peso_tara) : null;
        return `<tr>
          <td>${p.placa || '—'}</td><td>${_fmtDate(p.data_pesagem)}</td>
          <td>${p.peso_tara ? Number(p.peso_tara).toLocaleString('pt-BR') + ' kg' : '—'}</td>
          <td>${p.peso_bruto ? Number(p.peso_bruto).toLocaleString('pt-BR') + ' kg' : '—'}</td>
          <td>${liq !== null ? Number(liq).toLocaleString('pt-BR') + ' kg' : '—'}</td>
          <td>${p.volume_nota_fiscal ? Number(p.volume_nota_fiscal).toLocaleString('pt-BR') + ' kg' : '—'}</td>
          <td>${_badge(p.status_divergencia || 'ok')}</td>
        </tr>`;
      }).join('');
      el.innerHTML = rows ? `<table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Data</th><th>Tara (kg)</th><th>Bruto (kg)</th><th>Líquido (kg)</th><th>NF (kg)</th><th>Divergência</th></tr></thead>
        <tbody>${rows}</tbody></table>` : _empty('Nenhuma pesagem registrada.');
    };
    await load();
    setFooter(`<button class="btn btn-primary" id="btn-nova-pesagem">+ Registrar Pesagem</button>`);
    document.getElementById('btn-nova-pesagem').onclick = async () => {
      const [rV, rM] = await Promise.all([API.get('/frota/veiculos'), API.get('/frota/motoristas')]);
      const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
      const motOpts  = (rM.data || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
      el.innerHTML = `<form id="form-pesagem">
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Veículo *</label>
            <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
          </div>
          <div class="col-6"><label class="form-label">Motorista</label>
            <select name="motorista_id" class="form-select"><option value="">—</option>${motOpts}</select>
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Peso Tara (kg) *</label><input name="peso_tara" type="number" step="0.01" class="form-control" required></div>
          <div class="col-4"><label class="form-label">Peso Bruto (kg) *</label><input name="peso_bruto" type="number" step="0.01" class="form-control" required></div>
          <div class="col-4"><label class="form-label">Volume Nota Fiscal (kg)</label><input name="volume_nota_fiscal" type="number" step="0.01" class="form-control"></div>
        </div>
        <div class="mb-2"><label class="form-label">Data / Hora da Pesagem *</label>
          <input name="data_pesagem" type="datetime-local" class="form-control" required>
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-pesagem">Registrar</button>`);
      document.getElementById('btn-salvar-pesagem').onclick = async () => {
        const f = document.getElementById('form-pesagem');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-pesagem'), async () => {
          const res = await API.post('/frota/pesagens', body);
          if (res.success) {
            const div = res.data.divergencia;
            const msg = 'Pesagem registrada!' + (div !== null ? ` Divergência: ${Number(div).toLocaleString('pt-BR')} kg` : '');
            showToast(msg, res.data.status_divergencia === 'ok' ? 'success' : 'warning');
            FrotasForms.f25CapturaPesagem(user);
          } else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  // ── f26 Conferência de Divergência de Peso ────────────────────────────────────
  f26ConfDivergenciaPeso: async (user) => {
    const { el } = _frotaModal({ title: '⚖️ Conferência de Divergência de Peso', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/pesagens');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar dados.'); return; }
    const divergentes = r.data.filter(p => p.status_divergencia && p.status_divergencia !== 'ok');
    if (!divergentes.length) {
      el.innerHTML = `<div class="alert alert-success">Nenhuma divergência encontrada. Todos os pesos conferem com as notas fiscais.</div>`;
      return;
    }
    const rows = divergentes.map(p => {
      const liq = p.peso_bruto && p.peso_tara ? p.peso_bruto - p.peso_tara : null;
      const div = liq !== null && p.volume_nota_fiscal ? liq - p.volume_nota_fiscal : null;
      const cor = p.status_divergencia === 'critico' ? 'danger' : 'warning';
      return `<tr class="table-${cor}">
        <td>${p.placa || '—'}</td><td>${_fmtDate(p.data_pesagem)}</td>
        <td>${liq !== null ? Number(liq).toLocaleString('pt-BR') + ' kg' : '—'}</td>
        <td>${p.volume_nota_fiscal ? Number(p.volume_nota_fiscal).toLocaleString('pt-BR') + ' kg' : '—'}</td>
        <td><strong>${div !== null ? (div > 0 ? '+' : '') + Number(div).toLocaleString('pt-BR') + ' kg' : '—'}</strong></td>
        <td>${_badge(p.status_divergencia)}</td>
        <td>${p.observacao || '—'}</td>
      </tr>`;
    }).join('');
    el.innerHTML = `<div class="alert alert-warning py-2 mb-3"><strong>${divergentes.length} divergência(s)</strong> encontrada(s). Investigue antes de liberar pagamento.</div>
      <table class="table table-sm table-hover">
        <thead><tr><th>Veículo</th><th>Data</th><th>Peso Líquido</th><th>Volume NF</th><th>Diferença</th><th>Status</th><th>Obs.</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
  },

  // ── f27 Execução de Rota de Coleta ────────────────────────────────────────────
  f27ExecucaoRotaColeta: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '🚛 Execução de Rota de Coleta', size: 'lg', body: _spinner() });
    const [rR, rV, rM] = await Promise.all([
      API.get('/frota/rotas?tipo=coleta'),
      API.get('/frota/veiculos?status=disponivel'),
      API.get('/frota/motoristas')
    ]);
    const rotaOpts = (rR.data || []).map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
    const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
    const motOpts  = (rM.data || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
    el.innerHTML = `<form id="form-exec-coleta">
      <div class="mb-3"><label class="form-label">Rota de Coleta *</label>
        <select name="rota_destino" class="form-select" required><option value="">Selecione...</option>${rotaOpts}</select>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6"><label class="form-label">Veículo *</label>
          <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
        </div>
        <div class="col-6"><label class="form-label">Motorista *</label>
          <select name="motorista_id" class="form-select" required><option value="">Selecione...</option>${motOpts}</select>
        </div>
      </div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">KM Saída *</label><input name="km_saida" type="number" class="form-control" required></div>
        <div class="col-6"><label class="form-label">Observação</label><input name="motivo" class="form-control" value="Coleta/Entrega de materiais"></div>
      </div>
    </form>`;
    setFooter(`<button class="btn btn-success" id="btn-iniciar-coleta">▶ Iniciar Rota de Coleta</button>`);
    document.getElementById('btn-iniciar-coleta').onclick = async () => {
      const f = document.getElementById('form-exec-coleta');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const fd = new FormData(f);
      const rotaSel = f.querySelector('[name="rota_destino"]');
      const body = {
        veiculo_id: fd.get('veiculo_id'), motorista_id: fd.get('motorista_id'),
        destino: rotaSel.options[rotaSel.selectedIndex].text,
        km_saida: fd.get('km_saida'), motivo: fd.get('motivo'),
        data_saida: new Date().toISOString().split('T')[0]
      };
      await _withSubmit(document.getElementById('btn-iniciar-coleta'), async () => {
        const res = await API.post('/frota/viagens', body);
        if (res.success) showToast('Rota de coleta iniciada!', 'success');
        else showToast(res.message || 'Erro ao iniciar rota.', 'danger');
      });
    };
  },

  // ── f28 Execução de Rota de Entrega ────────────────────────────────────────────
  f28ExecucaoRotaEntrega: async (user) => {
    const { el, setFooter } = _frotaModal({ title: '📦 Execução de Rota de Entrega', size: 'lg', body: _spinner() });
    const [rR, rV, rM] = await Promise.all([
      API.get('/frota/rotas?tipo=entrega'),
      API.get('/frota/veiculos?status=disponivel'),
      API.get('/frota/motoristas')
    ]);
    const rotaOpts = (rR.data || []).map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
    const veicOpts = (rV.data || []).map(v => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
    const motOpts  = (rM.data || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
    el.innerHTML = `<form id="form-exec-entrega">
      <div class="mb-3"><label class="form-label">Rota de Entrega *</label>
        <select name="rota_destino" class="form-select" required><option value="">Selecione...</option>${rotaOpts}</select>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-6"><label class="form-label">Veículo *</label>
          <select name="veiculo_id" class="form-select" required><option value="">Selecione...</option>${veicOpts}</select>
        </div>
        <div class="col-6"><label class="form-label">Motorista *</label>
          <select name="motorista_id" class="form-select" required><option value="">Selecione...</option>${motOpts}</select>
        </div>
      </div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">KM Saída *</label><input name="km_saida" type="number" class="form-control" required></div>
        <div class="col-6"><label class="form-label">Observação</label><input name="motivo" class="form-control" value="Entrega de produtos"></div>
      </div>
    </form>`;
    setFooter(`<button class="btn btn-success" id="btn-iniciar-entrega">▶ Iniciar Rota de Entrega</button>`);
    document.getElementById('btn-iniciar-entrega').onclick = async () => {
      const f = document.getElementById('form-exec-entrega');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const fd = new FormData(f);
      const rotaSel = f.querySelector('[name="rota_destino"]');
      const body = {
        veiculo_id: fd.get('veiculo_id'), motorista_id: fd.get('motorista_id'),
        destino: rotaSel.options[rotaSel.selectedIndex].text,
        km_saida: fd.get('km_saida'), motivo: fd.get('motivo'),
        data_saida: new Date().toISOString().split('T')[0]
      };
      await _withSubmit(document.getElementById('btn-iniciar-entrega'), async () => {
        const res = await API.post('/frota/viagens', body);
        if (res.success) showToast('Rota de entrega iniciada!', 'success');
        else showToast(res.message || 'Erro ao iniciar rota.', 'danger');
      });
    };
  },

  // ── f29 Painel de Alertas ─────────────────────────────────────────────────────
  f29PainelAlertas: async (user) => {
    const { el } = _frotaModal({ title: '🚨 Painel de Alertas da Frota', size: 'xl', body: _spinner() });
    const r = await API.get('/frota/alertas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar alertas.'); return; }
    const { resumo, cnh_lista, prev_lista } = r.data;

    const total = resumo.cnh_vencidas + resumo.toxicologico_vencido + resumo.preventivas_vencidas
      + resumo.sinistros_abertos + resumo.multas_pendentes;

    const cardCor = (v, limLaranja = 1) => v === 0 ? 'success' : v <= limLaranja ? 'warning' : 'danger';
    const cards = [
      { label: 'CNH Vencidas', val: resumo.cnh_vencidas, cor: cardCor(resumo.cnh_vencidas, 0), icon: '🪪' },
      { label: 'CNH a Vencer (30d)', val: resumo.cnh_proximas, cor: cardCor(resumo.cnh_proximas, 2), icon: '⏳' },
      { label: 'Toxicológico Vencido', val: resumo.toxicologico_vencido, cor: cardCor(resumo.toxicologico_vencido, 0), icon: '🧪' },
      { label: 'Preventivas Vencidas', val: resumo.preventivas_vencidas, cor: cardCor(resumo.preventivas_vencidas, 0), icon: '🔧' },
      { label: 'Preventivas Próximas', val: resumo.preventivas_proximas, cor: cardCor(resumo.preventivas_proximas, 3), icon: '📋' },
      { label: 'Sinistros em Aberto', val: resumo.sinistros_abertos, cor: cardCor(resumo.sinistros_abertos, 1), icon: '🚨' },
      { label: 'Multas Pendentes', val: resumo.multas_pendentes, cor: cardCor(resumo.multas_pendentes, 2), icon: '🚦' },
      { label: 'Manutenções Abertas', val: resumo.manutencoes_pendentes, cor: cardCor(resumo.manutencoes_pendentes, 5), icon: '⚙️' },
    ];

    const cardHtml = cards.map(c => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-3);text-align:center;">
        <div style="font-size:1.6rem">${c.icon}</div>
        <div style="font-size:1.5rem;font-weight:700;color:${c.cor==='success'?'#4ade80':c.cor==='warning'?'#fb923c':'#f87171'}">${c.val}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${c.label}</div>
      </div>`).join('');

    const cnhRows = cnh_lista.map(m => {
      const hoje = new Date().toISOString().split('T')[0];
      const cnhVenc = m.cnh_validade < hoje;
      const toxVenc = m.toxicologico_validade && m.toxicologico_validade < hoje;
      return `<tr class="${cnhVenc ? 'table-danger' : 'table-warning'}">
        <td>${m.nome}</td>
        <td>${_fmtDate(m.cnh_validade)} ${cnhVenc ? '<span class="badge bg-danger ms-1">VENCIDA</span>' : '<span class="badge bg-warning ms-1">A VENCER</span>'}</td>
        <td>${_fmtDate(m.toxicologico_validade)} ${toxVenc ? '<span class="badge bg-danger ms-1">VENCIDO</span>' : ''}</td>
      </tr>`;
    }).join('');

    const prevRows = prev_lista.map(p => `<tr class="${p.status==='vencido'?'table-danger':'table-warning'}">
      <td>${p.placa || '—'}</td><td>${p.tipo_servico}</td>
      <td>${p.km_proxima ? Number(p.km_proxima).toLocaleString('pt-BR') + ' km' : '—'}</td>
      <td>${_fmtDate(p.data_proxima)}</td>
      <td>${_badge(p.status)}</td>
    </tr>`).join('');

    el.innerHTML = `
      ${total === 0 ? '<div class="alert alert-success mb-3">✅ Nenhum alerta crítico. Frota em conformidade!</div>' :
        `<div class="alert alert-warning mb-3">⚠️ <strong>${total} alerta(s) crítico(s)</strong> requerem atenção.</div>`}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);margin-bottom:var(--space-4)">
        ${cardHtml}
      </div>
      ${cnhRows ? `<h6 class="mt-3 mb-2">CNH / Toxicológico com Atenção</h6>
        <table class="table table-sm mb-4"><thead><tr><th>Motorista</th><th>CNH</th><th>Toxicológico</th></tr></thead>
        <tbody>${cnhRows}</tbody></table>` : ''}
      ${prevRows ? `<h6 class="mb-2">Manutenções Preventivas</h6>
        <table class="table table-sm"><thead><tr><th>Veículo</th><th>Serviço</th><th>Próx. KM</th><th>Próx. Data</th><th>Status</th></tr></thead>
        <tbody>${prevRows}</tbody></table>` : ''}`;
  },

  // ── f30 Relatório de Custos ────────────────────────────────────────────────────
  f30RelatorioCustos: async (user) => {
    const { el } = _frotaModal({ title: '💰 Relatório de Custos da Frota', size: 'xl', body: _spinner() });
    const hoje = new Date().toISOString().split('T')[0];
    const ha90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const load = async (di, df) => {
      const r = await API.get(`/frota/relatorio-custos?data_inicio=${di}&data_fim=${df}`);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar relatório.'); return; }
      const { periodo, veiculos } = r.data;
      const total_geral = veiculos.reduce((s, v) => s + Number(v.custo_total || 0), 0);
      const rows = veiculos.map(v => `<tr>
        <td><code>${v.placa}</code></td>
        <td>${v.modelo || '—'}${v.marca ? ' ' + v.marca : ''}</td>
        <td>${_fmtMoney(v.custo_abastecimento)}<br><small class="text-muted">${v.num_abastecimentos} abast. · ${Number(v.total_litros||0).toFixed(0)} L</small></td>
        <td>${_fmtMoney(v.custo_manutencao)}<br><small class="text-muted">${v.num_manutencoes} OS</small></td>
        <td>${_fmtMoney(v.custo_multas)}<br><small class="text-muted">${v.num_multas} multa(s)</small></td>
        <td><strong>${_fmtMoney(v.custo_total)}</strong></td>
      </tr>`).join('');
      el.innerHTML = `
        <div class="row g-2 mb-3">
          <div class="col-3"><label class="form-label">De</label><input id="rc_di" type="date" class="form-control" value="${di}"></div>
          <div class="col-3"><label class="form-label">Até</label><input id="rc_df" type="date" class="form-control" value="${df}"></div>
          <div class="col-3 d-flex align-items-end"><button class="btn btn-outline-primary w-100" id="btn-rc-filtrar">Filtrar</button></div>
          <div class="col-3 d-flex align-items-end"><button class="btn btn-outline-success w-100" id="btn-rc-csv">⬇ Exportar CSV</button></div>
        </div>
        <div class="alert alert-info py-2 mb-3 small">
          Período: <strong>${_fmtDate(periodo.data_inicio)}</strong> a <strong>${_fmtDate(periodo.data_fim)}</strong> —
          Custo Total da Frota: <strong>${_fmtMoney(total_geral)}</strong>
        </div>
        ${rows ? `<div style="overflow-x:auto"><table class="table table-sm table-hover" id="tabela-custos">
          <thead><tr><th>Placa</th><th>Modelo</th><th>Abastecimento</th><th>Manutenção</th><th>Multas</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="5"><strong>Total Geral</strong></td><td><strong>${_fmtMoney(total_geral)}</strong></td></tr></tfoot>
        </table></div>` : _empty('Nenhum custo no período.')}`;
      document.getElementById('btn-rc-filtrar').onclick = () =>
        load(document.getElementById('rc_di').value, document.getElementById('rc_df').value);
      document.getElementById('btn-rc-csv').onclick = () => {
        const csvHeader = 'Placa;Modelo;Abastecimento (R$);Manutenção (R$);Multas (R$);Total (R$)\n';
        const csvRows = veiculos.map(v => [
          v.placa, v.modelo || '', (v.custo_abastecimento||0).toFixed(2),
          (v.custo_manutencao||0).toFixed(2), (v.custo_multas||0).toFixed(2),
          (v.custo_total||0).toFixed(2)
        ].join(';')).join('\n');
        const totalRow = `\n;;;Total Geral;;${total_geral.toFixed(2)}`;
        const blob = new Blob(['\uFEFF' + csvHeader + csvRows + totalRow], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `custos-frota-${di}-a-${df}.csv`; a.click();
        URL.revokeObjectURL(url);
      };
    };
    await load(ha90, hoje);
  },
};

window.FrotasForms = FrotasForms;
