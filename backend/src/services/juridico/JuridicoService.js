'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class JuridicoService {

  async getStats() {
    const [[{ contratosVigentes }]] = await pool.execute(
      `SELECT COUNT(*) AS contratosVigentes FROM jur_contratos WHERE status = 'vigente'`
    );
    const [[{ processosAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS processosAtivos FROM jur_processos WHERE status NOT IN ('arquivado','encerrado')`
    );
    const [[{ prazosProximos }]] = await pool.execute(
      `SELECT COUNT(*) AS prazosProximos FROM jur_prazos
       WHERE data_prazo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status = 'pendente'`
    );
    const [[{ contratosVencendo }]] = await pool.execute(
      `SELECT COUNT(*) AS contratosVencendo FROM jur_contratos
       WHERE data_fim BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status = 'vigente'`
    );
    return { contratosVigentes, processosAtivos, prazosProximos, contratosVencendo };
  }

  // ── Contratos ─────────────────────────────────────────────────────────────────

  async listarContratos({ status, tipo } = {}) {
    const where = ['1=1']; const params = [];
    if (status) { where.push('c.status = ?'); params.push(status); }
    if (tipo)   { where.push('c.tipo = ?');   params.push(tipo); }
    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS responsavel_nome FROM jur_contratos c
       LEFT JOIN usuarios u ON u.id = c.responsavel_id
       WHERE ${where.join(' AND ')} ORDER BY c.data_inicio DESC LIMIT 200`, params
    );
    return rows;
  }

  async buscarContrato(id) {
    const [[row]] = await pool.execute(`SELECT * FROM jur_contratos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Contrato não encontrado', HTTP.NOT_FOUND);
    return row;
  }

  async criarContrato(userId, { titulo, tipo, parte_contratada, objeto, valor, data_inicio, data_fim, arquivo_url }) {
    if (!titulo || !tipo || !data_inicio) throw new AppError('Título, tipo e data de início obrigatórios', HTTP.BAD_REQUEST);
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM jur_contratos`);
    const numero = `CT-${String(Number(total) + 1).padStart(5, '0')}`;
    const [res] = await pool.execute(
      `INSERT INTO jur_contratos (numero, titulo, tipo, parte_contratada, objeto, valor, data_inicio, data_fim, arquivo_url, status, responsavel_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'vigente', ?)`,
      [numero, titulo, tipo, parte_contratada || null, objeto || null, valor || null,
       data_inicio, data_fim || null, arquivo_url || null, userId]
    );
    return { id: res.insertId, numero };
  }

  async atualizarContrato(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM jur_contratos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Contrato não encontrado', HTTP.NOT_FOUND);
    const allowed = ['titulo', 'parte_contratada', 'objeto', 'valor', 'data_fim', 'arquivo_url', 'status', 'observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE jur_contratos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Processos Judiciais ───────────────────────────────────────────────────────

  async listarProcessos({ status, tipo } = {}) {
    const where = ['1=1']; const params = [];
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (tipo)   { where.push('p.tipo = ?');   params.push(tipo); }
    const [rows] = await pool.execute(
      `SELECT p.*, u.nome AS responsavel_nome FROM jur_processos p
       LEFT JOIN usuarios u ON u.id = p.responsavel_id
       WHERE ${where.join(' AND ')} ORDER BY p.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarProcesso(userId, { numero_processo, tipo, vara, tribunal, parte_contraria, advogado, descricao, valor_causa }) {
    if (!numero_processo || !tipo) throw new AppError('Número do processo e tipo obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO jur_processos (numero_processo, tipo, vara, tribunal, parte_contraria, advogado, descricao, valor_causa, status, responsavel_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'em_andamento', ?)`,
      [numero_processo, tipo, vara || null, tribunal || null, parte_contraria || null,
       advogado || null, descricao || null, valor_causa || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarProcesso(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM jur_processos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Processo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['vara', 'tribunal', 'advogado', 'descricao', 'valor_causa', 'status', 'resultado', 'data_encerramento'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE jur_processos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Prazos / Agenda Jurídica ──────────────────────────────────────────────────

  async listarPrazos({ status } = {}) {
    const where = status ? 'WHERE p.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT p.*, u.nome AS responsavel_nome FROM jur_prazos p
       LEFT JOIN usuarios u ON u.id = p.responsavel_id
       ${where} ORDER BY p.data_prazo ASC LIMIT 200`, params
    );
    return rows;
  }

  async criarPrazo(userId, { titulo, descricao, data_prazo, tipo, processo_id, contrato_id, prioridade }) {
    if (!titulo || !data_prazo) throw new AppError('Título e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO jur_prazos (titulo, descricao, data_prazo, tipo, processo_id, contrato_id, prioridade, status, responsavel_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?)`,
      [titulo, descricao || null, data_prazo, tipo || 'prazo_judicial',
       processo_id || null, contrato_id || null, prioridade || 'normal', userId]
    );
    return { id: res.insertId };
  }

  async atualizarPrazo(id, { status, observacao }) {
    const [[row]] = await pool.execute(`SELECT id FROM jur_prazos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Prazo não encontrado', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE jur_prazos SET status = ?, observacao = ? WHERE id = ?`,
      [status, observacao || null, id]
    );
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir
       FROM jur_escalas e LEFT JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO jur_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    await pool.execute(`DELETE FROM jur_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM usuarios WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async recentesContratos() {
    const [rows] = await pool.execute(
      `SELECT * FROM jur_contratos ORDER BY criado_em DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new JuridicoService();
