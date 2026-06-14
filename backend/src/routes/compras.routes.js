'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/compras/ComprasController');

const COM = requireDepartamento('Compras');

router.get('/stats',    authenticate, requireNivel(3), COM, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(3), COM, C.recentesPedidos.bind(C));

// ── Fornecedores ──────────────────────────────────────────────────────────────
router.get('/fornecedores',     authenticate, requireNivel(3), COM, C.listarFornecedores.bind(C));
router.post('/fornecedores',    authenticate, requireNivel(3), COM, C.criarFornecedor.bind(C));
router.put('/fornecedores/:id', authenticate, requireNivel(3), COM, C.atualizarFornecedor.bind(C));

// ── Pedidos ───────────────────────────────────────────────────────────────────
router.get('/pedidos',          authenticate, requireNivel(3), COM, C.listarPedidos.bind(C));
router.get('/pedidos/:id',      authenticate, requireNivel(3), COM, C.buscarPedido.bind(C));
router.post('/pedidos',         authenticate, requireNivel(3), COM, C.criarPedido.bind(C));
router.put('/pedidos/:id',      authenticate, requireNivel(4), COM, C.atualizarStatusPedido.bind(C));
router.post('/pedidos/:id/receber', authenticate, requireNivel(3), COM, C.receberMercadoria.bind(C));

// ── Cotações ──────────────────────────────────────────────────────────────────
router.get('/pedidos/:id/cotacoes',  authenticate, requireNivel(3), COM, C.listarCotacoes.bind(C));
router.post('/pedidos/:id/cotacoes', authenticate, requireNivel(3), COM, C.criarCotacao.bind(C));

// ── Solicitações ──────────────────────────────────────────────────────────────
router.get('/solicitacoes',           authenticate, requireNivel(3), COM, C.listarSolicitacoes.bind(C));
router.post('/solicitacoes/:id/gerar',authenticate, requireNivel(4), COM, C.gerarPedidoDeSolicitacao.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',        authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',       authenticate, requireNivel(4), COM, C.criarEscala.bind(C));
router.delete('/escalas/:id', authenticate, requireNivel(4), COM, C.excluirEscala.bind(C));

router.get('/usuarios', authenticate, requireNivel(3), C.listarUsuarios.bind(C));

module.exports = router;
