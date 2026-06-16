'use strict';

const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const router = require('express').Router();
const AuthController = require('../controllers/auth/AuthController');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rate-limit.middleware');

// ── Multer: upload de foto de perfil ─────────────────────────────────────────
const profilePhotosDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(profilePhotosDir)) fs.mkdirSync(profilePhotosDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profilePhotosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z]/g, '') || '.jpg';
    cb(null, `user-${req.user ? req.user.id : 'anon'}-${Date.now()}${ext}`);
  },
});
const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Apenas imagens são aceitas (JPG, PNG, WebP)'));
  },
});

// POST /api/auth/login
router.post('/login', authLimiter, AuthController.login.bind(AuthController));

// GET /api/auth/me
router.get('/me', authenticate, AuthController.me.bind(AuthController));

// POST /api/auth/logout
router.post('/logout', authenticate, AuthController.logout.bind(AuthController));

// PUT /api/auth/profile
router.put('/profile', authenticate, AuthController.atualizarPerfil.bind(AuthController));

// POST /api/auth/profile/foto
router.post('/profile/foto', authenticate, uploadProfilePhoto.single('foto'), AuthController.uploadFotoPerfil.bind(AuthController));

// PUT /api/auth/alterar-senha
router.put('/alterar-senha', authenticate, AuthController.alterarSenha.bind(AuthController));

// GET /api/auth/challenge
router.get('/challenge', authenticate, AuthController.getChallenge.bind(AuthController));

// POST /api/auth/verify-challenge
router.post('/verify-challenge', authenticate, AuthController.verifyChallenge.bind(AuthController));

module.exports = router;
