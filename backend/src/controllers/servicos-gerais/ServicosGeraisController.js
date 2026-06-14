'use strict';

const S = require('../../services/servicos-gerais/ServicosGeraisService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class ServicosGeraisController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  // ── Atividades ────────────────────────────────────────────────────────────────

  async listarAtividades(req, res, next) {
    try { res.json({ success: true, data: await S.listarAtividades(req.query) }); } catch(e) { next(e); }
  }

  async criarAtividade(req, res, next) {
    try {
      const data = await S.criarAtividade(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_atividades', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarAtividade(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarAtividade(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sg_atividades', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Ferramentas ───────────────────────────────────────────────────────────────

  async listarFerramentas(req, res, next) {
    try { res.json({ success: true, data: await S.listarFerramentas(req.query) }); } catch(e) { next(e); }
  }

  async criarFerramenta(req, res, next) {
    try {
      const data = await S.criarFerramenta(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_ferramentas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async registrarMovimentoFerramenta(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.registrarMovimentoFerramenta(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_ferramentas_movimentos', data.id, { depois: { ferramenta_id: id, ...req.body } });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Insumos ───────────────────────────────────────────────────────────────────

  async listarInsumos(req, res, next) {
    try { res.json({ success: true, data: await S.listarInsumos() }); } catch(e) { next(e); }
  }

  async criarInsumo(req, res, next) {
    try {
      const data = await S.criarInsumo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_insumos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarInsumo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarInsumo(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sg_insumos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async registrarUsoInsumo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.registrarUsoInsumo(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_insumos_uso', null, { depois: { insumo_id: id, ...req.body } });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Cronograma de Jardinagem ──────────────────────────────────────────────────

  async listarCronogramaJardinagem(req, res, next) {
    try { res.json({ success: true, data: await S.listarCronogramaJardinagem(req.query) }); } catch(e) { next(e); }
  }

  async criarCronograma(req, res, next) {
    try {
      const data = await S.criarCronograma(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_cronograma_jardinagem', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarCronograma(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarCronograma(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sg_cronograma_jardinagem', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirCronograma(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.excluirCronograma(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'sg_cronograma_jardinagem', id, {});
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Solicitações de Apoio ─────────────────────────────────────────────────────

  async listarSolicitacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarSolicitacoes(req.query) }); } catch(e) { next(e); }
  }

  async atualizarSolicitacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarSolicitacao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'solicitacoes_servicos_gerais', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Pendências de Auditoria ───────────────────────────────────────────────────

  async listarPendenciasAuditoria(req, res, next) {
    try { res.json({ success: true, data: await S.listarPendenciasAuditoria(req.query) }); } catch(e) { next(e); }
  }

  async criarPendenciaAuditoria(req, res, next) {
    try {
      const data = await S.criarPendenciaAuditoria(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sg_pendencias_auditoria', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarPendenciaAuditoria(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarPendenciaAuditoria(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sg_pendencias_auditoria', id, { depois: req.body });
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
      await req.audit(AUDITORIA.CRIACAO, 'sg_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'sg_escalas', id, {});
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new ServicosGeraisController();
