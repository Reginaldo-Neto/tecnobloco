'use strict';

// ── Helpers ───────────────────────────────────────────────────────────────────

function _badge(status, customMap) {
  const map = {
    // genérico
    pendente: 'warning', aprovada: 'success', concluida: 'success', resolvido: 'success',
    rejeitada: 'danger',  cancelada: 'danger', aberto: 'warning', em_andamento: 'info',
    aceita: 'info', lavando: 'info', coletado: 'info', pago: 'success', aprovado: 'success',
    em_analise: 'info', recebida: 'info', encerrada: 'success', fechado: 'success',
    // frotas — veículos
    disponivel: 'success', em_uso: 'info', manutencao: 'warning', inativo: 'muted',
    // frotas — viagens
    agendada: 'secondary', concluida_viagem: 'success',
    // frotas — preventiva
    em_dia: 'success', proximo: 'warning', vencido: 'danger',
    // frotas — pneus / técnico
    ok: 'success', baixo: 'warning', trocar: 'danger', urgente: 'danger', verificar: 'warning', critico: 'danger',
    // frotas — sinistros
    indenizado: 'success', encerrado: 'success',
    // frotas — pesagem
    divergencia: 'warning',
    // frotas — pagamento
    contestado: 'secondary',
    // estoque — bloqueios de lote
    bloqueado: 'danger', liberado: 'success', descartado: 'muted',
    // estoque — inventários
    concluido: 'success', cancelado: 'danger',
    // rh — férias / afastamentos / advertências
    em_gozo: 'info', agendado: 'secondary', expirado: 'danger', validado: 'success', rejeitado: 'danger',
    verbal: 'warning', escrita: 'danger', suspensao: 'danger', justa_causa: 'danger',
    atestado_medico: 'info', licenca_maternidade: 'info', licenca_paternidade: 'info',
    acidente_trabalho: 'danger', doenca: 'warning',
    // rh — movimentações
    promocao: 'success', transferencia: 'info', rebaixamento: 'danger',
    mudanca_turno: 'secondary', mudanca_cargo: 'secondary', mudanca_departamento: 'secondary',
    // estoque / global — urgência
    alta: 'warning', media: 'info', baixa: 'muted',
    // estoque — separação / pedidos
    em_separacao: 'info', separado: 'success', em_cotacao: 'info',
  };
  const color = (customMap && customMap[status]) || map[status] || 'muted';
  const label = (status || '—').replace(/_/g, ' ');
  return `<span class="badge badge-${color}">${escapeHtml(label)}</span>`;
}

function _fmtDate(v) {
  if (!v) return '—';
  try {
    // ISO date-only strings (YYYY-MM-DD) are parsed as UTC midnight by the spec,
    // which shifts the displayed date by one day in UTC-negative timezones (e.g. UTC-3).
    // Appending T00:00:00 forces local-timezone parsing.
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(v + 'T00:00:00') : new Date(v);
    return d.toLocaleDateString('pt-BR');
  } catch { return '—'; }
}

function _fmtDateTime(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return '—'; }
}

async function _loadOpts(endpoint) {
  try {
    const d = await API.get(endpoint);
    return Array.isArray(d) ? d : (d.data || []);
  } catch { return []; }
}

function _optsHtml(arr, valField, labelField, placeholder) {
  placeholder = placeholder || 'Selecione...';
  return `<option value="">— ${escapeHtml(placeholder)} —</option>` +
    arr.map(r => `<option value="${escapeHtml(String(r[valField]))}">${escapeHtml(r[labelField] || '')}</option>`).join('');
}

function _spinner() {
  return '<div class="page-loader" style="min-height:80px;"><span class="spinner"></span></div>';
}

function _empty(iconOrMsg, title, text) {
  // 3-arg / 2-arg form: _empty(icon, title[, description])
  if (title !== undefined) {
    const desc = text ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin:4px 0 0;">${escapeHtml(text)}</p>` : '';
    return `<div class="empty-state"><span class="empty-state-icon">${iconOrMsg}</span><span class="empty-state-title">${escapeHtml(title)}</span>${desc}</div>`;
  }
  // 0-arg / 1-arg form: _empty() or _empty('message text')
  return `<div class="empty-state"><span class="empty-state-icon">📭</span><span class="empty-state-title">${escapeHtml(iconOrMsg) || 'Nenhum registro encontrado'}</span></div>`;
}

function _fmtMoney(v) {
  return v != null ? 'R$ ' + Number(v).toFixed(2).replace('.', ',') : '—';
}

// ── Submit helper ─────────────────────────────────────────────────────────────

