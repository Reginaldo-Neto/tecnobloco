'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class LimpezaService {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ solicitacoesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS solicitacoesPendentes FROM solicitacoes_limpeza
       WHERE status IN ('pendente','aceita','em_andamento')`
    );
    const [[{ checklistHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS checklistHoje FROM limpeza_checklist_registros
       WHERE DATE(horario_execucao) = CURDATE()`
    );
    const [[{ totalRotinas }]] = await pool.execute(
      `SELECT COUNT(*) AS totalRotinas FROM limpeza_rotinas WHERE ativo = 1`
    );
    const [[{ itensCriticos }]] = await pool.execute(
      `SELECT COUNT(*) AS itensCriticos FROM limpeza_estoque
       WHERE ativo = 1 AND quantidade_atual <= quantidade_minima`
    );
    const [[{ cacambasPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS cacambasPendentes FROM limpeza_cacambas
       WHERE status IN ('pendente','agendada')`
    );
    return { solicitacoesPendentes, checklistHoje, totalRotinas, itensCriticos, cacambasPendentes };
  }

  // ── Solicitações de Limpeza ──────────────────────────────────────────────────

  async listarSolicitacoes({ status, urgencia } = {}) {
    const where = [];
    const params = [];
    if (status)   { where.push('sl.status = ?');   params.push(status); }
    if (urgencia) { where.push('sl.urgencia = ?'); params.push(urgencia); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT sl.*, sol.nome AS solicitante_nome, ate.nome AS atendido_por_nome
       FROM solicitacoes_limpeza sl
       LEFT JOIN usuarios sol ON sol.id = sl.solicitante_id
       LEFT JOIN usuarios ate ON ate.id = sl.atendido_por
       ${cond}
       ORDER BY FIELD(sl.urgencia,'alta','media','baixa'),
                FIELD(sl.status,'pendente','aceita','em_andamento','concluida','cancelada'),
                sl.criado_em DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async atualizarSolicitacao(userId, id, { status, atendido_por, observacao_conclusao }) {
    const statusValidos = ['aceita','em_andamento','concluida','cancelada'];
    if (!status || !statusValidos.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[s]] = await pool.execute(`SELECT id FROM solicitacoes_limpeza WHERE id = ?`, [id]);
    if (!s) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (atendido_por !== undefined) { sets.push('atendido_por = ?'); params.push(atendido_por || userId); }
    if (observacao_conclusao !== undefined) { sets.push('observacao_conclusao = ?'); params.push(observacao_conclusao); }
    params.push(id);
    await pool.execute(`UPDATE solicitacoes_limpeza SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Rotinas de Limpeza ────────────────────────────────────────────────────────

  async listarRotinas() {
    const [rows] = await pool.execute(
      `SELECT r.*, u.nome AS responsavel_nome, cr.nome AS criado_por_nome
       FROM limpeza_rotinas r
       LEFT JOIN usuarios u  ON u.id  = r.responsavel_padrao_id
       LEFT JOIN usuarios cr ON cr.id = r.criado_por_id
       WHERE r.ativo = 1
       ORDER BY FIELD(r.frequencia,'diaria','semanal','quinzenal','mensal'), r.horario`
    );
    return rows;
  }

  async criarRotina(userId, { nome, descricao, local_setor, frequencia, dia_semana, horario, responsavel_padrao_id }) {
    if (!nome || !local_setor) throw new AppError('Nome e local são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_rotinas (nome, descricao, local_setor, frequencia, dia_semana, horario, responsavel_padrao_id, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, descricao || null, local_setor, frequencia || 'diaria',
       dia_semana ?? null, horario || null, responsavel_padrao_id || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarRotina(id, data) {
    const [[r]] = await pool.execute(`SELECT id FROM limpeza_rotinas WHERE id = ? AND ativo = 1`, [id]);
    if (!r) throw new AppError('Rotina não encontrada', HTTP.NOT_FOUND);
    const allowed = ['nome','descricao','local_setor','frequencia','dia_semana','horario','responsavel_padrao_id','ativo'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE limpeza_rotinas SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirRotina(id) {
    const [[r]] = await pool.execute(`SELECT id FROM limpeza_rotinas WHERE id = ? AND ativo = 1`, [id]);
    if (!r) throw new AppError('Rotina não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE limpeza_rotinas SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Checklist de Execução ─────────────────────────────────────────────────────

  async listarChecklist({ data } = {}) {
    const dataRef = data || new Date().toISOString().split('T')[0];
    const [registros] = await pool.execute(
      `SELECT c.*, u.nome AS usuario_nome, r.nome AS rotina_nome
       FROM limpeza_checklist_registros c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       LEFT JOIN limpeza_rotinas r ON r.id = c.rotina_id
       WHERE DATE(c.horario_execucao) = ?
       ORDER BY c.horario_execucao DESC`,
      [dataRef]
    );
    // Rotinas ativas para mostrar o que ainda falta marcar
    const [rotinas] = await pool.execute(
      `SELECT r.id, r.nome, r.local_setor, r.horario
       FROM limpeza_rotinas r WHERE r.ativo = 1 AND r.frequencia = 'diaria'`
    );
    return { registros, rotinas };
  }

  async registrarChecklist(userId, { rotina_id, local_setor, descricao, observacao }) {
    if (!local_setor || !descricao) throw new AppError('Local e descrição são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_checklist_registros (rotina_id, local_setor, descricao, usuario_id, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [rotina_id || null, local_setor, descricao, userId, observacao || null]
    );
    return { id: res.insertId };
  }

  // ── Gestão de Resíduos ────────────────────────────────────────────────────────

  async listarResiduos({ data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (data_inicio) { where.push('r.data_coleta >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('r.data_coleta <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [registros] = await pool.execute(
      `SELECT r.*, u.nome AS usuario_nome
       FROM limpeza_residuos r
       LEFT JOIN usuarios u ON u.id = r.usuario_id
       ${cond}
       ORDER BY r.data_coleta DESC, r.created_at DESC
       LIMIT 200`,
      params
    );
    const [totais] = await pool.execute(
      `SELECT tipo, ROUND(SUM(peso_kg),2) AS total_kg, COUNT(*) AS registros
       FROM limpeza_residuos
       WHERE data_coleta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY tipo ORDER BY total_kg DESC`
    );
    return { registros, totais };
  }

  async registrarResiduo(userId, { tipo, local_origem, peso_kg, destinacao, observacao, data_coleta }) {
    const tiposValidos = ['organico','reciclavel','perigoso','rejeito','eletronico'];
    if (!tipo || !tiposValidos.includes(tipo)) throw new AppError('Tipo de resíduo inválido', HTTP.BAD_REQUEST);
    if (!local_origem) throw new AppError('Local de origem é obrigatório', HTTP.BAD_REQUEST);
    if (!peso_kg || Number(peso_kg) <= 0) throw new AppError('Peso deve ser maior que zero', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_residuos (tipo, local_origem, peso_kg, destinacao, observacao, usuario_id, data_coleta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo, local_origem, Number(peso_kg), destinacao || null, observacao || null, userId,
       data_coleta || new Date().toISOString().split('T')[0]]
    );
    return { id: res.insertId };
  }

  // ── Caçambas ──────────────────────────────────────────────────────────────────

  async listarCacambas({ status } = {}) {
    const where = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS solicitante_nome
       FROM limpeza_cacambas c
       LEFT JOIN usuarios u ON u.id = c.solicitante_id
       ${where}
       ORDER BY FIELD(c.status,'pendente','agendada','concluida','cancelada'), c.created_at DESC
       LIMIT 100`,
      params
    );
    return rows;
  }

  async criarSolicitacaoCacamba(userId, { local, tipo_cacamba, motivo, descricao, data_prevista }) {
    if (!local) throw new AppError('Local é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_cacambas (local, tipo_cacamba, motivo, descricao, data_prevista, solicitante_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [local, tipo_cacamba || 'misto', motivo || 'cheia', descricao || null,
       data_prevista || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarStatusCacamba(id, { status, observacao_conclusao }) {
    const statusValidos = ['agendada','concluida','cancelada'];
    if (!status || !statusValidos.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[c]] = await pool.execute(`SELECT id FROM limpeza_cacambas WHERE id = ?`, [id]);
    if (!c) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE limpeza_cacambas SET status = ?, observacao_conclusao = ? WHERE id = ?`,
      [status, observacao_conclusao || null, id]
    );
    return { ok: true };
  }

  // ── Lavagem de Pátio ──────────────────────────────────────────────────────────

  async listarLavagemPatio({ status } = {}) {
    const where = status ? 'WHERE lp.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT lp.*, sol.nome AS solicitante_nome, exe.nome AS executado_por_nome
       FROM limpeza_lavagem_patio lp
       LEFT JOIN usuarios sol ON sol.id = lp.solicitante_id
       LEFT JOIN usuarios exe ON exe.id = lp.executado_por_id
       ${where}
       ORDER BY lp.data_agendada DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarLavagemPatio(userId, { area, tipo, data_agendada, horario_previsto, observacoes }) {
    if (!area || !data_agendada) throw new AppError('Área e data são obrigatórias', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_lavagem_patio (area, tipo, data_agendada, horario_previsto, observacoes, solicitante_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [area, tipo || 'lavagem_pesada', data_agendada,
       horario_previsto || null, observacoes || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarStatusLavagem(id, { status, executado_por_id, observacao_conclusao }) {
    const statusValidos = ['em_andamento','concluida','cancelada'];
    if (!status || !statusValidos.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[lp]] = await pool.execute(`SELECT id FROM limpeza_lavagem_patio WHERE id = ?`, [id]);
    if (!lp) throw new AppError('Registro não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (executado_por_id) { sets.push('executado_por_id = ?'); params.push(executado_por_id); }
    if (observacao_conclusao !== undefined) { sets.push('observacao_conclusao = ?'); params.push(observacao_conclusao); }
    params.push(id);
    await pool.execute(`UPDATE limpeza_lavagem_patio SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Estoque DML ───────────────────────────────────────────────────────────────

  async listarEstoque() {
    const [rows] = await pool.execute(
      `SELECT e.*, cr.nome AS criado_por_nome
       FROM limpeza_estoque e
       LEFT JOIN usuarios cr ON cr.id = e.criado_por_id
       WHERE e.ativo = 1
       ORDER BY FIELD(e.categoria,'produto_quimico','utensilio','equipamento','descartavel','epi'), e.nome`
    );
    return rows;
  }

  async criarItemEstoque(userId, { nome, categoria, unidade, quantidade_atual, quantidade_minima, localizacao, observacoes }) {
    if (!nome) throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, localizacao, observacoes, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, categoria || 'utensilio', unidade || 'UN',
       Number(quantidade_atual) || 0, Number(quantidade_minima) || 0,
       localizacao || null, observacoes || null, userId]
    );
    return { id: res.insertId };
  }

  async registrarMovimento(userId, itemId, { tipo, quantidade, motivo }) {
    const tiposValidos = ['entrada','saida','ajuste'];
    if (!tipo || !tiposValidos.includes(tipo)) throw new AppError('Tipo de movimento inválido', HTTP.BAD_REQUEST);
    if (!quantidade || Number(quantidade) <= 0) throw new AppError('Quantidade deve ser maior que zero', HTTP.BAD_REQUEST);
    const [[item]] = await pool.execute(
      `SELECT id, quantidade_atual FROM limpeza_estoque WHERE id = ? AND ativo = 1`, [itemId]
    );
    if (!item) throw new AppError('Item não encontrado', HTTP.NOT_FOUND);
    let novaQtd = Number(item.quantidade_atual);
    if (tipo === 'entrada')  novaQtd += Number(quantidade);
    if (tipo === 'saida')    novaQtd -= Number(quantidade);
    if (tipo === 'ajuste')   novaQtd  = Number(quantidade);
    if (novaQtd < 0) throw new AppError('Estoque insuficiente para a saída', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE limpeza_estoque SET quantidade_atual = ? WHERE id = ?`, [novaQtd, itemId]);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_estoque_movimentos (item_id, tipo, quantidade, motivo, usuario_id)
       VALUES (?, ?, ?, ?, ?)`,
      [itemId, tipo, Number(quantidade), motivo || null, userId]
    );
    return { id: res.insertId, quantidade_atual: novaQtd };
  }

  // ── Controle de Descartáveis ──────────────────────────────────────────────────

  async listarDescartaveis({ periodo } = {}) {
    const periodoFinal = periodo || new Date().toISOString().slice(0, 7);
    const [registros] = await pool.execute(
      `SELECT d.*, u.nome AS usuario_nome
       FROM limpeza_consumo_descartaveis d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.periodo_ref = ?
       ORDER BY d.setor, d.tipo`,
      [periodoFinal]
    );
    const [resumo] = await pool.execute(
      `SELECT tipo, ROUND(SUM(quantidade),2) AS total_quantidade, COUNT(DISTINCT setor) AS setores
       FROM limpeza_consumo_descartaveis
       WHERE periodo_ref = ?
       GROUP BY tipo ORDER BY total_quantidade DESC`,
      [periodoFinal]
    );
    const [periodos] = await pool.execute(
      `SELECT DISTINCT periodo_ref FROM limpeza_consumo_descartaveis
       ORDER BY periodo_ref DESC LIMIT 12`
    );
    return { registros, resumo, periodo: periodoFinal, periodos: periodos.map(p => p.periodo_ref) };
  }

  async registrarConsumo(userId, { setor, tipo, quantidade, unidade, periodo_ref, observacao }) {
    const tiposValidos = ['papel_toalha','papel_higienico','sabonete','alcool_gel','outro'];
    if (!setor) throw new AppError('Setor é obrigatório', HTTP.BAD_REQUEST);
    if (!tipo || !tiposValidos.includes(tipo)) throw new AppError('Tipo de descartável inválido', HTTP.BAD_REQUEST);
    if (!quantidade || Number(quantidade) <= 0) throw new AppError('Quantidade deve ser maior que zero', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_consumo_descartaveis (setor, tipo, quantidade, unidade, periodo_ref, usuario_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [setor, tipo, Number(quantidade), unidade || 'UN',
       periodo_ref || new Date().toISOString().slice(0, 7), userId, observacao || null]
    );
    return { id: res.insertId };
  }

  // ── Compra de Insumos ─────────────────────────────────────────────────────────

  async listarCompras() {
    const [rows] = await pool.execute(
      `SELECT sc.*, sol.nome AS solicitante_nome, apr.nome AS aprovado_por_nome
       FROM solicitacoes_compra sc
       LEFT JOIN usuarios sol ON sol.id = sc.solicitante_id
       LEFT JOIN usuarios apr ON apr.id = sc.aprovado_por
       WHERE sc.justificativa LIKE '%[LIMPEZA]%'
       ORDER BY FIELD(sc.status,'pendente','aprovada','em_cotacao','concluida','rejeitada','cancelada'),
                sc.criado_em DESC
       LIMIT 100`
    );
    return rows;
  }

  async criarSolicitacaoCompra(userId, { item_descricao, quantidade, unidade, valor_estimado, justificativa, urgencia, fornecedor_sugerido }) {
    if (!item_descricao || !quantidade) throw new AppError('Item e quantidade são obrigatórios', HTTP.BAD_REQUEST);
    const justFinal = `[LIMPEZA] ${justificativa || ''}`.trim();
    const [res] = await pool.execute(
      `INSERT INTO solicitacoes_compra (solicitante_id, item_descricao, quantidade, unidade, valor_estimado, justificativa, urgencia, fornecedor_sugerido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, item_descricao, Number(quantidade), unidade || 'UN',
       valor_estimado ? Number(valor_estimado) : null,
       justFinal, urgencia || 'media', fornecedor_sugerido || null]
    );
    return { id: res.insertId };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.funcionario_nome) AS nome_exibir, cr.nome AS criado_por_nome
       FROM limpeza_escalas e
       LEFT JOIN usuarios u  ON u.id  = e.usuario_id
       LEFT JOIN usuarios cr ON cr.id = e.criado_por_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, funcionario_nome, turno, data_inicio, data_fim, tipo, observacao }) {
    if (!usuario_id && !funcionario_nome) throw new AppError('Usuário ou nome do funcionário é obrigatório', HTTP.BAD_REQUEST);
    if (!data_inicio || !data_fim) throw new AppError('Datas são obrigatórias', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO limpeza_escalas (usuario_id, funcionario_nome, turno, data_inicio, data_fim, tipo, observacao, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, funcionario_nome || null, turno || 'integral',
       data_inicio, data_fim, tipo || 'normal', observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[e]] = await pool.execute(`SELECT id FROM limpeza_escalas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM limpeza_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

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

module.exports = new LimpezaService();
