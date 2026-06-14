'use strict';
/**
 * Funções Globais — disponíveis a todos os funcionários.
 * Cada função chega ao FuncaoCore que valida acesso, depois chama GlobalForms.<fn>(user).
 */
const FuncoesGlobal = {

  f01SolicitarReuniao: () => FuncaoCore.executar({
    titulo: 'Solicitar Reunião',
    descricao: 'Abre um formulário onde o usuário pode solicitar uma reunião com um setor ou funcionário.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f01SolicitarReuniao(user),
  }),

  f02VerSolicitacoesReuniao: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Solicitações de Reunião',
    descricao: 'Lista o status das reuniões solicitadas.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f02VerSolicitacoesReuniao(user),
  }),

  f03AbrirOsManutencao: () => FuncaoCore.executar({
    titulo: 'Abrir OS de Manutenção',
    descricao: 'Cria um ticket para o setor de Manutenção relatando quebra ou falha.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f03AbrirOsManutencao(user),
  }),

  f04VerMinhasOsAbertas: () => FuncaoCore.executar({
    titulo: 'Ver Minhas OS Abertas',
    descricao: 'Acompanha o andamento dos chamados de manutenção.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f04VerMinhasOsAbertas(user),
  }),

  f05SolicitarLimpeza: () => FuncaoCore.executar({
    titulo: 'Solicitar Limpeza de Local/Setor',
    descricao: 'Envia um alerta para o setor de Limpeza.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f05SolicitarLimpeza(user),
  }),

  f06VerSolicitacoesLimpeza: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Solicitações de Limpeza',
    descricao: 'Histórico e status dos pedidos de limpeza.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f06VerSolicitacoesLimpeza(user),
  }),

  f07AbrirSolicitacaoCompra: () => FuncaoCore.executar({
    titulo: 'Abrir Solicitação de Compra',
    descricao: 'Inicia uma requisição de material ou serviço.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f07AbrirSolicitacaoCompra(user),
  }),

  f08VerSolicitacoesCompra: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Solicitações de Compra',
    descricao: 'Rastreia o status do pedido de compra.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f08VerSolicitacoesCompra(user),
  }),

  f09EnviarAtestado: () => FuncaoCore.executar({
    titulo: 'Enviar Atestado / Documentos Legais',
    descricao: 'Interface para registrar atestados e documentos para o RH.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f09EnviarAtestado(user),
  }),

  f10VerDocumentosLegais: () => FuncaoCore.executar({
    titulo: 'Ver Meus Documentos Legais / Atestados',
    descricao: 'Galeria pessoal de documentos registrados.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f10VerDocumentosLegais(user),
  }),

  f11InformarOcorrencia: () => FuncaoCore.executar({
    titulo: 'Informar Ocorrência',
    descricao: 'Registra um incidente ou fato relevante.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f11InformarOcorrencia(user),
  }),

  f12VerMinhasOcorrencias: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Ocorrências',
    descricao: 'Lista ocorrências reportadas e suas tratativas.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f12VerMinhasOcorrencias(user),
  }),

  f13VerItensEstocados: () => FuncaoCore.executar({
    titulo: 'Ver Itens Estocados',
    descricao: 'Consulta o saldo de itens disponíveis no estoque.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f13VerItensEstocados(user),
  }),

  f14ConsultarCardapio: () => FuncaoCore.executar({
    titulo: 'Consultar Cardápio',
    descricao: 'Exibe o menu do refeitório.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f14ConsultarCardapio(user),
  }),

  f15GerenciarTreinamentos: () => FuncaoCore.executar({
    titulo: 'Gerenciar Meus Treinamentos e Certificados',
    descricao: 'Painel de cursos e certificados.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f15GerenciarTreinamentos(user),
  }),

  f16VerHolerite: () => FuncaoCore.executar({
    titulo: 'Ver Holerite / Contracheque',
    descricao: 'Acesso seguro ao documento financeiro mensal.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f16VerHolerite(user),
  }),

  f17MeuBancoHoras: () => FuncaoCore.executar({
    titulo: 'Meu Banco de Horas',
    descricao: 'Exibe saldo de horas e extrato do ponto.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f17MeuBancoHoras(user),
  }),

  f18ListaRamaisContatos: () => FuncaoCore.executar({
    titulo: 'Lista de Ramais / Contatos',
    descricao: 'Agenda telefônica interna.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f18ListaRamaisContatos(user),
  }),

  f19CanalEtica: () => FuncaoCore.executar({
    titulo: 'Canal de Ética / Denúncia Anônima',
    descricao: 'Formulário anônimo para o RH/Compliance.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f19CanalEtica(user),
  }),

  f20MeusEpis: () => FuncaoCore.executar({
    titulo: 'Meus EPIs',
    descricao: 'Lista de EPIs em posse.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f20MeusEpis(user),
  }),

  f21SolicitarAdiantamento: () => FuncaoCore.executar({
    titulo: 'Solicitar Adiantamento (Vale)',
    descricao: 'Solicita ao financeiro um adiantamento salarial.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f21SolicitarAdiantamento(user),
  }),

  f22DenunciarBug: () => FuncaoCore.executar({
    titulo: 'Denunciar Problemas do Sistema (BUG)',
    descricao: 'Reportar erros técnicos de software para a TI.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f22DenunciarBug(user),
  }),

  f23AbrirTicketTI: () => FuncaoCore.executar({
    titulo: 'Abrir Ticket de Suporte TI',
    descricao: 'Solicitar suporte técnico de TI.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f23AbrirTicketTI(user),
  }),

  f24SolicitarHigienizacaoUniforme: () => FuncaoCore.executar({
    titulo: 'Solicitar Higienização de Uniformes',
    descricao: 'Avisar a lavanderia sobre uniformes para lavar.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f24SolicitarHigienizacaoUniforme(user),
  }),

  f25SolicitarServicosGerais: () => FuncaoCore.executar({
    titulo: 'Solicitar Auxílio dos Serviços Gerais',
    descricao: 'Pedir ajuda para mudanças, pintura, capina, etc.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f25SolicitarServicosGerais(user),
  }),

  f26SolicitarVeiculo: () => FuncaoCore.executar({
    titulo: 'Solicitar Permissão de Uso de Veículo',
    descricao: 'Enviar pedido à Frota para reservar um veículo.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f26SolicitarVeiculo(user),
  }),

  f27VerSolicitarEstoque: () => FuncaoCore.executar({
    titulo: 'Ver / Solicitar Itens do Estoque',
    descricao: 'Criar requisição de material e ver disponibilidade.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f27VerSolicitarEstoque(user),
  }),

  f28VerEscalaManutencao: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção do Setor',
    descricao: 'Visualiza escalas do próprio setor.',
    nivelMinimo: 0, departamentos: null,
    render: (user) => GlobalForms.f28VerEscalaManutencao(user),
  }),
};

window.FuncoesGlobal = FuncoesGlobal;
