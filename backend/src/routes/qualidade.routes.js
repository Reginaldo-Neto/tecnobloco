'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/qualidade/QualidadeController');

const QUA = requireDepartamento('Qualidade');

router.get('/stats',    authenticate, requireNivel(2), QUA, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(2), QUA, C.recentesLaudos.bind(C));

// ── f01: Análise de Recepção ──────────────────────────────────────────────────
router.get('/analises-leite',      authenticate, requireNivel(2), QUA, C.listarAnalises.bind(C));
router.post('/analises-leite',     authenticate, requireNivel(2), QUA, C.registrarAnalise.bind(C));
router.put('/analises-leite/:id',  authenticate, requireNivel(4), QUA, C.atualizarAnalise.bind(C));

// ── f02: Análises Físico-Químicas ─────────────────────────────────────────────
router.get('/analises-fq',         authenticate, requireNivel(3), QUA, C.listarAnalisesFQ.bind(C));
router.post('/analises-fq',        authenticate, requireNivel(3), QUA, C.registrarAnaliseFQ.bind(C));

// ── f03: Análises Microbiológicas ─────────────────────────────────────────────
router.get('/analises-micro',      authenticate, requireNivel(3), QUA, C.listarAnalisesMicro.bind(C));
router.post('/analises-micro',     authenticate, requireNivel(3), QUA, C.registrarAnaliseMicro.bind(C));

// ── f04: Monitoramento de Antibióticos ────────────────────────────────────────
router.get('/antibioticos',        authenticate, requireNivel(3), QUA, C.listarAntibioticos.bind(C));
router.post('/antibioticos',       authenticate, requireNivel(3), QUA, C.registrarAntibiotico.bind(C));

// ── f05: Liberação de Lotes ───────────────────────────────────────────────────
router.get('/lotes',               authenticate, requireNivel(4), QUA, C.listarLiberacoes.bind(C));
router.post('/lotes',              authenticate, requireNivel(4), QUA, C.registrarLote.bind(C));
router.put('/lotes/:id',           authenticate, requireNivel(4), QUA, C.atualizarStatusLote.bind(C));

// ── f06: Não Conformidades ────────────────────────────────────────────────────
router.get('/nc',                  authenticate, requireNivel(3), QUA, C.listarNC.bind(C));
router.post('/nc',                 authenticate, requireNivel(3), QUA, C.criarNC.bind(C));
router.put('/nc/:id',              authenticate, requireNivel(4), QUA, C.atualizarNC.bind(C));

// ── f07: Análise Sensorial ────────────────────────────────────────────────────
router.get('/analises-sensoriais', authenticate, requireNivel(3), QUA, C.listarAnalisesSensoriais.bind(C));
router.post('/analises-sensoriais',authenticate, requireNivel(3), QUA, C.registrarAnaliseSensorial.bind(C));

// ── f08: Shelf-Life ───────────────────────────────────────────────────────────
router.get('/shelf-life',          authenticate, requireNivel(2), QUA, C.listarShelfLife.bind(C));
router.post('/shelf-life',         authenticate, requireNivel(2), QUA, C.registrarShelfLife.bind(C));
router.patch('/shelf-life/:id',    authenticate, requireNivel(3), QUA, C.atualizarShelfLife.bind(C));

// ── f09: Laudos Técnicos ──────────────────────────────────────────────────────
router.get('/laudos',              authenticate, requireNivel(2), QUA, C.listarLaudos.bind(C));
router.post('/laudos',             authenticate, requireNivel(3), QUA, C.criarLaudo.bind(C));
router.put('/laudos/:id',          authenticate, requireNivel(4), QUA, C.atualizarLaudo.bind(C));

// ── f10: Amostras de Retenção ─────────────────────────────────────────────────
router.get('/amostras',            authenticate, requireNivel(2), QUA, C.listarAmostras.bind(C));
router.post('/amostras',           authenticate, requireNivel(2), QUA, C.registrarAmostra.bind(C));
router.patch('/amostras/:id',      authenticate, requireNivel(3), QUA, C.atualizarAmostra.bind(C));

