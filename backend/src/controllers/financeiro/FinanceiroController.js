'use strict';

const S = require('../../services/financeiro/FinanceiroService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class FinanceiroController {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async getUltimasTransacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarUltimasTransacoes() }); } catch(e) { next(e); }
  }

  // ── Contas a Pagar ────────────────────────────────────────────────────────────

  async listarContasPagar(req, res, next) {
    try { res.json({ success: true, data: await S.listarContasPagar(req.query) }); } catch(e) { next(e); }
  }

  async criarContaPagar(req, res, next) {
    try {
      const data = await S.criarContaPagar(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'contas_pagar', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarContaPagar(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarContaPagar(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'contas_pagar', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async cancelarContaPagar(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.cancelarContaPagar(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'contas_pagar', id, {});
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Contas a Receber ──────────────────────────────────────────────────────────

  async listarContasReceber(req, res, next) {
    try { res.json({ success: true, data: await S.listarContasReceber(req.query) }); } catch(e) { next(e); }
  }

  async criarContaReceber(req, res, next) {
    try {
      const data = await S.criarContaReceber(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'contas_receber', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarContaReceber(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarContaReceber(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'contas_receber', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
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

  // ── Plano de Contas ───────────────────────────────────────────────────────────

  async listarPlanoContas(req, res, next) {
    try { res.json({ success: true, data: await S.listarPlanoContas(req.query) }); } catch(e) { next(e); }
  }

  async criarConta(req, res, next) {
    try {
      const data = await S.criarConta(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'plano_contas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarConta(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarConta(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'plano_contas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Fluxo de Caixa ────────────────────────────────────────────────────────────

  async getFluxoCaixa(req, res, next) {
    try { res.json({ success: true, data: await S.getFluxoCaixa(req.query) }); } catch(e) { next(e); }
  }

  // ── Conciliação / Movimentos ──────────────────────────────────────────────────

  async listarMovimentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarMovimentos(req.query) }); } catch(e) { next(e); }
  }

  async criarMovimento(req, res, next) {
    try {
      const data = await S.criarMovimento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fin_movimentos_bancarios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async conciliarMovimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.conciliarMovimento(id);
      await req.audit(AUDITORIA.ALTERACAO, 'fin_movimentos_bancarios', id, {});
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Adiantamentos ─────────────────────────────────────────────────────────────

  async listarAdiantamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarAdiantamentos(req.query) }); } catch(e) { next(e); }
  }

  async atualizarAdiantamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarAdiantamento(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'adiantamentos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Centros de Custo ──────────────────────────────────────────────────────────

  async listarCentrosCusto(req, res, next) {
    try { res.json({ success: true, data: await S.listarCentrosCusto(req.query) }); } catch(e) { next(e); }
  }

  async criarCentroCusto(req, res, next) {
    try {
      const data = await S.criarCentroCusto(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fin_centros_custo', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarCentroCusto(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarCentroCusto(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fin_centros_custo', id, { depois: req.body });
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
      await req.audit(AUDITORIA.CRIACAO, 'fin_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'fin_escalas', id, {});
      res.json({ success: true, data });
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

module.exports = new FinanceiroController();
