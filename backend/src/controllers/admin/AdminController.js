'use strict';

const S = require('../../services/admin/AdminService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class AdminController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesLogs(req, res, next) {
    try { res.json({ success: true, data: await S.recentesLogs() }); } catch(e) { next(e); }
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuarios(req.query) }); } catch(e) { next(e); }
  }

  async buscarUsuario(req, res, next) {
    try { res.json({ success: true, data: await S.buscarUsuario(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarUsuario(req, res, next) {
    try {
      const data = await S.criarUsuario(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'usuarios', data.id, { depois: { nome: req.body.nome, email: req.body.email } });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarUsuario(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarUsuario(id, req.body);
      const { senha, ...safe } = req.body;
      await req.audit(AUDITORIA.ALTERACAO, 'usuarios', id, { depois: safe });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Departamentos ─────────────────────────────────────────────────────────────

  async listarDepartamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDepartamentos() }); } catch(e) { next(e); }
  }

  async criarDepartamento(req, res, next) {
    try {
      const data = await S.criarDepartamento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'departamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarDepartamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarDepartamento(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'departamentos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Cargos ────────────────────────────────────────────────────────────────────

  async listarCargos(req, res, next) {
    try { res.json({ success: true, data: await S.listarCargos() }); } catch(e) { next(e); }
  }

  async criarCargo(req, res, next) {
    try {
      const data = await S.criarCargo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'cargos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarCargo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarCargo(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'cargos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Auditoria ─────────────────────────────────────────────────────────────────

  async listarAuditoria(req, res, next) {
    try { res.json({ success: true, data: await S.listarAuditoria(req.query) }); } catch(e) { next(e); }
  }

  // ── Bug Reports ───────────────────────────────────────────────────────────────

  async listarBugs(req, res, next) {
    try { res.json({ success: true, data: await S.listarBugs(req.query) }); } catch(e) { next(e); }
  }

  async atualizarBug(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarBug(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'bug_reports', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }
}

module.exports = new AdminController();
