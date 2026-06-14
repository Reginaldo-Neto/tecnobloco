'use strict';
/**
 * Funções para Clientes — perfil externo (departamento: Clientes).
 */
const FuncoesClientes = {

  f01SolicitarReuniao: () => FuncaoCore.executar({
    titulo: 'Solicitar Reunião',
    descricao: 'Agenda uma conversa formal com o gerente de contas, diretoria comercial ou vendedor para negociações ou alinhamentos.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f02VerSolicitacoesReuniao: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Solicitações de Reunião',
    descricao: 'Acompanha o status das reuniões. Status atualizado pelo Gerente de Contas ou Diretoria Comercial.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f03VerTabelaPrecos: () => FuncaoCore.executar({
    titulo: 'Ver Tabela de Preços',
    descricao: 'Exibe o catálogo de produtos com preços vigentes. Tabelas e descontos gerenciados pela Gerência de Vendas.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f04ContactarVendedor: () => FuncaoCore.executar({
    titulo: 'Contactar um Vendedor',
    descricao: 'Abre canal de contato ou exibe dados do representante. Vínculo de carteira gerenciado pelo Supervisor de Vendas.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f05SolicitarOrcamento: () => FuncaoCore.executar({
    titulo: 'Solicitar Orçamento de Compra',
    descricao: 'Cria uma pré-venda ou cotação para grandes volumes, enviando para aprovação do setor comercial antes de virar pedido.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f06VerOrcamentos: () => FuncaoCore.executar({
    titulo: 'Ver Meus Orçamentos de Compra',
    descricao: 'Lista cotações e propostas recebidas. Propostas inseridas pelo Vendedor/Setor Comercial.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f07SolicitarVisitaTecnica: () => FuncaoCore.executar({
    titulo: 'Solicitar Visita Técnica à Fábrica',
    descricao: 'Clientes grandes ou marcas próprias podem solicitar auditoria ou visita comercial às instalações industriais.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f08VerSolicitacoesVisita: () => FuncaoCore.executar({
    titulo: 'Ver Solicitações de Visita Técnica',
    descricao: 'Monitora o status da aprovação de entrada. Aprovação gerenciada pelos setores Administrativo e Segurança Patrimonial.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f09AbrirReclamacao: () => FuncaoCore.executar({
    titulo: 'Abrir Reclamação',
    descricao: 'Canal direto com o SAC para registrar problemas com produtos (estufamento, validade, sabor) ou entregas.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f10VerMinhasReclamacoes: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Reclamações',
    descricao: 'Histórico de tickets e respostas. Soluções e tratativas inseridas pelos atendentes do SAC.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f11PesquisaSatisfacao: () => FuncaoCore.executar({
    titulo: 'Responder Pesquisa de Satisfação (Mensal)',
    descricao: 'Formulário de NPS (Net Promoter Score) para avaliar o serviço, produto e logística.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f12NovoPedidoRapido: () => FuncaoCore.executar({
    titulo: 'Novo Pedido Rápido',
    descricao: 'Interface de e-commerce B2B self-service onde o cliente seleciona produtos e quantidades gerando um pedido direto.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f13MeusPedidosAndamento: () => FuncaoCore.executar({
    titulo: 'Meus Pedidos em Andamento',
    descricao: 'Rastreamento (Tracking) da logística. Status atualizado pelos setores de Vendas, Faturamento e Frotas.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f14MeusBoletos: () => FuncaoCore.executar({
    titulo: 'Meus Boletos e Notas Fiscais',
    descricao: 'Painel para download de Boletos e Notas. Arquivos gerados e disponibilizados pelo setor Financeiro/Faturamento.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f15HistoricoCompras: () => FuncaoCore.executar({
    titulo: 'Histórico de Compras',
    descricao: 'Relatório estatístico de compras passadas. Dados compilados automaticamente com base no histórico de pedidos faturados.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f16DenunciarBug: () => FuncaoCore.executar({
    titulo: 'Denunciar Problemas do Sistema (BUG)',
    descricao: 'Reporta falhas na plataforma de pedidos online para a TI.',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),

  f17AbrirTicketSuporte: () => FuncaoCore.executar({
    titulo: 'Abrir Ticket / Ajuda sobre o Sistema',
    descricao: 'Solicita auxílio para usar o portal (ex: "Não consigo emitir meu boleto").',
    nivelMinimo: 0, departamentos: ['Clientes'],
  }),
};

window.FuncoesClientes = FuncoesClientes;
