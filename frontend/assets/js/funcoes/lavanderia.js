'use strict';
/**
 * Funções do setor de Lavanderia.
 */
const FuncoesLavanderia = {

  f01RecebimentoTriagem: () => FuncaoCore.executar({
    titulo: 'Recebimento e Triagem',
    descricao: 'Registra a entrada de uniformes sujos, separando por setor e nível de sujeira para definir o processo de lavagem correto.',
    nivelMinimo: 2, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f01RecebimentoTriagem(user),
  }),

  f02RegistroCiclosLavagem: () => FuncaoCore.executar({
    titulo: 'Registro de Ciclos de Lavagem',
    descricao: 'Controla quantas vezes um uniforme foi lavado (vida útil) e registra o lote de lavagem para garantir temperatura e tempo adequados.',
    nivelMinimo: 2, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f02RegistroCiclosLavagem(user),
  }),

  f03ControleQuimicos: () => FuncaoCore.executar({
    titulo: 'Controle de Químicos',
    descricao: 'Monitora o consumo de sabão industrial, cloro e amaciante por quilo de roupa lavada, evitando desperdício.',
    nivelMinimo: 3, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f03ControleQuimicos(user),
  }),

  f04HigienizacaoBotasAventais: () => FuncaoCore.executar({
    titulo: 'Higienização de Botas e Aventais',
    descricao: 'Processo específico para limpeza e desinfecção de botas de borracha e aventais plásticos.',
    nivelMinimo: 2, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f04HigienizacaoBotasAventais(user),
  }),

  f05EntregaLimpos: () => FuncaoCore.executar({
    titulo: 'Entrega de Limpos',
    descricao: 'Registra a devolução do uniforme limpo para o funcionário ou setor, dando baixa na pendência.',
    nivelMinimo: 2, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f05EntregaLimpos(user),
  }),

  f06EstoqueUniformesNovos: () => FuncaoCore.executar({
    titulo: 'Estoque de Uniformes Novos',
    descricao: 'Gerencia o almoxarifado de roupas que ainda não foram usadas, controlando numeração e quantidade mínima.',
    nivelMinimo: 4, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f06EstoqueUniformesNovos(user),
  }),

  f07BaixaDescarte: () => FuncaoCore.executar({
    titulo: 'Baixa e Descarte',
    descricao: 'Registra uniformes rasgados ou manchados que precisam ser descartados e substituídos (gera custo).',
    nivelMinimo: 4, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f07BaixaDescarte(user),
  }),

  f08GestaoReparos: () => FuncaoCore.executar({
    titulo: 'Gestão de Reparos (Costura)',
    descricao: 'Controle de peças que estão na costura para pregar botões, zíperes ou remendos.',
    nivelMinimo: 2, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f08GestaoReparos(user),
  }),

  f09ControleTolhas: () => FuncaoCore.executar({
    titulo: 'Controle de Toalhas',
    descricao: 'Gestão específica do fluxo de toalhas de papel vs. tecido e toalhas de banho para motoristas/visitantes.',
    nivelMinimo: 2, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f09ControleTolhas(user),
  }),

  f10InventarioEnxoval: () => FuncaoCore.executar({
    titulo: 'Inventário de Enxoval',
    descricao: 'Contagem geral de todas as peças de roupa da empresa (em uso + em estoque + sujas) para verificar extravios.',
    nivelMinimo: 4, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f10InventarioEnxoval(user),
  }),

  f11GestaoArmarios: () => FuncaoCore.executar({
    titulo: 'Gestão de Armários (Vestiário)',
    descricao: 'Mapa de qual funcionário utiliza qual armário no vestiário (limpo/sujo), gerenciando chaves e ocupação.',
    nivelMinimo: 3, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f11GestaoArmarios(user),
  }),

  f12SolicitacaoCompraInsumos: () => FuncaoCore.executar({
    titulo: 'Solicitação de Compra de Insumos',
    descricao: 'Gera pedido de compra para produtos químicos ou novos uniformes quando o estoque está baixo.',
    nivelMinimo: 4, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f12SolicitacaoCompraInsumos(user),
  }),

  f13ControleEPIs: () => FuncaoCore.executar({
    titulo: 'Controle de EPIs da Lavanderia',
    descricao: 'Garante que os funcionários da lavanderia (que lidam com roupa suja/química) estejam usando luvas, máscaras e óculos.',
    nivelMinimo: 4, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f13ControleEPIs(user),
  }),

  f14GerenciarSolicitacaoHigienizacao: () => FuncaoCore.executar({
    titulo: 'Gerenciar Solicitação de Higienização',
    descricao: 'Recebe pedidos especiais de limpeza (ex: "Lavagem urgente de uniformes para visita técnica amanhã").',
    nivelMinimo: 3, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f14GerenciarSolicitacaoHigienizacao(user),
  }),

  f15VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    descricao: 'Visualiza escalas de trabalho e manutenção de máquinas. Escalas inseridas pela função "Gerenciar Escalas da Lavanderia".',
    nivelMinimo: 0, departamentos: null,
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f15VerEscala(user),
  }),

  f16GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas da Lavanderia',
    descricao: 'Define os horários, turnos e folgas da equipe operacional da lavanderia.',
    nivelMinimo: 4, departamentos: ['Lavanderia'],
    render: (user) => window.LavanderiaForms && window.LavanderiaForms.f16GerenciarEscalas(user),
  }),
};

window.FuncoesLavanderia = FuncoesLavanderia;
