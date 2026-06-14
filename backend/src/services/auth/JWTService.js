'use strict';

const jwt = require('jsonwebtoken');

// Falha imediata na inicialização se o segredo não estiver configurado.
// Em produção, JWT_SECRET deve ter no mínimo 32 caracteres aleatórios.
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error(
    '[CONFIG] JWT_SECRET não configurado ou fraco. ' +
    'Defina no .env com no mínimo 32 caracteres. ' +
    'Gere um com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

function decode(token) {
  return jwt.decode(token);
}

module.exports = { sign, verify, decode };
