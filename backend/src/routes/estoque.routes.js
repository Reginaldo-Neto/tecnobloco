'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/estoque/EstoqueController');

const EST = requireDepartamento('Estoque', 'Compras');

router.get('/stats',    authenticate, requireNivel(2), EST, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(2), EST, C.recenteMovimentacoes.bind(C));

// ── Produtos ──────────────────────────────────────────────────────────────────
router.get('/produtos',               authenticate, requireNivel(2), EST, C.listarProdutos.bind(C));
router.get('/produtos/:id',           authenticate, requireNivel(2), EST, C.buscarProduto.bind(C));
router.post('/produtos',              authenticate, requireNivel(4), EST, C.criarProduto.bind(C));
router.put('/produtos/:id',           authenticate, requireNivel(4), EST, C.atualizarProduto.bind(C));
router.delete('/produtos/:id',        authenticate, requireNivel(5), EST, C.desativarProduto.bind(C));
router.patch('/produtos/:id/localizacao', authenticate, requireNivel(3), EST, C.atualizarLocalizacao.bind(C));
router.patch('/produtos/:id/minmax',      authenticate, requireNivel(4), EST, C.atualizarMinMax.bind(C));

// ── Movimentações ─────────────────────────────────────────────────────────────
router.get('/movimentacoes',  authenticate, requireNivel(2), EST, C.listarMovimentacoes.bind(C));
router.post('/movimentacoes', authenticate, requireNivel(3), EST, C.registrarMovimentacao.bind(C));

// ── Validade ──────────────────────────────────────────────────────────────────
router.get('/validade', authenticate, requireNivel(3), EST, C.listarControleValidade.bind(C));

// ── Bloqueio de Lote ──────────────────────────────────────────────────────────
router.get('/bloqueios',     authenticate, requireNivel(4), EST, C.listarBloqueiosLote.bind(C));
router.post('/bloqueios',    authenticate, requireNivel(4), EST, C.bloquearLote.bind(C));
router.put('/bloqueios/:id', authenticate, requireNivel(4), EST, C.atualizarBloqueioLote.bind(C));

// ── Inventário ────────────────────────────────────────────────────────────────
router.get('/inventarios',                    authenticate, requireNivel(3), EST, C.listarInventarios.bind(C));
router.post('/inventarios',                   authenticate, requireNivel(4), EST, C.criarInventario.bind(C));
router.get('/inventarios/:id/itens',          authenticate, requireNivel(3), EST, C.listarItensInventario.bind(C));
router.post('/inventarios/:id/itens',         authenticate, requireNivel(3), EST, C.adicionarItemInventario.bind(C));
router.patch('/inventarios/:id/itens/:itemId',authenticate, requireNivel(3), EST, C.contarItemInventario.bind(C));
router.post('/inventarios/:id/concluir',      authenticate, requireNivel(4), EST, C.concluirInventario.bind(C));

// ── Curva ABC / Separação / Expedição ─────────────────────────────────────────
router.get('/curva-abc',  authenticate, requireNivel(4), EST, C.calcularCurvaABC.bind(C));
router.get('/separacao',  authenticate, requireNivel(2), EST, C.listarOrdensSeparacao.bind(C));
router.get('/expedicao',  authenticate, requireNivel(3), EST, C.listarPedidosExpedicao.bind(C));

// ── Solicitações ──────────────────────────────────────────────────────────────
router.get('/solicitacoes',     authenticate, requireNivel(3), EST, C.listarSolicitacoes.bind(C));
router.put('/solicitacoes/:id', authenticate, requireNivel(4), EST, C.atualizarSolicitacao.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',        authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',       authenticate, requireNivel(4), EST, C.criarEscala.bind(C));
router.delete('/escalas/:id', authenticate, requireNivel(4), EST, C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/categorias', authenticate, requireNivel(2), C.listarCategorias.bind(C));
router.get('/usuarios',   authenticate, requireNivel(2), C.listarUsuarios.bind(C));

module.exports = router;
