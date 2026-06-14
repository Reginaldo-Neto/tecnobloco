'use strict';

const { HTTP } = require('../../config/constants');
const logger = require('../utils/logger');

// Handler global de erros — deve ser registrado APÓS todas as rotas
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status  = err.statusCode || HTTP.INTERNAL_SERVER_ERROR;

  // Erros operacionais (AppError) têm mensagem segura para o cliente.
  // Erros não-operacionais exibem mensagem genérica e registram o stack no log.
  const message = err.isOperational ? err.message : 'Erro interno do servidor';

  if (!err.isOperational) {
    // Stack trace só vai para o log — NUNCA para o cliente
    logger.error('[ERROR]', {
      message: err.message,
      stack:   err.stack,
      path:    req.path,
      method:  req.method,
    });
  }

  // Resposta ao cliente: nunca expõe stack trace, detalhes internos ou versão
  res.status(status).json({
    success: false,
    message,
    ...(err.isOperational && err.details && { details: err.details }),
  });
}

module.exports = errorHandler;
