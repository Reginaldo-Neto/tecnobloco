'use strict';
/**
 * Funções do setor de TI.
 */
const FuncoesTI = {

  f01GestaoChamados: () => FuncaoCore.executar({
    titulo: 'Gestão de Chamados (Helpdesk)',
    descricao: 'Painel para receber, classificar, responder e encerrar tickets de suporte abertos pelos usuários (Nível 1 de suporte).',
    nivelMinimo: 2, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f01GestaoChamados(user),
  }),

  f02ResetSenhas: () => FuncaoCore.executar({
    titulo: 'Reset de Senhas',
    descricao: 'Ferramenta administrativa para redefinir credenciais de usuários que esqueceram a senha ou foram bloqueados.',
    nivelMinimo: 2, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f02ResetSenhas(user),
  }),

  f03BaseConhecimento: () => FuncaoCore.executar({
    titulo: 'Base de Conhecimento Interna',
    descricao: 'Criar, editar e organizar tutoriais e manuais técnicos (Wiki) para resolver problemas recorrentes mais rápido.',
    nivelMinimo: 2, departamentos: null,
    render: (user) => window.TiForms && window.TiForms.f03BaseConhecimento(user),
  }),

  f04GestaoEmails: () => FuncaoCore.executar({
    titulo: 'Gestão de E-mails Corporativos',
    descricao: 'Criar novas contas de e-mail para contratados, deletar contas de demitidos e gerenciar grupos de distribuição.',
    nivelMinimo: 3, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f04GestaoEmails(user),
  }),

  f05GestaoAtivos: () => FuncaoCore.executar({
    titulo: 'Gestão de Ativos (Hardware e Software)',
    descricao: 'Controle de inventário de TI: saber quem está com qual notebook, mouse ou licença de software e quando precisa trocar.',
    nivelMinimo: 3, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f05GestaoAtivos(user),
  }),

  f06Infraestrutura: () => FuncaoCore.executar({
    titulo: 'Infraestrutura e Redes',
    descricao: 'Monitoramento de servidores, gestão de backups críticos, firewall e controle físico de acesso (crachás e tags de portas).',
    nivelMinimo: 3, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f06Infraestrutura(user),
  }),

  f07GerenciarBugs: () => FuncaoCore.executar({
    titulo: 'Gerenciar Denúncias de Problemas (BUGs)',
    descricao: 'Recebe os reports de erro, testa para validar se é um bug real e encaminha para correção (Triagem).',
    nivelMinimo: 3, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f07GerenciarBugs(user),
  }),

  f08VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    descricao: 'Visualiza paradas programadas e plantões. Dados inseridos e gerenciados pelo Gestor de TI.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => window.TiForms && window.TiForms.f08VerEscalas(user),
  }),

  f09GerenciarExclusaoDocumentos: () => FuncaoCore.executar({
    titulo: 'Gerenciar Solicitações de Exclusão de Documentos',
    descricao: 'Analisa pedidos de exclusão definitiva de arquivos para evitar fraudes ou perdas acidentais. Apenas gestor autoriza.',
    nivelMinimo: 5, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f09SolicitacoesExclusao(user),
  }),

  f10GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas e Agendamentos de TI',
    descricao: 'Define e cadastra a escala de plantão da equipe técnica e o calendário de janelas de manutenção (paradas de servidor).',
    nivelMinimo: 4, departamentos: ['TI'],
    render: (user) => window.TiForms && window.TiForms.f10GerenciarEscalas(user),
  }),
};

window.FuncoesTI = FuncoesTI;
