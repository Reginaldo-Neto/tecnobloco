'use strict';

/**
 * FuncaoCore — Motor de controle de acesso e injeção de modal por função.
 *
 * Dependências: api.js (API), components.js (openModal, escapeHtml)
 *
 * Uso:
 *   FuncaoCore.executar({
 *     titulo:        'Nome da Função',
 *     descricao:     'Descrição detalhada...',
 *     nivelMinimo:    3,           // 0=Menor Aprendiz … 7=Admin
 *     departamentos:  ['TI'],      // null = todos os setores
 *   });
 */

const FuncaoCore = (() => {
  const NIVEL_LABELS = ['Menor Aprendiz','Estagiário','Auxiliar','Operador','Supervisor','Gerente','Diretor','Administrador'];

  function _podeAcessar(user, { nivelMinimo, departamentos }) {
    const nivel = user ? (user.nivel_acesso || 0) : 0;
    const dept  = user ? (user.departamento  || '') : '';

    if (nivel >= 7) return { ok: true };

    if (nivel < nivelMinimo) {
      return {
        ok: false,
        motivo: `Nível insuficiente. Necessário: ${NIVEL_LABELS[nivelMinimo] || nivelMinimo} (≥${nivelMinimo}). `
               + `Seu nível atual: ${NIVEL_LABELS[nivel] || nivel} (${nivel}).`,
      };
    }

    if (departamentos && departamentos.length > 0 && nivel < 6) {
      if (!departamentos.includes(dept)) {
        return {
          ok: false,
          motivo: `Função restrita ao(s) setor(es): ${departamentos.join(', ')}.`,
        };
      }
    }

    return { ok: true };
  }

  function _abrirModalAcessoNegado(motivo) {
    openModal({
      title: '🔒 Acesso Negado',
      size:  'sm',
      body: `
        <div style="text-align:center;padding:24px 8px;">
          <span style="font-size:40px;display:block;margin-bottom:12px;">🔒</span>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(motivo)}</p>
        </div>
      `,
    });
  }

  function _abrirModalDesenvolvimento(titulo, descricao) {
    openModal({
      title: escapeHtml(titulo),
      body: `
        <div style="text-align:center;padding:32px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;">
          <span style="font-size:52px;">🚧</span>
          <p style="color:#f59e0b;font-weight:700;font-size:16px;margin:0;letter-spacing:.3px;">
            Função em desenvolvimento
          </p>
          <p style="color:#64748b;font-size:13px;margin:0;max-width:400px;line-height:1.7;text-align:center;">
            ${escapeHtml(descricao)}
          </p>
        </div>
      `,
    });
  }

  /**
   * Ponto de entrada de qualquer função do sistema.
   * Verifica sessão, nível e setor — se tudo OK, abre o modal.
   *
   * @param {object} config
   * @param {string}   config.titulo
   * @param {string}   config.descricao
   * @param {number}   [config.nivelMinimo=0]
   * @param {string[]|null} [config.departamentos=null]
   */
  function executar(config) {
    if (typeof API === 'undefined' || !API.isAuthenticated()) {
      window.location.href = '/index.html';
      return;
    }

    const user      = API.getUser();
    const resultado = _podeAcessar(user, {
      nivelMinimo:   config.nivelMinimo   ?? 0,
      departamentos: config.departamentos ?? null,
    });

    if (!resultado.ok) {
      _abrirModalAcessoNegado(resultado.motivo);
      return;
    }

    // Se houver um renderer real, usá-lo — caso contrário mostrar modal de desenvolvimento
    if (typeof config.render === 'function') {
      try {
        config.render(user);
      } catch (err) {
        console.error('[FuncaoCore] Erro ao renderizar função:', err);
        if (typeof showToast === 'function') showToast(err.message || 'Erro ao carregar função', 'danger');
      }
    } else {
      _abrirModalDesenvolvimento(
        config.titulo    || 'Função',
        config.descricao || 'Esta função será implementada em breve.'
      );
    }
  }

  return { executar };
})();

window.FuncaoCore = FuncaoCore;
