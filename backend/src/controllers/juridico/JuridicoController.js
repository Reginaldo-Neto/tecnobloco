'use strict';

const S = require('../../services/juridico/JuridicoService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class JuridicoController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesContratos(req, res, next) {
    try { res.json({ success: true, data: await S.recentesContratos() }); } catch(e) { next(e); }
  }

  // ── Contratos ─────────────────────────────────────────────────────────────────

  async listarContratos(req, res, next) {
    try { res.json({ success: true, data: await S.listarContratos(req.query) }); } catch(e) { next(e); }
  }

  async buscarContrato(req, res, next) {
    try { res.json({ success: true, data: await S.buscarContrato(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarContrato(req, res, next) {
    try {
      const data = await S.criarContrato(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'jur_contratos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarContrato(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarContrato(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'jur_contratos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Processos ─────────────────────────────────────────────────────────────────

  async listarProcessos(req, res, next) {
    try { res.json({ success: true, data: await S.listarProcessos(req.query) }); } catch(e) { next(e); }
  }

  async criarProcesso(req, res, next) {
    try {
      const data = await S.criarProcesso(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'jur_processos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarProcesso(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarProcesso(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'jur_processos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Prazos ────────────────────────────────────────────────────────────────────

  async listarPrazos(req, res, next) {
    try { res.json({ success: true, data: await S.listarPrazos(req.query) }); } catch(e) { next(e); }
  }

  async criarPrazo(req, res, next) {
    try {
      const data = await S.criarPrazo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'jur_prazos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarPrazo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarPrazo(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'jur_prazos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'jur_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'jur_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new JuridicoController();
