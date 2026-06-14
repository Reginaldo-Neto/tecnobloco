'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/lavanderia/LavanderiaController');

const LAV = requireDepartamento('Lavanderia');

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(2), LAV,
  C.getStats.bind(C));

// ── f01 Recebimento e Triagem ─────────────────────────────────────────────────
router.get('/entradas',
  authenticate, requireNivel(2), LAV,
  C.listarEntradas.bind(C));

router.post('/entradas',
  authenticate, requireNivel(2), LAV,
  C.criarEntrada.bind(C));

router.put('/entradas/:id/status',
  authenticate, requireNivel(2), LAV,
  C.atualizarStatusEntrada.bind(C));

// ── f02 Ciclos de Lavagem ─────────────────────────────────────────────────────
router.get('/ciclos',
  authenticate, requireNivel(2), LAV,
  C.listarCiclos.bind(C));

router.get('/ciclos/:id',
  authenticate, requireNivel(2), LAV,
  C.buscarCiclo.bind(C));

router.post('/ciclos',
  authenticate, requireNivel(2), LAV,
  C.criarCiclo.bind(C));

router.put('/ciclos/:id/concluir',
  authenticate, requireNivel(2), LAV,
  C.concluirCiclo.bind(C));

// ── f03 Controle de Químicos ──────────────────────────────────────────────────
router.get('/quimicos',
  authenticate, requireNivel(2), LAV,
  C.listarQuimicos.bind(C));

router.post('/quimicos',
  authenticate, requireNivel(3), LAV,
  C.criarQuimico.bind(C));

router.put('/quimicos/:id',
  authenticate, requireNivel(3), LAV,
  C.atualizarQuimico.bind(C));

router.post('/quimicos/:id/uso',
  authenticate, requireNivel(3), LAV,
  C.registrarUsoQuimico.bind(C));

// ── f04 Higienização de Botas e Aventais ──────────────────────────────────────
router.get('/higienizacoes',
  authenticate, requireNivel(2), LAV,
  C.listarHigienizacoes.bind(C));

router.post('/higienizacoes',
  authenticate, requireNivel(2), LAV,
  C.criarHigienizacao.bind(C));

router.put('/higienizacoes/:id/status',
  authenticate, requireNivel(2), LAV,
  C.atualizarStatusHigienizacao.bind(C));

// ── f05 Entrega de Limpos ─────────────────────────────────────────────────────
router.get('/entregas-pendentes',
  authenticate, requireNivel(2), LAV,
  C.listarPendentesEntrega.bind(C));

router.post('/entradas/:id/entregar',
  authenticate, requireNivel(2), LAV,
  C.registrarEntrega.bind(C));

// ── f06 / f09 Estoque de Uniformes / Toalhas ──────────────────────────────────
router.get('/estoque-uniformes',
  authenticate, requireNivel(2), LAV,
  C.listarEstoqueUniformes.bind(C));

router.post('/estoque-uniformes',
  authenticate, requireNivel(4), LAV,
  C.criarItemEstoque.bind(C));

router.put('/estoque-uniformes/:id',
  authenticate, requireNivel(4), LAV,
  C.atualizarItemEstoque.bind(C));

// ── f07 Baixa e Descarte ──────────────────────────────────────────────────────
router.get('/descartes',
  authenticate, requireNivel(4), LAV,
  C.listarDescartes.bind(C));

router.post('/descartes',
  authenticate, requireNivel(4), LAV,
  C.registrarDescarte.bind(C));

// ── f08 Gestão de Reparos ─────────────────────────────────────────────────────
router.get('/reparos',
  authenticate, requireNivel(2), LAV,
  C.listarReparos.bind(C));

router.post('/reparos',
  authenticate, requireNivel(2), LAV,
  C.criarReparo.bind(C));

router.put('/reparos/:id',
  authenticate, requireNivel(2), LAV,
  C.atualizarReparo.bind(C));

// ── f10 Inventário de Enxoval ─────────────────────────────────────────────────
router.get('/inventarios',
  authenticate, requireNivel(4), LAV,
  C.listarInventarios.bind(C));

router.get('/inventarios/:id',
  authenticate, requireNivel(4), LAV,
  C.buscarInventario.bind(C));

router.post('/inventarios',
  authenticate, requireNivel(4), LAV,
  C.criarInventario.bind(C));

// ── f11 Gestão de Armários ────────────────────────────────────────────────────
router.get('/armarios',
  authenticate, requireNivel(3), LAV,
  C.listarArmarios.bind(C));

router.post('/armarios',
  authenticate, requireNivel(3), LAV,
  C.criarArmario.bind(C));

router.put('/armarios/:id',
  authenticate, requireNivel(3), LAV,
  C.atualizarArmario.bind(C));

// ── f13 Controle de EPIs ──────────────────────────────────────────────────────
router.get('/epis',
  authenticate, requireNivel(4), LAV,
  C.listarEpisRegistros.bind(C));

router.post('/epis',
  authenticate, requireNivel(4), LAV,
  C.registrarEpi.bind(C));

// ── f14 Gerenciar Solicitações de Higienização ────────────────────────────────
router.get('/solicitacoes',
  authenticate, requireNivel(3), LAV,
  C.listarSolicitacoes.bind(C));

router.put('/solicitacoes/:id',
  authenticate, requireNivel(3), LAV,
  C.atualizarSolicitacao.bind(C));

// ── f15 / f16 Escalas ─────────────────────────────────────────────────────────
router.get('/escalas',
  authenticate, requireNivel(0),
  C.listarEscalas.bind(C));

router.post('/escalas',
  authenticate, requireNivel(4), LAV,
  C.criarEscala.bind(C));

router.delete('/escalas/:id',
  authenticate, requireNivel(4), LAV,
  C.excluirEscala.bind(C));

// ── Uniformes cadastro ────────────────────────────────────────────────────────
router.get('/uniformes',
  authenticate, requireNivel(2), LAV,
  C.listarUniformes.bind(C));

router.post('/uniformes',
  authenticate, requireNivel(2), LAV,
  C.criarUniforme.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/usuarios',
  authenticate, requireNivel(2), LAV,
  C.listarUsuarios.bind(C));

router.get('/departamentos',
  authenticate, requireNivel(2), LAV,
  C.listarDepartamentos.bind(C));

module.exports = router;
