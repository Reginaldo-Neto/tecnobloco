'use strict';

const rateLimit = require('express-rate-limit');

// Limitador geral da API
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      Number(process.env.RATE_LIMIT_MAX) || 500,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

// Limitador mais restritivo para login (anti-bruteforce)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

module.exports = { apiLimiter, authLimiter };
