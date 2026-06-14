'use strict';
/**
 * Funções do setor de Qualidade — 22 funções conforme cargos e funções.
 * Cada função usa FuncaoCore.executar + render: callback para QualidadeForms.
 */
const FuncoesQualidade = {

  f01AnaliseRecepcao: () => FuncaoCore.executar({
    titulo: 'Análise de Recepção (Plataforma)',
    descricao: 'Registro das análises obrigatórias na plataforma de recepção: granulometria, umidade, resistência, temperatura — para aceitar ou rejeitar a matéria-prima.',
    nivelMinimo: 2, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f01AnaliseRecepcao(user),
  }),

  f02AnalisesFQ: () => FuncaoCore.executar({
    titulo: 'Análises Físico-Químicas',
    descricao: 'Registro e consulta de análises físico-químicas de matéria-prima e produto acabado: gordura, proteína, umidade, pH, acidez, Aw e sal.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f02AnalisesFQ(user),
  }),

  f03AnalisesMicro: () => FuncaoCore.executar({
    titulo: 'Análises Microbiológicas',
    descricao: 'Registro e consulta de análises microbiológicas: coliformes, estafilococos, Salmonella, Listeria, aeróbios mesófilos e bolores/leveduras.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f03AnalisesMicro(user),
  }),

  f04Antibioticos: () => FuncaoCore.executar({
    titulo: 'Monitoramento de Contaminantes',
    descricao: 'Controle de contaminantes e impurezas em matéria-prima usando kits de análise rápida. Registro por lote e fornecedor.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f04Antibioticos(user),
  }),

  f05LiberacaoLotes: () => FuncaoCore.executar({
    titulo: 'Liberação de Lotes (Status)',
    descricao: 'Aprovação formal do lote de produção para expedição após todos os laudos satisfatórios. Permite bloqueio, liberação, reprocesso ou destruição de lotes.',
    nivelMinimo: 4, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f05LiberacaoLotes(user),
  }),

  f06NaoConformidades: () => FuncaoCore.executar({
    titulo: 'Gestão de Não-Conformidades (RNC)',
    descricao: 'Abertura, investigação e encerramento de registros de NC internas e externas com plano de ação corretiva e preventiva (CAPA). Geração de código sequencial.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f06NaoConformidades(user),
  }),

  f07AnaliseSensorial: () => FuncaoCore.executar({
    titulo: 'Análise Sensorial',
    descricao: 'Avaliação organoléptica de produtos: aparência, cor, aroma, textura e sabor. Registro de conformidade por atributo com geração de resultado automático.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f07AnaliseSensorial(user),
  }),

  f08ShelfLife: () => FuncaoCore.executar({
    titulo: 'Controle de Shelf-Life',
    descricao: 'Monitoramento de prazos de validade de lotes produzidos. Alerta para vencimentos próximos e controle de descartes.',
    nivelMinimo: 2, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f08ShelfLife(user),
  }),

  f09Laudos: () => FuncaoCore.executar({
    titulo: 'Emissão de Laudos Técnicos',
    descricao: 'Emissão, consulta e arquivo de laudos técnicos de análise de produto acabado, matéria-prima e produto em processo.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f09Laudos(user),
  }),

  f10AmostrasRetencao: () => FuncaoCore.executar({
    titulo: 'Gestão de Amostras de Retenção',
    descricao: 'Controle de amostras retidas por lote para contraprova. Rastreio de localização, validade e status de cada amostra (ativa, utilizada, descartada).',
    nivelMinimo: 2, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f10AmostrasRetencao(user),
  }),

  f11ControleAguas: () => FuncaoCore.executar({
    titulo: 'Monitoramento de Água e Efluentes',
    descricao: 'Análises periódicas de pH, cloro residual, turbidez e coliformes da água de processo, lavagem, consumo humano e efluentes.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f11ControleAguas(user),
  }),

  f12SwabTest: () => FuncaoCore.executar({
    titulo: 'Swab Test (Higiene)',
    descricao: 'Registro e consulta de swabs de superfícies pós-higienização para verificação de eficácia da limpeza e detecção de microrganismos.',
    nivelMinimo: 2, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f12SwabTest(user),
  }),

  f13ControlePragas: () => FuncaoCore.executar({
    titulo: 'Controle de Pragas',
    descricao: 'Registro das visitas da empresa terceirizada de dedetização, tipos de serviço, pragas detectadas, produtos utilizados e próxima visita programada.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f13ControlePragas(user),
  }),

  f14Reagentes: () => FuncaoCore.executar({
    titulo: 'Estoque de Reagentes',
    descricao: 'Controle do estoque de reagentes de laboratório com movimentação de entrada/saída, alertas de estoque mínimo e controle de validade.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f14Reagentes(user),
  }),

  f15Calibracoes: () => FuncaoCore.executar({
    titulo: 'Calibração de Equipamentos',
    descricao: 'Registro e controle do plano de calibração dos equipamentos de laboratório. Alerta para calibrações vencidas ou próximas do vencimento.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f15Calibracoes(user),
  }),

  f16VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas',
    descricao: 'Visualiza a escala de trabalho do laboratório e as datas de calibração programadas para os próximos 30 dias.',
    nivelMinimo: 0, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f16VerEscala(user),
  }),

  f17SolicitarReanalise: () => FuncaoCore.executar({
    titulo: 'Enviar Relatório de Análise / Reanálise',
    descricao: 'Envio de solicitação formal de reanálise de amostras com motivo, tipo de análise e referência ao registro original.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f17SolicitarReanalise(user),
  }),

  f18GerenciarReanalises: () => FuncaoCore.executar({
    titulo: 'Gerenciar Solicitação de Reanálise',
    descricao: 'Processamento dos pedidos de contraprova: atualização de status, registro do resultado da reanálise e encerramento da solicitação.',
    nivelMinimo: 4, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f18GerenciarReanalises(user),
  }),

  f19EstocagemMP: () => FuncaoCore.executar({
    titulo: 'Registrar Estocagem Entrada/Saída MP',
    descricao: 'Registro de entradas e saídas de matéria-prima pelo setor de qualidade: lote, quantidade, temperatura de recebimento, fornecedor e nota fiscal.',
    nivelMinimo: 3, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f19EstocagemMP(user),
  }),

  f20VisitasFiscais: () => FuncaoCore.executar({
    titulo: 'Registrar Visita / Intimação Fiscal',
    descricao: 'Documentação de visitas do SIF/MAPA/ANVISA/Vigilância Sanitária, incluindo fiscal, tipo de inspeção, exigências, auto de infração e prazo de cumprimento.',
    nivelMinimo: 4, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f20VisitasFiscais(user),
  }),

  f21CargaSpot: () => FuncaoCore.executar({
    titulo: 'Liberação de Carga Spot',
    descricao: 'Análise e liberação/rejeição de cargas spot (material de fornecedores eventuais), com registro de granulometria, umidade, temperatura e volume.',
    nivelMinimo: 4, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f21CargaSpot(user),
  }),

  f22GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas da Qualidade',
    descricao: 'Define os turnos dos analistas de laboratório e plantões de fim de semana para garantia de cobertura contínua do setor de qualidade.',
    nivelMinimo: 4, departamentos: ['Qualidade'],
    render: (user) => window.QualidadeForms && window.QualidadeForms.f22GerenciarEscalas(user),
  }),
};

window.FuncoesQualidade = FuncoesQualidade;
