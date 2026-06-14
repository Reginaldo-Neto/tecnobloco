'use strict';
/**
 * Funções do setor de Manutenção.
 */
const FuncoesManutencao = {

  f01VerOsRespondidas: () => FuncaoCore.executar({
    titulo: 'Ver OS Respondidas / Recebidas',
    descricao: 'Painel de ordens de serviço abertas pelos outros setores. Dados alimentados pelas solicitações de OS via Funções Globais.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f01VerOsRespondidas(user),
  }),

  f02GerenciarOS: () => FuncaoCore.executar({
    titulo: 'Gerenciar OS (Ordens de Serviço)',
    descricao: 'Distribuir ordens para técnicos, alterar prioridade, registrar atualizações e fechar os chamados no sistema.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f02GerenciarOS(user),
  }),

  f03ApontamentoHorasMateriais: () => FuncaoCore.executar({
    titulo: 'Apontamento de Horas e Materiais',
    descricao: 'Registro das horas trabalhadas por técnico em cada OS e dos materiais/peças consumidos no reparo.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f03ApontamentoHorasMateriais(user),
  }),

  f04PlanoMestreManutencao: () => FuncaoCore.executar({
    titulo: 'Plano Mestre de Manutenção',
    descricao: 'Cadastro e gestão do plano de manutenção preventiva (MP) de todos os equipamentos com frequência e checklist.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f04PlanoMestreManutencao(user),
  }),

  f05ArvoreAtivos: () => FuncaoCore.executar({
    titulo: 'Árvore de Ativos (Tag de Equipamentos)',
    descricao: 'Hierarquia de todos os equipamentos da fábrica (Fábrica > Setor > Máquina > Componente) com código de identificação.',
    nivelMinimo: 3, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f05ArvoreAtivos(user),
  }),

  f06ProntuarioEquipamento: () => FuncaoCore.executar({
    titulo: 'Prontuário do Equipamento',
    descricao: 'Ficha técnica completa de uma máquina: fabricante, modelo, manual, histórico completo de falhas e intervenções.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f06ProntuarioEquipamento(user),
  }),

  f07GestaoEstoquePecas: () => FuncaoCore.executar({
    titulo: 'Gestão de Estoque de Peças (MRO)',
    descricao: 'Controle de rolamentos, correias, filtros e outras peças de reposição armazenadas na oficina de manutenção.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f07GestaoEstoquePecas(user),
  }),

  f08SolicitacaoCompraPecas: () => FuncaoCore.executar({
    titulo: 'Solicitação de Compra de Peças',
    descricao: 'Geração de pedido de compra para peças e insumos técnicos urgentes ou programados encaminhado ao Financeiro/Compras.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f08SolicitacaoCompraPecas(user),
  }),

  f09ControleFerramentas: () => FuncaoCore.executar({
    titulo: 'Controle de Ferramentas',
    descricao: 'Inventário de ferramentas do setor (chaves, torquímetros, multímetros), incluindo empréstimos e devoluções.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f09ControleFerramentas(user),
  }),

  f10MapaLubrificacao: () => FuncaoCore.executar({
    titulo: 'Mapa de Lubrificação',
    descricao: 'Roteiro e registro das lubrificações periódicas em pontos críticos dos equipamentos para evitar desgaste prematuro.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f10MapaLubrificacao(user),
  }),

  f11CalibracaoInstrumentos: () => FuncaoCore.executar({
    titulo: 'Calibração de Instrumentos',
    descricao: 'Controle de validade das calibrações de manômetros, termômetros e balanças industriais conforme normas ISO/INMETRO.',
    nivelMinimo: 3, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f11CalibracaoInstrumentos(user),
  }),

  f12ManutencaoUtilidades: () => FuncaoCore.executar({
    titulo: 'Manutenção de Utilidades',
    descricao: 'Gestão de sistemas de apoio: caldeira a vapor, compressores de ar, sistemas de refrigeração e redes de água gelada.',
    nivelMinimo: 3, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f12ManutencaoUtilidades(user),
  }),

  f13GestaoTerceiros: () => FuncaoCore.executar({
    titulo: 'Gestão de Terceiros (Prestadores de Serviço)',
    descricao: 'Controle de empresas contratadas para manutenções especializadas, incluindo permissão de entrada e avaliação do serviço.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f13GestaoTerceiros(user),
  }),

  f14IndicadoresMTBF: () => FuncaoCore.executar({
    titulo: 'Indicadores MTBF / MTTR / OEE',
    descricao: 'Painel de KPIs de manutenção: Tempo Médio entre Falhas, Tempo Médio de Reparo e Eficiência Global dos Equipamentos.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f14IndicadoresMTBF(user),
  }),

  f15GerenciarEscalaManutencao: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escala e Datas de Manutenção',
    descricao: 'Define e publica o calendário de manutenções programadas e a escala de plantão técnico para fins de semana e feriados.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f15GerenciarEscalaManutencao(user),
  }),

  f16PendenciasAuditoria: () => FuncaoCore.executar({
    titulo: 'Visualizar Pendências de Auditoria',
    descricao: 'Lista de não conformidades de equipamentos ou instalações identificadas em auditorias do SIF, MAPA ou qualidade interna.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f16PendenciasAuditoria(user),
  }),

  f17MonitoramentoSalaFria: () => FuncaoCore.executar({
    titulo: 'Monitoramento da Sala Fria',
    descricao: 'Dashboard em tempo real das temperaturas das câmaras frigoríficas com alertas automáticos de desvio de temperatura.',
    nivelMinimo: 3, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f17MonitoramentoSalaFria(user),
  }),

  f18LeituraHidrometros: () => FuncaoCore.executar({
    titulo: 'Leitura de Hidrômetros e Medidores',
    descricao: 'Registro diário de consumo de água, energia elétrica e gás para controle de custos e detecção de vazamentos.',
    nivelMinimo: 2, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f18LeituraHidrometros(user),
  }),

  f19VerDadosCaldeira: () => FuncaoCore.executar({
    titulo: 'Ver Dados da Caldeira',
    descricao: 'Painel de operação e histórico da caldeira a vapor: pressão, temperatura, consumo de combustível e registros de segurança.',
    nivelMinimo: 4, departamentos: ['Manutenção'],
    render: (user) => window.ManutencaoForms && window.ManutencaoForms.f19VerDadosCaldeira(user),
  }),
};

window.FuncoesManutencao = FuncoesManutencao;
