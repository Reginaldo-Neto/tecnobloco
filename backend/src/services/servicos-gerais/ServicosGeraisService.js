'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class ServicosGeraisService {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ atividadesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS atividadesPendentes FROM sg_atividades WHERE status IN ('planejado','em_andamento')`
    );
    const [[{ solicitacoesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS solicitacoesPendentes FROM solicitacoes_servicos_gerais WHERE status IN ('pendente','aceita','em_andamento')`
    );
    const [[{ insumosAbaixoMinimo }]] = await pool.execute(
      `SELECT COUNT(*) AS insumosAbaixoMinimo FROM sg_insumos WHERE ativo = 1 AND estoque_atual <= estoque_minimo`
    );
    const [[{ ferramentasExtravios }]] = await pool.execute(
      `SELECT COUNT(*) AS ferramentasExtravios FROM sg_ferramentas WHERE ativo = 1 AND status = 'extraviado'`
    );
    const [[{ pendenciasAuditoria }]] = await pool.execute(
      `SELECT COUNT(*) AS pendenciasAuditoria FROM sg_pendencias_auditoria WHERE status IN ('pendente','em_correcao')`
    );
    return { atividadesPendentes, solicitacoesPendentes, insumosAbaixoMinimo, ferramentasExtravios, pendenciasAuditoria };
  }

  // ── Atividades (f02–f11) ──────────────────────────────────────────────────────

  async listarAtividades({ tipo, status, data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (tipo)        { where.push('a.tipo = ?');            params.push(tipo); }
    if (status)      { where.push('a.status = ?');          params.push(status); }
    if (data_inicio) { where.push('a.data_execucao >= ?');  params.push(data_inicio); }
    if (data_fim)    { where.push('a.data_execucao <= ?');  params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, COALESCE(u.nome, a.responsavel_nome) AS responsavel_exibir,
              r.nome AS registrado_por_nome
       FROM sg_atividades a
       LEFT JOIN usuarios u ON u.id = a.responsavel_id
       LEFT JOIN usuarios r ON r.id = a.registrado_por
       ${cond}
       ORDER BY a.data_execucao DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async criarAtividade(userId, { tipo, titulo, local, descricao, data_execucao, responsavel_id, responsavel_nome, produto_utilizado, observacao }) {
    if (!titulo) throw new AppError('Título é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sg_atividades (tipo, titulo, local, descricao, data_execucao, responsavel_id, responsavel_nome, produto_utilizado, observacao, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo || 'outro', titulo, local || null, descricao || null,
       data_execucao || new Date().toISOString().split('T')[0],
       responsavel_id || null, responsavel_nome || null,
       produto_utilizado || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarAtividade(id, data) {
    const [[a]] = await pool.execute(`SELECT id FROM sg_atividades WHERE id = ?`, [id]);
    if (!a) throw new AppError('Atividade não encontrada', HTTP.NOT_FOUND);
    const allowed = ['status','titulo','local','descricao','data_execucao','data_conclusao',
                     'responsavel_id','responsavel_nome','produto_utilizado','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE sg_atividades SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Ferramentas (f12) ─────────────────────────────────────────────────────────

  async listarFerramentas({ status } = {}) {
    const where = ['f.ativo = 1'];
    const params = [];
    if (status) { where.push('f.status = ?'); params.push(status); }
    const [rows] = await pool.execute(
      `SELECT f.* FROM sg_ferramentas f
       WHERE ${where.join(' AND ')}
       ORDER BY f.nome ASC`,
      params
    );
    return rows;
  }

  async criarFerramenta(userId, { codigo, nome, tipo, quantidade, quantidade_minima, localizacao, observacao }) {
    if (!nome) throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    if (!codigo) {
      const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM sg_ferramentas`);
      codigo = `FERR-${String(Number(total) + 1).padStart(4, '0')}`;
    }
    const [[ex]] = await pool.execute(`SELECT id FROM sg_ferramentas WHERE codigo = ?`, [codigo]);
    if (ex) throw new AppError('Código já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO sg_ferramentas (codigo, nome, tipo, quantidade, quantidade_minima, localizacao, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nome, tipo || 'manual',
       quantidade || 1, quantidade_minima || 1,
       localizacao || null, observacao || null]
    );
    return { id: res.insertId, codigo };
  }

  async registrarMovimentoFerramenta(userId, ferramentaId, { tipo_movimento, usuario_id, quantidade, observacao }) {
    const valid = ['retirada','devolucao','manutencao','extravio','ajuste'];
    if (!tipo_movimento || !valid.includes(tipo_movimento))
      throw new AppError('Tipo de movimento inválido', HTTP.BAD_REQUEST);
    const [[f]] = await pool.execute(`SELECT id, quantidade, status FROM sg_ferramentas WHERE id = ? AND ativo = 1`, [ferramentaId]);
    if (!f) throw new AppError('Ferramenta não encontrada', HTTP.NOT_FOUND);

    const qty = Math.abs(Number(quantidade) || 1);
    const [res] = await pool.execute(
      `INSERT INTO sg_ferramentas_movimentos (ferramenta_id, tipo_movimento, usuario_id, quantidade, observacao, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ferramentaId, tipo_movimento, usuario_id || null, qty, observacao || null, userId]
    );

    // Atualizar status da ferramenta
    const statusMap = { retirada: 'em_uso', devolucao: 'disponivel', manutencao: 'em_manutencao', extravio: 'extraviado' };
    if (statusMap[tipo_movimento]) {
      await pool.execute(`UPDATE sg_ferramentas SET status = ? WHERE id = ?`, [statusMap[tipo_movimento], ferramentaId]);
    }
    return { id: res.insertId };
  }

  // ── Insumos e Combustível (f13) ───────────────────────────────────────────────

  async listarInsumos() {
    const [rows] = await pool.execute(
      `SELECT * FROM sg_insumos WHERE ativo = 1 ORDER BY tipo, nome ASC`
    );
    return rows;
  }

  async criarInsumo(userId, { nome, tipo, unidade, estoque_atual, estoque_minimo, observacao }) {
    if (!nome) throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sg_insumos (nome, tipo, unidade, estoque_atual, estoque_minimo, observacao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, tipo || 'outro', unidade || 'L',
       estoque_atual || 0, estoque_minimo || 0, observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarInsumo(id, data) {
    const [[ins]] = await pool.execute(`SELECT id FROM sg_insumos WHERE id = ? AND ativo = 1`, [id]);
    if (!ins) throw new AppError('Insumo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome','tipo','unidade','estoque_atual','estoque_minimo','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE sg_insumos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async registrarUsoInsumo(userId, insumoId, { quantidade, data_uso, equipamento, responsavel_id, observacao }) {
    if (!quantidade || quantidade <= 0) throw new AppError('Quantidade inválida', HTTP.BAD_REQUEST);
    const [[ins]] = await pool.execute(`SELECT id, estoque_atual FROM sg_insumos WHERE id = ? AND ativo = 1`, [insumoId]);
    if (!ins) throw new AppError('Insumo não encontrado', HTTP.NOT_FOUND);
    if (ins.estoque_atual < quantidade) throw new AppError('Estoque insuficiente', HTTP.CONFLICT);
    await pool.execute(
      `INSERT INTO sg_insumos_uso (insumo_id, quantidade, data_uso, equipamento, responsavel_id, observacao, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [insumoId, quantidade, data_uso || new Date().toISOString().split('T')[0],
       equipamento || null, responsavel_id || null, observacao || null, userId]
    );
    await pool.execute(`UPDATE sg_insumos SET estoque_atual = estoque_atual - ? WHERE id = ?`, [quantidade, insumoId]);
    return { ok: true };
  }

  // ── Cronograma de Jardinagem (f01 / f18) ──────────────────────────────────────

  async listarCronogramaJardinagem({ status } = {}) {
    const where = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, COALESCE(u.nome, c.responsavel_nome) AS responsavel_exibir,
              cb.nome AS criado_por_nome
       FROM sg_cronograma_jardinagem c
       LEFT JOIN usuarios u  ON u.id  = c.responsavel_id
       LEFT JOIN usuarios cb ON cb.id = c.criado_por
       ${where}
       ORDER BY c.data_prevista ASC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarCronograma(userId, { titulo, tipo, local, data_prevista, responsavel_id, responsavel_nome, observacao }) {
    if (!titulo || !data_prevista) throw new AppError('Título e data são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sg_cronograma_jardinagem (titulo, tipo, local, data_prevista, responsavel_id, responsavel_nome, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, tipo || 'corte_grama', local || null, data_prevista,
       responsavel_id || null, responsavel_nome || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarCronograma(id, data) {
    const [[c]] = await pool.execute(`SELECT id FROM sg_cronograma_jardinagem WHERE id = ?`, [id]);
    if (!c) throw new AppError('Cronograma não encontrado', HTTP.NOT_FOUND);
    const allowed = ['titulo','tipo','local','data_prevista','data_realizada','status',
                     'responsavel_id','responsavel_nome','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE sg_cronograma_jardinagem SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirCronograma(id) {
    const [[c]] = await pool.execute(`SELECT id FROM sg_cronograma_jardinagem WHERE id = ?`, [id]);
    if (!c) throw new AppError('Cronograma não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM sg_cronograma_jardinagem WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Solicitações de Apoio (f14 / f16) ────────────────────────────────────────

  async listarSolicitacoes({ status } = {}) {
    const where = status ? 'WHERE s.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT s.*, sol.nome AS solicitante_nome, at.nome AS atendido_por_nome
       FROM solicitacoes_servicos_gerais s
       LEFT JOIN usuarios sol ON sol.id = s.solicitante_id
       LEFT JOIN usuarios at  ON at.id  = s.atendido_por
       ${where}
       ORDER BY FIELD(s.urgencia,'alta','media','baixa'),
                FIELD(s.status,'pendente','aceita','em_andamento','concluida','cancelada'),
                s.criado_em DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async atualizarSolicitacao(userId, id, { status, observacao_conclusao }) {
    const valid = ['pendente','aceita','em_andamento','concluida','cancelada'];
    if (!status || !valid.includes(status))
      throw new AppError(`Status inválido. Aceitos: ${valid.join(', ')}`, HTTP.BAD_REQUEST);
    const [[s]] = await pool.execute(`SELECT id FROM solicitacoes_servicos_gerais WHERE id = ?`, [id]);
    if (!s) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    const sets = ['status = ?', 'atendido_por = ?'];
    const params = [status, userId];
    if (observacao_conclusao !== undefined) { sets.push('observacao_conclusao = ?'); params.push(observacao_conclusao); }
    params.push(id);
    await pool.execute(`UPDATE solicitacoes_servicos_gerais SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Pendências de Auditoria (f17) ─────────────────────────────────────────────

  async listarPendenciasAuditoria({ status } = {}) {
    const where = status ? 'WHERE p.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT p.*, u.nome AS criado_por_nome
       FROM sg_pendencias_auditoria p
       LEFT JOIN usuarios u ON u.id = p.criado_por
       ${where}
       ORDER BY FIELD(p.status,'pendente','em_correcao','corrigido','nao_conformidade'),
                p.prazo ASC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarPendenciaAuditoria(userId, { titulo, descricao, local, responsavel, prazo, status, origem }) {
    if (!titulo) throw new AppError('Título é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sg_pendencias_auditoria (titulo, descricao, local, responsavel, prazo, status, origem, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, local || null, responsavel || null,
       prazo || null, status || 'pendente', origem || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarPendenciaAuditoria(id, data) {
    const [[p]] = await pool.execute(`SELECT id FROM sg_pendencias_auditoria WHERE id = ?`, [id]);
    if (!p) throw new AppError('Pendência não encontrada', HTTP.NOT_FOUND);
    const allowed = ['titulo','descricao','local','responsavel','prazo','status','origem'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE sg_pendencias_auditoria SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Escalas (f15 / f19) ───────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.funcionario_nome) AS nome_exibir, c.nome AS criado_por_nome
       FROM sg_escalas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN usuarios c ON c.id = e.criado_por_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, funcionario_nome, turno, data_inicio, data_fim, tipo, observacao }) {
    if (!usuario_id && !funcionario_nome) throw new AppError('Usuário ou nome são obrigatórios', HTTP.BAD_REQUEST);
    if (!data_inicio || !data_fim)        throw new AppError('Datas são obrigatórias', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sg_escalas (usuario_id, funcionario_nome, turno, data_inicio, data_fim, tipo, observacao, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, funcionario_nome || null, turno || 'manha',
       data_inicio, data_fim, tipo || 'normal', observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[e]] = await pool.execute(`SELECT id FROM sg_escalas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM sg_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

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

module.exports = new ServicosGeraisService();
