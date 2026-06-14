'use strict';

const S = require('../../services/qualidade/QualidadeService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class QualidadeController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesLaudos(req, res, next) {
    try { res.json({ success: true, data: await S.recentesLaudos() }); } catch(e) { next(e); }
  }

  // ── f01: Análise de Recepção ──────────────────────────────────────────────────

  async listarAnalises(req, res, next) {
    try { res.json({ success: true, data: await S.listarAnalises(req.query) }); } catch(e) { next(e); }
  }

  async registrarAnalise(req, res, next) {
    try {
      const data = await S.registrarAnalise(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_analises_leite', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarAnalise(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarAnalise(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_analises_leite', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f02: Análises Físico-Químicas ─────────────────────────────────────────────

  async listarAnalisesFQ(req, res, next) {
    try { res.json({ success: true, data: await S.listarAnalisesFQ(req.query) }); } catch(e) { next(e); }
  }

  async registrarAnaliseFQ(req, res, next) {
    try {
      const data = await S.registrarAnaliseFQ(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_analises_fq', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f03: Análises Microbiológicas ─────────────────────────────────────────────

  async listarAnalisesMicro(req, res, next) {
    try { res.json({ success: true, data: await S.listarAnalisesMicro(req.query) }); } catch(e) { next(e); }
  }

  async registrarAnaliseMicro(req, res, next) {
    try {
      const data = await S.registrarAnaliseMicro(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_analises_micro', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f04: Monitoramento de Antibióticos ────────────────────────────────────────

  async listarAntibioticos(req, res, next) {
    try { res.json({ success: true, data: await S.listarAntibioticos(req.query) }); } catch(e) { next(e); }
  }

  async registrarAntibiotico(req, res, next) {
    try {
      const data = await S.registrarAntibiotico(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_antibioticos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f05: Liberação de Lotes ───────────────────────────────────────────────────

  async listarLiberacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarLiberacoes(req.query) }); } catch(e) { next(e); }
  }

  async registrarLote(req, res, next) {
    try {
      const data = await S.registrarLote(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_liberacao_lotes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarStatusLote(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarStatusLote(id, req.user.id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_liberacao_lotes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f06: Não Conformidades ────────────────────────────────────────────────────

  async listarNC(req, res, next) {
    try { res.json({ success: true, data: await S.listarNC(req.query) }); } catch(e) { next(e); }
  }

  async criarNC(req, res, next) {
    try {
      const data = await S.criarNC(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_nao_conformidades', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarNC(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarNC(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_nao_conformidades', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f07: Análise Sensorial ────────────────────────────────────────────────────

  async listarAnalisesSensoriais(req, res, next) {
    try { res.json({ success: true, data: await S.listarAnalisesSensoriais(req.query) }); } catch(e) { next(e); }
  }

  async registrarAnaliseSensorial(req, res, next) {
    try {
      const data = await S.registrarAnaliseSensorial(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_analises_sensoriais', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f08: Shelf-Life ───────────────────────────────────────────────────────────

  async listarShelfLife(req, res, next) {
    try { res.json({ success: true, data: await S.listarShelfLife(req.query) }); } catch(e) { next(e); }
  }

  async registrarShelfLife(req, res, next) {
    try {
      const data = await S.registrarShelfLife(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_shelf_life', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarShelfLife(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarShelfLife(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_shelf_life', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f09: Laudos ───────────────────────────────────────────────────────────────

  async listarLaudos(req, res, next) {
    try { res.json({ success: true, data: await S.listarLaudos(req.query) }); } catch(e) { next(e); }
  }

  async criarLaudo(req, res, next) {
    try {
      const data = await S.criarLaudo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'laudos_qualidade', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarLaudo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarLaudo(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'laudos_qualidade', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f10: Amostras de Retenção ─────────────────────────────────────────────────

  async listarAmostras(req, res, next) {
    try { res.json({ success: true, data: await S.listarAmostras(req.query) }); } catch(e) { next(e); }
  }

  async registrarAmostra(req, res, next) {
    try {
      const data = await S.registrarAmostra(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_amostras_retencao', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarAmostra(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarAmostra(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_amostras_retencao', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f11: Controle de Águas e Efluentes ───────────────────────────────────────

  async listarAguas(req, res, next) {
    try { res.json({ success: true, data: await S.listarAguas(req.query) }); } catch(e) { next(e); }
  }

  async registrarAgua(req, res, next) {
    try {
      const data = await S.registrarAgua(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_controle_aguas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f12: Swab Test ────────────────────────────────────────────────────────────

  async listarSwabs(req, res, next) {
    try { res.json({ success: true, data: await S.listarSwabs(req.query) }); } catch(e) { next(e); }
  }

  async registrarSwab(req, res, next) {
    try {
      const data = await S.registrarSwab(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_monitoramento_ambiental', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f13: Controle de Pragas ───────────────────────────────────────────────────

  async listarPragas(req, res, next) {
    try { res.json({ success: true, data: await S.listarPragas(req.query) }); } catch(e) { next(e); }
  }

  async registrarPraga(req, res, next) {
    try {
      const data = await S.registrarPraga(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_controle_pragas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f14: Estoque de Reagentes ─────────────────────────────────────────────────

  async listarReagentes(req, res, next) {
    try { res.json({ success: true, data: await S.listarReagentes(req.query) }); } catch(e) { next(e); }
  }

  async cadastrarReagente(req, res, next) {
    try {
      const data = await S.cadastrarReagente(req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_reagentes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async movimentarReagente(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.movimentarReagente(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_reagentes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f15: Calibração ───────────────────────────────────────────────────────────

  async listarCalibracoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarCalibracoes(req.query) }); } catch(e) { next(e); }
  }

  async registrarCalibracao(req, res, next) {
    try {
      const data = await S.registrarCalibracao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_calibracoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f16/f22: Escalas ──────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'qua_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── f17: Solicitar Reanálise ──────────────────────────────────────────────────

  async listarReanalises(req, res, next) {
    try { res.json({ success: true, data: await S.listarReanalises(req.query) }); } catch(e) { next(e); }
  }

  async solicitarReanalise(req, res, next) {
    try {
      const data = await S.solicitarReanalise(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_reanalises', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f18: Gerenciar Reanálises ─────────────────────────────────────────────────

  async responderReanalise(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.responderReanalise(id, req.user.id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_reanalises', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f19: Estocagem de MP ──────────────────────────────────────────────────────

  async listarEstocagemMP(req, res, next) {
    try { res.json({ success: true, data: await S.listarEstocagemMP(req.query) }); } catch(e) { next(e); }
  }

  async registrarEstocagemMP(req, res, next) {
    try {
      const data = await S.registrarEstocagemMP(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_estocagem_mp', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f20: Visitas Fiscais ──────────────────────────────────────────────────────

  async listarVisitasFiscais(req, res, next) {
    try { res.json({ success: true, data: await S.listarVisitasFiscais(req.query) }); } catch(e) { next(e); }
  }

  async registrarVisitaFiscal(req, res, next) {
    try {
      const data = await S.registrarVisitaFiscal(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_visitas_fiscais', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarVisitaFiscal(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarVisitaFiscal(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'qua_visitas_fiscais', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── f21: Carga Spot ───────────────────────────────────────────────────────────

  async listarCargasSpot(req, res, next) {
    try { res.json({ success: true, data: await S.listarCargasSpot(req.query) }); } catch(e) { next(e); }
  }

  async registrarCargaSpot(req, res, next) {
    try {
      const data = await S.registrarCargaSpot(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'qua_cargas_spot', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarProdutos(req, res, next) {
    try { res.json({ success: true, data: await S.listarProdutos() }); } catch(e) { next(e); }
  }

  async listarDepartamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDepartamentos() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }
}

module.exports = new QualidadeController();
