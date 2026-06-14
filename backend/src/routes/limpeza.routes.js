'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/limpeza/LimpezaController');

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.getStats.bind(C));

// ── Solicitações (F01 / F02) ──────────────────────────────────────────────────
router.get('/solicitacoes',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.listarSolicitacoes.bind(C));

router.put('/solicitacoes/:id',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.atualizarSolicitacao.bind(C));

// ── Rotinas (F03 / F12) ───────────────────────────────────────────────────────
router.get('/rotinas',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.listarRotinas.bind(C));

router.post('/rotinas',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.criarRotina.bind(C));

router.put('/rotinas/:id',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.atualizarRotina.bind(C));

router.delete('/rotinas/:id',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.excluirRotina.bind(C));

// ── Checklist de Execução (F04) ───────────────────────────────────────────────
router.get('/checklist',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.listarChecklist.bind(C));

router.post('/checklist',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.registrarChecklist.bind(C));

// ── Gestão de Resíduos (F05) ──────────────────────────────────────────────────
router.get('/residuos',
  authenticate, requireNivel(2), requireDepartamento('Limpeza'),
  C.listarResiduos.bind(C));

router.post('/residuos',
  authenticate, requireNivel(2), requireDepartamento('Limpeza'),
  C.registrarResiduo.bind(C));

// ── Caçambas (F06) ────────────────────────────────────────────────────────────
router.get('/cacambas',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.listarCacambas.bind(C));

router.post('/cacambas',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.criarSolicitacaoCacamba.bind(C));

router.put('/cacambas/:id/status',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.atualizarStatusCacamba.bind(C));

// ── Lavagem de Pátio (F07) ────────────────────────────────────────────────────
router.get('/lavagem-patio',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.listarLavagemPatio.bind(C));

router.post('/lavagem-patio',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.criarLavagemPatio.bind(C));

router.put('/lavagem-patio/:id/status',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.atualizarStatusLavagem.bind(C));

// ── Estoque DML (F08) ─────────────────────────────────────────────────────────
router.get('/estoque',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.listarEstoque.bind(C));

router.post('/estoque',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.criarItemEstoque.bind(C));

router.post('/estoque/:itemId/movimento',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.registrarMovimento.bind(C));

// ── Descartáveis (F09) ────────────────────────────────────────────────────────
router.get('/descartaveis',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.listarDescartaveis.bind(C));

router.post('/descartaveis',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.registrarConsumo.bind(C));

// ── Compra de Insumos (F10) ───────────────────────────────────────────────────
router.get('/compras',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.listarCompras.bind(C));

router.post('/compras',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.criarSolicitacaoCompra.bind(C));

// ── Escalas (F11 / F13) ───────────────────────────────────────────────────────
router.get('/escalas',
  authenticate, requireNivel(0),
  C.listarEscalas.bind(C));

router.post('/escalas',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.criarEscala.bind(C));

router.delete('/escalas/:id',
  authenticate, requireNivel(3), requireDepartamento('Limpeza'),
  C.excluirEscala.bind(C));

// ── Usuários (selects) ────────────────────────────────────────────────────────
router.get('/usuarios',
  authenticate, requireNivel(1), requireDepartamento('Limpeza'),
  C.listarUsuarios.bind(C));

module.exports = router;
