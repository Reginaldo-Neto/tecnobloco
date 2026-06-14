'use strict';

const router = require('express').Router();
const { authenticate, requireNivel } = require('../middleware/auth.middleware');
const C = require('../controllers/admin/AdminController');

router.get('/stats',    authenticate, requireNivel(6), C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(6), C.recentesLogs.bind(C));

// ── Usuários ──────────────────────────────────────────────────────────────────
router.get('/usuarios',       authenticate, requireNivel(6), C.listarUsuarios.bind(C));
router.get('/usuarios/:id',   authenticate, requireNivel(6), C.buscarUsuario.bind(C));
router.post('/usuarios',      authenticate, requireNivel(7), C.criarUsuario.bind(C));
router.put('/usuarios/:id',   authenticate, requireNivel(6), C.atualizarUsuario.bind(C));

// ── Departamentos ─────────────────────────────────────────────────────────────
router.get('/departamentos',      authenticate, requireNivel(6), C.listarDepartamentos.bind(C));
router.post('/departamentos',     authenticate, requireNivel(7), C.criarDepartamento.bind(C));
router.put('/departamentos/:id',  authenticate, requireNivel(7), C.atualizarDepartamento.bind(C));

// ── Cargos ────────────────────────────────────────────────────────────────────
router.get('/cargos',         authenticate, requireNivel(6), C.listarCargos.bind(C));
router.post('/cargos',        authenticate, requireNivel(7), C.criarCargo.bind(C));
router.put('/cargos/:id',     authenticate, requireNivel(7), C.atualizarCargo.bind(C));

// ── Auditoria ─────────────────────────────────────────────────────────────────
router.get('/auditoria',      authenticate, requireNivel(6), C.listarAuditoria.bind(C));

// ── Bug Reports ───────────────────────────────────────────────────────────────
router.get('/bugs',           authenticate, requireNivel(6), C.listarBugs.bind(C));
router.put('/bugs/:id',       authenticate, requireNivel(6), C.atualizarBug.bind(C));

module.exports = router;
