'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class ComprasService {

  async getStats() {
    const [[{ pedidosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS pedidosPendentes FROM pedidos_compra WHERE status = 'pendente_aprovacao'`
    );
    const [[{ pedidosAprovados }]] = await pool.execute(
      `SELECT COUNT(*) AS pedidosAprovados FROM pedidos_compra WHERE status = 'aprovado'`
    );
    const [[{ solicitacoesInternas }]] = await pool.execute(
      `SELECT COUNT(*) AS solicitacoesInternas FROM solicitacoes_compra WHERE status = 'pendente'`
    );
    const [[{ fornecedoresAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS fornecedoresAtivos FROM fornecedores WHERE ativo = 1`
    );
    return { pedidosPendentes, pedidosAprovados, solicitacoesInternas, fornecedoresAtivos };
  }

  // ── Fornecedores ──────────────────────────────────────────────────────────────

  async listarFornecedores({ search, ativo } = {}) {
    const where = ['1=1']; const params = [];
    if (search) { where.push('(f.razao_social LIKE ? OR f.nome_fantasia LIKE ? OR f.cnpj_cpf LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (ativo !== undefined) { where.push('f.ativo = ?'); params.push(Number(ativo)); }
    const [rows] = await pool.execute(
      `SELECT f.* FROM fornecedores f WHERE ${where.join(' AND ')} ORDER BY f.razao_social LIMIT 200`, params
    );
    return rows;
  }

  async criarFornecedor(userId, { razao_social, nome_fantasia, cnpj_cpf, tipo, telefone, email, endereco, categoria }) {
    if (!razao_social) throw new AppError('Razão social obrigatória', HTTP.BAD_REQUEST);
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
    const [[row]] = await pool.execute(`SELECT id FROM fornecedores WHERE id = ?`, [id]);
    if (!row) throw new AppError('Fornecedor não encontrado', HTTP.NOT_FOUND);
    const allowed = ['razao_social','nome_fantasia','telefone','email','endereco','categoria','ativo'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fornecedores SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Pedidos de Compra ─────────────────────────────────────────────────────────

  async listarPedidos({ status } = {}) {
    const where = status ? 'WHERE p.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT p.*, f.razao_social AS fornecedor_nome, u.nome AS solicitante_nome, ap.nome AS aprovado_por_nome
       FROM pedidos_compra p
       LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
       LEFT JOIN usuarios u ON u.id = p.solicitante_id
       LEFT JOIN usuarios ap ON ap.id = p.aprovado_por
       ${where} ORDER BY p.data_solicitacao DESC LIMIT 200`, params
    );
    return rows;
  }

  async buscarPedido(id) {
    const [[row]] = await pool.execute(
      `SELECT p.*, f.razao_social AS fornecedor_nome FROM pedidos_compra p
       LEFT JOIN fornecedores f ON f.id = p.fornecedor_id WHERE p.id = ?`, [id]
    );
    if (!row) throw new AppError('Pedido não encontrado', HTTP.NOT_FOUND);
    const [itens] = await pool.execute(
      `SELECT i.*, pr.nome AS produto_nome FROM itens_pedido_compra i
       LEFT JOIN produtos pr ON pr.id = i.produto_id WHERE i.pedido_id = ?`, [id]
    );
    return { ...row, itens };
  }

  async criarPedido(userId, { fornecedor_id, observacao, itens }) {
    if (!itens || !itens.length) throw new AppError('Adicione ao menos um item', HTTP.BAD_REQUEST);
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM pedidos_compra`);
    const codigo = `PC-${String(Number(total) + 1).padStart(5, '0')}`;
    const valorTotal = itens.reduce((s, i) => s + (Number(i.valor_unitario || 0) * Number(i.quantidade || 0)), 0);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.execute(
        `INSERT INTO pedidos_compra (codigo, fornecedor_id, solicitante_id, status, valor_total, observacao)
         VALUES (?, ?, ?, 'rascunho', ?, ?)`,
        [codigo, fornecedor_id || null, userId, valorTotal.toFixed(2), observacao || null]
      );
      const pedidoId = res.insertId;
      for (const item of itens) {
        await conn.execute(
          `INSERT INTO itens_pedido_compra (pedido_id, produto_id, quantidade, unidade, valor_unitario, valor_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pedidoId, item.produto_id, item.quantidade, item.unidade || 'UN',
           item.valor_unitario || 0, (Number(item.valor_unitario || 0) * Number(item.quantidade)).toFixed(2)]
        );
      }
      await conn.commit();
      return { id: pedidoId, codigo };
    } catch(e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  }

  async atualizarStatusPedido(userId, id, { status, observacao }) {
    const validStatus = ['rascunho','pendente_aprovacao','aprovado','enviado','recebido','cancelado'];
    if (!status || !validStatus.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[row]] = await pool.execute(`SELECT id, status FROM pedidos_compra WHERE id = ?`, [id]);
    if (!row) throw new AppError('Pedido não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?']; const params = [status];
    if (status === 'aprovado') { sets.push('aprovado_por = ?', 'data_aprovacao = NOW()'); params.push(userId); }
    if (observacao !== undefined) { sets.push('observacao = ?'); params.push(observacao); }
    params.push(id);
    await pool.execute(`UPDATE pedidos_compra SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Cotações ──────────────────────────────────────────────────────────────────

  async listarCotacoes(pedidoId) {
    const [rows] = await pool.execute(
      `SELECT c.*, f.razao_social AS fornecedor_nome FROM com_cotacoes c
       LEFT JOIN fornecedores f ON f.id = c.fornecedor_id
       WHERE c.pedido_compra_id = ? ORDER BY c.valor_total`, [pedidoId]
    );
    return rows;
  }

  async criarCotacao(userId, pedidoId, { fornecedor_id, valor_total, prazo_entrega_dias, condicoes_pagamento, observacao }) {
    const [res] = await pool.execute(
      `INSERT INTO com_cotacoes (pedido_compra_id, fornecedor_id, valor_total, prazo_entrega_dias, condicoes_pagamento, observacao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pedidoId, fornecedor_id, valor_total || null, prazo_entrega_dias || null, condicoes_pagamento || null, observacao || null]
    );
    return { id: res.insertId };
  }

  // ── Solicitações Internas ─────────────────────────────────────────────────────

  async listarSolicitacoes({ status } = {}) {
    const where = status ? 'WHERE s.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT s.*, u.nome AS solicitante_nome, ap.nome AS aprovado_por_nome
       FROM solicitacoes_compra s
       LEFT JOIN usuarios u ON u.id = s.solicitante_id
       LEFT JOIN usuarios ap ON ap.id = s.aprovado_por
       ${where} ORDER BY s.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async gerarPedidoDeSolicitacao(userId, solicitacaoId) {
    const [[sol]] = await pool.execute(`SELECT * FROM solicitacoes_compra WHERE id = ?`, [solicitacaoId]);
    if (!sol) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    const pedido = await this.criarPedido(userId, {
      itens: [{ produto_id: null, quantidade: sol.quantidade, unidade: sol.unidade, valor_unitario: sol.valor_estimado || 0 }],
      observacao: `Gerado da solicitação #${solicitacaoId}: ${sol.item_descricao}`,
    });
    await pool.execute(`UPDATE solicitacoes_compra SET status = 'em_cotacao' WHERE id = ?`, [solicitacaoId]);
    return pedido;
  }

  // ── Recebimento ───────────────────────────────────────────────────────────────

  async receberMercadoria(userId, pedidoId) {
    const [[row]] = await pool.execute(`SELECT * FROM pedidos_compra WHERE id = ?`, [pedidoId]);
    if (!row) throw new AppError('Pedido não encontrado', HTTP.NOT_FOUND);
    if (row.status !== 'aprovado' && row.status !== 'enviado')
      throw new AppError('Pedido não está em status adequado para recebimento', HTTP.CONFLICT);
    await pool.execute(`UPDATE pedidos_compra SET status = 'recebido' WHERE id = ?`, [pedidoId]);
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir
       FROM com_escalas e LEFT JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO com_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    await pool.execute(`DELETE FROM com_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM usuarios WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async recentesPedidos() {
    const [rows] = await pool.execute(
      `SELECT p.*, f.razao_social AS fornecedor_nome FROM pedidos_compra p
       LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
       ORDER BY p.data_solicitacao DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new ComprasService();
