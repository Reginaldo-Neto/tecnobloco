'use strict';

const LimpezaService = require('../../services/limpeza/LimpezaService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class LimpezaController {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.getStats() }); }
    catch (err) { next(err); }
  }

  // ── Solicitações de Limpeza ──────────────────────────────────────────────────

  async listarSolicitacoes(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarSolicitacoes(req.query) }); }
    catch (err) { next(err); }
  }

  async atualizarSolicitacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.atualizarSolicitacao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'solicitacoes_limpeza', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Rotinas ───────────────────────────────────────────────────────────────────

  async listarRotinas(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarRotinas() }); }
    catch (err) { next(err); }
  }

  async criarRotina(req, res, next) {
    try {
      const data = await LimpezaService.criarRotina(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_rotinas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarRotina(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.atualizarRotina(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'limpeza_rotinas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirRotina(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.excluirRotina(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'limpeza_rotinas', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Checklist ─────────────────────────────────────────────────────────────────

  async listarChecklist(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarChecklist(req.query) }); }
    catch (err) { next(err); }
  }

  async registrarChecklist(req, res, next) {
    try {
      const data = await LimpezaService.registrarChecklist(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_checklist_registros', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Resíduos ──────────────────────────────────────────────────────────────────

  async listarResiduos(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarResiduos(req.query) }); }
    catch (err) { next(err); }
  }

  async registrarResiduo(req, res, next) {
    try {
      const data = await LimpezaService.registrarResiduo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_residuos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Caçambas ──────────────────────────────────────────────────────────────────

  async listarCacambas(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarCacambas(req.query) }); }
    catch (err) { next(err); }
  }

  async criarSolicitacaoCacamba(req, res, next) {
    try {
      const data = await LimpezaService.criarSolicitacaoCacamba(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_cacambas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusCacamba(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.atualizarStatusCacamba(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'limpeza_cacambas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Lavagem de Pátio ──────────────────────────────────────────────────────────

  async listarLavagemPatio(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarLavagemPatio(req.query) }); }
    catch (err) { next(err); }
  }

  async criarLavagemPatio(req, res, next) {
    try {
      const data = await LimpezaService.criarLavagemPatio(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_lavagem_patio', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusLavagem(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.atualizarStatusLavagem(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'limpeza_lavagem_patio', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Estoque ───────────────────────────────────────────────────────────────────

  async listarEstoque(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarEstoque() }); }
    catch (err) { next(err); }
  }

  async criarItemEstoque(req, res, next) {
    try {
      const data = await LimpezaService.criarItemEstoque(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_estoque', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async registrarMovimento(req, res, next) {
    try {
      const itemId = Number(req.params.itemId);
      if (!itemId) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.registrarMovimento(req.user.id, itemId, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_estoque_movimentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Descartáveis ──────────────────────────────────────────────────────────────

  async listarDescartaveis(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarDescartaveis(req.query) }); }
    catch (err) { next(err); }
  }

  async registrarConsumo(req, res, next) {
    try {
      const data = await LimpezaService.registrarConsumo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_consumo_descartaveis', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Compras ───────────────────────────────────────────────────────────────────

  async listarCompras(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarCompras() }); }
    catch (err) { next(err); }
  }

  async criarSolicitacaoCompra(req, res, next) {
    try {
      const data = await LimpezaService.criarSolicitacaoCompra(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_compra', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarEscalas() }); }
    catch (err) { next(err); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await LimpezaService.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'limpeza_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await LimpezaService.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'limpeza_escalas', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await LimpezaService.listarUsuariosAtivos() }); }
    catch (err) { next(err); }
  }
}

module.exports = new LimpezaController();
