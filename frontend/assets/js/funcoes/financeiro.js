'use strict';
/**
 * Funções do setor Financeiro.
 */
const FuncoesFinanceiro = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala de Trabalho',
    descricao: 'Visualiza a escala de turnos dos colaboradores do Financeiro.',
    nivelMinimo: 0, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f01VerEscala(user),
  }),

  f02ContasPagar: () => FuncaoCore.executar({
    titulo: 'Contas a Pagar',
    descricao: 'Gestão de pagamentos a fornecedores, serviços e obrigações fiscais com controle de vencimentos.',
    nivelMinimo: 4, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f02ContasPagar(user),
  }),

  f03ContasReceber: () => FuncaoCore.executar({
    titulo: 'Contas a Receber',
    descricao: 'Controle de títulos a receber de clientes, cobranças e liquidações.',
    nivelMinimo: 4, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f03ContasReceber(user),
  }),

  f04FluxoCaixa: () => FuncaoCore.executar({
    titulo: 'Fluxo de Caixa',
    descricao: 'Projeção e análise do fluxo de entradas e saídas financeiras do período.',
    nivelMinimo: 5, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f04FluxoCaixa(user),
  }),

  f05PlanoConta: () => FuncaoCore.executar({
    titulo: 'Plano de Contas',
    descricao: 'Estrutura contábil de categorias para classificação de receitas e despesas.',
    nivelMinimo: 5, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f05PlanoConta(user),
  }),

  f06Fornecedores: () => FuncaoCore.executar({
    titulo: 'Gestão de Fornecedores',
    descricao: 'Cadastro e manutenção de fornecedores com dados fiscais e bancários.',
    nivelMinimo: 4, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f06Fornecedores(user),
  }),

  f07MovimentosBancarios: () => FuncaoCore.executar({
    titulo: 'Movimentos Bancários',
    descricao: 'Registro e conciliação de lançamentos bancários de crédito e débito.',
    nivelMinimo: 5, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f07MovimentosBancarios(user),
  }),

  f08CentrosCusto: () => FuncaoCore.executar({
    titulo: 'Centros de Custo',
    descricao: 'Cadastro e gestão dos centros de custo para rateio de despesas por departamento.',
    nivelMinimo: 5, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f08CentrosCusto(user),
  }),

  f09Adiantamentos: () => FuncaoCore.executar({
    titulo: 'Adiantamentos Financeiros',
    descricao: 'Aprovação e controle de adiantamentos salariais encaminhados pelo RH.',
    nivelMinimo: 5, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f09Adiantamentos(user),
  }),

  f10GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas do Financeiro',
    descricao: 'Define turnos e horários dos colaboradores do departamento Financeiro.',
    nivelMinimo: 5, departamentos: ['Financeiro'],
    render: (user) => window.FinanceiroForms && window.FinanceiroForms.f10GerenciarEscalas(user),
  }),
};

window.FuncoesFinanceiro = FuncoesFinanceiro;
