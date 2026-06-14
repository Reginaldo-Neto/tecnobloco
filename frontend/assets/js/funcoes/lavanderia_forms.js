'use strict';
/**
 * LavanderiaForms — Renderers de modal para as 16 funções da Lavanderia.
 */

// ── Helpers locais ────────────────────────────────────────────────────────────

function _lav_statusBadge(s) {
  const m = { recebido: 'warning', em_triagem: 'info', em_lavagem: 'info', lavado: 'success', entregue: 'muted', cancelado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _lav_sujBadge(s) {
  const m = { leve: 'success', moderado: 'warning', pesado: 'danger' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _lav_cicloStatusBadge(s) {
  const m = { em_andamento: 'warning', concluido: 'success', cancelado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _lav_reparoBadge(s) {
  const m = { aguardando: 'warning', em_reparo: 'info', concluido: 'success', sem_conserto: 'danger' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _lav_fmtD(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return '—'; }
}
function _lav_fmtDT(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return '—'; }
}
function _lav_today() { return new Date().toISOString().split('T')[0]; }

// ── f01 Recebimento e Triagem ─────────────────────────────────────────────────

async function _lav_f01(user) {
  let usuarios = [], deptos = [], uniformes = [];
  try {
    [usuarios, deptos, uniformes] = await Promise.all([
      API.get('/lavanderia/usuarios').then(d => Array.isArray(d) ? d : (d.data || [])),
      API.get('/lavanderia/departamentos').then(d => Array.isArray(d) ? d : (d.data || [])),
      API.get('/lavanderia/uniformes').then(d => Array.isArray(d) ? d : (d.data || [])),
    ]);
  } catch(e) { showToast('Erro ao carregar dados: ' + e.message, 'error'); return; }

  const { el, close } = openModal({
    title: '👕 Recebimento e Triagem',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="lav-ent-fil-status" style="width:160px;">
          <option value="">Todos os status</option>
          <option value="recebido">Recebido</option>
          <option value="em_triagem">Em triagem</option>
          <option value="em_lavagem">Em lavagem</option>
          <option value="lavado">Lavado</option>
          <option value="entregue">Entregue</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="lav-ent-buscar">🔍 Filtrar</button>
      </div>
      <div id="lav-ent-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-ent-novo-btn">+ Nova Entrada</button>`,
  });

  async function loadEntradas() {
    const status = el.querySelector('#lav-ent-fil-status').value;
    el.querySelector('#lav-ent-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/entradas' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-ent-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-ent-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Tipo</th><th>Funcionário</th><th>Setor</th><th>Sujeira</th><th>Área</th><th>Status</th><th>Entrada</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.tipo_item||'—')}</td>
                  <td>${escapeHtml(r.funcionario_nome||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.setor_nome||'—')}</span></td>
                  <td>${_lav_sujBadge(r.nivel_sujeira)}</td>
                  <td>${escapeHtml(r.tipo_area||'—')}</td>
                  <td>${_lav_statusBadge(r.status)}</td>
                  <td>${_lav_fmtDT(r.created_at)}</td>
                  <td>
                    <select class="form-control form-control-xs lav-ent-status-sel" data-id="${r.id}" style="width:120px;">
                      <option value="">— mudar —</option>
                      <option value="em_triagem">Em triagem</option>
                      <option value="em_lavagem">Em lavagem</option>
                      <option value="lavado">Lavado</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-ent-status-sel').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          try {
            await API.put('/lavanderia/entradas/' + this.dataset.id + '/status', { status: this.value });
            showToast('Status atualizado', 'success');
            loadEntradas();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
        });
      });
    } catch(e) {
      el.querySelector('#lav-ent-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-ent-buscar').addEventListener('click', loadEntradas);
  el.querySelector('#lav-ent-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Entrada',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Tipo de Item *</label>
          <input class="form-control" id="lav-ne-tipo" value="uniforme" placeholder="uniforme / bota / avental..."></div>
        <div class="form-group"><label class="form-label">Funcionário</label>
          <select class="form-control" id="lav-ne-func">
            <option value="">— Selecione —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Setor</label>
          <select class="form-control" id="lav-ne-setor">
            <option value="">— Selecione —</option>
            ${deptos.map(d => `<option value="${d.id}">${escapeHtml(d.nome)}</option>`).join('')}
          </select></div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Nível de Sujeira</label>
            <select class="form-control" id="lav-ne-sujeira">
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="pesado">Pesado</option>
            </select></div>
          <div class="form-group" style="flex:1"><label class="form-label">Tipo de Área</label>
            <select class="form-control" id="lav-ne-area">
              <option value="area_limpa">Área Limpa</option>
              <option value="area_suja">Área Suja</option>
              <option value="externo">Externo</option>
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="lav-ne-obs" rows="2"></textarea></div>
        <div id="lav-ne-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-ne-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-ne-save">Registrar Entrada</button>`,
    });
    e2.querySelector('#lav-ne-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-ne-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const payload = {
          tipo_item:    e2.querySelector('#lav-ne-tipo').value.trim() || 'uniforme',
          funcionario_id: e2.querySelector('#lav-ne-func').value   || null,
          setor_id:       e2.querySelector('#lav-ne-setor').value  || null,
          nivel_sujeira:  e2.querySelector('#lav-ne-sujeira').value,
          tipo_area:      e2.querySelector('#lav-ne-area').value,
          observacao:     e2.querySelector('#lav-ne-obs').value.trim() || null,
        };
        try {
          await API.post('/lavanderia/entradas', payload);
          showToast('Entrada registrada com sucesso', 'success');
          c2(); loadEntradas();
        } catch(e) { e2.querySelector('#lav-ne-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadEntradas();
}

// ── f02 Ciclos de Lavagem ─────────────────────────────────────────────────────

async function _lav_f02(user) {
  const { el, close } = openModal({
    title: '🔄 Registro de Ciclos de Lavagem',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="lav-ci-fil-status" style="width:160px;">
          <option value="">Todos</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="lav-ci-buscar">Filtrar</button>
      </div>
      <div id="lav-ci-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-ci-novo-btn">+ Novo Ciclo</button>`,
  });

  async function loadCiclos() {
    const status = el.querySelector('#lav-ci-fil-status').value;
    el.querySelector('#lav-ci-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/ciclos' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-ci-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-ci-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Lote</th><th>Tipo</th><th>Temp.</th><th>Tempo</th><th>Kg</th><th>Itens</th><th>Operador</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><code>${escapeHtml(r.codigo_lote||'—')}</code></td>
                  <td>${escapeHtml(r.tipo_lavagem||'—')}</td>
                  <td>${r.temperatura ? r.temperatura + '°C' : '—'}</td>
                  <td>${r.tempo_min ? r.tempo_min + 'min' : '—'}</td>
                  <td>${r.total_kg ? r.total_kg + 'kg' : '—'}</td>
                  <td><span class="badge badge-info">${r.total_itens||0}</span></td>
                  <td>${escapeHtml(r.operador_nome||'—')}</td>
                  <td>${_lav_cicloStatusBadge(r.status)}</td>
                  <td>${r.status === 'em_andamento' ? `<button class="btn btn-xs btn-success lav-ci-concluir" data-id="${r.id}">✔ Concluir</button>` : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-ci-concluir').forEach(btn => {
        btn.addEventListener('click', function() {
          _withSubmit(this, async () => {
            if (!confirm('Concluir este ciclo de lavagem? Esta ação incrementa os contadores de lavagem dos uniformes.')) return;
            try {
              await API.put('/lavanderia/ciclos/' + btn.dataset.id + '/concluir', {});
              showToast('Ciclo concluído!', 'success');
              loadCiclos();
            } catch(e) { showToast('Erro: ' + e.message, 'error'); }
          });
        });
      });
    } catch(e) {
      el.querySelector('#lav-ci-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-ci-buscar').addEventListener('click', loadCiclos);
  el.querySelector('#lav-ci-novo-btn').addEventListener('click', async () => {
    let entradas = [];
    try {
      const d = await API.get('/lavanderia/entradas?status=em_triagem');
      entradas = Array.isArray(d) ? d : (d.data || []);
    } catch {}
    const checklist = entradas.length
      ? entradas.map(e => `<label style="display:flex;gap:8px;align-items:center;padding:4px 0;"><input type="checkbox" class="lav-ci-item" value="${e.id}"> ${escapeHtml(e.tipo_item||'item')} — ${escapeHtml(e.funcionario_nome||'—')} (${escapeHtml(e.nivel_sujeira||'')})</label>`).join('')
      : '<div style="color:var(--text-muted);font-size:13px;">Nenhuma peça em triagem disponível.</div>';
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Ciclo de Lavagem',
      size: 'md',
      body: `
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Tipo de Lavagem</label>
            <select class="form-control" id="lav-nc-tipo">
              <option value="normal">Normal</option>
              <option value="esterilizacao">Esterilização</option>
              <option value="delicado">Delicado</option>
              <option value="quimico">Químico</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Temperatura (°C)</label>
            <input class="form-control" id="lav-nc-temp" type="number" min="20" max="100" placeholder="60"></div>
          <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Tempo (min)</label>
            <input class="form-control" id="lav-nc-tempo" type="number" min="5" placeholder="45"></div>
        </div>
        <div class="form-group"><label class="form-label">Total (kg)</label>
          <input class="form-control" id="lav-nc-kg" type="number" step="0.1" placeholder="ex: 12.5"></div>
        <div class="form-group"><label class="form-label">Peças em triagem para incluir</label>
          <div style="max-height:160px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px;">${checklist}</div></div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="lav-nc-obs" rows="2"></textarea></div>
        <div id="lav-nc-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-nc-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-nc-save">Iniciar Ciclo</button>`,
    });
    e2.querySelector('#lav-nc-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-nc-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const entrada_ids = [...e2.querySelectorAll('.lav-ci-item:checked')].map(cb => Number(cb.value));
        const payload = {
          tipo_lavagem: e2.querySelector('#lav-nc-tipo').value,
          temperatura:  e2.querySelector('#lav-nc-temp').value  || null,
          tempo_min:    e2.querySelector('#lav-nc-tempo').value || null,
          total_kg:     e2.querySelector('#lav-nc-kg').value    || null,
          observacao:   e2.querySelector('#lav-nc-obs').value.trim() || null,
          entrada_ids,
        };
        try {
          const r = await API.post('/lavanderia/ciclos', payload);
          const data = r.data || r;
          showToast(`Ciclo ${data.codigo_lote} iniciado!`, 'success');
          c2(); loadCiclos();
        } catch(e) { e2.querySelector('#lav-nc-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadCiclos();
}

// ── f03 Controle de Químicos ──────────────────────────────────────────────────

async function _lav_f03(user) {
  const { el, close } = openModal({
    title: '🧪 Controle de Químicos',
    size: 'xl',
    body: `<div id="lav-qui-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-qui-novo-btn">+ Novo Produto</button>`,
  });

  async function loadQuimicos() {
    el.querySelector('#lav-qui-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/quimicos');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-qui-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-qui-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Produto</th><th>Tipo</th><th>Estoque</th><th>Mínimo</th><th>Unid.</th><th>Fornecedor</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr${r.estoque_atual <= r.estoque_minimo ? ' style="background:rgba(239,68,68,0.05);"' : ''}>
                  <td><strong>${escapeHtml(r.nome)}</strong></td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td><strong style="color:${r.estoque_atual<=r.estoque_minimo?'#f87171':'inherit'}">${r.estoque_atual}</strong></td>
                  <td>${r.estoque_minimo}</td>
                  <td>${escapeHtml(r.unidade||'L')}</td>
                  <td>${escapeHtml(r.fornecedor||'—')}</td>
                  <td style="display:flex;gap:4px;">
                    <button class="btn btn-xs btn-secondary lav-qui-uso" data-id="${r.id}" data-nome="${escapeHtml(r.nome)}" data-unidade="${escapeHtml(r.unidade||'L')}">Registrar Uso</button>
                    <button class="btn btn-xs btn-secondary lav-qui-edit" data-id="${r.id}" data-nome="${escapeHtml(r.nome)}" data-estoque="${r.estoque_atual}" data-minimo="${r.estoque_minimo}">Editar</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      el.querySelectorAll('.lav-qui-uso').forEach(btn => {
        btn.addEventListener('click', () => {
          const { el: e2, close: c2 } = openModal({
            title: `Registrar Uso — ${btn.dataset.nome}`,
            size: 'sm',
            body: `
              <div class="form-group"><label class="form-label">Quantidade (${btn.dataset.unidade}) *</label>
                <input class="form-control" id="lav-uso-qty" type="number" step="0.001" min="0.001"></div>
              <div class="form-group"><label class="form-label">Data *</label>
                <input class="form-control" id="lav-uso-data" type="date" value="${_lav_today()}"></div>
              <div class="form-group"><label class="form-label">Total de Roupas (kg)</label>
                <input class="form-control" id="lav-uso-kg" type="number" step="0.1"></div>
              <div id="lav-uso-err"></div>`,
            footer: `<button class="btn btn-secondary" id="lav-uso-cancel">Cancelar</button>
                     <button class="btn btn-primary" id="lav-uso-save">Registrar</button>`,
          });
          e2.querySelector('#lav-uso-cancel').addEventListener('click', c2);
          e2.querySelector('#lav-uso-save').addEventListener('click', function() {
            _withSubmit(this, async () => {
              const qty = parseFloat(e2.querySelector('#lav-uso-qty').value);
              if (!qty || qty <= 0) { e2.querySelector('#lav-uso-err').innerHTML = '<div class="form-error">Quantidade inválida.</div>'; return; }
              try {
                await API.post('/lavanderia/quimicos/' + btn.dataset.id + '/uso', {
                  quantidade: qty,
                  data_uso: e2.querySelector('#lav-uso-data').value,
                  total_kg_roupas: e2.querySelector('#lav-uso-kg').value || null,
                });
                showToast('Uso registrado!', 'success');
                c2(); loadQuimicos();
              } catch(e) { e2.querySelector('#lav-uso-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
            });
          });
        });
      });

      el.querySelectorAll('.lav-qui-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const { el: e2, close: c2 } = openModal({
            title: 'Editar Estoque',
            size: 'sm',
            body: `
              <div class="form-group"><label class="form-label">Estoque Atual</label>
                <input class="form-control" id="lav-qe-atual" type="number" step="0.001" value="${btn.dataset.estoque}"></div>
              <div class="form-group"><label class="form-label">Estoque Mínimo</label>
                <input class="form-control" id="lav-qe-min" type="number" step="0.001" value="${btn.dataset.minimo}"></div>
              <div id="lav-qe-err"></div>`,
            footer: `<button class="btn btn-secondary" id="lav-qe-cancel">Cancelar</button>
                     <button class="btn btn-primary" id="lav-qe-save">Salvar</button>`,
          });
          e2.querySelector('#lav-qe-cancel').addEventListener('click', c2);
          e2.querySelector('#lav-qe-save').addEventListener('click', function() {
            _withSubmit(this, async () => {
              try {
                await API.put('/lavanderia/quimicos/' + btn.dataset.id, {
                  estoque_atual:  parseFloat(e2.querySelector('#lav-qe-atual').value),
                  estoque_minimo: parseFloat(e2.querySelector('#lav-qe-min').value),
                });
                showToast('Estoque atualizado!', 'success');
                c2(); loadQuimicos();
              } catch(e) { e2.querySelector('#lav-qe-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
            });
          });
        });
      });
    } catch(e) {
      el.querySelector('#lav-qui-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-qui-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Produto Químico',
      size: 'sm',
      body: `
        <div class="form-group"><label class="form-label">Nome *</label>
          <input class="form-control" id="lav-nq-nome" placeholder="ex: Sabão Industrial XYZ"></div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Tipo</label>
            <select class="form-control" id="lav-nq-tipo">
              <option value="sabao">Sabão</option>
              <option value="cloro">Cloro</option>
              <option value="amaciante">Amaciante</option>
              <option value="desinfetante">Desinfetante</option>
              <option value="outro">Outro</option>
            </select></div>
          <div class="form-group" style="flex:1"><label class="form-label">Unidade</label>
            <input class="form-control" id="lav-nq-unidade" value="L" placeholder="L / kg"></div>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Estoque Atual</label>
            <input class="form-control" id="lav-nq-atual" type="number" step="0.001" value="0"></div>
          <div class="form-group" style="flex:1"><label class="form-label">Estoque Mínimo</label>
            <input class="form-control" id="lav-nq-min" type="number" step="0.001" value="0"></div>
        </div>
        <div class="form-group"><label class="form-label">Fornecedor</label>
          <input class="form-control" id="lav-nq-forn" placeholder="Nome do fornecedor"></div>
        <div id="lav-nq-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-nq-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-nq-save">Cadastrar</button>`,
    });
    e2.querySelector('#lav-nq-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-nq-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const nome = e2.querySelector('#lav-nq-nome').value.trim();
        if (!nome) { e2.querySelector('#lav-nq-err').innerHTML = '<div class="form-error">Nome é obrigatório.</div>'; return; }
        try {
          await API.post('/lavanderia/quimicos', {
            nome, tipo: e2.querySelector('#lav-nq-tipo').value,
            unidade: e2.querySelector('#lav-nq-unidade').value || 'L',
            estoque_atual: parseFloat(e2.querySelector('#lav-nq-atual').value)||0,
            estoque_minimo: parseFloat(e2.querySelector('#lav-nq-min').value)||0,
            fornecedor: e2.querySelector('#lav-nq-forn').value.trim() || null,
          });
          showToast('Produto cadastrado!', 'success');
          c2(); loadQuimicos();
        } catch(e) { e2.querySelector('#lav-nq-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadQuimicos();
}

// ── f04 Higienização de Botas e Aventais ──────────────────────────────────────

async function _lav_f04(user) {
  let usuarios = [];
  try { const d = await API.get('/lavanderia/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '🥾 Higienização de Botas e Aventais',
    size: 'xl',
    body: `<div id="lav-hig-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-hig-novo-btn">+ Registrar Higienização</button>`,
  });

  async function loadHig() {
    el.querySelector('#lav-hig-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/higienizacoes');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-hig-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-hig-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Item</th><th>Funcionário</th><th>Data</th><th>Método</th><th>Produto</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.tipo_item||'—')}</td>
                  <td>${escapeHtml(r.funcionario_nome||'—')}</td>
                  <td>${_lav_fmtD(r.data_higienizacao)}</td>
                  <td>${escapeHtml(r.metodo||'—')}</td>
                  <td>${escapeHtml(r.produto_usado||'—')}</td>
                  <td><span class="badge badge-${r.status==='concluido'?'success':r.status==='em_processo'?'info':'warning'}">${escapeHtml(r.status||'—')}</span></td>
                  <td>${r.status !== 'concluido' ? `<button class="btn btn-xs btn-success lav-hig-ok" data-id="${r.id}">Concluir</button>` : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-hig-ok').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await API.put('/lavanderia/higienizacoes/' + btn.dataset.id + '/status', { status: 'concluido' });
            showToast('Higienização concluída!', 'success'); loadHig();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); }
        });
      });
    } catch(e) {
      el.querySelector('#lav-hig-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-hig-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Higienização',
      size: 'md',
      body: `
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Tipo de Item</label>
            <select class="form-control" id="lav-nh-tipo">
              <option value="bota">Bota</option>
              <option value="avental">Avental</option>
              <option value="luva">Luva</option>
              <option value="capacete">Capacete</option>
              <option value="outro">Outro</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Método</label>
            <select class="form-control" id="lav-nh-metodo">
              <option value="lavagem_manual">Lavagem Manual</option>
              <option value="imersao_quimica">Imersão Química</option>
              <option value="vapor">Vapor</option>
              <option value="combinado">Combinado</option>
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Funcionário</label>
          <select class="form-control" id="lav-nh-func">
            <option value="">— Selecione —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('')}
          </select></div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Data</label>
            <input class="form-control" id="lav-nh-data" type="date" value="${_lav_today()}"></div>
          <div class="form-group" style="flex:1"><label class="form-label">Temperatura (°C)</label>
            <input class="form-control" id="lav-nh-temp" type="number" placeholder="ex: 60"></div>
        </div>
        <div class="form-group"><label class="form-label">Produto Utilizado</label>
          <input class="form-control" id="lav-nh-prod" placeholder="ex: Hipoclorito 5%"></div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="lav-nh-obs" rows="2"></textarea></div>
        <div id="lav-nh-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-nh-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-nh-save">Registrar</button>`,
    });
    e2.querySelector('#lav-nh-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-nh-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        try {
          await API.post('/lavanderia/higienizacoes', {
            tipo_item:      e2.querySelector('#lav-nh-tipo').value,
            funcionario_id: e2.querySelector('#lav-nh-func').value || null,
            data_higienizacao: e2.querySelector('#lav-nh-data').value,
            metodo:         e2.querySelector('#lav-nh-metodo').value,
            temperatura:    e2.querySelector('#lav-nh-temp').value || null,
            produto_usado:  e2.querySelector('#lav-nh-prod').value.trim() || null,
            observacao:     e2.querySelector('#lav-nh-obs').value.trim() || null,
          });
          showToast('Higienização registrada!', 'success');
          c2(); loadHig();
        } catch(e) { e2.querySelector('#lav-nh-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadHig();
}

// ── f05 Entrega de Limpos ─────────────────────────────────────────────────────

async function _lav_f05(user) {
  const { el, close } = openModal({
    title: '📦 Entrega de Limpos',
    size: 'xl',
    body: `<div id="lav-ent5-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  async function loadPendentes() {
    el.querySelector('#lav-ent5-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/entregas-pendentes');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) {
        el.querySelector('#lav-ent5-list').innerHTML = '<div class="empty-state"><span class="empty-state-icon">✅</span><span class="empty-state-title">Nenhuma peça aguardando entrega</span></div>';
        return;
      }
      el.querySelector('#lav-ent5-list').innerHTML = `
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">Peças lavadas prontas para devolução ao funcionário/setor.</p>
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Tipo</th><th>Funcionário</th><th>Setor</th><th>Lavado em</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.tipo_item||'—')}</td>
                  <td>${escapeHtml(r.funcionario_nome||'—')}</td>
                  <td>${escapeHtml(r.setor_nome||'—')}</td>
                  <td>${_lav_fmtDT(r.updated_at)}</td>
                  <td><button class="btn btn-xs btn-success lav-entregar" data-id="${r.id}">✔ Entregar</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-entregar').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await API.post('/lavanderia/entradas/' + btn.dataset.id + '/entregar', {});
            showToast('Entrega registrada!', 'success'); loadPendentes();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); }
        });
      });
    } catch(e) {
      el.querySelector('#lav-ent5-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  loadPendentes();
}

// ── f06 Estoque de Uniformes Novos ─────────────────────────────────────────────

async function _lav_f06(user, tipoFiltro) {
  const titulo = tipoFiltro ? '🪣 Controle de Toalhas' : '👔 Estoque de Uniformes Novos';
  const { el, close } = openModal({
    title: titulo,
    size: 'xl',
    body: `<div id="lav-est-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-est-novo-btn">+ Adicionar Item</button>`,
  });

  async function loadEstoque() {
    el.querySelector('#lav-est-list').innerHTML = _spinner();
    try {
      const qs = tipoFiltro ? `?tipo=${tipoFiltro}` : '';
      const d = await API.get('/lavanderia/estoque-uniformes' + qs);
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-est-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-est-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Tipo</th><th>Descrição</th><th>Tam.</th><th>Cor</th><th>Qtd</th><th>Mín.</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr${r.quantidade <= r.estoque_minimo ? ' style="background:rgba(239,68,68,0.05);"' : ''}>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${escapeHtml(r.descricao||'—')}</td>
                  <td>${escapeHtml(r.tamanho||'—')}</td>
                  <td>${escapeHtml(r.cor||'—')}</td>
                  <td><strong style="color:${r.quantidade<=r.estoque_minimo?'#f87171':'inherit'}">${r.quantidade}</strong></td>
                  <td>${r.estoque_minimo}</td>
                  <td>${escapeHtml(r.localizacao||'—')}</td>
                  <td><button class="btn btn-xs btn-secondary lav-est-edit" data-id="${r.id}" data-qty="${r.quantidade}" data-min="${r.estoque_minimo}">Ajustar</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-est-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const { el: e2, close: c2 } = openModal({
            title: 'Ajustar Quantidade',
            size: 'sm',
            body: `
              <div class="form-group"><label class="form-label">Quantidade</label>
                <input class="form-control" id="lav-ae-qty" type="number" min="0" value="${btn.dataset.qty}"></div>
              <div class="form-group"><label class="form-label">Estoque Mínimo</label>
                <input class="form-control" id="lav-ae-min" type="number" min="0" value="${btn.dataset.min}"></div>
              <div id="lav-ae-err"></div>`,
            footer: `<button class="btn btn-secondary" id="lav-ae-cancel">Cancelar</button>
                     <button class="btn btn-primary" id="lav-ae-save">Salvar</button>`,
          });
          e2.querySelector('#lav-ae-cancel').addEventListener('click', c2);
          e2.querySelector('#lav-ae-save').addEventListener('click', function() {
            _withSubmit(this, async () => {
              try {
                await API.put('/lavanderia/estoque-uniformes/' + btn.dataset.id, {
                  quantidade: parseInt(e2.querySelector('#lav-ae-qty').value)||0,
                  estoque_minimo: parseInt(e2.querySelector('#lav-ae-min').value)||0,
                });
                showToast('Estoque atualizado!', 'success'); c2(); loadEstoque();
              } catch(e) { e2.querySelector('#lav-ae-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
            });
          });
        });
      });
    } catch(e) {
      el.querySelector('#lav-est-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-est-novo-btn').addEventListener('click', () => {
    const tipos = [
      ['camisa','Camisa'], ['calca','Calça'], ['jaleco','Jaleco'], ['avental','Avental'],
      ['toalha_tecido','Toalha de Tecido'], ['toalha_papel','Toalha de Papel'],
      ['bone','Boné'], ['bota','Bota'], ['outro','Outro'],
    ];
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Item de Estoque',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Tipo *</label>
          <select class="form-control" id="lav-ni-tipo">
            ${tipos.map(([v,l]) => `<option value="${v}"${tipoFiltro === v ? ' selected' : ''}>${l}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Descrição</label>
          <input class="form-control" id="lav-ni-desc" placeholder="ex: Camisa polo azul manga curta"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Tamanho</label>
            <input class="form-control" id="lav-ni-tam" placeholder="P/M/G/44"></div>
          <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Cor</label>
            <input class="form-control" id="lav-ni-cor" placeholder="Azul"></div>
          <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Quantidade</label>
            <input class="form-control" id="lav-ni-qty" type="number" min="0" value="0"></div>
          <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Mínimo</label>
            <input class="form-control" id="lav-ni-min" type="number" min="0" value="5"></div>
        </div>
        <div class="form-group"><label class="form-label">Localização</label>
          <input class="form-control" id="lav-ni-local" placeholder="ex: Prateleira A3"></div>
        <div id="lav-ni-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-ni-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-ni-save">Cadastrar</button>`,
    });
    e2.querySelector('#lav-ni-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-ni-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        try {
          await API.post('/lavanderia/estoque-uniformes', {
            tipo:           e2.querySelector('#lav-ni-tipo').value,
            descricao:      e2.querySelector('#lav-ni-desc').value.trim() || null,
            tamanho:        e2.querySelector('#lav-ni-tam').value.trim() || null,
            cor:            e2.querySelector('#lav-ni-cor').value.trim() || null,
            quantidade:     parseInt(e2.querySelector('#lav-ni-qty').value)||0,
            estoque_minimo: parseInt(e2.querySelector('#lav-ni-min').value)||5,
            localizacao:    e2.querySelector('#lav-ni-local').value.trim() || null,
          });
          showToast('Item cadastrado!', 'success'); c2(); loadEstoque();
        } catch(e) { e2.querySelector('#lav-ni-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadEstoque();
}

// ── f07 Baixa e Descarte ──────────────────────────────────────────────────────

async function _lav_f07(user) {
  let uniformes = [];
  try { const d = await API.get('/lavanderia/uniformes'); uniformes = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '🗑️ Baixa e Descarte de Uniformes',
    size: 'xl',
    body: `<div id="lav-desc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-danger" id="lav-desc-novo-btn">+ Registrar Descarte</button>`,
  });

  async function loadDescartes() {
    el.querySelector('#lav-desc-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/descartes');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-desc-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-desc-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Item</th><th>Motivo</th><th>Descrição</th><th>Valor Est.</th><th>Registrado por</th><th>Data</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.uniforme_codigo || r.tipo_item||'—')}</td>
                  <td><span class="badge badge-danger">${escapeHtml(r.motivo||'—')}</span></td>
                  <td>${escapeHtml(r.descricao||'—')}</td>
                  <td>${r.valor_estimado ? 'R$ ' + parseFloat(r.valor_estimado).toFixed(2) : '—'}</td>
                  <td>${escapeHtml(r.registrado_por_nome||'—')}</td>
                  <td>${_lav_fmtDT(r.created_at)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch(e) {
      el.querySelector('#lav-desc-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-desc-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Registrar Descarte',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Uniforme Cadastrado (opcional)</label>
          <select class="form-control" id="lav-nd-uni">
            <option value="">— Não vinculado —</option>
            ${uniformes.map(u => `<option value="${u.id}">${escapeHtml(u.codigo)} — ${escapeHtml(u.tipo||'')} ${escapeHtml(u.tamanho||'')} ${escapeHtml(u.funcionario_nome?'('+u.funcionario_nome+')':'')}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Tipo de Item *</label>
          <input class="form-control" id="lav-nd-tipo" value="uniforme" placeholder="uniforme / bota / avental..."></div>
        <div class="form-group"><label class="form-label">Motivo *</label>
          <select class="form-control" id="lav-nd-motivo">
            <option value="rasgado">Rasgado</option>
            <option value="manchado">Manchado</option>
            <option value="desgastado">Desgastado</option>
            <option value="perdido">Perdido</option>
            <option value="outro">Outro</option>
          </select></div>
        <div class="form-group"><label class="form-label">Descrição</label>
          <textarea class="form-control" id="lav-nd-desc" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">Valor Estimado (R$)</label>
          <input class="form-control" id="lav-nd-valor" type="number" step="0.01" min="0" placeholder="0.00"></div>
        <div id="lav-nd-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-nd-cancel">Cancelar</button>
               <button class="btn btn-danger" id="lav-nd-save">Confirmar Descarte</button>`,
    });
    e2.querySelector('#lav-nd-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-nd-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        if (!confirm('Confirmar descarte? Esta ação desativará o uniforme no sistema.')) return;
        try {
          await API.post('/lavanderia/descartes', {
            uniforme_id:    e2.querySelector('#lav-nd-uni').value || null,
            tipo_item:      e2.querySelector('#lav-nd-tipo').value.trim() || 'uniforme',
            motivo:         e2.querySelector('#lav-nd-motivo').value,
            descricao:      e2.querySelector('#lav-nd-desc').value.trim() || null,
            valor_estimado: e2.querySelector('#lav-nd-valor').value || null,
          });
          showToast('Descarte registrado!', 'success'); c2(); loadDescartes();
        } catch(e) { e2.querySelector('#lav-nd-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadDescartes();
}

// ── f08 Gestão de Reparos ─────────────────────────────────────────────────────

async function _lav_f08(user) {
  let uniformes = [];
  try { const d = await API.get('/lavanderia/uniformes'); uniformes = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '🧵 Gestão de Reparos (Costura)',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="lav-rep-fil" style="width:160px;">
          <option value="">Todos</option>
          <option value="aguardando">Aguardando</option>
          <option value="em_reparo">Em reparo</option>
          <option value="concluido">Concluído</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="lav-rep-buscar">Filtrar</button>
      </div>
      <div id="lav-rep-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-rep-novo-btn">+ Novo Reparo</button>`,
  });

  async function loadReparos() {
    const status = el.querySelector('#lav-rep-fil').value;
    el.querySelector('#lav-rep-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/reparos' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-rep-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-rep-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Item</th><th>Tipo Reparo</th><th>Responsável</th><th>Entrada</th><th>Retorno</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.uniforme_codigo || r.tipo_item||'—')}</td>
                  <td>${escapeHtml(r.tipo_reparo||'—')}</td>
                  <td>${escapeHtml(r.responsavel||'—')}</td>
                  <td>${_lav_fmtD(r.data_entrada)}</td>
                  <td>${_lav_fmtD(r.data_retorno)}</td>
                  <td>${_lav_reparoBadge(r.status)}</td>
                  <td>${r.status !== 'concluido' && r.status !== 'sem_conserto' ? `
                    <select class="form-control form-control-xs lav-rep-status" data-id="${r.id}" style="width:120px;">
                      <option value="">— mudar —</option>
                      <option value="em_reparo">Em reparo</option>
                      <option value="concluido">Concluído</option>
                      <option value="sem_conserto">Sem conserto</option>
                    </select>` : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-rep-status').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          try {
            await API.put('/lavanderia/reparos/' + this.dataset.id, { status: this.value });
            showToast('Status atualizado!', 'success'); loadReparos();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
        });
      });
    } catch(e) {
      el.querySelector('#lav-rep-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-rep-buscar').addEventListener('click', loadReparos);
  el.querySelector('#lav-rep-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Reparo',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Uniforme Vinculado</label>
          <select class="form-control" id="lav-nr-uni">
            <option value="">— Não vinculado —</option>
            ${uniformes.map(u => `<option value="${u.id}">${escapeHtml(u.codigo)} — ${escapeHtml(u.tipo||'')} ${u.funcionario_nome?'('+escapeHtml(u.funcionario_nome)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Tipo de Item</label>
          <input class="form-control" id="lav-nr-tipo" value="uniforme"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Tipo de Reparo</label>
            <select class="form-control" id="lav-nr-reparo">
              <option value="botao">Botão</option>
              <option value="ziper">Zíper</option>
              <option value="remendo">Remendo</option>
              <option value="costura_geral">Costura Geral</option>
              <option value="outro">Outro</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:120px;"><label class="form-label">Data de Entrada</label>
            <input class="form-control" id="lav-nr-data" type="date" value="${_lav_today()}"></div>
        </div>
        <div class="form-group"><label class="form-label">Responsável (costureira)</label>
          <input class="form-control" id="lav-nr-resp" placeholder="Nome da costureira ou empresa"></div>
        <div class="form-group"><label class="form-label">Descrição do Problema</label>
          <textarea class="form-control" id="lav-nr-desc" rows="2"></textarea></div>
        <div id="lav-nr-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-nr-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-nr-save">Registrar Reparo</button>`,
    });
    e2.querySelector('#lav-nr-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-nr-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        try {
          await API.post('/lavanderia/reparos', {
            uniforme_id:  e2.querySelector('#lav-nr-uni').value || null,
            tipo_item:    e2.querySelector('#lav-nr-tipo').value.trim() || 'uniforme',
            tipo_reparo:  e2.querySelector('#lav-nr-reparo').value,
            data_entrada: e2.querySelector('#lav-nr-data').value,
            responsavel:  e2.querySelector('#lav-nr-resp').value.trim() || null,
            descricao:    e2.querySelector('#lav-nr-desc').value.trim() || null,
          });
          showToast('Reparo registrado!', 'success'); c2(); loadReparos();
        } catch(e) { e2.querySelector('#lav-nr-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadReparos();
}

// ── f09 Controle de Toalhas (reusa f06 com filtro) ────────────────────────────

async function _lav_f09(user) {
  await _lav_f06(user, 'toalha_tecido');
}

// ── f10 Inventário de Enxoval ──────────────────────────────────────────────────

async function _lav_f10(user) {
  const { el, close } = openModal({
    title: '📊 Inventário de Enxoval',
    size: 'xl',
    body: `<div id="lav-inv-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-inv-novo-btn">+ Novo Inventário</button>`,
  });

  async function loadInv() {
    el.querySelector('#lav-inv-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/inventarios');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-inv-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-inv-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Data</th><th>Registrado por</th><th>Status</th><th>Observações</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${_lav_fmtD(r.data_inventario)}</td>
                  <td>${escapeHtml(r.registrado_por_nome||'—')}</td>
                  <td><span class="badge badge-${r.status==='finalizado'?'success':'warning'}">${escapeHtml(r.status||'—')}</span></td>
                  <td>${escapeHtml(r.observacoes||'—')}</td>
                  <td><button class="btn btn-xs btn-secondary lav-inv-ver" data-id="${r.id}">Ver Itens</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-inv-ver').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const d2 = await API.get('/lavanderia/inventarios/' + btn.dataset.id);
            const inv = d2.data || d2;
            const itensHtml = (inv.itens||[]).length
              ? `<table class="table" style="margin-top:8px;"><thead><tr><th>Peça</th><th>Em Uso</th><th>Estoque</th><th>Sujas</th><th>Reparo</th><th>Descartadas</th></tr></thead><tbody>
                  ${inv.itens.map(i => `<tr><td>${escapeHtml(i.tipo_peca)}</td><td>${i.em_uso}</td><td>${i.em_estoque}</td><td>${i.sujas}</td><td>${i.em_reparo}</td><td>${i.descartadas}</td></tr>`).join('')}
                 </tbody></table>`
              : '<div class="empty-state" style="padding:16px">Sem itens registrados</div>';
            openModal({
              title: `Inventário — ${_lav_fmtD(inv.data_inventario)}`,
              size: 'lg',
              body: itensHtml,
              footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
            });
          } catch(e) { showToast('Erro ao carregar: ' + e.message, 'error'); }
        });
      });
    } catch(e) {
      el.querySelector('#lav-inv-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-inv-novo-btn').addEventListener('click', () => {
    const tipos = ['Camisa','Calça','Jaleco','Avental','Toalha','Boné','Bota','Luva','Outro'];
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Inventário de Enxoval',
      size: 'lg',
      body: `
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <div class="form-group" style="flex:1"><label class="form-label">Data do Inventário</label>
            <input class="form-control" id="lav-ni2-data" type="date" value="${_lav_today()}"></div>
          <div class="form-group" style="flex:2"><label class="form-label">Observações</label>
            <input class="form-control" id="lav-ni2-obs" placeholder="Observações gerais..."></div>
        </div>
        <div style="overflow-x:auto;">
          <table class="table" id="lav-ni2-table">
            <thead><tr><th>Tipo de Peça</th><th>Em Uso</th><th>Estoque</th><th>Sujas</th><th>Reparo</th><th>Descartadas</th></tr></thead>
            <tbody>
              ${tipos.map(t => `
                <tr data-tipo="${escapeHtml(t)}">
                  <td>${escapeHtml(t)}</td>
                  <td><input type="number" class="form-control inv-em_uso" min="0" value="0" style="width:70px"></td>
                  <td><input type="number" class="form-control inv-em_estoque" min="0" value="0" style="width:70px"></td>
                  <td><input type="number" class="form-control inv-sujas" min="0" value="0" style="width:70px"></td>
                  <td><input type="number" class="form-control inv-em_reparo" min="0" value="0" style="width:70px"></td>
                  <td><input type="number" class="form-control inv-descartadas" min="0" value="0" style="width:70px"></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div id="lav-ni2-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-ni2-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-ni2-save">Salvar Inventário</button>`,
    });
    e2.querySelector('#lav-ni2-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-ni2-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const itens = [...e2.querySelectorAll('#lav-ni2-table tbody tr')].map(tr => ({
          tipo_peca:    tr.dataset.tipo,
          em_uso:       parseInt(tr.querySelector('.inv-em_uso').value)||0,
          em_estoque:   parseInt(tr.querySelector('.inv-em_estoque').value)||0,
          sujas:        parseInt(tr.querySelector('.inv-sujas').value)||0,
          em_reparo:    parseInt(tr.querySelector('.inv-em_reparo').value)||0,
          descartadas:  parseInt(tr.querySelector('.inv-descartadas').value)||0,
        }));
        try {
          await API.post('/lavanderia/inventarios', {
            data_inventario: e2.querySelector('#lav-ni2-data').value,
            observacoes: e2.querySelector('#lav-ni2-obs').value.trim() || null,
            itens,
          });
          showToast('Inventário salvo!', 'success'); c2(); loadInv();
        } catch(e) { e2.querySelector('#lav-ni2-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadInv();
}

// ── f11 Gestão de Armários ─────────────────────────────────────────────────────

async function _lav_f11(user) {
  let usuarios = [];
  try { const d = await API.get('/lavanderia/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '🔑 Gestão de Armários — Vestiário',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select class="form-control" id="lav-arm-fil" style="width:150px;">
          <option value="">Todos</option>
          <option value="disponivel">Disponível</option>
          <option value="ocupado">Ocupado</option>
          <option value="manutencao">Manutenção</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="lav-arm-buscar">Filtrar</button>
      </div>
      <div id="lav-arm-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-arm-novo-btn">+ Novo Armário</button>`,
  });

  async function loadArmarios() {
    const status = el.querySelector('#lav-arm-fil').value;
    el.querySelector('#lav-arm-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/armarios' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-arm-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-arm-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Código</th><th>Vestiário</th><th>Localização</th><th>Ocupante</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><strong>${escapeHtml(r.codigo)}</strong></td>
                  <td>${escapeHtml(r.tipo_vestiario||'—')}</td>
                  <td>${escapeHtml(r.localizacao||'—')}</td>
                  <td>${escapeHtml(r.funcionario_nome||'—')}</td>
                  <td><span class="badge badge-${r.status==='disponivel'?'success':r.status==='manutencao'?'warning':'info'}">${escapeHtml(r.status||'—')}</span></td>
                  <td>
                    <select class="form-control form-control-xs lav-arm-atribuir" data-id="${r.id}" style="width:140px;">
                      <option value="">— atribuir —</option>
                      <option value="__liberar__">🔓 Liberar</option>
                      <option value="__manutencao__">🔧 Manutenção</option>
                      ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('')}
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-arm-atribuir').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          let payload = {};
          if (this.value === '__liberar__')     payload = { status: 'disponivel', funcionario_id: null };
          else if (this.value === '__manutencao__') payload = { status: 'manutencao', funcionario_id: null };
          else payload = { funcionario_id: Number(this.value), status: 'ocupado' };
          try {
            await API.put('/lavanderia/armarios/' + this.dataset.id, payload);
            showToast('Armário atualizado!', 'success'); loadArmarios();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
        });
      });
    } catch(e) {
      el.querySelector('#lav-arm-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-arm-buscar').addEventListener('click', loadArmarios);
  el.querySelector('#lav-arm-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Armário',
      size: 'sm',
      body: `
        <div class="form-group"><label class="form-label">Código *</label>
          <input class="form-control" id="lav-na-cod" placeholder="ex: A01 / VF-05"></div>
        <div class="form-group"><label class="form-label">Vestiário</label>
          <select class="form-control" id="lav-na-vest">
            <option value="misto">Misto</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select></div>
        <div class="form-group"><label class="form-label">Localização</label>
          <input class="form-control" id="lav-na-local" placeholder="ex: Bloco B, 2º corredor"></div>
        <div id="lav-na-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-na-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-na-save">Cadastrar</button>`,
    });
    e2.querySelector('#lav-na-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-na-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const codigo = e2.querySelector('#lav-na-cod').value.trim();
        if (!codigo) { e2.querySelector('#lav-na-err').innerHTML = '<div class="form-error">Código é obrigatório.</div>'; return; }
        try {
          await API.post('/lavanderia/armarios', {
            codigo,
            tipo_vestiario: e2.querySelector('#lav-na-vest').value,
            localizacao: e2.querySelector('#lav-na-local').value.trim() || null,
          });
          showToast('Armário cadastrado!', 'success'); c2(); loadArmarios();
        } catch(e) { e2.querySelector('#lav-na-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadArmarios();
}

// ── f12 Solicitação de Compra de Insumos ──────────────────────────────────────

async function _lav_f12(user) {
  openModal({
    title: '🛒 Solicitação de Compra de Insumos',
    size: 'md',
    body: `
      <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:14px;">
        Gera pedido de compra quando químicos ou uniformes estão abaixo do estoque mínimo.
        Use a função global <strong>Solicitação de Compra</strong> para abrir o pedido formal junto ao setor de Compras.
      </p>
      <div id="lav-compra-alerta">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });
  try {
    const [qui, est] = await Promise.all([
      API.get('/lavanderia/quimicos').then(d => Array.isArray(d) ? d : (d.data || [])),
      API.get('/lavanderia/estoque-uniformes').then(d => Array.isArray(d) ? d : (d.data || [])),
    ]);
    const baixosQui = qui.filter(q => q.estoque_atual <= q.estoque_minimo);
    const baixosEst = est.filter(e => e.quantidade <= e.estoque_minimo);
    const el = document.getElementById('lav-compra-alerta');
    if (!el) return;
    if (!baixosQui.length && !baixosEst.length) {
      el.innerHTML = '<div class="empty-state"><span class="empty-state-icon">✅</span><span class="empty-state-title">Todos os itens estão dentro do estoque mínimo</span></div>';
      return;
    }
    el.innerHTML = `
      ${baixosQui.length ? `<div style="margin-bottom:14px;"><strong>Químicos abaixo do mínimo:</strong>
        <ul style="margin:8px 0 0 16px;color:var(--text-muted);font-size:13px;">
          ${baixosQui.map(q => `<li>${escapeHtml(q.nome)}: ${q.estoque_atual}${q.unidade} (mín: ${q.estoque_minimo}${q.unidade})</li>`).join('')}
        </ul></div>` : ''}
      ${baixosEst.length ? `<div><strong>Uniformes/itens abaixo do mínimo:</strong>
        <ul style="margin:8px 0 0 16px;color:var(--text-muted);font-size:13px;">
          ${baixosEst.map(e => `<li>${escapeHtml(e.tipo)} ${escapeHtml(e.tamanho||'')} ${escapeHtml(e.cor||'')}: ${e.quantidade}un (mín: ${e.estoque_minimo}un)</li>`).join('')}
        </ul></div>` : ''}
      <div style="margin-top:16px;padding:10px;background:rgba(59,130,246,0.08);border-radius:8px;font-size:13px;color:#60a5fa;">
        ℹ️ Para formalizar o pedido, utilize a função <strong>Solicitação de Compra</strong> no menu global (nível ≥ Supervisor).
      </div>`;
  } catch(e) {
    const el = document.getElementById('lav-compra-alerta');
    if (el) el.innerHTML = `<div class="form-error">Erro ao carregar: ${escapeHtml(e.message)}</div>`;
  }
}

// ── f13 Controle de EPIs ───────────────────────────────────────────────────────

async function _lav_f13(user) {
  let usuarios = [];
  try { const d = await API.get('/lavanderia/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '🦺 Controle de EPIs da Lavanderia',
    size: 'xl',
    body: `<div id="lav-epi-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-epi-novo-btn">+ Registrar Verificação</button>`,
  });

  async function loadEpis() {
    el.querySelector('#lav-epi-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/epis');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-epi-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-epi-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Funcionário</th><th>EPI</th><th>Data</th><th>Em Uso</th><th>Condição</th><th>Verificado por</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr${r.condicao==='substituir'?' style="background:rgba(239,68,68,0.05);"':''}>
                  <td>${escapeHtml(r.funcionario_nome||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo_epi||'—')}</span></td>
                  <td>${_lav_fmtD(r.data_verificacao)}</td>
                  <td>${r.em_uso ? '<span class="badge badge-success">Sim</span>' : '<span class="badge badge-danger">Não</span>'}</td>
                  <td><span class="badge badge-${r.condicao==='bom'?'success':r.condicao==='regular'?'warning':'danger'}">${escapeHtml(r.condicao||'—')}</span></td>
                  <td>${escapeHtml(r.verificado_por_nome||'—')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch(e) {
      el.querySelector('#lav-epi-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-epi-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Registrar Verificação de EPI',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Funcionário *</label>
          <select class="form-control" id="lav-ne2-func">
            <option value="">— Selecione —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('')}
          </select></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:140px;"><label class="form-label">Tipo de EPI *</label>
            <select class="form-control" id="lav-ne2-tipo">
              <option value="luva_termica">Luva Térmica</option>
              <option value="mascara">Máscara</option>
              <option value="oculos">Óculos</option>
              <option value="avental_quimico">Avental Químico</option>
              <option value="outro">Outro</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:110px;"><label class="form-label">Data</label>
            <input class="form-control" id="lav-ne2-data" type="date" value="${_lav_today()}"></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1"><label class="form-label">Em Uso?</label>
            <select class="form-control" id="lav-ne2-emuso">
              <option value="1">Sim</option>
              <option value="0">Não</option>
            </select></div>
          <div class="form-group" style="flex:1"><label class="form-label">Condição</label>
            <select class="form-control" id="lav-ne2-cond">
              <option value="bom">Bom</option>
              <option value="regular">Regular</option>
              <option value="substituir">Substituir</option>
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="lav-ne2-obs" rows="2"></textarea></div>
        <div id="lav-ne2-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-ne2-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-ne2-save">Registrar</button>`,
    });
    e2.querySelector('#lav-ne2-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-ne2-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const func = e2.querySelector('#lav-ne2-func').value;
        if (!func) { e2.querySelector('#lav-ne2-err').innerHTML = '<div class="form-error">Selecione um funcionário.</div>'; return; }
        try {
          await API.post('/lavanderia/epis', {
            funcionario_id:   parseInt(func),
            tipo_epi:         e2.querySelector('#lav-ne2-tipo').value,
            data_verificacao: e2.querySelector('#lav-ne2-data').value,
            em_uso:           e2.querySelector('#lav-ne2-emuso').value === '1',
            condicao:         e2.querySelector('#lav-ne2-cond').value,
            observacao:       e2.querySelector('#lav-ne2-obs').value.trim() || null,
          });
          showToast('Verificação registrada!', 'success'); c2(); loadEpis();
        } catch(e) { e2.querySelector('#lav-ne2-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadEpis();
}

// ── f14 Gerenciar Solicitações de Higienização ────────────────────────────────

async function _lav_f14(user) {
  const { el, close } = openModal({
    title: '📋 Gerenciar Solicitações de Higienização',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select class="form-control" id="lav-sol-fil" style="width:150px;">
          <option value="pendente">Pendentes</option>
          <option value="aceita">Aceitas</option>
          <option value="coletado">Coletadas</option>
          <option value="">Todas</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="lav-sol-buscar">Filtrar</button>
      </div>
      <div id="lav-sol-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  const statusColors = { pendente: 'warning', aceita: 'info', coletado: 'info', lavando: 'info', entregue: 'success', cancelada: 'muted' };

  async function loadSol() {
    const status = el.querySelector('#lav-sol-fil').value;
    el.querySelector('#lav-sol-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/solicitacoes' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-sol-list').innerHTML = _empty(); return; }
      el.querySelector('#lav-sol-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Solicitante</th><th>Tipo</th><th>Qtd</th><th>Preferencial</th><th>Status</th><th>Observação</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${r.quantidade_pecas||1}</td>
                  <td>${_lav_fmtD(r.data_preferencial)}</td>
                  <td><span class="badge badge-${statusColors[r.status]||'muted'}">${escapeHtml(r.status||'—')}</span></td>
                  <td>${escapeHtml(r.observacao||'—')}</td>
                  <td>
                    <select class="form-control form-control-xs lav-sol-status" data-id="${r.id}" style="width:130px;">
                      <option value="">— mudar —</option>
                      <option value="aceita">Aceitar</option>
                      <option value="coletado">Coletado</option>
                      <option value="lavando">Lavando</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelada">Cancelar</option>
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-sol-status').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          try {
            await API.put('/lavanderia/solicitacoes/' + this.dataset.id, { status: this.value });
            showToast('Status atualizado!', 'success'); loadSol();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
        });
      });
    } catch(e) {
      el.querySelector('#lav-sol-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-sol-buscar').addEventListener('click', loadSol);
  loadSol();
}

// ── f15 Ver Escala ─────────────────────────────────────────────────────────────

async function _lav_f15(user) {
  const { el, close } = openModal({
    title: '📅 Escala e Manutenções — Lavanderia',
    size: 'lg',
    body: `<div id="lav-esc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" id="lav-esc-close">Fechar</button>`,
  });
  el.querySelector('#lav-esc-close').addEventListener('click', close);
  try {
    const d = await API.get('/lavanderia/escalas');
    const rows = Array.isArray(d) ? d : (d.data || []);
    if (!rows.length) { el.querySelector('#lav-esc-list').innerHTML = _empty(); return; }
    const turnoIcon = { manha: '🌅', tarde: '🌤️', noite: '🌙', plantao: '🛡️' };
    el.querySelector('#lav-esc-list').innerHTML = `
      <div style="overflow-x:auto;">
        <table class="table">
          <thead><tr><th>Funcionário</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.nome_exibir||'—')}</td>
                <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                <td>${_lav_fmtD(r.data_inicio)}</td>
                <td>${_lav_fmtD(r.data_fim)}</td>
                <td>${escapeHtml(r.observacao||'—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    el.querySelector('#lav-esc-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
  }
}

// ── f16 Gerenciar Escalas ─────────────────────────────────────────────────────

async function _lav_f16(user) {
  let usuarios = [];
  try { const d = await API.get('/lavanderia/usuarios'); usuarios = Array.isArray(d) ? d : (d.data || []); } catch {}

  const { el, close } = openModal({
    title: '📆 Gerenciar Escalas da Lavanderia',
    size: 'xl',
    body: `<div id="lav-eg-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="lav-eg-novo-btn">+ Nova Escala</button>`,
  });

  async function loadEscalas() {
    el.querySelector('#lav-eg-list').innerHTML = _spinner();
    try {
      const d = await API.get('/lavanderia/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#lav-eg-list').innerHTML = _empty(); return; }
      const turnoIcon = { manha: '🌅', tarde: '🌤️', noite: '🌙', plantao: '🛡️' };
      el.querySelector('#lav-eg-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Funcionário</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.nome_exibir||'—')}</td>
                  <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${_lav_fmtD(r.data_inicio)}</td>
                  <td>${_lav_fmtD(r.data_fim)}</td>
                  <td>${escapeHtml(r.observacao||'—')}</td>
                  <td><button class="btn btn-xs btn-danger lav-eg-del" data-id="${r.id}">Excluir</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.lav-eg-del').forEach(btn => {
        btn.addEventListener('click', function() {
          _withSubmit(this, async () => {
            if (!confirm('Excluir esta escala?')) return;
            try {
              await API.delete('/lavanderia/escalas/' + btn.dataset.id);
              showToast('Escala excluída!', 'success'); loadEscalas();
            } catch(e) { showToast('Erro: ' + e.message, 'error'); }
          });
        });
      });
    } catch(e) {
      el.querySelector('#lav-eg-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#lav-eg-novo-btn').addEventListener('click', () => {
    const today = _lav_today();
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Escala',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Funcionário</label>
          <select class="form-control" id="lav-ne3-func">
            <option value="">— Externo / nome manual —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Nome (se externo)</label>
          <input class="form-control" id="lav-ne3-nome" placeholder="Nome completo..."></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:110px;"><label class="form-label">Turno</label>
            <select class="form-control" id="lav-ne3-turno">
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
              <option value="plantao">Plantão</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:110px;"><label class="form-label">Tipo</label>
            <select class="form-control" id="lav-ne3-tipo">
              <option value="normal">Normal</option>
              <option value="ferias">Férias</option>
              <option value="folga">Folga</option>
              <option value="plantao">Plantão</option>
            </select></div>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Data Início *</label>
            <input class="form-control" id="lav-ne3-ini" type="date" value="${today}"></div>
          <div class="form-group" style="flex:1"><label class="form-label">Data Fim *</label>
            <input class="form-control" id="lav-ne3-fim" type="date" value="${today}"></div>
        </div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="lav-ne3-obs" rows="2"></textarea></div>
        <div id="lav-ne3-err"></div>`,
      footer: `<button class="btn btn-secondary" id="lav-ne3-cancel">Cancelar</button>
               <button class="btn btn-primary" id="lav-ne3-save">Salvar Escala</button>`,
    });
    e2.querySelector('#lav-ne3-cancel').addEventListener('click', c2);
    e2.querySelector('#lav-ne3-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const ini = e2.querySelector('#lav-ne3-ini').value;
        const fim = e2.querySelector('#lav-ne3-fim').value;
        if (!ini || !fim) { e2.querySelector('#lav-ne3-err').innerHTML = '<div class="form-error">Datas são obrigatórias.</div>'; return; }
        const funcId = e2.querySelector('#lav-ne3-func').value;
        const nome   = e2.querySelector('#lav-ne3-nome').value.trim();
        if (!funcId && !nome) { e2.querySelector('#lav-ne3-err').innerHTML = '<div class="form-error">Selecione o funcionário ou informe o nome.</div>'; return; }
        try {
          await API.post('/lavanderia/escalas', {
            usuario_id:      funcId || null,
            funcionario_nome: nome  || null,
            turno:     e2.querySelector('#lav-ne3-turno').value,
            tipo:      e2.querySelector('#lav-ne3-tipo').value,
            data_inicio: ini, data_fim: fim,
            observacao:  e2.querySelector('#lav-ne3-obs').value.trim() || null,
          });
          showToast('Escala criada!', 'success'); c2(); loadEscalas();
        } catch(e) { e2.querySelector('#lav-ne3-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadEscalas();
}

// ── Export ────────────────────────────────────────────────────────────────────

const LavanderiaForms = {
  f01RecebimentoTriagem:              (user) => _lav_f01(user),
  f02RegistroCiclosLavagem:           (user) => _lav_f02(user),
  f03ControleQuimicos:                (user) => _lav_f03(user),
  f04HigienizacaoBotasAventais:       (user) => _lav_f04(user),
  f05EntregaLimpos:                   (user) => _lav_f05(user),
  f06EstoqueUniformesNovos:           (user) => _lav_f06(user, null),
  f07BaixaDescarte:                   (user) => _lav_f07(user),
  f08GestaoReparos:                   (user) => _lav_f08(user),
  f09ControleTolhas:                  (user) => _lav_f09(user),
  f10InventarioEnxoval:               (user) => _lav_f10(user),
  f11GestaoArmarios:                  (user) => _lav_f11(user),
  f12SolicitacaoCompraInsumos:        (user) => _lav_f12(user),
  f13ControleEPIs:                    (user) => _lav_f13(user),
  f14GerenciarSolicitacaoHigienizacao:(user) => _lav_f14(user),
  f15VerEscala:                       (user) => _lav_f15(user),
  f16GerenciarEscalas:                (user) => _lav_f16(user),
};

window.LavanderiaForms = LavanderiaForms;
