'use strict';
/**
 * Modais do setor de Produção.
 */
const ProducaoForms = {

  f01VerEscala: async (user) => {
    const { el } = openModal({ title: '📅 Escala de Produção', size: 'lg', body: _spinner() });
    const r = await API.get('/producao/escalas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
    const rows = r.data.map(e => `<tr>
      <td>${e.nome_exibir || '—'}</td>
      <td>${e.turno}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Operador</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
  },

  f02OrdemProducao: async (user) => {
    const { el, setFooter } = openModal({ title: '📦 Ordens de Produção', size: 'xl', body: _spinner() });
    const r = await API.get('/producao/ordens');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar ordens.'); return; }
    const rows = r.data.map(o => `<tr>
      <td>${o.numero}</td>
      <td>${o.produto_nome || o.produto}</td>
      <td>${o.quantidade} ${o.unidade || ''}</td>
      <td>${_fmtDate(o.data_programada)}</td>
      <td>${_badge(o.status)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm table-hover"><thead><tr><th>#</th><th>Produto</th><th>Qtd</th><th>Data</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma ordem de produção.');
    if (user.nivel_acesso >= 4) {
      setFooter(`<button class="btn btn-primary" id="btn-nova-op">+ Nova OP</button>`);
      document.getElementById('btn-nova-op').onclick = () => {
        el.innerHTML = `<form id="form-op">
          <div class="mb-3"><label class="form-label">Produto *</label><input name="produto" class="form-control" required></div>
          <div class="row g-2">
            <div class="col-4"><label class="form-label">Quantidade *</label><input name="quantidade" type="number" step="0.001" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Unidade</label><input name="unidade" class="form-control" placeholder="L, kg, un..."></div>
            <div class="col-4"><label class="form-label">Data Programada *</label><input name="data_programada" type="date" class="form-control" required></div>
          </div>
          <div class="mb-3 mt-2"><label class="form-label">Equipamento</label><input name="equipamento" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-success" id="btn-salvar-op">Salvar</button>`);
        document.getElementById('btn-salvar-op').onclick = async () => {
          const f = document.getElementById('form-op');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          const body = Object.fromEntries(new FormData(f).entries());
          await _withSubmit(document.getElementById('btn-salvar-op'), async () => {
            const res = await API.post('/producao/ordens', body);
            if (res.success) { showToast('Ordem criada!', 'success'); ProducaoForms.f02OrdemProducao(user); }
            else showToast(res.message || 'Erro ao salvar.', 'danger');
          });
        };
      };
    }
  },

  f03ApontamentoProducao: async (user) => {
    const { el, setFooter } = openModal({ title: '✏️ Apontamento de Produção', size: 'lg', body: _spinner() });
    const rOp = await API.get('/producao/ordens?status=em_andamento');
    el.innerHTML = _empty('Selecione uma Ordem de Produção abaixo para ver seus apontamentos.');
    const ordens = rOp.data || [];
    const opOpts = ordens.map(o => `<option value="${o.id}">${o.numero} — ${o.produto_nome || o.produto}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-novo-ap">+ Registrar Apontamento</button>`);
    document.getElementById('btn-novo-ap').onclick = () => {
      el.innerHTML = `<form id="form-ap">
        <div class="mb-3"><label class="form-label">Ordem de Produção *</label>
          <select name="ordem_id" class="form-select" required><option value="">Selecione...</option>${opOpts}</select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Volume Realizado *</label><input name="volume_realizado" type="number" step="0.001" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Unidade</label><input name="unidade" class="form-control" placeholder="L, kg..."></div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-6"><label class="form-label">Início</label><input name="hora_inicio" type="datetime-local" class="form-control"></div>
          <div class="col-6"><label class="form-label">Fim</label><input name="hora_fim" type="datetime-local" class="form-control"></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-ap">Salvar</button>`);
      document.getElementById('btn-salvar-ap').onclick = async () => {
        const f = document.getElementById('form-ap');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-ap'), async () => {
          const res = await API.post('/producao/apontamentos', body);
          if (res.success) { showToast('Apontamento registrado!', 'success'); ProducaoForms.f03ApontamentoProducao(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f04ControleReceitas: async (user) => {
    const { el, setFooter } = openModal({ title: '📝 Controle de Receitas e Fórmulas', size: 'xl', body: _spinner() });
    const r = await API.get('/producao/receitas');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar receitas.'); return; }
    const rows = r.data.map(rec => `<tr>
      <td>${rec.nome}</td>
      <td>${rec.versao || '1.0'}</td>
      <td>${rec.produto_final || '—'}</td>
      <td>${rec.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
    </tr>`).join('');
    el.innerHTML = (rows
      ? `<table class="table table-sm table-hover"><thead><tr><th>Nome</th><th>Versão</th><th>Produto Final</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
      : _empty('Nenhuma receita cadastrada.')) +
      `<div class="alert alert-info mt-3 mb-0">Cadastro de novas receitas em desenvolvimento.</div>`;
  },

  f05ControleTemperatura: async (user) => {
    const { el, setFooter } = openModal({ title: '🌡️ Controle de Temperaturas', size: 'lg', body: _spinner() });
    const r = await API.get('/producao/temperaturas?limit=30');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
    const rows = r.data.map(t => `<tr>
      <td>${t.equipamento_nome || t.equipamento_descricao || '—'}</td>
      <td>${t.temperatura}°C</td>
      <td>${_badge(t.conforme ? 'conforme' : 'nao_conforme')}</td>
      <td>${t.operador_nome || '—'}</td>
      <td>${_fmtDate(t.criado_em)}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Equipamento</th><th>Temp.</th><th>Status</th><th>Operador</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum registro de temperatura.');
    setFooter(`<button class="btn btn-primary" id="btn-nova-temp">+ Registrar</button>`);
    document.getElementById('btn-nova-temp').onclick = () => {
      el.innerHTML = `<form id="form-temp">
        <div class="mb-3"><label class="form-label">Equipamento / Ponto *</label><input name="equipamento_descricao" class="form-control" required placeholder="Ex: Tanque 1, Câmara A..."></div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Temperatura (°C) *</label><input name="temperatura" type="number" step="0.1" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Temp. Máx. Permitida</label><input name="temperatura_maxima" type="number" step="0.1" class="form-control"></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-temp">Salvar</button>`);
      document.getElementById('btn-salvar-temp').onclick = async () => {
        const f = document.getElementById('form-temp');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        body.conforme = !body.temperatura_maxima || Number(body.temperatura) <= Number(body.temperatura_maxima) ? 1 : 0;
        await _withSubmit(document.getElementById('btn-salvar-temp'), async () => {
          const res = await API.post('/producao/temperaturas', body);
          if (res.success) { showToast('Temperatura registrada!', 'success'); ProducaoForms.f05ControleTemperatura(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f06Higienizacao: async (user) => {
    const { el, setFooter } = openModal({ title: '🧹 Higienização de Equipamentos', size: 'lg', body: _spinner() });
    const r = await API.get('/producao/higienizacoes?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
    const rows = r.data.map(h => `<tr>
      <td>${h.equipamento_nome || h.equipamento_descricao || '—'}</td>
      <td>${h.tipo || 'CIP'}</td>
      <td>${h.responsavel_nome || '—'}</td>
      <td>${_fmtDate(h.criado_em)}</td>
      <td>${h.aprovado ? '<span class="badge bg-success">Aprovado</span>' : '<span class="badge bg-warning">Pendente</span>'}</td>
    </tr>`).join('');
    el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Equipamento</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhum registro de higienização.');
    setFooter(`<button class="btn btn-primary" id="btn-nova-hig">+ Registrar</button>`);
    document.getElementById('btn-nova-hig').onclick = () => {
      el.innerHTML = `<form id="form-hig">
        <div class="mb-3"><label class="form-label">Equipamento *</label><input name="equipamento_descricao" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Tipo de Higienização *</label>
          <select name="tipo" class="form-select" required>
            <option value="CIP">CIP (Clean-in-Place)</option>
            <option value="COP">COP (Clean-out-of-Place)</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Produto Químico</label><input name="produto_quimico" class="form-control"></div>
          <div class="col-6"><label class="form-label">Concentração (%)</label><input name="concentracao" type="number" step="0.01" class="form-control"></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-hig">Salvar</button>`);
      document.getElementById('btn-salvar-hig').onclick = async () => {
        const f = document.getElementById('form-hig');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-hig'), async () => {
          const res = await API.post('/producao/higienizacoes', body);
          if (res.success) { showToast('Higienização registrada!', 'success'); ProducaoForms.f06Higienizacao(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f07RegistroPerdas: async (user) => {
    const { el, setFooter } = openModal({ title: '⚠️ Registro de Perdas', size: 'lg', body: _spinner() });
    const r = await API.get('/producao/perdas?limit=20');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar perdas.'); return; }
    const total = r.data.reduce((s, p) => s + Number(p.quantidade || 0), 0).toFixed(3);
    const rows = r.data.map(p => `<tr>
      <td>${p.produto || '—'}</td>
      <td>${p.quantidade} ${p.unidade || ''}</td>
      <td>${p.motivo || '—'}</td>
      <td>${p.operador_nome || '—'}</td>
      <td>${_fmtDate(p.criado_em)}</td>
    </tr>`).join('');
    el.innerHTML = `<div class="alert alert-warning mb-3">Total de perdas: <strong>${total} unidades</strong></div>` + (rows ? `<table class="table table-sm"><thead><tr><th>Produto</th><th>Qtd</th><th>Motivo</th><th>Operador</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma perda registrada.'));
    setFooter(`<button class="btn btn-primary" id="btn-nova-perda">+ Registrar Perda</button>`);
    document.getElementById('btn-nova-perda').onclick = () => {
      el.innerHTML = `<form id="form-perda">
        <div class="mb-3"><label class="form-label">Produto *</label><input name="produto" class="form-control" required></div>
        <div class="row g-2">
          <div class="col-6"><label class="form-label">Quantidade *</label><input name="quantidade" type="number" step="0.001" class="form-control" required></div>
          <div class="col-6"><label class="form-label">Unidade</label><input name="unidade" class="form-control" placeholder="L, kg, un..."></div>
        </div>
        <div class="mb-3 mt-2"><label class="form-label">Motivo *</label>
          <select name="motivo" class="form-select" required>
            <option value="quebra">Quebra</option><option value="derramamento">Derramamento</option><option value="vencimento">Vencimento</option>
            <option value="contaminacao">Contaminação</option><option value="reprocesso">Reprocesso</option><option value="outros">Outros</option>
          </select>
        </div>
        <div class="mb-3"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="btn-salvar-perda">Salvar</button>`);
      document.getElementById('btn-salvar-perda').onclick = async () => {
        const f = document.getElementById('form-perda');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-perda'), async () => {
          const res = await API.post('/producao/perdas', body);
          if (res.success) { showToast('Perda registrada.', 'success'); ProducaoForms.f07RegistroPerdas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  f08RastreabilidadeLote: async (user) => {
    const { el } = openModal({ title: '🔍 Rastreabilidade de Lote', size: 'xl', body: `
      <div class="input-group mb-3">
        <input id="input-lote" class="form-control" placeholder="Digite o número do lote...">
        <button class="btn btn-primary" id="btn-buscar-lote">Buscar</button>
      </div>
      <div id="resultado-rastreio">${_empty('Digite um número de lote para pesquisar.')}</div>
    ` });
    document.getElementById('btn-buscar-lote').onclick = async () => {
      const lote = document.getElementById('input-lote').value.trim();
      if (!lote) return;
      const res = document.getElementById('resultado-rastreio');
      res.innerHTML = _spinner();
      const r = await API.get(`/producao/rastrear/${encodeURIComponent(lote)}`);
      if (!r.success || !r.data) { res.innerHTML = _empty('Lote não encontrado.'); return; }
      const d = r.data;
      const ordens = d.ordens || [];
      const laudos = d.laudos || [];
      const movs = d.movimentacoes || [];
      const perdas = d.perdas || [];
      res.innerHTML = `
        <h6>Ordens de Produção</h6>
        ${ordens.length ? `<ul>${ordens.map(o => `<li><strong>${o.codigo || o.id}</strong> — ${o.produto_nome || '—'} | Status: ${_badge(o.status)}</li>`).join('')}</ul>` : '<p class="text-muted">Nenhuma ordem encontrada.</p>'}
        <h6>Laudos de Qualidade</h6>
        ${laudos.length ? `<ul>${laudos.map(l => `<li>Lote: ${l.lote || '—'} | ${l.produto_nome || '—'} | Resultado: ${_badge(l.resultado)} | Analista: ${l.analista_nome || '—'}</li>`).join('')}</ul>` : '<p class="text-muted">Nenhum laudo encontrado.</p>'}
        <h6>Movimentações de Estoque</h6>
        ${movs.length ? `<ul>${movs.map(m => `<li>${m.tipo} — ${m.produto_nome || '—'} | Qtd: ${m.quantidade} | ${_fmtDate(m.criado_em)}</li>`).join('')}</ul>` : '<p class="text-muted">Nenhuma movimentação encontrada.</p>'}
        ${perdas.length ? `<h6>Perdas</h6><ul>${perdas.map(p => `<li>${p.produto_nome || '—'} | Qtd: ${p.quantidade} | ${_fmtDate(p.criado_em)}</li>`).join('')}</ul>` : ''}`;
    };
  },

  f09IndicadoresOEE: async (user) => {
    const { el } = openModal({ title: '📊 Indicadores OEE', size: 'lg', body: _spinner() });
    const r = await API.get('/producao/indicadores-oee');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar indicadores.'); return; }
    const d = r.data || {};
    const pct = v => `<span class="${v >= 85 ? 'text-success' : v >= 65 ? 'text-warning' : 'text-danger'} fw-bold">${Number(v || 0).toFixed(1)}%</span>`;
    el.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-3"><div class="card text-center p-3"><h4>${pct(d.disponibilidade)}</h4><small>Disponibilidade</small></div></div>
        <div class="col-3"><div class="card text-center p-3"><h4>${pct(d.desempenho)}</h4><small>Desempenho</small></div></div>
        <div class="col-3"><div class="card text-center p-3"><h4>${pct(d.qualidade)}</h4><small>Qualidade</small></div></div>
        <div class="col-3"><div class="card text-center p-3 bg-primary text-white"><h4>${pct(d.oee)}</h4><small>OEE Geral</small></div></div>
      </div>
      ${d.por_linha ? `<h6>Por Linha</h6><table class="table table-sm"><thead><tr><th>Linha</th><th>Disp.</th><th>Desemp.</th><th>Qual.</th><th>OEE</th></tr></thead><tbody>
        ${d.por_linha.map(l => `<tr><td>${l.linha}</td><td>${pct(l.disponibilidade)}</td><td>${pct(l.desempenho)}</td><td>${pct(l.qualidade)}</td><td>${pct(l.oee)}</td></tr>`).join('')}
      </tbody></table>` : ''}`;
  },

  f10GerenciarEscalas: async (user) => {
    const { el, setFooter } = openModal({ title: '📅 Gerenciar Escalas de Produção', size: 'lg', body: _spinner() });
    const load = async () => {
      const r = await API.get('/producao/escalas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const rows = r.data.map(e => `<tr>
        <td>${e.nome_exibir || '—'}</td>
        <td>${e.turno}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="ProducaoForms._excluirEscala(${e.id})">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows ? `<table class="table table-sm"><thead><tr><th>Operador</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : _empty('Nenhuma escala cadastrada.');
    };
    await load();
    const rU = await API.get('/producao/usuarios');
    const opts = (rU.data || []).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    setFooter(`<button class="btn btn-primary" id="btn-nova-esc-prod">+ Nova Escala</button>`);
    document.getElementById('btn-nova-esc-prod').onclick = () => {
      el.innerHTML = `<form id="form-esc-prod">
        <div class="mb-3"><label class="form-label">Operador</label><select name="usuario_id" class="form-select"><option value="">— Externo —</option>${opts}</select></div>
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
      setFooter(`<button class="btn btn-success" id="btn-salvar-esc-prod">Salvar</button>`);
      document.getElementById('btn-salvar-esc-prod').onclick = async () => {
        const f = document.getElementById('form-esc-prod');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const body = Object.fromEntries(new FormData(f).entries());
        await _withSubmit(document.getElementById('btn-salvar-esc-prod'), async () => {
          const res = await API.post('/producao/escalas', body);
          if (res.success) { showToast('Escala criada!', 'success'); ProducaoForms.f10GerenciarEscalas(user); }
          else showToast(res.message || 'Erro ao salvar.', 'danger');
        });
      };
    };
  },

  _excluirEscala: async (id) => {
    if (!confirm('Excluir esta escala?')) return;
    const res = await API.delete(`/producao/escalas/${id}`);
    if (res.success) showToast('Escala excluída.', 'success');
    else showToast(res.message || 'Erro ao excluir.', 'danger');
  },
};

window.ProducaoForms = ProducaoForms;
