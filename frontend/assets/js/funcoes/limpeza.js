'use strict';
/**
 * Funções do setor de Limpeza.
 * Cada entrada em FuncoesLimpeza expõe o método público chamado pelo dashboard.
 */
const FuncoesLimpeza = {

  f01VerSolicitacoes: () => FuncaoCore.executar({
    titulo: 'Ver Solicitações de Limpeza de Local',
    descricao: 'Painel operacional de chamados de limpeza. Dados alimentados pelas solicitações feitas pelos usuários via Funções Globais.',
    nivelMinimo: 1, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f01(user),
  }),

  f02GerenciarSolicitacoes: () => FuncaoCore.executar({
    titulo: 'Gerenciar Solicitações de Limpeza',
    descricao: 'Distribui as tarefas, define prioridades e marca os chamados como "Concluídos" no sistema.',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f02(user),
  }),

  f03CronogramaRotina: () => FuncaoCore.executar({
    titulo: 'Cronograma de Rotina',
    descricao: 'Exibe a lista de tarefas diárias obrigatórias. Dados cadastrados pela função "Definir Rotinas de Limpeza".',
    nivelMinimo: 1, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f03(user),
  }),

  f04ChecklistExecucao: () => FuncaoCore.executar({
    titulo: 'Checklist de Execução',
    descricao: 'Registro digital de hora em hora provando que o local foi limpo, garantindo rastreabilidade e substituindo pranchetas.',
    nivelMinimo: 1, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f04(user),
  }),

  f05GestaoResiduos: () => FuncaoCore.executar({
    titulo: 'Gestão de Resíduos',
    descricao: 'Controle da separação e pesagem do lixo gerado (Orgânico, Reciclável, Perigoso) antes do descarte final.',
    nivelMinimo: 2, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f05(user),
  }),

  f06SolicitacaoCacambas: () => FuncaoCore.executar({
    titulo: 'Solicitação de Caçambas',
    descricao: 'Pedido formal para troca ou retirada de caçambas de entulho ou lixo industrial quando estão cheias.',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f06(user),
  }),

  f07LavagemPatio: () => FuncaoCore.executar({
    titulo: 'Lavagem de Pátio',
    descricao: 'Agendamento e registro da limpeza pesada das áreas externas de circulação (calçadas, estacionamento).',
    nivelMinimo: 1, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f07(user),
  }),

  f08EstoqueMaterial: () => FuncaoCore.executar({
    titulo: 'Estoque de Material de Limpeza',
    descricao: 'Controle físico de vassouras, rodos, panos e produtos químicos armazenados no DML (Depósito de Material de Limpeza).',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f08(user),
  }),

  f09ControleDescartaveis: () => FuncaoCore.executar({
    titulo: 'Controle de Consumo de Descartáveis',
    descricao: 'Monitoramento de gasto de papel toalha, papel higiênico e sabonete por setor para identificar desperdícios ou furtos.',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f09(user),
  }),

  f10SolicitacaoCompraInsumos: () => FuncaoCore.executar({
    titulo: 'Solicitação de Compra de Insumos',
    descricao: 'Gera um pedido de reposição de detergentes, cloro ou equipamentos para o setor de Compras.',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f10(user),
  }),

  f11VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    descricao: 'Visualiza a escala de trabalho da equipe. Dados inseridos pela função "Gerenciar Escalas da Limpeza".',
    nivelMinimo: 0, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f11(user),
  }),

  f12DefinirRotinas: () => FuncaoCore.executar({
    titulo: 'Definir Rotinas de Limpeza',
    descricao: 'Ferramenta de cadastro das tarefas recorrentes (Diária, Semanal, Mensal) que aparecerão no Cronograma da equipe.',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f12(user),
  }),

  f13GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas da Limpeza',
    descricao: 'Criação e gestão da tabela de turnos, folgas e plantões dos auxiliares de limpeza.',
    nivelMinimo: 3, departamentos: ['Limpeza'],
    render: (user) => window.LimpezaForms.f13(user),
  }),
};

window.FuncoesLimpeza = FuncoesLimpeza;
