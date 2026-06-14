'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/producao/ProducaoController');

const PRO = requireDepartamento('Produção');

router.get('/stats',         authenticate, requireNivel(2), PRO, C.getStats.bind(C));
router.get('/recentes',      authenticate, requireNivel(0), C.listarEscalas.bind(C));

// ── Ordens de Produção ────────────────────────────────────────────────────────
router.get('/ordens',         authenticate, requireNivel(2), PRO, C.listarOrdens.bind(C));
router.get('/ordens/:id',     authenticate, requireNivel(2), PRO, C.buscarOrdem.bind(C));
router.post('/ordens',        authenticate, requireNivel(4), PRO, C.criarOrdem.bind(C));
router.put('/ordens/:id',     authenticate, requireNivel(4), PRO, C.atualizarOrdem.bind(C));

// ── Apontamentos ──────────────────────────────────────────────────────────────
router.get('/ordens/:id/apontamentos', authenticate, requireNivel(2), PRO, C.listarApontamentos.bind(C));
router.post('/apontamentos',           authenticate, requireNivel(2), PRO, C.criarApontamento.bind(C));

// ── Temperaturas ──────────────────────────────────────────────────────────────
router.get('/temperaturas',   authenticate, requireNivel(2), PRO, C.listarTemperaturas.bind(C));
router.post('/temperaturas',  authenticate, requireNivel(2), PRO, C.registrarTemperatura.bind(C));

// ── Higienizações ─────────────────────────────────────────────────────────────
router.get('/higienizacoes',        authenticate, requireNivel(2), PRO, C.listarHigienizacoes.bind(C));
router.post('/higienizacoes',       authenticate, requireNivel(2), PRO, C.registrarHigienizacao.bind(C));
router.put('/higienizacoes/:id',    authenticate, requireNivel(3), PRO, C.atualizarHigienizacao.bind(C));

// ── Perdas ────────────────────────────────────────────────────────────────────
router.get('/perdas',         authenticate, requireNivel(2), PRO, C.listarPerdas.bind(C));
router.post('/perdas',        authenticate, requireNivel(2), PRO, C.registrarPerda.bind(C));

// ── Indicadores ───────────────────────────────────────────────────────────────
router.get('/indicadores-oee',       authenticate, requireNivel(4), PRO, C.getIndicadoresOEE.bind(C));
router.get('/rastrear/:lote',        authenticate, requireNivel(3), PRO, C.rastrearLote.bind(C));
router.get('/pendencias-auditoria',  authenticate, requireNivel(4), PRO, C.listarPendenciasAuditoria.bind(C));
router.get('/consumo-insumos',       authenticate, requireNivel(3), PRO, C.listarConsumoInsumos.bind(C));

// ── Manutenção ────────────────────────────────────────────────────────────────
router.post('/solicitar-manutencao', authenticate, requireNivel(2), PRO, C.criarSolicitacaoManutencao.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',        authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',       authenticate, requireNivel(4), PRO, C.criarEscala.bind(C));
router.delete('/escalas/:id', authenticate, requireNivel(4), PRO, C.excluirEscala.bind(C));

// ── Receitas (stub — tabela futura) ───────────────────────────────────────────
router.get('/receitas',  authenticate, requireNivel(2), PRO, (req, res) => res.json({ success: true, data: [] }));
router.post('/receitas', authenticate, requireNivel(4), PRO, (req, res) => res.status(501).json({ success: false, message: 'Funcionalidade em desenvolvimento' }));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/equipamentos',   authenticate, requireNivel(2), C.listarEquipamentos.bind(C));
router.get('/produtos',       authenticate, requireNivel(2), C.listarProdutos.bind(C));
router.get('/usuarios',       authenticate, requireNivel(2), C.listarUsuarios.bind(C));

module.exports = router;
