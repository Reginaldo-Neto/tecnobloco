'use strict';

const AuthService = require('../../services/auth/AuthService');
const ChallengeService = require('../../services/auth/ChallengeService');
const { AUDITORIA, HTTP } = require('../../../config/constants');

class AuthController {
  async login(req, res, next) {
    try {
      const { identifier, senha } = req.body;

      // Validação de tipos e comprimento máximo (antes de qualquer processamento)
      if (!identifier || typeof identifier !== 'string' ||
          identifier.trim().length === 0 || identifier.length > 254) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'CPF ou e-mail inválido',
        });
      }
      if (!senha || typeof senha !== 'string' ||
          senha.length === 0 || senha.length > 128) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Senha inválida',
        });
      }

      const ip = req.ip || req.socket?.remoteAddress;
      const { token, usuario } = await AuthService.login(identifier.trim(), senha, ip);

      await req.audit(AUDITORIA.LOGIN, 'usuarios', usuario.id, {
        depois: { ip, nivel: usuario.nivel_acesso },
      });

      res.json({ success: true, token, usuario });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const usuario = await AuthService.me(req.user.id);
      res.json({ success: true, usuario });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await req.audit(AUDITORIA.LOGOUT, 'usuarios', req.user.id);
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (err) {
      next(err);
    }
  }

  async alterarSenha(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;

      if (!senhaAtual || typeof senhaAtual !== 'string' || senhaAtual.length > 128) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Informe a senha atual',
        });
      }
      if (!novaSenha || typeof novaSenha !== 'string') {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Informe a nova senha',
        });
      }

      await AuthService.alterarSenha(req.user.id, senhaAtual, novaSenha);

      await req.audit(AUDITORIA.ALTERACAO, 'usuarios', req.user.id, {
        depois: { campo: 'senha_hash' },
      });

      res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (err) {
      next(err);
    }
  }

  // ── Security Challenge ─────────────────────────────────────────────────────

  /**
   * GET /api/auth/challenge
   * Gera um novo desafio ROT-N para o usuário autenticado.
   */
  async getChallenge(req, res, next) {
    try {
      const challenge = ChallengeService.generate(req.user.id);
      res.json({ success: true, ...challenge });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/verify-challenge
   * Verifica a resposta do usuário ao desafio.
   * Retorna { success, forceLogout, message, attemptsLeft? }
   */
  async verifyChallenge(req, res, next) {
    try {
      const { challengeId, answer } = req.body;

      if (!challengeId || typeof challengeId !== 'string' || challengeId.length > 64) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'challengeId inválido',
        });
      }
      if (answer === undefined || answer === null || typeof answer !== 'string' || answer.length > 50) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Resposta inválida',
        });
      }

      const result = ChallengeService.verify(challengeId, answer, req.user.id);

      if (result.forceLogout) {
        await req.audit(AUDITORIA.ACESSO_NEGADO, 'usuarios', req.user.id, {
          depois: { motivo: 'desafio_falhou', detalhe: result.message },
        });
      }

      res.json({
        success:      result.ok,
        forceLogout:  result.forceLogout,
        message:      result.message,
        attemptsLeft: result.attemptsLeft,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
