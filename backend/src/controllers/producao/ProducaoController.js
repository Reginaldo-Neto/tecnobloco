'use strict';

const S = require('../../services/producao/ProducaoService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class ProducaoController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  // ── Ordens de Produção ────────────────────────────────────────────────────────

  async listarOrdens(req, res, next) {
    try { res.json({ success: true, data: await S.listarOrdens(req.query) }); } catch(e) { next(e); }
  }

  async buscarOrdem(req, res, next) {
    try { res.json({ success: true, data: await S.buscarOrdem(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarOrdem(req, res, next) {
    try {
      const data = await S.criarOrdem(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ordens_producao', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarOrdem(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarOrdem(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ordens_producao', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Apontamentos ──────────────────────────────────────────────────────────────

  async listarApontamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarApontamentos(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarApontamento(req, res, next) {
    try {
      const data = await S.criarApontamento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pro_apontamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Controle de Temperaturas ──────────────────────────────────────────────────

  async listarTemperaturas(req, res, next) {
    try { res.json({ success: true, data: await S.listarTemperaturas(req.query) }); } catch(e) { next(e); }
  }

  async registrarTemperatura(req, res, next) {
    try {
      const data = await S.registrarTemperatura(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pro_controle_temperaturas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Higienizações ─────────────────────────────────────────────────────────────

  async listarHigienizacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarHigienizacoes(req.query) }); } catch(e) { next(e); }
  }

  async registrarHigienizacao(req, res, next) {
    try {
      const data = await S.registrarHigienizacao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pro_higienizacoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarHigienizacao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarHigienizacao(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'pro_higienizacoes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Perdas ────────────────────────────────────────────────────────────────────

  async listarPerdas(req, res, next) {
    try { res.json({ success: true, data: await S.listarPerdas(req.query) }); } catch(e) { next(e); }
  }

  async registrarPerda(req, res, next) {
    try {
      const data = await S.registrarPerda(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pro_perdas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Indicadores e Rastreabilidade ─────────────────────────────────────────────

  async getIndicadoresOEE(req, res, next) {
    try { res.json({ success: true, data: await S.getIndicadoresOEE(req.query) }); } catch(e) { next(e); }
  }

  async rastrearLote(req, res, next) {
    try { res.json({ success: true, data: await S.rastrearLote(req.params.lote) }); } catch(e) { next(e); }
  }

  async listarPendenciasAuditoria(req, res, next) {
    try { res.json({ success: true, data: await S.listarPendenciasAuditoria() }); } catch(e) { next(e); }
  }

  // ── Manutenção / Insumos ──────────────────────────────────────────────────────

  async criarSolicitacaoManutencao(req, res, next) {
    try {
      const data = await S.criarSolicitacaoManutencao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ordens_servico', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async listarConsumoInsumos(req, res, next) {
    try { res.json({ success: true, data: await S.listarConsumoInsumos(req.query) }); } catch(e) { next(e); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pro_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'pro_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarEquipamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarEquipamentos() }); } catch(e) { next(e); }
  }

  async listarProdutos(req, res, next) {
    try { res.json({ success: true, data: await S.listarProdutos() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new ProducaoController();
