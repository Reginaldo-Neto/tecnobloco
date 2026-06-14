'use strict';

const { HTTP } = require('../../config/constants');

class AppError extends Error {
  constructor(message, statusCode = HTTP.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details   = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function formatValidationErrors(errors) {
  return errors.map(e => ({ field: e.param || e.path, message: e.msg || e.message }));
}

function notFound(resource = 'Recurso') {
  return new AppError(`${resource} não encontrado`, HTTP.NOT_FOUND);
}

function forbidden(message = 'Acesso negado') {
  return new AppError(message, HTTP.FORBIDDEN);
}

function unauthorized(message = 'Não autenticado') {
  return new AppError(message, HTTP.UNAUTHORIZED);
}

function conflict(message = 'Conflito de dados') {
  return new AppError(message, HTTP.CONFLICT);
}

module.exports = { AppError, formatValidationErrors, notFound, forbidden, unauthorized, conflict };
