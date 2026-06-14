'use strict';

const SacService = require('../../services/sac/SacService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class SacController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await SacService.getStats() }); }
    catch (err) { next(err); }
  }

  // ── Tickets ───────────────────────────────────────────────────────────────────

  async listarTickets(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarTickets(req.query) }); }
    catch (err) { next(err); }
  }

  async buscarTicket(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      res.json({ success: true, data: await SacService.buscarTicket(id) });
    } catch (err) { next(err); }
  }

  async criarTicket(req, res, next) {
    try {
      const data = await SacService.criarTicket(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_tickets', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusTicket(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.atualizarStatusTicket(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sac_tickets', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async adicionarComentario(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.adicionarComentario(req.user.id, id, req.body.comentario);
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async vincularLote(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.vincularLote(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sac_tickets', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Atendimentos Avulsos ──────────────────────────────────────────────────────

  async listarAtendimentosAvulsos(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarAtendimentosAvulsos(req.query) }); }
    catch (err) { next(err); }
  }

  async registrarAtendimentoAvulso(req, res, next) {
    try {
      const data = await SacService.registrarAtendimentoAvulso(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_atendimentos_avulsos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Motivos ───────────────────────────────────────────────────────────────────

  async listarMotivos(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarMotivos() }); }
    catch (err) { next(err); }
  }

  async criarMotivo(req, res, next) {
    try {
      const data = await SacService.criarMotivo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_motivos_reclamacao', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirMotivo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.excluirMotivo(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'sac_motivos_reclamacao', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Garantias ─────────────────────────────────────────────────────────────────

  async listarGarantias(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarGarantias(req.query) }); }
    catch (err) { next(err); }
  }

  async criarGarantia(req, res, next) {
    try {
      const data = await SacService.criarGarantia(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_garantias', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async responderGarantia(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.responderGarantia(req.user.id, id, req.body);
      await req.audit(AUDITORIA.APROVACAO, 'sac_garantias', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Recall ────────────────────────────────────────────────────────────────────

  async listarRecall(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarRecall() }); }
    catch (err) { next(err); }
  }

  async criarRecall(req, res, next) {
    try {
      const data = await SacService.criarRecall(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_recall', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusRecall(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.atualizarStatusRecall(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sac_recall', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Templates ─────────────────────────────────────────────────────────────────

  async listarTemplates(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarTemplates() }); }
    catch (err) { next(err); }
  }

  async buscarTemplate(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      res.json({ success: true, data: await SacService.buscarTemplate(id) });
    } catch (err) { next(err); }
  }

  async criarTemplate(req, res, next) {
    try {
      const data = await SacService.criarTemplate(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_templates_resposta', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarTemplate(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.atualizarTemplate(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sac_templates_resposta', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirTemplate(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.excluirTemplate(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'sac_templates_resposta', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Base de Conhecimento ──────────────────────────────────────────────────────

  async listarBaseConhecimento(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarBaseConhecimento(req.query) }); }
    catch (err) { next(err); }
  }

  async buscarArtigoConhecimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      res.json({ success: true, data: await SacService.buscarArtigoConhecimento(id) });
    } catch (err) { next(err); }
  }

  async criarArtigoConhecimento(req, res, next) {
    try {
      const data = await SacService.criarArtigoConhecimento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_base_conhecimento', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarArtigoConhecimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.atualizarArtigoConhecimento(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'sac_base_conhecimento', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirArtigoConhecimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.excluirArtigoConhecimento(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'sac_base_conhecimento', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarEscalas() }); }
    catch (err) { next(err); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await SacService.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await SacService.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'sac_escalas', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Comunicados ───────────────────────────────────────────────────────────────

  async listarComunicados(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarComunicados() }); }
    catch (err) { next(err); }
  }

  async criarComunicado(req, res, next) {
    try {
      const data = await SacService.criarComunicado(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'sac_comunicados', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── SLA / NPS ─────────────────────────────────────────────────────────────────

  async relatorioSLA(req, res, next) {
    try { res.json({ success: true, data: await SacService.relatorioSLA() }); }
    catch (err) { next(err); }
  }

  async getNPS(req, res, next) {
    try { res.json({ success: true, data: await SacService.getNPS() }); }
    catch (err) { next(err); }
  }

  // ── Histórico do Cliente ──────────────────────────────────────────────────────

  async historicoCliente(req, res, next) {
    try {
      const nome = req.query.cliente_nome || '';
      res.json({ success: true, data: await SacService.historicoCliente(nome) });
    } catch (err) { next(err); }
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await SacService.listarUsuariosAtivos() }); }
    catch (err) { next(err); }
  }
}

module.exports = new SacController();
