'use strict';
/**
 * Funções do setor SAC (Serviço de Atendimento ao Cliente).
 */
const FuncoesSAC = {

  f01GerenciarTickets: () => FuncaoCore.executar({
    titulo: 'Gerenciar Tickets de Reclamação',
    nivelMinimo: 2, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f01GerenciarTickets(user),
  }),

  f02RegistrarAtendimentoAvulso: () => FuncaoCore.executar({
    titulo: 'Registrar Atendimento Avulso',
    nivelMinimo: 2, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f02RegistrarAtendimentoAvulso(user),
  }),

  f03VinculoQualidade: () => FuncaoCore.executar({
    titulo: 'Vínculo com a Qualidade (Rastreabilidade)',
    nivelMinimo: 3, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f03VinculoQualidade(user),
  }),

  f04GestaoGarantiasTrocas: () => FuncaoCore.executar({
    titulo: 'Gestão de Garantias e Trocas',
    nivelMinimo: 4, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f04GestaoGarantiasTrocas(user),
  }),

  f05ClassificacaoMotivos: () => FuncaoCore.executar({
    titulo: 'Classificação de Motivos',
    nivelMinimo: 3, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f05ClassificacaoMotivos(user),
  }),

  f06MonitoramentoNPS: () => FuncaoCore.executar({
    titulo: 'Monitoramento de Satisfação (NPS)',
    nivelMinimo: 4, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f06MonitoramentoNPS(user),
  }),

  f07ComunicacaoMassa: () => FuncaoCore.executar({
    titulo: 'Comunicação e Suporte em Massa',
    nivelMinimo: 4, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f07ComunicacaoMassa(user),
  }),

  f08GestaoRecall: () => FuncaoCore.executar({
    titulo: 'Gestão de Recall',
    nivelMinimo: 5, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f08GestaoRecall(user),
  }),

  f09RelatoriosSLA: () => FuncaoCore.executar({
    titulo: 'Relatórios de SLA',
    nivelMinimo: 4, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f09RelatoriosSLA(user),
  }),

  f10HistoricoCliente: () => FuncaoCore.executar({
    titulo: 'Histórico Completo do Cliente',
    nivelMinimo: 3, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f10HistoricoCliente(user),
  }),

  f11TemplatesResposta: () => FuncaoCore.executar({
    titulo: 'Templates de Resposta',
    nivelMinimo: 4, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f11TemplatesResposta(user),
  }),

  f12BaseConhecimento: () => FuncaoCore.executar({
    titulo: 'Base de Conhecimento (Wiki)',
    nivelMinimo: 2, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f12BaseConhecimento(user),
  }),

  f13ChatCentralizado: () => FuncaoCore.executar({
    titulo: 'Chat Centralizado',
    nivelMinimo: 2, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f13ChatCentralizado(user),
  }),

  f14VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    nivelMinimo: 0, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f14VerEscala(user),
  }),

  f15GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas do SAC',
    nivelMinimo: 4, departamentos: ['SAC'],
    render: (user) => window.SacForms && window.SacForms.f15GerenciarEscalas(user),
  }),
};

window.FuncoesSAC = FuncoesSAC;
