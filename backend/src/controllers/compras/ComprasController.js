'use strict';

const S = require('../../services/compras/ComprasService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class ComprasController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesPedidos(req, res, next) {
    try { res.json({ success: true, data: await S.recentesPedidos() }); } catch(e) { next(e); }
  }

  // ── Fornecedores ──────────────────────────────────────────────────────────────

  async listarFornecedores(req, res, next) {
    try { res.json({ success: true, data: await S.listarFornecedores(req.query) }); } catch(e) { next(e); }
  }

  async criarFornecedor(req, res, next) {
    try {
      const data = await S.criarFornecedor(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fornecedores', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarFornecedor(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarFornecedor(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fornecedores', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Pedidos ───────────────────────────────────────────────────────────────────

  async listarPedidos(req, res, next) {
    try { res.json({ success: true, data: await S.listarPedidos(req.query) }); } catch(e) { next(e); }
  }

  async buscarPedido(req, res, next) {
    try { res.json({ success: true, data: await S.buscarPedido(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarPedido(req, res, next) {
    try {
      const data = await S.criarPedido(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pedidos_compra', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarStatusPedido(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarStatusPedido(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'pedidos_compra', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async receberMercadoria(req, res, next) {
    try {
      const id = Number(req.params.id);
      const data = await S.receberMercadoria(req.user.id, id);
      await req.audit(AUDITORIA.ALTERACAO, 'pedidos_compra', id, { depois: { status: 'recebido' } });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Cotações ──────────────────────────────────────────────────────────────────

  async listarCotacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarCotacoes(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarCotacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      const data = await S.criarCotacao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'com_cotacoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Solicitações ──────────────────────────────────────────────────────────────

  async listarSolicitacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarSolicitacoes(req.query) }); } catch(e) { next(e); }
  }

  async gerarPedidoDeSolicitacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      const data = await S.gerarPedidoDeSolicitacao(req.user.id, id);
      await req.audit(AUDITORIA.CRIACAO, 'pedidos_compra', data.id, {});
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
      await req.audit(AUDITORIA.CRIACAO, 'com_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'com_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new ComprasController();
