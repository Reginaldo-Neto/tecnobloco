'use strict';

const S = require('../../services/lavanderia/LavanderiaService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class LavanderiaController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  // ── Entradas ─────────────────────────────────────────────────────────────────

  async listarEntradas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEntradas(req.query) }); } catch(e) { next(e); }
  }

  async criarEntrada(req, res, next) {
    try {
      const data = await S.criarEntrada(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_entradas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarStatusEntrada(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarStatusEntrada(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_entradas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Ciclos de Lavagem ─────────────────────────────────────────────────────────

  async listarCiclos(req, res, next) {
    try { res.json({ success: true, data: await S.listarCiclos(req.query) }); } catch(e) { next(e); }
  }

  async buscarCiclo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      res.json({ success: true, data: await S.buscarCiclo(id) });
    } catch(e) { next(e); }
  }

  async criarCiclo(req, res, next) {
    try {
      const data = await S.criarCiclo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_ciclos_lavagem', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async concluirCiclo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.concluirCiclo(id);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_ciclos_lavagem', id, { depois: { status: 'concluido' } });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Químicos ──────────────────────────────────────────────────────────────────

  async listarQuimicos(req, res, next) {
    try { res.json({ success: true, data: await S.listarQuimicos() }); } catch(e) { next(e); }
  }

  async criarQuimico(req, res, next) {
    try {
      const data = await S.criarQuimico(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_quimicos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarQuimico(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarQuimico(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_quimicos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async registrarUsoQuimico(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.registrarUsoQuimico(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_quimicos_uso', null, { depois: { quimico_id: id, ...req.body } });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Higienizações ─────────────────────────────────────────────────────────────

  async listarHigienizacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarHigienizacoes(req.query) }); } catch(e) { next(e); }
  }

  async criarHigienizacao(req, res, next) {
    try {
      const data = await S.criarHigienizacao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_higienizacoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarStatusHigienizacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarStatusHigienizacao(id, req.body.status);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_higienizacoes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Entregas ──────────────────────────────────────────────────────────────────

  async listarPendentesEntrega(req, res, next) {
    try { res.json({ success: true, data: await S.listarPendentesEntrega() }); } catch(e) { next(e); }
  }

  async registrarEntrega(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.registrarEntrega(req.user.id, id);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_entradas', id, { depois: { status: 'entregue' } });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Estoque de Uniformes ──────────────────────────────────────────────────────

  async listarEstoqueUniformes(req, res, next) {
    try { res.json({ success: true, data: await S.listarEstoqueUniformes(req.query) }); } catch(e) { next(e); }
  }

  async criarItemEstoque(req, res, next) {
    try {
      const data = await S.criarItemEstoque(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_estoque_uniformes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarItemEstoque(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarItemEstoque(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_estoque_uniformes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Descartes ─────────────────────────────────────────────────────────────────

  async listarDescartes(req, res, next) {
    try { res.json({ success: true, data: await S.listarDescartes() }); } catch(e) { next(e); }
  }

  async registrarDescarte(req, res, next) {
    try {
      const data = await S.registrarDescarte(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_descartes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Reparos ───────────────────────────────────────────────────────────────────

  async listarReparos(req, res, next) {
    try { res.json({ success: true, data: await S.listarReparos(req.query) }); } catch(e) { next(e); }
  }

  async criarReparo(req, res, next) {
    try {
      const data = await S.criarReparo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_reparos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarReparo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarReparo(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_reparos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Inventários ───────────────────────────────────────────────────────────────

  async listarInventarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarInventarios() }); } catch(e) { next(e); }
  }

  async buscarInventario(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      res.json({ success: true, data: await S.buscarInventario(id) });
    } catch(e) { next(e); }
  }

  async criarInventario(req, res, next) {
    try {
      const data = await S.criarInventario(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_inventarios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Armários ──────────────────────────────────────────────────────────────────

  async listarArmarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarArmarios(req.query) }); } catch(e) { next(e); }
  }

  async criarArmario(req, res, next) {
    try {
      const data = await S.criarArmario(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_armarios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarArmario(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarArmario(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'lav_armarios', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── EPIs ──────────────────────────────────────────────────────────────────────

  async listarEpisRegistros(req, res, next) {
    try { res.json({ success: true, data: await S.listarEpisRegistros(req.query) }); } catch(e) { next(e); }
  }

  async registrarEpi(req, res, next) {
    try {
      const data = await S.registrarEpi(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_epis_registros', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Solicitações de Higienização ──────────────────────────────────────────────

  async listarSolicitacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarSolicitacoes(req.query) }); } catch(e) { next(e); }
  }

  async atualizarSolicitacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarSolicitacao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'solicitacoes_lavanderia', id, { depois: req.body });
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
      await req.audit(AUDITORIA.CRIACAO, 'lav_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'lav_escalas', id, {});
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Uniformes ─────────────────────────────────────────────────────────────────

  async listarUniformes(req, res, next) {
    try { res.json({ success: true, data: await S.listarUniformes(req.query) }); } catch(e) { next(e); }
  }

  async criarUniforme(req, res, next) {
    try {
      const data = await S.criarUniforme(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'lav_uniformes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }

  async listarDepartamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDepartamentos() }); } catch(e) { next(e); }
  }
}

module.exports = new LavanderiaController();
