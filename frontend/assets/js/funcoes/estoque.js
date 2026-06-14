'use strict';
/**
 * Funções do setor de Estoque e Compras.
 * Cada entrada liga FuncaoCore ao render em EstoqueForms.
 */
const FuncoesEstoque = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas do Setor',
    descricao: 'Visualiza a escala de trabalho e paradas programadas inseridas pelo gestor.',
    nivelMinimo: 0, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f01VerEscala(user),
  }),

  f02EntradaNotaFiscal: () => FuncaoCore.executar({
    titulo: 'Entrada de Nota Fiscal (Recebimento)',
    descricao: 'Registra a entrada de mercadorias conferindo a NF do fornecedor contra o pedido de compra.',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f02EntradaNotaFiscal(user),
  }),

  f03Enderecamento: () => FuncaoCore.executar({
    titulo: 'Endereçamento de Produtos',
    descricao: 'Registra e edita em qual posição do armazém cada produto foi armazenado (rua, coluna, nível, pallet).',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f03Enderecamento(user),
  }),

  f04GestaoPallets: () => FuncaoCore.executar({
    titulo: 'Gestão de Pallets / Posições',
    descricao: 'Visualização agrupada dos produtos por posição de armazém, facilitando o controle físico de pallets.',
    nivelMinimo: 2, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f04GestaoPallets(user),
  }),

  f05MovimentacaoInterna: () => FuncaoCore.executar({
    titulo: 'Movimentação Interna',
    descricao: 'Registro de transferências entre posições de armazém ou entre depósitos internos.',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f05MovimentacaoInterna(user),
  }),

  f06GerenciamentoEstoques: () => FuncaoCore.executar({
    titulo: 'Gerenciamento de Estoques',
    descricao: 'Visão gerencial consolidada de todos os produtos: saldo, mínimo, máximo, alertas e CRUD de cadastro.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f06GerenciamentoEstoques(user),
  }),

  f07SeparacaoPedidos: () => FuncaoCore.executar({
    titulo: 'Separação de Pedidos (Picking)',
    descricao: 'Lista de coleta guiada por produto e endereço para montar os pedidos de venda antes da expedição.',
    nivelMinimo: 2, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f07SeparacaoPedidos(user),
  }),

  f08ConferenciaExpedicao: () => FuncaoCore.executar({
    titulo: 'Conferência de Expedição',
    descricao: 'Verificação final do pedido separado antes de carregar o caminhão: peso, quantidade e documentação.',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f08ConferenciaExpedicao(user),
  }),

  f09ImpressaoEtiquetas: () => FuncaoCore.executar({
    titulo: 'Impressão de Etiquetas',
    descricao: 'Geração de etiquetas de endereçamento, produto ou código de barras para controle e rastreabilidade.',
    nivelMinimo: 2, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f09ImpressaoEtiquetas(user),
  }),

  f10GerenciarRequisicaoMateriais: () => FuncaoCore.executar({
    titulo: 'Gerenciar Requisições de Materiais',
    descricao: 'Recebe, aprova, separa e dá baixa nos pedidos de material interno enviados pelos demais setores.',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f10GerenciarRequisicaoMateriais(user),
  }),

  f11ControleValidade: () => FuncaoCore.executar({
    titulo: 'Controle de Validade (FEFO)',
    descricao: 'Monitoramento de datas de vencimento garantindo que os itens mais antigos saiam primeiro.',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f11ControleValidade(user),
  }),

  f12BloqueioLote: () => FuncaoCore.executar({
    titulo: 'Bloqueio / Quarentena de Lote',
    descricao: 'Isola um lote de produto ou insumo suspeito impedindo sua movimentação enquanto aguarda análise.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f12BloqueioLote(user),
  }),

  f13InventarioCiclico: () => FuncaoCore.executar({
    titulo: 'Inventário Cíclico',
    descricao: 'Contagem periódica por área para manter o estoque contábil sempre sincronizado com o físico.',
    nivelMinimo: 3, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f13InventarioCiclico(user),
  }),

  f14AjusteEstoque: () => FuncaoCore.executar({
    titulo: 'Ajuste de Estoque',
    descricao: 'Correção de divergências encontradas no inventário após aprovação gerencial, registrando o motivo.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f14AjusteEstoque(user),
  }),

  f15EstoqueMinMax: () => FuncaoCore.executar({
    titulo: 'Gestão de Estoque Mínimo e Máximo',
    descricao: 'Configuração dos parâmetros de estoque mínimo (ponto de reposição) e máximo por produto.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f15EstoqueMinMax(user),
  }),

  f16CurvaABC: () => FuncaoCore.executar({
    titulo: 'Curva ABC de Materiais',
    descricao: 'Classificação automática dos itens por valor e giro para priorizar o controle dos itens Classe A.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f16CurvaABC(user),
  }),

  f17GerenciarSolicitacaoUso: () => FuncaoCore.executar({
    titulo: 'Gerenciar Solicitações de Uso',
    descricao: 'Painel de aprovação e liberação de materiais solicitados pelos setores para consumo interno.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f17GerenciarSolicitacaoUso(user),
  }),

  f18GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas do Estoque',
    descricao: 'Define turnos, horários e responsabilidades dos operadores de estoque e auxiliares de almoxarifado.',
    nivelMinimo: 4, departamentos: ['Estoque', 'Compras'],
    render: (user) => window.EstoqueForms && window.EstoqueForms.f18GerenciarEscalas(user),
  }),
};

window.FuncoesEstoque = FuncoesEstoque;
