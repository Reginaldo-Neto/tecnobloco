'use strict';
/**
 * ManutencaoForms — Parte 2 (f11–f19)
 * Este arquivo será combinado com manutencao_forms.js
 * PART2_START
 */

// These methods will be merged into ManutencaoForms object
// Each is: ManutencaoForms.fXX = function(user) { ... };

// ── f11 Calibração de Instrumentos ───────────────────────────────────────────
ManutencaoForms.f11CalibracaoInstrumentos = async function (user) {
  const { el, close } = openModal({
    title: 'Calibração de Instrumentos',
    body: _spinner(),
    footer: `<button class="btn btn-secondary" id="f11-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f11-close').addEventListener('click', close);

  const bodyEl = el;

  async function loadCalibrações() {
    bodyEl.innerHTML = _spinner();
    try {
      const ferramentas = await API.get('/manutencao/ferramentas');
      const lista = Array.isArray(ferramentas) ? ferramentas : (ferramentas.data || []);
      const comCalib = lista.filter(f => f.calibracao_proxima);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const em30 = new Date(hoje);
      em30.setDate(em30.getDate() + 30);

      function calibStatus(f) {
        const d = new Date(f.calibracao_proxima);
        if (d < hoje) return { cls: 'danger', label: 'Vencida' };
        if (d <= em30) return { cls: 'warning', label: 'Próxima' };
        return { cls: 'success', label: 'OK' };
      }

      const tabsHtml = `
        <div class="tab-bar" id="f11-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px;">
          <button class="btn btn-sm btn-primary f11-tab-btn" data-tab="calibracoes">Calibrações</button>
          <button class="btn btn-sm btn-secondary f11-tab-btn" data-tab="novo">Novo Registro</button>
        </div>
        <div id="f11-tab-calibracoes">
          ${comCalib.length === 0 ? _empty() : `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Nº Série</th>
                  <th>Localização</th>
                  <th>Calibração Prevista</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${comCalib.map(f => {
                  const st = calibStatus(f);
                  return `
                    <tr>
                      <td>${escapeHtml(f.nome || '—')}</td>
                      <td>${escapeHtml(f.numero_serie || '—')}</td>
                      <td>${escapeHtml(f.localizacao || '—')}</td>
                      <td style="color:var(--${st.cls})">${_fmtDate(f.calibracao_proxima)}</td>
                      <td><span class="badge badge-${st.cls}">${st.label}</span></td>
                      <td>
                        <button class="btn btn-sm btn-primary f11-registrar-btn"
                          data-id="${escapeHtml(String(f.id))}"
                          data-nome="${escapeHtml(f.nome || '')}">
                          Registrar Calibração
                        </button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
        <div id="f11-tab-novo" style="display:none;">
          <form id="f11-novo-form" novalidate>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Equipamento / Instrumento <span style="color:var(--danger)">*</span></label>
                <input class="form-control" id="f11-novo-equip" type="text" placeholder="Nome do instrumento">
              </div>
              <div class="form-group">
                <label class="form-label">Título do Plano <span style="color:var(--danger)">*</span></label>
                <input class="form-control" id="f11-novo-titulo" type="text" placeholder="Ex: Calibração anual manômetro">
              </div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Próxima Calibração <span style="color:var(--danger)">*</span></label>
                <input class="form-control" id="f11-novo-proxima" type="date">
              </div>
              <div class="form-group">
                <label class="form-label">Responsável</label>
                <input class="form-control" id="f11-novo-resp" type="text" placeholder="Nome do responsável">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Observações</label>
              <textarea class="form-control" id="f11-novo-obs" rows="3" placeholder="Padrão utilizado, norma de referência..."></textarea>
            </div>
            <div id="f11-novo-error"></div>
            <button class="btn btn-primary" id="f11-novo-submit" type="button">Salvar Plano</button>
          </form>
        </div>`;

      bodyEl.innerHTML = tabsHtml;

      // Tab switching
      bodyEl.querySelectorAll('.f11-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bodyEl.querySelectorAll('.f11-tab-btn').forEach(b => {
            b.className = 'btn btn-sm btn-secondary f11-tab-btn';
          });
          btn.className = 'btn btn-sm btn-primary f11-tab-btn';
          bodyEl.querySelector('#f11-tab-calibracoes').style.display = btn.dataset.tab === 'calibracoes' ? '' : 'none';
          bodyEl.querySelector('#f11-tab-novo').style.display = btn.dataset.tab === 'novo' ? '' : 'none';
        });
      });

      // Registrar calibração buttons
      bodyEl.querySelectorAll('.f11-registrar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const fId = btn.dataset.id;
          const fNome = btn.dataset.nome;
          const nowDate = new Date().toISOString().slice(0, 10);

          const subBody = `
            <form id="f11-sub-form" novalidate>
              <p style="color:var(--muted);margin-bottom:12px;">Instrumento: <strong>${escapeHtml(fNome)}</strong></p>
              <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                  <label class="form-label">Data da Calibração <span style="color:var(--danger)">*</span></label>
                  <input class="form-control" id="f11-sub-data" type="date" value="${nowDate}">
                </div>
                <div class="form-group">
                  <label class="form-label">Próxima Calibração <span style="color:var(--danger)">*</span></label>
                  <input class="form-control" id="f11-sub-proxima" type="date">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Responsável</label>
                <input class="form-control" id="f11-sub-resp" type="text" value="${escapeHtml(user.nome || '')}" placeholder="Nome do responsável">
              </div>
              <div class="form-group">
                <label class="form-label">Observações</label>
                <textarea class="form-control" id="f11-sub-obs" rows="2" placeholder="Resultado, laudo, certificado nº..."></textarea>
              </div>
              <div id="f11-sub-error"></div>
            </form>`;

          const { el: subEl, close: subClose } = openModal({
            title: 'Registrar Calibração',
            body: subBody,
            footer: `
              <button class="btn btn-secondary" id="f11-sub-cancel">Cancelar</button>
              <button class="btn btn-primary" id="f11-sub-submit">Salvar</button>`,
            size: 'sm',
          });

          subEl.querySelector('#f11-sub-cancel').addEventListener('click', subClose);
          subEl.querySelector('#f11-sub-submit').addEventListener('click', function () {
            const submitBtn = this;
            const data_calibracao = subEl.querySelector('#f11-sub-data').value;
            const proxima = subEl.querySelector('#f11-sub-proxima').value;
            const errDiv = subEl.querySelector('#f11-sub-error');
            errDiv.innerHTML = '';
            if (!data_calibracao || !proxima) {
              errDiv.innerHTML = '<div class="form-error">Informe data da calibração e próxima calibração.</div>';
              return;
            }
            _withSubmit(submitBtn, async () => {
              try {
                await API.put('/manutencao/ferramentas/' + fId, {
                  calibracao_proxima: proxima,
                  observacoes: subEl.querySelector('#f11-sub-obs').value.trim() || null,
                  responsavel: subEl.querySelector('#f11-sub-resp').value.trim() || null,
                });
                showToast('Calibração registrada com sucesso!', 'success');
                subClose();
                loadCalibrações();
              } catch (err) {
                showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
              }
            });
          });
        });
      });

      // Novo plano submit
      const novoSubmit = bodyEl.querySelector('#f11-novo-submit');
      if (novoSubmit) {
        novoSubmit.addEventListener('click', function () {
          const btn = this;
          const titulo = bodyEl.querySelector('#f11-novo-titulo').value.trim();
          const proxima = bodyEl.querySelector('#f11-novo-proxima').value;
          const errDiv = bodyEl.querySelector('#f11-novo-error');
          errDiv.innerHTML = '';
          if (!titulo || !proxima) {
            errDiv.innerHTML = '<div class="form-error">Informe título e data da próxima calibração.</div>';
            return;
          }
          _withSubmit(btn, async () => {
            try {
              await API.post('/manutencao/preventiva', {
                tipo: 'calibracao',
                titulo,
                proxima_data: proxima,
                responsavel: bodyEl.querySelector('#f11-novo-resp').value.trim() || null,
                descricao: bodyEl.querySelector('#f11-novo-obs').value.trim() || null,
              });
              showToast('Plano de calibração criado!', 'success');
              bodyEl.querySelector('#f11-novo-form').reset();
            } catch (err) {
              showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
            }
          });
        });
      }

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar dados: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  loadCalibrações();
};

// ── f12 Manutenção de Utilidades ──────────────────────────────────────────────
ManutencaoForms.f12ManutencaoUtilidades = async function (user) {
  const { el, close } = openModal({
    title: 'Manutenção de Utilidades',
    body: _spinner(),
    footer: `<button class="btn btn-secondary" id="f12-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f12-close').addEventListener('click', close);
  const bodyEl = el;

  async function loadData() {
    bodyEl.innerHTML = _spinner();
    try {
      const [planosRaw, equipsRaw] = await Promise.all([
        API.get('/manutencao/preventiva?tipo=utilidades').catch(() => []),
        API.get('/manutencao/equipamentos').catch(() => []),
      ]);

      const planos = Array.isArray(planosRaw) ? planosRaw : (planosRaw.data || []);
      const equips = Array.isArray(equipsRaw) ? equipsRaw : (equipsRaw.data || []);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      function dateColor(d) {
        if (!d) return 'var(--muted)';
        const dt = new Date(d);
        if (dt < hoje) return 'var(--danger)';
        const em7 = new Date(hoje);
        em7.setDate(em7.getDate() + 7);
        if (dt <= em7) return 'var(--warning)';
        return 'var(--success)';
      }

      const equipOptsHtml = `<option value="">— Selecione o equipamento —</option>` +
        equips.map(e => `<option value="${escapeHtml(String(e.id))}">${escapeHtml(e.nome || '')}</option>`).join('');

      bodyEl.innerHTML = `
        <section style="margin-bottom:24px;">
          <h4 style="margin-bottom:12px;font-size:14px;font-weight:700;text-transform:uppercase;color:var(--muted);">Planos de Utilidades</h4>
          ${planos.length === 0 ? _empty() : `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Título</th>
                  <th>Frequência</th>
                  <th>Próxima Data</th>
                  <th>Responsável</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${planos.map(p => `
                  <tr>
                    <td>${escapeHtml(p.equipamento_nome || '—')}</td>
                    <td>${escapeHtml(p.titulo || '—')}</td>
                    <td>${escapeHtml(p.frequencia_tipo || '—')}</td>
                    <td style="color:${dateColor(p.proxima_data)}">${_fmtDate(p.proxima_data)}</td>
                    <td>${escapeHtml(p.responsavel_nome || '—')}</td>
                    <td>
                      <button class="btn btn-sm btn-success f12-exec-btn"
                        data-id="${escapeHtml(String(p.id))}">Executar</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </section>

        <section>
          <h4 style="margin-bottom:12px;font-size:14px;font-weight:700;text-transform:uppercase;color:var(--muted);">Criar Plano de Utilidade</h4>
          <form id="f12-form" novalidate>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Equipamento <span style="color:var(--danger)">*</span></label>
                <select class="form-control" id="f12-equip">${equipOptsHtml}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Título <span style="color:var(--danger)">*</span></label>
                <input class="form-control" id="f12-titulo" type="text" placeholder="Ex: Revisão compressor de ar">
              </div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Frequência</label>
                <select class="form-control" id="f12-freq">
                  <option value="diaria">Diária</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal" selected>Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Próxima Data <span style="color:var(--danger)">*</span></label>
                <input class="form-control" id="f12-proxima" type="date">
              </div>
              <div class="form-group">
                <label class="form-label">Responsável</label>
                <input class="form-control" id="f12-resp" type="text" placeholder="Nome ou matrícula">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-control" id="f12-desc" rows="2" placeholder="Procedimentos, pontos de verificação..."></textarea>
            </div>
            <div id="f12-error"></div>
            <button class="btn btn-primary" id="f12-submit" type="button">Criar Plano</button>
          </form>
        </section>`;

      // Executar buttons
      bodyEl.querySelectorAll('.f12-exec-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const pid = this.dataset.id;
          _withSubmit(this, async () => {
            try {
              await API.post('/manutencao/preventiva/' + pid + '/executar', {
                data_execucao: new Date().toISOString().slice(0, 10),
                executado_por: user.nome || '',
              });
              showToast('Plano executado com sucesso!', 'success');
              loadData();
            } catch (err) {
              showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
            }
          });
        });
      });

      // Create plan submit
      bodyEl.querySelector('#f12-submit').addEventListener('click', function () {
        const btn = this;
        const equip = bodyEl.querySelector('#f12-equip').value;
        const titulo = bodyEl.querySelector('#f12-titulo').value.trim();
        const proxima = bodyEl.querySelector('#f12-proxima').value;
        const errDiv = bodyEl.querySelector('#f12-error');
        errDiv.innerHTML = '';
        if (!equip || !titulo || !proxima) {
          errDiv.innerHTML = '<div class="form-error">Informe equipamento, título e próxima data.</div>';
          return;
        }
        _withSubmit(btn, async () => {
          try {
            await API.post('/manutencao/preventiva', {
              equipamento_id: equip,
              titulo,
              tipo: 'utilidades',
              frequencia_tipo: bodyEl.querySelector('#f12-freq').value,
              proxima_data: proxima,
              responsavel: bodyEl.querySelector('#f12-resp').value.trim() || null,
              descricao: bodyEl.querySelector('#f12-desc').value.trim() || null,
            });
            showToast('Plano criado com sucesso!', 'success');
            loadData();
          } catch (err) {
            showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
          }
        });
      });

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar dados: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  loadData();
};

// ── f13 Gestão de Terceiros ───────────────────────────────────────────────────
ManutencaoForms.f13GestaoTerceiros = async function (user) {
  const { el, close } = openModal({
    title: 'Gestão de Terceiros (Prestadores de Serviço)',
    body: _spinner(),
    footer: `<button class="btn btn-secondary" id="f13-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f13-close').addEventListener('click', close);
  const bodyEl = el;

  async function loadData() {
    bodyEl.innerHTML = _spinner();
    try {
      const [osRaw, equipRaw] = await Promise.all([
        API.get('/manutencao/os?status=em_andamento').catch(() => []),
        API.get('/manutencao/equipamentos').catch(() => []),
      ]);

      const todasOs = Array.isArray(osRaw) ? osRaw : (osRaw.data || []);
      const equips = Array.isArray(equipRaw) ? equipRaw : (equipRaw.data || []);

      // Filter OS mentioning terceiros
      const osTerceiros = todasOs.filter(o => {
        const obs = (o.observacao_tecnico || o.descricao || '').toLowerCase();
        return obs.includes('terceiro') || obs.includes('terceirizado') || obs.includes('prestador') || obs.includes('empresa');
      });

      const equipOptsHtml = `<option value="">— Selecione o equipamento —</option>` +
        equips.map(e => `<option value="${escapeHtml(String(e.id))}">${escapeHtml(e.nome || '')}</option>`).join('');

      bodyEl.innerHTML = `
        <div class="tab-bar" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px;">
          <button class="btn btn-sm btn-primary f13-tab-btn" data-tab="contratos">Contratos Ativos</button>
          <button class="btn btn-sm btn-secondary f13-tab-btn" data-tab="registrar">Registrar Serviço Terceirizado</button>
        </div>

        <div id="f13-tab-contratos">
          ${osTerceiros.length === 0 ? `<div class="empty-state"><span class="empty-state-icon">📭</span><span class="empty-state-title">Nenhum serviço terceirizado ativo encontrado</span></div>` : `
          <div style="overflow-x:auto;">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Equipamento</th>
                  <th>Empresa / Prestador</th>
                  <th>Status</th>
                  <th>Data Previsão</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${osTerceiros.map(o => `
                  <tr>
                    <td><code>${escapeHtml(o.codigo || String(o.id))}</code></td>
                    <td>${escapeHtml(o.equipamento_nome || '—')}</td>
                    <td>${escapeHtml(o.observacao_tecnico || o.descricao || '—')}</td>
                    <td>${_badge(o.status)}</td>
                    <td>${_fmtDate(o.data_previsao)}</td>
                    <td>
                      <button class="btn btn-sm btn-primary f13-atualizar-btn"
                        data-id="${escapeHtml(String(o.id))}"
                        data-codigo="${escapeHtml(o.codigo || String(o.id))}">Atualizar</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>

        <div id="f13-tab-registrar" style="display:none;">
          <form id="f13-form" novalidate>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Equipamento <span style="color:var(--danger)">*</span></label>
                <select class="form-control" id="f13-equip">${equipOptsHtml}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Empresa Prestadora <span style="color:var(--danger)">*</span></label>
                <input class="form-control" id="f13-empresa" type="text" placeholder="Nome da empresa ou prestador">
              </div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Prioridade</label>
                <select class="form-control" id="f13-prioridade">
                  <option value="baixa">Baixa</option>
                  <option value="media" selected>Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Responsável Interno</label>
                <input class="form-control" id="f13-resp-interno" type="text"
                  value="${escapeHtml(user.nome || '')}" placeholder="Nome do responsável interno">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição do Serviço <span style="color:var(--danger)">*</span></label>
              <textarea class="form-control" id="f13-desc" rows="3"
                placeholder="Descreva o serviço a ser realizado..."></textarea>
            </div>
            <div id="f13-error"></div>
            <button class="btn btn-primary" id="f13-submit" type="button">Registrar OS Terceirizada</button>
          </form>
        </div>`;

      // Tab switching
      bodyEl.querySelectorAll('.f13-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bodyEl.querySelectorAll('.f13-tab-btn').forEach(b => b.className = 'btn btn-sm btn-secondary f13-tab-btn');
          btn.className = 'btn btn-sm btn-primary f13-tab-btn';
          bodyEl.querySelector('#f13-tab-contratos').style.display = btn.dataset.tab === 'contratos' ? '' : 'none';
          bodyEl.querySelector('#f13-tab-registrar').style.display = btn.dataset.tab === 'registrar' ? '' : 'none';
        });
      });

      // Atualizar OS buttons
      bodyEl.querySelectorAll('.f13-atualizar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const osId = btn.dataset.id;
          const osCodigo = btn.dataset.codigo;

          const { el: subEl, close: subClose } = openModal({
            title: `Atualizar OS ${escapeHtml(osCodigo)}`,
            body: `
              <form id="f13-sub-form" novalidate>
                <div class="form-group">
                  <label class="form-label">Novo Status</label>
                  <select class="form-control" id="f13-sub-status">
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_peca">Aguardando Peça</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Observação Técnica</label>
                  <textarea class="form-control" id="f13-sub-obs" rows="3"
                    placeholder="Atualização do serviço, prazo revisado..."></textarea>
                </div>
                <div id="f13-sub-error"></div>
              </form>`,
            footer: `
              <button class="btn btn-secondary" id="f13-sub-cancel">Cancelar</button>
              <button class="btn btn-primary" id="f13-sub-submit">Atualizar</button>`,
            size: 'sm',
          });

          subEl.querySelector('#f13-sub-cancel').addEventListener('click', subClose);
          subEl.querySelector('#f13-sub-submit').addEventListener('click', function () {
            _withSubmit(this, async () => {
              try {
                await API.put('/manutencao/os/' + osId + '/status', {
                  status: subEl.querySelector('#f13-sub-status').value,
                  observacao_tecnico: subEl.querySelector('#f13-sub-obs').value.trim() || null,
                });
                showToast('OS atualizada com sucesso!', 'success');
                subClose();
                loadData();
              } catch (err) {
                showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
              }
            });
          });
        });
      });

      // Register terceirizada OS
      const f13Submit = bodyEl.querySelector('#f13-submit');
      if (f13Submit) {
        f13Submit.addEventListener('click', function () {
          const btn = this;
          const equip = bodyEl.querySelector('#f13-equip').value;
          const empresa = bodyEl.querySelector('#f13-empresa').value.trim();
          const desc = bodyEl.querySelector('#f13-desc').value.trim();
          const errDiv = bodyEl.querySelector('#f13-error');
          errDiv.innerHTML = '';

          if (!equip || !empresa || !desc) {
            errDiv.innerHTML = '<div class="form-error">Informe equipamento, empresa prestadora e descrição.</div>';
            return;
          }
          _withSubmit(btn, async () => {
            try {
              await API.post('/manutencao/os', {
                equipamento_id: equip,
                tipo: 'corretiva',
                prioridade: bodyEl.querySelector('#f13-prioridade').value,
                descricao: `Serviço terceirizado: ${empresa}. ${desc}`,
                responsavel_id: user.id || null,
              });
              showToast('OS terceirizada registrada com sucesso!', 'success');
              bodyEl.querySelector('#f13-form').reset();
              loadData();
            } catch (err) {
              showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
            }
          });
        });
      }

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar dados: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  loadData();
};

// ── f14 Indicadores MTBF/MTTR/OEE ────────────────────────────────────────────
ManutencaoForms.f14IndicadoresMTBF = async function (user) {
  const { el, close } = openModal({
    title: 'Indicadores MTBF / MTTR / OEE',
    body: _spinner(),
    footer: `<button class="btn btn-secondary" id="f14-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f14-close').addEventListener('click', close);
  const bodyEl = el;

  async function loadIndicadores(periodo) {
    bodyEl.innerHTML = _spinner();
    try {
      const data = await API.get('/manutencao/indicadores');
      const ind = data && typeof data === 'object' ? data : {};

      const mtbf = ind.mtbf != null ? Number(ind.mtbf).toFixed(1) + ' dias' : '—';
      const mttr = ind.mttr != null ? Number(ind.mttr).toFixed(1) + ' horas' : '—';
      const oee  = ind.oee  != null ? Number(ind.oee).toFixed(1) + '%' : '—';

      // Chart helpers
      function bar(value, max, color) {
        const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
        return `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <div style="width:${pct}%;background:${color};height:18px;border-radius:4px;min-width:4px;transition:width .3s;"></div>
            <span style="font-size:12px;color:var(--text-muted);white-space:nowrap;">${value}</span>
          </div>`;
      }

      const osTipo = {};
      (ind.porTipo || []).forEach(r => { osTipo[r.tipo] = Number(r.total); });
      const osPrio = {};
      (ind.porPrioridade || []).forEach(r => { osPrio[r.prioridade] = Number(r.total); });
      const osMes = {};
      (ind.porMes || []).forEach(r => { osMes[r.mes] = Number(r.total); });

      const maxTipo = Math.max(1, ...Object.values(osTipo).map(Number));
      const maxPrio = Math.max(1, ...Object.values(osPrio).map(Number));
      const maxMes  = Math.max(1, ...Object.values(osMes).map(Number));

      const tiposColors = { corretiva: '#ef4444', preventiva: '#3b82f6', preditiva: '#8b5cf6', emergencial: '#f97316' };
      const prioColors  = { critica: '#ef4444', alta: '#f97316', media: '#eab308', baixa: '#22c55e' };

      const mesesKeys = Object.keys(osMes).slice(-6);

      bodyEl.innerHTML = `
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:13px;color:var(--muted);">Período:</span>
          <button class="btn btn-sm ${periodo === '1m' ? 'btn-primary' : 'btn-secondary'} f14-period" data-p="1m">Este mês</button>
          <button class="btn btn-sm ${periodo === '3m' ? 'btn-primary' : 'btn-secondary'} f14-period" data-p="3m">Últimos 3 meses</button>
          <button class="btn btn-sm ${periodo === '6m' ? 'btn-primary' : 'btn-secondary'} f14-period" data-p="6m">Últimos 6 meses</button>
        </div>

        <!-- KPI Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
          <div class="card" style="padding:16px;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--muted);letter-spacing:.5px;margin-bottom:4px;">MTBF</div>
            <div style="font-size:28px;font-weight:700;color:var(--primary);">${escapeHtml(mtbf)}</div>
            <div style="font-size:11px;color:var(--muted);">Tempo médio entre falhas</div>
          </div>
          <div class="card" style="padding:16px;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--muted);letter-spacing:.5px;margin-bottom:4px;">MTTR</div>
            <div style="font-size:28px;font-weight:700;color:var(--warning);">${escapeHtml(mttr)}</div>
            <div style="font-size:11px;color:var(--muted);">Tempo médio de reparo</div>
          </div>
          <div class="card" style="padding:16px;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--muted);letter-spacing:.5px;margin-bottom:4px;">OEE</div>
            <div style="font-size:28px;font-weight:700;color:var(--success);">${escapeHtml(oee)}</div>
            <div style="font-size:11px;color:var(--muted);">Eficiência global dos equipamentos</div>
          </div>
        </div>

        <!-- Charts -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div class="card" style="padding:16px;">
            <h5 style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text);">OS por Tipo</h5>
            ${['corretiva','preventiva','preditiva','emergencial'].map(t => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px;margin-bottom:3px;color:var(--text);">${escapeHtml(t.charAt(0).toUpperCase() + t.slice(1))}</div>
                ${bar(osTipo[t] || 0, maxTipo, tiposColors[t] || '#64748b')}
              </div>`).join('')}
          </div>
          <div class="card" style="padding:16px;">
            <h5 style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text);">OS por Prioridade</h5>
            ${['critica','alta','media','baixa'].map(p => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px;margin-bottom:3px;color:var(--text);">${escapeHtml(p.charAt(0).toUpperCase() + p.slice(1))}</div>
                ${bar(osPrio[p] || 0, maxPrio, prioColors[p] || '#64748b')}
              </div>`).join('')}
          </div>
        </div>

        <div class="card" style="padding:16px;">
          <h5 style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text);">OS por Mês (últimos 6 meses)</h5>
          <div style="display:flex;align-items:flex-end;gap:8px;height:80px;">
            ${mesesKeys.length === 0
              ? '<span style="color:var(--muted);font-size:13px;">Sem dados</span>'
              : mesesKeys.map(mes => {
                  const val = osMes[mes] || 0;
                  const pct = maxMes > 0 ? Math.round((val / maxMes) * 70) : 0;
                  return `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
                      <span style="font-size:11px;color:var(--muted);">${val}</span>
                      <div style="height:${pct}px;background:#3b82f6;border-radius:4px 4px 0 0;width:100%;min-height:4px;"></div>
                      <span style="font-size:10px;color:var(--muted);">${escapeHtml(mes)}</span>
                    </div>`;
                }).join('')}
          </div>
        </div>`;

      // Period selector
      bodyEl.querySelectorAll('.f14-period').forEach(btn => {
        btn.addEventListener('click', () => loadIndicadores(btn.dataset.p));
      });

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar indicadores: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  loadIndicadores('1m');
};

// ── f15 Gerenciar Escala de Manutenção ────────────────────────────────────────
ManutencaoForms.f15GerenciarEscalaManutencao = async function (user) {
  const now = new Date();
  let mesSel = now.getMonth() + 1;
  let anoSel = now.getFullYear();

  const podeEditar = (user.nivel_acesso || 0) >= 4;

  const { el, close } = openModal({
    title: 'Gerenciar Escala e Datas de Manutenção',
    body: _spinner(),
    footer: `
      ${podeEditar ? '<button class="btn btn-primary" id="f15-add-btn">+ Adicionar Escala</button>' : ''}
      <button class="btn btn-secondary" id="f15-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f15-close').addEventListener('click', close);
  const bodyEl = el;

  if (podeEditar) {
    el.querySelector('#f15-add-btn').addEventListener('click', () => abrirFormEscala());
  }

  async function loadData() {
    bodyEl.innerHTML = _spinner();
    const mes2 = String(mesSel).padStart(2, '0');
    try {
      const [escalasRaw, prevRaw] = await Promise.all([
        API.get(`/manutencao/escalas?mes=${mes2}&ano=${anoSel}`).catch(() => []),
        API.get('/manutencao/preventiva').catch(() => []),
      ]);

      const escalas = Array.isArray(escalasRaw) ? escalasRaw : (escalasRaw.data || []);
      const prevAll = Array.isArray(prevRaw) ? prevRaw : (prevRaw.data || []);

      // Filter preventiva for this month
      const prevMes = prevAll.filter(p => {
        if (!p.proxima_data) return false;
        const d = new Date(p.proxima_data);
        return d.getMonth() + 1 === mesSel && d.getFullYear() === anoSel;
      });

      const turnoBadge = t => {
        const m = { manha: 'success', tarde: 'info', noite: 'warning', integral: 'primary' };
        return `<span class="badge badge-${m[t] || 'muted'}">${escapeHtml(t || '—')}</span>`;
      };
      const tipoBadge = t => {
        const m = { plantao: 'danger', normal: 'success', ferias: 'info', folga: 'muted' };
        return `<span class="badge badge-${m[t] || 'muted'}">${escapeHtml(t || '—')}</span>`;
      };

      bodyEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <button class="btn btn-sm btn-secondary" id="f15-prev-mes">◀</button>
          <strong id="f15-mes-label" style="min-width:120px;text-align:center;">
            ${escapeHtml(new Date(anoSel, mesSel - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}
          </strong>
          <button class="btn btn-sm btn-secondary" id="f15-next-mes">▶</button>
        </div>

        <h5 style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--muted);text-transform:uppercase;">Escala do mês</h5>
        ${escalas.length === 0 ? _empty() : `
        <div style="overflow-x:auto;margin-bottom:20px;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Data Início</th>
                <th>Data Fim</th>
                <th>Turno</th>
                <th>Tipo</th>
                <th>Observações</th>
                ${podeEditar ? '<th>Ação</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${escalas.map(e => `
                <tr>
                  <td>${escapeHtml(e.usuario_nome || e.tecnico_nome || '—')}</td>
                  <td>${_fmtDate(e.data_inicio)}</td>
                  <td>${_fmtDate(e.data_fim)}</td>
                  <td>${turnoBadge(e.turno)}</td>
                  <td>${tipoBadge(e.tipo)}</td>
                  <td>${escapeHtml(e.observacoes || '—')}</td>
                  ${podeEditar ? `<td>
                    <button class="btn btn-sm btn-danger f15-del-btn" data-id="${escapeHtml(String(e.id))}">🗑</button>
                  </td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}

        <h5 style="font-size:13px;font-weight:700;margin:16px 0 8px;color:var(--muted);text-transform:uppercase;">Preventivas programadas no mês</h5>
        ${prevMes.length === 0 ? '<div style="color:var(--muted);font-size:13px;padding:8px 0;">Nenhuma preventiva programada.</div>' : `
        <div style="overflow-x:auto;">
          <table class="table">
            <thead>
              <tr><th>Equipamento</th><th>Título</th><th>Data</th><th>Responsável</th></tr>
            </thead>
            <tbody>
              ${prevMes.map(p => `
                <tr>
                  <td>${escapeHtml(p.equipamento_nome || '—')}</td>
                  <td>${escapeHtml(p.titulo || '—')}</td>
                  <td>${_fmtDate(p.proxima_data)}</td>
                  <td>${escapeHtml(p.responsavel_nome || '—')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}`;

      bodyEl.querySelector('#f15-prev-mes').addEventListener('click', () => {
        mesSel--;
        if (mesSel < 1) { mesSel = 12; anoSel--; }
        loadData();
      });
      bodyEl.querySelector('#f15-next-mes').addEventListener('click', () => {
        mesSel++;
        if (mesSel > 12) { mesSel = 1; anoSel++; }
        loadData();
      });

      if (podeEditar) {
        bodyEl.querySelectorAll('.f15-del-btn').forEach(btn => {
          btn.addEventListener('click', async function () {
            if (!confirm('Remover este registro da escala?')) return;
            try {
              await API.delete('/manutencao/escalas/' + this.dataset.id);
              showToast('Registro removido.', 'success');
              loadData();
            } catch (err) {
              showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
            }
          });
        });
      }

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar escala: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  function abrirFormEscala() {
    const iniDate = `${anoSel}-${String(mesSel).padStart(2, '0')}-01`;

    const { el: subEl, close: subClose } = openModal({
      title: 'Adicionar Escala',
      body: `
        <form id="f15-sub-form" novalidate>
          <div class="form-group">
            <label class="form-label">Técnico / Usuário <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f15-sub-tecnico" type="text" placeholder="Nome do técnico">
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Data Início <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f15-sub-ini" type="date" value="${iniDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Data Fim <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f15-sub-fim" type="date">
            </div>
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Turno</label>
              <select class="form-control" id="f15-sub-turno">
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
                <option value="integral">Integral</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-control" id="f15-sub-tipo">
                <option value="normal" selected>Normal</option>
                <option value="plantao">Plantão</option>
                <option value="ferias">Férias</option>
                <option value="folga">Folga</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Observações</label>
            <input class="form-control" id="f15-sub-obs" type="text" placeholder="Observações opcionais">
          </div>
          <div id="f15-sub-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f15-sub-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f15-sub-submit">Salvar</button>`,
      size: 'sm',
    });

    subEl.querySelector('#f15-sub-cancel').addEventListener('click', subClose);
    subEl.querySelector('#f15-sub-submit').addEventListener('click', function () {
      const btn = this;
      const tecnico = subEl.querySelector('#f15-sub-tecnico').value.trim();
      const ini = subEl.querySelector('#f15-sub-ini').value;
      const fim = subEl.querySelector('#f15-sub-fim').value;
      const errDiv = subEl.querySelector('#f15-sub-error');
      errDiv.innerHTML = '';

      if (!tecnico || !ini || !fim) {
        errDiv.innerHTML = '<div class="form-error">Informe técnico, data início e data fim.</div>';
        return;
      }
      _withSubmit(btn, async () => {
        try {
          await API.post('/manutencao/escalas', {
            tecnico_nome: tecnico,
            data_inicio: ini,
            data_fim: fim,
            turno: subEl.querySelector('#f15-sub-turno').value,
            tipo: subEl.querySelector('#f15-sub-tipo').value,
            observacoes: subEl.querySelector('#f15-sub-obs').value.trim() || null,
          });
          showToast('Escala adicionada com sucesso!', 'success');
          subClose();
          loadData();
        } catch (err) {
          showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
        }
      });
    });
  }

  loadData();
};

// ── f16 Pendências de Auditoria ───────────────────────────────────────────────
ManutencaoForms.f16PendenciasAuditoria = async function (user) {
  const { el, close } = openModal({
    title: 'Visualizar Pendências de Auditoria',
    body: _spinner(),
    footer: `
      <button class="btn btn-secondary" id="f16-refresh">↻ Atualizar</button>
      <button class="btn btn-secondary" id="f16-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f16-close').addEventListener('click', close);
  const bodyEl = el;

  async function loadData() {
    bodyEl.innerHTML = _spinner();
    try {
      const [abertas, emAnd] = await Promise.all([
        API.get('/manutencao/os?status=aberta').catch(() => []),
        API.get('/manutencao/os?status=em_andamento').catch(() => []),
      ]);

      const todasList = [
        ...(Array.isArray(abertas) ? abertas : (abertas.data || [])),
        ...(Array.isArray(emAnd) ? emAnd : (emAnd.data || [])),
      ];

      // Deduplicate by id
      const seen = new Set();
      const todas = todasList.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });

      const now = Date.now();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Compute enriched items
      const items = todas.map(o => {
        const dataAbertura = o.data_abertura || o.created_at || null;
        const diasAberto = dataAbertura
          ? Math.max(0, Math.floor((now - new Date(dataAbertura).getTime()) / 86400000))
          : null;
        const vencida = o.data_previsao && new Date(o.data_previsao) < hoje &&
          !['concluida', 'cancelada'].includes(o.status);
        return { ...o, diasAberto, vencida };
      });

      // Sort: vencidas first, then by diasAberto desc
      items.sort((a, b) => {
        if (a.vencida && !b.vencida) return -1;
        if (!a.vencida && b.vencida) return 1;
        return (b.diasAberto || 0) - (a.diasAberto || 0);
      });

      const totalPendencias = items.length;
      const criticas = items.filter(o => o.prioridade === 'critica').length;
      const emAtraso = items.filter(o => o.vencida).length;

      bodyEl.innerHTML = `
        <!-- Summary bar -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
          <div style="background:var(--surface-2,#1e293b);border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--text);">${totalPendencias}</div>
            <div style="font-size:12px;color:var(--muted);">Total de Pendências</div>
          </div>
          <div style="background:var(--surface-2,#1e293b);border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--danger);">${criticas}</div>
            <div style="font-size:12px;color:var(--muted);">Críticas</div>
          </div>
          <div style="background:var(--surface-2,#1e293b);border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:var(--warning);">${emAtraso}</div>
            <div style="font-size:12px;color:var(--muted);">Em Atraso</div>
          </div>
        </div>

        ${items.length === 0 ? _empty() : `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Código</th>
                <th>Equipamento</th>
                <th>Tipo Pendência</th>
                <th>Prioridade</th>
                <th>Dias em Aberto</th>
                <th>Data Prevista</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(o => `
                <tr style="${o.vencida ? 'background:rgba(239,68,68,0.08);' : ''}">
                  <td><code>${escapeHtml(o.codigo || String(o.id))}</code></td>
                  <td>${escapeHtml(o.equipamento_nome || '—')}</td>
                  <td>${escapeHtml(o.tipo || '—')}</td>
                  <td>${_prioridadeBadge(o.prioridade)}</td>
                  <td>${o.diasAberto != null ? escapeHtml(String(o.diasAberto)) + ' dias' : '—'}</td>
                  <td style="color:${o.vencida ? 'var(--danger)' : 'inherit'}">${_fmtDate(o.data_previsao)}</td>
                  <td>${_badge(o.status)}</td>
                  <td>
                    <button class="btn btn-sm btn-primary f16-atualizar-btn"
                      data-id="${escapeHtml(String(o.id))}"
                      data-codigo="${escapeHtml(o.codigo || String(o.id))}">
                      Atualizar
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}`;

      // Atualizar status buttons
      bodyEl.querySelectorAll('.f16-atualizar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const osId = btn.dataset.id;
          const osCodigo = btn.dataset.codigo;

          const { el: subEl, close: subClose } = openModal({
            title: `Atualizar Status — OS ${escapeHtml(osCodigo)}`,
            body: `
              <form id="f16-sub-form" novalidate>
                <div class="form-group">
                  <label class="form-label">Novo Status <span style="color:var(--danger)">*</span></label>
                  <select class="form-control" id="f16-sub-status">
                    <option value="aberta">Aberta</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_peca">Aguardando Peça</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Observação</label>
                  <textarea class="form-control" id="f16-sub-obs" rows="3"
                    placeholder="Justificativa ou observação da atualização..."></textarea>
                </div>
                <div id="f16-sub-error"></div>
              </form>`,
            footer: `
              <button class="btn btn-secondary" id="f16-sub-cancel">Cancelar</button>
              <button class="btn btn-primary" id="f16-sub-submit">Atualizar</button>`,
            size: 'sm',
          });

          subEl.querySelector('#f16-sub-cancel').addEventListener('click', subClose);
          subEl.querySelector('#f16-sub-submit').addEventListener('click', function () {
            _withSubmit(this, async () => {
              try {
                await API.put('/manutencao/os/' + osId + '/status', {
                  status: subEl.querySelector('#f16-sub-status').value,
                  observacao_tecnico: subEl.querySelector('#f16-sub-obs').value.trim() || null,
                });
                showToast('Status atualizado com sucesso!', 'success');
                subClose();
                loadData();
              } catch (err) {
                showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
              }
            });
          });
        });
      });

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar pendências: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  el.querySelector('#f16-refresh').addEventListener('click', loadData);
  loadData();
};

// ── f17 Monitoramento Sala Fria ───────────────────────────────────────────────
ManutencaoForms.f17MonitoramentoSalaFria = async function (user) {
  const PONTOS_FRIOS = [
    { key: 'camara_fria_1',       label: 'Câmara Fria 1',          alertTemp: 4,  critTemp: 8  },
    { key: 'camara_fria_2',       label: 'Câmara Fria 2',          alertTemp: 4,  critTemp: 8  },
    { key: 'sala_processamento',  label: 'Sala de Processamento',  alertTemp: 10, critTemp: 15 },
    { key: 'sala_envase',         label: 'Sala de Envase',         alertTemp: 10, critTemp: 15 },
    { key: 'antecamara',          label: 'Antecâmara',             alertTemp: 8,  critTemp: 12 },
  ];

  const { el, close } = openModal({
    title: 'Monitoramento da Sala Fria',
    body: _spinner(),
    footer: `
      <button class="btn btn-primary" id="f17-nova-btn">+ Registrar Leitura</button>
      <button class="btn btn-secondary" id="f17-refresh">↻ Atualizar</button>
      <button class="btn btn-secondary" id="f17-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f17-close').addEventListener('click', close);
  el.querySelector('#f17-refresh').addEventListener('click', loadData);
  el.querySelector('#f17-nova-btn').addEventListener('click', abrirFormLeitura);

  const bodyEl = el;

  async function loadData() {
    bodyEl.innerHTML = _spinner();
    try {
      const raw = await API.get('/manutencao/medidores?tipo=outro');
      const todas = Array.isArray(raw) ? raw : (raw.data || []);

      // Filter to only cold room points
      const pontosKeys = PONTOS_FRIOS.map(p => p.key);
      const leituras = todas.filter(m =>
        pontosKeys.some(k => (m.ponto || '').toLowerCase().includes(k.replace(/_/g, ' ')) ||
          (m.ponto || '').toLowerCase().includes(k))
      );

      // Group by ponto and find latest reading per point
      const porPonto = {};
      leituras.forEach(m => {
        const key = (m.ponto || '').toLowerCase().replace(/\s+/g, '_');
        if (!porPonto[key]) porPonto[key] = [];
        porPonto[key].push(m);
      });

      // Sort each group by date desc
      Object.values(porPonto).forEach(arr => arr.sort((a, b) =>
        new Date(b.data_leitura || b.criado_em || 0) - new Date(a.data_leitura || a.criado_em || 0)
      ));

      function tempStatus(temp, cfg) {
        if (temp == null) return { cls: 'muted', label: 'Sem dados' };
        if (temp >= cfg.critTemp) return { cls: 'danger', label: 'Crítico' };
        if (temp >= cfg.alertTemp) return { cls: 'warning', label: 'Alerta' };
        return { cls: 'success', label: 'OK' };
      }

      // Cards
      const cardsHtml = PONTOS_FRIOS.map(cfg => {
        const readings = porPonto[cfg.key] || [];
        const latest = readings[0];
        const temp = latest ? Number(latest.leitura) : null;
        const st = tempStatus(temp, cfg);
        return `
          <div class="card" style="padding:14px;text-align:center;border-top:3px solid var(--${st.cls});">
            <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">${escapeHtml(cfg.label)}</div>
            <div style="font-size:32px;font-weight:700;color:var(--${st.cls});">
              ${temp != null ? escapeHtml(temp.toFixed(1)) + '°C' : '—'}
            </div>
            <div><span class="badge badge-${st.cls}">${st.label}</span></div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;">${_fmtDateTime(latest && (latest.data_leitura || latest.criado_em))}</div>
            <div style="font-size:10px;color:var(--muted);">Alerta: ≥${cfg.alertTemp}°C | Crítico: ≥${cfg.critTemp}°C</div>
          </div>`;
      }).join('');

      // Last 20 readings table (all combined, sorted by date)
      const ultimas20 = [...leituras]
        .sort((a, b) => new Date(b.data_leitura || b.criado_em || 0) - new Date(a.data_leitura || a.criado_em || 0))
        .slice(0, 20);

      bodyEl.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
          ${cardsHtml}
        </div>

        <h5 style="font-size:13px;font-weight:700;margin-bottom:8px;text-transform:uppercase;color:var(--muted);">Últimas 20 leituras</h5>
        ${ultimas20.length === 0 ? _empty() : `
        <div style="overflow-x:auto;">
          <table class="table table-hover">
            <thead>
              <tr><th>Ponto</th><th>Temperatura</th><th>Data/Hora</th><th>Usuário</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${ultimas20.map(m => {
                const cfgPonto = PONTOS_FRIOS.find(p =>
                  (m.ponto || '').toLowerCase().includes(p.key.replace(/_/g, ' ')) ||
                  (m.ponto || '').toLowerCase().includes(p.key)
                ) || { alertTemp: 4, critTemp: 8 };
                const temp = Number(m.leitura);
                const st = tempStatus(temp, cfgPonto);
                return `
                  <tr>
                    <td>${escapeHtml(m.ponto || '—')}</td>
                    <td style="color:var(--${st.cls})">${escapeHtml(String(temp.toFixed(1)))}°C</td>
                    <td>${_fmtDateTime(m.data_leitura || m.criado_em)}</td>
                    <td>${escapeHtml(m.usuario_nome || '—')}</td>
                    <td><span class="badge badge-${st.cls}">${st.label}</span></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`}`;

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar dados: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  function abrirFormLeitura() {
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const pontosOpts = PONTOS_FRIOS.map(p =>
      `<option value="${escapeHtml(p.key)}">${escapeHtml(p.label)}</option>`
    ).join('');

    const { el: subEl, close: subClose } = openModal({
      title: 'Registrar Leitura de Temperatura',
      body: `
        <form id="f17-sub-form" novalidate>
          <div class="form-group">
            <label class="form-label">Ponto de Monitoramento <span style="color:var(--danger)">*</span></label>
            <select class="form-control" id="f17-sub-ponto">
              <option value="">— Selecione —</option>
              ${pontosOpts}
            </select>
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Temperatura (°C) <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f17-sub-temp" type="number" step="0.1" placeholder="Ex: 2.5">
            </div>
            <div class="form-group">
              <label class="form-label">Data/Hora <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f17-sub-data" type="datetime-local" value="${nowLocal}">
            </div>
          </div>
          <div id="f17-sub-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f17-sub-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f17-sub-submit">Registrar</button>`,
      size: 'sm',
    });

    subEl.querySelector('#f17-sub-cancel').addEventListener('click', subClose);
    subEl.querySelector('#f17-sub-submit').addEventListener('click', function () {
      const btn = this;
      const ponto = subEl.querySelector('#f17-sub-ponto').value;
      const temp = subEl.querySelector('#f17-sub-temp').value;
      const data = subEl.querySelector('#f17-sub-data').value;
      const errDiv = subEl.querySelector('#f17-sub-error');
      errDiv.innerHTML = '';

      if (!ponto || temp === '' || !data) {
        errDiv.innerHTML = '<div class="form-error">Informe ponto, temperatura e data/hora.</div>';
        return;
      }
      _withSubmit(btn, async () => {
        try {
          const pontoLabel = PONTOS_FRIOS.find(p => p.key === ponto)?.label || ponto;
          await API.post('/manutencao/medidores', {
            tipo: 'outro',
            ponto: pontoLabel,
            leitura: Number(temp),
            unidade: '°C',
            data_leitura: data.slice(0, 10),
            usuario_id: user.id || null,
          });
          showToast('Leitura registrada com sucesso!', 'success');
          subClose();
          loadData();
        } catch (err) {
          showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
        }
      });
    });
  }

  loadData();
};

// ── f18 Leitura de Hidrômetros e Medidores ────────────────────────────────────
ManutencaoForms.f18LeituraHidrometros = async function (user) {
  const TIPOS_MEDIDORES = [
    { key: 'agua',    label: 'Água',    unidade: 'm³',  color: '#3b82f6' },
    { key: 'energia', label: 'Energia', unidade: 'kWh', color: '#f59e0b' },
    { key: 'gas',     label: 'Gás',     unidade: 'm³',  color: '#ef4444' },
    { key: 'vapor',   label: 'Vapor',   unidade: 'kg',  color: '#8b5cf6' },
  ];

  let tipoAtivo = 'agua';

  const { el, close } = openModal({
    title: 'Leitura de Hidrômetros e Medidores',
    body: _spinner(),
    footer: `<button class="btn btn-secondary" id="f18-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f18-close').addEventListener('click', close);
  const bodyEl = el;

  async function loadData() {
    const nowDate = new Date().toISOString().slice(0, 10);
    const tipoInfo = TIPOS_MEDIDORES.find(t => t.key === tipoAtivo) || TIPOS_MEDIDORES[0];

    try {
      const raw = await API.get(`/manutencao/medidores?tipo=${tipoAtivo}`);
      const todas = Array.isArray(raw) ? raw : (raw.data || []);

      // Sort by date desc
      todas.sort((a, b) => new Date(b.data_leitura || b.criado_em || 0) - new Date(a.data_leitura || a.criado_em || 0));

      // Compute consumption per ponto (current - previous)
      const porPonto = {};
      todas.forEach(m => {
        const p = m.ponto || 'Geral';
        if (!porPonto[p]) porPonto[p] = [];
        porPonto[p].push(m);
      });

      // Build consumption map (current - prev for same ponto)
      const consumoMap = new Map();
      Object.entries(porPonto).forEach(([ponto, arr]) => {
        arr.sort((a, b) => new Date(b.data_leitura || b.criado_em || 0) - new Date(a.data_leitura || a.criado_em || 0));
        for (let i = 0; i < arr.length; i++) {
          const curr = Number(arr[i].leitura);
          const prev = i + 1 < arr.length ? Number(arr[i + 1].leitura) : null;
          consumoMap.set(arr[i].id, prev != null ? (curr - prev) : null);
        }
      });

      const tabsHtml = TIPOS_MEDIDORES.map(t => `
        <button class="btn btn-sm ${t.key === tipoAtivo ? 'btn-primary' : 'btn-secondary'} f18-tab-btn"
          data-tipo="${escapeHtml(t.key)}">${escapeHtml(t.label)}</button>`).join('');

      // Summary: latest reading per ponto
      const summaryHtml = Object.entries(porPonto).map(([ponto, arr]) => {
        const latest = arr[0];
        const prev = arr[1];
        const consumo = prev ? (Number(latest.leitura) - Number(prev.leitura)) : null;
        return `
          <div style="background:var(--surface-2,#1e293b);border-radius:8px;padding:12px;border-left:3px solid ${tipoInfo.color};">
            <div style="font-size:11px;color:var(--muted);">${escapeHtml(ponto)}</div>
            <div style="font-size:20px;font-weight:700;">${escapeHtml(String(Number(latest.leitura).toFixed(1)))} ${escapeHtml(tipoInfo.unidade)}</div>
            ${consumo != null ? `<div style="font-size:12px;color:var(--muted);">Consumo: ${escapeHtml(consumo.toFixed(1))} ${escapeHtml(tipoInfo.unidade)}</div>` : ''}
            <div style="font-size:11px;color:var(--muted);">${_fmtDate(latest.data_leitura || latest.criado_em)}</div>
          </div>`;
      }).join('');

      bodyEl.innerHTML = `
        <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">${tabsHtml}</div>

        ${Object.keys(porPonto).length > 0 ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:20px;">
          ${summaryHtml}
        </div>` : ''}

        ${todas.length > 0 ? `
        <h5 style="font-size:13px;font-weight:700;margin-bottom:8px;text-transform:uppercase;color:var(--muted);">Histórico</h5>
        <div style="overflow-x:auto;margin-bottom:20px;">
          <table class="table table-hover">
            <thead>
              <tr><th>Data</th><th>Ponto</th><th>Leitura</th><th>Consumo</th><th>Usuário</th></tr>
            </thead>
            <tbody>
              ${todas.slice(0, 50).map(m => {
                const consumo = consumoMap.get(m.id);
                return `
                  <tr>
                    <td>${_fmtDate(m.data_leitura || m.criado_em)}</td>
                    <td>${escapeHtml(m.ponto || '—')}</td>
                    <td>${escapeHtml(String(Number(m.leitura).toFixed(2)))} ${escapeHtml(m.unidade || tipoInfo.unidade)}</td>
                    <td>${consumo != null ? escapeHtml(consumo.toFixed(2)) + ' ' + escapeHtml(tipoInfo.unidade) : '—'}</td>
                    <td>${escapeHtml(m.usuario_nome || '—')}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : _empty()}

        <h5 style="font-size:13px;font-weight:700;margin-bottom:12px;text-transform:uppercase;color:var(--muted);">Registrar Nova Leitura</h5>
        <form id="f18-form" novalidate>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Tipo <span style="color:var(--danger)">*</span></label>
              <select class="form-control" id="f18-tipo">
                ${TIPOS_MEDIDORES.map(t => `<option value="${escapeHtml(t.key)}" ${t.key === tipoAtivo ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ponto <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f18-ponto" type="text" placeholder="Ex: Hidrômetro Principal">
            </div>
            <div class="form-group">
              <label class="form-label">Leitura <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f18-leitura" type="number" step="0.01" placeholder="Valor medido">
            </div>
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Unidade</label>
              <input class="form-control" id="f18-unidade" type="text" value="${escapeHtml(tipoInfo.unidade)}" placeholder="m³, kWh, kg...">
            </div>
            <div class="form-group">
              <label class="form-label">Data</label>
              <input class="form-control" id="f18-data" type="date" value="${nowDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Observações</label>
              <input class="form-control" id="f18-obs" type="text" placeholder="Opcional">
            </div>
          </div>
          <div id="f18-error"></div>
          <button class="btn btn-primary" id="f18-submit" type="button">Registrar Leitura</button>
        </form>`;

      // Tab switching
      bodyEl.querySelectorAll('.f18-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          tipoAtivo = btn.dataset.tipo;
          loadData();
        });
      });

      // Update unidade default when tipo changes
      const tipoSel = bodyEl.querySelector('#f18-tipo');
      const unidadeInput = bodyEl.querySelector('#f18-unidade');
      if (tipoSel && unidadeInput) {
        tipoSel.addEventListener('change', () => {
          const t = TIPOS_MEDIDORES.find(x => x.key === tipoSel.value);
          if (t) unidadeInput.value = t.unidade;
        });
      }

      // Submit
      const f18Submit = bodyEl.querySelector('#f18-submit');
      if (f18Submit) {
        f18Submit.addEventListener('click', function () {
          const btn = this;
          const tipo = bodyEl.querySelector('#f18-tipo').value;
          const ponto = bodyEl.querySelector('#f18-ponto').value.trim();
          const leitura = bodyEl.querySelector('#f18-leitura').value;
          const errDiv = bodyEl.querySelector('#f18-error');
          errDiv.innerHTML = '';

          if (!tipo || !ponto || leitura === '') {
            errDiv.innerHTML = '<div class="form-error">Informe tipo, ponto e valor da leitura.</div>';
            return;
          }
          _withSubmit(btn, async () => {
            try {
              await API.post('/manutencao/medidores', {
                tipo,
                ponto,
                leitura: Number(leitura),
                unidade: bodyEl.querySelector('#f18-unidade').value.trim() || tipoInfo.unidade,
                data_leitura: bodyEl.querySelector('#f18-data').value || nowDate,
                observacoes: bodyEl.querySelector('#f18-obs').value.trim() || null,
                usuario_id: user.id || null,
              });
              showToast('Leitura registrada com sucesso!', 'success');
              tipoAtivo = tipo;
              loadData();
            } catch (err) {
              showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
            }
          });
        });
      }

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar medidores: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  loadData();
};

// ── f19 Dados da Caldeira ─────────────────────────────────────────────────────
ManutencaoForms.f19VerDadosCaldeira = async function (user) {
  const { el, close } = openModal({
    title: 'Dados da Caldeira',
    body: _spinner(),
    footer: `
      <button class="btn btn-primary" id="f19-registrar-btn">+ Registrar Dados</button>
      <button class="btn btn-secondary" id="f19-refresh">↻ Atualizar</button>
      <button class="btn btn-secondary" id="f19-close">Fechar</button>`,
    size: 'lg',
  });

  el.querySelector('#f19-close').addEventListener('click', close);
  el.querySelector('#f19-refresh').addEventListener('click', loadData);
  el.querySelector('#f19-registrar-btn').addEventListener('click', abrirFormRegistro);

  const bodyEl = el;

  async function loadData() {
    bodyEl.innerHTML = _spinner();
    try {
      const [vaporRaw, prevRaw] = await Promise.all([
        API.get('/manutencao/medidores?tipo=vapor').catch(() => []),
        API.get('/manutencao/preventiva').catch(() => []),
      ]);

      const vapor = Array.isArray(vaporRaw) ? vaporRaw : (vaporRaw.data || []);
      const prevAll = Array.isArray(prevRaw) ? prevRaw : (prevRaw.data || []);

      // Sort vapor readings by date desc
      vapor.sort((a, b) => new Date(b.data || b.created_at || 0) - new Date(a.data || a.created_at || 0));

      // Filter preventivas for caldeira
      const prevCaldeira = prevAll.filter(p => {
        const txt = ((p.titulo || '') + ' ' + (p.descricao || '') + ' ' + (p.equipamento || '')).toLowerCase();
        return txt.includes('caldeira');
      });

      // Metrics: last reading for pressao, temp (use ponto to differentiate)
      const pressaoLeituras = vapor.filter(v => (v.ponto || '').toLowerCase().includes('pressao') || (v.ponto || '').toLowerCase().includes('pressão'));
      const tempLeituras = vapor.filter(v => (v.ponto || '').toLowerCase().includes('temp'));
      const caldeiraLeituras = vapor.filter(v => (v.ponto || '').toLowerCase().includes('caldeira') || pressaoLeituras.length === 0);

      const ultimaPressao = pressaoLeituras[0] || caldeiraLeituras[0];
      const ultimaTemp = tempLeituras[0];

      // Consumption last month
      const mesPassado = new Date();
      mesPassado.setMonth(mesPassado.getMonth() - 1);
      const consumoMes = vapor
        .filter(v => new Date(v.data || v.created_at || 0) >= mesPassado)
        .reduce((acc, v) => acc + Number(v.leitura || 0), 0);

      // Safety / NR-13 info from preventiva
      const inspecaoNR = prevCaldeira.find(p => (p.titulo || '').toLowerCase().includes('nr') || (p.titulo || '').toLowerCase().includes('inspeção'));

      bodyEl.innerHTML = `
        <!-- Overview cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px;">
          <div class="card" style="padding:14px;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Última Pressão</div>
            <div style="font-size:26px;font-weight:700;color:var(--primary);">
              ${ultimaPressao ? escapeHtml(String(Number(ultimaPressao.leitura).toFixed(2))) + ' kgf/cm²' : '—'}
            </div>
            <div style="font-size:11px;color:var(--muted);">${_fmtDateTime(ultimaPressao && (ultimaPressao.data || ultimaPressao.created_at))}</div>
          </div>
          <div class="card" style="padding:14px;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Última Temperatura</div>
            <div style="font-size:26px;font-weight:700;color:var(--warning);">
              ${ultimaTemp ? escapeHtml(String(Number(ultimaTemp.leitura).toFixed(1))) + ' °C' : '—'}
            </div>
            <div style="font-size:11px;color:var(--muted);">${_fmtDateTime(ultimaTemp && (ultimaTemp.data || ultimaTemp.created_at))}</div>
          </div>
          <div class="card" style="padding:14px;text-align:center;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Consumo Último Mês</div>
            <div style="font-size:26px;font-weight:700;color:var(--success);">
              ${escapeHtml(consumoMes.toFixed(1))} <span style="font-size:14px;">kg</span>
            </div>
            <div style="font-size:11px;color:var(--muted);">Soma das leituras</div>
          </div>
        </div>

        <!-- Safety status -->
        <div class="card" style="padding:14px;margin-bottom:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:11px;color:var(--muted);">Conformidade NR-13</div>
            ${inspecaoNR
              ? `<span class="badge badge-success">Plano registrado</span>`
              : `<span class="badge badge-warning">Verifique planos de inspeção</span>`}
          </div>
          ${inspecaoNR ? `
          <div>
            <div style="font-size:11px;color:var(--muted);">Próxima inspeção</div>
            <div style="font-size:14px;font-weight:600;">${_fmtDate(inspecaoNR.proxima_data)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--muted);">Responsável</div>
            <div style="font-size:13px;">${escapeHtml(inspecaoNR.responsavel || '—')}</div>
          </div>` : ''}
        </div>

        <!-- Readings table -->
        <h5 style="font-size:13px;font-weight:700;margin-bottom:8px;text-transform:uppercase;color:var(--muted);">Histórico de Leituras</h5>
        ${vapor.length === 0 ? _empty() : `
        <div style="overflow-x:auto;margin-bottom:24px;">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Ponto</th>
                <th>Leitura</th>
                <th>Unidade</th>
                <th>Operador</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${vapor.slice(0, 30).map(v => `
                <tr>
                  <td>${_fmtDateTime(v.data || v.created_at)}</td>
                  <td>${escapeHtml(v.ponto || '—')}</td>
                  <td>${escapeHtml(String(Number(v.leitura).toFixed(2)))}</td>
                  <td>${escapeHtml(v.unidade || 'kgf/cm²')}</td>
                  <td>${escapeHtml(v.usuario || v.operador || v.usuario_id || '—')}</td>
                  <td>${escapeHtml(v.observacoes || '—')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}

        <!-- Preventivas caldeira -->
        <h5 style="font-size:13px;font-weight:700;margin-bottom:8px;text-transform:uppercase;color:var(--muted);">Planos Preventivos da Caldeira</h5>
        ${prevCaldeira.length === 0
          ? '<div style="color:var(--muted);font-size:13px;padding:8px 0;">Nenhum plano preventivo relacionado à caldeira encontrado.</div>'
          : `<div style="overflow-x:auto;">
              <table class="table">
                <thead>
                  <tr><th>Título</th><th>Tipo</th><th>Frequência</th><th>Próxima Data</th><th>Responsável</th></tr>
                </thead>
                <tbody>
                  ${prevCaldeira.map(p => `
                    <tr>
                      <td>${escapeHtml(p.titulo || '—')}</td>
                      <td>${escapeHtml(p.tipo || '—')}</td>
                      <td>${escapeHtml(p.frequencia_tipo || '—')}</td>
                      <td>${_fmtDate(p.proxima_data)}</td>
                      <td>${escapeHtml(p.responsavel || '—')}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`}`;

    } catch (err) {
      bodyEl.innerHTML = `<div class="form-error">Erro ao carregar dados da caldeira: ${escapeHtml(err.message || '')}</div>`;
    }
  }

  function abrirFormRegistro() {
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const { el: subEl, close: subClose } = openModal({
      title: 'Registrar Dados da Caldeira',
      body: `
        <form id="f19-sub-form" novalidate>
          <div class="form-group">
            <label class="form-label">Data/Hora <span style="color:var(--danger)">*</span></label>
            <input class="form-control" id="f19-sub-data" type="datetime-local" value="${nowLocal}">
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Pressão (kgf/cm²) <span style="color:var(--danger)">*</span></label>
              <input class="form-control" id="f19-sub-pressao" type="number" step="0.01" placeholder="Ex: 8.50">
            </div>
            <div class="form-group">
              <label class="form-label">Temperatura (°C)</label>
              <input class="form-control" id="f19-sub-temp" type="number" step="0.1" placeholder="Ex: 175.5">
            </div>
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Consumo Combustível</label>
              <input class="form-control" id="f19-sub-combustivel" type="number" step="0.01" placeholder="Litros ou m³">
            </div>
            <div class="form-group">
              <label class="form-label">Operador</label>
              <input class="form-control" id="f19-sub-operador" type="text"
                value="${escapeHtml(user.nome || '')}" placeholder="Nome do operador">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Observações</label>
            <textarea class="form-control" id="f19-sub-obs" rows="2"
              placeholder="Anomalias, ajustes realizados, limpeza de tubos..."></textarea>
          </div>
          <div id="f19-sub-error"></div>
        </form>`,
      footer: `
        <button class="btn btn-secondary" id="f19-sub-cancel">Cancelar</button>
        <button class="btn btn-primary" id="f19-sub-submit">Registrar</button>`,
      size: 'sm',
    });

    subEl.querySelector('#f19-sub-cancel').addEventListener('click', subClose);
    subEl.querySelector('#f19-sub-submit').addEventListener('click', function () {
      const btn = this;
      const pressao = subEl.querySelector('#f19-sub-pressao').value;
      const data = subEl.querySelector('#f19-sub-data').value;
      const errDiv = subEl.querySelector('#f19-sub-error');
      errDiv.innerHTML = '';

      if (!data || pressao === '') {
        errDiv.innerHTML = '<div class="form-error">Informe data/hora e pressão.</div>';
        return;
      }
      _withSubmit(btn, async () => {
        try {
          const temperatura = subEl.querySelector('#f19-sub-temp').value;
          const combustivel = subEl.querySelector('#f19-sub-combustivel').value;
          const operador = subEl.querySelector('#f19-sub-operador').value.trim();
          const obs = subEl.querySelector('#f19-sub-obs').value.trim();

          // Register pressure reading
          await API.post('/manutencao/medidores', {
            tipo: 'vapor',
            ponto: 'Caldeira Principal — Pressão',
            leitura: Number(pressao),
            unidade: 'kgf/cm²',
            data: data,
            operador: operador || null,
            observacoes: obs || null,
            usuario_id: user.id || null,
          });

          // Register temperature if provided
          if (temperatura !== '') {
            await API.post('/manutencao/medidores', {
              tipo: 'vapor',
              ponto: 'Caldeira Principal — Temperatura',
              leitura: Number(temperatura),
              unidade: '°C',
              data: data,
              operador: operador || null,
              observacoes: obs || null,
              usuario_id: user.id || null,
            });
          }

          // Register fuel consumption if provided
          if (combustivel !== '') {
            await API.post('/manutencao/medidores', {
              tipo: 'vapor',
              ponto: 'Caldeira Principal — Combustível',
              leitura: Number(combustivel),
              unidade: 'L',
              data: data,
              operador: operador || null,
              observacoes: obs || null,
              usuario_id: user.id || null,
            });
          }

          showToast('Dados da caldeira registrados com sucesso!', 'success');
          subClose();
          loadData();
        } catch (err) {
          showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'danger');
        }
      });
    });
  }

  loadData();
};

// PART2_END
