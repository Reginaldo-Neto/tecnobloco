'use strict';

const S = require('../../services/estoque/EstoqueService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class EstoqueController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recenteMovimentacoes(req, res, next) {
    try { res.json({ success: true, data: await S.recenteMovimentacoes() }); } catch(e) { next(e); }
  }

  // ── Produtos ──────────────────────────────────────────────────────────────────

  async listarProdutos(req, res, next) {
    try { res.json({ success: true, data: await S.listarProdutos(req.query) }); } catch(e) { next(e); }
  }

  async buscarProduto(req, res, next) {
    try { res.json({ success: true, data: await S.buscarProduto(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarProduto(req, res, next) {
    try {
      const data = await S.criarProduto(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'produtos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarProduto(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarProduto(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'produtos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async desativarProduto(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.desativarProduto(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'produtos', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  async atualizarLocalizacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarLocalizacao(req.user.id, id, req.body.localizacao);
      await req.audit(AUDITORIA.ALTERACAO, 'produtos', id, { depois: { localizacao: req.body.localizacao } });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarMinMax(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarMinMax(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'produtos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Movimentações ─────────────────────────────────────────────────────────────

  async listarMovimentacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarMovimentacoes(req.query) }); } catch(e) { next(e); }
  }

  async registrarMovimentacao(req, res, next) {
    try {
      const data = await S.registrarMovimentacao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'movimentacoes_estoque', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Controle de Validade ──────────────────────────────────────────────────────

  async listarControleValidade(req, res, next) {
    try { res.json({ success: true, data: await S.listarControleValidade(req.query) }); } catch(e) { next(e); }
  }

  // ── Bloqueio de Lote ──────────────────────────────────────────────────────────

  async listarBloqueiosLote(req, res, next) {
    try { res.json({ success: true, data: await S.listarBloqueiosLote(req.query) }); } catch(e) { next(e); }
  }

  async bloquearLote(req, res, next) {
    try {
      const data = await S.bloquearLote(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'est_bloqueios_lote', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarBloqueioLote(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarBloqueioLote(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'est_bloqueios_lote', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Inventário ────────────────────────────────────────────────────────────────

  async listarInventarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarInventarios(req.query) }); } catch(e) { next(e); }
  }

  async criarInventario(req, res, next) {
    try {
      const data = await S.criarInventario(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'est_inventarios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async listarItensInventario(req, res, next) {
    try { res.json({ success: true, data: await S.listarItensInventario(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async adicionarItemInventario(req, res, next) {
    try {
      const invId = Number(req.params.id);
      const data = await S.adicionarItemInventario(req.user.id, invId, req.body);
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async contarItemInventario(req, res, next) {
    try {
      const invId  = Number(req.params.id);
      const itemId = Number(req.params.itemId);
      const data = await S.contarItemInventario(req.user.id, invId, itemId, req.body);
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async concluirInventario(req, res, next) {
    try {
      const id = Number(req.params.id);
      const data = await S.concluirInventario(req.user.id, id);
      await req.audit(AUDITORIA.ALTERACAO, 'est_inventarios', id, { depois: { status: 'concluido' } });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Curva ABC / Solicitações ──────────────────────────────────────────────────

  async calcularCurvaABC(req, res, next) {
    try { res.json({ success: true, data: await S.calcularCurvaABC() }); } catch(e) { next(e); }
  }

  async listarSolicitacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarSolicitacoes(req.query) }); } catch(e) { next(e); }
  }

  async atualizarSolicitacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarSolicitacao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'solicitacoes_compra', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async listarOrdensSeparacao(req, res, next) {
    try { res.json({ success: true, data: await S.listarOrdensSeparacao() }); } catch(e) { next(e); }
  }

  async listarPedidosExpedicao(req, res, next) {
    try { res.json({ success: true, data: await S.listarPedidosExpedicao() }); } catch(e) { next(e); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'est_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'est_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarCategorias(req, res, next) {
    try { res.json({ success: true, data: await S.listarCategorias() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new EstoqueController();
