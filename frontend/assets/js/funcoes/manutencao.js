'use strict';
/**
 * Funções do setor de Manutenção.
 */
const FuncoesManutencao = {

  f01VerOsRespondidas: () => FuncaoCore.executar({
    titulo: 'Ver OS Abertas / Em Andamento',
    descricao: 'Painel de ordens de serviço abertas e em andamento com filtros por prioridade e equipamento.',
    nivelMinimo: 1, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f01VerOsRespondidas(user),
  }),

  f02GerenciarOS: () => FuncaoCore.executar({
    titulo: 'Gerenciar OS (Ordens de Serviço)',
    descricao: 'Distribuir ordens para técnicos, alterar status, registrar causa raiz e fechar OS no sistema.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f02GerenciarOS(user),
  }),

  f03ApontamentoHoras: () => FuncaoCore.executar({
    titulo: 'Apontamento de Horas',
    descricao: 'Registro das horas trabalhadas por técnico em cada OS.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f03ApontamentoHoras(user),
  }),

  f04PlanoPreventivo: () => FuncaoCore.executar({
    titulo: 'Plano de Manutenção Preventiva',
    descricao: 'Cadastro e gestão do plano preventivo de todos os equipamentos com frequência e checklist.',
    nivelMinimo: 3, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f04PlanoPreventivo(user),
  }),

  f05ProntuarioEquipamento: () => FuncaoCore.executar({
    titulo: 'Prontuário do Equipamento',
    descricao: 'Ficha técnica completa da máquina: dados, manual, histórico de OS e preventivas.',
    nivelMinimo: 1, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f05ProntuarioEquipamento(user),
  }),

  f06IndicadoresMTBF: () => FuncaoCore.executar({
    titulo: 'Indicadores MTBF / MTTR / OEE',
    descricao: 'Painel de KPIs: Tempo Médio entre Falhas, Tempo Médio de Reparo e Eficiência dos Equipamentos.',
    nivelMinimo: 3, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f06IndicadoresMTBF(user),
  }),

};

window.FuncoesManutencao = FuncoesManutencao;
