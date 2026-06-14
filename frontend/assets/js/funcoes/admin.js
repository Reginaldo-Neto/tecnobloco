'use strict';
/**
 * Funções do módulo de Administração Master.
 */
const FuncoesAdmin = {

  f01GerenciarUsuarios: () => FuncaoCore.executar({
    titulo: 'Gerenciar Usuários',
    descricao: 'Cadastro, edição, ativação/desativação e redefinição de senha de todos os usuários do sistema.',
    nivelMinimo: 6,
    render: (user) => window.AdminForms && window.AdminForms.f01GerenciarUsuarios(user),
  }),

  f02GerenciarDepartamentos: () => FuncaoCore.executar({
    titulo: 'Departamentos',
    descricao: 'Criação e gestão dos departamentos da empresa utilizados no sistema.',
    nivelMinimo: 6,
    render: (user) => window.AdminForms && window.AdminForms.f02GerenciarDepartamentos(user),
  }),

  f03GerenciarCargos: () => FuncaoCore.executar({
    titulo: 'Cargos e Níveis de Acesso',
    descricao: 'Cadastro dos cargos e definição dos níveis de acesso padrão para cada função.',
    nivelMinimo: 6,
    render: (user) => window.AdminForms && window.AdminForms.f03GerenciarCargos(user),
  }),

  f04LogAuditoria: () => FuncaoCore.executar({
    titulo: 'Log de Auditoria',
    descricao: 'Visualização dos eventos registrados no log de auditoria do sistema com filtros avançados.',
    nivelMinimo: 6,
    render: (user) => window.AdminForms && window.AdminForms.f04LogAuditoria(user),
  }),

  f05BugReports: () => FuncaoCore.executar({
    titulo: 'Bug Reports',
    descricao: 'Gestão dos relatórios de erros enviados pelos usuários do sistema.',
    nivelMinimo: 6,
    render: (user) => window.AdminForms && window.AdminForms.f05BugReports(user),
  }),
};

window.FuncoesAdmin = FuncoesAdmin;