async function _withSubmit(btn, fn) {
  btn.disabled = true;
  btn.classList.add('btn-loading');
  try {
    await fn();
  } catch (err) {
    // Surface network/unexpected errors to the user instead of silent failure
    const msg = (err && err.message) ? err.message : 'Erro inesperado. Tente novamente.';
    if (typeof showToast === 'function') showToast(msg, 'danger');
    console.error('[_withSubmit]', err);
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
}

// ── Prioridade badge helper ───────────────────────────────────────────────────

function _prioridadeBadge(p) {
  const map = { critica: 'danger', alta: 'warning', media: 'info', baixa: 'success' };
  const color = map[p] || 'muted';
  return `<span class="badge badge-${color}">${escapeHtml(p || '—')}</span>`;
}

// ── Urgência badge helper ─────────────────────────────────────────────────────

function _urgenciaBadge(u) {
  const map = { emergencial: 'danger', urgente: 'warning', normal: 'success', alta: 'warning', media: 'info', baixa: 'success' };
  const color = map[u] || 'muted';
  return `<span class="badge badge-${color}">${escapeHtml(u || '—')}</span>`;
}

// ── Gravidade badge helper ────────────────────────────────────────────────────

function _gravidadeBadge(g) {
  const map = { muito_grave: 'danger', grave: 'warning', moderada: 'info', leve: 'success' };
  const color = map[g] || 'muted';
  return `<span class="badge badge-${color}">${escapeHtml(g || '—')}</span>`;
}

// ── Document type icon helper ─────────────────────────────────────────────────

function _docIcon(tipo) {
  const map = {
    atestado_medico: '🏥',
    certificado: '🎓',
    declaracao: '📋',
    laudo: '🔬',
    cnh: '🪪',
    outro: '📄',
  };
  return map[tipo] || '📄';
}

// ── GlobalForms ───────────────────────────────────────────────────────────────

const GlobalForms = {

  // ── f01 Solicitar Reunião ─────────────────────────────────────────────────
  async f01SolicitarReuniao(user) {
    const [deptos, usuarios] = await Promise.all([
      _loadOpts('/global/departamentos'),
      _loadOpts('/global/usuarios'),
    ]);

    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    const body = `
      <form id="f01-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f01-titulo">Título <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="f01-titulo" type="text" maxlength="200"
            placeholder="Assunto da reunião" autocomplete="off">
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f01-tipo-reuniao">Tipo de Reunião</label>
            <select class="form-control" id="f01-tipo-reuniao">
              <option value="">— Selecione —</option>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrida">Híbrida</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f01-urgencia">Urgência</label>
            <select class="form-control" id="f01-urgencia">
              <option value="normal" selected>Normal</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f01-depto">Departamento Destino <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="f01-depto">
            ${_optsHtml(deptos, 'id', 'nome', 'Selecione o departamento')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="f01-participante">Participante (opcional)</label>
          <select class="form-control" id="f01-participante">
            ${_optsHtml(usuarios, 'id', 'nome', 'Nenhum participante específico')}
          </select>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f01-data">Data Preferencial</label>
            <input class="form-control" id="f01-data" type="datetime-local" value="${nowLocal}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f01-duracao">Duração (minutos)</label>
            <input class="form-control" id="f01-duracao" type="number" min="5" step="5" value="60">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f01-local">Local Sugerido</label>
          <input class="form-control" id="f01-local" type="text" maxlength="200"
            placeholder="Ex: Sala de Reuniões A, Google Meet...">
        </div>
        <div class="form-group">
          <label class="form-label" for="f01-descricao">Descrição / Pauta</label>
          <textarea class="form-control" id="f01-descricao" rows="3"
            placeholder="Pauta ou detalhes adicionais..."></textarea>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="f01-recorrente" style="width:auto;cursor:pointer;">
          <label class="form-label" for="f01-recorrente" style="margin:0;cursor:pointer;">Reunião Recorrente</label>
        </div>
        <div id="f01-error"></div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" id="f01-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f01-submit">Solicitar Reunião</button>`;

    const { el, close } = openModal({ title: 'Solicitar Reunião', body, footer, size: 'sm' });

    el.querySelector('#f01-cancel').addEventListener('click', close);

    el.querySelector('#f01-submit').addEventListener('click', function () {
      const btn = this;
      const titulo = el.querySelector('#f01-titulo').value.trim();
      const departamento_destino_id = el.querySelector('#f01-depto').value;
      const errDiv = el.querySelector('#f01-error');
      errDiv.innerHTML = '';

      const errors = [];
      if (!titulo) errors.push('Informe o título da reunião.');
      if (!departamento_destino_id) errors.push('Selecione o departamento destino.');
      if (errors.length) {
        errDiv.innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join('');
        el.querySelector(!titulo ? '#f01-titulo' : '#f01-depto').focus();
        return;
      }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/reunioes', {
            titulo,
            departamento_destino_id,
            tipo_reuniao: el.querySelector('#f01-tipo-reuniao').value || null,
            urgencia: el.querySelector('#f01-urgencia').value || 'normal',
            participante_id: el.querySelector('#f01-participante').value || null,
            data_preferencial: el.querySelector('#f01-data').value || null,
            duracao_minutos: Number(el.querySelector('#f01-duracao').value) || 60,
            local_sugerido: el.querySelector('#f01-local').value.trim() || null,
            descricao: el.querySelector('#f01-descricao').value.trim() || null,
            recorrente: el.querySelector('#f01-recorrente').checked,
          });
          showToast('Solicitação de reunião enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao solicitar reunião.', 'danger');
        }
      });
    });
  },

  // ── f02 Ver Minhas Reuniões ───────────────────────────────────────────────
  async f02VerSolicitacoesReuniao(user) {
    const { el, close } = openModal({
      title: 'Minhas Solicitações de Reunião',
      body: _spinner(),
      footer: `
        <button class="btn btn-secondary" id="f02-refresh">↻ Atualizar</button>
        <button class="btn btn-primary" id="f02-nova">⊕ Nova Solicitação</button>`,
      size: 'lg',
    });

    el.querySelector('#f02-nova').addEventListener('click', () => {
      close();
      GlobalForms.f01SolicitarReuniao(user);
    });

    async function loadData() {
      const bodyEl = el.querySelector('.modal-body');
      bodyEl.innerHTML = _spinner();
      try {
        const data = await _loadOpts('/global/reunioes');

        if (!data.length) { bodyEl.innerHTML = _empty(); return; }

        bodyEl.innerHTML = `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Destino</th>
                  <th>Data Preferencial</th>
                  <th>Duração</th>
                  <th>Urgência</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${data.map(r => `
                  <tr>
                    <td>${escapeHtml(r.titulo || '—')}</td>
                    <td>${escapeHtml(r.tipo_reuniao || '—')}</td>
                    <td>${escapeHtml(r.departamento_destino || r.departamento_destino_id || '—')}</td>
                    <td>${_fmtDateTime(r.data_preferencial)}</td>
                    <td>${r.duracao_minutos != null ? escapeHtml(String(r.duracao_minutos)) + ' min' : '—'}</td>
                    <td>${_urgenciaBadge(r.urgencia)}</td>
                    <td>${_badge(r.status)}</td>
                    <td>${r.status === 'pendente'
                      ? `<button class="btn btn-sm btn-danger f02-cancel-btn" data-id="${escapeHtml(String(r.id))}" title="Cancelar solicitação">🗑</button>`
                      : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;

        bodyEl.querySelectorAll('.f02-cancel-btn').forEach(btn => {
          btn.addEventListener('click', async function () {
            if (!confirm('Cancelar esta solicitação de reunião?')) return;
            try {
              await API.delete('/global/reunioes/' + this.dataset.id);
              showToast('Solicitação cancelada.', 'success');
              loadData();
            } catch (err) {
              showToast(err.message || 'Erro ao cancelar.', 'danger');
            }
          });
        });
      } catch (err) {
        bodyEl.innerHTML =
          `<div class="form-error">Erro ao carregar dados: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    el.querySelector('#f02-refresh').addEventListener('click', loadData);
    loadData();
  },

  // ── f03 Abrir OS de Manutenção ────────────────────────────────────────────
  async f03AbrirOsManutencao(user) {
    const equipamentos = await _loadOpts('/global/equipamentos');

    // Build equipment options showing name + location when available
    const equipOptsHtml = `<option value="">— Selecione o equipamento —</option>` +
      equipamentos.map(r => {
        const label = r.localizacao
          ? `${r.nome || ''} — ${r.localizacao}`
          : (r.nome || '');
        return `<option value="${escapeHtml(String(r.id))}">${escapeHtml(label)}</option>`;
      }).join('');

    const body = `
      <form id="f03-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f03-equip">Equipamento <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="f03-equip">
            ${equipOptsHtml}
          </select>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f03-tipo">Tipo <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f03-tipo">
              <option value="">— Selecione —</option>
              <option value="corretiva">Corretiva</option>
              <option value="preventiva">Preventiva</option>
              <option value="preditiva">Preditiva</option>
              <option value="emergencial">Emergencial</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f03-prioridade">Prioridade <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f03-prioridade">
              <option value="">— Selecione —</option>
              <option value="baixa">🟢 Baixa</option>
              <option value="media">🟡 Média</option>
              <option value="alta">🟠 Alta</option>
              <option value="critica">🔴 Crítica</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f03-desc">Descrição do Problema <span style="color:var(--danger)">*</span></label>
          <textarea class="form-control" id="f03-desc" rows="3"
            placeholder="Descreva o problema ou falha observada..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="f03-local">Localização</label>
          <input class="form-control" id="f03-local" type="text" maxlength="200"
            placeholder="Onde está o equipamento? (setor, sala, área...)">
        </div>
        <div class="form-group">
          <label class="form-label" for="f03-contato">Contato Responsável</label>
          <input class="form-control" id="f03-contato" type="text" maxlength="200"
            placeholder="Nome e ramal/telefone de quem pode ser contatado">
        </div>
        <div id="f03-error"></div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" id="f03-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f03-submit">Abrir OS</button>`;

    const { el, close } = openModal({ title: 'Abrir OS de Manutenção', body, footer, size: 'sm' });

    el.querySelector('#f03-cancel').addEventListener('click', close);

    el.querySelector('#f03-submit').addEventListener('click', function () {
      const btn = this;
      const equipamento_id = el.querySelector('#f03-equip').value;
      const tipo = el.querySelector('#f03-tipo').value;
      const prioridade = el.querySelector('#f03-prioridade').value;
      const descricao = el.querySelector('#f03-desc').value.trim();
      const errDiv = el.querySelector('#f03-error');
      errDiv.innerHTML = '';

      const errors = [];
      if (!equipamento_id) errors.push('Selecione o equipamento.');
      if (!tipo) errors.push('Selecione o tipo de manutenção.');
      if (!prioridade) errors.push('Selecione a prioridade.');
      if (!descricao) errors.push('Informe a descrição do problema.');
      if (errors.length) {
        errDiv.innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join('');
        return;
      }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/os', {
            equipamento_id,
            tipo,
            prioridade,
            descricao,
            localizacao: el.querySelector('#f03-local').value.trim() || null,
            contato_responsavel: el.querySelector('#f03-contato').value.trim() || null,
          });
          showToast('OS de manutenção aberta com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao abrir OS.', 'danger');
        }
      });
    });
  },

  // ── f04 Ver Minhas OS ─────────────────────────────────────────────────────
  async f04VerMinhasOsAbertas(user) {
    const { el, close } = openModal({
      title: 'Minhas OS de Manutenção',
      body: _spinner(),
      footer: `<button class="btn btn-secondary" id="f04-refresh">↻ Atualizar</button>`,
      size: 'lg',
    });

    async function loadData() {
      const bodyEl = el.querySelector('.modal-body');
      bodyEl.innerHTML = _spinner();
      try {
        const data = await _loadOpts('/global/os');

        if (!data.length) { bodyEl.innerHTML = _empty(); return; }

        bodyEl.innerHTML = `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipamento / Local</th>
                  <th>Tipo</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Abertura</th>
                  <th>Previsão</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${data.map(r => `
                  <tr>
                    <td>${escapeHtml(r.codigo || String(r.id) || '—')}</td>
                    <td>
                      ${escapeHtml(r.equipamento || r.equipamento_id || '—')}
                      ${r.localizacao ? `<br><small style="color:var(--text-muted)">${escapeHtml(r.localizacao)}</small>` : ''}
                    </td>
                    <td>${escapeHtml(r.tipo || '—')}</td>
                    <td>${_prioridadeBadge(r.prioridade)}</td>
                    <td>${_badge(r.status)}</td>
                    <td>${_fmtDateTime(r.created_at || r.data_abertura)}</td>
                    <td>${_fmtDate(r.previsao_conclusao)}</td>
                    <td>${r.status === 'aberta'
                      ? `<button class="btn btn-sm btn-danger f04-cancel-btn" data-id="${escapeHtml(String(r.id))}" title="Cancelar OS">🗑</button>`
                      : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;

        bodyEl.querySelectorAll('.f04-cancel-btn').forEach(btn => {
          btn.addEventListener('click', async function () {
            if (!confirm('Cancelar esta OS?')) return;
            try {
              await API.delete('/global/os/' + this.dataset.id);
              showToast('OS cancelada.', 'success');
              loadData();
            } catch (err) {
              showToast(err.message || 'Erro ao cancelar OS.', 'danger');
            }
          });
        });
      } catch (err) {
        bodyEl.innerHTML =
          `<div class="form-error">Erro ao carregar OS: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    el.querySelector('#f04-refresh').addEventListener('click', loadData);
    loadData();
  },

  // ── f05 Solicitar Limpeza ─────────────────────────────────────────────────
  async f05SolicitarLimpeza(user) {
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    const body = `
      <form id="f05-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f05-local">Local / Setor <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="f05-local" type="text" maxlength="200"
            placeholder="Ex: Refeitório, Banheiro feminino 2º andar, Sala TI...">
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f05-tipo">Tipo de Limpeza <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f05-tipo">
              <option value="">— Selecione —</option>
              <option value="geral">Geral</option>
              <option value="pontual">Pontual</option>
              <option value="urgente">Urgente</option>
              <option value="agendada">Agendada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f05-urgencia">Urgência</label>
            <select class="form-control" id="f05-urgencia">
              <option value="baixa" selected>Baixa (normal)</option>
              <option value="media">Média</option>
              <option value="alta">Alta (urgente)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f05-data">Data Preferencial</label>
          <input class="form-control" id="f05-data" type="datetime-local" value="${nowLocal}">
        </div>
        <div class="form-group">
          <label class="form-label" for="f05-desc">Descrição</label>
          <textarea class="form-control" id="f05-desc" rows="3"
            placeholder="Detalhes adicionais sobre o que precisa ser limpo..."></textarea>
        </div>
        <div id="f05-error"></div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" id="f05-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f05-submit">Solicitar Limpeza</button>`;

    const { el, close } = openModal({ title: 'Solicitar Limpeza de Local / Setor', body, footer, size: 'sm' });

    el.querySelector('#f05-cancel').addEventListener('click', close);

    el.querySelector('#f05-submit').addEventListener('click', function () {
      const btn = this;
      const local_setor = el.querySelector('#f05-local').value.trim();
      const tipo = el.querySelector('#f05-tipo').value;
      const errDiv = el.querySelector('#f05-error');
      errDiv.innerHTML = '';

      const errors = [];
      if (!local_setor) errors.push('Informe o local ou setor.');
      if (!tipo) errors.push('Selecione o tipo de limpeza.');
      if (errors.length) {
        errDiv.innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join('');
        el.querySelector(!local_setor ? '#f05-local' : '#f05-tipo').focus();
        return;
      }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/limpeza', {
            local_setor,
            tipo,
            urgencia: el.querySelector('#f05-urgencia').value || 'baixa',
            data_preferencial: el.querySelector('#f05-data').value || null,
            descricao: el.querySelector('#f05-desc').value.trim() || null,
          });
          showToast('Solicitação de limpeza enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao solicitar limpeza.', 'danger');
        }
      });
    });
  },

  // ── f06 Ver Minhas Limpezas ───────────────────────────────────────────────
  async f06VerSolicitacoesLimpeza(user) {
    const { el, close } = openModal({
      title: 'Minhas Solicitações de Limpeza',
      body: _spinner(),
      footer: `<button class="btn btn-secondary" id="f06-refresh">↻ Atualizar</button>`,
      size: 'lg',
    });

    async function loadData() {
      const bodyEl = el.querySelector('.modal-body');
      bodyEl.innerHTML = _spinner();
      try {
        const data = await _loadOpts('/global/limpeza');

        if (!data.length) { bodyEl.innerHTML = _empty(); return; }

        bodyEl.innerHTML = `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Local / Setor</th>
                  <th>Tipo</th>
                  <th>Urgência</th>
                  <th>Status</th>
                  <th>Data Solicitação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${data.map(r => `
                  <tr>
                    <td>${escapeHtml(r.local_setor || '—')}</td>
                    <td>${escapeHtml(r.tipo || '—')}</td>
                    <td>${_urgenciaBadge(r.urgencia)}</td>
                    <td>${_badge(r.status)}</td>
                    <td>${_fmtDateTime(r.created_at)}</td>
                    <td>${r.status === 'pendente'
                      ? `<button class="btn btn-sm btn-danger f06-cancel-btn" data-id="${escapeHtml(String(r.id))}" title="Cancelar">🗑</button>`
                      : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;

        bodyEl.querySelectorAll('.f06-cancel-btn').forEach(btn => {
          btn.addEventListener('click', async function () {
            if (!confirm('Cancelar esta solicitação de limpeza?')) return;
            try {
              await API.delete('/global/limpeza/' + this.dataset.id);
              showToast('Solicitação cancelada.', 'success');
              loadData();
            } catch (err) {
              showToast(err.message || 'Erro ao cancelar.', 'danger');
            }
          });
        });
      } catch (err) {
        bodyEl.innerHTML =
          `<div class="form-error">Erro ao carregar solicitações: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    el.querySelector('#f06-refresh').addEventListener('click', loadData);
    loadData();
  },

  // ── f07 Solicitar Compra ──────────────────────────────────────────────────
  async f07AbrirSolicitacaoCompra(user) {
    const body = `
      <form id="f07-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f07-item">Descrição do Item <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="f07-item" type="text" maxlength="300"
            placeholder="Nome e especificações do item">
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f07-qtd">Quantidade <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f07-qtd" type="number" step="0.001" min="0.001" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label" for="f07-unid">Unidade</label>
            <select class="form-control" id="f07-unid">
              <option value="">— Selecione —</option>
              <option value="UN">UN — Unidade</option>
              <option value="KG">KG — Quilograma</option>
              <option value="L">L — Litro</option>
              <option value="M">M — Metro</option>
              <option value="CX">CX — Caixa</option>
              <option value="PCT">PCT — Pacote</option>
              <option value="PAR">PAR — Par</option>
              <option value="DUZIA">DUZIA — Dúzia</option>
              <option value="OUTRO">OUTRO</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f07-valor">Valor Estimado (R$)</label>
            <input class="form-control" id="f07-valor" type="number" step="0.01" min="0"
              placeholder="0,00">
          </div>
          <div class="form-group">
            <label class="form-label" for="f07-urgencia">Urgência</label>
            <select class="form-control" id="f07-urgencia">
              <option value="">— Selecione —</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f07-forn">Fornecedor Sugerido</label>
          <input class="form-control" id="f07-forn" type="text" maxlength="200"
            placeholder="Nome do fornecedor (opcional)">
        </div>
        <div class="form-group">
          <label class="form-label" for="f07-justif">Justificativa</label>
          <textarea class="form-control" id="f07-justif" rows="3"
            placeholder="Por que este item é necessário?"></textarea>
        </div>
        <div id="f07-error"></div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" id="f07-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f07-submit">Enviar Solicitação</button>`;

    const { el, close } = openModal({ title: 'Solicitar Compra', body, footer, size: 'sm' });

    el.querySelector('#f07-cancel').addEventListener('click', close);

    // Format money on blur
    el.querySelector('#f07-valor').addEventListener('blur', function () {
      const v = parseFloat(this.value);
      if (!isNaN(v)) this.value = v.toFixed(2);
    });

    el.querySelector('#f07-submit').addEventListener('click', function () {
      const btn = this;
      const item_descricao = el.querySelector('#f07-item').value.trim();
      const qtdVal = el.querySelector('#f07-qtd').value;
      const errDiv = el.querySelector('#f07-error');
      errDiv.innerHTML = '';

      const errors = [];
      if (!item_descricao) errors.push('Informe a descrição do item.');
      if (!qtdVal || Number(qtdVal) <= 0) errors.push('Informe uma quantidade válida.');
      if (errors.length) {
        errDiv.innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join('');
        el.querySelector(!item_descricao ? '#f07-item' : '#f07-qtd').focus();
        return;
      }

      const valorVal = el.querySelector('#f07-valor').value;

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/compras', {
            item_descricao,
            quantidade: Number(qtdVal),
            unidade: el.querySelector('#f07-unid').value || null,
            valor_estimado: valorVal ? Number(valorVal) : null,
            urgencia: el.querySelector('#f07-urgencia').value || null,
            fornecedor_sugerido: el.querySelector('#f07-forn').value.trim() || null,
            justificativa: el.querySelector('#f07-justif').value.trim() || null,
          });
          showToast('Solicitação de compra enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao enviar solicitação.', 'danger');
        }
      });
    });
  },

  // ── f08 Ver Minhas Compras ────────────────────────────────────────────────
  async f08VerSolicitacoesCompra(user) {
    const { el, close } = openModal({
      title: 'Minhas Solicitações de Compra',
      body: _spinner(),
      footer: `<button class="btn btn-secondary" id="f08-refresh">↻ Atualizar</button>`,
      size: 'lg',
    });

    async function loadData() {
      const bodyEl = el.querySelector('.modal-body');
      bodyEl.innerHTML = _spinner();
      try {
        const data = await _loadOpts('/global/compras');

        if (!data.length) { bodyEl.innerHTML = _empty(); return; }

        bodyEl.innerHTML = `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qtd</th>
                  <th>Unid</th>
                  <th>Valor Est.</th>
                  <th>Urgência</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${data.map(r => `
                  <tr>
                    <td>${escapeHtml(r.item_descricao || '—')}</td>
                    <td>${r.quantidade != null ? escapeHtml(String(r.quantidade)) : '—'}</td>
                    <td>${escapeHtml(r.unidade || '—')}</td>
                    <td>${_fmtMoney(r.valor_estimado)}</td>
                    <td>${_urgenciaBadge(r.urgencia)}</td>
                    <td>${_badge(r.status)}</td>
                    <td>${_fmtDateTime(r.created_at)}</td>
                    <td>${r.status === 'pendente'
                      ? `<button class="btn btn-sm btn-danger f08-cancel-btn" data-id="${escapeHtml(String(r.id))}" title="Cancelar">🗑</button>`
                      : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;

        bodyEl.querySelectorAll('.f08-cancel-btn').forEach(btn => {
          btn.addEventListener('click', async function () {
            if (!confirm('Cancelar esta solicitação de compra?')) return;
            try {
              await API.delete('/global/compras/' + this.dataset.id);
              showToast('Solicitação cancelada.', 'success');
              loadData();
            } catch (err) {
              showToast(err.message || 'Erro ao cancelar.', 'danger');
            }
          });
        });
      } catch (err) {
        bodyEl.innerHTML =
          `<div class="form-error">Erro ao carregar solicitações: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    el.querySelector('#f08-refresh').addEventListener('click', loadData);
    loadData();
  },

  // ── f09 Enviar Atestado / Documento ──────────────────────────────────────
  async f09EnviarAtestado(user) {
    const body = `
      <form id="f09-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f09-tipo">Tipo de Documento <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="f09-tipo">
            <option value="">— Selecione o tipo —</option>
            <option value="atestado_medico">🏥 Atestado Médico</option>
            <option value="certificado">🎓 Certificado</option>
            <option value="declaracao">📋 Declaração</option>
            <option value="laudo">🔬 Laudo</option>
            <option value="cnh">🪪 CNH</option>
            <option value="outro">📄 Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="f09-desc">Descrição</label>
          <input class="form-control" id="f09-desc" type="text" maxlength="300"
            placeholder="Breve descrição do documento">
        </div>
        <div class="form-group">
          <label class="form-label" for="f09-data-doc">Data do Documento</label>
          <input class="form-control" id="f09-data-doc" type="date">
        </div>
        <div id="f09-atestado-fields" style="display:none;">
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label" for="f09-data-inicio">Data Início (afastamento)</label>
              <input class="form-control" id="f09-data-inicio" type="date">
            </div>
            <div class="form-group">
              <label class="form-label" for="f09-data-fim">Data Fim (afastamento)</label>
              <input class="form-control" id="f09-data-fim" type="date">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="f09-crm">CRM do Médico (opcional)</label>
            <input class="form-control" id="f09-crm" type="text" maxlength="20"
              placeholder="Ex: CRM/SP 123456">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f09-url">Arquivo Digital (URL ou Caminho)</label>
          <input class="form-control" id="f09-url" type="text" maxlength="500"
            placeholder="URL ou caminho de rede do arquivo digitalizado">
          <small style="color:var(--text-muted);display:block;margin-top:4px;">
            Informe a URL ou caminho de rede do arquivo digitalizado.
          </small>
        </div>
        <div id="f09-error"></div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" id="f09-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f09-submit">Enviar Documento</button>`;

    const { el, close } = openModal({ title: 'Enviar Atestado / Documento Legal', body, footer, size: 'sm' });

    el.querySelector('#f09-cancel').addEventListener('click', close);

    // Show/hide atestado-specific fields
    el.querySelector('#f09-tipo').addEventListener('change', function () {
      el.querySelector('#f09-atestado-fields').style.display =
        this.value === 'atestado_medico' ? '' : 'none';
    });

    el.querySelector('#f09-submit').addEventListener('click', function () {
      const btn = this;
      const tipo = el.querySelector('#f09-tipo').value;
      const errDiv = el.querySelector('#f09-error');
      errDiv.innerHTML = '';

      if (!tipo) {
        errDiv.innerHTML = '<div class="form-error">Selecione o tipo de documento.</div>';
        el.querySelector('#f09-tipo').focus();
        return;
      }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/documentos', {
            tipo,
            descricao: el.querySelector('#f09-desc').value.trim() || null,
            data_documento: el.querySelector('#f09-data-doc').value || null,
            arquivo_url: el.querySelector('#f09-url').value.trim() || null,
            data_inicio: tipo === 'atestado_medico' ? (el.querySelector('#f09-data-inicio').value || null) : null,
            data_fim: tipo === 'atestado_medico' ? (el.querySelector('#f09-data-fim').value || null) : null,
            medico_crm: tipo === 'atestado_medico' ? (el.querySelector('#f09-crm').value.trim() || null) : null,
          });
          showToast('Documento enviado com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao enviar documento.', 'danger');
        }
      });
    });
  },

  // ── f10 Ver Meus Documentos ───────────────────────────────────────────────
  async f10VerDocumentosLegais(user) {
    const { el, close } = openModal({
      title: 'Meus Documentos Legais / Atestados',
      body: _spinner(),
      size: 'lg',
    });

    try {
      const data = await _loadOpts('/global/documentos');
      const bodyEl = el.querySelector('.modal-body');

      if (!data.length) { bodyEl.innerHTML = _empty(); return; }

      bodyEl.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Data Doc.</th>
                <th>Data Envio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => `
                <tr>
                  <td style="font-size:1.1em;">
                    ${_docIcon(r.tipo)}&nbsp;${escapeHtml(r.tipo || '—')}
                  </td>
                  <td>${escapeHtml(r.descricao || '—')}</td>
                  <td>${_fmtDate(r.data_documento)}</td>
                  <td>${_fmtDateTime(r.created_at)}</td>
                  <td>${r.validado
                    ? '<span class="badge badge-success">Validado</span>'
                    : '<span class="badge badge-warning">Aguardando</span>'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      el.querySelector('.modal-body').innerHTML =
        `<div class="form-error">Erro ao carregar documentos: ${escapeHtml(err.message || '')}</div>`;
    }
  },

  // ── f11 Informar Ocorrência ───────────────────────────────────────────────
  async f11InformarOcorrencia(user) {
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    const body = `
      <form id="f11-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f11-titulo">Título <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="f11-titulo" type="text" maxlength="200"
            placeholder="Título resumido da ocorrência">
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f11-tipo">Tipo <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f11-tipo">
              <option value="">— Selecione —</option>
              <option value="incidente">Incidente</option>
              <option value="acidente">Acidente</option>
              <option value="comportamento">Comportamento</option>
              <option value="patrimonial">Patrimonial</option>
              <option value="ambiental">Ambiental</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f11-gravidade">Gravidade</label>
            <select class="form-control" id="f11-gravidade">
              <option value="">— Selecione —</option>
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="grave">Grave</option>
              <option value="muito_grave">Muito Grave</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label" for="f11-data">Data e Hora <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f11-data" type="datetime-local" value="${nowLocal}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f11-local">Local da Ocorrência</label>
            <input class="form-control" id="f11-local" type="text" maxlength="200"
              placeholder="Setor, sala, área...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="f11-desc">Descrição <span style="color:var(--danger)">*</span></label>
          <textarea class="form-control" id="f11-desc" rows="4"
            placeholder="Descreva detalhadamente o que aconteceu (mínimo 20 caracteres)..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="f11-testemunhas">Testemunhas</label>
          <textarea class="form-control" id="f11-testemunhas" rows="2"
            placeholder="Nomes das testemunhas (um por linha ou separados por vírgula)"></textarea>
        </div>
        <div id="f11-error"></div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" id="f11-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f11-submit">Registrar Ocorrência</button>`;

    const { el, close } = openModal({ title: 'Informar Ocorrência', body, footer, size: 'sm' });

    el.querySelector('#f11-cancel').addEventListener('click', close);

    el.querySelector('#f11-submit').addEventListener('click', function () {
      const btn = this;
      const titulo = el.querySelector('#f11-titulo').value.trim();
      const tipo = el.querySelector('#f11-tipo').value;
      const data_ocorrencia = el.querySelector('#f11-data').value;
      const descricao = el.querySelector('#f11-desc').value.trim();
      const errDiv = el.querySelector('#f11-error');
      errDiv.innerHTML = '';

      const errors = [];
      if (!titulo) errors.push('Informe o título da ocorrência.');
      if (!tipo) errors.push('Selecione o tipo de ocorrência.');
      if (!data_ocorrencia) errors.push('Informe a data e hora da ocorrência.');
      if (!descricao || descricao.length < 20) errors.push('A descrição deve ter pelo menos 20 caracteres.');
      if (errors.length) {
        errDiv.innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join('');
        return;
      }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/ocorrencias', {
            titulo,
            tipo,
            gravidade: el.querySelector('#f11-gravidade').value || null,
            data_ocorrencia,
            local_ocorrencia: el.querySelector('#f11-local').value.trim() || null,
            descricao,
            testemunhas: el.querySelector('#f11-testemunhas').value.trim() || null,
          });
          showToast('Ocorrência registrada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao registrar ocorrência.', 'danger');
        }
      });
    });
  },

  // ── f12 Ver Minhas Ocorrências ────────────────────────────────────────────
  async f12VerMinhasOcorrencias(user) {
    const { el, close } = openModal({
      title: 'Minhas Ocorrências',
      body: _spinner(),
      size: 'lg',
    });

    try {
      const data = await _loadOpts('/global/ocorrencias');
      const bodyEl = el.querySelector('.modal-body');

      if (!data.length) { bodyEl.innerHTML = _empty(); return; }

      bodyEl.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Gravidade</th>
                <th>Local</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => `
                <tr>
                  <td>${escapeHtml(r.titulo || '—')}</td>
                  <td>${escapeHtml(r.tipo || '—')}</td>
                  <td>${_gravidadeBadge(r.gravidade)}</td>
                  <td>${escapeHtml(r.local_ocorrencia || r.local || '—')}</td>
                  <td>${_fmtDateTime(r.data_ocorrencia)}</td>
                  <td>${_badge(r.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      el.querySelector('.modal-body').innerHTML =
        `<div class="form-error">Erro ao carregar ocorrências: ${escapeHtml(err.message || '')}</div>`;
    }
  },

  // ── f13 Ver Itens Estocados ───────────────────────────────────────────────
  async f13VerItensEstocados(user) {
    const { el, close } = openModal({
      title: 'Itens em Estoque',
      body: `
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
          <input class="form-control" id="f13-search" type="text"
            placeholder="Buscar por nome ou código..." style="flex:1;min-width:160px;">
          <select class="form-control" id="f13-cat" style="max-width:180px;">
            <option value="">Todas as categorias</option>
          </select>
          <button class="btn btn-secondary" id="f13-refresh-btn" title="Atualizar">↻ Atualizar</button>
        </div>
        <div id="f13-table-wrap">${_spinner()}</div>`,
      size: 'lg',
    });

    let allData = [];

    function applyFilters() {
      const q = el.querySelector('#f13-search').value.trim().toLowerCase();
      const cat = el.querySelector('#f13-cat').value;
      const filtered = allData.filter(r => {
        const matchText = !q ||
          (r.nome || '').toLowerCase().includes(q) ||
          (r.codigo || '').toLowerCase().includes(q);
        const matchCat = !cat || (r.categoria || '') === cat;
        return matchText && matchCat;
      });
      renderTable(filtered);
    }

    function renderTable(rows) {
      const wrap = el.querySelector('#f13-table-wrap');
      if (!rows.length) { wrap.innerHTML = _empty(); return; }

      wrap.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Saldo</th>
                <th>Mín.</th>
                <th>Unidade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => {
                const saldoNum = Number(r.estoque_atual);
                const minNum = Number(r.estoque_minimo);
                const baixo = r.estoque_atual != null && r.estoque_minimo != null && saldoNum <= minNum;
                const saldoStyle = baixo ? 'color:var(--danger);font-weight:600;' : 'color:var(--success);font-weight:600;';
                const statusBadge = baixo
                  ? '<span class="badge badge-danger">Baixo</span>'
                  : '<span class="badge badge-success">OK</span>';
                return `
                  <tr>
                    <td>${escapeHtml(r.codigo || String(r.id) || '—')}</td>
                    <td>${escapeHtml(r.nome || '—')}</td>
                    <td>${escapeHtml(r.categoria || '—')}</td>
                    <td style="${saldoStyle}">${r.estoque_atual != null ? escapeHtml(String(r.estoque_atual)) : '—'}</td>
                    <td>${r.estoque_minimo != null ? escapeHtml(String(r.estoque_minimo)) : '—'}</td>
                    <td>${escapeHtml(r.unidade || '—')}</td>
                    <td>${statusBadge}</td>
                    <td>
                      <button class="btn btn-sm btn-primary f13-solicitar-btn"
                        data-id="${escapeHtml(String(r.id))}"
                        data-nome="${escapeHtml(r.nome || '')}"
                        title="Solicitar item">Solicitar</button>
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;

      wrap.querySelectorAll('.f13-solicitar-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          close();
          if (typeof GlobalForms.f27VerSolicitarEstoque === 'function') {
            GlobalForms.f27VerSolicitarEstoque(user, { id: this.dataset.id, nome: this.dataset.nome });
          }
        });
      });
    }

    function populateCatFilter() {
      const cats = [...new Set(allData.map(r => r.categoria).filter(Boolean))].sort();
      const sel = el.querySelector('#f13-cat');
      // Keep placeholder, replace dynamic options
      sel.innerHTML = '<option value="">Todas as categorias</option>' +
        cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    async function loadData() {
      el.querySelector('#f13-table-wrap').innerHTML = _spinner();
      try {
        allData = await _loadOpts('/global/estoque');
        populateCatFilter();
        renderTable(allData);
      } catch (err) {
        el.querySelector('#f13-table-wrap').innerHTML =
          `<div class="form-error">Erro ao carregar estoque: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    // Live search
    el.querySelector('#f13-search').addEventListener('input', applyFilters);
    el.querySelector('#f13-cat').addEventListener('change', applyFilters);
    el.querySelector('#f13-refresh-btn').addEventListener('click', loadData);

    loadData();
  },

  // ── f14 Consultar Cardápio ────────────────────────────────────────────────
  async f14ConsultarCardapio(user) {
    const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const REFEICOES = [
      { key: 'cafe_manha', label: 'Café da Manhã', icon: '☕' },
      { key: 'almoco',     label: 'Almoço',        icon: '🍽️' },
      { key: 'lanche',     label: 'Lanche',        icon: '🥪' },
      { key: 'jantar',     label: 'Jantar',        icon: '🌙' },
    ];
    const TIPOS = ['principal', 'acompanhamento', 'salada', 'sobremesa', 'bebida'];

    // Build a Monday-anchored 7-day week array (today..+6)
    function buildWeekDates() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
      });
    }

    const weekDates = buildWeekDates();
    const todayStr = weekDates[0].toISOString().slice(0, 10);

    // Build tab bar HTML
    const tabsHtml = weekDates.map((d, i) => {
      const ds = d.toISOString().slice(0, 10);
      const dayName = DAYS[d.getDay()];
      const dayNum = d.getDate().toString().padStart(2, '0');
      const monNum = (d.getMonth() + 1).toString().padStart(2, '0');
      return `<button class="btn f14-tab-btn ${i === 0 ? 'btn-primary' : 'btn-secondary'}"
        data-date="${escapeHtml(ds)}" style="min-width:56px;padding:4px 8px;">
        <span style="font-size:0.7em;display:block;">${escapeHtml(dayName)}</span>
        <span style="font-size:0.9em;font-weight:600;">${escapeHtml(dayNum)}/${escapeHtml(monNum)}</span>
      </button>`;
    }).join('');

    const { el, close } = openModal({
      title: 'Cardápio da Semana',
      body: `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;" id="f14-tabs">
          ${tabsHtml}
        </div>
        <div id="f14-result">${_spinner()}</div>`,
      size: 'md',
    });

    async function renderDay(dateStr) {
      const resultDiv = el.querySelector('#f14-result');
      resultDiv.innerHTML = _spinner();

      // Highlight active tab
      el.querySelectorAll('.f14-tab-btn').forEach(b => {
        b.classList.toggle('btn-primary', b.dataset.date === dateStr);
        b.classList.toggle('btn-secondary', b.dataset.date !== dateStr);
      });

      try {
        const raw = await API.get(`/global/cardapio/semana?data=${encodeURIComponent(dateStr)}`);
        const items = Array.isArray(raw) ? raw : (raw.data || []);

        // Filter to just this day (API may return full week)
        const dayItems = items.filter(i => {
          const iDate = (i.data || '').slice(0, 10);
          return !iDate || iDate === dateStr;
        });

        if (!dayItems.length) {
          resultDiv.innerHTML = `
            <div class="empty-state">
              <span class="empty-state-icon">🍽️</span>
              <span class="empty-state-title">Cardápio não cadastrado para este dia.</span>
            </div>`;
          return;
        }

        let html = '';
        REFEICOES.forEach(ref => {
          const refItems = dayItems.filter(i =>
            (i.refeicao || i.turno || '').toLowerCase() === ref.key
          );
          if (!refItems.length) return;

          html += `
            <div style="margin-bottom:18px;">
              <h4 style="margin-bottom:8px;font-size:1rem;font-weight:600;
                border-bottom:1px solid var(--border);padding-bottom:4px;">
                ${ref.icon} ${escapeHtml(ref.label)}
              </h4>
              <div style="padding-left:8px;">`;

          // Group by tipo
          TIPOS.forEach(tipo => {
            const tipoItems = refItems.filter(i => (i.tipo || '').toLowerCase() === tipo);
            if (!tipoItems.length) return;
            html += `<div style="margin-bottom:4px;">
              <strong style="text-transform:capitalize;">${escapeHtml(tipo)}:</strong>
              ${tipoItems.map(i => escapeHtml(i.nome || i.descricao || '')).join(', ')}
            </div>`;
          });

          // Items without a recognized tipo
          const outros = refItems.filter(i => !TIPOS.includes((i.tipo || '').toLowerCase()));
          if (outros.length) {
            html += `<div style="margin-bottom:4px;">
              ${outros.map(i => escapeHtml(i.nome || i.descricao || '')).join(', ')}
            </div>`;
          }

          html += '</div></div>';
        });

        resultDiv.innerHTML = html ||
          `<div class="empty-state">
            <span class="empty-state-icon">🍽️</span>
            <span class="empty-state-title">Cardápio não cadastrado para este dia.</span>
          </div>`;
      } catch (err) {
        resultDiv.innerHTML =
          `<div class="form-error">Erro ao carregar cardápio: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    el.querySelectorAll('.f14-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => renderDay(btn.dataset.date));
    });

    renderDay(todayStr);
  },

  // ── f15 Gerenciar Treinamentos ────────────────────────────────────────────
  async f15GerenciarTreinamentos(user) {
    const { el, close } = openModal({
      title: 'Meus Treinamentos',
      body: _spinner(),
      size: 'lg',
    });

    try {
      const data = await _loadOpts('/global/treinamentos');
      const body = el.querySelector('.modal-body');

      if (!data.length) {
        body.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🎓</span><span class="empty-state-title">Nenhum treinamento atribuído. Contate o RH.</span></div>`;
        return;
      }

      const now = Date.now();
      const obrigatorios = data.filter(r => r.obrigatorio);
      const obrigatoriosConcluidos = obrigatorios.filter(r => r.status === 'concluido');

      const statusColor = { concluido: 'success', em_andamento: 'info', pendente: 'warning' };

      body.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card,#f8f9fa);border-radius:8px;margin-bottom:14px;border-left:4px solid var(--primary,#0d6efd);">
          <span style="font-size:1.5rem;">🎓</span>
          <div>
            <div style="font-weight:700;font-size:1rem;">${obrigatoriosConcluidos.length} de ${obrigatorios.length} obrigatórios concluídos</div>
            <div style="font-size:0.82rem;color:var(--text-muted,#6c757d);">${data.length} treinamento(s) no total</div>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Treinamento</th>
                <th>Carga</th>
                <th>Obrigatório</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Nota</th>
                <th>Certificado</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => {
                const obrigBadge = r.obrigatorio
                  ? '<span class="badge badge-danger">Sim</span>'
                  : '<span class="badge badge-muted">Não</span>';

                let prazoHtml = '—';
                if (r.data_limite) {
                  const dlTs = new Date(r.data_limite).getTime();
                  const vencido = dlTs < now && r.status !== 'concluido';
                  if (vencido) {
                    prazoHtml = `<span style="color:var(--danger,#dc3545);font-weight:600;">VENCIDO (${_fmtDate(r.data_limite)})</span>`;
                  } else {
                    prazoHtml = escapeHtml(_fmtDate(r.data_limite));
                  }
                }

                const st = r.status || 'pendente';
                const stBadge = `<span class="badge badge-${statusColor[st] || 'muted'}">${escapeHtml(st)}</span>`;

                const certHtml = r.certificado_url
                  ? `<a href="${escapeHtml(r.certificado_url)}" target="_blank" rel="noopener" class="btn btn-secondary" style="padding:2px 8px;font-size:0.78rem;">Download</a>`
                  : '—';

                return `
                  <tr>
                    <td style="font-weight:500;">${escapeHtml(r.nome || r.treinamento || '—')}</td>
                    <td>${r.carga_horaria != null ? escapeHtml(String(r.carga_horaria)) + 'h' : '—'}</td>
                    <td>${obrigBadge}</td>
                    <td>${prazoHtml}</td>
                    <td>${stBadge}</td>
                    <td>${r.nota != null ? escapeHtml(String(r.nota)) : '—'}</td>
                    <td>${certHtml}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      el.querySelector('.modal-body').innerHTML =
        `<div class="form-error">Erro ao carregar treinamentos: ${escapeHtml(err.message || '')}</div>`;
    }
  },

  // ── f16 Ver Holerite ──────────────────────────────────────────────────────
  async f16VerHolerite(user) {
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Build last-12-months option list
    const now = new Date();
    let monthOpts = '';
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MESES[d.getMonth()]}/${d.getFullYear()}`;
      monthOpts += `<option value="${val}"${i === 0 ? ' selected' : ''}>${label}</option>`;
    }

    const { el, close } = openModal({
      title: 'Meus Holerites',
      body: `
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
          <label class="form-label" for="f16-mes" style="margin:0;white-space:nowrap;">Competência:</label>
          <select class="form-control" id="f16-mes" style="max-width:170px;">${monthOpts}</select>
        </div>
        <div id="f16-result">${_spinner()}</div>`,
      size: 'lg',
    });

    let allData = [];

    function renderHolerite(selectedVal) {
      const resultDiv = el.querySelector('#f16-result');
      const filtered = allData.filter(r => {
        if (!r.mes || !r.ano) return false;
        const val = `${r.ano}-${String(Number(r.mes)).padStart(2, '0')}`;
        return val === selectedVal;
      });

      if (!filtered.length) {
        resultDiv.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📄</span><span class="empty-state-title">Nenhum holerite disponível. Contate o RH.</span></div>`;
        return;
      }

      resultDiv.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Competência</th>
                <th>Salário Bruto</th>
                <th>Descontos</th>
                <th>Salário Líquido</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(r => {
                const mesLabel = r.mes != null ? (MESES[Number(r.mes) - 1] || String(r.mes)) : '—';
                const comp = r.ano ? `${mesLabel}/${r.ano}` : mesLabel;
                const descontos = r.descontos != null ? r.descontos : (
                  (r.salario_bruto != null && r.salario_liquido != null)
                    ? Number(r.salario_bruto) - Number(r.salario_liquido)
                    : null
                );
                return `
                  <tr>
                    <td style="font-weight:500;">${escapeHtml(comp)}</td>
                    <td>${_fmtMoney(r.salario_bruto)}</td>
                    <td style="color:var(--danger,#dc3545);">${_fmtMoney(descontos)}</td>
                    <td style="font-weight:600;color:var(--success,#198754);">${_fmtMoney(r.salario_liquido)}</td>
                    <td>${r.pdf_url
                      ? `<a href="${escapeHtml(r.pdf_url)}" target="_blank" rel="noopener" class="btn btn-secondary" style="padding:2px 8px;font-size:0.78rem;">Download</a>`
                      : '—'}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;
    }

    el.querySelector('#f16-mes').addEventListener('change', function () {
      renderHolerite(this.value);
    });

    try {
      allData = await _loadOpts('/global/holerites');
      if (!allData.length) {
        el.querySelector('#f16-result').innerHTML =
          `<div class="empty-state"><span class="empty-state-icon">📄</span><span class="empty-state-title">Nenhum holerite disponível. Contate o RH.</span></div>`;
      } else {
        renderHolerite(el.querySelector('#f16-mes').value);
      }
    } catch (err) {
      el.querySelector('#f16-result').innerHTML =
        `<div class="form-error">Erro ao carregar holerites: ${escapeHtml(err.message || '')}</div>`;
    }
  },

  // ── f17 Meu Banco de Horas ────────────────────────────────────────────────
  async f17MeuBancoHoras(user) {
    const { el, close } = openModal({
      title: 'Meu Banco de Horas',
      body: _spinner(),
      size: 'lg',
    });

    try {
      const raw = await API.get('/global/banco-horas');
      const body = el.querySelector('.modal-body');

      // Normalise: { saldo, historico[] } | array | null
      let saldo = null;
      let historico = [];
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        saldo = raw.saldo != null ? raw.saldo : (raw.saldo_horas != null ? raw.saldo_horas : null);
        historico = Array.isArray(raw.historico) ? raw.historico : [];
      } else if (Array.isArray(raw)) {
        historico = raw;
        // compute saldo from sum of saldo_mes if available
        if (historico.length && historico[0].saldo_mes != null) {
          saldo = historico.reduce((acc, r) => acc + Number(r.saldo_mes || 0), 0);
        }
      }

      const saldoColor = saldo === null
        ? 'var(--text-muted,#6c757d)'
        : (Number(saldo) >= 0 ? 'var(--success,#198754)' : 'var(--danger,#dc3545)');

      const saldoDisplay = saldo !== null
        ? (Number(saldo) >= 0 ? '+' : '') + String(saldo) + 'h'
        : '—';

      body.innerHTML = `
        <div style="text-align:center;padding:18px 0 22px;border-bottom:1px solid var(--border,#dee2e6);margin-bottom:16px;">
          <div style="font-size:0.85rem;color:var(--text-muted,#6c757d);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Saldo Atual</div>
          <div style="font-size:2.6rem;font-weight:800;color:${saldoColor};">${escapeHtml(saldoDisplay)}</div>
        </div>
        ${historico.length ? `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Horas Trabalhadas</th>
                  <th>Horas Esperadas</th>
                  <th>Saldo do Mês</th>
                </tr>
              </thead>
              <tbody>
                ${historico.map(r => {
                  const saldoMes = r.saldo_mes != null ? Number(r.saldo_mes) : null;
                  const saldoMesColor = saldoMes === null
                    ? ''
                    : (saldoMes >= 0 ? 'color:var(--success,#198754);' : 'color:var(--danger,#dc3545);');
                  const saldoMesDisplay = saldoMes !== null
                    ? (saldoMes >= 0 ? '+' : '') + String(saldoMes) + 'h'
                    : '—';
                  return `
                    <tr>
                      <td>${escapeHtml(r.mes || r.competencia || '—')}</td>
                      <td>${r.horas_trabalhadas != null ? escapeHtml(String(r.horas_trabalhadas)) + 'h' : '—'}</td>
                      <td>${r.horas_esperadas != null ? escapeHtml(String(r.horas_esperadas)) + 'h' : '—'}</td>
                      <td style="font-weight:600;${saldoMesColor}">${escapeHtml(saldoMesDisplay)}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>` : `
          <div class="empty-state" style="padding:20px 0;">
            <span class="empty-state-icon">🕐</span>
            <span class="empty-state-title">Nenhum histórico disponível.</span>
          </div>`}`;
    } catch (err) {
      el.querySelector('.modal-body').innerHTML =
        `<div class="form-error">Erro ao carregar banco de horas: ${escapeHtml(err.message || '')}</div>`;
    }
  },

  // ── f18 Lista de Ramais / Contatos ────────────────────────────────────────
  async f18ListaRamaisContatos(user) {
    const { el, close } = openModal({
      title: 'Ramais e Contatos',
      body: `
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
          <input class="form-control" id="f18-search" type="text" placeholder="Buscar por nome ou ramal..." style="flex:1;min-width:160px;">
          <span id="f18-count" style="font-size:0.82rem;color:var(--text-muted,#6c757d);white-space:nowrap;"></span>
        </div>
        <div id="f18-list">${_spinner()}</div>`,
      size: 'lg',
    });

    let allData = [];

    function renderList(rows) {
      const listDiv = el.querySelector('#f18-list');
      const countEl = el.querySelector('#f18-count');
      countEl.textContent = `${rows.length} contato(s) encontrado(s)`;

      if (!rows.length) { listDiv.innerHTML = _empty(); return; }

      // Group by departamento_nome
      const groups = {};
      rows.forEach(r => {
        const dept = r.departamento_nome || r.departamento || r.setor || 'Outros';
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(r);
      });

      let html = '<div style="overflow-x:auto;"><table class="table table-hover"><thead><tr><th>Nome</th><th>Ramal</th><th>Cargo</th><th>Celular</th></tr></thead><tbody>';
      Object.keys(groups).sort().forEach(dept => {
        html += `<tr style="background:var(--bg-card,#f8f9fa);"><td colspan="4" style="font-weight:700;font-size:0.82rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted,#6c757d);padding:6px 12px;">${escapeHtml(dept)}</td></tr>`;
        groups[dept].forEach(r => {
          html += `
            <tr>
              <td style="font-weight:500;">${escapeHtml(r.nome || '—')}</td>
              <td>${escapeHtml(r.ramal || '—')}</td>
              <td>${escapeHtml(r.cargo || '—')}</td>
              <td>${r.celular ? escapeHtml(r.celular) : '—'}</td>
            </tr>`;
        });
      });
      html += '</tbody></table></div>';
      listDiv.innerHTML = html;
    }

    function applyFilter() {
      const q = el.querySelector('#f18-search').value.trim().toLowerCase();
      const filtered = q
        ? allData.filter(r =>
            (r.nome || '').toLowerCase().includes(q) ||
            (r.ramal || '').toLowerCase().includes(q))
        : allData;
      renderList(filtered);
    }

    el.querySelector('#f18-search').addEventListener('input', applyFilter);
    el.querySelector('#f18-search').addEventListener('keydown', e => { if (e.key === 'Escape') { el.querySelector('#f18-search').value = ''; applyFilter(); } });

    try {
      allData = await _loadOpts('/global/ramais');
      renderList(allData);
    } catch (err) {
      el.querySelector('#f18-list').innerHTML =
        `<div class="form-error">Erro ao carregar ramais: ${escapeHtml(err.message || '')}</div>`;
    }
  },

  // ── f19 Canal de Ética / Denúncia Anônima ─────────────────────────────────
  async f19CanalEtica(user) {
    const CATEGORIAS = [
      { value: 'assedio_moral',      label: 'Assédio Moral',           icon: '😤' },
      { value: 'assedio_sexual',     label: 'Assédio Sexual',          icon: '🚫' },
      { value: 'fraude_desvio',      label: 'Fraude / Desvio',         icon: '💰' },
      { value: 'discriminacao',      label: 'Discriminação',           icon: '⚖️' },
      { value: 'seguranca_negligenteada', label: 'Segurança Negligenciada', icon: '⚠️' },
      { value: 'outro',              label: 'Outro',                   icon: '📝' },
    ];

    const deptos = await _loadOpts('/global/departamentos');

    const { el, close } = openModal({
      title: 'Canal de Ética',
      body: `
        <div style="background:var(--warning-bg,#fff3cd);border:1px solid var(--warning,#ffc107);border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:0.88rem;">
          <strong>Denúncia Anônima</strong> — Sua identidade não será vinculada a esta denúncia.
        </div>

        <!-- Step 1 -->
        <div id="f19-step1">
          <p style="font-weight:600;margin-bottom:12px;">Passo 1 de 3 — Selecione a categoria:</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;" id="f19-cat-grid">
            ${CATEGORIAS.map(c => `
              <button type="button" class="f19-cat-btn" data-value="${escapeHtml(c.value)}"
                style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border:2px solid var(--border,#dee2e6);border-radius:10px;background:var(--bg-card,#f8f9fa);cursor:pointer;font-size:0.85rem;font-weight:500;transition:border-color .15s,background .15s;">
                <span style="font-size:1.8rem;">${c.icon}</span>
                <span>${escapeHtml(c.label)}</span>
              </button>`).join('')}
          </div>
          <div id="f19-step1-error" style="margin-top:8px;"></div>
        </div>

        <!-- Step 2 -->
        <div id="f19-step2" style="display:none;">
          <p style="font-weight:600;margin-bottom:12px;">Passo 2 de 3 — Descreva a situação:</p>
          <div class="form-group">
            <label class="form-label" for="f19-desc">Descrição detalhada <span style="color:var(--danger)">*</span></label>
            <textarea class="form-control" id="f19-desc" rows="6"
              placeholder="Descreva os fatos com o máximo de detalhes (mínimo 50 caracteres)..."></textarea>
            <small id="f19-char-count" style="color:var(--text-muted,#6c757d);">0 / 50 caracteres mínimos</small>
          </div>
          <div class="form-group">
            <label class="form-label" for="f19-depto">Departamento Envolvido (opcional)</label>
            <select class="form-control" id="f19-depto">
              ${_optsHtml(deptos, 'id', 'nome', 'Não informar')}
            </select>
          </div>
          <div id="f19-step2-error"></div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" class="btn btn-secondary" id="f19-back1">Voltar</button>
            <button type="button" class="btn btn-primary" id="f19-next2">Próximo</button>
          </div>
        </div>

        <!-- Step 3 -->
        <div id="f19-step3" style="display:none;">
          <p style="font-weight:600;margin-bottom:12px;">Passo 3 de 3 — Confirmação:</p>
          <div style="background:var(--bg-card,#f8f9fa);border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:0.88rem;">
            <div><strong>Categoria:</strong> <span id="f19-conf-cat"></span></div>
            <div style="margin-top:6px;"><strong>Descrição:</strong> <span id="f19-conf-desc" style="white-space:pre-wrap;"></span></div>
          </div>
          <div style="background:var(--success-bg,#d1e7dd);border:1px solid var(--success,#198754);border-radius:6px;padding:10px 14px;font-size:0.85rem;margin-bottom:14px;">
            Sua identidade não será vinculada a esta denúncia. O protocolo gerado pode ser usado para acompanhamento futuro.
          </div>
          <div id="f19-step3-error"></div>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <button type="button" class="btn btn-secondary" id="f19-back2">Voltar</button>
            <button type="button" class="btn btn-danger" id="f19-submit">Enviar Denúncia</button>
          </div>
        </div>

        <!-- Result -->
        <div id="f19-result" style="display:none;"></div>`,
      size: 'sm',
    });

    let selectedCategoria = '';

    // Category selection
    el.querySelectorAll('.f19-cat-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        el.querySelectorAll('.f19-cat-btn').forEach(b => {
          b.style.borderColor = 'var(--border,#dee2e6)';
          b.style.background = 'var(--bg-card,#f8f9fa)';
        });
        this.style.borderColor = 'var(--primary,#0d6efd)';
        this.style.background = 'var(--primary-bg,#e7f0ff)';
        selectedCategoria = this.dataset.value;
        el.querySelector('#f19-step1-error').innerHTML = '';
      });
    });

    // Step 1 → 2 (click anywhere on cat button)
    el.querySelectorAll('.f19-cat-btn').forEach(btn => {
      btn.addEventListener('dblclick', function () {
        if (!selectedCategoria) return;
        el.querySelector('#f19-step1').style.display = 'none';
        el.querySelector('#f19-step2').style.display = '';
        el.querySelector('#f19-desc').focus();
      });
    });

    // Separate "Next" from category buttons — add a next button under grid
    const step1NextBtn = document.createElement('button');
    step1NextBtn.type = 'button';
    step1NextBtn.className = 'btn btn-primary';
    step1NextBtn.style.marginTop = '14px';
    step1NextBtn.textContent = 'Próximo';
    el.querySelector('#f19-step1').appendChild(step1NextBtn);

    step1NextBtn.addEventListener('click', () => {
      if (!selectedCategoria) {
        el.querySelector('#f19-step1-error').innerHTML = '<div class="form-error">Selecione uma categoria.</div>';
        return;
      }
      el.querySelector('#f19-step1').style.display = 'none';
      el.querySelector('#f19-step2').style.display = '';
      el.querySelector('#f19-desc').focus();
    });

    // Char counter
    el.querySelector('#f19-desc').addEventListener('input', function () {
      const len = this.value.trim().length;
      const cc = el.querySelector('#f19-char-count');
      cc.textContent = `${len} / 50 caracteres mínimos`;
      cc.style.color = len >= 50 ? 'var(--success,#198754)' : 'var(--text-muted,#6c757d)';
    });

    el.querySelector('#f19-back1').addEventListener('click', () => {
      el.querySelector('#f19-step2').style.display = 'none';
      el.querySelector('#f19-step1').style.display = '';
    });

    el.querySelector('#f19-next2').addEventListener('click', () => {
      const desc = el.querySelector('#f19-desc').value.trim();
      const errDiv = el.querySelector('#f19-step2-error');
      errDiv.innerHTML = '';
      if (desc.length < 50) {
        errDiv.innerHTML = '<div class="form-error">A descrição deve ter pelo menos 50 caracteres.</div>';
        return;
      }
      const catLabel = CATEGORIAS.find(c => c.value === selectedCategoria)?.label || selectedCategoria;
      el.querySelector('#f19-conf-cat').textContent = catLabel;
      el.querySelector('#f19-conf-desc').textContent = desc.length > 200 ? desc.slice(0, 200) + '…' : desc;
      el.querySelector('#f19-step2').style.display = 'none';
      el.querySelector('#f19-step3').style.display = '';
    });

    el.querySelector('#f19-back2').addEventListener('click', () => {
      el.querySelector('#f19-step3').style.display = 'none';
      el.querySelector('#f19-step2').style.display = '';
    });

    el.querySelector('#f19-submit').addEventListener('click', function () {
      const btn = this;
      const errDiv = el.querySelector('#f19-step3-error');
      errDiv.innerHTML = '';
      _withSubmit(btn, async () => {
        try {
          const res = await API.post('/global/etica', {
            categoria: selectedCategoria,
            descricao: el.querySelector('#f19-desc').value.trim(),
            departamento_envolvido_id: el.querySelector('#f19-depto').value || null,
          });
          const protocolo = (res && res.protocolo) ? res.protocolo
            : 'ET-' + Math.random().toString(36).slice(2, 10).toUpperCase();

          el.querySelector('#f19-step3').style.display = 'none';
          el.querySelector('#f19-result').style.display = '';
          el.querySelector('#f19-result').innerHTML = `
            <div style="text-align:center;padding:20px 10px;">
              <div style="font-size:2.5rem;margin-bottom:8px;">✅</div>
              <div style="font-weight:700;font-size:1.05rem;margin-bottom:12px;">Denúncia enviada com sucesso!</div>
              <div style="background:var(--success-bg,#d1e7dd);border:1px solid var(--success,#198754);border-radius:8px;padding:16px;display:inline-block;min-width:200px;">
                <div style="font-size:0.8rem;color:var(--success,#198754);text-transform:uppercase;letter-spacing:.06em;">Protocolo</div>
                <div style="font-size:1.6rem;font-weight:800;letter-spacing:.1em;color:var(--success,#198754);">${escapeHtml(protocolo)}</div>
              </div>
              <p style="margin-top:12px;font-size:0.85rem;color:var(--text-muted,#6c757d);">
                Guarde este protocolo para acompanhamento.<br>
                Sua identidade não foi vinculada a esta denúncia.
              </p>
            </div>`;
        } catch (err) {
          errDiv.innerHTML = `<div class="form-error">Erro ao enviar denúncia: ${escapeHtml(err.message || '')}</div>`;
        }
      });
    });
  },

  // ── f20 Meus EPIs ─────────────────────────────────────────────────────────
  async f20MeusEpis(user) {
    const { el, close } = openModal({
      title: 'Meus EPIs',
      body: _spinner(),
      footer: `<button class="btn btn-warning" id="f20-repor">Solicitar Reposição</button>`,
      size: 'lg',
    });

    try {
      const data = await _loadOpts('/global/epis');
      const body = el.querySelector('.modal-body');

      if (!data.length) {
        body.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🦺</span><span class="empty-state-title">Nenhum EPI registrado. Contate seu supervisor.</span></div>`;
        return;
      }

      const now = Date.now();

      body.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>EPI</th>
                <th>N° CA</th>
                <th>Data Entrega</th>
                <th>Validade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => {
                let validadeHtml = '—';
                let rowStyle = '';
                let statusHtml = '<span class="badge badge-success">OK</span>';

                if (r.data_entrega && r.validade_meses) {
                  const entrega = new Date(r.data_entrega);
                  const validade = new Date(entrega);
                  validade.setMonth(validade.getMonth() + Number(r.validade_meses));
                  const diffMs = validade.getTime() - now;
                  const diffDays = Math.floor(diffMs / 86400000);
                  const dataStr = validade.toLocaleDateString('pt-BR');
                  if (diffDays < 0) {
                    validadeHtml = escapeHtml(dataStr);
                    statusHtml = '<span class="badge badge-danger">Vencido</span>';
                    rowStyle = 'background:var(--danger-bg,#f8d7da);';
                  } else if (diffDays < 30) {
                    validadeHtml = `${escapeHtml(dataStr)} (${diffDays}d)`;
                    statusHtml = `<span class="badge badge-warning">Vence em ${diffDays}d</span>`;
                    rowStyle = 'background:var(--warning-bg,#fff3cd);';
                  } else {
                    validadeHtml = escapeHtml(dataStr);
                  }
                }
                return `
                  <tr style="${rowStyle}">
                    <td style="font-weight:500;">${escapeHtml(r.nome || r.epi || '—')}</td>
                    <td>${escapeHtml(r.ca_numero || r.ca || '—')}</td>
                    <td>${_fmtDate(r.data_entrega)}</td>
                    <td>${validadeHtml}</td>
                    <td>${statusHtml}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:10px;font-size:0.8rem;color:var(--text-muted,#6c757d);">
          <span style="display:inline-block;width:12px;height:12px;background:var(--danger-bg,#f8d7da);border:1px solid var(--danger,#dc3545);border-radius:2px;margin-right:4px;"></span>Vencido
          <span style="display:inline-block;width:12px;height:12px;background:var(--warning-bg,#fff3cd);border:1px solid var(--warning,#ffc107);border-radius:2px;margin:0 4px 0 12px;"></span>Vence em menos de 30 dias
        </div>`;
    } catch (err) {
      el.querySelector('.modal-body').innerHTML =
        `<div class="form-error">Erro ao carregar EPIs: ${escapeHtml(err.message || '')}</div>`;
    }

    // Solicitar Reposição button → simple form
    el.querySelector('#f20-repor').addEventListener('click', () => {
      close();
      const { el: el2, close: close2 } = openModal({
        title: 'Solicitar Reposição de EPI',
        body: `
          <form id="f20r-form">
            <div class="form-group">
              <label class="form-label" for="f20r-epi">EPI a Repor <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f20r-epi" type="text" maxlength="200" placeholder="Nome do EPI" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="f20r-motivo">Motivo</label>
              <textarea class="form-control" id="f20r-motivo" rows="3" placeholder="Danificado, perdido, vencido..."></textarea>
            </div>
            <div id="f20r-error"></div>
          </form>`,
        footer: `
          <button class="btn btn-secondary" id="f20r-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f20r-submit">Enviar Solicitação</button>`,
        size: 'sm',
      });

      el2.querySelector('#f20r-cancel').addEventListener('click', close2);
      el2.querySelector('#f20r-submit').addEventListener('click', function () {
        const btn = this;
        const epi = el2.querySelector('#f20r-epi').value.trim();
        const errDiv = el2.querySelector('#f20r-error');
        errDiv.innerHTML = '';
        if (!epi) { errDiv.innerHTML = '<div class="form-error">Informe o EPI a repor.</div>'; return; }
        _withSubmit(btn, async () => {
          try {
            await API.post('/global/chamados-ti', {
              titulo: `Reposição de EPI: ${epi}`,
              descricao: el2.querySelector('#f20r-motivo').value.trim() || `Solicitação de reposição do EPI: ${epi}`,
              categoria: 'epi',
            });
            showToast('Solicitação de reposição enviada com sucesso!', 'success');
            close2();
          } catch (err) {
            showToast(err.message || 'Erro ao enviar solicitação.', 'danger');
          }
        });
      });
    });
  },

  // ── f21 Solicitar Adiantamento ────────────────────────────────────────────
  async f21SolicitarAdiantamento(user) {
    const { el, close } = openModal({
      title: 'Adiantamento Salarial',
      body: _spinner(),
      size: 'sm',
    });

    let prevHtml = '';
    try {
      const existentes = await _loadOpts('/global/adiantamentos');
      if (existentes.length) {
        prevHtml = `
          <div style="margin-bottom:16px;">
            <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:8px;">Solicitações Anteriores</h4>
            <div style="overflow-x:auto;">
              <table class="table table-hover" style="font-size:0.85rem;">
                <thead>
                  <tr><th>Valor</th><th>Motivo</th><th>Status</th><th>Data</th><th>Pagamento</th><th></th></tr>
                </thead>
                <tbody id="f21-prev-tbody">
                  ${existentes.map(r => `
                    <tr id="f21-row-${escapeHtml(String(r.id))}">
                      <td>${_fmtMoney(r.valor_solicitado)}</td>
                      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.justificativa || r.motivo || '')}">${escapeHtml(r.justificativa || r.motivo || '—')}</td>
                      <td>${_badge(r.status)}</td>
                      <td>${_fmtDate(r.created_at)}</td>
                      <td>${_fmtDate(r.data_pagamento)}</td>
                      <td>${r.status === 'pendente'
                        ? `<button class="btn btn-danger f21-cancel-btn" data-id="${escapeHtml(String(r.id))}" style="padding:2px 8px;font-size:0.78rem;">Cancelar</button>`
                        : ''}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <hr style="margin:12px 0;">
          </div>`;
      }
    } catch { prevHtml = ''; }

    const bodyEl = el.querySelector('.modal-body');
    bodyEl.innerHTML = prevHtml + `
      <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;">Nova Solicitação</h4>
      <form id="f21-form">
        <div class="form-group">
          <label class="form-label" for="f21-valor">Valor Solicitado (R$) <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="f21-valor" type="number" step="0.01" min="1" max="5000" placeholder="0,00" required>
          <small style="color:var(--text-muted,#6c757d);">Máximo: R$ 5.000,00</small>
        </div>
        <div class="form-group">
          <label class="form-label" for="f21-just">Justificativa <span style="color:var(--danger)">*</span></label>
          <textarea class="form-control" id="f21-just" rows="3" placeholder="Justifique a necessidade do adiantamento..." required></textarea>
        </div>
        <p style="font-size:0.82rem;color:var(--text-muted,#6c757d);">Adiantamentos estão sujeitos à aprovação do RH/Financeiro.</p>
        <div id="f21-error"></div>
      </form>`;

    // Inject footer if absent
    let footerEl = el.querySelector('.modal-footer');
    if (!footerEl) {
      footerEl = document.createElement('div');
      footerEl.className = 'modal-footer';
      el.querySelector('.modal').appendChild(footerEl);
    }
    footerEl.innerHTML = `
      <button class="btn btn-secondary" id="f21-cancel">Cancelar</button>
      <button class="btn btn-primary" id="f21-submit">Solicitar Adiantamento</button>`;

    el.querySelector('#f21-cancel').addEventListener('click', close);

    // Cancel previous advance buttons
    bodyEl.querySelectorAll('.f21-cancel-btn').forEach(btn => {
      btn.addEventListener('click', async function () {
        if (!confirm('Cancelar este adiantamento?')) return;
        const id = this.dataset.id;
        try {
          await API.delete(`/global/adiantamentos/${id}`);
          const row = el.querySelector(`#f21-row-${id}`);
          if (row) row.remove();
          showToast('Adiantamento cancelado.', 'success');
        } catch (err) {
          showToast(err.message || 'Erro ao cancelar adiantamento.', 'danger');
        }
      });
    });

    el.querySelector('#f21-submit').addEventListener('click', function () {
      const btn = this;
      const valorVal = el.querySelector('#f21-valor').value;
      const just = el.querySelector('#f21-just').value.trim();
      const errDiv = el.querySelector('#f21-error');
      errDiv.innerHTML = '';

      if (!valorVal || Number(valorVal) <= 0) {
        errDiv.innerHTML = '<div class="form-error">Informe um valor válido.</div>'; return;
      }
      if (Number(valorVal) > 5000) {
        errDiv.innerHTML = '<div class="form-error">O valor máximo é R$ 5.000,00.</div>'; return;
      }
      if (!just) {
        errDiv.innerHTML = '<div class="form-error">Informe a justificativa.</div>'; return;
      }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/adiantamentos', {
            valor_solicitado: Number(valorVal),
            justificativa: just,
          });
          showToast('Solicitação de adiantamento enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao solicitar adiantamento.', 'danger');
        }
      });
    });
  },

  // ── f22 Reportar Bug ──────────────────────────────────────────────────────
  async f22ReportarBug(user) {
    const { el, close } = openModal({
      title: 'Reportar Bug',
      body: `
        <div id="f22-list-wrap">${_spinner()}</div>
        <hr style="margin:16px 0;">
        <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;">Novo Bug Report</h4>
        <form id="f22-form">
          <div class="form-group">
            <label class="form-label" for="f22-titulo">Título <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f22-titulo" type="text" maxlength="200" placeholder="Resumo do problema" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f22-modulo">Módulo Afetado <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f22-modulo" required>
              <option value="">— Selecione o módulo —</option>
              <option value="Dashboard">Dashboard</option>
              <option value="Solicitações">Solicitações</option>
              <option value="RH/Pessoal">RH/Pessoal</option>
              <option value="Estoque">Estoque</option>
              <option value="Manutenção">Manutenção</option>
              <option value="TI">TI</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f22-prio">Prioridade <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f22-prio" required>
              <option value="">— Selecione —</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f22-desc">O que aconteceu? <span style="color:var(--danger)">*</span></label>
            <textarea class="form-control" id="f22-desc" rows="3" placeholder="Descreva o comportamento incorreto observado..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="f22-passos">Passos para Reproduzir</label>
            <textarea class="form-control" id="f22-passos" rows="4"
              placeholder="1. Acesse o módulo X&#10;2. Clique em Y&#10;3. O erro aparece..."></textarea>
          </div>
          <div id="f22-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f22-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f22-submit">Enviar Bug Report</button>`,
      size: 'lg',
    });

    // Load user's bug list
    (async () => {
      const wrap = el.querySelector('#f22-list-wrap');
      try {
        const bugs = await _loadOpts('/global/bugs');
        if (!bugs.length) {
          wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Nenhum bug reportado anteriormente.</p>';
        } else {
          const badgePrio = { baixa: 'muted', media: 'info', alta: 'warning', critica: 'danger' };
          wrap.innerHTML = `
            <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:8px;">Meus Bug Reports</h4>
            <div style="overflow-x:auto;">
              <table class="table table-hover" style="font-size:0.85rem;">
                <thead>
                  <tr><th>Título</th><th>Módulo</th><th>Prioridade</th><th>Status</th><th>Data</th></tr>
                </thead>
                <tbody>
                  ${bugs.map(r => `
                    <tr>
                      <td>${escapeHtml(r.titulo || '—')}</td>
                      <td>${escapeHtml(r.modulo || '—')}</td>
                      <td><span class="badge badge-${badgePrio[r.prioridade] || 'muted'}">${escapeHtml(r.prioridade || '—')}</span></td>
                      <td>${_badge(r.status)}</td>
                      <td>${_fmtDate(r.created_at)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
        }
      } catch {
        wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Não foi possível carregar os bugs anteriores.</p>';
      }
    })();

    el.querySelector('#f22-cancel').addEventListener('click', close);

    el.querySelector('#f22-submit').addEventListener('click', function () {
      const btn = this;
      const titulo = el.querySelector('#f22-titulo').value.trim();
      const modulo = el.querySelector('#f22-modulo').value;
      const prio = el.querySelector('#f22-prio').value;
      const descricao = el.querySelector('#f22-desc').value.trim();
      const errDiv = el.querySelector('#f22-error');
      errDiv.innerHTML = '';

      if (!titulo) { errDiv.innerHTML = '<div class="form-error">Informe o título do bug.</div>'; return; }
      if (!modulo) { errDiv.innerHTML = '<div class="form-error">Selecione o módulo afetado.</div>'; return; }
      if (!prio) { errDiv.innerHTML = '<div class="form-error">Selecione a prioridade.</div>'; return; }
      if (!descricao) { errDiv.innerHTML = '<div class="form-error">Descreva o problema.</div>'; return; }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/bugs', {
            titulo,
            modulo,
            prioridade: prio,
            descricao,
            passos_reproducao: el.querySelector('#f22-passos').value.trim() || null,
          });
          showToast('Bug reportado com sucesso! Obrigado pela contribuição.', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao enviar bug report.', 'danger');
        }
      });
    });
  },

  // ── f23 Abrir Ticket de TI ────────────────────────────────────────────────
  async f23AbrirTicketTI(user) {
    const SLA = { baixa: '5 dias úteis', media: '2 dias úteis', alta: '4 horas', critica: '1 hora' };

    const { el, close } = openModal({
      title: 'Chamados de TI',
      body: `
        <div id="f23-list-wrap">${_spinner()}</div>
        <hr style="margin:16px 0;">
        <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;">Abrir Novo Chamado</h4>
        <form id="f23-form">
          <div class="form-group">
            <label class="form-label" for="f23-titulo">Título <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f23-titulo" type="text" maxlength="200" placeholder="Resumo do problema" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f23-cat">Categoria <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f23-cat" required>
              <option value="">— Selecione —</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="rede">Rede / Internet</option>
              <option value="impressora">Impressora</option>
              <option value="acesso_senha">Acesso / Senha</option>
              <option value="email">E-mail</option>
              <option value="sistema_tecnobloco">Sistema Tecnobloco</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f23-prio">Prioridade <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f23-prio" required>
              <option value="">— Selecione —</option>
              <option value="baixa">Baixa — SLA: 5 dias úteis</option>
              <option value="media">Média — SLA: 2 dias úteis</option>
              <option value="alta">Alta — SLA: 4 horas</option>
              <option value="critica">Crítica — SLA: 1 hora</option>
            </select>
            <small id="f23-sla-hint" style="color:var(--text-muted,#6c757d);margin-top:2px;display:block;"></small>
          </div>
          <div class="form-group">
            <label class="form-label" for="f23-desc">Descrição <span style="color:var(--danger)">*</span></label>
            <textarea class="form-control" id="f23-desc" rows="3" placeholder="Descreva o problema detalhadamente..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="f23-patrimonio">Nº Patrimônio (opcional)</label>
            <input class="form-control" id="f23-patrimonio" type="text" maxlength="60" placeholder="Etiqueta do equipamento">
          </div>
          <div id="f23-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f23-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f23-submit">Abrir Chamado</button>`,
      size: 'lg',
    });

    // SLA hint on priority change
    el.querySelector('#f23-prio').addEventListener('change', function () {
      const hint = el.querySelector('#f23-sla-hint');
      hint.textContent = this.value ? `Prazo de atendimento: ${SLA[this.value] || ''}` : '';
    });

    // Load existing tickets
    (async () => {
      const wrap = el.querySelector('#f23-list-wrap');
      try {
        const tickets = await _loadOpts('/global/chamados-ti');
        if (!tickets.length) {
          wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Nenhum chamado anterior.</p>';
        } else {
          const badgePrio = { baixa: 'muted', media: 'info', alta: 'warning', critica: 'danger' };
          wrap.innerHTML = `
            <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:8px;">Meus Chamados</h4>
            <div style="overflow-x:auto;">
              <table class="table table-hover" style="font-size:0.85rem;">
                <thead>
                  <tr><th>Título</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Aberto em</th></tr>
                </thead>
                <tbody>
                  ${tickets.map(r => `
                    <tr>
                      <td>${escapeHtml(r.titulo || '—')}</td>
                      <td>${escapeHtml(r.categoria || '—')}</td>
                      <td><span class="badge badge-${badgePrio[r.prioridade] || 'muted'}">${escapeHtml(r.prioridade || '—')}</span></td>
                      <td>${_badge(r.status)}</td>
                      <td>${_fmtDateTime(r.created_at)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
        }
      } catch {
        wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Não foi possível carregar chamados anteriores.</p>';
      }
    })();

    el.querySelector('#f23-cancel').addEventListener('click', close);

    el.querySelector('#f23-submit').addEventListener('click', function () {
      const btn = this;
      const titulo = el.querySelector('#f23-titulo').value.trim();
      const categoria = el.querySelector('#f23-cat').value;
      const prioridade = el.querySelector('#f23-prio').value;
      const descricao = el.querySelector('#f23-desc').value.trim();
      const errDiv = el.querySelector('#f23-error');
      errDiv.innerHTML = '';

      if (!titulo) { errDiv.innerHTML = '<div class="form-error">Informe o título do chamado.</div>'; return; }
      if (!categoria) { errDiv.innerHTML = '<div class="form-error">Selecione a categoria.</div>'; return; }
      if (!prioridade) { errDiv.innerHTML = '<div class="form-error">Selecione a prioridade.</div>'; return; }
      if (!descricao) { errDiv.innerHTML = '<div class="form-error">Descreva o problema.</div>'; return; }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/chamados-ti', {
            titulo,
            categoria,
            prioridade,
            descricao,
            patrimonio: el.querySelector('#f23-patrimonio').value.trim() || null,
          });
          showToast('Chamado de TI aberto com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao abrir chamado.', 'danger');
        }
      });
    });
  },

  // ── f24 Solicitar Higienização de Uniformes ───────────────────────────────
  async f24SolicitarHigienizacaoUniforme(user) {
    const PECAS = ['Camisa', 'Calça', 'Jaleco', 'Avental', 'Boné', 'Outros'];

    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    const { el, close } = openModal({
      title: 'Solicitar Higienização de Uniformes',
      body: `
        <form id="f24-form">
          <div class="form-group">
            <label class="form-label" for="f24-tipo">Tipo de Solicitação <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f24-tipo" required>
              <option value="">— Selecione —</option>
              <option value="coleta_sujos">Coleta de Sujos</option>
              <option value="coleta_especial">Coleta Especial</option>
              <option value="entrega_limpos">Entrega de Limpos</option>
              <option value="emergencial">Emergencial</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Peças <span style="color:var(--danger)">*</span></label>
            <div id="f24-items" style="display:flex;flex-direction:column;gap:6px;margin-bottom:6px;">
              <!-- rows injected here -->
            </div>
            <button type="button" class="btn btn-secondary" id="f24-add-item" style="font-size:0.85rem;padding:4px 12px;">+ Adicionar Peça</button>
            <small style="color:var(--text-muted,#6c757d);display:block;margin-top:4px;">Total: <span id="f24-total">0</span> peça(s)</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="f24-data">Data Preferencial</label>
            <input class="form-control" id="f24-data" type="datetime-local" value="${nowLocal}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f24-obs">Observações</label>
            <textarea class="form-control" id="f24-obs" rows="2" placeholder="Informações adicionais..."></textarea>
          </div>
          <div id="f24-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f24-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f24-submit">Solicitar Higienização</button>`,
      size: 'sm',
    });

    function pecaOptsHtml() {
      return PECAS.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
    }

    function addItemRow() {
      const itemsDiv = el.querySelector('#f24-items');
      const row = document.createElement('div');
      row.className = 'f24-item-row';
      row.style.cssText = 'display:flex;gap:6px;align-items:center;';
      row.innerHTML = `
        <select class="form-control f24-peca-sel" style="flex:2;">
          ${pecaOptsHtml()}
        </select>
        <input class="form-control f24-qtd-inp" type="number" min="1" step="1" value="1" style="flex:1;max-width:80px;">
        <button type="button" class="f24-remove-row" style="background:none;border:none;color:var(--danger,#dc3545);font-size:1.2rem;cursor:pointer;padding:0 4px;" title="Remover">&times;</button>`;
      itemsDiv.appendChild(row);
      row.querySelector('.f24-remove-row').addEventListener('click', () => {
        row.remove();
        updateTotal();
      });
      row.querySelector('.f24-qtd-inp').addEventListener('input', updateTotal);
      updateTotal();
    }

    function updateTotal() {
      let total = 0;
      el.querySelectorAll('.f24-qtd-inp').forEach(inp => { total += Math.max(0, parseInt(inp.value, 10) || 0); });
      el.querySelector('#f24-total').textContent = total;
    }

    el.querySelector('#f24-add-item').addEventListener('click', addItemRow);
    addItemRow(); // start with one row

    el.querySelector('#f24-cancel').addEventListener('click', close);

    el.querySelector('#f24-submit').addEventListener('click', function () {
      const btn = this;
      const tipo = el.querySelector('#f24-tipo').value;
      const errDiv = el.querySelector('#f24-error');
      errDiv.innerHTML = '';

      if (!tipo) { errDiv.innerHTML = '<div class="form-error">Selecione o tipo de solicitação.</div>'; return; }

      const itemRows = el.querySelectorAll('.f24-item-row');
      if (!itemRows.length) { errDiv.innerHTML = '<div class="form-error">Adicione ao menos uma peça.</div>'; return; }

      const itens = [];
      let totalPecas = 0;
      let valid = true;
      itemRows.forEach(row => {
        const peca = row.querySelector('.f24-peca-sel').value;
        const qtd = parseInt(row.querySelector('.f24-qtd-inp').value, 10);
        if (!qtd || qtd < 1) { valid = false; return; }
        itens.push({ peca, quantidade: qtd });
        totalPecas += qtd;
      });
      if (!valid || !totalPecas) { errDiv.innerHTML = '<div class="form-error">Verifique as quantidades das peças.</div>'; return; }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/lavanderia', {
            tipo,
            itens,
            quantidade_pecas: totalPecas,
            data_preferencial: el.querySelector('#f24-data').value || null,
            observacoes: el.querySelector('#f24-obs').value.trim() || null,
          });
          showToast('Solicitação de higienização enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao solicitar higienização.', 'danger');
        }
      });
    });
  },

  // ── f25 Solicitar Serviços Gerais ─────────────────────────────────────────
  async f25SolicitarServicosGerais(user) {
    const SERVICOS = [
      { value: 'mudanca_moveis', label: 'Mudança de Móveis',     icon: '🪑' },
      { value: 'pintura',        label: 'Pintura',                icon: '🖌' },
      { value: 'capina',         label: 'Capina / Jardinagem',   icon: '🌿' },
      { value: 'limpeza_area',   label: 'Limpeza Pesada',        icon: '🧺' },
      { value: 'instalacao',     label: 'Montagem / Instalação', icon: '🔩' },
      { value: 'coleta_lixo',    label: 'Descarte de Resíduos',  icon: '🗑' },
      { value: 'outro',          label: 'Outro',                  icon: '🏗' },
    ];

    const { el, close } = openModal({
      title: 'Solicitar Serviços Gerais',
      body: `
        <div id="f25-prev-wrap">${_spinner()}</div>
        <hr style="margin:14px 0;">
        <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;">Nova Solicitação</h4>
        <form id="f25-form">
          <div class="form-group">
            <label class="form-label">Serviço <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f25-servico" required>
              <option value="">— Selecione o serviço —</option>
              ${SERVICOS.map(s => `<option value="${escapeHtml(s.value)}">${s.icon} ${escapeHtml(s.label)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="f25-local">Local <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f25-local" type="text" maxlength="200" placeholder="Ex.: Setor de Produção, Sala 3..." required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f25-desc">Descrição <span style="color:var(--danger)">*</span></label>
            <textarea class="form-control" id="f25-desc" rows="3" placeholder="Descreva o serviço necessário..." required></textarea>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:120px;">
              <label class="form-label" for="f25-urgencia">Urgência</label>
              <select class="form-control" id="f25-urgencia">
                <option value="baixa">Baixa (normal)</option>
                <option value="media" selected>Média</option>
                <option value="alta">Alta (urgente)</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:140px;">
              <label class="form-label" for="f25-data">Data Preferencial</label>
              <input class="form-control" id="f25-data" type="date">
            </div>
          </div>
          <div id="f25-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f25-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f25-submit">Solicitar Serviço</button>`,
      size: 'lg',
    });

    // Load previous requests
    (async () => {
      const wrap = el.querySelector('#f25-prev-wrap');
      try {
        const prev = await _loadOpts('/global/servicos-gerais');
        if (!prev.length) {
          wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Nenhuma solicitação anterior.</p>';
        } else {
          wrap.innerHTML = `
            <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:8px;">Minhas Solicitações</h4>
            <div style="overflow-x:auto;">
              <table class="table table-hover" style="font-size:0.85rem;">
                <thead>
                  <tr><th>Serviço</th><th>Local</th><th>Urgência</th><th>Status</th><th>Data</th></tr>
                </thead>
                <tbody>
                  ${prev.map(r => {
                    const svc = SERVICOS.find(s => s.value === r.servico || s.value === r.tipo);
                    const svcLabel = svc ? `${svc.icon} ${svc.label}` : escapeHtml(r.servico || r.tipo || '—');
                    return `
                      <tr>
                        <td>${svcLabel}</td>
                        <td>${escapeHtml(r.local || '—')}</td>
                        <td>${escapeHtml(r.urgencia || '—')}</td>
                        <td>${_badge(r.status)}</td>
                        <td>${_fmtDate(r.created_at)}</td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`;
        }
      } catch {
        wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Não foi possível carregar solicitações anteriores.</p>';
      }
    })();

    el.querySelector('#f25-cancel').addEventListener('click', close);

    el.querySelector('#f25-submit').addEventListener('click', function () {
      const btn = this;
      const servico = el.querySelector('#f25-servico').value;
      const local = el.querySelector('#f25-local').value.trim();
      const descricao = el.querySelector('#f25-desc').value.trim();
      const errDiv = el.querySelector('#f25-error');
      errDiv.innerHTML = '';

      if (!servico) { errDiv.innerHTML = '<div class="form-error">Selecione o tipo de serviço.</div>'; return; }
      if (!local) { errDiv.innerHTML = '<div class="form-error">Informe o local.</div>'; return; }
      if (!descricao) { errDiv.innerHTML = '<div class="form-error">Descreva o serviço necessário.</div>'; return; }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/servicos-gerais', {
            tipo: servico,
            local,
            descricao,
            urgencia: el.querySelector('#f25-urgencia').value,
          });
          showToast('Solicitação de serviço enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao solicitar serviço.', 'danger');
        }
      });
    });
  },

  // ── f26 Solicitar Veículo ─────────────────────────────────────────────────
  async f26SolicitarVeiculo(user) {
    const veiculos = await _loadOpts('/global/veiculos-disp');

    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    const { el, close } = openModal({
      title: 'Solicitar Veículo',
      body: `
        <div id="f26-prev-wrap">${_spinner()}</div>
        <hr style="margin:14px 0;">
        <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;">Nova Solicitação</h4>
        <form id="f26-form">
          <div class="form-group">
            <label class="form-label" for="f26-dest">Destino <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f26-dest" type="text" maxlength="300"
              placeholder="Ex.: Prefeitura de Guapó — Rua XV de Novembro, 100" required>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:160px;">
              <label class="form-label" for="f26-saida">Saída <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f26-saida" type="datetime-local" value="${nowLocal}" required>
            </div>
            <div class="form-group" style="flex:1;min-width:160px;">
              <label class="form-label" for="f26-retorno">Retorno <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f26-retorno" type="datetime-local" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="f26-motivo">Motivo <span style="color:var(--danger)">*</span></label>
            <textarea class="form-control" id="f26-motivo" rows="3" placeholder="Justifique a necessidade do veículo..." required></textarea>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:100px;">
              <label class="form-label" for="f26-pass">Passageiros</label>
              <input class="form-control" id="f26-pass" type="number" min="1" max="20" step="1" value="1">
            </div>
            <div class="form-group" style="flex:2;min-width:160px;">
              <label class="form-label" for="f26-veiculo">Veículo Preferido (opcional)</label>
              <select class="form-control" id="f26-veiculo">
                <option value="">— Sem preferência —</option>
                ${veiculos.map(v => `<option value="${escapeHtml(String(v.id))}">${escapeHtml((v.placa ? v.placa + ' — ' : '') + (v.modelo || v.nome || ''))}</option>`).join('')}
              </select>
            </div>
          </div>
          <div id="f26-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f26-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f26-submit">Solicitar Veículo</button>`,
      size: 'lg',
    });

    // Load previous vehicle requests
    (async () => {
      const wrap = el.querySelector('#f26-prev-wrap');
      try {
        const prev = await _loadOpts('/global/veiculo');
        if (!prev.length) {
          wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Nenhuma solicitação anterior.</p>';
        } else {
          wrap.innerHTML = `
            <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:8px;">Minhas Solicitações</h4>
            <div style="overflow-x:auto;">
              <table class="table table-hover" style="font-size:0.85rem;">
                <thead>
                  <tr><th>Destino</th><th>Saída</th><th>Retorno</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${prev.map(r => `
                    <tr>
                      <td>${escapeHtml(r.destino || '—')}</td>
                      <td>${_fmtDateTime(r.data_saida)}</td>
                      <td>${_fmtDateTime(r.data_retorno)}</td>
                      <td>${_badge(r.status)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
        }
      } catch {
        wrap.innerHTML = '<p style="color:var(--text-muted,#6c757d);font-size:0.9rem;">Não foi possível carregar solicitações anteriores.</p>';
      }
    })();

    el.querySelector('#f26-cancel').addEventListener('click', close);

    el.querySelector('#f26-submit').addEventListener('click', function () {
      const btn = this;
      const destino = el.querySelector('#f26-dest').value.trim();
      const data_saida = el.querySelector('#f26-saida').value;
      const data_retorno = el.querySelector('#f26-retorno').value;
      const motivo = el.querySelector('#f26-motivo').value.trim();
      const errDiv = el.querySelector('#f26-error');
      errDiv.innerHTML = '';

      if (!destino) { errDiv.innerHTML = '<div class="form-error">Informe o destino.</div>'; return; }
      if (!data_saida) { errDiv.innerHTML = '<div class="form-error">Informe a data/hora de saída.</div>'; return; }
      if (!data_retorno) { errDiv.innerHTML = '<div class="form-error">Informe a data/hora de retorno.</div>'; return; }
      if (data_retorno <= data_saida) { errDiv.innerHTML = '<div class="form-error">A data de retorno deve ser posterior à saída.</div>'; return; }
      if (!motivo) { errDiv.innerHTML = '<div class="form-error">Informe o motivo da solicitação.</div>'; return; }

      _withSubmit(btn, async () => {
        try {
          await API.post('/global/veiculo', {
            destino,
            data_saida,
            data_retorno,
            motivo,
            passageiros: Number(el.querySelector('#f26-pass').value) || 1,
            veiculo_preferido_id: el.querySelector('#f26-veiculo').value || null,
          });
          showToast('Solicitação de veículo enviada com sucesso!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Erro ao solicitar veículo.', 'danger');
        }
      });
    });
  },

  // ── f27 Ver / Solicitar Estoque ───────────────────────────────────────────
  async f27VerSolicitarEstoque(user) {
    const { el, close } = openModal({
      title: 'Estoque',
      body: `
        <!-- Tabs -->
        <div style="display:flex;border-bottom:2px solid var(--border,#dee2e6);margin-bottom:14px;gap:0;">
          <button type="button" class="f27-tab-btn" data-tab="solicitar"
            style="padding:8px 18px;border:none;border-bottom:2px solid var(--primary,#0d6efd);margin-bottom:-2px;background:none;font-weight:600;color:var(--primary,#0d6efd);cursor:pointer;">
            Solicitar
          </button>
          <button type="button" class="f27-tab-btn" data-tab="requisicoes"
            style="padding:8px 18px;border:none;background:none;color:var(--text-muted,#6c757d);cursor:pointer;">
            Minhas Requisições
          </button>
        </div>

        <!-- Tab: Solicitar -->
        <div id="f27-tab-solicitar">
          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
            <input class="form-control" id="f27-search" type="text" placeholder="Buscar produto..." style="flex:1;min-width:140px;">
            <button class="btn btn-secondary" id="f27-search-btn">Buscar</button>
            <button class="btn btn-secondary" id="f27-refresh-btn" title="Atualizar">↻</button>
          </div>
          <div id="f27-table-wrap">${_spinner()}</div>
        </div>

        <!-- Tab: Minhas Requisições -->
        <div id="f27-tab-requisicoes" style="display:none;">
          <div id="f27-req-wrap">${_spinner()}</div>
        </div>`,
      size: 'lg',
    });

    // Tab switching
    el.querySelectorAll('.f27-tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = this.dataset.tab;
        el.querySelectorAll('.f27-tab-btn').forEach(b => {
          const active = b.dataset.tab === tab;
          b.style.borderBottom = active ? '2px solid var(--primary,#0d6efd)' : 'none';
          b.style.color = active ? 'var(--primary,#0d6efd)' : 'var(--text-muted,#6c757d)';
          b.style.fontWeight = active ? '600' : 'normal';
          b.style.marginBottom = active ? '-2px' : '0';
        });
        el.querySelector('#f27-tab-solicitar').style.display = tab === 'solicitar' ? '' : 'none';
        el.querySelector('#f27-tab-requisicoes').style.display = tab === 'requisicoes' ? '' : 'none';
        if (tab === 'requisicoes') loadReqs();
      });
    });

    let allData = [];
    let reqsLoaded = false;

    function renderTable(rows) {
      const wrap = el.querySelector('#f27-table-wrap');
      if (!rows.length) { wrap.innerHTML = _empty(); return; }

      const urgOpts = `
        <option value="normal">Normal</option>
        <option value="urgente">Urgente</option>
        <option value="critica">Crítica</option>`;

      wrap.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover" id="f27-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Saldo</th>
                <th>Unidade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => {
                const baixo = r.estoque_atual != null && r.estoque_minimo != null
                  && Number(r.estoque_atual) <= Number(r.estoque_minimo);
                const saldoBadge = baixo
                  ? `<span class="badge badge-danger">${escapeHtml(String(r.estoque_atual))}</span>`
                  : `<span class="badge badge-success">${escapeHtml(String(r.estoque_atual != null ? r.estoque_atual : '—'))}</span>`;
                return `
                  <tr data-pid="${escapeHtml(String(r.id || ''))}">
                    <td style="font-weight:500;">${escapeHtml(r.nome || '—')}</td>
                    <td>${saldoBadge}</td>
                    <td>${escapeHtml(r.unidade || '—')}</td>
                    <td><button class="btn btn-secondary f27-sol-btn" style="padding:2px 10px;font-size:0.8rem;">Solicitar</button></td>
                  </tr>
                  <tr class="f27-inline-row" style="display:none;" data-for="${escapeHtml(String(r.id || ''))}">
                    <td colspan="4">
                      <div style="padding:8px;background:var(--bg-card,#f8f9fa);border-radius:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">
                        <div class="form-group" style="margin:0;flex:1;min-width:80px;">
                          <label class="form-label" style="font-size:0.78rem;">Quantidade</label>
                          <input class="form-control f27-qtd" type="number" step="0.001" min="0.001" placeholder="0" style="font-size:0.85rem;">
                        </div>
                        <div class="form-group" style="margin:0;flex:1;min-width:90px;">
                          <label class="form-label" style="font-size:0.78rem;">Urgência</label>
                          <select class="form-control f27-urg" style="font-size:0.85rem;">${urgOpts}</select>
                        </div>
                        <div class="form-group" style="margin:0;flex:2;min-width:140px;">
                          <label class="form-label" style="font-size:0.78rem;">Justificativa</label>
                          <input class="form-control f27-just" type="text" maxlength="300" placeholder="Por que precisa?" style="font-size:0.85rem;">
                        </div>
                        <button class="btn btn-primary f27-confirm-btn" style="padding:4px 12px;font-size:0.82rem;">Confirmar</button>
                        <button class="btn btn-secondary f27-cancel-btn" style="padding:4px 10px;font-size:0.82rem;">Cancelar</button>
                      </div>
                      <div class="f27-inline-err" style="margin-top:4px;"></div>
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;

      wrap.querySelectorAll('.f27-sol-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const prodRow = this.closest('tr');
          const pid = prodRow.dataset.pid;
          const inlineRow = wrap.querySelector(`.f27-inline-row[data-for="${CSS.escape(pid)}"]`);
          if (!inlineRow) return;
          wrap.querySelectorAll('.f27-inline-row').forEach(r => { if (r !== inlineRow) r.style.display = 'none'; });
          const visible = inlineRow.style.display !== 'none';
          inlineRow.style.display = visible ? 'none' : '';
          if (!visible) inlineRow.querySelector('.f27-qtd').focus();
        });
      });

      wrap.querySelectorAll('.f27-cancel-btn').forEach(btn => {
        btn.addEventListener('click', function () { this.closest('.f27-inline-row').style.display = 'none'; });
      });

      wrap.querySelectorAll('.f27-confirm-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const inline = this.closest('.f27-inline-row');
          const pid = inline.dataset.for;
          const qtd = inline.querySelector('.f27-qtd').value;
          const urg = inline.querySelector('.f27-urg').value;
          const just = inline.querySelector('.f27-just').value.trim();
          const errDiv = inline.querySelector('.f27-inline-err');
          errDiv.innerHTML = '';
          if (!qtd || Number(qtd) <= 0) { errDiv.innerHTML = '<div class="form-error">Informe a quantidade.</div>'; return; }
          if (!just) { errDiv.innerHTML = '<div class="form-error">Informe a justificativa.</div>'; return; }
          _withSubmit(btn, async () => {
            try {
              await API.post('/global/estoque-req', {
                produto_id: pid,
                quantidade: Number(qtd),
                urgencia: urg,
                justificativa: just,
              });
              showToast('Requisição enviada com sucesso!', 'success');
              inline.style.display = 'none';
              inline.querySelector('.f27-qtd').value = '';
              inline.querySelector('.f27-just').value = '';
              reqsLoaded = false; // invalidate cache
            } catch (err) {
              showToast(err.message || 'Erro ao solicitar item.', 'danger');
            }
          });
        });
      });
    }

    async function loadData() {
      el.querySelector('#f27-table-wrap').innerHTML = _spinner();
      try {
        allData = await _loadOpts('/global/estoque');
        renderTable(allData);
      } catch (err) {
        el.querySelector('#f27-table-wrap').innerHTML =
          `<div class="form-error">Erro ao carregar estoque: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    async function loadReqs() {
      if (reqsLoaded) return;
      const wrap = el.querySelector('#f27-req-wrap');
      wrap.innerHTML = _spinner();
      try {
        const reqs = await _loadOpts('/global/estoque-req');
        reqsLoaded = true;
        if (!reqs.length) { wrap.innerHTML = _empty(); return; }
        const urgColor = { normal: 'muted', urgente: 'warning', critica: 'danger' };
        wrap.innerHTML = `
          <div style="overflow-x:auto;">
            <table class="table table-hover" style="font-size:0.85rem;">
              <thead>
                <tr><th>Item</th><th>Quantidade</th><th>Urgência</th><th>Status</th><th>Data</th></tr>
              </thead>
              <tbody>
                ${reqs.map(r => `
                  <tr>
                    <td>${escapeHtml(r.produto_nome || r.item || '—')}</td>
                    <td>${r.quantidade != null ? escapeHtml(String(r.quantidade)) : '—'}</td>
                    <td><span class="badge badge-${urgColor[r.urgencia] || 'muted'}">${escapeHtml(r.urgencia || '—')}</span></td>
                    <td>${_badge(r.status)}</td>
                    <td>${_fmtDate(r.created_at)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
      } catch (err) {
        wrap.innerHTML = `<div class="form-error">Erro ao carregar requisições: ${escapeHtml(err.message || '')}</div>`;
      }
    }

    el.querySelector('#f27-search-btn').addEventListener('click', () => {
      const q = el.querySelector('#f27-search').value.trim().toLowerCase();
      renderTable(q ? allData.filter(r => (r.nome || '').toLowerCase().includes(q)) : allData);
    });
    el.querySelector('#f27-search').addEventListener('keydown', e => { if (e.key === 'Enter') el.querySelector('#f27-search-btn').click(); });
    el.querySelector('#f27-refresh-btn').addEventListener('click', loadData);

    loadData();
  },

  // ── f28 Ver Escala de Manutenção ──────────────────────────────────────────
  async f28VerEscalaManutencao(user) {
    const { el, close } = openModal({
      title: 'Escala de Manutenção',
      body: _spinner(),
      size: 'lg',
    });

    try {
      const raw = await _loadOpts('/global/escala-manutencao');

      const body = el.querySelector('.modal-body');

      if (!raw.length) {
        body.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🔧</span><span class="empty-state-title">Nenhuma OS programada para seu setor.</span></div>`;
        return;
      }

      const data = raw.slice().sort((a, b) => {
        const da = new Date(a.data_previsao || a.data_prevista || 0).getTime();
        const db = new Date(b.data_previsao || b.data_prevista || 0).getTime();
        return da - db;
      });

      const prioColor = { critica: '#f8d7da', alta: '#fff3cd', media: '', baixa: '' };
      const prioBadge = { critica: 'danger', alta: 'warning', media: 'info', baixa: 'muted' };

      body.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Data Previsão</th>
                <th>Código OS</th>
                <th>Equipamento</th>
                <th>Localização</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => {
                const prio = (r.prioridade || '').toLowerCase();
                const rowBg = prioColor[prio] ? `background:${prioColor[prio]};` : '';
                const prioBadgeClass = prioBadge[prio] || 'muted';
                return `
                  <tr style="${rowBg}">
                    <td style="white-space:nowrap;">${_fmtDate(r.data_previsao || r.data_prevista)}</td>
                    <td style="font-family:monospace;">${escapeHtml(r.codigo || r.id || '—')}</td>
                    <td style="font-weight:500;">${escapeHtml(r.equipamento || r.equipamento_nome || '—')}</td>
                    <td>${escapeHtml(r.localizacao || r.local || '—')}</td>
                    <td>${escapeHtml(r.tipo || '—')}</td>
                    <td><span class="badge badge-${prioBadgeClass}">${escapeHtml(r.prioridade || '—')}</span></td>
                    <td>${_badge(r.status)}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:12px;font-size:0.78rem;color:var(--text-muted,#6c757d);display:flex;gap:14px;flex-wrap:wrap;">
          <span><span style="display:inline-block;width:12px;height:12px;background:#f8d7da;border:1px solid #dc3545;border-radius:2px;margin-right:4px;"></span>Crítica</span>
          <span><span style="display:inline-block;width:12px;height:12px;background:#fff3cd;border:1px solid #ffc107;border-radius:2px;margin-right:4px;"></span>Alta</span>
          <span><span style="display:inline-block;width:12px;height:12px;background:var(--border,#dee2e6);border:1px solid #adb5bd;border-radius:2px;margin-right:4px;"></span>Média / Baixa</span>
        </div>`;
    } catch (err) {
      el.querySelector('.modal-body').innerHTML =
        `<div class="form-error">Erro ao carregar escala de manutenção: ${escapeHtml(err.message || '')}</div>`;
    }
  },

};

window.GlobalForms = GlobalForms;
