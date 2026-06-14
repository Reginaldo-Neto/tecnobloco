'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class SegurancaService {

  async getStats() {
    const [[{ ocorrenciasAbertas }]] = await pool.execute(
      `SELECT COUNT(*) AS ocorrenciasAbertas FROM ocorrencias_seguranca WHERE status = 'aberto'`
    );
    const [[{ ocorrenciasMes }]] = await pool.execute(
      `SELECT COUNT(*) AS ocorrenciasMes FROM ocorrencias_seguranca
       WHERE MONTH(criado_em) = MONTH(CURDATE()) AND YEAR(criado_em) = YEAR(CURDATE())`
    );
    const [[{ inspecoesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS inspecoesPendentes FROM seg_inspecoes WHERE status = 'pendente'`
    );
    const [[{ catsAbertas }]] = await pool.execute(
      `SELECT COUNT(*) AS catsAbertas FROM seg_cats WHERE status = 'aberta'`
    );
    return { ocorrenciasAbertas, ocorrenciasMes, inspecoesPendentes, catsAbertas };
  }

  // ── Ocorrências ───────────────────────────────────────────────────────────────

  async listarOcorrencias({ tipo, status } = {}) {
    const where = ['1=1']; const params = [];
    if (tipo)   { where.push('o.tipo = ?');   params.push(tipo); }
    if (status) { where.push('o.status = ?'); params.push(status); }
    const [rows] = await pool.execute(
      `SELECT o.*, c.nome_completo AS envolvido_nome, d.nome AS departamento_nome, u.nome AS registrado_por_nome
       FROM ocorrencias_seguranca o
       LEFT JOIN colaboradores c ON c.id = o.envolvido_id
       LEFT JOIN departamentos d ON d.id = o.departamento_id
       LEFT JOIN usuarios u ON u.id = o.registrado_por
       WHERE ${where.join(' AND ')} ORDER BY o.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarOcorrencia(userId, { tipo, data_ocorrencia, local, envolvido_id, departamento_id, descricao, providencias }) {
    if (!tipo || !data_ocorrencia || !descricao)
      throw new AppError('Tipo, data e descrição obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ocorrencias_seguranca (tipo, data_ocorrencia, local, envolvido_id, departamento_id, descricao, providencias, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, data_ocorrencia, local || null, envolvido_id || null, departamento_id || null,
       descricao, providencias || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarOcorrencia(id, { status, providencias }) {
    const [[row]] = await pool.execute(`SELECT id FROM ocorrencias_seguranca WHERE id = ?`, [id]);
    if (!row) throw new AppError('Ocorrência não encontrada', HTTP.NOT_FOUND);
    const sets = ['status = ?']; const params = [status];
    if (providencias !== undefined) { sets.push('providencias = ?'); params.push(providencias); }
    params.push(id);
    await pool.execute(`UPDATE ocorrencias_seguranca SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── CAT (Comunicação de Acidente de Trabalho) ─────────────────────────────────

  async listarCats({ status } = {}) {
    const where = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, col.nome_completo AS colaborador_nome, u.nome AS registrado_por_nome
       FROM seg_cats c
       LEFT JOIN colaboradores col ON col.id = c.colaborador_id
       LEFT JOIN usuarios u ON u.id = c.registrado_por
       ${where} ORDER BY c.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarCat(userId, { colaborador_id, data_acidente, hora_acidente, local, descricao, parte_corpo_atingida, tipo_lesao, afastamento_dias, cid }) {
    if (!colaborador_id || !data_acidente || !descricao)
      throw new AppError('Colaborador, data e descrição obrigatórios', HTTP.BAD_REQUEST);
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM seg_cats`);
    const numero_cat = `CAT-${String(Number(total) + 1).padStart(5, '0')}`;
    const [res] = await pool.execute(
      `INSERT INTO seg_cats (numero_cat, colaborador_id, data_acidente, hora_acidente, local_acidente, descricao,
       parte_corpo_atingida, tipo_lesao, afastamento_dias, cid, status, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberta', ?)`,
      [numero_cat, colaborador_id, data_acidente, hora_acidente || null, local || null, descricao,
       parte_corpo_atingida || null, tipo_lesao || null, afastamento_dias || 0, cid || null, userId]
    );
    return { id: res.insertId, numero_cat };
  }

  async atualizarCat(id, { status, observacao }) {
    await pool.execute(
      `UPDATE seg_cats SET status = ?, observacao = ? WHERE id = ?`,
      [status, observacao || null, id]
    );
    return { ok: true };
  }

  // ── Inspeções de Segurança ────────────────────────────────────────────────────

  async listarInspecoes({ status } = {}) {
    const where = status ? 'WHERE i.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT i.*, d.nome AS departamento_nome, u.nome AS responsavel_nome, ua.nome AS aprovado_por_nome
       FROM seg_inspecoes i
       LEFT JOIN departamentos d ON d.id = i.departamento_id
       LEFT JOIN usuarios u ON u.id = i.responsavel_id
       LEFT JOIN usuarios ua ON ua.id = i.aprovado_por
       ${where} ORDER BY i.data_inspecao DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarInspecao(userId, { departamento_id, data_inspecao, tipo, itens_conformes, itens_nao_conformes, observacao }) {
    if (!departamento_id || !data_inspecao)
      throw new AppError('Departamento e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO seg_inspecoes (departamento_id, responsavel_id, data_inspecao, tipo, itens_conformes, itens_nao_conformes, observacao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [departamento_id, userId, data_inspecao, tipo || 'geral',
       JSON.stringify(itens_conformes || []), JSON.stringify(itens_nao_conformes || []), observacao || null]
    );
    return { id: res.insertId };
  }

  async aprovarInspecao(userId, id, { observacao }) {
    const [[row]] = await pool.execute(`SELECT id FROM seg_inspecoes WHERE id = ?`, [id]);
    if (!row) throw new AppError('Inspeção não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE seg_inspecoes SET status = 'aprovada', aprovado_por = ?, observacao_aprovacao = ? WHERE id = ?`,
      [userId, observacao || null, id]
    );
    return { ok: true };
  }

  // ── Treinamentos de Segurança ─────────────────────────────────────────────────

  async listarTreinamentosSeg() {
    const [rows] = await pool.execute(
      `SELECT t.*, u.nome AS ministrado_por_nome
       FROM seg_treinamentos t
       LEFT JOIN usuarios u ON u.id = t.ministrado_por
       ORDER BY t.data_realizacao DESC LIMIT 200`
    );
    return rows;
  }

  async criarTreinamentoSeg(userId, { titulo, data_realizacao, carga_horaria, local, participantes, observacao }) {
    if (!titulo || !data_realizacao) throw new AppError('Título e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO seg_treinamentos (titulo, data_realizacao, carga_horaria, local_realizacao, participantes, observacao, ministrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, data_realizacao, carga_horaria || null, local || null,
       JSON.stringify(participantes || []), observacao || null, userId]
    );
    return { id: res.insertId };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir
       FROM seg_escalas e LEFT JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO seg_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    await pool.execute(`DELETE FROM seg_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarColaboradores() {
    const [rows] = await pool.execute(`SELECT id, nome_completo AS nome FROM colaboradores WHERE ativo = 1 ORDER BY nome_completo`);
    return rows;
  }

  async listarDepartamentos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM departamentos ORDER BY nome`);
    return rows;
  }

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM usuarios WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async recentesOcorrencias() {
    const [rows] = await pool.execute(
      `SELECT o.*, c.nome_completo AS envolvido_nome FROM ocorrencias_seguranca o
       LEFT JOIN colaboradores c ON c.id = o.envolvido_id
       ORDER BY o.criado_em DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new SegurancaService();
