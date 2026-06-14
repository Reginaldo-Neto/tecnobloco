'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/sac/SacController');

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.getStats.bind(C));

// ── Tickets ───────────────────────────────────────────────────────────────────
router.get('/tickets',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.listarTickets.bind(C));

router.post('/tickets',
  authenticate, requireNivel(2),
  C.criarTicket.bind(C));

router.get('/tickets/:id',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.buscarTicket.bind(C));

router.put('/tickets/:id/status',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.atualizarStatusTicket.bind(C));

router.post('/tickets/:id/comentario',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.adicionarComentario.bind(C));

router.put('/tickets/:id/lote',
  authenticate, requireNivel(3), requireDepartamento('SAC'),
  C.vincularLote.bind(C));

// ── Atendimentos Avulsos ──────────────────────────────────────────────────────
router.get('/atendimentos',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.listarAtendimentosAvulsos.bind(C));

router.post('/atendimentos',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.registrarAtendimentoAvulso.bind(C));

// ── Motivos ───────────────────────────────────────────────────────────────────
router.get('/motivos',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.listarMotivos.bind(C));

router.post('/motivos',
  authenticate, requireNivel(3), requireDepartamento('SAC'),
  C.criarMotivo.bind(C));

router.delete('/motivos/:id',
  authenticate, requireNivel(3), requireDepartamento('SAC'),
  C.excluirMotivo.bind(C));

// ── Garantias ─────────────────────────────────────────────────────────────────
router.get('/garantias',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.listarGarantias.bind(C));

router.post('/garantias',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.criarGarantia.bind(C));

router.put('/garantias/:id/responder',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.responderGarantia.bind(C));

// ── Recall ────────────────────────────────────────────────────────────────────
router.get('/recall',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.listarRecall.bind(C));

router.post('/recall',
  authenticate, requireNivel(5), requireDepartamento('SAC'),
  C.criarRecall.bind(C));

router.put('/recall/:id/status',
  authenticate, requireNivel(5), requireDepartamento('SAC'),
  C.atualizarStatusRecall.bind(C));

// ── Templates ─────────────────────────────────────────────────────────────────
router.get('/templates',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.listarTemplates.bind(C));

router.get('/templates/:id',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.buscarTemplate.bind(C));

router.post('/templates',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.criarTemplate.bind(C));

router.put('/templates/:id',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.atualizarTemplate.bind(C));

router.delete('/templates/:id',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.excluirTemplate.bind(C));

// ── Base de Conhecimento ──────────────────────────────────────────────────────
router.get('/base-conhecimento',
  authenticate, requireNivel(2),
  C.listarBaseConhecimento.bind(C));

router.get('/base-conhecimento/:id',
  authenticate, requireNivel(2),
  C.buscarArtigoConhecimento.bind(C));

router.post('/base-conhecimento',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.criarArtigoConhecimento.bind(C));

router.put('/base-conhecimento/:id',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.atualizarArtigoConhecimento.bind(C));

router.delete('/base-conhecimento/:id',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.excluirArtigoConhecimento.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',
  authenticate, requireNivel(0),
  C.listarEscalas.bind(C));

router.post('/escalas',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.criarEscala.bind(C));

router.delete('/escalas/:id',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.excluirEscala.bind(C));

// ── Comunicados ───────────────────────────────────────────────────────────────
router.get('/comunicados',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.listarComunicados.bind(C));

router.post('/comunicados',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.criarComunicado.bind(C));

// ── SLA / NPS ─────────────────────────────────────────────────────────────────
router.get('/relatorio-sla',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.relatorioSLA.bind(C));

router.get('/nps',
  authenticate, requireNivel(4), requireDepartamento('SAC'),
  C.getNPS.bind(C));

// ── Histórico do Cliente ──────────────────────────────────────────────────────
router.get('/historico-cliente',
  authenticate, requireNivel(3), requireDepartamento('SAC'),
  C.historicoCliente.bind(C));

// ── Usuários (selects) ────────────────────────────────────────────────────────
router.get('/usuarios',
  authenticate, requireNivel(2), requireDepartamento('SAC'),
  C.listarUsuarios.bind(C));

module.exports = router;
