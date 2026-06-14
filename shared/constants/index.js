'use strict';

// Constantes compartilhadas entre frontend e backend
// No backend: require('./shared/constants')
// No frontend: incluir como script ou copiar valores necessários

const NIVEL_ACESSO = {
  MENOR_APRENDIZ:  0,
  ESTAGIARIO:      1,
  AUXILIAR:        2,
  OPERADOR:        3,
  SUPERVISOR:      4,
  GERENTE:         5,
  DIRETOR:         6,
  ADMIN:           7,
};

const NIVEL_LABEL = {
  0: 'Menor Aprendiz',
  1: 'Estagiário',
  2: 'Auxiliar',
  3: 'Operador',
  4: 'Supervisor',
  5: 'Gerente',
  6: 'Diretor',
  7: 'Administrador',
};

const STATUS_PADRAO = {
  ATIVO:    'ativo',
  INATIVO:  'inativo',
  PENDENTE: 'pendente',
  CANCELADO:'cancelado',
};

module.exports = { NIVEL_ACESSO, NIVEL_LABEL, STATUS_PADRAO };
