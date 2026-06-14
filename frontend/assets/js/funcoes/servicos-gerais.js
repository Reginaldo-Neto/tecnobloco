'use strict';
/**
 * Funções do setor de Serviços Gerais.
 */
const FuncoesServicosGerais = {

  f01CronogramaJardinagem: () => FuncaoCore.executar({
    titulo: 'Cronograma de Jardinagem',
    descricao: 'Exibe o plano de paisagismo e poda. Dados cadastrados pela função "Definir Cronograma de Jardinagem".',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f01CronogramaJardinagem(user),
  }),

  f02ControleErvasDaninhas: () => FuncaoCore.executar({
    titulo: 'Controle de Ervas Daninhas',
    descricao: 'Registro da aplicação de herbicidas ou capina manual em áreas críticas para evitar proliferação de mato.',
    nivelMinimo: 3, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f02ControleErvasDaninhas(user),
  }),

  f03ManutencaoCercas: () => FuncaoCore.executar({
    titulo: 'Manutenção de Cercas e Alambrados',
    descricao: 'Inspeção e reparo do perímetro da fábrica para garantir que animais ou pessoas não entrem sem autorização.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f03ManutencaoCercas(user),
  }),

  f04LimpezaAreasExternas: () => FuncaoCore.executar({
    titulo: 'Limpeza de Áreas Externas',
    descricao: 'Rotina de varrição de ruas internas, calçadas e recolhimento de folhas/lixo no pátio.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f04LimpezaAreasExternas(user),
  }),

  f05PequenosReparosAlvenaria: () => FuncaoCore.executar({
    titulo: 'Pequenos Reparos de Alvenaria',
    descricao: 'Registro de obras pequenas (tapar buracos, consertar calçada, assentar tijolos) pela equipe interna.',
    nivelMinimo: 3, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f05PequenosReparosAlvenaria(user),
  }),

  f06PinturaPredial: () => FuncaoCore.executar({
    titulo: 'Pintura Predial',
    descricao: 'Gestão e execução da pintura de paredes, demarcação de solo e tubulações seguindo cores padrão de segurança.',
    nivelMinimo: 3, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f06PinturaPredial(user),
  }),

  f07LimpezaCalhasTelhados: () => FuncaoCore.executar({
    titulo: 'Limpeza de Calhas e Telhados',
    descricao: 'Manutenção preventiva para remover folhas e sujeira das calhas, evitando vazamentos dentro da fábrica.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f07LimpezaCalhasTelhados(user),
  }),

  f08LimpezaCaixasAgua: () => FuncaoCore.executar({
    titulo: 'Limpeza de Caixas d\'Água',
    descricao: 'Registro da higienização semestral obrigatória dos reservatórios de água potável.',
    nivelMinimo: 3, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f08LimpezaCaixasAgua(user),
  }),

  f09LimpezaCaixasGordura: () => FuncaoCore.executar({
    titulo: 'Limpeza de Caixas de Gordura / Esgoto',
    descricao: 'Manutenção sanitária para evitar entupimentos e mau cheiro nas tubulações de esgoto.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f09LimpezaCaixasGordura(user),
  }),

  f10LavagemHidrojateamento: () => FuncaoCore.executar({
    titulo: 'Lavagem Pesada (Hidrojateamento)',
    descricao: 'Uso de máquinas de alta pressão para limpar pisos industriais encardidos ou fachadas.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f10LavagemHidrojateamento(user),
  }),

  f11ControlePragas: () => FuncaoCore.executar({
    titulo: 'Apoio ao Controle de Pragas',
    descricao: 'Verificação visual e apoio à empresa terceirizada na checagem de iscas para roedores e insetos.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f11ControlePragas(user),
  }),

  f12ControleFerramenta: () => FuncaoCore.executar({
    titulo: 'Controle de Ferramentas de Campo',
    descricao: 'Inventário de enxadas, pás, cortadores de grama e roçadeiras, garantindo que nada seja extraviado.',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f12ControleFerramenta(user),
  }),

  f13ControleInsumosCombustivel: () => FuncaoCore.executar({
    titulo: 'Controle de Insumos e Combustível',
    descricao: 'Monitora o gasto de gasolina/óleo para as roçadeiras e insumos como cimento e tinta.',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f13ControleInsumosCombustivel(user),
  }),

  f14VerSolicitacoesApoio: () => FuncaoCore.executar({
    titulo: 'Ver Solicitações de Auxílio',
    descricao: 'Painel de pedidos de ajuda operacional. Dados alimentados pelas solicitações dos usuários via Funções Globais.',
    nivelMinimo: 2, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f14VerSolicitacoesApoio(user),
  }),

  f15VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala e Datas de Manutenção no Setor',
    descricao: 'Visualiza a escala de trabalho da equipe. Dados inseridos pela função "Gerenciar Escalas de Serviços Gerais".',
    nivelMinimo: 0, departamentos: null,
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f15VerEscala(user),
  }),

  f16GerenciarSolicitacoesApoio: () => FuncaoCore.executar({
    titulo: 'Gerenciar Solicitações de Apoio (Serviços Gerais)',
    descricao: 'O encarregado distribui os pedidos de ajuda entre os funcionários disponíveis.',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f16GerenciarSolicitacoesApoio(user),
  }),

  f17PendenciasAuditoria: () => FuncaoCore.executar({
    titulo: 'Visualizar Pendências de Auditoria',
    descricao: 'Lista de itens de infraestrutura reprovados em auditoria. Dados inseridos pelos auditores da Qualidade ou SIF.',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f17PendenciasAuditoria(user),
  }),

  f18DefinirCronogramaJardinagem: () => FuncaoCore.executar({
    titulo: 'Definir Cronograma de Jardinagem',
    descricao: 'Ferramenta de planejamento para definir datas de corte de grama, poda e manutenção paisagística.',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f18DefinirCronogramaJardinagem(user),
  }),

  f19GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas de Serviços Gerais',
    descricao: 'Criação e gestão da tabela de turnos e tarefas da equipe de conservação e manutenção predial.',
    nivelMinimo: 4, departamentos: ['Serviços Gerais'],
    render: (user) => window.ServicosGeraisForms && window.ServicosGeraisForms.f19GerenciarEscalas(user),
  }),
};

window.FuncoesServicosGerais = FuncoesServicosGerais;
