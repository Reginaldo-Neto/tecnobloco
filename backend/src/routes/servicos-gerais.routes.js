'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/servicos-gerais/ServicosGeraisController');

const SG = requireDepartamento('Serviços Gerais');

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(2), SG,
  C.getStats.bind(C));

// ── Atividades (f02–f11) ──────────────────────────────────────────────────────
router.get('/atividades',
  authenticate, requireNivel(2), SG,
  C.listarAtividades.bind(C));

router.post('/atividades',
  authenticate, requireNivel(2), SG,
  C.criarAtividade.bind(C));

router.put('/atividades/:id',
  authenticate, requireNivel(2), SG,
  C.atualizarAtividade.bind(C));

// ── Ferramentas (f12) ─────────────────────────────────────────────────────────
router.get('/ferramentas',
  authenticate, requireNivel(2), SG,
  C.listarFerramentas.bind(C));

router.post('/ferramentas',
  authenticate, requireNivel(4), SG,
  C.criarFerramenta.bind(C));

router.post('/ferramentas/:id/movimento',
  authenticate, requireNivel(2), SG,
  C.registrarMovimentoFerramenta.bind(C));

// ── Insumos e Combustível (f13) ───────────────────────────────────────────────
router.get('/insumos',
  authenticate, requireNivel(2), SG,
  C.listarInsumos.bind(C));

router.post('/insumos',
  authenticate, requireNivel(4), SG,
  C.criarInsumo.bind(C));

router.put('/insumos/:id',
  authenticate, requireNivel(4), SG,
  C.atualizarInsumo.bind(C));

router.post('/insumos/:id/uso',
  authenticate, requireNivel(4), SG,
  C.registrarUsoInsumo.bind(C));

// ── Cronograma de Jardinagem (f01 / f18) ─────────────────────────────────────
router.get('/cronograma-jardinagem',
  authenticate, requireNivel(2), SG,
  C.listarCronogramaJardinagem.bind(C));

router.post('/cronograma-jardinagem',
  authenticate, requireNivel(4), SG,
  C.criarCronograma.bind(C));

router.put('/cronograma-jardinagem/:id',
  authenticate, requireNivel(4), SG,
  C.atualizarCronograma.bind(C));

router.delete('/cronograma-jardinagem/:id',
  authenticate, requireNivel(4), SG,
  C.excluirCronograma.bind(C));

// ── Solicitações de Apoio (f14 / f16) ────────────────────────────────────────
router.get('/solicitacoes',
  authenticate, requireNivel(2), SG,
  C.listarSolicitacoes.bind(C));

router.put('/solicitacoes/:id',
  authenticate, requireNivel(4), SG,
  C.atualizarSolicitacao.bind(C));

// ── Pendências de Auditoria (f17) ─────────────────────────────────────────────
router.get('/pendencias-auditoria',
  authenticate, requireNivel(4), SG,
  C.listarPendenciasAuditoria.bind(C));

router.post('/pendencias-auditoria',
  authenticate, requireNivel(4), SG,
  C.criarPendenciaAuditoria.bind(C));

router.put('/pendencias-auditoria/:id',
  authenticate, requireNivel(4), SG,
  C.atualizarPendenciaAuditoria.bind(C));

// ── Escalas (f15 / f19) ───────────────────────────────────────────────────────
router.get('/escalas',
  authenticate, requireNivel(0),
  C.listarEscalas.bind(C));

router.post('/escalas',
  authenticate, requireNivel(4), SG,
  C.criarEscala.bind(C));

router.delete('/escalas/:id',
  authenticate, requireNivel(4), SG,
  C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/usuarios',
  authenticate, requireNivel(2), SG,
  C.listarUsuarios.bind(C));

module.exports = router;
