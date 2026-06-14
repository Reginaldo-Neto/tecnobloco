'use strict';

/**
 * Tecnobloco ERP — API Wrapper
 * Handles all HTTP communication with the backend.
 * Token and user data are stored in localStorage.
 */
const API = (() => {
  // Regex para validar endereço IP (IPv4) ou hostname simples (letras, dígitos, hífens)
  // Impede que um valor malicioso em tb_server redirecione chamadas para outro servidor
  const _SAFE_HOST = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]{0,253}[a-zA-Z0-9]$|^localhost$/;

  /**
   * Returns the base API URL.
   * Reads 'tb_server' from localStorage (validated host only);
   * falls back to current origin so the app works when
   * served from the same host as the backend.
   */
  function getBase() {
    const raw = (localStorage.getItem('tb_server') || '').trim();
    // Valida o host antes de usar para evitar redirecionamento malicioso
    if (raw && _SAFE_HOST.test(raw)) {
      return `http://${raw}:3001/api`;
    }
    return '/api';
  }

  function getToken() {
    return localStorage.getItem('tb_token');
  }

  /**
   * Core request helper.
   * Automatically injects Authorization header when a token exists.
   * On 401, clears the session and redirects to login.
   */
  async function request(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);

    try {
      const res  = await fetch(getBase() + endpoint, opts);
      const data = await res.json();

      if (res.status === 401) {
        _clearAndRedirect();
        return { success: false, message: 'Sessão expirada. Redirecionando...' };
      }

      if (!res.ok) throw new Error(data.message || 'Erro desconhecido');
      return data;
    } catch (err) {
      if (err.name === 'TypeError') throw new Error('Sem conexão com o servidor');
      throw err;
    }
  }

  function _clearAndRedirect() {
    localStorage.removeItem('tb_token');
    localStorage.removeItem('tb_user');
    window.location.href = '/index.html';
  }

  return {
    // ── HTTP verbs ─────────────────────────────────────────────
    get:    (ep)       => request('GET',    ep),
    post:   (ep, body) => request('POST',   ep, body),
    put:    (ep, body) => request('PUT',    ep, body),
    patch:  (ep, body) => request('PATCH',  ep, body),
    delete: (ep)       => request('DELETE', ep),

    // ── Auth helpers ───────────────────────────────────────────
    getToken,
    getBase,

    isAuthenticated: () => !!getToken(),

    getUser: () => {
      try {
        return JSON.parse(localStorage.getItem('tb_user'));
      } catch {
        return null;
      }
    },

    setSession: (token, user) => {
      localStorage.setItem('tb_token', token);
      localStorage.setItem('tb_user', JSON.stringify(user));
    },

    clearSession: () => {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_user');
    },

    // ── Convenience: login + logout ────────────────────────────
    /**
     * Performs login request.
     * On success, persists token + user and returns the response data.
     * @param {string} identifier  CPF or email
     * @param {string} senha
     */
    login: async (identifier, senha) => {
      const data = await request('POST', '/auth/login', { identifier, senha });
      if (data && data.token) {
        API.setSession(data.token, data.usuario);
      }
      return data;
    },

    /**
     * Calls the logout endpoint (for audit logging), then clears local session.
     * Silently ignores network errors — session is cleared regardless.
     */
    logout: async () => {
      try {
        await request('POST', '/auth/logout', null);
      } catch {
        // Erros de rede não impedem o logout local
      }
      _clearAndRedirect();
    },

    // ── Server health check ────────────────────────────────────
    /**
     * Pings /api/health without requiring authentication.
     * Returns true if server is reachable.
     */
    health: async () => {
      try {
        const res = await fetch(getBase() + '/health', {
          method: 'GET',
          signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    // ── Security Challenge ─────────────────────────────────────
    /**
     * Solicita um novo desafio de segurança ao servidor.
     * @returns {{ challengeId, encoded, shift, expiresAt, wordLen }}
     */
    getChallenge: () => request('GET', '/auth/challenge'),

    /**
     * Envia a resposta do desafio de segurança.
     * @param {string} challengeId
     * @param {string} answer
     * @returns {{ success, forceLogout, message, attemptsLeft? }}
     */
    verifyChallenge: (challengeId, answer) =>
      request('POST', '/auth/verify-challenge', { challengeId, answer }),
  };
})();
