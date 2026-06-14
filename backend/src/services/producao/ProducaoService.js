'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class ProducaoService {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ opsEmProducao }]] = await pool.execute(
      `SELECT COUNT(*) AS opsEmProducao FROM ordens_producao WHERE status = 'em_producao'`
    );
    const [[{ opsConcluidas }]] = await pool.execute(
      `SELECT COUNT(*) AS opsConcluidas FROM ordens_producao WHERE status = 'concluida' AND DATE(data_fim_real) = CURDATE()`
    );
    const [[{ perdas24h }]] = await pool.execute(
      `SELECT COALESCE(SUM(quantidade), 0) AS perdas24h FROM pro_perdas WHERE data_perda >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
    );
    const [[{ equipamentosParados }]] = await pool.execute(
      `SELECT COUNT(*) AS equipamentosParados FROM equipamentos WHERE status = 'em_manutencao'`
    );
    return { opsEmProducao, opsConcluidas, perdas24h, equipamentosParados };
  }

  // ── Ordens de Produção ────────────────────────────────────────────────────────

  async listarOrdens({ status, produto_id, data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (status)      { where.push('op.status = ?');                params.push(status); }
    if (produto_id)  { where.push('op.produto_id = ?');            params.push(produto_id); }
    if (data_inicio) { where.push('op.data_inicio_planejado >= ?');params.push(data_inicio); }
    if (data_fim)    { where.push('op.data_fim_planejado <= ?');   params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT op.*, p.nome AS produto_nome, p.codigo AS produto_codigo,
              u.nome AS responsavel_nome
       FROM ordens_producao op
       LEFT JOIN produtos p ON p.id = op.produto_id
       LEFT JOIN usuarios u ON u.id = op.responsavel_id
       ${cond}
       ORDER BY op.criado_em DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async buscarOrdem(id) {
    const [[op]] = await pool.execute(
      `SELECT op.*, p.nome AS produto_nome, p.codigo AS produto_codigo,
              u.nome AS responsavel_nome
       FROM ordens_producao op
       LEFT JOIN produtos p ON p.id = op.produto_id
       LEFT JOIN usuarios u ON u.id = op.responsavel_id
       WHERE op.id = ?`,
      [id]
    );
    if (!op) throw new AppError('Ordem de produção não encontrada', HTTP.NOT_FOUND);
    return op;
  }

  async criarOrdem(userId, { produto_id, quantidade_planejada, data_inicio_planejado, data_fim_planejado, responsavel_id, observacao }) {
    if (!produto_id || !quantidade_planejada || !data_inicio_planejado)
      throw new AppError('Produto, quantidade e data de início são obrigatórios', HTTP.BAD_REQUEST);

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM ordens_producao`);
    const codigo = `OP-${new Date().getFullYear()}-${String(Number(total) + 1).padStart(5, '0')}`;

    const [res] = await pool.execute(
      `INSERT INTO ordens_producao (codigo, produto_id, quantidade_planejada, data_inicio_planejado, data_fim_planejado, responsavel_id, observacao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'rascunho')`,
      [codigo, produto_id, quantidade_planejada,
       data_inicio_planejado, data_fim_planejado || null,
       responsavel_id || userId, observacao || null]
    );
    return { id: res.insertId, codigo };
  }

  async atualizarOrdem(id, data) {
    const [[op]] = await pool.execute(`SELECT id, status FROM ordens_producao WHERE id = ?`, [id]);
    if (!op) throw new AppError('Ordem de produção não encontrada', HTTP.NOT_FOUND);

    const allowed = ['status','quantidade_planejada','quantidade_produzida',
                     'data_inicio_planejado','data_fim_planejado',
                     'data_inicio_real','data_fim_real',
                     'responsavel_id','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE ordens_producao SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Apontamentos ──────────────────────────────────────────────────────────────

  async listarApontamentos(ordemId) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome
       FROM pro_apontamentos a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.ordem_producao_id = ?
       ORDER BY a.criado_em DESC`,
      [ordemId]
    );
    return rows;
  }

  async criarApontamento(userId, { ordem_producao_id, tipo, quantidade_produzida, quantidade_perdida, motivo_parada, observacao }) {
    if (!ordem_producao_id) throw new AppError('Ordem de produção é obrigatória', HTTP.BAD_REQUEST);
    const [[op]] = await pool.execute(
      `SELECT id, status FROM ordens_producao WHERE id = ?`, [ordem_producao_id]
    );
    if (!op) throw new AppError('Ordem de produção não encontrada', HTTP.NOT_FOUND);

    const [res] = await pool.execute(
      `INSERT INTO pro_apontamentos (ordem_producao_id, usuario_id, tipo, quantidade_produzida, quantidade_perdida, motivo_parada, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ordem_producao_id, userId,
       tipo || 'apontamento',
       quantidade_produzida || null,
       quantidade_perdida || 0,
       motivo_parada || null,
       observacao || null]
    );

    // Atualiza status e quantidade_produzida da OP conforme o tipo
    if (tipo === 'inicio') {
      await pool.execute(
        `UPDATE ordens_producao SET status = 'em_producao', data_inicio_real = NOW() WHERE id = ? AND status IN ('rascunho','aprovada')`,
        [ordem_producao_id]
      );
    } else if (tipo === 'pausa') {
      await pool.execute(`UPDATE ordens_producao SET status = 'pausada' WHERE id = ? AND status = 'em_producao'`, [ordem_producao_id]);
    } else if (tipo === 'retomada') {
      await pool.execute(`UPDATE ordens_producao SET status = 'em_producao' WHERE id = ? AND status = 'pausada'`, [ordem_producao_id]);
    } else if (tipo === 'conclusao') {
      await pool.execute(
        `UPDATE ordens_producao SET status = 'concluida', data_fim_real = NOW(),
         quantidade_produzida = COALESCE(quantidade_produzida, 0) + ?
         WHERE id = ?`,
        [quantidade_produzida || 0, ordem_producao_id]
      );
    } else if (quantidade_produzida) {
      await pool.execute(
        `UPDATE ordens_producao SET quantidade_produzida = COALESCE(quantidade_produzida, 0) + ? WHERE id = ?`,
        [quantidade_produzida, ordem_producao_id]
      );
    }

    return { id: res.insertId };
  }

  // ── Controle de Temperaturas ──────────────────────────────────────────────────

  async listarTemperaturas({ data_inicio, data_fim, equipamento_id } = {}) {
    const where = [];
    const params = [];
    if (data_inicio)    { where.push('t.data_hora >= ?');      params.push(data_inicio); }
    if (data_fim)       { where.push('t.data_hora <= ?');      params.push(data_fim); }
    if (equipamento_id) { where.push('t.equipamento_id = ?'); params.push(equipamento_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT t.*, e.nome AS equipamento_nome, u.nome AS usuario_nome
       FROM pro_controle_temperaturas t
       LEFT JOIN equipamentos e ON e.id = t.equipamento_id
       LEFT JOIN usuarios u ON u.id = t.usuario_id
       ${cond}
       ORDER BY t.data_hora DESC LIMIT 300`,
      params
    );
    return rows;
  }

  async registrarTemperatura(userId, { equipamento_id, equipamento_descricao, temperatura, umidade, data_hora, conforme, observacao }) {
    if (temperatura === undefined || temperatura === null)
      throw new AppError('Temperatura é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO pro_controle_temperaturas (equipamento_id, equipamento_descricao, temperatura, umidade, data_hora, usuario_id, conforme, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [equipamento_id || null,
       equipamento_descricao || null,
       temperatura,
       umidade || null,
       data_hora || new Date().toISOString().slice(0, 19).replace('T', ' '),
       userId,
       conforme !== undefined ? (conforme ? 1 : 0) : 1,
       observacao || null]
    );
    return { id: res.insertId };
  }

  // ── Higienizações ─────────────────────────────────────────────────────────────

  async listarHigienizacoes({ data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (data_inicio) { where.push('h.inicio >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('h.inicio <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT h.*, e.nome AS equipamento_nome,
              r.nome AS realizado_por_nome,
              a.nome AS aprovado_por_nome
       FROM pro_higienizacoes h
       LEFT JOIN equipamentos e ON e.id = h.equipamento_id
       LEFT JOIN usuarios r ON r.id = h.realizado_por
       LEFT JOIN usuarios a ON a.id = h.aprovado_por
       ${cond}
       ORDER BY h.inicio DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async registrarHigienizacao(userId, { equipamento_id, equipamento_descricao, tipo, inicio, fim, realizado_por, aprovado_por, conforme, observacao }) {
    if (!inicio) throw new AppError('Data/hora de início é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO pro_higienizacoes (equipamento_id, equipamento_descricao, tipo, inicio, fim, realizado_por, aprovado_por, conforme, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [equipamento_id || null,
       equipamento_descricao || null,
       tipo || 'CIP',
       inicio,
       fim || null,
       realizado_por || userId,
       aprovado_por || null,
       conforme !== undefined ? (conforme ? 1 : 0) : 1,
       observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarHigienizacao(id, data) {
    const [[h]] = await pool.execute(`SELECT id FROM pro_higienizacoes WHERE id = ?`, [id]);
    if (!h) throw new AppError('Higienização não encontrada', HTTP.NOT_FOUND);
    const allowed = ['fim','aprovado_por','conforme','observacao','tipo'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE pro_higienizacoes SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Perdas ────────────────────────────────────────────────────────────────────

  async listarPerdas({ data_inicio, data_fim, produto_id } = {}) {
    const where = [];
    const params = [];
    if (data_inicio) { where.push('pp.data_perda >= ?');  params.push(data_inicio); }
    if (data_fim)    { where.push('pp.data_perda <= ?');  params.push(data_fim); }
    if (produto_id)  { where.push('pp.produto_id = ?');   params.push(produto_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT pp.*, p.nome AS produto_nome,
              op.codigo AS op_codigo,
              u.nome AS registrado_por_nome
       FROM pro_perdas pp
       LEFT JOIN produtos p ON p.id = pp.produto_id
       LEFT JOIN ordens_producao op ON op.id = pp.ordem_producao_id
       LEFT JOIN usuarios u ON u.id = pp.registrado_por
       ${cond}
       ORDER BY pp.data_perda DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async registrarPerda(userId, { produto_id, ordem_producao_id, quantidade, unidade, motivo, descricao, data_perda }) {
    if (!quantidade || quantidade <= 0) throw new AppError('Quantidade inválida', HTTP.BAD_REQUEST);
    if (!motivo) throw new AppError('Motivo é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO pro_perdas (produto_id, ordem_producao_id, quantidade, unidade, motivo, descricao, data_perda, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [produto_id || null,
       ordem_producao_id || null,
       quantidade,
       unidade || 'L',
       motivo,
       descricao || null,
       data_perda || new Date().toISOString().split('T')[0],
       userId]
    );
    return { id: res.insertId };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir, c.nome AS criado_por_nome
       FROM pro_escalas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN usuarios c ON c.id = e.criado_por
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!usuario_id && !nome_externo) throw new AppError('Usuário ou nome externo são obrigatórios', HTTP.BAD_REQUEST);
    if (!turno || !data_inicio)      throw new AppError('Turno e data de início são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO pro_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno,
       data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[e]] = await pool.execute(`SELECT id FROM pro_escalas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM pro_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Indicadores OEE ───────────────────────────────────────────────────────────

  async getIndicadoresOEE({ mes, ano } = {}) {
    const m = mes   ? Number(mes)  : new Date().getMonth() + 1;
    const y = ano   ? Number(ano)  : new Date().getFullYear();

    const [[stats]] = await pool.execute(
      `SELECT
         COUNT(*) AS total_ops,
         SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas,
         SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
         SUM(CASE WHEN status IN ('em_producao','pausada') THEN 1 ELSE 0 END) AS em_andamento,
         COALESCE(SUM(quantidade_planejada), 0) AS total_planejado,
         COALESCE(SUM(quantidade_produzida), 0) AS total_produzido,
         AVG(CASE WHEN data_fim_real IS NOT NULL AND data_inicio_real IS NOT NULL
             THEN TIMESTAMPDIFF(MINUTE, data_inicio_real, data_fim_real) END) AS tempo_medio_min
       FROM ordens_producao
       WHERE MONTH(criado_em) = ? AND YEAR(criado_em) = ?`,
      [m, y]
    );

    const [[perdas]] = await pool.execute(
      `SELECT COALESCE(SUM(quantidade), 0) AS total_perdas
       FROM pro_perdas
       WHERE MONTH(data_perda) = ? AND YEAR(data_perda) = ?`,
      [m, y]
    );

    const eficiencia = stats.total_planejado > 0
      ? ((stats.total_produzido / stats.total_planejado) * 100).toFixed(1)
      : 0;

    return { ...stats, ...perdas, mes: m, ano: y, eficiencia_pct: Number(eficiencia) };
  }

  // ── Rastreabilidade de Lote ────────────────────────────────────────────────────

  async rastrearLote(lote) {
    if (!lote) throw new AppError('Lote é obrigatório', HTTP.BAD_REQUEST);
    const like = `%${lote}%`;

    const [ordens] = await pool.execute(
      `SELECT op.*, p.nome AS produto_nome FROM ordens_producao op
       LEFT JOIN produtos p ON p.id = op.produto_id
       WHERE op.codigo LIKE ?
       LIMIT 20`, [like]
    );
    const [laudos] = await pool.execute(
      `SELECT lq.*, p.nome AS produto_nome, u.nome AS analista_nome
       FROM laudos_qualidade lq
       LEFT JOIN produtos p ON p.id = lq.produto_id
       LEFT JOIN usuarios u ON u.id = lq.analista_id
       WHERE lq.lote LIKE ?
       LIMIT 20`, [like]
    );
    const [movimentacoes] = await pool.execute(
      `SELECT me.*, p.nome AS produto_nome, u.nome AS usuario_nome
       FROM movimentacoes_estoque me
       LEFT JOIN produtos p ON p.id = me.produto_id
       LEFT JOIN usuarios u ON u.id = me.usuario_id
       WHERE me.lote LIKE ?
       LIMIT 20`, [like]
    );
    const [perdas] = await pool.execute(
      `SELECT pp.*, p.nome AS produto_nome
       FROM pro_perdas pp
       LEFT JOIN produtos p ON p.id = pp.produto_id
       LEFT JOIN ordens_producao op ON op.id = pp.ordem_producao_id
       WHERE op.codigo LIKE ?
       LIMIT 20`, [like]
    );

    return { lote, ordens, laudos, movimentacoes, perdas };
  }

  // ── Pendências de Auditoria (NC do setor Produção) ────────────────────────────

  async listarPendenciasAuditoria() {
    const [rows] = await pool.execute(
      `SELECT nc.*, d.nome AS setor_nome, u.nome AS responsavel_nome, a.nome AS aberto_por_nome
       FROM qua_nao_conformidades nc
       LEFT JOIN departamentos d ON d.id = nc.setor_origem_id
       LEFT JOIN usuarios u ON u.id = nc.responsavel_id
       LEFT JOIN usuarios a ON a.id = nc.aberto_por
       WHERE nc.status IN ('aberta','em_investigacao','acao_pendente')
       ORDER BY nc.data_prazo ASC LIMIT 100`
    );
    return rows;
  }

  // ── Solicitação de Manutenção ─────────────────────────────────────────────────

  async criarSolicitacaoManutencao(userId, { equipamento_id, tipo, prioridade, descricao, data_previsao, custo_estimado }) {
    if (!equipamento_id || !descricao) throw new AppError('Equipamento e descrição são obrigatórios', HTTP.BAD_REQUEST);

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM ordens_servico`);
    const codigo = `OS-${new Date().getFullYear()}-${String(Number(total) + 1).padStart(5, '0')}`;

    const [res] = await pool.execute(
      `INSERT INTO ordens_servico (codigo, equipamento_id, tipo, prioridade, descricao, solicitante_id, data_abertura, data_previsao, custo_estimado, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'aberta')`,
      [codigo, equipamento_id,
       tipo || 'corretiva',
       prioridade || 'media',
       descricao,
       userId,
       data_previsao || null,
       custo_estimado || null]
    );
    return { id: res.insertId, codigo };
  }

  // ── Listagem de Equipamentos ──────────────────────────────────────────────────

  async listarEquipamentos() {
    const [rows] = await pool.execute(
      `SELECT e.*, d.nome AS departamento_nome
       FROM equipamentos e
       LEFT JOIN departamentos d ON d.id = e.departamento_id
       WHERE e.status != 'sucata'
       ORDER BY e.nome ASC`
    );
    return rows;
  }

  // ── Listagem de Produtos ──────────────────────────────────────────────────────

  async listarProdutos() {
    const [rows] = await pool.execute(
      `SELECT p.*, c.nome AS categoria_nome
       FROM produtos p
       LEFT JOIN categorias_produto c ON c.id = p.categoria_id
       WHERE p.ativo = 1
       ORDER BY p.nome ASC`
    );
    return rows;
  }

  // ── Consumo de Insumos ────────────────────────────────────────────────────────

  async listarConsumoInsumos({ data_inicio, data_fim } = {}) {
    const where = [`me.referencia_modulo = 'producao'`, `me.tipo = 'saida'`];
    const params = [];
    if (data_inicio) { where.push('me.criado_em >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('me.criado_em <= ?'); params.push(data_fim); }
    const [rows] = await pool.execute(
      `SELECT me.*, p.nome AS produto_nome, p.unidade_medida,
              u.nome AS usuario_nome
       FROM movimentacoes_estoque me
       LEFT JOIN produtos p ON p.id = me.produto_id
       LEFT JOIN usuarios u ON u.id = me.usuario_id
       WHERE ${where.join(' AND ')}
       ORDER BY me.criado_em DESC LIMIT 200`,
      params
    );
    return rows;
  }

  // ── Usuários ativos ───────────────────────────────────────────────────────────

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1 ORDER BY u.nome ASC`
    );
    return rows;
  }
}

module.exports = new ProducaoService();
