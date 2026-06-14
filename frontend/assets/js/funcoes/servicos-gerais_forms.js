'use strict';
/**
 * ServicosGeraisForms — Renderers de modal para as 19 funções de Serviços Gerais.
 */

// ── Helpers locais ────────────────────────────────────────────────────────────

function _sg_statusBadge(s) {
  const m = { planejado: 'info', em_andamento: 'warning', concluido: 'success', cancelado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _sg_jardStatusBadge(s) {
  const m = { agendado: 'info', em_andamento: 'warning', concluido: 'success', cancelado: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _sg_solStatusBadge(s) {
  const m = { pendente: 'warning', aceita: 'info', em_andamento: 'info', concluida: 'success', cancelada: 'muted' };
  return `<span class="badge badge-${m[s]||'muted'}">${escapeHtml(s||'—')}</span>`;
}
function _sg_urgBadge(u) {
  const m = { alta: 'danger', media: 'warning', baixa: 'success' };
  return `<span class="badge badge-${m[u]||'muted'}">${escapeHtml(u||'—')}</span>`;
}
function _sg_fmtD(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return '—'; }
}
function _sg_today() { return new Date().toISOString().split('T')[0]; }

// ── Helper: modal de atividade genérico ───────────────────────────────────────
// Usado por f02–f11, parametrizado por tipo e título

async function _sg_atividadeModal(user, tipo, titulo, produtoLabel) {
  let usuarios = [];
  try {
    const d = await API.get('/servicos-gerais/usuarios');
    usuarios = Array.isArray(d) ? d : (d.data || []);
  } catch {}

  const { el, close } = openModal({
    title: titulo,
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="sg-atv-fil-status" style="width:150px;">
          <option value="">Todos os status</option>
          <option value="planejado">Planejado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sg-atv-buscar">🔍 Filtrar</button>
      </div>
      <div id="sg-atv-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sg-atv-novo-btn">+ Registrar</button>`,
  });

  async function loadAtv() {
    const status = el.querySelector('#sg-atv-fil-status').value;
    el.querySelector('#sg-atv-list').innerHTML = _spinner();
    try {
      const qs = `?tipo=${tipo}` + (status ? `&status=${status}` : '');
      const d = await API.get('/servicos-gerais/atividades' + qs);
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-atv-list').innerHTML = _empty(); return; }
      el.querySelector('#sg-atv-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Título</th><th>Local</th><th>Data</th><th>Responsável</th>${produtoLabel?`<th>${escapeHtml(produtoLabel)}</th>`:''}  <th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.titulo||'—')}</td>
                  <td>${escapeHtml(r.local||'—')}</td>
                  <td>${_sg_fmtD(r.data_execucao)}</td>
                  <td>${escapeHtml(r.responsavel_exibir||'—')}</td>
                  ${produtoLabel?`<td>${escapeHtml(r.produto_utilizado||'—')}</td>`:''}
                  <td>${_sg_statusBadge(r.status)}</td>
                  <td>
                    <select class="form-control form-control-xs sg-atv-status-sel" data-id="${r.id}" style="width:120px;">
                      <option value="">— mudar —</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sg-atv-status-sel').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          try {
            await API.put('/servicos-gerais/atividades/' + this.dataset.id, { status: this.value });
            showToast('Status atualizado', 'success'); loadAtv();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
        });
      });
    } catch(e) {
      el.querySelector('#sg-atv-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-atv-buscar').addEventListener('click', loadAtv);
  el.querySelector('#sg-atv-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: `+ Nova — ${titulo.replace(/^[^\s]+ /,'')}`,
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Título / Descrição Curta *</label>
          <input class="form-control" id="sg-na-titulo" placeholder="ex: Corte de grama no pátio sul"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:2"><label class="form-label">Local</label>
            <input class="form-control" id="sg-na-local" placeholder="ex: Pátio externo, Bloco B..."></div>
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data *</label>
            <input class="form-control" id="sg-na-data" type="date" value="${_sg_today()}"></div>
        </div>
        <div class="form-group"><label class="form-label">Responsável (sistema)</label>
          <select class="form-control" id="sg-na-resp">
            <option value="">— Selecione ou informe abaixo —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Responsável (nome externo)</label>
          <input class="form-control" id="sg-na-resp-nome" placeholder="Nome manual, se não estiver no sistema"></div>
        ${produtoLabel ? `<div class="form-group"><label class="form-label">${escapeHtml(produtoLabel)}</label>
          <input class="form-control" id="sg-na-produto" placeholder="ex: Herbicida Round-Up 2L"></div>` : ''}
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="sg-na-obs" rows="2"></textarea></div>
        <div id="sg-na-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sg-na-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sg-na-save">Registrar</button>`,
    });
    e2.querySelector('#sg-na-cancel').addEventListener('click', c2);
    e2.querySelector('#sg-na-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const ttl = e2.querySelector('#sg-na-titulo').value.trim();
        if (!ttl) { e2.querySelector('#sg-na-err').innerHTML = '<div class="form-error">Título é obrigatório.</div>'; return; }
        try {
          await API.post('/servicos-gerais/atividades', {
            tipo,
            titulo:             ttl,
            local:              e2.querySelector('#sg-na-local').value.trim() || null,
            data_execucao:      e2.querySelector('#sg-na-data').value,
            responsavel_id:     e2.querySelector('#sg-na-resp').value || null,
            responsavel_nome:   e2.querySelector('#sg-na-resp-nome').value.trim() || null,
            produto_utilizado:  produtoLabel ? (e2.querySelector('#sg-na-produto').value.trim() || null) : null,
            observacao:         e2.querySelector('#sg-na-obs').value.trim() || null,
            status:             'planejado',
          });
          showToast('Registrado com sucesso!', 'success'); c2(); loadAtv();
        } catch(e) { e2.querySelector('#sg-na-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadAtv();
}

// ── f01 Cronograma de Jardinagem (somente leitura) ────────────────────────────

async function _sg_f01(user) {
  await _sg_f18(user, true); // reutiliza f18 em modo visualização
}

// ── f02 Controle de Ervas Daninhas ────────────────────────────────────────────

async function _sg_f02(user) {
  await _sg_atividadeModal(user, 'ervas_daninhas', '🌾 Controle de Ervas Daninhas', 'Produto Utilizado');
}

// ── f03 Manutenção de Cercas e Alambrados ────────────────────────────────────

async function _sg_f03(user) {
  await _sg_atividadeModal(user, 'manutencao_cerca', '🚧 Manutenção de Cercas e Alambrados', null);
}

// ── f04 Limpeza de Áreas Externas ─────────────────────────────────────────────

async function _sg_f04(user) {
  await _sg_atividadeModal(user, 'limpeza_externa', '🧹 Limpeza de Áreas Externas', null);
}

// ── f05 Pequenos Reparos de Alvenaria ─────────────────────────────────────────

async function _sg_f05(user) {
  await _sg_atividadeModal(user, 'reparo_alvenaria', '🧱 Pequenos Reparos de Alvenaria', 'Material Utilizado');
}

// ── f06 Pintura Predial ───────────────────────────────────────────────────────

async function _sg_f06(user) {
  await _sg_atividadeModal(user, 'pintura', '🎨 Pintura Predial', 'Tinta/Cor Utilizada');
}

// ── f07 Limpeza de Calhas e Telhados ─────────────────────────────────────────

async function _sg_f07(user) {
  await _sg_atividadeModal(user, 'limpeza_calha_telhado', '🏚️ Limpeza de Calhas e Telhados', null);
}

// ── f08 Limpeza de Caixas d'Água ─────────────────────────────────────────────

async function _sg_f08(user) {
  await _sg_atividadeModal(user, 'limpeza_caixa_agua', '💧 Limpeza de Caixas d\'Água', 'Produto Desinfetante');
}

// ── f09 Limpeza de Caixas de Gordura / Esgoto ─────────────────────────────────

async function _sg_f09(user) {
  await _sg_atividadeModal(user, 'limpeza_caixa_gordura', '🪣 Limpeza de Caixas de Gordura', null);
}

// ── f10 Lavagem Pesada (Hidrojateamento) ──────────────────────────────────────

async function _sg_f10(user) {
  await _sg_atividadeModal(user, 'hidrojateamento', '💦 Lavagem Pesada — Hidrojateamento', null);
}

// ── f11 Controle de Pragas ────────────────────────────────────────────────────

async function _sg_f11(user) {
  await _sg_atividadeModal(user, 'controle_pragas', '🐀 Apoio ao Controle de Pragas', 'Empresa / Produto Utilizado');
}

// ── f12 Controle de Ferramentas de Campo ──────────────────────────────────────

async function _sg_f12(user) {
  const { el, close } = openModal({
    title: '🔧 Controle de Ferramentas de Campo',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="sg-ferr-fil" style="width:160px;">
          <option value="">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="em_uso">Em Uso</option>
          <option value="em_manutencao">Em Manutenção</option>
          <option value="extraviado">Extraviado</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sg-ferr-buscar">Filtrar</button>
      </div>
      <div id="sg-ferr-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sg-ferr-novo-btn">+ Nova Ferramenta</button>`,
  });

  async function loadFerr() {
    const status = el.querySelector('#sg-ferr-fil').value;
    el.querySelector('#sg-ferr-list').innerHTML = _spinner();
    try {
      const d = await API.get('/servicos-gerais/ferramentas' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-ferr-list').innerHTML = _empty(); return; }
      el.querySelector('#sg-ferr-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Código</th><th>Nome</th><th>Tipo</th><th>Qtd</th><th>Local</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr${r.status==='extraviado'?' style="background:rgba(239,68,68,0.05);"':''}>
                  <td><code>${escapeHtml(r.codigo)}</code></td>
                  <td>${escapeHtml(r.nome)}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${r.quantidade}</td>
                  <td>${escapeHtml(r.localizacao||'—')}</td>
                  <td><span class="badge badge-${r.status==='disponivel'?'success':r.status==='em_uso'?'info':r.status==='extraviado'?'danger':'warning'}">${escapeHtml(r.status||'—')}</span></td>
                  <td>
                    <select class="form-control form-control-xs sg-ferr-mov" data-id="${r.id}" style="width:130px;">
                      <option value="">— movimento —</option>
                      <option value="retirada">Retirada</option>
                      <option value="devolucao">Devolução</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="extravio">Extravio</option>
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sg-ferr-mov').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          const mov = this.value;
          this.value = '';
          try {
            await API.post('/servicos-gerais/ferramentas/' + this.dataset.id + '/movimento', { tipo_movimento: mov });
            showToast('Movimento registrado!', 'success'); loadFerr();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); }
        });
      });
    } catch(e) {
      el.querySelector('#sg-ferr-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-ferr-buscar').addEventListener('click', loadFerr);
  el.querySelector('#sg-ferr-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Ferramenta',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Nome *</label>
          <input class="form-control" id="sg-nf-nome" placeholder="ex: Roçadeira Stihl FS55"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:110px;"><label class="form-label">Tipo</label>
            <select class="form-control" id="sg-nf-tipo">
              <option value="manual">Manual</option>
              <option value="motorizada">Motorizada</option>
              <option value="eletronica">Eletrônica</option>
              <option value="outro">Outro</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Quantidade</label>
            <input class="form-control" id="sg-nf-qty" type="number" min="1" value="1"></div>
          <div class="form-group" style="flex:1;min-width:80px;"><label class="form-label">Mín.</label>
            <input class="form-control" id="sg-nf-min" type="number" min="1" value="1"></div>
        </div>
        <div class="form-group"><label class="form-label">Localização</label>
          <input class="form-control" id="sg-nf-local" placeholder="ex: Depósito SG, Prateleira 2"></div>
        <div id="sg-nf-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sg-nf-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sg-nf-save">Cadastrar</button>`,
    });
    e2.querySelector('#sg-nf-cancel').addEventListener('click', c2);
    e2.querySelector('#sg-nf-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const nome = e2.querySelector('#sg-nf-nome').value.trim();
        if (!nome) { e2.querySelector('#sg-nf-err').innerHTML = '<div class="form-error">Nome é obrigatório.</div>'; return; }
        try {
          await API.post('/servicos-gerais/ferramentas', {
            nome,
            tipo:              e2.querySelector('#sg-nf-tipo').value,
            quantidade:        parseInt(e2.querySelector('#sg-nf-qty').value) || 1,
            quantidade_minima: parseInt(e2.querySelector('#sg-nf-min').value) || 1,
            localizacao:       e2.querySelector('#sg-nf-local').value.trim() || null,
          });
          showToast('Ferramenta cadastrada!', 'success'); c2(); loadFerr();
        } catch(e) { e2.querySelector('#sg-nf-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadFerr();
}

// ── f13 Controle de Insumos e Combustível ────────────────────────────────────

async function _sg_f13(user) {
  const { el, close } = openModal({
    title: '⛽ Controle de Insumos e Combustível',
    size: 'xl',
    body: `<div id="sg-ins-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sg-ins-novo-btn">+ Novo Insumo</button>`,
  });

  async function loadIns() {
    el.querySelector('#sg-ins-list').innerHTML = _spinner();
    try {
      const d = await API.get('/servicos-gerais/insumos');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-ins-list').innerHTML = _empty(); return; }
      el.querySelector('#sg-ins-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Nome</th><th>Tipo</th><th>Estoque</th><th>Mínimo</th><th>Unid.</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr${r.estoque_atual <= r.estoque_minimo?' style="background:rgba(239,68,68,0.05);"':''}>
                  <td><strong>${escapeHtml(r.nome)}</strong></td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td><strong style="color:${r.estoque_atual<=r.estoque_minimo?'#f87171':'inherit'}">${r.estoque_atual}</strong></td>
                  <td>${r.estoque_minimo}</td>
                  <td>${escapeHtml(r.unidade||'—')}</td>
                  <td style="display:flex;gap:4px;">
                    <button class="btn btn-xs btn-secondary sg-ins-uso" data-id="${r.id}" data-nome="${escapeHtml(r.nome)}" data-unidade="${escapeHtml(r.unidade||'L')}">Registrar Uso</button>
                    <button class="btn btn-xs btn-secondary sg-ins-edit" data-id="${r.id}" data-atual="${r.estoque_atual}" data-min="${r.estoque_minimo}">Editar</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      el.querySelectorAll('.sg-ins-uso').forEach(btn => {
        btn.addEventListener('click', () => {
          const { el: e2, close: c2 } = openModal({
            title: `Registrar Uso — ${btn.dataset.nome}`,
            size: 'sm',
            body: `
              <div class="form-group"><label class="form-label">Quantidade (${btn.dataset.unidade}) *</label>
                <input class="form-control" id="sg-uso-qty" type="number" step="0.001" min="0.001"></div>
              <div class="form-group"><label class="form-label">Data *</label>
                <input class="form-control" id="sg-uso-data" type="date" value="${_sg_today()}"></div>
              <div class="form-group"><label class="form-label">Equipamento</label>
                <input class="form-control" id="sg-uso-equip" placeholder="ex: Roçadeira FS55"></div>
              <div id="sg-uso-err"></div>`,
            footer: `<button class="btn btn-secondary" id="sg-uso-cancel">Cancelar</button>
                     <button class="btn btn-primary" id="sg-uso-save">Registrar</button>`,
          });
          e2.querySelector('#sg-uso-cancel').addEventListener('click', c2);
          e2.querySelector('#sg-uso-save').addEventListener('click', function() {
            _withSubmit(this, async () => {
              const qty = parseFloat(e2.querySelector('#sg-uso-qty').value);
              if (!qty || qty <= 0) { e2.querySelector('#sg-uso-err').innerHTML = '<div class="form-error">Quantidade inválida.</div>'; return; }
              try {
                await API.post('/servicos-gerais/insumos/' + btn.dataset.id + '/uso', {
                  quantidade: qty,
                  data_uso:   e2.querySelector('#sg-uso-data').value,
                  equipamento: e2.querySelector('#sg-uso-equip').value.trim() || null,
                });
                showToast('Uso registrado!', 'success'); c2(); loadIns();
              } catch(e) { e2.querySelector('#sg-uso-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
            });
          });
        });
      });

      el.querySelectorAll('.sg-ins-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const { el: e2, close: c2 } = openModal({
            title: 'Editar Estoque',
            size: 'sm',
            body: `
              <div class="form-group"><label class="form-label">Estoque Atual</label>
                <input class="form-control" id="sg-ie-atual" type="number" step="0.001" value="${btn.dataset.atual}"></div>
              <div class="form-group"><label class="form-label">Estoque Mínimo</label>
                <input class="form-control" id="sg-ie-min" type="number" step="0.001" value="${btn.dataset.min}"></div>
              <div id="sg-ie-err"></div>`,
            footer: `<button class="btn btn-secondary" id="sg-ie-cancel">Cancelar</button>
                     <button class="btn btn-primary" id="sg-ie-save">Salvar</button>`,
          });
          e2.querySelector('#sg-ie-cancel').addEventListener('click', c2);
          e2.querySelector('#sg-ie-save').addEventListener('click', function() {
            _withSubmit(this, async () => {
              try {
                await API.put('/servicos-gerais/insumos/' + btn.dataset.id, {
                  estoque_atual:  parseFloat(e2.querySelector('#sg-ie-atual').value),
                  estoque_minimo: parseFloat(e2.querySelector('#sg-ie-min').value),
                });
                showToast('Estoque atualizado!', 'success'); c2(); loadIns();
              } catch(e) { e2.querySelector('#sg-ie-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
            });
          });
        });
      });
    } catch(e) {
      el.querySelector('#sg-ins-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-ins-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Novo Insumo',
      size: 'sm',
      body: `
        <div class="form-group"><label class="form-label">Nome *</label>
          <input class="form-control" id="sg-ni-nome" placeholder="ex: Gasolina, Cimento CP-III..."></div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Tipo</label>
            <select class="form-control" id="sg-ni-tipo">
              <option value="combustivel">Combustível</option>
              <option value="cimento">Cimento</option>
              <option value="tinta">Tinta</option>
              <option value="fertilizante">Fertilizante</option>
              <option value="herbicida">Herbicida</option>
              <option value="outro">Outro</option>
            </select></div>
          <div class="form-group" style="flex:1"><label class="form-label">Unidade</label>
            <input class="form-control" id="sg-ni-unid" value="L" placeholder="L / kg / sc"></div>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Estoque Atual</label>
            <input class="form-control" id="sg-ni-atual" type="number" step="0.001" value="0"></div>
          <div class="form-group" style="flex:1"><label class="form-label">Mínimo</label>
            <input class="form-control" id="sg-ni-min" type="number" step="0.001" value="0"></div>
        </div>
        <div id="sg-ni-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sg-ni-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sg-ni-save">Cadastrar</button>`,
    });
    e2.querySelector('#sg-ni-cancel').addEventListener('click', c2);
    e2.querySelector('#sg-ni-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const nome = e2.querySelector('#sg-ni-nome').value.trim();
        if (!nome) { e2.querySelector('#sg-ni-err').innerHTML = '<div class="form-error">Nome é obrigatório.</div>'; return; }
        try {
          await API.post('/servicos-gerais/insumos', {
            nome,
            tipo:           e2.querySelector('#sg-ni-tipo').value,
            unidade:        e2.querySelector('#sg-ni-unid').value || 'L',
            estoque_atual:  parseFloat(e2.querySelector('#sg-ni-atual').value) || 0,
            estoque_minimo: parseFloat(e2.querySelector('#sg-ni-min').value)   || 0,
          });
          showToast('Insumo cadastrado!', 'success'); c2(); loadIns();
        } catch(e) { e2.querySelector('#sg-ni-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadIns();
}

// ── f14 Ver Solicitações de Apoio (somente leitura) ───────────────────────────

async function _sg_f14(user) {
  await _sg_solicitacoesModal(user, false);
}

// ── f15 Ver Escala ────────────────────────────────────────────────────────────

async function _sg_f15(user) {
  const { el, close } = openModal({
    title: '📅 Escala e Manutenções — Serviços Gerais',
    size: 'lg',
    body: `<div id="sg-esc-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" id="sg-esc-close">Fechar</button>`,
  });
  el.querySelector('#sg-esc-close').addEventListener('click', close);
  try {
    const d = await API.get('/servicos-gerais/escalas');
    const rows = Array.isArray(d) ? d : (d.data || []);
    if (!rows.length) { el.querySelector('#sg-esc-list').innerHTML = _empty(); return; }
    const turnoIcon = { manha: '🌅', tarde: '🌤️', noite: '🌙', plantao: '🛡️' };
    el.querySelector('#sg-esc-list').innerHTML = `
      <div style="overflow-x:auto;">
        <table class="table">
          <thead><tr><th>Funcionário</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.nome_exibir||'—')}</td>
                <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                <td>${_sg_fmtD(r.data_inicio)}</td>
                <td>${_sg_fmtD(r.data_fim)}</td>
                <td>${escapeHtml(r.observacao||'—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    el.querySelector('#sg-esc-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
  }
}

// ── Solicitações helper (f14 leitura / f16 gestão) ────────────────────────────

async function _sg_solicitacoesModal(user, editable) {
  const title = editable ? '📌 Gerenciar Solicitações de Apoio' : '📋 Ver Solicitações de Auxílio';
  const { el, close } = openModal({
    title,
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select class="form-control" id="sg-sol-fil" style="width:150px;">
          <option value="pendente">Pendentes</option>
          <option value="em_andamento">Em andamento</option>
          <option value="">Todas</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sg-sol-buscar">Filtrar</button>
      </div>
      <div id="sg-sol-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>`,
  });

  async function loadSol() {
    const status = el.querySelector('#sg-sol-fil').value;
    el.querySelector('#sg-sol-list').innerHTML = _spinner();
    try {
      const d = await API.get('/servicos-gerais/solicitacoes' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-sol-list').innerHTML = _empty(); return; }
      el.querySelector('#sg-sol-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Solicitante</th><th>Tipo</th><th>Local</th><th>Urgência</th><th>Status</th><th>Descrição</th>${editable?'<th>Ação</th>':''}</tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.solicitante_nome||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${escapeHtml(r.local||'—')}</td>
                  <td>${_sg_urgBadge(r.urgencia)}</td>
                  <td>${_sg_solStatusBadge(r.status)}</td>
                  <td style="max-width:200px;white-space:normal;">${escapeHtml(r.descricao||'—')}</td>
                  ${editable ? `<td>
                    <select class="form-control form-control-xs sg-sol-status" data-id="${r.id}" style="width:130px;">
                      <option value="">— mudar —</option>
                      <option value="aceita">Aceitar</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelar</option>
                    </select>
                  </td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      if (editable) {
        el.querySelectorAll('.sg-sol-status').forEach(sel => {
          sel.addEventListener('change', async function() {
            if (!this.value) return;
            try {
              await API.put('/servicos-gerais/solicitacoes/' + this.dataset.id, { status: this.value });
              showToast('Status atualizado!', 'success'); loadSol();
            } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
          });
        });
      }
    } catch(e) {
      el.querySelector('#sg-sol-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-sol-buscar').addEventListener('click', loadSol);
  loadSol();
}

// ── f16 Gerenciar Solicitações de Apoio ───────────────────────────────────────

async function _sg_f16(user) {
  await _sg_solicitacoesModal(user, true);
}

// ── f17 Pendências de Auditoria ───────────────────────────────────────────────

async function _sg_f17(user) {
  const { el, close } = openModal({
    title: '⚠️ Pendências de Auditoria',
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select class="form-control" id="sg-aud-fil" style="width:160px;">
          <option value="pendente">Pendentes</option>
          <option value="em_correcao">Em correção</option>
          <option value="">Todas</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sg-aud-buscar">Filtrar</button>
      </div>
      <div id="sg-aud-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sg-aud-novo-btn">+ Registrar Pendência</button>`,
  });

  async function loadAud() {
    const status = el.querySelector('#sg-aud-fil').value;
    el.querySelector('#sg-aud-list').innerHTML = _spinner();
    try {
      const d = await API.get('/servicos-gerais/pendencias-auditoria' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-aud-list').innerHTML = _empty(); return; }
      el.querySelector('#sg-aud-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Título</th><th>Local</th><th>Responsável</th><th>Prazo</th><th>Origem</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr${r.status==='nao_conformidade'?' style="background:rgba(239,68,68,0.05);"':''}>
                  <td>${escapeHtml(r.titulo)}</td>
                  <td>${escapeHtml(r.local||'—')}</td>
                  <td>${escapeHtml(r.responsavel||'—')}</td>
                  <td>${_sg_fmtD(r.prazo)}</td>
                  <td>${escapeHtml(r.origem||'—')}</td>
                  <td><span class="badge badge-${r.status==='corrigido'?'success':r.status==='em_correcao'?'info':r.status==='nao_conformidade'?'danger':'warning'}">${escapeHtml(r.status||'—')}</span></td>
                  <td>
                    <select class="form-control form-control-xs sg-aud-status" data-id="${r.id}" style="width:130px;">
                      <option value="">— mudar —</option>
                      <option value="em_correcao">Em correção</option>
                      <option value="corrigido">Corrigido</option>
                      <option value="nao_conformidade">Não conformidade</option>
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sg-aud-status').forEach(sel => {
        sel.addEventListener('change', async function() {
          if (!this.value) return;
          try {
            await API.put('/servicos-gerais/pendencias-auditoria/' + this.dataset.id, { status: this.value });
            showToast('Status atualizado!', 'success'); loadAud();
          } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
        });
      });
    } catch(e) {
      el.querySelector('#sg-aud-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-aud-buscar').addEventListener('click', loadAud);
  el.querySelector('#sg-aud-novo-btn').addEventListener('click', () => {
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Pendência de Auditoria',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Título *</label>
          <input class="form-control" id="sg-ap-titulo" placeholder="ex: Caixa d'água sem higienização semestral"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:2"><label class="form-label">Local</label>
            <input class="form-control" id="sg-ap-local" placeholder="ex: Bloco B, cobertura"></div>
          <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Prazo</label>
            <input class="form-control" id="sg-ap-prazo" type="date"></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1"><label class="form-label">Responsável</label>
            <input class="form-control" id="sg-ap-resp" placeholder="Nome ou cargo"></div>
          <div class="form-group" style="flex:1"><label class="form-label">Origem (Auditoria/SIF)</label>
            <input class="form-control" id="sg-ap-orig" placeholder="ex: Auditoria interna Q2/2026"></div>
        </div>
        <div class="form-group"><label class="form-label">Descrição</label>
          <textarea class="form-control" id="sg-ap-desc" rows="2"></textarea></div>
        <div id="sg-ap-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sg-ap-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sg-ap-save">Registrar</button>`,
    });
    e2.querySelector('#sg-ap-cancel').addEventListener('click', c2);
    e2.querySelector('#sg-ap-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const titulo = e2.querySelector('#sg-ap-titulo').value.trim();
        if (!titulo) { e2.querySelector('#sg-ap-err').innerHTML = '<div class="form-error">Título é obrigatório.</div>'; return; }
        try {
          await API.post('/servicos-gerais/pendencias-auditoria', {
            titulo,
            local:        e2.querySelector('#sg-ap-local').value.trim() || null,
            prazo:        e2.querySelector('#sg-ap-prazo').value || null,
            responsavel:  e2.querySelector('#sg-ap-resp').value.trim() || null,
            origem:       e2.querySelector('#sg-ap-orig').value.trim() || null,
            descricao:    e2.querySelector('#sg-ap-desc').value.trim() || null,
          });
          showToast('Pendência registrada!', 'success'); c2(); loadAud();
        } catch(e) { e2.querySelector('#sg-ap-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadAud();
}

// ── f18 Definir/Gerenciar Cronograma de Jardinagem ────────────────────────────

async function _sg_f18(user, readOnly) {
  const title = readOnly ? '🌿 Cronograma de Jardinagem' : '📆 Definir Cronograma de Jardinagem';
  let usuarios = [];
  if (!readOnly) {
    try {
      const d = await API.get('/servicos-gerais/usuarios');
      usuarios = Array.isArray(d) ? d : (d.data || []);
    } catch {}
  }

  const { el, close } = openModal({
    title,
    size: 'xl',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select class="form-control" id="sg-jard-fil" style="width:160px;">
          <option value="">Todos</option>
          <option value="agendado">Agendado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="sg-jard-buscar">Filtrar</button>
      </div>
      <div id="sg-jard-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             ${!readOnly ? '<button class="btn btn-primary" id="sg-jard-novo-btn">+ Novo Evento</button>' : ''}`,
  });

  async function loadJard() {
    const status = el.querySelector('#sg-jard-fil').value;
    el.querySelector('#sg-jard-list').innerHTML = _spinner();
    try {
      const d = await API.get('/servicos-gerais/cronograma-jardinagem' + (status ? '?status=' + status : ''));
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-jard-list').innerHTML = _empty(); return; }
      el.querySelector('#sg-jard-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Título</th><th>Tipo</th><th>Local</th><th>Responsável</th><th>Previsto</th><th>Realizado</th><th>Status</th>${!readOnly?'<th>Ação</th>':''}</tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.titulo)}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${escapeHtml(r.local||'—')}</td>
                  <td>${escapeHtml(r.responsavel_exibir||'—')}</td>
                  <td>${_sg_fmtD(r.data_prevista)}</td>
                  <td>${_sg_fmtD(r.data_realizada)}</td>
                  <td>${_sg_jardStatusBadge(r.status)}</td>
                  ${!readOnly ? `<td style="display:flex;gap:4px;">
                    <select class="form-control form-control-xs sg-jard-status" data-id="${r.id}" style="width:120px;">
                      <option value="">— status —</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <button class="btn btn-xs btn-danger sg-jard-del" data-id="${r.id}">✕</button>
                  </td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      if (!readOnly) {
        el.querySelectorAll('.sg-jard-status').forEach(sel => {
          sel.addEventListener('change', async function() {
            if (!this.value) return;
            const patches = { status: this.value };
            if (this.value === 'concluido') patches.data_realizada = _sg_today();
            try {
              await API.put('/servicos-gerais/cronograma-jardinagem/' + this.dataset.id, patches);
              showToast('Status atualizado!', 'success'); loadJard();
            } catch(e) { showToast('Erro: ' + e.message, 'error'); this.value = ''; }
          });
        });
        el.querySelectorAll('.sg-jard-del').forEach(btn => {
          btn.addEventListener('click', async function() {
            if (!confirm('Excluir este evento do cronograma?')) return;
            try {
              await API.delete('/servicos-gerais/cronograma-jardinagem/' + btn.dataset.id);
              showToast('Evento excluído!', 'success'); loadJard();
            } catch(e) { showToast('Erro: ' + e.message, 'error'); }
          });
        });
      }
    } catch(e) {
      el.querySelector('#sg-jard-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-jard-buscar').addEventListener('click', loadJard);

  if (!readOnly) {
    el.querySelector('#sg-jard-novo-btn').addEventListener('click', () => {
      const { el: e2, close: c2 } = openModal({
        title: '+ Novo Evento de Jardinagem',
        size: 'md',
        body: `
          <div class="form-group"><label class="form-label">Título *</label>
            <input class="form-control" id="sg-nj-titulo" placeholder="ex: Corte de grama — Pátio norte"></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Tipo</label>
              <select class="form-control" id="sg-nj-tipo">
                <option value="corte_grama">Corte de Grama</option>
                <option value="poda">Poda</option>
                <option value="manutencao_paisagistica">Manut. Paisagística</option>
                <option value="adubacao">Adubação</option>
                <option value="outro">Outro</option>
              </select></div>
            <div class="form-group" style="flex:1;min-width:130px;"><label class="form-label">Data Prevista *</label>
              <input class="form-control" id="sg-nj-data" type="date" value="${_sg_today()}"></div>
          </div>
          <div class="form-group"><label class="form-label">Local</label>
            <input class="form-control" id="sg-nj-local" placeholder="ex: Área verde, entrada principal..."></div>
          <div class="form-group"><label class="form-label">Responsável (sistema)</label>
            <select class="form-control" id="sg-nj-resp">
              <option value="">— Selecione ou informe abaixo —</option>
              ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
            </select></div>
          <div class="form-group"><label class="form-label">Responsável (nome manual)</label>
            <input class="form-control" id="sg-nj-resp-nome" placeholder="Nome externo se necessário"></div>
          <div class="form-group"><label class="form-label">Observação</label>
            <textarea class="form-control" id="sg-nj-obs" rows="2"></textarea></div>
          <div id="sg-nj-err"></div>`,
        footer: `<button class="btn btn-secondary" id="sg-nj-cancel">Cancelar</button>
                 <button class="btn btn-primary" id="sg-nj-save">Salvar</button>`,
      });
      e2.querySelector('#sg-nj-cancel').addEventListener('click', c2);
      e2.querySelector('#sg-nj-save').addEventListener('click', function() {
        _withSubmit(this, async () => {
          const titulo = e2.querySelector('#sg-nj-titulo').value.trim();
          const data   = e2.querySelector('#sg-nj-data').value;
          if (!titulo || !data) { e2.querySelector('#sg-nj-err').innerHTML = '<div class="form-error">Título e data são obrigatórios.</div>'; return; }
          try {
            await API.post('/servicos-gerais/cronograma-jardinagem', {
              titulo,
              tipo:            e2.querySelector('#sg-nj-tipo').value,
              local:           e2.querySelector('#sg-nj-local').value.trim() || null,
              data_prevista:   data,
              responsavel_id:  e2.querySelector('#sg-nj-resp').value || null,
              responsavel_nome: e2.querySelector('#sg-nj-resp-nome').value.trim() || null,
              observacao:      e2.querySelector('#sg-nj-obs').value.trim() || null,
            });
            showToast('Evento criado!', 'success'); c2(); loadJard();
          } catch(e) { e2.querySelector('#sg-nj-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
        });
      });
    });
  }

  loadJard();
}

// ── f19 Gerenciar Escalas ─────────────────────────────────────────────────────

async function _sg_f19(user) {
  let usuarios = [];
  try {
    const d = await API.get('/servicos-gerais/usuarios');
    usuarios = Array.isArray(d) ? d : (d.data || []);
  } catch {}

  const { el, close } = openModal({
    title: '🗓️ Gerenciar Escalas — Serviços Gerais',
    size: 'xl',
    body: `<div id="sg-eg-list">${_spinner()}</div>`,
    footer: `<button class="btn btn-secondary" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()">Fechar</button>
             <button class="btn btn-primary" id="sg-eg-novo-btn">+ Nova Escala</button>`,
  });

  async function loadEscalas() {
    el.querySelector('#sg-eg-list').innerHTML = _spinner();
    try {
      const d = await API.get('/servicos-gerais/escalas');
      const rows = Array.isArray(d) ? d : (d.data || []);
      if (!rows.length) { el.querySelector('#sg-eg-list').innerHTML = _empty(); return; }
      const turnoIcon = { manha: '🌅', tarde: '🌤️', noite: '🌙', plantao: '🛡️' };
      el.querySelector('#sg-eg-list').innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead><tr><th>Funcionário</th><th>Turno</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Observação</th><th>Ação</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${escapeHtml(r.nome_exibir||'—')}</td>
                  <td>${turnoIcon[r.turno]||''} ${escapeHtml(r.turno||'—')}</td>
                  <td><span class="badge badge-muted">${escapeHtml(r.tipo||'—')}</span></td>
                  <td>${_sg_fmtD(r.data_inicio)}</td>
                  <td>${_sg_fmtD(r.data_fim)}</td>
                  <td>${escapeHtml(r.observacao||'—')}</td>
                  <td><button class="btn btn-xs btn-danger sg-eg-del" data-id="${r.id}">Excluir</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      el.querySelectorAll('.sg-eg-del').forEach(btn => {
        btn.addEventListener('click', function() {
          _withSubmit(this, async () => {
            if (!confirm('Excluir esta escala?')) return;
            try {
              await API.delete('/servicos-gerais/escalas/' + btn.dataset.id);
              showToast('Escala excluída!', 'success'); loadEscalas();
            } catch(e) { showToast('Erro: ' + e.message, 'error'); }
          });
        });
      });
    } catch(e) {
      el.querySelector('#sg-eg-list').innerHTML = `<div class="form-error">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }

  el.querySelector('#sg-eg-novo-btn').addEventListener('click', () => {
    const today = _sg_today();
    const { el: e2, close: c2 } = openModal({
      title: '+ Nova Escala',
      size: 'md',
      body: `
        <div class="form-group"><label class="form-label">Funcionário</label>
          <select class="form-control" id="sg-ne-func">
            <option value="">— Externo / nome manual —</option>
            ${usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}${u.departamento?' ('+escapeHtml(u.departamento)+')':''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Nome (se externo)</label>
          <input class="form-control" id="sg-ne-nome" placeholder="Nome completo..."></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Turno</label>
            <select class="form-control" id="sg-ne-turno">
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
              <option value="plantao">Plantão</option>
            </select></div>
          <div class="form-group" style="flex:1;min-width:100px;"><label class="form-label">Tipo</label>
            <select class="form-control" id="sg-ne-tipo">
              <option value="normal">Normal</option>
              <option value="ferias">Férias</option>
              <option value="folga">Folga</option>
              <option value="plantao">Plantão</option>
            </select></div>
        </div>
        <div style="display:flex;gap:10px;">
          <div class="form-group" style="flex:1"><label class="form-label">Data Início *</label>
            <input class="form-control" id="sg-ne-ini" type="date" value="${today}"></div>
          <div class="form-group" style="flex:1"><label class="form-label">Data Fim *</label>
            <input class="form-control" id="sg-ne-fim" type="date" value="${today}"></div>
        </div>
        <div class="form-group"><label class="form-label">Observação</label>
          <textarea class="form-control" id="sg-ne-obs" rows="2"></textarea></div>
        <div id="sg-ne-err"></div>`,
      footer: `<button class="btn btn-secondary" id="sg-ne-cancel">Cancelar</button>
               <button class="btn btn-primary" id="sg-ne-save">Salvar Escala</button>`,
    });
    e2.querySelector('#sg-ne-cancel').addEventListener('click', c2);
    e2.querySelector('#sg-ne-save').addEventListener('click', function() {
      _withSubmit(this, async () => {
        const ini  = e2.querySelector('#sg-ne-ini').value;
        const fim  = e2.querySelector('#sg-ne-fim').value;
        const func = e2.querySelector('#sg-ne-func').value;
        const nome = e2.querySelector('#sg-ne-nome').value.trim();
        if (!ini || !fim)      { e2.querySelector('#sg-ne-err').innerHTML = '<div class="form-error">Datas são obrigatórias.</div>'; return; }
        if (!func && !nome)    { e2.querySelector('#sg-ne-err').innerHTML = '<div class="form-error">Selecione o funcionário ou informe o nome.</div>'; return; }
        try {
          await API.post('/servicos-gerais/escalas', {
            usuario_id:       func || null,
            funcionario_nome: nome || null,
            turno:     e2.querySelector('#sg-ne-turno').value,
            tipo:      e2.querySelector('#sg-ne-tipo').value,
            data_inicio: ini, data_fim: fim,
            observacao:  e2.querySelector('#sg-ne-obs').value.trim() || null,
          });
          showToast('Escala criada!', 'success'); c2(); loadEscalas();
        } catch(e) { e2.querySelector('#sg-ne-err').innerHTML = `<div class="form-error">${escapeHtml(e.message)}</div>`; }
      });
    });
  });

  loadEscalas();
}

// ── Export ────────────────────────────────────────────────────────────────────

const ServicosGeraisForms = {
  f01CronogramaJardinagem:        (user) => _sg_f01(user),
  f02ControleErvasDaninhas:       (user) => _sg_f02(user),
  f03ManutencaoCercas:            (user) => _sg_f03(user),
  f04LimpezaAreasExternas:        (user) => _sg_f04(user),
  f05PequenosReparosAlvenaria:    (user) => _sg_f05(user),
  f06PinturaPredial:              (user) => _sg_f06(user),
  f07LimpezaCalhasTelhados:       (user) => _sg_f07(user),
  f08LimpezaCaixasAgua:           (user) => _sg_f08(user),
  f09LimpezaCaixasGordura:        (user) => _sg_f09(user),
  f10LavagemHidrojateamento:      (user) => _sg_f10(user),
  f11ControlePragas:              (user) => _sg_f11(user),
  f12ControleFerramenta:          (user) => _sg_f12(user),
  f13ControleInsumosCombustivel:  (user) => _sg_f13(user),
  f14VerSolicitacoesApoio:        (user) => _sg_f14(user),
  f15VerEscala:                   (user) => _sg_f15(user),
  f16GerenciarSolicitacoesApoio:  (user) => _sg_f16(user),
  f17PendenciasAuditoria:         (user) => _sg_f17(user),
  f18DefinirCronogramaJardinagem: (user) => _sg_f18(user, false),
  f19GerenciarEscalas:            (user) => _sg_f19(user),
};

window.ServicosGeraisForms = ServicosGeraisForms;
