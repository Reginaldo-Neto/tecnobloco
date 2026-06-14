'use strict';

const express = require('express');
const path    = require('path');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const routes       = require('./routes');
const errorHandler = require('./middleware/error-handler.middleware');
const logger       = require('./utils/logger');

const app = express();

// ── Trust proxy (para IP real atrás de nginx/load-balancer) ──────────────────
app.set('trust proxy', 1);

// ── Segurança (Helmet) ────────────────────────────────────────────────────────
// CSP habilitado: bloqueia scripts/recursos de origens externas não autorizadas.
// 'unsafe-inline' é necessário enquanto o frontend usar <script> inline.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"],
      scriptSrcAttr:  ["'unsafe-inline'"],
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:'],
      connectSrc:     ["'self'", 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'],
      objectSrc:      ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  crossOriginEmbedderPolicy: false, // necessário para servir assets do mesmo host
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
// A API usa Bearer token no header Authorization — não precisa de credentials:true.
// credentials:true só seria necessário com cookies HTTP-only.
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : true, // em dev local permite tudo; em prod defina ALLOWED_ORIGINS
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
// Limite reduzido: 1 MB é mais que suficiente para payloads JSON desta API.
// Payloads grandes (ex: upload de imagens) devem usar multipart em endpoint dedicado.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── HTTP logging ──────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Frontend estático ─────────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../..', 'frontend');
app.use(express.static(frontendPath));

// ── Uploads (manuais PDF) ─────────────────────────────────────────────────────
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ── Rotas da API ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Handler global de erros (deve ser o último middleware) ────────────────────
app.use(errorHandler);

module.exports = app;
