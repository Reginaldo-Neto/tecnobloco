'use strict';

const router = require('express').Router();
const AuthController = require('../controllers/auth/AuthController');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rate-limit.middleware');

// POST /api/auth/login
router.post('/login', authLimiter, AuthController.login.bind(AuthController));

// GET /api/auth/me  [requer autenticação]
router.get('/me', authenticate, AuthController.me.bind(AuthController));

// POST /api/auth/logout  [requer autenticação]
router.post('/logout', authenticate, AuthController.logout.bind(AuthController));

// PUT /api/auth/alterar-senha  [requer autenticação]
router.put('/alterar-senha', authenticate, AuthController.alterarSenha.bind(AuthController));

// ── Security Challenge ─────────────────────────────────────────────────────
// GET /api/auth/challenge  [requer autenticação]
router.get('/challenge', authenticate, AuthController.getChallenge.bind(AuthController));

// POST /api/auth/verify-challenge  [requer autenticação]
router.post('/verify-challenge', authenticate, AuthController.verifyChallenge.bind(AuthController));

module.exports = router;
