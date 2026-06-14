'use strict';
/**
 * Funções do setor de Gestão de Frotas.
 */
const FuncoesFrotas = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    descricao: 'Visualiza calendário de manutenções e escalas de plantão.',
    nivelMinimo: 0, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f01VerEscala(user),
  }),

  f02GerenciarFrota: () => FuncaoCore.executar({
    titulo: 'Gerenciar Frota de Veículos',
    descricao: 'Cadastro mestre dos veículos (Placa, Modelo, Ano, Renavam), controle de documentos e status.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f02GerenciarVeiculos(user),
  }),

  f03EscalaUsoVeiculos: () => FuncaoCore.executar({
    titulo: 'Escala de Uso dos Veículos',
    descricao: 'Define qual veículo será usado por qual motorista ou setor em determinado dia/horário.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f09GerenciarEscalas(user),
  }),

  f04GestaoMotoristas: () => FuncaoCore.executar({
    titulo: 'Gestão de Motoristas e CNH',
    descricao: 'Cadastro dos condutores, controle de vencimento de CNH, categorias habilitadas e exames toxicológicos.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f04GestaoMotoristas(user),
  }),

  f05RotasColeta: () => FuncaoCore.executar({
    titulo: 'Gerenciamento de Rotas de Entrega/Coleta',
    descricao: 'Planejamento logístico das rotas de entrega de produtos e coleta de matéria-prima.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f05RotasColeta(user),
  }),

  f06ConsumoVeiculos: () => FuncaoCore.executar({
    titulo: 'Gerenciamento de Consumo dos Veículos',
    descricao: 'Análise comparativa de consumo (Km/L) baseada nos abastecimentos registrados.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f06ConsumoVeiculos(user),
  }),

  f07DepreciacaoVeiculos: () => FuncaoCore.executar({
    titulo: 'Gerenciamento da Depreciação dos Veículos',
    descricao: 'Monitoramento da depreciação do ativo com cálculo automático baseado em idade e uso.',
    nivelMinimo: 5, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f07DepreciacaoVeiculos(user),
  }),

  f08RotaEntrega: () => FuncaoCore.executar({
    titulo: 'Gerenciamento de Rota de Entrega',
    descricao: 'Definição da sequência de clientes para o caminhão de entrega de produtos acabados.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f08RotaEntrega(user),
  }),

  f09SolicitacaoUsoVeiculos: () => FuncaoCore.executar({
    titulo: 'Ver Solicitação de Uso dos Veículos',
    descricao: 'Recebe, aprova ou nega os pedidos de empréstimo de carros feitos por outros setores.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f09SolicitacaoUsoVeiculos(user),
  }),

  f10LocalizacaoMotoristas: () => FuncaoCore.executar({
    titulo: 'Ver Localização Atual dos Motoristas',
    descricao: 'Monitoramento de viagens em andamento com destino e status.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f10LocalizacaoMotoristas(user),
  }),

  f11DadosCaminhoes: () => FuncaoCore.executar({
    titulo: 'Gerenciar Dados dos Caminhões',
    descricao: 'Registro técnico das condições físicas do caminhão (odômetro, fluidos, óleos).',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f11DadosCaminhoes(user),
  }),

  f12PlanoManutencaoPreventiva: () => FuncaoCore.executar({
    titulo: 'Plano de Manutenção Preventiva',
    descricao: 'Configuração de alertas automáticos por quilometragem para troca de óleo, filtros e revisão.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f12PlanoManutencaoPreventiva(user),
  }),

  f13HistoricoManutencaoCorretiva: () => FuncaoCore.executar({
    titulo: 'Histórico de Manutenção Corretiva',
    descricao: 'Registro do que quebrou, quanto custou para arrumar e qual oficina realizou o serviço.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f13HistoricoManutencaoCorretiva(user),
  }),

  f14GestaoPneus: () => FuncaoCore.executar({
    titulo: 'Gestão de Pneus',
    descricao: 'Controle individual de cada pneu por número de fogo, incluindo rodízio e recauchutagem.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f14GestaoPneus(user),
  }),

  f15ManutencaoRefrigeracao: () => FuncaoCore.executar({
    titulo: 'Manutenção de Refrigeração (Thermo King)',
    descricao: 'Controle específico dos equipamentos de frio dos baús com pressões e nível de gás.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f15ManutencaoRefrigeracao(user),
  }),

  f16HigienizacaoTanques: () => FuncaoCore.executar({
    titulo: 'Controle de Higienização de Tanques',
    descricao: 'Registro das lavagens e limpeza dos tanques rodoviários e silos para garantir a qualidade dos materiais.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f16HigienizacaoTanques(user),
  }),

  f17ControleAbastecimento: () => FuncaoCore.executar({
    titulo: 'Controle de Abastecimento',
    descricao: 'Lançamento das notas de abastecimento com litros, valor e hodômetro.',
    nivelMinimo: 2, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f17ControleAbastecimento(user),
  }),

  f18GestaoMultas: () => FuncaoCore.executar({
    titulo: 'Gestão de Multas e Infrações',
    descricao: 'Recebimento de multas de trânsito e identificação do condutor responsável.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f18GestaoMultas(user),
  }),

  f19ControlePedagios: () => FuncaoCore.executar({
    titulo: 'Controle de Pedágios / Sem Parar',
    descricao: 'Gestão das tags de pedágio automático e conciliação dos custos por rota.',
    nivelMinimo: 2, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f19ControlePedagios(user),
  }),

  f20ChecklistSaidaRetorno: () => FuncaoCore.executar({
    titulo: 'Checklist de Saída e Retorno',
    descricao: 'Formulário que o motorista preenche ao pegar e devolver o veículo.',
    nivelMinimo: 2, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f20ChecklistSaidaRetorno(user),
  }),

  f21RegistroSinistros: () => FuncaoCore.executar({
    titulo: 'Registro de Sinistros',
    descricao: 'Abertura de processo em caso de acidentes, batidas ou roubo de carga/veículo.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f21RegistroSinistros(user),
  }),

  f22QualidadeLeiteProdutor: () => FuncaoCore.executar({
    titulo: 'Painel de Qualidade de Materiais (Fornecedor)',
    descricao: 'Visão simplificada da qualidade de matéria-prima recebida por veículo/fornecedor.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f22QualidadeLeiteProdutor(user),
  }),

  f23TanquesComunItarios: () => FuncaoCore.executar({
    titulo: 'Gestão de Silos e Tanques',
    descricao: 'Controle de carga e descarga em silos e tanques compartilhados de matéria-prima.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f23TanquesComunitarios(user),
  }),

  f24HistoricoCaptacao: () => FuncaoCore.executar({
    titulo: 'Histórico de Recebimento',
    descricao: 'Relatório histórico de volume de matéria-prima recebida compilado dos registros de entrada.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f24HistoricoCaptacao(user),
  }),

  f25CapturaPesagem: () => FuncaoCore.executar({
    titulo: 'Captura de Pesagem (Tara x Bruto)',
    descricao: 'Registro do peso do caminhão na entrada (cheio) e saída (vazio) com cálculo de divergência.',
    nivelMinimo: 2, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f25CapturaPesagem(user),
  }),

  f26ConfDivergenciaPeso: () => FuncaoCore.executar({
    titulo: 'Conferência de Divergência de Peso',
    descricao: 'Painel comparativo de pesagem vs. volume fiscal com alertas automáticos.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f26ConfDivergenciaPeso(user),
  }),

  f27ExecucaoRotaColeta: () => FuncaoCore.executar({
    titulo: 'Execução de Rota de Coleta/Entrega',
    descricao: 'Tela do motorista para iniciar rota de coleta de materiais ou entrega de produtos com seleção de veículo e KM.',
    nivelMinimo: 2, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f27ExecucaoRotaColeta(user),
  }),

  f28ExecucaoRotaEntrega: () => FuncaoCore.executar({
    titulo: 'Execução de Rota de Entrega',
    descricao: 'Tela do motorista para iniciar rota de entrega de produtos com seleção de veículo e KM.',
    nivelMinimo: 2, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f28ExecucaoRotaEntrega(user),
  }),

  f29PainelAlertas: () => FuncaoCore.executar({
    titulo: 'Painel de Alertas da Frota',
    descricao: 'Dashboard de alertas: CNH vencidas, preventivas em atraso, sinistros abertos e multas pendentes.',
    nivelMinimo: 3, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f29PainelAlertas(user),
  }),

  f30RelatorioCustos: () => FuncaoCore.executar({
    titulo: 'Relatório de Custos da Frota',
    descricao: 'Custo total por veículo: abastecimento, manutenções e multas no período selecionado.',
    nivelMinimo: 4, departamentos: ['Frotas'],
    render: (user) => window.FrotasForms && window.FrotasForms.f30RelatorioCustos(user),
  }),
};

