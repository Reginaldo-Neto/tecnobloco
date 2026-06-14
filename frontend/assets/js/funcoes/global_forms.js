'use strict';

function _spinner() {
  return '<div class="page-loader"><span class="spinner"></span></div>';
}

function _empty(msg) {
  return `<div class="empty-state"><span class="empty-state-icon">📭</span><span class="empty-state-title">${escapeHtml(msg || 'Nenhum item encontrado.')}</span></div>`;
}

function _badge(status) {
  const map = {
    ativo: 'success', inativo: 'secondary',
    aberto: 'info', em_analise: 'warning', resolvido: 'success', fechado: 'secondary',
    CRIACAO: 'success', ALTERACAO: 'warning', EXCLUSAO: 'danger', LOGIN: 'info',
  };
  const cls = map[status] || 'secondary';
  return `<span class="badge bg-${cls}">${escapeHtml(String(status || '—'))}</span>`;
}

function _fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function _withSubmit(btn, fn) {
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Aguarde...';
  try { await fn(); } finally { btn.disabled = false; btn.textContent = orig; }
}

window._spinner    = _spinner;
window._empty      = _empty;
window._badge      = _badge;
window._fmtDate    = _fmtDate;
window._withSubmit = _withSubmit;
