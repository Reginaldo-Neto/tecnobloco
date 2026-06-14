'use strict';
/**
 * Funções do setor de Vendas.
 */
const FuncoesVendas = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala de Trabalho',
    descricao: 'Visualiza a escala de turnos e atendimentos dos colaboradores de Vendas.',
    nivelMinimo: 0, departamentos: ['Vendas'],
    render: (user) => window.VendasForms && window.VendasForms.f01VerEscala(user),
  }),

  f02PedidosVenda: () => FuncaoCore.executar({
    titulo: 'Pedidos de Venda',
    descricao: 'Criação, consulta e gestão dos pedidos de venda e seu status de processamento.',
    nivelMinimo: 3, departamentos: ['Vendas'],
    render: (user) => window.VendasForms && window.VendasForms.f02PedidosVenda(user),
  }),

  f03Clientes: () => FuncaoCore.executar({
    titulo: 'Clientes',
    descricao: 'Cadastro e manutenção de clientes (pessoa física e jurídica) com dados de contato e histórico.',
    nivelMinimo: 3, departamentos: ['Vendas'],
    render: (user) => window.VendasForms && window.VendasForms.f03Clientes(user),
  }),

  f04ExpedicaoPedidos: () => FuncaoCore.executar({
    titulo: 'Expedição de Pedidos',
    descricao: 'Confirmação da saída de mercadorias e atualização do status dos pedidos para "expedido".',
    nivelMinimo: 3, departamentos: ['Vendas'],
    render: (user) => window.VendasForms && window.VendasForms.f04ExpedicaoPedidos(user),
  }),

  f05FaturamentoPedido: () => FuncaoCore.executar({
    titulo: 'Faturamento de Pedidos',
    descricao: 'Baixa e faturamento dos pedidos expedidos, registrando o valor faturado no mês.',
    nivelMinimo: 4, departamentos: ['Vendas'],
    render: (user) => window.VendasForms && window.VendasForms.f05FaturamentoPedido(user),
  }),

  f06GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas de Vendas',
    descricao: 'Define turnos e plantões dos representantes e atendentes de vendas.',
    nivelMinimo: 4, departamentos: ['Vendas'],
    render: (user) => window.VendasForms && window.VendasForms.f06GerenciarEscalas(user),
  }),
};

window.FuncoesVendas = FuncoesVendas;
