'use strict';
/**
 * Modais do setor de Qualidade.
 * Usa _qualModal() local — retorna { el, setFooter, close }.
 */

function _qualModal(opts) {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  const sz = opts.size ? ` modal-${opts.size}` : '';
  bd.innerHTML = `
    <div class="modal${sz}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">${opts.title || ''}</h3>
        <button class="modal-close" aria-label="Fechar">✕</button>
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

const TODAY = () => new Date().toISOString().split('T')[0];

const QualidadeForms = {

  // ── f01: Análise de Recepção (Plataforma) ─────────────────────────────────────

  f01AnaliseRecepcao: async (user) => {
    const { el, setFooter } = _qualModal({ title: '📋 Análise de Recepção de Materiais', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/analises-leite');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar análises.'); return; }
      const rows = r.data.map(a => `<tr>
        <td>${escapeHtml(a.numero_tanque || a.lote || '—')}</td>
        <td>${a.temperatura != null ? a.temperatura + '°C' : '—'}</td>
        <td>${a.acidez || '—'}</td>
        <td>${escapeHtml(a.alizarol || '—')}</td>
        <td>${a.gordura || '—'}</td>
        <td>${_badge(a.resultado)}</td>
        <td>${escapeHtml(a.analista_nome || '—')}</td>
        <td>${_fmtDate(a.data_analise)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Lote/Ref.</th><th>Temp.</th><th>Parâm. A</th><th>Parâm. B</th><th>Parâm. C</th><th>Resultado</th><th>Analista</th><th>Data</th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma análise registrada.');
      setFooter(`<button class="btn btn-primary" id="qf01-nova">+ Nova Análise</button>`);
      document.getElementById('qf01-nova').onclick = () => mostrarForm();
    };
    const mostrarForm = () => {
      el.innerHTML = `<form id="qf01-form">
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Data *</label><input name="data_analise" type="date" class="form-control" required value="${TODAY()}"></div>
          <div class="col-4"><label class="form-label">Nº Tanque</label><input name="numero_tanque" class="form-control" placeholder="T1, T2..."></div>
          <div class="col-4"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">Temperatura (°C)</label><input name="temperatura" type="number" step="0.1" class="form-control"></div>
          <div class="col-3"><label class="form-label">Acidez (°D)</label><input name="acidez" type="number" step="0.01" class="form-control"></div>
          <div class="col-3"><label class="form-label">Densidade</label><input name="densidade" type="number" step="0.0001" class="form-control"></div>
          <div class="col-3"><label class="form-label">Gordura (%)</label><input name="gordura" type="number" step="0.01" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">CBT (x1000)</label><input name="cbt" type="number" class="form-control"></div>
          <div class="col-3"><label class="form-label">CCS (x1000)</label><input name="ccs" type="number" class="form-control"></div>
          <div class="col-3"><label class="form-label">Alizarol</label>
            <select name="alizarol" class="form-select"><option value="negativo">Negativo</option><option value="positivo">Positivo</option></select>
          </div>
          <div class="col-3"><label class="form-label">Resultado *</label>
            <select name="resultado" class="form-select" required>
              <option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-secondary me-2" id="qf01-voltar">Voltar</button><button class="btn btn-success" id="qf01-salvar">Salvar</button>`);
      document.getElementById('qf01-voltar').onclick = load;
      document.getElementById('qf01-salvar').onclick = async () => {
        const f = document.getElementById('qf01-form');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        await _withSubmit(document.getElementById('qf01-salvar'), async () => {
          const res = await API.post('/qualidade/analises-leite', Object.fromEntries(new FormData(f)));
          if (!res || !res.success) { showToast(res?.message || 'Erro ao salvar.', 'danger'); return; }
          showToast('Análise registrada!', 'success'); load();
        });
      };
    };
    await load();
  },

  // ── f02: Análises Físico-Químicas ─────────────────────────────────────────────

  f02AnalisesFQ: async (user) => {
    const { el, setFooter } = _qualModal({ title: '⚗️ Análises Físico-Químicas', size: 'xl', body: _spinner() });
    const [r, rP] = await Promise.all([API.get('/qualidade/analises-fq'), API.get('/qualidade/produtos')]);
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar análises.'); return; }
    const produtos = (rP && rP.data) ? rP.data : [];
    const optsP = produtos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
    const rows = r.data.map(a => `<tr>
      <td>${escapeHtml(a.produto_nome || '—')}</td>
      <td>${escapeHtml(a.lote || '—')}</td>
      <td>${a.gordura || '—'}</td><td>${a.proteina || '—'}</td><td>${a.umidade || '—'}</td><td>${a.ph || '—'}</td>
      <td>${_badge(a.resultado)}</td><td>${_fmtDate(a.data_analise)}</td>
    </tr>`).join('');
    el.innerHTML = rows
      ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
          <th>Produto</th><th>Lote</th><th>Gordura%</th><th>Proteína%</th><th>Umidade%</th><th>pH</th><th>Resultado</th><th>Data</th>
         </tr></thead><tbody>${rows}</tbody></table></div>`
      : _empty('Nenhuma análise registrada.');
    setFooter(`<button class="btn btn-primary" id="qf02-nova">+ Nova Análise</button>`);
    document.getElementById('qf02-nova').onclick = () => {
      el.innerHTML = `<form id="qf02-form">
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Data *</label><input name="data_analise" type="date" class="form-control" required value="${TODAY()}"></div>
          <div class="col-4"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
          <div class="col-4"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">Gordura (%)</label><input name="gordura" type="number" step="0.01" class="form-control"></div>
          <div class="col-3"><label class="form-label">Proteína (%)</label><input name="proteina" type="number" step="0.01" class="form-control"></div>
          <div class="col-3"><label class="form-label">Umidade (%)</label><input name="umidade" type="number" step="0.01" class="form-control"></div>
          <div class="col-3"><label class="form-label">Acidez (°D)</label><input name="acidez" type="number" step="0.01" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">pH</label><input name="ph" type="number" step="0.01" class="form-control"></div>
          <div class="col-3"><label class="form-label">Aw</label><input name="aw" type="number" step="0.001" class="form-control"></div>
          <div class="col-3"><label class="form-label">Sal (%)</label><input name="sal" type="number" step="0.01" class="form-control"></div>
          <div class="col-3"><label class="form-label">Resultado *</label>
            <select name="resultado" class="form-select" required>
              <option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="qf02-salvar">Salvar</button>`);
      document.getElementById('qf02-salvar').onclick = async () => {
        const f = document.getElementById('qf02-form');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        await _withSubmit(document.getElementById('qf02-salvar'), async () => {
          const res = await API.post('/qualidade/analises-fq', Object.fromEntries(new FormData(f)));
          if (!res || !res.success) { showToast(res?.message || 'Erro ao salvar.', 'danger'); return; }
          showToast('Análise FQ registrada!', 'success'); QualidadeForms.f02AnalisesFQ(user);
        });
      };
    };
  },

  // ── f03: Análises Microbiológicas ─────────────────────────────────────────────

  f03AnalisesMicro: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🦠 Análises Microbiológicas', size: 'xl', body: _spinner() });
    const [r, rP] = await Promise.all([API.get('/qualidade/analises-micro'), API.get('/qualidade/produtos')]);
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar análises.'); return; }
    const optsP = ((rP && rP.data) ? rP.data : []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
    const rows = r.data.map(a => `<tr>
      <td>${escapeHtml(a.produto_nome || '—')}</td><td>${escapeHtml(a.lote || '—')}</td>
      <td>${escapeHtml(a.coliformes_totais || '—')}</td>
      <td>${_badge(a.salmonella === 'presente' ? 'reprovado' : 'aprovado', a.salmonella)}</td>
      <td>${_badge(a.listeria === 'presente' ? 'reprovado' : 'aprovado', a.listeria)}</td>
      <td>${_badge(a.resultado)}</td><td>${_fmtDate(a.data_analise)}</td>
    </tr>`).join('');
    el.innerHTML = rows
      ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
          <th>Produto</th><th>Lote</th><th>Coliformes Totais</th><th>Salmonella</th><th>Listeria</th><th>Resultado</th><th>Data</th>
         </tr></thead><tbody>${rows}</tbody></table></div>`
      : _empty('Nenhuma análise microbiológica registrada.');
    setFooter(`<button class="btn btn-primary" id="qf03-nova">+ Nova Análise</button>`);
    document.getElementById('qf03-nova').onclick = () => {
      el.innerHTML = `<form id="qf03-form">
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Data *</label><input name="data_analise" type="date" class="form-control" required value="${TODAY()}"></div>
          <div class="col-4"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
          <div class="col-4"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Coliformes Totais (UFC/g)</label><input name="coliformes_totais" class="form-control" placeholder="Ex: <10"></div>
          <div class="col-6"><label class="form-label">Coliformes Termotolerantes</label><input name="coliformes_termotolerantes" class="form-control" placeholder="Ex: <10"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Estafilococos (UFC/g)</label><input name="estafilococos" class="form-control" placeholder="Ex: <100"></div>
          <div class="col-6"><label class="form-label">Aeróbios Mesófilos</label><input name="contagem_aerobios" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-3"><label class="form-label">Bolores/Leveduras</label><input name="bolores_leveduras" class="form-control"></div>
          <div class="col-3"><label class="form-label">Salmonella</label>
            <select name="salmonella" class="form-select"><option value="ausente">Ausente</option><option value="presente">Presente</option></select>
          </div>
          <div class="col-3"><label class="form-label">Listeria</label>
            <select name="listeria" class="form-select"><option value="ausente">Ausente</option><option value="presente">Presente</option></select>
          </div>
          <div class="col-3"><label class="form-label">Resultado *</label>
            <select name="resultado" class="form-select" required>
              <option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="qf03-salvar">Salvar</button>`);
      document.getElementById('qf03-salvar').onclick = async () => {
        const f = document.getElementById('qf03-form');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        await _withSubmit(document.getElementById('qf03-salvar'), async () => {
          const res = await API.post('/qualidade/analises-micro', Object.fromEntries(new FormData(f)));
          if (!res || !res.success) { showToast(res?.message || 'Erro ao salvar.', 'danger'); return; }
          showToast('Análise microbiológica registrada!', 'success'); QualidadeForms.f03AnalisesMicro(user);
        });
      };
    };
  },

  // ── f04: Monitoramento de Antibióticos ────────────────────────────────────────

  f04Antibioticos: async (user) => {
    const { el, setFooter } = _qualModal({ title: '💊 Monitoramento de Antibióticos', size: 'lg', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/antibioticos');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const rows = r.data.map(a => `<tr>
        <td>${escapeHtml(a.numero_tanque || a.lote || '—')}</td>
        <td>${escapeHtml(a.kit_utilizado || a.metodo || '—')}</td>
        <td>${_badge(a.resultado === 'positivo' ? 'reprovado' : a.resultado === 'negativo' ? 'aprovado' : 'warning', a.resultado)}</td>
        <td>${escapeHtml(a.analista_nome || '—')}</td>
        <td>${_fmtDate(a.data_analise)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<table class="table table-sm table-hover"><thead><tr><th>Tanque/Lote</th><th>Kit/Método</th><th>Resultado</th><th>Analista</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>`
        : _empty('Nenhum monitoramento registrado.');
      setFooter(`<button class="btn btn-primary" id="qf04-novo">+ Registrar</button>`);
      document.getElementById('qf04-novo').onclick = () => mostrarForm();
    };
    const mostrarForm = () => {
      el.innerHTML = `<form id="qf04-form">
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Data *</label><input name="data_analise" type="date" class="form-control" required value="${TODAY()}"></div>
          <div class="col-4"><label class="form-label">Nº Tanque</label><input name="numero_tanque" class="form-control"></div>
          <div class="col-4"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Kit Utilizado</label><input name="kit_utilizado" class="form-control" placeholder="Ex: Charm Rosa, Delvotest..."></div>
          <div class="col-6"><label class="form-label">Método</label><input name="metodo" class="form-control" placeholder="Ex: SNAP, TwinSensor..."></div>
        </div>
        <div class="mb-2"><label class="form-label">Resultado *</label>
          <select name="resultado" class="form-select" required>
            <option value="negativo">Negativo (Conforme)</option>
            <option value="positivo">Positivo (Reprovado)</option>
            <option value="inconclusivo">Inconclusivo</option>
          </select>
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-secondary me-2" id="qf04-voltar">Voltar</button><button class="btn btn-success" id="qf04-salvar">Salvar</button>`);
      document.getElementById('qf04-voltar').onclick = load;
      document.getElementById('qf04-salvar').onclick = async () => {
        const f = document.getElementById('qf04-form');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        await _withSubmit(document.getElementById('qf04-salvar'), async () => {
          const res = await API.post('/qualidade/antibioticos', Object.fromEntries(new FormData(f)));
          if (!res || !res.success) { showToast(res?.message || 'Erro ao salvar.', 'danger'); return; }
          showToast('Registro salvo!', 'success'); load();
        });
      };
    };
    await load();
  },

  // ── f05: Liberação de Lotes ───────────────────────────────────────────────────

  f05LiberacaoLotes: async (user) => {
    const { el, setFooter } = _qualModal({ title: '✅ Liberação de Lotes', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rP] = await Promise.all([API.get('/qualidade/lotes'), API.get('/qualidade/produtos')]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar lotes.'); return; }
      const produtos = (rP && rP.data) ? rP.data : [];
      const rows = r.data.map(l => `<tr>
        <td>${escapeHtml(l.lote)}</td>
        <td>${escapeHtml(l.produto_nome || '—')}</td>
        <td>${_fmtDate(l.data_producao)}</td>
        <td>${_badge(l.status)}</td>
        <td>${escapeHtml(l.responsavel_nome || '—')}</td>
        <td>
          ${l.status === 'bloqueado' ? `<button class="btn btn-success btn-sm btn-liberar-lote" data-id="${l.id}">Liberar</button>
          <button class="btn btn-danger btn-sm ms-1 btn-bloquear-lote" data-id="${l.id}">Destruir</button>` : '—'}
        </td>
      </tr>`).join('');
      const optsP = produtos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover" id="qf05-table"><thead><tr>
            <th>Lote</th><th>Produto</th><th>Produção</th><th>Status</th><th>Responsável</th><th>Ação</th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhum lote registrado.');
      // delegated actions
      el.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('.btn-liberar-lote, .btn-bloquear-lote');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const status = btn.classList.contains('btn-liberar-lote') ? 'liberado' : 'destruido';
        if (!confirm(`Confirmar: ${status} este lote?`)) return;
        const res = await API.put(`/qualidade/lotes/${id}`, { status });
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast(`Lote ${status}!`, 'success'); load();
      });
      setFooter(`<button class="btn btn-primary" id="qf05-novo">+ Registrar Lote</button>`);
      document.getElementById('qf05-novo').onclick = () => {
        el.innerHTML = `<form id="qf05-form">
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Lote *</label><input name="lote" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
            <div class="col-4"><label class="form-label">Data Produção</label><input name="data_producao" type="date" class="form-control" value="${TODAY()}"></div>
          </div>
          <div class="mb-2"><label class="form-label">Motivo de Bloqueio</label><textarea name="motivo_bloqueio" class="form-control" rows="2" placeholder="Aguardando laudos..."></textarea></div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf05-voltar">Voltar</button><button class="btn btn-success" id="qf05-salvar">Salvar</button>`);
        document.getElementById('qf05-voltar').onclick = load;
        document.getElementById('qf05-salvar').onclick = async () => {
          const f = document.getElementById('qf05-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf05-salvar'), async () => {
            const res = await API.post('/qualidade/lotes', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro ao salvar.', 'danger'); return; }
            showToast('Lote registrado!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f06: Gestão de Não Conformidades ─────────────────────────────────────────

  f06NaoConformidades: async (user) => {
    const { el, setFooter } = _qualModal({ title: '⚠️ Não Conformidades (RNC)', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rU, rD] = await Promise.all([
        API.get('/qualidade/nc'), API.get('/qualidade/usuarios'), API.get('/qualidade/departamentos')
      ]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar NCs.'); return; }
      const usuarios = (rU && rU.data) ? rU.data : [];
      const depts = (rD && rD.data) ? rD.data : [];
      const rows = r.data.map(nc => `<tr>
        <td><strong>${escapeHtml(nc.codigo || String(nc.id))}</strong></td>
        <td>${escapeHtml(nc.descricao?.substring(0, 40) || '—')}</td>
        <td>${escapeHtml(nc.tipo || '—')}</td>
        <td>${_badge(nc.status)}</td>
        <td>${_fmtDate(nc.data_ocorrencia)}</td>
        <td>${nc.status !== 'encerrada' && user.nivel_acesso >= 4
          ? `<button class="btn btn-sm btn-secondary btn-nc-update" data-id="${nc.id}">Atualizar</button>`
          : '—'}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Código</th><th>Descrição</th><th>Tipo</th><th>Status</th><th>Data</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma NC registrada.');
      el.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('.btn-nc-update');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const optsU = usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
        el.innerHTML = `<form id="qf06-upd">
          <div class="mb-2"><label class="form-label">Status *</label>
            <select name="status" class="form-select" required>
              <option value="aberta">Aberta</option><option value="em_investigacao">Em Investigação</option>
              <option value="acao_pendente">Ação Pendente</option><option value="verificacao">Verificação</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
          <div class="mb-2"><label class="form-label">Causa Raiz</label><textarea name="causa_raiz" class="form-control" rows="2"></textarea></div>
          <div class="mb-2"><label class="form-label">Ação Corretiva</label><textarea name="acao_corretiva" class="form-control" rows="2"></textarea></div>
          <div class="mb-2"><label class="form-label">Ação Preventiva</label><textarea name="acao_preventiva" class="form-control" rows="2"></textarea></div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Responsável</label><select name="responsavel_id" class="form-select"><option value="">—</option>${optsU}</select></div>
            <div class="col-6"><label class="form-label">Prazo</label><input name="data_prazo" type="date" class="form-control"></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf06-voltar2">Voltar</button><button class="btn btn-success" id="qf06-salvar2">Salvar</button>`);
        document.getElementById('qf06-voltar2').onclick = load;
        document.getElementById('qf06-salvar2').onclick = async () => {
          const f = document.getElementById('qf06-upd');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf06-salvar2'), async () => {
            const res = await API.put(`/qualidade/nc/${id}`, Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('NC atualizada!', 'success'); load();
          });
        };
      });
      const optsU2 = usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
      const optsD = depts.map(d => `<option value="${d.id}">${escapeHtml(d.nome)}</option>`).join('');
      setFooter(`<button class="btn btn-primary" id="qf06-nova">+ Abrir NC</button>`);
      document.getElementById('qf06-nova').onclick = () => {
        el.innerHTML = `<form id="qf06-form">
          <div class="mb-2"><label class="form-label">Descrição *</label><textarea name="descricao" class="form-control" rows="3" required></textarea></div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Tipo *</label>
              <select name="tipo" class="form-select" required>
                <option value="interna">Interna</option><option value="externa">Externa</option>
                <option value="fornecedor">Fornecedor</option><option value="processo">Processo</option>
              </select>
            </div>
            <div class="col-4"><label class="form-label">Setor Origem</label><select name="setor_origem_id" class="form-select"><option value="">—</option>${optsD}</select></div>
            <div class="col-4"><label class="form-label">Data Ocorrência</label><input name="data_ocorrencia" type="date" class="form-control" value="${TODAY()}"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Responsável</label><select name="responsavel_id" class="form-select"><option value="">—</option>${optsU2}</select></div>
            <div class="col-6"><label class="form-label">Prazo CAPA</label><input name="data_prazo" type="date" class="form-control"></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf06-voltar">Voltar</button><button class="btn btn-success" id="qf06-salvar">Salvar</button>`);
        document.getElementById('qf06-voltar').onclick = load;
        document.getElementById('qf06-salvar').onclick = async () => {
          const f = document.getElementById('qf06-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf06-salvar'), async () => {
            const res = await API.post('/qualidade/nc', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('NC aberta! Código: ' + (res.data?.codigo || ''), 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f07: Análise Sensorial ────────────────────────────────────────────────────

  f07AnaliseSensorial: async (user) => {
    const { el, setFooter } = _qualModal({ title: '👅 Análise Sensorial', size: 'lg', body: _spinner() });
    const [r, rP] = await Promise.all([API.get('/qualidade/analises-sensoriais'), API.get('/qualidade/produtos')]);
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar análises.'); return; }
    const optsP = ((rP && rP.data) ? rP.data : []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
    const rows = r.data.map(a => `<tr>
      <td>${escapeHtml(a.produto_nome || '—')}</td><td>${escapeHtml(a.lote || '—')}</td>
      <td>${a.aparencia === 'conforme' ? '✓' : '✗'}</td><td>${a.cor === 'conforme' ? '✓' : '✗'}</td>
      <td>${a.aroma === 'conforme' ? '✓' : '✗'}</td><td>${a.textura === 'conforme' ? '✓' : '✗'}</td>
      <td>${a.sabor === 'conforme' ? '✓' : '✗'}</td>
      <td>${_badge(a.resultado)}</td><td>${_fmtDate(a.data_analise)}</td>
    </tr>`).join('');
    el.innerHTML = rows
      ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
          <th>Produto</th><th>Lote</th><th>Aparência</th><th>Cor</th><th>Aroma</th><th>Textura</th><th>Sabor</th><th>Resultado</th><th>Data</th>
         </tr></thead><tbody>${rows}</tbody></table></div>`
      : _empty('Nenhuma análise sensorial registrada.');
    setFooter(`<button class="btn btn-primary" id="qf07-nova">+ Nova Análise</button>`);
    document.getElementById('qf07-nova').onclick = () => {
      const atributos = ['aparencia','cor','aroma','textura','sabor'];
      el.innerHTML = `<form id="qf07-form">
        <div class="row g-2 mb-2">
          <div class="col-4"><label class="form-label">Data *</label><input name="data_analise" type="date" class="form-control" required value="${TODAY()}"></div>
          <div class="col-4"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
          <div class="col-4"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
        </div>
        <div class="row g-2 mb-3">
          ${atributos.map(a => `<div class="col"><label class="form-label text-capitalize">${a}</label>
            <select name="${a}" class="form-select">
              <option value="conforme">Conforme</option><option value="nao_conforme">Não Conforme</option>
            </select>
          </div>`).join('')}
        </div>
        <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="qf07-salvar">Salvar</button>`);
      document.getElementById('qf07-salvar').onclick = async () => {
        const f = document.getElementById('qf07-form');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        await _withSubmit(document.getElementById('qf07-salvar'), async () => {
          const res = await API.post('/qualidade/analises-sensoriais', Object.fromEntries(new FormData(f)));
          if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
          showToast('Análise sensorial registrada!', 'success'); QualidadeForms.f07AnaliseSensorial(user);
        });
      };
    };
  },

  // ── f08: Controle de Shelf-Life ───────────────────────────────────────────────

  f08ShelfLife: async (user) => {
    const { el, setFooter } = _qualModal({ title: '📅 Controle de Shelf-Life / Validade', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rP] = await Promise.all([API.get('/qualidade/shelf-life'), API.get('/qualidade/produtos')]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const optsP = ((rP && rP.data) ? rP.data : []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
      const rows = r.data.map(s => {
        const diasClass = s.dias_restantes < 0 ? 'text-danger fw-bold' : s.dias_restantes < 7 ? 'text-warning fw-bold' : '';
        return `<tr>
          <td>${escapeHtml(s.produto_nome || '—')}</td><td>${escapeHtml(s.lote || '—')}</td>
          <td>${_fmtDate(s.data_fabricacao)}</td><td>${_fmtDate(s.data_validade)}</td>
          <td class="${diasClass}">${s.dias_restantes != null ? s.dias_restantes + 'd' : '—'}</td>
          <td>${_badge(s.status)}</td>
          <td>${s.status === 'vigente' && user.nivel_acesso >= 3
            ? `<button class="btn btn-sm btn-danger btn-sl-descartar" data-id="${s.id}">Descartar</button>` : '—'}</td>
        </tr>`;
      }).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Produto</th><th>Lote</th><th>Fabricação</th><th>Validade</th><th>Dias</th><th>Status</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhum registro de shelf-life.');
      el.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('.btn-sl-descartar');
        if (!btn) return;
        if (!confirm('Marcar como descartado?')) return;
        const res = await API.patch(`/qualidade/shelf-life/${btn.dataset.id}`, { status: 'descartado' });
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast('Marcado como descartado.', 'success'); load();
      });
      setFooter(`<button class="btn btn-primary" id="qf08-novo">+ Registrar</button>`);
      document.getElementById('qf08-novo').onclick = () => {
        el.innerHTML = `<form id="qf08-form">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Produto *</label><select name="produto_id" class="form-select" required><option value="">—</option>${optsP}</select></div>
            <div class="col-6"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Data Fabricação *</label><input name="data_fabricacao" type="date" class="form-control" required value="${TODAY()}"></div>
            <div class="col-4"><label class="form-label">Data Validade *</label><input name="data_validade" type="date" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Temp. Armazenagem (°C)</label><input name="temperatura_armazenagem" type="number" step="0.1" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Local de Armazenagem</label><input name="local_armazenagem" class="form-control"></div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf08-voltar">Voltar</button><button class="btn btn-success" id="qf08-salvar">Salvar</button>`);
        document.getElementById('qf08-voltar').onclick = load;
        document.getElementById('qf08-salvar').onclick = async () => {
          const f = document.getElementById('qf08-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf08-salvar'), async () => {
            const res = await API.post('/qualidade/shelf-life', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Shelf-life registrado!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f09: Emissão de Laudos Técnicos ──────────────────────────────────────────

  f09Laudos: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🔬 Laudos Técnicos', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rP] = await Promise.all([API.get('/qualidade/laudos'), API.get('/qualidade/produtos')]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar laudos.'); return; }
      const optsP = ((rP && rP.data) ? rP.data : []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
      const rows = r.data.map(l => `<tr>
        <td>#${l.id}</td><td>${escapeHtml(l.produto_nome || '—')}</td>
        <td>${escapeHtml(l.lote || '—')}</td><td>${_badge(l.resultado)}</td>
        <td>${escapeHtml(l.analista_nome || '—')}</td><td>${_fmtDate(l.data_coleta)}</td>
        <td>${user.nivel_acesso >= 4 && l.resultado !== 'aprovado'
          ? `<button class="btn btn-sm btn-secondary btn-laudo-upd" data-id="${l.id}">Atualizar</button>` : '—'}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>#</th><th>Produto</th><th>Lote</th><th>Resultado</th><th>Analista</th><th>Coleta</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhum laudo registrado.');
      el.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('.btn-laudo-upd');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const r2 = prompt('Novo resultado (aprovado/reprovado/condicional):');
        if (!r2) return;
        const res = await API.put(`/qualidade/laudos/${id}`, { resultado: r2.trim() });
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast('Laudo atualizado!', 'success'); load();
      });
      setFooter(`<button class="btn btn-primary" id="qf09-novo">+ Emitir Laudo</button>`);
      document.getElementById('qf09-novo').onclick = () => {
        el.innerHTML = `<form id="qf09-form">
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
            <div class="col-4"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
            <div class="col-4"><label class="form-label">Data Coleta</label><input name="data_coleta" type="date" class="form-control" value="${TODAY()}"></div>
          </div>
          <div class="mb-2"><label class="form-label">Resultado *</label>
            <select name="resultado" class="form-select" required>
              <option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="condicional">Condicional</option>
            </select>
          </div>
          <div class="mb-2"><label class="form-label">Observações / Parâmetros</label><textarea name="observacoes" class="form-control" rows="3" placeholder="Ex: CCS 180k, CBT 12k, Gordura 3.8%..."></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf09-voltar">Voltar</button><button class="btn btn-success" id="qf09-salvar">Emitir</button>`);
        document.getElementById('qf09-voltar').onclick = load;
        document.getElementById('qf09-salvar').onclick = async () => {
          const f = document.getElementById('qf09-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf09-salvar'), async () => {
            const res = await API.post('/qualidade/laudos', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Laudo emitido! ID: #' + res.data.id, 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f10: Amostras de Retenção ─────────────────────────────────────────────────

  f10AmostrasRetencao: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🧪 Amostras de Retenção', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rP] = await Promise.all([API.get('/qualidade/amostras'), API.get('/qualidade/produtos')]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar amostras.'); return; }
      const optsP = ((rP && rP.data) ? rP.data : []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
      const rows = r.data.map(a => {
        const diasClass = a.dias_para_vencer != null && a.dias_para_vencer < 0 ? 'text-danger' : a.dias_para_vencer < 7 ? 'text-warning' : '';
        return `<tr>
          <td>${escapeHtml(a.lote)}</td><td>${escapeHtml(a.produto_nome || '—')}</td>
          <td>${a.quantidade ? a.quantidade + ' ' + a.unidade : '—'}</td>
          <td>${escapeHtml(a.localizacao || '—')}</td>
          <td class="${diasClass}">${_fmtDate(a.data_validade)}</td>
          <td>${_badge(a.status)}</td>
          <td>${a.status === 'ativa'
            ? `<button class="btn btn-sm btn-warning btn-am-usar" data-id="${a.id}">Usar</button>
               <button class="btn btn-sm btn-danger ms-1 btn-am-desc" data-id="${a.id}">Descartar</button>` : '—'}</td>
        </tr>`;
      }).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Lote</th><th>Produto</th><th>Qtd</th><th>Local</th><th>Validade</th><th>Status</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma amostra de retenção registrada.');
      el.addEventListener('click', async (ev) => {
        const btnUsar = ev.target.closest('.btn-am-usar');
        const btnDesc = ev.target.closest('.btn-am-desc');
        if (!btnUsar && !btnDesc) return;
        const id = Number((btnUsar || btnDesc).dataset.id);
        const status = btnUsar ? 'utilizada' : 'descartada';
        const motivo_uso = btnUsar ? prompt('Motivo do uso da amostra:') : null;
        const res = await API.patch(`/qualidade/amostras/${id}`, { status, motivo_uso });
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast(`Amostra ${status}.`, 'success'); load();
      });
      setFooter(`<button class="btn btn-primary" id="qf10-novo">+ Registrar Amostra</button>`);
      document.getElementById('qf10-novo').onclick = () => {
        el.innerHTML = `<form id="qf10-form">
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Lote *</label><input name="lote" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
            <div class="col-4"><label class="form-label">Data Coleta *</label><input name="data_coleta" type="date" class="form-control" required value="${TODAY()}"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Quantidade</label><input name="quantidade" type="number" step="0.001" class="form-control"></div>
            <div class="col-4"><label class="form-label">Unidade</label><input name="unidade" class="form-control" value="g"></div>
            <div class="col-4"><label class="form-label">Validade da Amostra</label><input name="data_validade" type="date" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Localização</label><input name="localizacao" class="form-control" placeholder="Ex: Freezer A — Prateleira 2"></div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf10-voltar">Voltar</button><button class="btn btn-success" id="qf10-salvar">Salvar</button>`);
        document.getElementById('qf10-voltar').onclick = load;
        document.getElementById('qf10-salvar').onclick = async () => {
          const f = document.getElementById('qf10-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf10-salvar'), async () => {
            const res = await API.post('/qualidade/amostras', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Amostra registrada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f11: Monitoramento de Água e Efluentes ────────────────────────────────────

  f11ControleAguas: async (user) => {
    const { el, setFooter } = _qualModal({ title: '💧 Controle de Águas e Efluentes', size: 'lg', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/aguas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const rows = r.data.map(a => `<tr>
        <td>${escapeHtml(a.ponto_coleta)}</td>
        <td>${escapeHtml(a.tipo || '—')}</td>
        <td>pH: ${a.ph || '—'} | Cl: ${a.cloro || '—'} | Turb: ${a.turbidez || '—'}</td>
        <td>${escapeHtml(a.coliformes || '—')}</td>
        <td>${_badge(a.resultado)}</td>
        <td>${_fmtDate(a.data_coleta)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<table class="table table-sm table-hover"><thead><tr>
            <th>Ponto</th><th>Tipo</th><th>Parâmetros</th><th>Coliformes</th><th>Resultado</th><th>Data</th>
           </tr></thead><tbody>${rows}</tbody></table>`
        : _empty('Nenhuma análise de água registrada.');
      setFooter(`<button class="btn btn-primary" id="qf11-novo">+ Registrar Análise</button>`);
      document.getElementById('qf11-novo').onclick = () => {
        el.innerHTML = `<form id="qf11-form">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Ponto de Coleta *</label><input name="ponto_coleta" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Tipo</label>
              <select name="tipo" class="form-select">
                <option value="processo">Processo</option><option value="lavagem">Lavagem</option>
                <option value="consumo">Consumo Humano</option><option value="efluente">Efluente</option>
              </select>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-3"><label class="form-label">pH</label><input name="ph" type="number" step="0.01" class="form-control"></div>
            <div class="col-3"><label class="form-label">Cloro (mg/L)</label><input name="cloro" type="number" step="0.01" class="form-control"></div>
            <div class="col-3"><label class="form-label">Turbidez (NTU)</label><input name="turbidez" type="number" step="0.01" class="form-control"></div>
            <div class="col-3"><label class="form-label">Coliformes</label>
              <select name="coliformes" class="form-select"><option value="ausente">Ausente</option><option value="presente">Presente</option></select>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Data Coleta *</label><input name="data_coleta" type="date" class="form-control" required value="${TODAY()}"></div>
            <div class="col-6"><label class="form-label">Resultado *</label>
              <select name="resultado" class="form-select" required>
                <option value="conforme">Conforme</option><option value="nao_conforme">Não Conforme</option><option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf11-voltar">Voltar</button><button class="btn btn-success" id="qf11-salvar">Salvar</button>`);
        document.getElementById('qf11-voltar').onclick = load;
        document.getElementById('qf11-salvar').onclick = async () => {
          const f = document.getElementById('qf11-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf11-salvar'), async () => {
            const res = await API.post('/qualidade/aguas', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Análise registrada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f12: Swab Test (Higiene) ──────────────────────────────────────────────────

  f12SwabTest: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🧹 Swab Test — Higiene de Superfícies', size: 'lg', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/swabs');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const rows = r.data.map(s => `<tr>
        <td>${escapeHtml(s.ponto_coleta)}</td>
        <td>${escapeHtml(s.micro_detectado || '—')}</td>
        <td>${_badge(s.resultado)}</td>
        <td>${escapeHtml(s.analista_nome || '—')}</td>
        <td>${_fmtDate(s.data_coleta)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<table class="table table-sm table-hover"><thead><tr>
            <th>Superfície</th><th>Micro Detectado</th><th>Resultado</th><th>Analista</th><th>Data</th>
           </tr></thead><tbody>${rows}</tbody></table>`
        : _empty('Nenhum swab registrado.');
      setFooter(`<button class="btn btn-primary" id="qf12-novo">+ Registrar Swab</button>`);
      document.getElementById('qf12-novo').onclick = () => {
        el.innerHTML = `<form id="qf12-form">
          <div class="mb-2"><label class="form-label">Ponto de Coleta / Superfície *</label><input name="ponto_coleta" class="form-control" required placeholder="Ex: Esteira principal, Tanque T1, Mesa de corte..."></div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Data Coleta *</label><input name="data_coleta" type="date" class="form-control" required value="${TODAY()}"></div>
            <div class="col-4"><label class="form-label">Micro Detectado</label><input name="micro_detectado" class="form-control" placeholder="Ex: Listeria spp."></div>
            <div class="col-4"><label class="form-label">Resultado *</label>
              <select name="resultado" class="form-select" required>
                <option value="conforme">Conforme</option><option value="nao_conforme">Não Conforme</option><option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf12-voltar">Voltar</button><button class="btn btn-success" id="qf12-salvar">Salvar</button>`);
        document.getElementById('qf12-voltar').onclick = load;
        document.getElementById('qf12-salvar').onclick = async () => {
          const f = document.getElementById('qf12-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf12-salvar'), async () => {
            const res = await API.post('/qualidade/swabs', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Swab registrado!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f13: Controle de Pragas ───────────────────────────────────────────────────

  f13ControlePragas: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🐀 Controle Integrado de Pragas', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/pragas');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const rows = r.data.map(p => `<tr>
        <td>${_fmtDate(p.data_visita)}</td>
        <td>${escapeHtml(p.empresa_terceirizada || '—')}</td>
        <td>${escapeHtml(p.tipo_servico || '—')}</td>
        <td>${escapeHtml(p.pragas_detectadas || 'Nenhuma')}</td>
        <td>${_badge(p.resultado)}</td>
        <td>${_fmtDate(p.proxima_visita)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Data Visita</th><th>Empresa</th><th>Serviço</th><th>Pragas</th><th>Resultado</th><th>Próxima Visita</th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhum registro de controle de pragas.');
      setFooter(`<button class="btn btn-primary" id="qf13-novo">+ Registrar Visita</button>`);
      document.getElementById('qf13-novo').onclick = () => {
        el.innerHTML = `<form id="qf13-form">
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Data da Visita *</label><input name="data_visita" type="date" class="form-control" required value="${TODAY()}"></div>
            <div class="col-4"><label class="form-label">Empresa</label><input name="empresa_terceirizada" class="form-control"></div>
            <div class="col-4"><label class="form-label">Técnico Responsável</label><input name="responsavel_tecnico" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Tipo de Serviço</label>
              <select name="tipo_servico" class="form-select">
                <option value="monitoramento">Monitoramento</option><option value="desinsetizacao">Desinsetização</option>
                <option value="desratizacao">Desratização</option><option value="descupinizacao">Descupinização</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div class="col-6"><label class="form-label">Próxima Visita</label><input name="proxima_visita" type="date" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Áreas Atendidas</label><textarea name="areas_atendidas" class="form-control" rows="2"></textarea></div>
          <div class="mb-2"><label class="form-label">Pragas Detectadas</label><input name="pragas_detectadas" class="form-control" placeholder="Nenhuma / Baratas / Roedores..."></div>
          <div class="mb-2"><label class="form-label">Produtos Utilizados</label><textarea name="produtos_utilizados" class="form-control" rows="2"></textarea></div>
          <div class="mb-2"><label class="form-label">Resultado</label>
            <select name="resultado" class="form-select">
              <option value="eficaz">Eficaz</option><option value="parcialmente_eficaz">Parcialmente Eficaz</option>
              <option value="ineficaz">Ineficaz</option><option value="pendente">Pendente</option>
            </select>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf13-voltar">Voltar</button><button class="btn btn-success" id="qf13-salvar">Salvar</button>`);
        document.getElementById('qf13-voltar').onclick = load;
        document.getElementById('qf13-salvar').onclick = async () => {
          const f = document.getElementById('qf13-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf13-salvar'), async () => {
            const res = await API.post('/qualidade/pragas', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Visita registrada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f14: Estoque de Reagentes ─────────────────────────────────────────────────

  f14Reagentes: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🧴 Estoque de Reagentes', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/reagentes');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar reagentes.'); return; }
      const rows = r.data.map(rg => `<tr class="${rg.estoque_baixo ? 'table-warning' : ''}">
        <td>${escapeHtml(rg.nome)}</td>
        <td>${escapeHtml(rg.fabricante || '—')}</td>
        <td>${rg.saldo_atual} ${escapeHtml(rg.unidade)}</td>
        <td>${rg.estoque_minimo} ${escapeHtml(rg.unidade)}</td>
        <td>${rg.estoque_baixo ? '<span class="badge badge-warning">Baixo</span>' : '<span class="badge badge-success">OK</span>'}</td>
        <td>${_fmtDate(rg.data_validade)}</td>
        <td>
          <button class="btn btn-sm btn-success btn-rg-entrada" data-id="${rg.id}" data-nome="${escapeHtml(rg.nome)}" data-un="${escapeHtml(rg.unidade)}">Entrada</button>
          <button class="btn btn-sm btn-danger ms-1 btn-rg-saida" data-id="${rg.id}" data-nome="${escapeHtml(rg.nome)}" data-un="${escapeHtml(rg.unidade)}">Saída</button>
        </td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Reagente</th><th>Fabricante</th><th>Saldo</th><th>Mínimo</th><th>Status</th><th>Validade</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhum reagente cadastrado.');
      el.addEventListener('click', async (ev) => {
        const btnE = ev.target.closest('.btn-rg-entrada');
        const btnS = ev.target.closest('.btn-rg-saida');
        if (!btnE && !btnS) return;
        const btn = btnE || btnS;
        const tipo = btnE ? 'entrada' : 'saida';
        const id = Number(btn.dataset.id);
        const qtd = parseFloat(prompt(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${btn.dataset.nome} (${btn.dataset.un}):`));
        if (!qtd || isNaN(qtd) || qtd <= 0) return;
        const motivo = prompt('Motivo (opcional):') || '';
        const res = await API.post(`/qualidade/reagentes/${id}/mov`, { tipo, quantidade: qtd, motivo });
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada! Novo saldo: ${res.data.saldo_atual} ${btn.dataset.un}`, 'success');
        load();
      });
      setFooter(`<button class="btn btn-primary" id="qf14-novo">+ Cadastrar Reagente</button>`);
      document.getElementById('qf14-novo').onclick = () => {
        el.innerHTML = `<form id="qf14-form">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Nome do Reagente *</label><input name="nome" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Fabricante</label><input name="fabricante" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Lote Fabricante</label><input name="lote_fabricante" class="form-control"></div>
            <div class="col-4"><label class="form-label">Validade</label><input name="data_validade" type="date" class="form-control"></div>
            <div class="col-4"><label class="form-label">Unidade</label><input name="unidade" class="form-control" value="mL"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Estoque Mínimo</label><input name="estoque_minimo" type="number" step="0.001" class="form-control" value="0"></div>
            <div class="col-6"><label class="form-label">Localização</label><input name="localizacao" class="form-control" placeholder="Ex: Geladeira Lab, Armário 3..."></div>
          </div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf14-voltar">Voltar</button><button class="btn btn-success" id="qf14-salvar">Cadastrar</button>`);
        document.getElementById('qf14-voltar').onclick = load;
        document.getElementById('qf14-salvar').onclick = async () => {
          const f = document.getElementById('qf14-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf14-salvar'), async () => {
            const res = await API.post('/qualidade/reagentes', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Reagente cadastrado!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f15: Calibração de Equipamentos ──────────────────────────────────────────

  f15Calibracoes: async (user) => {
    const { el, setFooter } = _qualModal({ title: '⚙️ Calibração de Equipamentos', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/calibracoes');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar calibrações.'); return; }
      const rows = r.data.map(c => `<tr class="${c.vencida ? 'table-danger' : ''}">
        <td>${escapeHtml(c.equipamento)}</td>
        <td>${escapeHtml(c.numero_patrimonio || '—')}</td>
        <td>${_fmtDate(c.data_calibracao)}</td>
        <td>${c.vencida ? '<span class="badge badge-danger">VENCIDA</span>' : _fmtDate(c.proxima_calibracao)}</td>
        <td>${escapeHtml(c.empresa_calibradora || '—')}</td>
        <td>${escapeHtml(c.certificado || '—')}</td>
        <td>${_badge(c.resultado)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Equipamento</th><th>Patrimônio</th><th>Última Cal.</th><th>Próxima Cal.</th><th>Empresa</th><th>Certificado</th><th>Resultado</th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma calibração registrada.');
      setFooter(`<button class="btn btn-primary" id="qf15-novo">+ Registrar Calibração</button>`);
      document.getElementById('qf15-novo').onclick = () => {
        el.innerHTML = `<form id="qf15-form">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Equipamento *</label><input name="equipamento" class="form-control" required placeholder="Ex: pHmetro, Balança analítica..."></div>
            <div class="col-6"><label class="form-label">Nº Patrimônio</label><input name="numero_patrimonio" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Data Calibração *</label><input name="data_calibracao" type="date" class="form-control" required value="${TODAY()}"></div>
            <div class="col-4"><label class="form-label">Próxima Calibração</label><input name="proxima_calibracao" type="date" class="form-control"></div>
            <div class="col-4"><label class="form-label">Resultado *</label>
              <select name="resultado" class="form-select" required>
                <option value="aprovado">Aprovado</option><option value="condicional">Condicional</option><option value="reprovado">Reprovado</option>
              </select>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Empresa Calibradora</label><input name="empresa_calibradora" class="form-control"></div>
            <div class="col-6"><label class="form-label">Nº Certificado</label><input name="certificado" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf15-voltar">Voltar</button><button class="btn btn-success" id="qf15-salvar">Salvar</button>`);
        document.getElementById('qf15-voltar').onclick = load;
        document.getElementById('qf15-salvar').onclick = async () => {
          const f = document.getElementById('qf15-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf15-salvar'), async () => {
            const res = await API.post('/qualidade/calibracoes', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Calibração registrada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f16: Ver Escala e Datas ───────────────────────────────────────────────────

  f16VerEscala: async (user) => {
    const { el } = _qualModal({ title: '📅 Escala de Qualidade', size: 'lg', body: _spinner() });
    const [rE, rC] = await Promise.all([API.get('/qualidade/escalas'), API.get('/qualidade/calibracoes')]);
    const escalas = (rE && rE.success) ? rE.data : [];
    const calibracoes = (rC && rC.success) ? rC.data.filter(c => c.vencida || (c.proxima_calibracao && new Date(c.proxima_calibracao) <= new Date(Date.now() + 30*24*3600*1000))) : [];
    const rowsE = escalas.map(e => `<tr>
      <td>${escapeHtml(e.nome_exibir || '—')}</td>
      <td>${escapeHtml(e.turno)}</td>
      <td>${_fmtDate(e.data_inicio)}</td>
      <td>${_fmtDate(e.data_fim)}</td>
    </tr>`).join('');
    const rowsC = calibracoes.map(c => `<tr class="${c.vencida ? 'text-danger' : 'text-warning'}">
      <td>${escapeHtml(c.equipamento)}</td>
      <td>${_fmtDate(c.proxima_calibracao)}</td>
      <td>${c.vencida ? 'VENCIDA' : 'Em breve'}</td>
    </tr>`).join('');
    el.innerHTML = `
      <h6 class="mb-2">Escala de Analistas</h6>
      ${rowsE ? `<table class="table table-sm mb-4"><thead><tr><th>Analista</th><th>Turno</th><th>Início</th><th>Fim</th></tr></thead><tbody>${rowsE}</tbody></table>` : _empty('Nenhuma escala cadastrada.')}
      <h6 class="mb-2 mt-3">Calibrações Pendentes / Vencidas</h6>
      ${rowsC ? `<table class="table table-sm"><thead><tr><th>Equipamento</th><th>Próxima Cal.</th><th>Status</th></tr></thead><tbody>${rowsC}</tbody></table>` : '<p class="text-muted small">Nenhuma calibração vencida ou próxima do vencimento.</p>'}`;
  },

  // ── f17: Enviar Solicitação de Reanálise ──────────────────────────────────────

  f17SolicitarReanalise: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🔄 Solicitar Reanálise', size: 'lg', body: _spinner() });
    const r = await API.get('/qualidade/reanalises');
    if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar solicitações.'); return; }
    const minhas = r.data.filter(x => x.solicitante_id === user.id || user.nivel_acesso >= 4);
    const rows = minhas.map(x => `<tr>
      <td>#${x.id}</td>
      <td>${escapeHtml(x.tipo)}</td>
      <td>${escapeHtml(x.lote || '—')}</td>
      <td>${escapeHtml(x.motivo?.substring(0, 40) || '—')}</td>
      <td>${_badge(x.status)}</td>
      <td>${_fmtDate(x.data_solicitacao)}</td>
      <td>${escapeHtml(x.resultado_reanalise?.substring(0, 30) || '—')}</td>
    </tr>`).join('');
    el.innerHTML = rows
      ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
          <th>#</th><th>Tipo</th><th>Lote</th><th>Motivo</th><th>Status</th><th>Data</th><th>Resultado</th>
         </tr></thead><tbody>${rows}</tbody></table></div>`
      : _empty('Nenhuma solicitação de reanálise.');
    setFooter(`<button class="btn btn-primary" id="qf17-nova">+ Nova Solicitação</button>`);
    document.getElementById('qf17-nova').onclick = () => {
      el.innerHTML = `<form id="qf17-form">
        <div class="row g-2 mb-2">
          <div class="col-6"><label class="form-label">Tipo de Análise</label>
            <select name="tipo" class="form-select">
              <option value="recepcao">Recepção de Materiais</option><option value="fq">Físico-Química</option>
              <option value="micro">Microbiológica</option><option value="laudo">Laudo Técnico</option>
              <option value="sensorial">Sensorial</option>
            </select>
          </div>
          <div class="col-6"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
        </div>
        <div class="mb-2"><label class="form-label">ID do Registro Original (opcional)</label><input name="referencia_id" type="number" class="form-control"></div>
        <div class="mb-2"><label class="form-label">Motivo da Reanálise *</label><textarea name="motivo" class="form-control" rows="3" required></textarea></div>
      </form>`;
      setFooter(`<button class="btn btn-success" id="qf17-salvar">Enviar Solicitação</button>`);
      document.getElementById('qf17-salvar').onclick = async () => {
        const f = document.getElementById('qf17-form');
        if (!f.checkValidity()) { f.reportValidity(); return; }
        await _withSubmit(document.getElementById('qf17-salvar'), async () => {
          const res = await API.post('/qualidade/reanalises', Object.fromEntries(new FormData(f)));
          if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
          showToast('Solicitação enviada!', 'success'); QualidadeForms.f17SolicitarReanalise(user);
        });
      };
    };
  },

  // ── f18: Gerenciar Reanálises ─────────────────────────────────────────────────

  f18GerenciarReanalises: async (user) => {
    const { el, setFooter } = _qualModal({ title: '📋 Gerenciar Solicitações de Reanálise', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/reanalises');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar solicitações.'); return; }
      const rows = r.data.map(x => `<tr>
        <td>#${x.id}</td>
        <td>${escapeHtml(x.tipo)}</td>
        <td>${escapeHtml(x.lote || '—')}</td>
        <td>${escapeHtml(x.solicitante_nome || '—')}</td>
        <td>${escapeHtml(x.motivo?.substring(0, 40) || '—')}</td>
        <td>${_badge(x.status)}</td>
        <td>${_fmtDate(x.data_solicitacao)}</td>
        <td>${x.status === 'pendente' || x.status === 'em_andamento'
          ? `<button class="btn btn-sm btn-primary btn-ra-resp" data-id="${x.id}">Responder</button>` : '—'}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>#</th><th>Tipo</th><th>Lote</th><th>Solicitante</th><th>Motivo</th><th>Status</th><th>Data</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma solicitação de reanálise.');
      el.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.btn-ra-resp');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        el.innerHTML = `<form id="qf18-form">
          <div class="mb-2"><label class="form-label">Status *</label>
            <select name="status" class="form-select" required>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="indeferida">Indeferida</option>
            </select>
          </div>
          <div class="mb-2"><label class="form-label">Resultado da Reanálise</label><textarea name="resultado_reanalise" class="form-control" rows="3"></textarea></div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf18-voltar">Voltar</button><button class="btn btn-success" id="qf18-salvar">Salvar</button>`);
        document.getElementById('qf18-voltar').onclick = load;
        document.getElementById('qf18-salvar').onclick = async () => {
          const f = document.getElementById('qf18-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf18-salvar'), async () => {
            const res = await API.put(`/qualidade/reanalises/${id}`, Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Reanálise respondida!', 'success'); load();
          });
        };
      });
    };
    await load();
  },

  // ── f19: Estocagem de MP ──────────────────────────────────────────────────────

  f19EstocagemMP: async (user) => {
    const { el, setFooter } = _qualModal({ title: '📦 Estocagem de MP — Entrada / Saída', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rP] = await Promise.all([API.get('/qualidade/estocagem-mp'), API.get('/qualidade/produtos')]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar registros.'); return; }
      const optsP = ((rP && rP.data) ? rP.data : []).map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
      const rows = r.data.map(e => `<tr>
        <td>${_badge(e.tipo)}</td>
        <td>${escapeHtml(e.produto_nome || '—')}</td>
        <td>${escapeHtml(e.lote || '—')}</td>
        <td>${e.quantidade} ${escapeHtml(e.unidade)}</td>
        <td>${e.temperatura != null ? e.temperatura + '°C' : '—'}</td>
        <td>${escapeHtml(e.fornecedor || '—')}</td>
        <td>${escapeHtml(e.nota_fiscal || '—')}</td>
        <td>${_fmtDateTime(e.criado_em)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Tipo</th><th>Produto</th><th>Lote</th><th>Quantidade</th><th>Temp.</th><th>Fornecedor</th><th>NF</th><th>Data/Hora</th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhum registro de estocagem.');
      setFooter(`
        <button class="btn btn-success me-2" id="qf19-entrada">+ Entrada</button>
        <button class="btn btn-danger" id="qf19-saida">+ Saída</button>`);
      const mostrarForm = (tipo) => {
        el.innerHTML = `<form id="qf19-form">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Produto</label><select name="produto_id" class="form-select"><option value="">—</option>${optsP}</select></div>
            <div class="col-6"><label class="form-label">Lote</label><input name="lote" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Quantidade *</label><input name="quantidade" type="number" step="0.001" class="form-control" required></div>
            <div class="col-4"><label class="form-label">Unidade</label><input name="unidade" class="form-control" value="kg"></div>
            <div class="col-4"><label class="form-label">Temperatura (°C)</label><input name="temperatura" type="number" step="0.1" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Fornecedor</label><input name="fornecedor" class="form-control"></div>
            <div class="col-6"><label class="form-label">Nota Fiscal</label><input name="nota_fiscal" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Local de Armazenagem</label><input name="local_armazenagem" class="form-control"></div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
          <input type="hidden" name="tipo" value="${tipo}">
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf19-voltar">Voltar</button><button class="btn btn-${tipo === 'entrada' ? 'success' : 'danger'}" id="qf19-salvar">Registrar ${tipo === 'entrada' ? 'Entrada' : 'Saída'}</button>`);
        document.getElementById('qf19-voltar').onclick = load;
        document.getElementById('qf19-salvar').onclick = async () => {
          const f = document.getElementById('qf19-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf19-salvar'), async () => {
            const res = await API.post('/qualidade/estocagem-mp', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`, 'success'); load();
          });
        };
      };
      document.getElementById('qf19-entrada').onclick = () => mostrarForm('entrada');
      document.getElementById('qf19-saida').onclick = () => mostrarForm('saida');
    };
    await load();
  },

  // ── f20: Visitas Fiscais ──────────────────────────────────────────────────────

  f20VisitasFiscais: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🏛️ Visitas / Intimações Fiscais', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/visitas-fiscais');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar visitas.'); return; }
      const rows = r.data.map(v => `<tr>
        <td>${_fmtDate(v.data_visita)}</td>
        <td><strong>${escapeHtml(v.orgao)}</strong></td>
        <td>${escapeHtml(v.fiscal_nome || '—')}</td>
        <td>${escapeHtml(v.tipo || '—')}</td>
        <td>${escapeHtml(v.auto_infracao || '—')}</td>
        <td>${_fmtDate(v.prazo_cumprimento)}</td>
        <td>${_badge(v.status)}</td>
        <td>${v.status !== 'cumprido'
          ? `<button class="btn btn-sm btn-success btn-vf-cum" data-id="${v.id}">Cumprir</button>` : '—'}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Data</th><th>Órgão</th><th>Fiscal</th><th>Tipo</th><th>Auto</th><th>Prazo</th><th>Status</th><th></th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma visita fiscal registrada.');
      el.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('.btn-vf-cum');
        if (!btn) return;
        if (!confirm('Marcar como cumprido?')) return;
        const res = await API.patch(`/qualidade/visitas-fiscais/${btn.dataset.id}`, { status: 'cumprido' });
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast('Marcado como cumprido.', 'success'); load();
      });
      setFooter(`<button class="btn btn-primary" id="qf20-nova">+ Registrar Visita</button>`);
      document.getElementById('qf20-nova').onclick = () => {
        el.innerHTML = `<form id="qf20-form">
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Data da Visita *</label><input name="data_visita" type="date" class="form-control" required value="${TODAY()}"></div>
            <div class="col-4"><label class="form-label">Órgão Fiscalizador *</label>
              <select name="orgao" class="form-select" required>
                <option value="SIF">SIF</option><option value="MAPA">MAPA</option>
                <option value="ANVISA">ANVISA</option><option value="VIGILANCIA_SANITARIA">Vigilância Sanitária</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>
            <div class="col-4"><label class="form-label">Tipo</label>
              <select name="tipo" class="form-select">
                <option value="rotina">Rotina</option><option value="especial">Especial</option>
                <option value="reinspecao">Reinspeção</option><option value="intimacao">Intimação</option>
                <option value="embargo">Embargo</option>
              </select>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Nome do Fiscal</label><input name="fiscal_nome" class="form-control"></div>
            <div class="col-6"><label class="form-label">Matrícula</label><input name="fiscal_matricula" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Áreas Inspecionadas</label><textarea name="areas_inspecionadas" class="form-control" rows="2"></textarea></div>
          <div class="mb-2"><label class="form-label">Exigências</label><textarea name="exigencias" class="form-control" rows="3"></textarea></div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Prazo p/ Cumprimento</label><input name="prazo_cumprimento" type="date" class="form-control"></div>
            <div class="col-6"><label class="form-label">Auto de Infração</label><input name="auto_infracao" class="form-control"></div>
          </div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf20-voltar">Voltar</button><button class="btn btn-success" id="qf20-salvar">Salvar</button>`);
        document.getElementById('qf20-voltar').onclick = load;
        document.getElementById('qf20-salvar').onclick = async () => {
          const f = document.getElementById('qf20-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf20-salvar'), async () => {
            const res = await API.post('/qualidade/visitas-fiscais', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Visita registrada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f21: Liberação de Carga Spot ──────────────────────────────────────────────

  f21CargaSpot: async (user) => {
    const { el, setFooter } = _qualModal({ title: '🚛 Liberação de Carga Spot', size: 'xl', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const r = await API.get('/qualidade/cargas-spot');
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar cargas spot.'); return; }
      const rows = r.data.map(c => `<tr>
        <td>${_fmtDateTime(c.data_chegada)}</td>
        <td>${escapeHtml(c.produtor_nome || '—')}</td>
        <td>${escapeHtml(c.placa_veiculo || '—')}</td>
        <td>${c.volume_litros ? c.volume_litros + ' L' : '—'}</td>
        <td>${c.temperatura != null ? c.temperatura + '°C' : '—'}</td>
        <td>${escapeHtml(c.alizarol || '—')}</td>
        <td>${c.acidez || '—'}</td>
        <td>${_badge(c.resultado)}</td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<div style="overflow-x:auto"><table class="table table-sm table-hover"><thead><tr>
            <th>Chegada</th><th>Fornecedor</th><th>Placa</th><th>Volume</th><th>Temp.</th><th>Parâm. A</th><th>Parâm. B</th><th>Resultado</th>
           </tr></thead><tbody>${rows}</tbody></table></div>`
        : _empty('Nenhuma carga spot registrada.');
      setFooter(`<button class="btn btn-primary" id="qf21-nova">+ Registrar Carga Spot</button>`);
      document.getElementById('qf21-nova').onclick = () => {
        el.innerHTML = `<form id="qf21-form">
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">Data/Hora Chegada *</label><input name="data_chegada" type="datetime-local" class="form-control" required value="${new Date().toISOString().slice(0,16)}"></div>
            <div class="col-6"><label class="form-label">Fornecedor</label><input name="produtor_nome" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Placa</label><input name="placa_veiculo" class="form-control" placeholder="ABC-1234"></div>
            <div class="col-4"><label class="form-label">Volume (L)</label><input name="volume_litros" type="number" step="0.01" class="form-control"></div>
            <div class="col-4"><label class="form-label">Temperatura (°C)</label><input name="temperatura" type="number" step="0.1" class="form-control"></div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-4"><label class="form-label">Parâm. A</label>
              <select name="alizarol" class="form-select"><option value="negativo">Negativo</option><option value="positivo">Positivo</option></select>
            </div>
            <div class="col-4"><label class="form-label">Acidez (°D)</label><input name="acidez" type="number" step="0.01" class="form-control"></div>
            <div class="col-4"><label class="form-label">Resultado *</label>
              <select name="resultado" class="form-select" required>
                <option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <div class="mb-2"><label class="form-label">Motivo de Rejeição</label><input name="motivo_rejeicao" class="form-control"></div>
          <div class="mb-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf21-voltar">Voltar</button><button class="btn btn-success" id="qf21-salvar">Registrar</button>`);
        document.getElementById('qf21-voltar').onclick = load;
        document.getElementById('qf21-salvar').onclick = async () => {
          const f = document.getElementById('qf21-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf21-salvar'), async () => {
            const res = await API.post('/qualidade/cargas-spot', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Carga spot registrada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },

  // ── f22: Gerenciar Escalas ────────────────────────────────────────────────────

  f22GerenciarEscalas: async (user) => {
    const { el, setFooter } = _qualModal({ title: '📆 Gerenciar Escalas da Qualidade', size: 'lg', body: _spinner() });
    const load = async () => {
      el.innerHTML = _spinner();
      const [r, rU] = await Promise.all([API.get('/qualidade/escalas'), API.get('/qualidade/usuarios')]);
      if (!r || !r.success) { el.innerHTML = _empty('Erro ao carregar escalas.'); return; }
      const optsU = ((rU && rU.data) ? rU.data : []).map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');
      const rows = r.data.map(e => `<tr>
        <td>${escapeHtml(e.nome_exibir || '—')}</td>
        <td>${escapeHtml(e.turno)}</td>
        <td>${_fmtDate(e.data_inicio)}</td>
        <td>${_fmtDate(e.data_fim)}</td>
        <td><button class="btn btn-danger btn-sm btn-excluir-esc" data-id="${e.id}">Excluir</button></td>
      </tr>`).join('');
      el.innerHTML = rows
        ? `<table class="table table-sm"><thead><tr><th>Analista</th><th>Turno</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
        : _empty('Nenhuma escala cadastrada.');
      el.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('.btn-excluir-esc');
        if (!btn) return;
        if (!confirm('Excluir esta escala?')) return;
        const res = await API.delete(`/qualidade/escalas/${btn.dataset.id}`);
        if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
        showToast('Escala excluída.', 'success'); load();
      });
      setFooter(`<button class="btn btn-primary" id="qf22-nova">+ Nova Escala</button>`);
      document.getElementById('qf22-nova').onclick = () => {
        el.innerHTML = `<form id="qf22-form">
          <div class="mb-2"><label class="form-label">Analista (interno)</label>
            <select name="usuario_id" class="form-select"><option value="">— Externo —</option>${optsU}</select>
          </div>
          <div class="mb-2"><label class="form-label">Nome (externo)</label><input name="nome_externo" class="form-control" placeholder="Deixe em branco se selecionou acima"></div>
          <div class="mb-2"><label class="form-label">Turno *</label>
            <select name="turno" class="form-select" required>
              <option value="manha">Manhã</option><option value="tarde">Tarde</option>
              <option value="noite">Noite</option><option value="integral">Integral</option>
              <option value="plantao">Plantão</option>
            </select>
          </div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label">Início *</label><input name="data_inicio" type="date" class="form-control" required></div>
            <div class="col-6"><label class="form-label">Fim</label><input name="data_fim" type="date" class="form-control"></div>
          </div>
          <div class="mb-2 mt-2"><label class="form-label">Observação</label><textarea name="observacao" class="form-control" rows="2"></textarea></div>
        </form>`;
        setFooter(`<button class="btn btn-secondary me-2" id="qf22-voltar">Voltar</button><button class="btn btn-success" id="qf22-salvar">Salvar</button>`);
        document.getElementById('qf22-voltar').onclick = load;
        document.getElementById('qf22-salvar').onclick = async () => {
          const f = document.getElementById('qf22-form');
          if (!f.checkValidity()) { f.reportValidity(); return; }
          await _withSubmit(document.getElementById('qf22-salvar'), async () => {
            const res = await API.post('/qualidade/escalas', Object.fromEntries(new FormData(f)));
            if (!res || !res.success) { showToast(res?.message || 'Erro.', 'danger'); return; }
            showToast('Escala criada!', 'success'); load();
          });
        };
      };
    };
    await load();
  },
};

window.QualidadeForms = QualidadeForms;
