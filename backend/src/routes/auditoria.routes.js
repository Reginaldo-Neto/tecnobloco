'use strict';

const router = require('express').Router();
const { authenticate, requireNivel } = require('../middleware/auth.middleware');
// const AuditoriaController = require('../controllers/auditoria/AuditoriaController');

// Todas as rotas do módulo Auditoria e Rastreabilidade requerem autenticação mínima nível 6 (Diretor)
router.use(authenticate, requireNivel(6));

// TODO: implementar endpoints do módulo Auditoria e Rastreabilidade
// router.get('/logs',    AuditoriaController.listar.bind(AuditoriaController));
// router.post('/logs',   AuditoriaController.criar.bind(AuditoriaController));
// router.get('/logs/:id',AuditoriaController.buscar.bind(AuditoriaController));
// router.put('/logs/:id',AuditoriaController.atualizar.bind(AuditoriaController));

module.exports = router;
