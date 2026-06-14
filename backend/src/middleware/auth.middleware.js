'use strict';

const JWTService = require('../services/auth/JWTService');
const { unauthorized, forbidden } = require('../utils/errorHandler');
const pool = require('../../config/database');

// Autentica o token JWT e injeta req.user
async function authenticate(req, res, next) {
  try {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return next(unauthorized('Token não informado'));
    }

    const token = header.split(' ')[1];
    const payload = JWTService.verify(token);

    // Verifica se o usuário ainda está ativo no banco e carrega nome do departamento
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.cpf, u.email, u.nivel_acesso, u.departamento_id, u.ativo,
              d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.id = ? AND u.ativo = 1`,
      [payload.id]
    );

    if (!rows.length) return next(unauthorized('Usuário inativo ou não encontrado'));

    req.user = rows[0];
    next();
  } catch (err) {
    return next(unauthorized('Token inválido ou expirado'));
  }
}

// Exige nível de acesso mínimo
function requireNivel(nivelMinimo) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (req.user.nivel_acesso < nivelMinimo) {
      return next(forbidden(`Nível de acesso insuficiente. Necessário: ${nivelMinimo}`));
    }
    next();
  };
}

// Exige que o usuário pertença a um dos departamentos informados.
// Diretores (nivel >= 6) ignoram a restrição de setor.
function requireDepartamento(...departamentos) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (req.user.nivel_acesso >= 6) return next();

    const nomeDept = req.user.departamento || '';
    if (!departamentos.includes(nomeDept)) {
      return next(forbidden('Acesso restrito ao setor responsável'));
    }
    next();
  };
}

module.exports = { authenticate, requireNivel, requireDepartamento };