// Aliases usados pelo dashboard e componentes de setor
FuncoesFrotas.f02GerenciarVeiculos = () => FuncaoCore.executar({ titulo:'Gerenciar Veículos', descricao:'Cadastro e atualização de veículos da frota.', nivelMinimo:4, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f02GerenciarVeiculos(u) });
FuncoesFrotas.f03RegistrarViagem   = () => FuncaoCore.executar({ titulo:'Registrar Viagem', descricao:'Abertura de nova viagem com veículo, motorista e destino.', nivelMinimo:3, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f03RegistrarViagem(u) });
FuncoesFrotas.f03bHistoricoViagens = () => FuncaoCore.executar({ titulo:'Histórico de Viagens', descricao:'Lista completa de viagens com busca por veículo, motorista ou destino e totalizador de KM.', nivelMinimo:3, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f03bHistoricoViagens(u) });
FuncoesFrotas.f04FinalizarViagem   = () => FuncaoCore.executar({ titulo:'Finalizar Viagem', descricao:'Encerramento de viagem em andamento com hodômetro de chegada.', nivelMinimo:3, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f04FinalizarViagem(u) });
FuncoesFrotas.f05Abastecimento     = () => FuncaoCore.executar({ titulo:'Abastecimento', descricao:'Registro de abastecimentos com litros, valor e hodômetro.', nivelMinimo:3, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f05Abastecimento(u) });
FuncoesFrotas.f06Manutencao        = () => FuncaoCore.executar({ titulo:'Manutenções', descricao:'Registro de manutenções preventivas e corretivas.', nivelMinimo:3, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f06Manutencao(u) });
FuncoesFrotas.f07Multas            = () => FuncaoCore.executar({ titulo:'Multas', descricao:'Registro de infrações de trânsito dos veículos da frota.', nivelMinimo:4, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f07Multas(u) });
FuncoesFrotas.f08Checklist         = () => FuncaoCore.executar({ titulo:'Checklist Veículo', descricao:'Registro de pré e pós-viagem com itens conferidos.', nivelMinimo:3, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f08Checklist(u) });
FuncoesFrotas.f09GerenciarEscalas  = () => FuncaoCore.executar({ titulo:'Gerenciar Escalas', descricao:'Define turnos e disponibilidade dos motoristas.', nivelMinimo:4, departamentos:['Frotas'], render:(u)=>window.FrotasForms&&window.FrotasForms.f09GerenciarEscalas(u) });

window.FuncoesFrotas = FuncoesFrotas;
