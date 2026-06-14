'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/vendas/VendasController');

const VND = requireDepartamento('Vendas');

router.get('/stats',    authenticate, requireNivel(3), VND, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(3), VND, C.recentesPedidos.bind(C));

// ── Clientes ──────────────────────────────────────────────────────────────────
router.get('/clientes',      authenticate, requireNivel(3), VND, C.listarClientes.bind(C));
router.get('/clientes/:id',  authenticate, requireNivel(3), VND, C.buscarCliente.bind(C));
router.post('/clientes',     authenticate, requireNivel(3), VND, C.criarCliente.bind(C));
router.put('/clientes/:id',  authenticate, requireNivel(4), VND, C.atualizarCliente.bind(C));

// ── Pedidos ───────────────────────────────────────────────────────────────────
router.get('/pedidos',        authenticate, requireNivel(3), VND, C.listarPedidos.bind(C));
router.get('/pedidos/:id',    authenticate, requireNivel(3), VND, C.buscarPedido.bind(C));
router.post('/pedidos',       authenticate, requireNivel(3), VND, C.criarPedido.bind(C));
router.put('/pedidos/:id/status', authenticate, requireNivel(4), VND, C.atualizarStatusPedido.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',        authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',       authenticate, requireNivel(4), VND, C.criarEscala.bind(C));
router.delete('/escalas/:id', authenticate, requireNivel(4), VND, C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/produtos',  authenticate, requireNivel(3), C.listarProdutos.bind(C));
router.get('/usuarios',  authenticate, requireNivel(3), C.listarUsuarios.bind(C));

module.exports = router;
