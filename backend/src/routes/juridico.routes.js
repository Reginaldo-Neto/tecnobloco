'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/juridico/JuridicoController');

const JUR = requireDepartamento('Jurídico');

router.get('/stats',    authenticate, requireNivel(4), JUR, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(4), JUR, C.recentesContratos.bind(C));

// ── Contratos ─────────────────────────────────────────────────────────────────
router.get('/contratos',      authenticate, requireNivel(4), JUR, C.listarContratos.bind(C));
router.get('/contratos/:id',  authenticate, requireNivel(4), JUR, C.buscarContrato.bind(C));
router.post('/contratos',     authenticate, requireNivel(5), JUR, C.criarContrato.bind(C));
router.put('/contratos/:id',  authenticate, requireNivel(5), JUR, C.atualizarContrato.bind(C));

// ── Processos ─────────────────────────────────────────────────────────────────
router.get('/processos',      authenticate, requireNivel(4), JUR, C.listarProcessos.bind(C));
router.post('/processos',     authenticate, requireNivel(5), JUR, C.criarProcesso.bind(C));
router.put('/processos/:id',  authenticate, requireNivel(5), JUR, C.atualizarProcesso.bind(C));

// ── Prazos ────────────────────────────────────────────────────────────────────
router.get('/prazos',         authenticate, requireNivel(4), JUR, C.listarPrazos.bind(C));
router.post('/prazos',        authenticate, requireNivel(4), JUR, C.criarPrazo.bind(C));
router.put('/prazos/:id',     authenticate, requireNivel(4), JUR, C.atualizarPrazo.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',        authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',       authenticate, requireNivel(5), JUR, C.criarEscala.bind(C));
router.delete('/escalas/:id', authenticate, requireNivel(5), JUR, C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/usuarios',       authenticate, requireNivel(4), C.listarUsuarios.bind(C));

module.exports = router;
