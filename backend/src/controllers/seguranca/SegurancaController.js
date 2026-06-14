'use strict';

const S = require('../../services/seguranca/SegurancaService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class SegurancaController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesOcorrencias(req, res, next) {
    try { res.json({ success: true, data: await S.recentesOcorrencias() }); } catch(e) { next(e); }
  }

  // ── Ocorrências ───────────────────────────────────────────────────────────────

  async listarOcorrencias(req, res, next) {
    try { res.json({ success: true, data: await S.listarOcorrencias(req.query) }); } catch(e) { next(e); }
  }

  async registrarOcorrencia(req, res, next) {
    try {
      const data = await S.registrarOcorrencia(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ocorrencias_seguranca', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarOcorrencia(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarOcorrencia(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ocorrencias_seguranca', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── CAT ───────────────────────────────────────────────────────────────────────

  async listarCats(req, res, next) {
    try { res.json({ success: true, data: await S.listarCats(req.query) }); } catch(e) { next(e); }
  }

  async criarCat(req, res, next) {
    try {
      const data = await S.criarCat(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'seg_cats', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarCat(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarCat(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'seg_cats', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Inspeções ─────────────────────────────────────────────────────────────────

  async listarInspecoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarInspecoes(req.query) }); } catch(e) { next(e); }
  }

  async criarInspecao(req, res, next) {
    try {
      const data = await S.criarInspecao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'seg_inspecoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async aprovarInspecao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.aprovarInspecao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.APROVACAO, 'seg_inspecoes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Treinamentos ──────────────────────────────────────────────────────────────

  async listarTreinamentosSeg(req, res, next) {
    try { res.json({ success: true, data: await S.listarTreinamentosSeg() }); } catch(e) { next(e); }
  }

  async criarTreinamentoSeg(req, res, next) {
    try {
      const data = await S.criarTreinamentoSeg(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'seg_treinamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'seg_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'seg_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarColaboradores(req, res, next) {
    try { res.json({ success: true, data: await S.listarColaboradores() }); } catch(e) { next(e); }
  }

  async listarDepartamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDepartamentos() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new SegurancaController();
