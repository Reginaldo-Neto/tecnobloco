'use strict';
const pool = require('../../../config/database');

class DashboardService {
  async getStats() {
    const [[{ colaboradores }]] = await pool.execute(
      `SELECT COUNT(*) AS colaboradores FROM usuarios WHERE ativo = 1`
    );
    const [[{ ordensAberto }]] = await pool.execute(
      `SELECT COUNT(*) AS ordensAberto FROM ordens_servico WHERE status NOT IN ('concluida','cancelada')`
    );
    // OS abertas criadas hoje
    const [[{ osHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS osHoje FROM ordens_servico WHERE DATE(criado_em) = CURDATE()`
    );
    // Alertas = OS críticas em aberto
    const [[{ alertas }]] = await pool.execute(
      `SELECT COUNT(*) AS alertas FROM ordens_servico WHERE prioridade = 'critica' AND status NOT IN ('concluida','cancelada')`
    );

    return {
      colaboradores,
      colaboradoresChange: 0,
      ordensAberto,
      ordensChange: 0,
      producaoHoje: osHoje,
      producaoChange: 0,
      alertas,
      alertasChange: 0,
    };
  }

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

  async getAlerts() {
    const alerts = [];

    // OS críticas em aberto
    const [[{ osEmerg }]] = await pool.execute(
      `SELECT COUNT(*) AS osEmerg FROM ordens_servico WHERE prioridade='critica' AND status NOT IN ('concluida','cancelada')`
    );
    if (osEmerg > 0) {
      alerts.push({ tipo: 'danger', titulo: 'OS Emergenciais', mensagem: `${osEmerg} ordem(ns) de manutenção crítica em aberto.` });
    }

    // OS com prazo vencido
    const [[{ osVencidas }]] = await pool.execute(
      `SELECT COUNT(*) AS osVencidas FROM ordens_servico WHERE data_previsao IS NOT NULL AND data_previsao < NOW() AND status NOT IN ('concluida','cancelada')`
    );
    if (osVencidas > 0) {
      alerts.push({ tipo: 'warning', titulo: 'OS com Prazo Vencido', mensagem: `${osVencidas} ordem(ns) com data prevista ultrapassada.` });
    }

    // OS em andamento (informativo)
    const [[{ osEmAndamento }]] = await pool.execute(
      `SELECT COUNT(*) AS osEmAndamento FROM ordens_servico WHERE status = 'em_andamento'`
    );
    if (osEmAndamento > 0) {
      alerts.push({ tipo: 'info', titulo: 'OS em Andamento', mensagem: `${osEmAndamento} ordem(ns) sendo executada(s) agora.` });
    }

    if (alerts.length === 0) {
      alerts.push({ tipo: 'success', titulo: 'Sistema OK', mensagem: 'Nenhum alerta ativo no momento.' });
    }

    return alerts;
  }
}

module.exports = new DashboardService();
