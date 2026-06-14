'use strict';
/**
 * Funções do setor de Produção.
 */
const FuncoesProducao = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    descricao: 'Visualiza a escala de trabalho dos operadores e as paradas programadas para manutenção. Dados inseridos pelo Gestor de Produção.',
    nivelMinimo: 0, departamentos: ['Produção'],
    render: (user) => window.ProducaoForms && window.ProducaoForms.f01VerEscala(user),
  }),

  f02OrdemProducao: () => FuncaoCore.executar({
    titulo: 'Abrir / Gerenciar Ordem de Produção (OP)',
    descricao: 'Criação e gestão das ordens de fabricação de produtos: define receita, quantidade, equipamento e data de execução.',
    nivelMinimo: 4, departamentos: ['Produção'],
    render: (user) => window.ProducaoForms && window.ProducaoForms.f02OrdemProducao(user),
  }),

  f03ApontamentoProducao: () => FuncaoCore.executar({
    titulo: 'Apontamento de Produção',
    descricao: 'Registro pelo operador do início e fim da produção, volumes realizados e eventuais paradas durante o turno.',
    nivelMinimo: 2, departamentos: ['Produção'],
    render: (user) => window.ProducaoForms && window.ProducaoForms.f03ApontamentoProducao(user),
  }),

  f04ControleReceitasFormulas: () => FuncaoCore.executar({
    titulo: 'Controle de Receitas e Fórmulas',
    descricao: 'Cadastro e versionamento das fórmulas de produção (BOM - Bill of Materials) com ingredientes e proporções exatas.',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),

  f05PlanejamentoProducao: () => FuncaoCore.executar({
    titulo: 'Planejamento da Produção (PCP)',
    descricao: 'Programação do mix de produtos a fabricar na semana com base na demanda, estoque disponível e capacidade instalada.',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),

  f06ControlePasteurizacao: () => FuncaoCore.executar({
    titulo: 'Controle de Pasteurização',
    descricao: 'Registro dos parâmetros críticos de cada lote pasteurizado: temperatura, tempo, vazão e resultado do fosfatase.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f07ControlePadronizacao: () => FuncaoCore.executar({
    titulo: 'Controle de Padronização',
    descricao: 'Registro dos ajustes de gordura e proteína realizados para atingir os parâmetros legais de cada produto.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f08ControleCamara: () => FuncaoCore.executar({
    titulo: 'Controle de Câmara Fria',
    descricao: 'Monitoramento das temperaturas das câmaras de maturação e conservação e dos produtos armazenados em cada uma.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f09EmbalagemRotulagem: () => FuncaoCore.executar({
    titulo: 'Embalagem e Rotulagem',
    descricao: 'Registro do processo de embalagem: tipo, quantidade e verificação das informações obrigatórias do rótulo conforme legislação.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f10GestaoPerdas: () => FuncaoCore.executar({
    titulo: 'Gestão de Perdas de Produção',
    descricao: 'Registro e análise das perdas de produto por quebras, derramamentos ou descarte, com identificação da causa raiz.',
    nivelMinimo: 3, departamentos: ['Produção'],
  }),

  f11ConsumoInsumos: () => FuncaoCore.executar({
    titulo: 'Consumo de Insumos e Embalagens',
    descricao: 'Baixa automática de matéria-prima e embalagens consumidas com base na OP, gerando alertas de reposição ao Estoque.',
    nivelMinimo: 3, departamentos: ['Produção'],
  }),

  f12HigienizacaoEquipamentos: () => FuncaoCore.executar({
    titulo: 'Higienização de Equipamentos (CIP/COP)',
    descricao: 'Registro obrigatório dos ciclos de higienização in-place e fora do lugar dos equipamentos produtivos antes e após uso.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f13IndicadoresOEE: () => FuncaoCore.executar({
    titulo: 'Indicadores de Produção (OEE)',
    descricao: 'Dashboard de eficiência global: disponibilidade, desempenho e qualidade dos equipamentos por turno e linha.',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),

  f14RastreabilidadeLote: () => FuncaoCore.executar({
    titulo: 'Rastreabilidade de Lote de Produção',
    descricao: 'Registro que vincula o lote de produto acabado à matéria-prima, operadores, equipamentos e parâmetros do processo.',
    nivelMinimo: 3, departamentos: ['Produção'],
  }),

  f15PendenciasAuditoria: () => FuncaoCore.executar({
    titulo: 'Visualizar Pendências de Auditoria',
    descricao: 'Painel de não conformidades do setor de produção identificadas em auditorias internas ou do SIF/MAPA.',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),

  f16SolicitacaoManutencao: () => FuncaoCore.executar({
    titulo: 'Solicitar Manutenção de Equipamento',
    descricao: 'Abertura de OS de manutenção corretiva diretamente do chão de fábrica quando um equipamento apresenta falha.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f17ControleTemperaturas: () => FuncaoCore.executar({
    titulo: 'Controle de Temperaturas do Processo',
    descricao: 'Registro horário das temperaturas dos tanques, pasteurizadores e câmaras conforme plano APPCC.',
    nivelMinimo: 2, departamentos: ['Produção'],
  }),

  f18GestaoTerceirizacao: () => FuncaoCore.executar({
    titulo: 'Gestão de Industrialização por Encomenda',
    descricao: 'Controle de produção realizada para terceiros (co-packing) ou matéria-prima enviada para industrialização externa.',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),

  f19GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas de Produção',
    descricao: 'Define os turnos de trabalho dos operadores, incluindo horas extras, revezamentos e folgas compensatórias.',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),

  f20CronogramaSanitizacao: () => FuncaoCore.executar({
    titulo: 'Cronograma de Sanitização Geral',
    descricao: 'Planejamento e registro das limpezas gerais periódicas (paradas para higienização total da linha de produção).',
    nivelMinimo: 4, departamentos: ['Produção'],
  }),
};

// Aliases used by dashboard (short names)
FuncoesProducao.f04ControleReceitas    = () => FuncaoCore.executar({ titulo:'Controle de Receitas e Fórmulas', descricao:'Cadastro e versionamento das fórmulas de produção.', nivelMinimo:4, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f04ControleReceitas(u) });
FuncoesProducao.f05ControleTemperatura = () => FuncaoCore.executar({ titulo:'Controle de Temperaturas do Processo', descricao:'Registro horário das temperaturas dos tanques conforme plano APPCC.', nivelMinimo:2, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f05ControleTemperatura(u) });
FuncoesProducao.f06Higienizacao        = () => FuncaoCore.executar({ titulo:'Higienização de Equipamentos (CIP/COP)', descricao:'Registro dos ciclos de higienização dos equipamentos produtivos.', nivelMinimo:2, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f06Higienizacao(u) });
FuncoesProducao.f07RegistroPerdas      = () => FuncaoCore.executar({ titulo:'Gestão de Perdas de Produção', descricao:'Registro e análise das perdas de produto.', nivelMinimo:3, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f07RegistroPerdas(u) });
FuncoesProducao.f08RastreabilidadeLote = () => FuncaoCore.executar({ titulo:'Rastreabilidade de Lote de Produção', descricao:'Vincula o lote de produto acabado à matéria-prima e parâmetros do processo.', nivelMinimo:3, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f08RastreabilidadeLote(u) });
FuncoesProducao.f09IndicadoresOEE      = () => FuncaoCore.executar({ titulo:'Indicadores de Produção (OEE)', descricao:'Dashboard de eficiência global dos equipamentos.', nivelMinimo:4, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f09IndicadoresOEE(u) });
FuncoesProducao.f10GerenciarEscalas    = () => FuncaoCore.executar({ titulo:'Gerenciar Escalas de Produção', descricao:'Define os turnos de trabalho dos operadores.', nivelMinimo:4, departamentos:['Produção'], render:(u)=>window.ProducaoForms&&window.ProducaoForms.f10GerenciarEscalas(u) });

window.FuncoesProducao = FuncoesProducao;
