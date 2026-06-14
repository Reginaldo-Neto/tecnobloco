'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class VendasService {

  async getStats() {
    const [[{ pedidosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS pedidosPendentes FROM vnd_pedidos WHERE status = 'pendente'`
    );
    const [[{ pedidosHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS pedidosHoje FROM vnd_pedidos WHERE DATE(criado_em) = CURDATE()`
    );
    const [[{ clientesAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS clientesAtivos FROM clientes WHERE ativo = 1`
    );
    const [[{ faturamentoMes }]] = await pool.execute(
      `SELECT COALESCE(SUM(valor_total),0) AS faturamentoMes FROM vnd_pedidos
       WHERE status = 'faturado' AND MONTH(criado_em) = MONTH(CURDATE()) AND YEAR(criado_em) = YEAR(CURDATE())`
    );
    return { pedidosPendentes, pedidosHoje, clientesAtivos, faturamentoMes };
  }

  // ── Clientes ──────────────────────────────────────────────────────────────────

  async listarClientes({ search, ativo } = {}) {
    const where = ['1=1']; const params = [];
    if (search) {
      where.push('(c.razao_social LIKE ? OR c.nome_fantasia LIKE ? OR c.cpf_cnpj LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (ativo !== undefined) { where.push('c.ativo = ?'); params.push(Number(ativo)); }
    const [rows] = await pool.execute(
      `SELECT c.* FROM clientes c WHERE ${where.join(' AND ')} ORDER BY c.razao_social LIMIT 300`, params
    );
    return rows;
  }

  async buscarCliente(id) {
    const [[row]] = await pool.execute(`SELECT * FROM clientes WHERE id = ?`, [id]);
    if (!row) throw new AppError('Cliente não encontrado', HTTP.NOT_FOUND);
    return row;
  }

  async criarCliente(userId, { razao_social, nome_fantasia, cpf_cnpj, tipo, telefone, email, endereco }) {
    if (!razao_social) throw new AppError('Razão social / nome obrigatório', HTTP.BAD_REQUEST);
    if (cpf_cnpj) {
      const [[ex]] = await pool.execute(`SELECT id FROM clientes WHERE cpf_cnpj = ?`, [cpf_cnpj]);
      if (ex) throw new AppError('CPF/CNPJ já cadastrado', HTTP.CONFLICT);
    }
    const [res] = await pool.execute(
      `INSERT INTO clientes (razao_social, nome_fantasia, cpf_cnpj, tipo, telefone, email, endereco)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [razao_social, nome_fantasia || null, cpf_cnpj || null, tipo || 'PJ',
       telefone || null, email || null, endereco || null]
    );
    return { id: res.insertId };
  }

  async atualizarCliente(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM clientes WHERE id = ?`, [id]);
    if (!row) throw new AppError('Cliente não encontrado', HTTP.NOT_FOUND);
    const allowed = ['razao_social', 'nome_fantasia', 'telefone', 'email', 'endereco', 'ativo'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE clientes SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Pedidos de Venda ──────────────────────────────────────────────────────────

  async listarPedidos({ status, cliente_id } = {}) {
    const where = ['1=1']; const params = [];
    if (status)     { where.push('p.status = ?');     params.push(status); }
    if (cliente_id) { where.push('p.cliente_id = ?'); params.push(cliente_id); }
    const [rows] = await pool.execute(
      `SELECT p.*, c.razao_social AS cliente_nome, u.nome AS vendedor_nome
       FROM vnd_pedidos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       LEFT JOIN usuarios u ON u.id = p.vendedor_id
       WHERE ${where.join(' AND ')} ORDER BY p.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async buscarPedido(id) {
    const [[row]] = await pool.execute(
      `SELECT p.*, c.razao_social AS cliente_nome, u.nome AS vendedor_nome
       FROM vnd_pedidos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       LEFT JOIN usuarios u ON u.id = p.vendedor_id
       WHERE p.id = ?`, [id]
    );
    if (!row) throw new AppError('Pedido não encontrado', HTTP.NOT_FOUND);
    const [itens] = await pool.execute(
      `SELECT i.*, pr.nome AS produto_nome FROM vnd_pedidos_itens i
       LEFT JOIN produtos pr ON pr.id = i.produto_id WHERE i.pedido_id = ?`, [id]
    );
    return { ...row, itens };
  }

  async criarPedido(userId, { cliente_id, data_entrega_prevista, observacao, itens }) {
    if (!itens || !itens.length) throw new AppError('Adicione ao menos um item', HTTP.BAD_REQUEST);
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM vnd_pedidos`);
    const codigo = `PV-${String(Number(total) + 1).padStart(5, '0')}`;
    const valorTotal = itens.reduce((s, i) => s + (Number(i.valor_unitario || 0) * Number(i.quantidade || 0)), 0);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.execute(
        `INSERT INTO vnd_pedidos (codigo, cliente_id, vendedor_id, status, valor_total, data_entrega_prevista, observacao)
         VALUES (?, ?, ?, 'rascunho', ?, ?, ?)`,
        [codigo, cliente_id || null, userId, valorTotal.toFixed(2), data_entrega_prevista || null, observacao || null]
      );
      const pedidoId = res.insertId;
      for (const item of itens) {
        await conn.execute(
          `INSERT INTO vnd_pedidos_itens (pedido_id, produto_id, descricao, quantidade, unidade, valor_unitario, valor_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [pedidoId, item.produto_id || null, item.descricao || null, item.quantidade,
           item.unidade || 'UN', item.valor_unitario || 0,
           (Number(item.valor_unitario || 0) * Number(item.quantidade)).toFixed(2)]
        );
      }
      await conn.commit();
      return { id: pedidoId, codigo };
    } catch(e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  }

  async atualizarStatusPedido(userId, id, { status, observacao }) {
    const validStatus = ['rascunho','pendente','aprovado','em_separacao','expedido','faturado','cancelado'];
    if (!status || !validStatus.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[row]] = await pool.execute(`SELECT id FROM vnd_pedidos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Pedido não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?']; const params = [status];
    if (observacao !== undefined) { sets.push('observacao = ?'); params.push(observacao); }
    params.push(id);
    await pool.execute(`UPDATE vnd_pedidos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir
       FROM vnd_escalas e LEFT JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO vnd_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    await pool.execute(`DELETE FROM vnd_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarProdutos() {
    const [rows] = await pool.execute(`SELECT id, nome, unidade FROM produtos WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM usuarios WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async recentesPedidos() {
    const [rows] = await pool.execute(
      `SELECT p.*, c.razao_social AS cliente_nome FROM vnd_pedidos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       ORDER BY p.criado_em DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new VendasService();
