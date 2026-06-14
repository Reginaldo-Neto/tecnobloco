'use strict';
/**
 * Funções para Fornecedores — perfil externo (departamento: Fornecedores).
 */
const FuncoesProdutores = {

  f01SolicitarReuniao: () => FuncaoCore.executar({
    titulo: 'Solicitar Reunião',
    descricao: 'Agenda horário com a equipe comercial ou diretoria para discutir qualidade, pagamentos ou questões técnicas.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f02VerSolicitacoesReuniao: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Solicitações de Reunião',
    descricao: 'Lista o status dos agendamentos. Status atualizado pela equipe comercial ou diretoria convidada.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f03VerResultadoAnalises: () => FuncaoCore.executar({
    titulo: 'Ver Resultado das Análises',
    descricao: 'Exibe os laudos de qualidade dos materiais entregues. Dados inseridos pelos analistas do setor de Qualidade.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f04SolicitarReanalise: () => FuncaoCore.executar({
    titulo: 'Solicitar Reanálise',
    descricao: 'Caso o fornecedor discorde de um resultado, solicita formalmente uma contraprova da amostra de retenção.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f05VerComprovantesFiscais: () => FuncaoCore.executar({
    titulo: 'Ver Meus Comprovantes Fiscais e de Entrega',
    descricao: 'Acesso aos espelhos de notas fiscais. Dados gerados pelo setor Financeiro após o fechamento do período.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f06EnviarDocumentos: () => FuncaoCore.executar({
    titulo: 'Enviar Documentos',
    descricao: 'Interface de upload para envio de documentos de certificação e laudos de qualidade dos materiais.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f07VerDocumentosEnviados: () => FuncaoCore.executar({
    titulo: 'Ver Meus Documentos Enviados',
    descricao: 'Galeria de documentos e status de aprovação. Validação gerenciada pelo setor de Qualidade.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f08SolicitarExclusaoDocumento: () => FuncaoCore.executar({
    titulo: 'Abrir Solicitação de Exclusão de Documentos',
    descricao: 'Pede a remoção de um documento enviado por engano. Requer aprovação da TI/Admin para exclusão real.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f09SolicitarVisitaTecnica: () => FuncaoCore.executar({
    titulo: 'Solicitar Visita Técnica',
    descricao: 'Requisita a presença de um técnico para inspeção no ponto de entrega ou na origem dos materiais.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f10VerSolicitacoesVisita: () => FuncaoCore.executar({
    titulo: 'Ver Minhas Solicitações de Visita',
    descricao: 'Acompanha o status da visita solicitada. Agendamento e confirmação inseridos pelos Técnicos ou Supervisores.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f11VerInfoRotaColeta: () => FuncaoCore.executar({
    titulo: 'Ver Informações da Minha Rota de Entrega e Motorista',
    descricao: 'Mostra informações do caminhão e motorista da rota de coleta. Dados definidos pela Gestão de Frotas.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f12PesquisaSatisfacao: () => FuncaoCore.executar({
    titulo: 'Enviar Pesquisa de Satisfação (Mensal)',
    descricao: 'Formulário para avaliar o atendimento da empresa, dos motoristas e técnicos.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f13SolicitarAdiantamento: () => FuncaoCore.executar({
    titulo: 'Solicitar Adiantamento (Vale)',
    descricao: 'Solicita crédito antecipado descontado no próximo pagamento pela entrega de materiais.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f14VerInfoProducao: () => FuncaoCore.executar({
    titulo: 'Ver Informação de Entregas',
    descricao: 'Gráficos e tabelas do volume entregue. Dados alimentados pelos registros de recepção do setor de Qualidade/Balança.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f15EstimativaSaldo: () => FuncaoCore.executar({
    titulo: 'Estimativa de Saldo a Receber',
    descricao: 'Calcula uma prévia financeira baseada no volume entregue e tabelas de preço da Diretoria/Financeiro.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f16VerClassificacaoQualidade: () => FuncaoCore.executar({
    titulo: 'Ver Classificação de Qualidade dos Materiais Entregues',
    descricao: 'Mostra o ranking de qualidade do fornecedor. Classificação gerada automaticamente com base nos laudos da Qualidade.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f17DenunciarBug: () => FuncaoCore.executar({
    titulo: 'Denunciar Problemas do Sistema (BUG)',
    descricao: 'Reporta erros no aplicativo ou painel do fornecedor diretamente à TI.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),

  f18AbrirTicketSuporte: () => FuncaoCore.executar({
    titulo: 'Abrir Ticket / Ajuda sobre o Sistema',
    descricao: 'Canal de suporte para dúvidas de acesso, senhas ou uso da plataforma.',
    nivelMinimo: 0, departamentos: ['Fornecedores'],
  }),
};

window.FuncoesProdutores = FuncoesProdutores;
