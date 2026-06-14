'use strict';

// Níveis de acesso hierárquicos
const NIVEL = {
  MENOR_APRENDIZ:  0,
  ESTAGIARIO:      1,
  AUXILIAR:        2,
  OPERADOR:        3,
  SUPERVISOR:      4,
  GERENTE:         5,
  DIRETOR:         6,
  ADMIN:           7,
};

// Perfis externos (fora da hierarquia interna)
const PERFIL_EXTERNO = {
  FORNECEDOR: 'fornecedor',
  CLIENTE:    'cliente',
};

// Departamentos do sistema
const DEPARTAMENTO = {
  TI:              'TI',
  SAC:             'SAC',
  LIMPEZA:         'Limpeza',
  LAVANDERIA:      'Lavanderia',
  SERVICOS_GERAIS: 'Serviços Gerais',
  FROTAS:          'Frotas',
  MANUTENCAO:      'Manutenção',
  ESTOQUE:         'Estoque',
  QUALIDADE:       'Qualidade',
  PRODUCAO:        'Produção',
  ADMINISTRACAO:   'Administração',
  RH:              'RH',
  VENDAS:          'Vendas',
  FINANCEIRO:      'Financeiro',
  SEGURANCA:       'Segurança',
  DIRETORIA:       'Diretoria',
  COMPRAS:         'Compras',
  FORNECEDORES:    'Fornecedores',
  CLIENTES:        'Clientes',
};

// Códigos HTTP padronizados
const HTTP = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  INTERNAL_SERVER_ERROR: 500,
};

// Tipos de evento para trilha de auditoria
const AUDITORIA = {
  LOGIN:            'LOGIN',
  LOGOUT:           'LOGOUT',
  ACESSO_NEGADO:    'ACESSO_NEGADO',
  CRIACAO:          'CRIACAO',
  ALTERACAO:        'ALTERACAO',
  EXCLUSAO:         'EXCLUSAO',
  VISUALIZACAO:     'VISUALIZACAO',
  EXPORTACAO:       'EXPORTACAO',
  IMPORTACAO:       'IMPORTACAO',
  APROVACAO:        'APROVACAO',
  REJEICAO:         'REJEICAO',
  ERRO_SISTEMA:     'ERRO_SISTEMA',
};

// Módulos do sistema (para controle de permissões)
const MODULOS = {
  AUTH:         'auth',
  USUARIOS:     'usuarios',
  PERMISSOES:   'permissoes',
  DASHBOARD:    'dashboard',
  RH:           'rh',
  FINANCEIRO:   'financeiro',
  PRODUCAO:     'producao',
  QUALIDADE:    'qualidade',
  ESTOQUE:      'estoque',
  MANUTENCAO:   'manutencao',
  VENDAS:       'vendas',
  COMPRAS:      'compras',
  FROTA:        'frota',
  LIMPEZA:      'limpeza',
  LAVANDERIA:   'lavanderia',
  TI:           'ti',
  SEGURANCA:    'seguranca',
  JURIDICO:     'juridico',
  ADMIN:        'admin',
  AUDITORIA:    'auditoria',
  NOTIFICACOES: 'notificacoes',
};

// Ações possíveis em módulos (para permissões granulares)
const ACOES = {
  VER:     'ver',
  CRIAR:   'criar',
  EDITAR:  'editar',
  DELETAR: 'deletar',
  APROVAR: 'aprovar',
  EXPORTAR:'exportar',
};

module.exports = { NIVEL, PERFIL_EXTERNO, DEPARTAMENTO, HTTP, AUDITORIA, MODULOS, ACOES };
