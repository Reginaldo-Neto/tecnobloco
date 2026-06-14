'use strict';
const pool = require('../../../config/database');

class DashboardService {
  /**
   * Stats: total colaboradores, ordens em aberto, producao hoje, alertas ativos
   */
  async getStats() {
    const [[{ colaboradores }]] = await pool.execute(
      `SELECT COUNT(*) AS colaboradores FROM usuarios WHERE ativo = 1`
    );
    const [[{ ordensAberto }]] = await pool.execute(
      `SELECT COUNT(*) AS ordensAberto FROM ordens_servico WHERE status NOT IN ('concluida','cancelada')`
    );
    // producao hoje = ordens_producao com data_inicio_real = today
    const [[{ producaoHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS producaoHoje FROM ordens_producao WHERE DATE(criado_em) = CURDATE()`
    );
    // alertas = chamados TI criticos abertos + ocorrencias abertas + solicitacoes pendentes criticas
    const [[{ alertasTI }]] = await pool.execute(
      `SELECT COUNT(*) AS alertasTI FROM chamados_ti WHERE status NOT IN ('resolvido','fechado') AND prioridade='critica'`
    );
    const [[{ alertasOcorrencias }]] = await pool.execute(
      `SELECT COUNT(*) AS alertasOcorrencias FROM ocorrencias WHERE status = 'aberto'`
    );
    const alertas = (alertasTI || 0) + (alertasOcorrencias || 0);

    return {
      colaboradores,
      colaboradoresChange: 0,
      ordensAberto,
      ordensChange: 0,
      producaoHoje,
      producaoChange: 0,
      alertas,
      alertasChange: 0,
    };
  }

  /**
   * Recent audit log activity (last 20 entries)
   */
  async getActivity() {
    const [rows] = await pool.execute(`
      SELECT al.tipo_evento AS acao, al.tabela_afetada AS modulo,
             u.nome AS usuario, al.criado_em AS horario,
             CASE
               WHEN al.tipo_evento IN ('LOGIN','CRIACAO','APROVACAO') THEN 'success'
               WHEN al.tipo_evento IN ('ACESSO_NEGADO','ERRO_SISTEMA') THEN 'error'
               WHEN al.tipo_evento = 'LOGOUT' THEN 'info'
               ELSE 'info'
             END AS status
      FROM auditoria_log al
      LEFT JOIN usuarios u ON u.id = al.usuario_id
      ORDER BY al.criado_em DESC
      LIMIT 20
    `);
    return rows;
  }

  /**
   * Active system alerts
   */
  async getAlerts() {
    const alerts = [];

    // Chamados TI críticos
    const [[{ critTI }]] = await pool.execute(
      `SELECT COUNT(*) AS critTI FROM chamados_ti WHERE status NOT IN ('resolvido','fechado') AND prioridade='critica'`
    );
    if (critTI > 0) {
      alerts.push({ tipo: 'danger', titulo: 'Chamados TI Críticos', mensagem: `${critTI} chamado(s) crítico(s) pendentes de atendimento.` });
    }

    // Ordens de serviço emergenciais
    const [[{ osEmerg }]] = await pool.execute(
      `SELECT COUNT(*) AS osEmerg FROM ordens_servico WHERE prioridade='critica' AND status NOT IN ('concluida','cancelada')`
    );
    if (osEmerg > 0) {
      alerts.push({ tipo: 'danger', titulo: 'OS Emergenciais', mensagem: `${osEmerg} ordem(ns) de manutenção emergencial em aberto.` });
    }

    // Ocorrências abertas
    const [[{ ocAbertas }]] = await pool.execute(
      `SELECT COUNT(*) AS ocAbertas FROM ocorrencias WHERE status = 'aberto'`
    );
    if (ocAbertas > 0) {
      alerts.push({ tipo: 'warning', titulo: 'Ocorrências Registradas', mensagem: `${ocAbertas} ocorrência(s) aguardando análise.` });
    }

    // Pedidos de compra pendentes
    const [[{ compraPend }]] = await pool.execute(
      `SELECT COUNT(*) AS compraPend FROM solicitacoes_compra WHERE status = 'pendente'`
    );
    if (compraPend > 0) {
      alerts.push({ tipo: 'info', titulo: 'Solicitações de Compra', mensagem: `${compraPend} solicitação(ões) aguardando aprovação.` });
    }

    // Veículos solicitados pendentes
    const [[{ veiPend }]] = await pool.execute(
      `SELECT COUNT(*) AS veiPend FROM solicitacoes_veiculo WHERE status = 'pendente'`
    );
    if (veiPend > 0) {
      alerts.push({ tipo: 'info', titulo: 'Solicitações de Veículo', mensagem: `${veiPend} solicitação(ões) de veículo pendentes.` });
    }

    if (alerts.length === 0) {
      alerts.push({ tipo: 'success', titulo: 'Sistema OK', mensagem: 'Nenhum alerta ativo no momento.' });
    }

    return alerts;
  }
}

module.exports = new DashboardService();
