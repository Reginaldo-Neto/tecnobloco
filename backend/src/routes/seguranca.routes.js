'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/seguranca/SegurancaController');

const SEG = requireDepartamento('Segurança do Trabalho');

router.get('/stats',    authenticate, requireNivel(3), SEG, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(3), SEG, C.recentesOcorrencias.bind(C));

// ── Ocorrências ───────────────────────────────────────────────────────────────
router.get('/ocorrencias',        authenticate, requireNivel(3), SEG, C.listarOcorrencias.bind(C));
router.post('/ocorrencias',       authenticate, requireNivel(3), SEG, C.registrarOcorrencia.bind(C));
router.put('/ocorrencias/:id',    authenticate, requireNivel(4), SEG, C.atualizarOcorrencia.bind(C));

// ── CAT ───────────────────────────────────────────────────────────────────────
router.get('/cats',               authenticate, requireNivel(4), SEG, C.listarCats.bind(C));
router.post('/cats',              authenticate, requireNivel(4), SEG, C.criarCat.bind(C));
router.put('/cats/:id',           authenticate, requireNivel(5), SEG, C.atualizarCat.bind(C));

// ── Inspeções ─────────────────────────────────────────────────────────────────
router.get('/inspecoes',          authenticate, requireNivel(3), SEG, C.listarInspecoes.bind(C));
router.post('/inspecoes',         authenticate, requireNivel(4), SEG, C.criarInspecao.bind(C));
router.put('/inspecoes/:id/aprovar', authenticate, requireNivel(5), SEG, C.aprovarInspecao.bind(C));

// ── Treinamentos ──────────────────────────────────────────────────────────────
router.get('/treinamentos',       authenticate, requireNivel(3), SEG, C.listarTreinamentosSeg.bind(C));
router.post('/treinamentos',      authenticate, requireNivel(4), SEG, C.criarTreinamentoSeg.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',            authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',           authenticate, requireNivel(4), SEG, C.criarEscala.bind(C));
router.delete('/escalas/:id',     authenticate, requireNivel(4), SEG, C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/colaboradores',      authenticate, requireNivel(3), C.listarColaboradores.bind(C));
router.get('/departamentos',      authenticate, requireNivel(3), C.listarDepartamentos.bind(C));
router.get('/usuarios',           authenticate, requireNivel(3), C.listarUsuarios.bind(C));

module.exports = router;
