'use strict';

const router = require('express').Router();
const { authenticate, requireNivel } = require('../middleware/auth.middleware');
// const NotificacoesController = require('../controllers/notificacoes/NotificacoesController');

// Todas as rotas do módulo Notificações e Aprovações requerem autenticação mínima nível 1 (Visitante)
router.use(authenticate, requireNivel(1));

// TODO: implementar endpoints do módulo Notificações e Aprovações
// router.get('/notificacoes',    NotificacoesController.listar.bind(NotificacoesController));
// router.post('/notificacoes',   NotificacoesController.criar.bind(NotificacoesController));
// router.get('/notificacoes/:id',NotificacoesController.buscar.bind(NotificacoesController));
// router.put('/notificacoes/:id',NotificacoesController.atualizar.bind(NotificacoesController));

module.exports = router;
