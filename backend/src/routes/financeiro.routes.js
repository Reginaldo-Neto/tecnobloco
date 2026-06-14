'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/financeiro/FinanceiroController');

const FIN = requireDepartamento('Financeiro');

// ── Stats / Dashboard ─────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(3), FIN,
  C.getStats.bind(C));

router.get('/ultimas-transacoes',
  authenticate, requireNivel(3), FIN,
  C.getUltimasTransacoes.bind(C));

// ── Contas a Pagar (f01) ──────────────────────────────────────────────────────
router.get('/contas-pagar',
  authenticate, requireNivel(3), FIN,
  C.listarContasPagar.bind(C));

router.post('/contas-pagar',
  authenticate, requireNivel(3), FIN,
  C.criarContaPagar.bind(C));

router.put('/contas-pagar/:id',
  authenticate, requireNivel(3), FIN,
  C.atualizarContaPagar.bind(C));

router.delete('/contas-pagar/:id',
  authenticate, requireNivel(3), FIN,
  C.cancelarContaPagar.bind(C));

// ── Contas a Receber (f02) ────────────────────────────────────────────────────
router.get('/contas-receber',
  authenticate, requireNivel(3), FIN,
  C.listarContasReceber.bind(C));

router.post('/contas-receber',
  authenticate, requireNivel(3), FIN,
  C.criarContaReceber.bind(C));

router.put('/contas-receber/:id',
  authenticate, requireNivel(3), FIN,
  C.atualizarContaReceber.bind(C));

// ── Fornecedores (f03) ────────────────────────────────────────────────────────
router.get('/fornecedores',
  authenticate, requireNivel(3), FIN,
  C.listarFornecedores.bind(C));

router.post('/fornecedores',
  authenticate, requireNivel(3), FIN,
  C.criarFornecedor.bind(C));

router.put('/fornecedores/:id',
  authenticate, requireNivel(3), FIN,
  C.atualizarFornecedor.bind(C));

// ── Plano de Contas (f04) ─────────────────────────────────────────────────────
router.get('/plano-contas',
  authenticate, requireNivel(3), FIN,
  C.listarPlanoContas.bind(C));

router.post('/plano-contas',
  authenticate, requireNivel(4), FIN,
  C.criarConta.bind(C));

router.put('/plano-contas/:id',
  authenticate, requireNivel(4), FIN,
  C.atualizarConta.bind(C));

// ── Fluxo de Caixa (f05) ─────────────────────────────────────────────────────
router.get('/fluxo-caixa',
  authenticate, requireNivel(4), FIN,
  C.getFluxoCaixa.bind(C));

// ── Conciliação Bancária (f06) ────────────────────────────────────────────────
router.get('/movimentos',
  authenticate, requireNivel(3), FIN,
  C.listarMovimentos.bind(C));

router.post('/movimentos',
  authenticate, requireNivel(3), FIN,
  C.criarMovimento.bind(C));

router.put('/movimentos/:id/conciliar',
  authenticate, requireNivel(3), FIN,
  C.conciliarMovimento.bind(C));

// ── Adiantamentos (f07) ───────────────────────────────────────────────────────
router.get('/adiantamentos',
  authenticate, requireNivel(4), FIN,
  C.listarAdiantamentos.bind(C));

router.put('/adiantamentos/:id',
  authenticate, requireNivel(4), FIN,
  C.atualizarAdiantamento.bind(C));

// ── Centros de Custo (f09) ────────────────────────────────────────────────────
router.get('/centros-custo',
  authenticate, requireNivel(4), FIN,
  C.listarCentrosCusto.bind(C));

router.post('/centros-custo',
  authenticate, requireNivel(4), FIN,
  C.criarCentroCusto.bind(C));

router.put('/centros-custo/:id',
  authenticate, requireNivel(4), FIN,
  C.atualizarCentroCusto.bind(C));

// ── Escalas (f10 / f11) ───────────────────────────────────────────────────────
router.get('/escalas',
  authenticate, requireNivel(0),
  C.listarEscalas.bind(C));

router.post('/escalas',
  authenticate, requireNivel(4), FIN,
  C.criarEscala.bind(C));

router.delete('/escalas/:id',
  authenticate, requireNivel(4), FIN,
  C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/usuarios',
  authenticate, requireNivel(3), FIN,
  C.listarUsuarios.bind(C));

router.get('/departamentos',
  authenticate, requireNivel(3), FIN,
  C.listarDepartamentos.bind(C));

module.exports = router;
