'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class EstoqueService {

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ produtosAbaixoMinimo }]] = await pool.execute(
      `SELECT COUNT(*) AS produtosAbaixoMinimo FROM produtos WHERE ativo=1 AND estoque_atual <= estoque_minimo`
    );
    const [[{ lotesBloqueados }]] = await pool.execute(
      `SELECT COUNT(*) AS lotesBloqueados FROM est_bloqueios_lote WHERE status='bloqueado'`
    );
    const [[{ inventariosAbertos }]] = await pool.execute(
      `SELECT COUNT(*) AS inventariosAbertos FROM est_inventarios WHERE status='em_andamento'`
    );
    const [[{ movimentacoesHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS movimentacoesHoje FROM movimentacoes_estoque WHERE DATE(criado_em)=CURDATE()`
    );
    const [[{ totalProdutos }]] = await pool.execute(
      `SELECT COUNT(*) AS totalProdutos FROM produtos WHERE ativo=1`
    );
    const [[{ proximosVencer }]] = await pool.execute(
      `SELECT COUNT(*) AS proximosVencer FROM movimentacoes_estoque
       WHERE validade IS NOT NULL AND validade <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         AND validade >= CURDATE() AND tipo = 'entrada'`
    );
    return { produtosAbaixoMinimo, lotesBloqueados, inventariosAbertos, movimentacoesHoje, totalProdutos, proximosVencer };
  }

  // ── Produtos ──────────────────────────────────────────────────────────────────

  async listarProdutos({ search, categoria_id, abaixo_minimo } = {}) {
    const where = ['p.ativo = 1'];
    const params = [];
    if (search) {
      where.push('(p.nome LIKE ? OR p.codigo LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoria_id) { where.push('p.categoria_id = ?'); params.push(categoria_id); }
    if (abaixo_minimo === '1') { where.push('p.estoque_atual <= p.estoque_minimo'); }
    const [rows] = await pool.execute(
      `SELECT p.*, c.nome AS categoria_nome, c.tipo AS categoria_tipo
       FROM produtos p
       LEFT JOIN categorias_produto c ON c.id = p.categoria_id
       WHERE ${where.join(' AND ')}
       ORDER BY p.nome ASC LIMIT 500`,
      params
    );
    return rows;
  }

  async buscarProduto(id) {
    const [[p]] = await pool.execute(
      `SELECT p.*, c.nome AS categoria_nome, c.tipo AS categoria_tipo
       FROM produtos p
       LEFT JOIN categorias_produto c ON c.id = p.categoria_id
       WHERE p.id = ? AND p.ativo = 1`,
      [id]
    );
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    return p;
  }

  async criarProduto(userId, { codigo, nome, categoria_id, unidade_medida, estoque_atual, estoque_minimo, estoque_maximo, custo_unitario, localizacao }) {
    if (!nome) throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    if (!codigo) {
      const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM produtos`);
      codigo = `PROD-${String(Number(total) + 1).padStart(5, '0')}`;
    }
    const [[ex]] = await pool.execute(`SELECT id FROM produtos WHERE codigo = ?`, [codigo]);
    if (ex) throw new AppError('Código já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO produtos (codigo, nome, categoria_id, unidade_medida, estoque_atual, estoque_minimo, estoque_maximo, custo_unitario, localizacao, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [codigo, nome, categoria_id || null, unidade_medida || 'un',
       estoque_atual || 0, estoque_minimo || 0, estoque_maximo || 0,
       custo_unitario || 0, localizacao || null]
    );
    return { id: res.insertId, codigo };
  }

  async atualizarProduto(id, data) {
    const [[p]] = await pool.execute(`SELECT id FROM produtos WHERE id = ? AND ativo = 1`, [id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome','categoria_id','unidade_medida','estoque_minimo','estoque_maximo','custo_unitario','localizacao'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE produtos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async desativarProduto(id) {
    const [[p]] = await pool.execute(`SELECT id FROM produtos WHERE id = ?`, [id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE produtos SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Movimentações ─────────────────────────────────────────────────────────────

  async listarMovimentacoes({ produto_id, tipo, data_inicio, data_fim, limit } = {}) {
    const where = [];
    const params = [];
    if (produto_id) { where.push('m.produto_id = ?'); params.push(produto_id); }
    if (tipo)       { where.push('m.tipo = ?');       params.push(tipo); }
    if (data_inicio){ where.push('DATE(m.criado_em) >= ?'); params.push(data_inicio); }
    if (data_fim)   { where.push('DATE(m.criado_em) <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const lim  = Math.min(Number(limit) || 200, 500);
    const [rows] = await pool.execute(
      `SELECT m.*, p.nome AS produto_nome, p.codigo AS produto_codigo, p.unidade_medida,
              u.nome AS usuario_nome
       FROM movimentacoes_estoque m
       LEFT JOIN produtos p ON p.id = m.produto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ${cond}
       ORDER BY m.criado_em DESC LIMIT ${lim}`,
      params
    );
    return rows;
  }

  async registrarMovimentacao(userId, { produto_id, tipo, quantidade, custo_unitario, lote, validade, referencia_modulo, referencia_id, observacao }) {
    if (!produto_id || !tipo || !quantidade) throw new AppError('produto_id, tipo e quantidade são obrigatórios', HTTP.BAD_REQUEST);
    const tiposValidos = ['entrada','saida','ajuste','transferencia','perda'];
    if (!tiposValidos.includes(tipo)) throw new AppError('Tipo de movimentação inválido', HTTP.BAD_REQUEST);
    const [[p]] = await pool.execute(`SELECT id, estoque_atual FROM produtos WHERE id = ? AND ativo = 1`, [produto_id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    const qty = Number(quantidade);
    if (isNaN(qty) || qty === 0) throw new AppError('Quantidade inválida', HTTP.BAD_REQUEST);
    // Para saida/perda: a quantidade entra negativa no ajuste de estoque
    const delta = ['saida','perda'].includes(tipo) ? -Math.abs(qty) : Math.abs(qty);
    if (['saida','perda'].includes(tipo) && p.estoque_atual + delta < 0) {
      throw new AppError('Estoque insuficiente', HTTP.CONFLICT);
    }
    const [res] = await pool.execute(
      `INSERT INTO movimentacoes_estoque
         (produto_id, tipo, quantidade, custo_unitario, lote, validade, referencia_modulo, referencia_id, observacao, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [produto_id, tipo, Math.abs(qty), custo_unitario || null, lote || null,
       validade || null, referencia_modulo || null, referencia_id || null,
       observacao || null, userId]
    );
    await pool.execute(`UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE id = ?`, [delta, produto_id]);
    return { id: res.insertId };
  }

  // ── Endereçamento ─────────────────────────────────────────────────────────────

  async atualizarLocalizacao(userId, produto_id, localizacao) {
    const [[p]] = await pool.execute(`SELECT id FROM produtos WHERE id = ? AND ativo = 1`, [produto_id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE produtos SET localizacao = ? WHERE id = ?`, [localizacao, produto_id]);
    return { ok: true };
  }

  // ── Min/Max ───────────────────────────────────────────────────────────────────

  async atualizarMinMax(userId, produto_id, { estoque_minimo, estoque_maximo }) {
    const [[p]] = await pool.execute(`SELECT id FROM produtos WHERE id = ? AND ativo = 1`, [produto_id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    if (estoque_minimo === undefined && estoque_maximo === undefined) return { ok: true };
    const sets = []; const params = [];
    if (estoque_minimo !== undefined) { sets.push('estoque_minimo = ?'); params.push(estoque_minimo); }
    if (estoque_maximo !== undefined) { sets.push('estoque_maximo = ?'); params.push(estoque_maximo); }
    params.push(produto_id);
    await pool.execute(`UPDATE produtos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Controle de Validade ─────────────────────────────────────────────────────

  async listarControleValidade({ dias_alerta } = {}) {
    const dias = Number(dias_alerta) || 30;
    const [rows] = await pool.execute(
      `SELECT m.*, p.nome AS produto_nome, p.codigo AS produto_codigo, p.unidade_medida
       FROM movimentacoes_estoque m
       LEFT JOIN produtos p ON p.id = m.produto_id
       WHERE m.validade IS NOT NULL AND m.validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND m.tipo = 'entrada'
       ORDER BY m.validade ASC LIMIT 200`,
      [dias]
    );
    return rows;
  }

  // ── Bloqueio de Lote ─────────────────────────────────────────────────────────

  async listarBloqueiosLote({ status } = {}) {
    const where = status ? 'WHERE b.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT b.*, p.nome AS produto_nome, p.codigo AS produto_codigo,
              ub.nome AS bloqueado_por_nome, ul.nome AS liberado_por_nome
       FROM est_bloqueios_lote b
       LEFT JOIN produtos p ON p.id = b.produto_id
       LEFT JOIN usuarios ub ON ub.id = b.bloqueado_por
       LEFT JOIN usuarios ul ON ul.id = b.liberado_por
       ${where}
       ORDER BY b.data_bloqueio DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async bloquearLote(userId, { produto_id, lote, motivo }) {
    if (!produto_id || !lote || !motivo) throw new AppError('produto_id, lote e motivo são obrigatórios', HTTP.BAD_REQUEST);
    const [[p]] = await pool.execute(`SELECT id FROM produtos WHERE id = ? AND ativo = 1`, [produto_id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    const [res] = await pool.execute(
      `INSERT INTO est_bloqueios_lote (produto_id, lote, motivo, bloqueado_por) VALUES (?, ?, ?, ?)`,
      [produto_id, lote, motivo, userId]
    );
    return { id: res.insertId };
  }

  async atualizarBloqueioLote(userId, id, { status, motivo }) {
    const validos = ['bloqueado','liberado','descartado'];
    if (!status || !validos.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[b]] = await pool.execute(`SELECT id FROM est_bloqueios_lote WHERE id = ?`, [id]);
    if (!b) throw new AppError('Bloqueio não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (status !== 'bloqueado') {
      sets.push('liberado_por = ?', 'data_liberacao = NOW()');
      params.push(userId);
    }
    if (motivo !== undefined) { sets.push('motivo = ?'); params.push(motivo); }
    params.push(id);
    await pool.execute(`UPDATE est_bloqueios_lote SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Inventário Cíclico ───────────────────────────────────────────────────────

  async listarInventarios({ status } = {}) {
    const where = status ? 'WHERE i.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT i.*, u.nome AS responsavel_nome,
              (SELECT COUNT(*) FROM est_inventarios_itens ii WHERE ii.inventario_id = i.id) AS total_itens,
              (SELECT COUNT(*) FROM est_inventarios_itens ii WHERE ii.inventario_id = i.id AND ii.quantidade_contada IS NOT NULL) AS itens_contados
       FROM est_inventarios i
       LEFT JOIN usuarios u ON u.id = i.responsavel_id
       ${where}
       ORDER BY i.criado_em DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarInventario(userId, { codigo, descricao, data_inicio, responsavel_id }) {
    if (!data_inicio) throw new AppError('data_inicio é obrigatória', HTTP.BAD_REQUEST);
    if (!codigo) {
      const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM est_inventarios`);
      codigo = `INV-${String(Number(total) + 1).padStart(5, '0')}`;
    }
    const [[ex]] = await pool.execute(`SELECT id FROM est_inventarios WHERE codigo = ?`, [codigo]);
    if (ex) throw new AppError('Código de inventário já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO est_inventarios (codigo, descricao, data_inicio, responsavel_id) VALUES (?, ?, ?, ?)`,
      [codigo, descricao || null, data_inicio, responsavel_id || userId]
    );
    return { id: res.insertId, codigo };
  }

  async listarItensInventario(inventario_id) {
    const [[inv]] = await pool.execute(`SELECT id FROM est_inventarios WHERE id = ?`, [inventario_id]);
    if (!inv) throw new AppError('Inventário não encontrado', HTTP.NOT_FOUND);
    const [rows] = await pool.execute(
      `SELECT ii.*, p.nome AS produto_nome, p.codigo AS produto_codigo, p.unidade_medida,
              u.nome AS usuario_nome
       FROM est_inventarios_itens ii
       LEFT JOIN produtos p ON p.id = ii.produto_id
       LEFT JOIN usuarios u ON u.id = ii.usuario_id
       WHERE ii.inventario_id = ?
       ORDER BY p.nome ASC`,
      [inventario_id]
    );
    return rows;
  }

  async adicionarItemInventario(userId, inventario_id, { produto_id, observacao }) {
    if (!produto_id) throw new AppError('produto_id é obrigatório', HTTP.BAD_REQUEST);
    const [[inv]] = await pool.execute(`SELECT id, status FROM est_inventarios WHERE id = ?`, [inventario_id]);
    if (!inv) throw new AppError('Inventário não encontrado', HTTP.NOT_FOUND);
    if (inv.status !== 'em_andamento') throw new AppError('Inventário não está em andamento', HTTP.CONFLICT);
    const [[p]] = await pool.execute(`SELECT id, estoque_atual FROM produtos WHERE id = ? AND ativo = 1`, [produto_id]);
    if (!p) throw new AppError('Produto não encontrado', HTTP.NOT_FOUND);
    const [res] = await pool.execute(
      `INSERT INTO est_inventarios_itens (inventario_id, produto_id, quantidade_sistema, usuario_id, observacao)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantidade_sistema = VALUES(quantidade_sistema), usuario_id = VALUES(usuario_id)`,
      [inventario_id, produto_id, p.estoque_atual, userId, observacao || null]
    );
    return { id: res.insertId };
  }

  async contarItemInventario(userId, inventario_id, item_id, { quantidade_contada, observacao }) {
    if (quantidade_contada === undefined || quantidade_contada === null) throw new AppError('quantidade_contada é obrigatória', HTTP.BAD_REQUEST);
    const [[item]] = await pool.execute(
      `SELECT ii.id FROM est_inventarios_itens ii
       JOIN est_inventarios i ON i.id = ii.inventario_id
       WHERE ii.id = ? AND ii.inventario_id = ? AND i.status = 'em_andamento'`,
      [item_id, inventario_id]
    );
    if (!item) throw new AppError('Item não encontrado ou inventário não está em andamento', HTTP.NOT_FOUND);
    const sets = ['quantidade_contada = ?', 'usuario_id = ?'];
    const params = [quantidade_contada, userId];
    if (observacao !== undefined) { sets.push('observacao = ?'); params.push(observacao); }
    params.push(item_id);
    await pool.execute(`UPDATE est_inventarios_itens SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async concluirInventario(userId, inventario_id) {
    const [[inv]] = await pool.execute(`SELECT id, status FROM est_inventarios WHERE id = ?`, [inventario_id]);
    if (!inv) throw new AppError('Inventário não encontrado', HTTP.NOT_FOUND);
    if (inv.status !== 'em_andamento') throw new AppError('Inventário não está em andamento', HTTP.CONFLICT);
    await pool.execute(
      `UPDATE est_inventarios SET status='concluido', data_conclusao=CURDATE() WHERE id = ?`,
      [inventario_id]
    );
    return { ok: true };
  }

  // ── Curva ABC ─────────────────────────────────────────────────────────────────

  async calcularCurvaABC() {
    const [rows] = await pool.execute(
      `SELECT p.id, p.codigo, p.nome, p.unidade_medida, p.custo_unitario,
              p.estoque_atual,
              COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.quantidade ELSE 0 END), 0) AS total_saida,
              COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.quantidade * COALESCE(m.custo_unitario, p.custo_unitario, 0) ELSE 0 END), 0) AS valor_consumo
       FROM produtos p
       LEFT JOIN movimentacoes_estoque m ON m.produto_id = p.id
         AND DATE(m.criado_em) >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
       WHERE p.ativo = 1
       GROUP BY p.id, p.codigo, p.nome, p.unidade_medida, p.custo_unitario, p.estoque_atual
       ORDER BY valor_consumo DESC`
    );
    const totalValor = rows.reduce((s, r) => s + Number(r.valor_consumo), 0);
    let acumulado = 0;
    return rows.map(r => {
      acumulado += Number(r.valor_consumo);
      const pct = totalValor > 0 ? (acumulado / totalValor) * 100 : 0;
      const classe = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
      return { ...r, pct_acumulado: pct.toFixed(2), classe };
    });
  }

  // ── Solicitações de Compra (lado Estoque) ────────────────────────────────────

  async listarSolicitacoes({ status } = {}) {
    const where = status ? 'WHERE s.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT s.*, u.nome AS solicitante_nome, ap.nome AS aprovado_por_nome
       FROM solicitacoes_compra s
       LEFT JOIN usuarios u ON u.id = s.solicitante_id
       LEFT JOIN usuarios ap ON ap.id = s.aprovado_por
       ${where}
       ORDER BY FIELD(s.urgencia,'urgente','alta','media','baixa'),
                FIELD(s.status,'pendente','aprovada','em_cotacao','concluida','rejeitada','cancelada'),
                s.criado_em DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async atualizarSolicitacao(userId, id, { status, observacao }) {
    const validos = ['pendente','aprovada','em_cotacao','concluida','rejeitada','cancelada'];
    if (!status || !validos.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    const [[s]] = await pool.execute(`SELECT id FROM solicitacoes_compra WHERE id = ?`, [id]);
    if (!s) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    const sets = ['status = ?', 'aprovado_por = ?'];
    const params = [status, userId];
    if (observacao !== undefined) { sets.push('observacao = ?'); params.push(observacao); }
    params.push(id);
    await pool.execute(`UPDATE solicitacoes_compra SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Separação de Pedidos ─────────────────────────────────────────────────────

  async listarOrdensSeparacao() {
    const [rows] = await pool.execute(
      `SELECT o.id, o.codigo, o.quantidade_planejada, o.status,
              p.nome AS produto_nome, p.codigo AS produto_codigo, p.unidade_medida,
              p.estoque_atual, p.localizacao
       FROM ordens_producao o
       LEFT JOIN produtos p ON p.id = o.produto_id
       WHERE o.status NOT IN ('cancelada','concluida')
       ORDER BY o.id DESC LIMIT 100`
    );
    return rows;
  }

  // ── Conferência de Expedição ──────────────────────────────────────────────────

  async listarPedidosExpedicao() {
    const [rows] = await pool.execute(
      `SELECT pc.*, f.razao_social AS fornecedor_nome, u.nome AS solicitante_nome
       FROM pedidos_compra pc
       LEFT JOIN fornecedores f ON f.id = pc.fornecedor_id
       LEFT JOIN usuarios u ON u.id = pc.solicitante_id
       WHERE pc.status = 'recebido'
       ORDER BY pc.data_solicitacao DESC LIMIT 100`
    );
    return rows;
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir, c.nome AS criado_por_nome
       FROM est_escalas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN usuarios c ON c.id = e.criado_por
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!usuario_id && !nome_externo) throw new AppError('Usuário ou nome externo são obrigatórios', HTTP.BAD_REQUEST);
    if (!data_inicio) throw new AppError('data_inicio é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO est_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno || 'manha',
       data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[e]] = await pool.execute(`SELECT id FROM est_escalas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM est_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarCategorias() {
    const [rows] = await pool.execute(
      `SELECT id, nome, tipo FROM categorias_produto ORDER BY nome ASC`
    );
    return rows;
  }

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1 ORDER BY u.nome ASC`
    );
    return rows;
  }

  async recenteMovimentacoes() {
    const [rows] = await pool.execute(
      `SELECT m.id, m.tipo, m.quantidade, m.lote, m.validade, m.criado_em,
              p.nome AS produto_nome, p.codigo AS produto_codigo, p.unidade_medida,
              u.nome AS usuario_nome
       FROM movimentacoes_estoque m
       LEFT JOIN produtos p ON p.id = m.produto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ORDER BY m.criado_em DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new EstoqueService();