// ── f11: Controle de Águas e Efluentes ────────────────────────────────────────
router.get('/aguas',               authenticate, requireNivel(3), QUA, C.listarAguas.bind(C));
router.post('/aguas',              authenticate, requireNivel(3), QUA, C.registrarAgua.bind(C));

// ── f12: Swab Test ────────────────────────────────────────────────────────────
router.get('/swabs',               authenticate, requireNivel(2), QUA, C.listarSwabs.bind(C));
router.post('/swabs',              authenticate, requireNivel(2), QUA, C.registrarSwab.bind(C));

// ── f13: Controle de Pragas ───────────────────────────────────────────────────
router.get('/pragas',              authenticate, requireNivel(3), QUA, C.listarPragas.bind(C));
router.post('/pragas',             authenticate, requireNivel(3), QUA, C.registrarPraga.bind(C));

// ── f14: Estoque de Reagentes ─────────────────────────────────────────────────
router.get('/reagentes',           authenticate, requireNivel(3), QUA, C.listarReagentes.bind(C));
router.post('/reagentes',          authenticate, requireNivel(3), QUA, C.cadastrarReagente.bind(C));
router.post('/reagentes/:id/mov',  authenticate, requireNivel(3), QUA, C.movimentarReagente.bind(C));

// ── f15: Calibração ───────────────────────────────────────────────────────────
router.get('/calibracoes',         authenticate, requireNivel(3), QUA, C.listarCalibracoes.bind(C));
router.post('/calibracoes',        authenticate, requireNivel(3), QUA, C.registrarCalibracao.bind(C));

// ── f16/f22: Escalas ──────────────────────────────────────────────────────────
router.get('/escalas',             authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',            authenticate, requireNivel(4), QUA, C.criarEscala.bind(C));
router.delete('/escalas/:id',      authenticate, requireNivel(4), QUA, C.excluirEscala.bind(C));

// ── f17/f18: Reanálises ───────────────────────────────────────────────────────
router.get('/reanalises',          authenticate, requireNivel(3), QUA, C.listarReanalises.bind(C));
router.post('/reanalises',         authenticate, requireNivel(3), QUA, C.solicitarReanalise.bind(C));
router.put('/reanalises/:id',      authenticate, requireNivel(4), QUA, C.responderReanalise.bind(C));

// ── f19: Estocagem de MP ──────────────────────────────────────────────────────
router.get('/estocagem-mp',        authenticate, requireNivel(3), QUA, C.listarEstocagemMP.bind(C));
router.post('/estocagem-mp',       authenticate, requireNivel(3), QUA, C.registrarEstocagemMP.bind(C));

// ── f20: Visitas Fiscais ──────────────────────────────────────────────────────
router.get('/visitas-fiscais',     authenticate, requireNivel(4), QUA, C.listarVisitasFiscais.bind(C));
router.post('/visitas-fiscais',    authenticate, requireNivel(4), QUA, C.registrarVisitaFiscal.bind(C));
router.patch('/visitas-fiscais/:id', authenticate, requireNivel(4), QUA, C.atualizarVisitaFiscal.bind(C));

// ── f21: Carga Spot ───────────────────────────────────────────────────────────
router.get('/cargas-spot',         authenticate, requireNivel(4), QUA, C.listarCargasSpot.bind(C));
router.post('/cargas-spot',        authenticate, requireNivel(4), QUA, C.registrarCargaSpot.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/produtos',            authenticate, requireNivel(2), C.listarProdutos.bind(C));
router.get('/departamentos',       authenticate, requireNivel(2), C.listarDepartamentos.bind(C));
router.get('/usuarios',            authenticate, requireNivel(2), C.listarUsuarios.bind(C));

module.exports = router;
