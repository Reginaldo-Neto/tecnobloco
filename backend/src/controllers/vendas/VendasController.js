'use strict';

const S = require('../../services/vendas/VendasService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class VendasController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesPedidos(req, res, next) {
    try { res.json({ success: true, data: await S.recentesPedidos() }); } catch(e) { next(e); }
  }

  // ── Clientes ──────────────────────────────────────────────────────────────────

  async listarClientes(req, res, next) {
    try { res.json({ success: true, data: await S.listarClientes(req.query) }); } catch(e) { next(e); }
  }

  async buscarCliente(req, res, next) {
    try { res.json({ success: true, data: await S.buscarCliente(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarCliente(req, res, next) {
    try {
      const data = await S.criarCliente(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'clientes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarCliente(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarCliente(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'clientes', id, { depois: req.body });
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
      await req.audit(AUDITORIA.CRIACAO, 'vnd_pedidos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarStatusPedido(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarStatusPedido(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'vnd_pedidos', id, { depois: req.body });
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
      await req.audit(AUDITORIA.CRIACAO, 'vnd_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'vnd_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarProdutos(req, res, next) {
    try { res.json({ success: true, data: await S.listarProdutos() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new VendasController();
