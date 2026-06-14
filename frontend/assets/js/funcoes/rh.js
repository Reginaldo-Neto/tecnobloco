'use strict';
/**
 * Funções do setor de Recursos Humanos.
 */
const FuncoesRH = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala de Trabalho',
    descricao: 'Visualiza a escala de turnos e folgas dos colaboradores do RH.',
    nivelMinimo: 0, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f01VerEscala(user),
  }),

  f02GerenciarColaboradores: () => FuncaoCore.executar({
    titulo: 'Gerenciar Colaboradores',
    descricao: 'Cadastro completo dos colaboradores: dados pessoais, contratuais, cargo e departamento.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f02GerenciarColaboradores(user),
  }),

  f03RegistroPonto: () => FuncaoCore.executar({
    titulo: 'Registro de Ponto',
    descricao: 'Registro e consulta de entradas e saídas dos colaboradores.',
    nivelMinimo: 3, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f03RegistroPonto(user),
  }),

  f04GerenciarFerias: () => FuncaoCore.executar({
    titulo: 'Gerenciar Férias',
    descricao: 'Agendamento, aprovação e controle do gozo de férias dos colaboradores.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f04GerenciarFerias(user),
  }),

  f05ControleEPI: () => FuncaoCore.executar({
    titulo: 'Controle de EPI',
    descricao: 'Gestão de estoque e entrega de Equipamentos de Proteção Individual.',
    nivelMinimo: 3, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f05ControleEPI(user),
  }),

  f06Treinamentos: () => FuncaoCore.executar({
    titulo: 'Treinamentos',
    descricao: 'Cadastro de treinamentos obrigatórios e opcionais e registro de participações.',
    nivelMinimo: 3, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f06Treinamentos(user),
  }),

  f07Holerites: () => FuncaoCore.executar({
    titulo: 'Holerites',
    descricao: 'Emissão e consulta de holerites mensais dos colaboradores.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f07Holerites(user),
  }),

  f08Adiantamentos: () => FuncaoCore.executar({
    titulo: 'Aprovar Adiantamentos',
    descricao: 'Aprovação e controle de adiantamentos salariais solicitados pelos colaboradores.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f08Adiantamentos(user),
  }),

  f09ListaRamais: () => FuncaoCore.executar({
    titulo: 'Lista de Ramais',
    descricao: 'Consulta do catálogo de ramais internos e celulares dos departamentos.',
    nivelMinimo: 0,
    render: (user) => window.RhForms && window.RhForms.f09ListaRamais(user),
  }),

  f10DenunciasEtica: () => FuncaoCore.executar({
    titulo: 'Canal de Denúncias de Ética',
    descricao: 'Gestão confidencial das denúncias recebidas pelo canal de ética.',
    nivelMinimo: 5, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f10DenunciasEtica(user),
  }),

  f11DocumentosPessoais: () => FuncaoCore.executar({
    titulo: 'Documentos Pessoais',
    descricao: 'Validação e arquivo dos documentos pessoais enviados pelos colaboradores.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f11DocumentosPessoais(user),
  }),

  f12GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas de RH',
    descricao: 'Define turnos, horários e responsabilidades dos colaboradores do RH.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f12GerenciarEscalas(user),
  }),

  f13FichaColaborador: () => FuncaoCore.executar({
    titulo: 'Ficha Completa do Colaborador',
    descricao: 'Visualiza a ficha cadastral completa: dados pessoais, contrato, saúde, dependentes, benefícios e histórico.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f13FichaColaborador(user),
  }),

  f14Afastamentos: () => FuncaoCore.executar({
    titulo: 'Afastamentos',
    descricao: 'Registro e validação de atestados médicos, licenças e afastamentos por doença ou acidente.',
    nivelMinimo: 3, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f14Afastamentos(user),
  }),

  f15Advertencias: () => FuncaoCore.executar({
    titulo: 'Advertências e Ocorrências',
    descricao: 'Registro de advertências verbais, escritas, suspensões e ocorrências disciplinares.',
    nivelMinimo: 5, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f15Advertencias(user),
  }),

  f16MovimentacoesPessoal: () => FuncaoCore.executar({
    titulo: 'Movimentações de Pessoal',
    descricao: 'Registro de promoções, transferências, mudanças de cargo e departamento.',
    nivelMinimo: 5, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f16MovimentacoesPessoal(user),
  }),

  f17Organograma: () => FuncaoCore.executar({
    titulo: 'Organograma / Headcount',
    descricao: 'Visualiza a distribuição de colaboradores por departamento.',
    nivelMinimo: 3,
    render: (user) => window.RhForms && window.RhForms.f17Organograma(user),
  }),

  f18Aniversariantes: () => FuncaoCore.executar({
    titulo: 'Aniversariantes do Mês',
    descricao: 'Lista os colaboradores que fazem aniversário no mês selecionado.',
    nivelMinimo: 0,
    render: (user) => window.RhForms && window.RhForms.f18Aniversariantes(user),
  }),

  f19CanalDenuncia: () => FuncaoCore.executar({
    titulo: 'Enviar Denúncia Anônima',
    descricao: 'Formulário confidencial para envio de denúncias ao canal de ética da empresa.',
    nivelMinimo: 0,
    render: (user) => window.RhForms && window.RhForms.f19CanalDenuncia(user),
  }),

  f20SolicitarAdiantamento: () => FuncaoCore.executar({
    titulo: 'Solicitar Adiantamento Salarial',
    descricao: 'Solicita um adiantamento salarial para aprovação do RH.',
    nivelMinimo: 0,
    render: (user) => window.RhForms && window.RhForms.f20SolicitarAdiantamento(user),
  }),

  f21AlertaCnh: () => FuncaoCore.executar({
    titulo: 'CNH — Alertas de Vencimento',
    descricao: 'Monitora CNHs vencidas e próximas do vencimento dos colaboradores habilitados.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f21AlertaCnh(user),
  }),

  f22GestaoEpiEstoque: () => FuncaoCore.executar({
    titulo: 'EPI — Gestão de Estoque',
    descricao: 'Cadastro e controle de estoque dos EPIs disponíveis para entrega.',
    nivelMinimo: 3, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f22GestaoEpiEstoque(user),
  }),

  f23Recrutamento: () => FuncaoCore.executar({
    titulo: 'Recrutamento & Seleção',
    descricao: 'Gerencia vagas abertas e o pipeline completo de candidatos por etapa.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f23Recrutamento(user),
  }),

  f24Onboarding: () => FuncaoCore.executar({
    titulo: 'Onboarding — Integração',
    descricao: 'Checklist personalizado de integração de novos colaboradores com acompanhamento de progresso.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f24Onboarding(user),
  }),

  f25AvaliacaoDesempenho: () => FuncaoCore.executar({
    titulo: 'Avaliação de Desempenho',
    descricao: 'Avaliações por gestor, auto-avaliação e 360° com pontuação de competências e plano de ação.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f25AvaliacaoDesempenho(user),
  }),

  f26SaudeOcupacional: () => FuncaoCore.executar({
    titulo: 'Saúde Ocupacional (ASO)',
    descricao: 'Registro de exames admissionais, periódicos, retorno e demissionais com alertas de vencimento.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f26SaudeOcupacional(user),
  }),

  f27Cardapio: () => FuncaoCore.executar({
    titulo: 'Cardápio do Refeitório',
    descricao: 'Consulta e edição do cardápio semanal por refeição (café, almoço, jantar, lanche).',
    nivelMinimo: 0,
    render: (user) => window.RhForms && window.RhForms.f27Cardapio(user),
  }),

  f28BancoHoras: () => FuncaoCore.executar({
    titulo: 'Banco de Horas',
    descricao: 'Controle de créditos, débitos e compensações de horas extras dos colaboradores.',
    nivelMinimo: 4, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f28BancoHoras(user),
  }),

  f29RelatoriosRH: () => FuncaoCore.executar({
    titulo: 'Relatórios de RH',
    descricao: 'Relatórios gerenciais de turnover mensal e absenteísmo por colaborador/departamento.',
    nivelMinimo: 5, departamentos: ['RH'],
    render: (user) => window.RhForms && window.RhForms.f29RelatoriosRH(user),
  }),
};

window.FuncoesRH = FuncoesRH;
