'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class FinanceiroService {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ contasPagarPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS contasPagarPendentes FROM contas_pagar WHERE status = 'pendente'`
    );
    const [[{ contasPagarVencidas }]] = await pool.execute(
      `SELECT COUNT(*) AS contasPagarVencidas FROM contas_pagar
       WHERE status = 'vencido' OR (status = 'pendente' AND data_vencimento < CURDATE())`
    );
    const [[{ contasReceberPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS contasReceberPendentes FROM contas_receber WHERE status = 'pendente'`
    );
    const [[{ adiantamentosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS adiantamentosPendentes FROM adiantamentos WHERE status = 'pendente'`
    );
    const [[{ totalPagarMes }]] = await pool.execute(
      `SELECT COALESCE(SUM(valor), 0) AS totalPagarMes FROM contas_pagar
       WHERE status = 'pendente'
         AND MONTH(data_vencimento) = MONTH(CURDATE())
         AND YEAR(data_vencimento)  = YEAR(CURDATE())`
    );
    return { contasPagarPendentes, contasPagarVencidas, contasReceberPendentes, adiantamentosPendentes, totalPagarMes };
  }

  // ── Contas a Pagar ────────────────────────────────────────────────────────────

  async listarContasPagar({ status, fornecedor_id, data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (status)        { where.push('cp.status = ?');               params.push(status); }
    if (fornecedor_id) { where.push('cp.fornecedor_id = ?');        params.push(fornecedor_id); }
    if (data_inicio)   { where.push('cp.data_vencimento >= ?');     params.push(data_inicio); }
    if (data_fim)      { where.push('cp.data_vencimento <= ?');     params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT cp.*,
              f.razao_social AS fornecedor_nome,
              pc.descricao AS conta_nome,
              u.nome AS criado_por_nome
       FROM contas_pagar cp
       LEFT JOIN fornecedores f  ON f.id  = cp.fornecedor_id
       LEFT JOIN plano_contas pc ON pc.id = cp.conta_id
       LEFT JOIN usuarios u      ON u.id  = cp.criado_por
       ${cond}
       ORDER BY cp.data_vencimento ASC
       LIMIT 300`,
      params
    );
    return rows;
  }

  async criarContaPagar(userId, { descricao, fornecedor_id, conta_id, valor, data_vencimento, observacao, comprovante_url }) {
    if (!descricao)       throw new AppError('Descrição é obrigatória', HTTP.BAD_REQUEST);
    if (!valor || valor <= 0) throw new AppError('Valor inválido', HTTP.BAD_REQUEST);
    if (!data_vencimento) throw new AppError('Data de vencimento é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO contas_pagar (descricao, fornecedor_id, conta_id, valor, data_vencimento, status, comprovante_url, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, 'pendente', ?, ?, ?)`,
      [descricao, fornecedor_id || null, conta_id || null, valor, data_vencimento,
       comprovante_url || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarContaPagar(id, data) {
    const [[cp]] = await pool.execute(`SELECT id FROM contas_pagar WHERE id = ?`, [id]);
    if (!cp) throw new AppError('Conta a pagar não encontrada', HTTP.NOT_FOUND);
    const allowed = ['descricao','fornecedor_id','conta_id','valor','data_vencimento',
                     'data_pagamento','status','comprovante_url','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE contas_pagar SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async cancelarContaPagar(id) {
    const [[cp]] = await pool.execute(`SELECT id, status FROM contas_pagar WHERE id = ?`, [id]);
    if (!cp) throw new AppError('Conta a pagar não encontrada', HTTP.NOT_FOUND);
    if (cp.status === 'pago') throw new AppError('Conta já paga não pode ser cancelada', HTTP.CONFLICT);
    await pool.execute(`UPDATE contas_pagar SET status = 'cancelado' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Contas a Receber ──────────────────────────────────────────────────────────

  async listarContasReceber({ status, data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (status)      { where.push('cr.status = ?');               params.push(status); }
    if (data_inicio) { where.push('cr.data_vencimento >= ?');     params.push(data_inicio); }
    if (data_fim)    { where.push('cr.data_vencimento <= ?');     params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT cr.*,
              pc.descricao AS conta_nome,
              u.nome AS criado_por_nome
       FROM contas_receber cr
       LEFT JOIN plano_contas pc ON pc.id = cr.conta_id
       LEFT JOIN usuarios u      ON u.id  = cr.criado_por
       ${cond}
       ORDER BY cr.data_vencimento ASC
       LIMIT 300`,
      params
    );
    return rows;
  }

  async criarContaReceber(userId, { descricao, cliente_nome, cliente_doc, conta_id, valor, data_vencimento, observacao }) {
    if (!descricao)       throw new AppError('Descrição é obrigatória', HTTP.BAD_REQUEST);
    if (!valor || valor <= 0) throw new AppError('Valor inválido', HTTP.BAD_REQUEST);
    if (!data_vencimento) throw new AppError('Data de vencimento é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO contas_receber (descricao, cliente_nome, cliente_doc, conta_id, valor, data_vencimento, status, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, ?)`,
      [descricao, cliente_nome || null, cliente_doc || null, conta_id || null,
       valor, data_vencimento, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarContaReceber(id, data) {
    const [[cr]] = await pool.execute(`SELECT id FROM contas_receber WHERE id = ?`, [id]);
    if (!cr) throw new AppError('Conta a receber não encontrada', HTTP.NOT_FOUND);
    const allowed = ['descricao','cliente_nome','cliente_doc','conta_id','valor',
                     'data_vencimento','data_recebimento','status','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE contas_receber SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Fornecedores ──────────────────────────────────────────────────────────────

  async listarFornecedores({ ativo, categoria } = {}) {
    const where = [];
    const params = [];
    if (ativo !== undefined) { where.push('f.ativo = ?'); params.push(ativo); }
    if (categoria)           { where.push('f.categoria = ?'); params.push(categoria); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : 'WHERE f.ativo = 1';
    const [rows] = await pool.execute(
      `SELECT f.* FROM fornecedores f ${cond} ORDER BY f.razao_social ASC LIMIT 200`,
      params
    );
    return rows;
  }

  async criarFornecedor(userId, { razao_social, nome_fantasia, cnpj_cpf, tipo, telefone, email, endereco, categoria }) {
    if (!razao_social) throw new AppError('Razão social é obrigatória', HTTP.BAD_REQUEST);
    if (cnpj_cpf) {
      const [[ex]] = await pool.execute(`SELECT id FROM fornecedores WHERE cnpj_cpf = ?`, [cnpj_cpf]);
      if (ex) throw new AppError('CNPJ/CPF já cadastrado', HTTP.CONFLICT);
    }
    const [res] = await pool.execute(
      `INSERT INTO fornecedores (razao_social, nome_fantasia, cnpj_cpf, tipo, telefone, email, endereco, categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [razao_social, nome_fantasia || null, cnpj_cpf || null, tipo || 'PJ',
       telefone || null, email || null, endereco || null, categoria || null]
    );
    return { id: res.insertId };
  }

  async atualizarFornecedor(id, data) {
    const [[f]] = await pool.execute(`SELECT id FROM fornecedores WHERE id = ?`, [id]);
    if (!f) throw new AppError('Fornecedor não encontrado', HTTP.NOT_FOUND);
    const allowed = ['razao_social','nome_fantasia','cnpj_cpf','tipo','telefone','email','endereco','categoria','ativo'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fornecedores SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Plano de Contas ───────────────────────────────────────────────────────────

  async listarPlanoContas({ tipo, ativo } = {}) {
    const where = [];
    const params = [];
    if (tipo)            { where.push('pc.tipo = ?');   params.push(tipo); }
    if (ativo !== undefined) { where.push('pc.ativo = ?'); params.push(ativo); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : 'WHERE pc.ativo = 1';
    const [rows] = await pool.execute(
      `SELECT pc.*, p.descricao AS pai_nome
       FROM plano_contas pc
       LEFT JOIN plano_contas p ON p.id = pc.pai_id
       ${cond}
       ORDER BY pc.codigo ASC`,
      params
    );
    return rows;
  }

  async criarConta(userId, { codigo, descricao, tipo, pai_id, nivel }) {
    if (!codigo)    throw new AppError('Código é obrigatório', HTTP.BAD_REQUEST);
    if (!descricao) throw new AppError('Descrição é obrigatória', HTTP.BAD_REQUEST);
    if (!tipo)      throw new AppError('Tipo é obrigatório', HTTP.BAD_REQUEST);
    const [[ex]] = await pool.execute(`SELECT id FROM plano_contas WHERE codigo = ?`, [codigo]);
    if (ex) throw new AppError('Código já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO plano_contas (codigo, descricao, tipo, pai_id, nivel) VALUES (?, ?, ?, ?, ?)`,
      [codigo, descricao, tipo, pai_id || null, nivel || 1]
    );
    return { id: res.insertId };
  }

  async atualizarConta(id, data) {
    const [[c]] = await pool.execute(`SELECT id FROM plano_contas WHERE id = ?`, [id]);
    if (!c) throw new AppError('Conta não encontrada', HTTP.NOT_FOUND);
    const allowed = ['descricao','tipo','pai_id','nivel','ativo'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE plano_contas SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Fluxo de Caixa ────────────────────────────────────────────────────────────

  async getFluxoCaixa({ dias = 30 } = {}) {
    const d = Math.max(1, Math.min(365, Number(dias)));
    const [pagar] = await pool.execute(
      `SELECT DATE(data_vencimento) AS data, SUM(valor) AS total
       FROM contas_pagar
       WHERE status = 'pendente' AND data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(data_vencimento)
       ORDER BY data ASC`,
      [d]
    );
    const [receber] = await pool.execute(
      `SELECT DATE(data_vencimento) AS data, SUM(valor) AS total
       FROM contas_receber
       WHERE status = 'pendente' AND data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(data_vencimento)
       ORDER BY data ASC`,
      [d]
    );
    return { pagar, receber };
  }

  // ── Movimentos Bancários (Conciliação) ────────────────────────────────────────

  async listarMovimentos({ conciliado, data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (conciliado !== undefined) { where.push('m.conciliado = ?');      params.push(conciliado); }
    if (data_inicio)              { where.push('m.data_movimento >= ?'); params.push(data_inicio); }
    if (data_fim)                 { where.push('m.data_movimento <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT m.*, pc.descricao AS conta_nome, u.nome AS criado_por_nome
       FROM fin_movimentos_bancarios m
       LEFT JOIN plano_contas pc ON pc.id = m.conta_id
       LEFT JOIN usuarios u      ON u.id  = m.criado_por
       ${cond}
       ORDER BY m.data_movimento DESC
       LIMIT 300`,
      params
    );
    return rows;
  }

  async criarMovimento(userId, { descricao, tipo, valor, data_movimento, conta_id, referencia }) {
    if (!descricao)      throw new AppError('Descrição é obrigatória', HTTP.BAD_REQUEST);
    if (!tipo)           throw new AppError('Tipo é obrigatório', HTTP.BAD_REQUEST);
    if (!valor || valor <= 0) throw new AppError('Valor inválido', HTTP.BAD_REQUEST);
    if (!data_movimento) throw new AppError('Data é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fin_movimentos_bancarios (descricao, tipo, valor, data_movimento, conta_id, referencia, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [descricao, tipo, valor, data_movimento, conta_id || null, referencia || null, userId]
    );
    return { id: res.insertId };
  }

  async conciliarMovimento(id) {
    const [[m]] = await pool.execute(`SELECT id FROM fin_movimentos_bancarios WHERE id = ?`, [id]);
    if (!m) throw new AppError('Movimento não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE fin_movimentos_bancarios SET conciliado = 1 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Adiantamentos ─────────────────────────────────────────────────────────────

  async listarAdiantamentos({ status } = {}) {
    const where = status ? 'WHERE a.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome, ap.nome AS aprovado_por_nome
       FROM adiantamentos a
       LEFT JOIN usuarios u  ON u.id  = a.usuario_id
       LEFT JOIN usuarios ap ON ap.id = a.aprovado_por
       ${where}
       ORDER BY a.criado_em DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async atualizarAdiantamento(userId, id, { status, observacao }) {
    const valid = ['pendente','aprovado','rejeitado','pago','cancelado'];
    if (!status || !valid.includes(status))
      throw new AppError(`Status inválido. Aceitos: ${valid.join(', ')}`, HTTP.BAD_REQUEST);
    const [[a]] = await pool.execute(`SELECT id FROM adiantamentos WHERE id = ?`, [id]);
    if (!a) throw new AppError('Adiantamento não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?', 'aprovado_por = ?'];
    const params = [status, userId];
    if (observacao !== undefined) { sets.push('observacao = ?'); params.push(observacao); }
    params.push(id);
    await pool.execute(`UPDATE adiantamentos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Centros de Custo ──────────────────────────────────────────────────────────

  async listarCentrosCusto({ ativo } = {}) {
    const cond = ativo !== undefined ? 'WHERE cc.ativo = ?' : 'WHERE cc.ativo = 1';
    const params = ativo !== undefined ? [ativo] : [];
    const [rows] = await pool.execute(
      `SELECT cc.*, d.nome AS departamento_nome
       FROM fin_centros_custo cc
       LEFT JOIN departamentos d ON d.id = cc.departamento_id
       ${cond}
       ORDER BY cc.codigo ASC`,
      params
    );
    return rows;
  }

  async criarCentroCusto(userId, { codigo, nome, departamento_id }) {
    if (!codigo) throw new AppError('Código é obrigatório', HTTP.BAD_REQUEST);
    if (!nome)   throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    const [[ex]] = await pool.execute(`SELECT id FROM fin_centros_custo WHERE codigo = ?`, [codigo]);
    if (ex) throw new AppError('Código já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO fin_centros_custo (codigo, nome, departamento_id) VALUES (?, ?, ?)`,
      [codigo, nome, departamento_id || null]
    );
    return { id: res.insertId };
  }

  async atualizarCentroCusto(id, data) {
    const [[cc]] = await pool.execute(`SELECT id FROM fin_centros_custo WHERE id = ?`, [id]);
    if (!cc) throw new AppError('Centro de custo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['codigo','nome','departamento_id','ativo'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fin_centros_custo SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir, c.nome AS criado_por_nome
       FROM fin_escalas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN usuarios c ON c.id = e.criado_por
       ORDER BY e.data_inicio DESC
       LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!usuario_id && !nome_externo) throw new AppError('Usuário ou nome externo são obrigatórios', HTTP.BAD_REQUEST);
    if (!data_inicio)                 throw new AppError('Data de início é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fin_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno || 'manha',
       data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[e]] = await pool.execute(`SELECT id FROM fin_escalas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM fin_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects auxiliares ────────────────────────────────────────────────────────

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1
       ORDER BY u.nome ASC`
    );
    return rows;
  }

  async listarDepartamentos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM departamentos ORDER BY nome ASC`);
    return rows;
  }

  // ── Últimas transações (dashboard) ───────────────────────────────────────────

  async listarUltimasTransacoes() {
    const [pagar] = await pool.execute(
      `SELECT cp.id, cp.descricao, cp.valor, cp.data_vencimento AS data, cp.status,
              'pagar' AS tipo, f.razao_social AS parte, cp.criado_em
       FROM contas_pagar cp
       LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
       ORDER BY cp.criado_em DESC
       LIMIT 10`
    );
    const [receber] = await pool.execute(
      `SELECT cr.id, cr.descricao, cr.valor, cr.data_vencimento AS data, cr.status,
              'receber' AS tipo, cr.cliente_nome AS parte, cr.criado_em
       FROM contas_receber cr
       ORDER BY cr.criado_em DESC
       LIMIT 10`
    );
    const combined = [...pagar, ...receber]
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
      .slice(0, 15);
    return combined;
  }
}

module.exports = new FinanceiroService();
