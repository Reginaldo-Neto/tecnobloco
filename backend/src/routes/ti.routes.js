'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/ti/TiController');

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(2),
  C.getStats.bind(C));

// ── Chamados (Helpdesk) ───────────────────────────────────────────────────────
router.get('/chamados',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.listarChamados.bind(C));

router.get('/chamados/meus',
  authenticate, requireNivel(2),
  C.meusChamados.bind(C));

router.post('/chamados',
  authenticate, requireNivel(2),
  C.criarChamado.bind(C));

router.get('/chamados/:id',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.buscarChamado.bind(C));

router.put('/chamados/:id/status',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.atualizarStatusChamado.bind(C));

router.post('/chamados/:id/comentario',
  authenticate, requireNivel(2),
  C.adicionarComentario.bind(C));

// ── Base de Conhecimento ──────────────────────────────────────────────────────
router.get('/base-conhecimento',
  authenticate, requireNivel(2),
  C.listarBaseConhecimento.bind(C));

router.get('/base-conhecimento/:id',
  authenticate, requireNivel(2),
  C.buscarArtigoConhecimento.bind(C));

router.post('/base-conhecimento',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.criarArtigoConhecimento.bind(C));

router.put('/base-conhecimento/:id',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.atualizarArtigoConhecimento.bind(C));

router.delete('/base-conhecimento/:id',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.excluirArtigoConhecimento.bind(C));

// ── Ativos TI ────────────────────────────────────────────────────────────────
router.get('/ativos',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.listarAtivos.bind(C));

router.get('/ativos/:id',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.buscarAtivo.bind(C));

router.post('/ativos',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.criarAtivo.bind(C));

router.put('/ativos/:id',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.atualizarAtivo.bind(C));

router.post('/ativos/:id/movimentar',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.movimentarAtivo.bind(C));

// ── Bugs ─────────────────────────────────────────────────────────────────────
router.get('/bugs',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.listarBugs.bind(C));

router.get('/bugs/:id',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.buscarBug.bind(C));

router.put('/bugs/:id/status',
  authenticate, requireNivel(3), requireDepartamento('TI'),
  C.atualizarStatusBug.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',
  authenticate, requireNivel(2),
  C.listarEscalas.bind(C));

router.post('/escalas',
  authenticate, requireNivel(4), requireDepartamento('TI'),
  C.criarEscala.bind(C));

router.delete('/escalas/:id',
  authenticate, requireNivel(4), requireDepartamento('TI'),
  C.excluirEscala.bind(C));

// ── Solicitações de Exclusão ──────────────────────────────────────────────────
router.get('/solicitacoes-exclusao',
  authenticate, requireNivel(5), requireDepartamento('TI'),
  C.listarSolicitacoesExclusao.bind(C));

router.post('/solicitacoes-exclusao',
  authenticate, requireNivel(2),
  C.criarSolicitacaoExclusao.bind(C));

router.put('/solicitacoes-exclusao/:id/responder',
  authenticate, requireNivel(5), requireDepartamento('TI'),
  C.responderSolicitacaoExclusao.bind(C));

// ── Reset de Senha ────────────────────────────────────────────────────────────
router.post('/usuarios/:id/reset-senha',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.resetarSenha.bind(C));

// ── Usuários (selects) ────────────────────────────────────────────────────────
router.get('/usuarios',
  authenticate, requireNivel(2), requireDepartamento('TI'),
  C.listarUsuarios.bind(C));

module.exports = router;
