'use strict';
/**
 * Funções do setor de Compras.
 */
const FuncoesCompras = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala de Trabalho',
    descricao: 'Visualiza a escala de trabalho dos colaboradores do setor de Compras.',
    nivelMinimo: 0, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f01VerEscala(user),
  }),

  f02PedidosCompra: () => FuncaoCore.executar({
    titulo: 'Pedidos de Compra',
    descricao: 'Criação, aprovação e acompanhamento de pedidos de compra a fornecedores.',
    nivelMinimo: 4, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f02PedidosCompra(user),
  }),

  f03Fornecedores: () => FuncaoCore.executar({
    titulo: 'Gestão de Fornecedores',
    descricao: 'Cadastro, avaliação e qualificação de fornecedores com dados fiscais e de contato.',
    nivelMinimo: 4, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f03Fornecedores(user),
  }),

  f04Cotacoes: () => FuncaoCore.executar({
    titulo: 'Cotações',
    descricao: 'Comparativo de preços entre fornecedores para um mesmo pedido de compra.',
    nivelMinimo: 4, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f04Cotacoes(user),
  }),

  f05SolicitacoesInternas: () => FuncaoCore.executar({
    titulo: 'Solicitações Internas',
    descricao: 'Listagem e processamento das solicitações de compra originadas nos demais setores.',
    nivelMinimo: 3, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f05SolicitacoesInternas(user),
  }),

  f06ReceberMercadoria: () => FuncaoCore.executar({
    titulo: 'Receber Mercadoria',
    descricao: 'Confirmação do recebimento de mercadorias conferindo contra o pedido de compra aprovado.',
    nivelMinimo: 3, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f06ReceberMercadoria(user),
  }),

  f07GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas de Compras',
    descricao: 'Define turnos e horários dos compradores e auxiliares administrativos.',
    nivelMinimo: 4, departamentos: ['Compras'],
    render: (user) => window.ComprasForms && window.ComprasForms.f07GerenciarEscalas(user),
  }),
};

window.FuncoesCompras = FuncoesCompras;
