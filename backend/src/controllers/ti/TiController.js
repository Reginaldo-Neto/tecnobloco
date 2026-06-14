'use strict';

const TiService = require('../../services/ti/TiService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class TiController {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats(req, res, next) {
    try {
      const data = await TiService.getStats();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Chamados ─────────────────────────────────────────────────────────────────

  async listarChamados(req, res, next) {
    try {
      const data = await TiService.listarChamados(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async meusChamados(req, res, next) {
    try {
      const data = await TiService.meusChamados(req.user.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async buscarChamado(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.buscarChamado(id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarChamado(req, res, next) {
    try {
      const data = await TiService.criarChamado(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ti_chamados', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusChamado(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.atualizarStatusChamado(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ti_chamados', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async adicionarComentario(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.adicionarComentario(id, req.user.id, req.body.comentario);
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Base de Conhecimento ──────────────────────────────────────────────────────

  async listarBaseConhecimento(req, res, next) {
    try {
      const data = await TiService.listarBaseConhecimento(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async buscarArtigoConhecimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.buscarArtigoConhecimento(id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarArtigoConhecimento(req, res, next) {
    try {
      const data = await TiService.criarArtigoConhecimento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ti_base_conhecimento', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarArtigoConhecimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.atualizarArtigoConhecimento(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ti_base_conhecimento', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirArtigoConhecimento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.excluirArtigoConhecimento(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'ti_base_conhecimento', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Ativos ────────────────────────────────────────────────────────────────────

  async listarAtivos(req, res, next) {
    try {
      const data = await TiService.listarAtivos(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async buscarAtivo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.buscarAtivo(id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarAtivo(req, res, next) {
    try {
      const data = await TiService.criarAtivo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ti_ativos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarAtivo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.atualizarAtivo(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ti_ativos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async movimentarAtivo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.movimentarAtivo(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ti_ativos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Bugs ─────────────────────────────────────────────────────────────────────

  async buscarBug(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.buscarBug(id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async listarBugs(req, res, next) {
    try {
      const data = await TiService.listarBugs(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusBug(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.atualizarStatusBug(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ti_bugs', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try {
      const data = await TiService.listarEscalas();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await TiService.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ti_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'ti_escalas', id, {});
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Solicitações de Exclusão ──────────────────────────────────────────────────

  async listarSolicitacoesExclusao(req, res, next) {
    try {
      const data = await TiService.listarSolicitacoesExclusao(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarSolicitacaoExclusao(req, res, next) {
    try {
      const data = await TiService.criarSolicitacaoExclusao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ti_solicitacoes_exclusao', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async responderSolicitacaoExclusao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.responderSolicitacaoExclusao(req.user.id, id, req.body);
      await req.audit(AUDITORIA.APROVACAO, 'ti_solicitacoes_exclusao', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Reset Senha ───────────────────────────────────────────────────────────────

  async resetarSenha(req, res, next) {
    try {
      const targetId = Number(req.params.id);
      if (!targetId || isNaN(targetId)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await TiService.resetarSenhaUsuario(req.user.id, targetId);
      await req.audit(AUDITORIA.ALTERACAO, 'usuarios', targetId, { depois: { acao: 'reset_senha' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try {
      const data = await TiService.listarUsuariosAtivos();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new TiController();
