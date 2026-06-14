'use strict';

const pool = require('../../config/database');
const logger = require('../utils/logger');

/**
 * Registra um evento na trilha de auditoria.
 * Uso: await logAudit(req, 'CRIACAO', 'usuarios', id, { antes, depois });
 */
async function logAudit(req, tipoEvento, tabela, registroId = null, dados = {}) {
  try {
    const userId = req.user?.id || null;
    const ip     = req.ip || req.connection?.remoteAddress || null;
    const ua     = req.headers['user-agent'] || null;

    await pool.execute(
      `INSERT INTO auditoria_log
         (usuario_id, tipo_evento, tabela_afetada, registro_id, dados_antes, dados_depois, ip_origem, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tipoEvento,
        tabela,
        registroId,
        dados.antes   ? JSON.stringify(dados.antes)   : null,
        dados.depois  ? JSON.stringify(dados.depois)  : null,
        ip,
        ua,
      ]
    );
  } catch (err) {
    // Falha de auditoria nunca deve derrubar a requisição
    logger.error('[AUDIT] Falha ao registrar evento', { tipoEvento, tabela, err: err.message });
  }
}

/**
 * Middleware de auditoria automática por rota.
 * Configura req.audit para uso nos controllers.
 */
function auditMiddleware(req, res, next) {
  req.audit = (tipoEvento, tabela, registroId, dados) =>
    logAudit(req, tipoEvento, tabela, registroId, dados);
  next();
}

module.exports = { logAudit, auditMiddleware };
