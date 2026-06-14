'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class LavanderiaService {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ entradasPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS entradasPendentes FROM lav_entradas WHERE status IN ('recebido','em_triagem')`
    );
    const [[{ ciclosAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS ciclosAtivos FROM lav_ciclos_lavagem WHERE status = 'em_andamento'`
    );
    const [[{ reparosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS reparosPendentes FROM lav_reparos WHERE status IN ('aguardando','em_reparo')`
    );
    const [[{ solicitacoesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS solicitacoesPendentes FROM solicitacoes_lavanderia WHERE status = 'pendente'`
    );
    const [[{ quimicosAbaixoMinimo }]] = await pool.execute(
      `SELECT COUNT(*) AS quimicosAbaixoMinimo FROM lav_quimicos WHERE estoque_atual <= estoque_minimo AND ativo = 1`
    );
    return { entradasPendentes, ciclosAtivos, reparosPendentes, solicitacoesPendentes, quimicosAbaixoMinimo };
  }

  // ── f01 Recebimento e Triagem ────────────────────────────────────────────────

  async listarEntradas({ status, funcionario_id } = {}) {
    const where = [];
    const params = [];
    if (status)        { where.push('e.status = ?');        params.push(status); }
    if (funcionario_id){ where.push('e.funcionario_id = ?');params.push(funcionario_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT e.*, u.nome AS funcionario_nome, d.nome AS setor_nome, r.nome AS registrado_por_nome
       FROM lav_entradas e
       LEFT JOIN usuarios u    ON u.id = e.funcionario_id
       LEFT JOIN departamentos d ON d.id = e.setor_id
       LEFT JOIN usuarios r    ON r.id = e.registrado_por
       ${cond}
       ORDER BY e.created_at DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async criarEntrada(userId, { uniforme_id, funcionario_id, setor_id, tipo_item, nivel_sujeira, tipo_area, observacao }) {
    const [res] = await pool.execute(
      `INSERT INTO lav_entradas (uniforme_id, funcionario_id, setor_id, tipo_item, nivel_sujeira, tipo_area, observacao, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uniforme_id || null, funcionario_id || null, setor_id || null,
       tipo_item || 'uniforme', nivel_sujeira || 'leve', tipo_area || 'area_limpa',
       observacao || null, userId]
    );
    if (uniforme_id) {
      await pool.execute(`UPDATE lav_uniformes SET status = 'sujo' WHERE id = ?`, [uniforme_id]);
    }
    return { id: res.insertId };
  }

  async atualizarStatusEntrada(userId, id, { status }) {
    const [[e]] = await pool.execute(`SELECT id, uniforme_id, status FROM lav_entradas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Entrada não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE lav_entradas SET status = ? WHERE id = ?`, [status, id]);
    if (e.uniforme_id) {
      const statusMap = { em_lavagem: 'em_lavagem', lavado: 'disponivel', entregue: 'em_uso' };
      if (statusMap[status]) {
        await pool.execute(`UPDATE lav_uniformes SET status = ? WHERE id = ?`, [statusMap[status], e.uniforme_id]);
      }
    }
    return { ok: true };
  }

  // ── f02 Ciclos de Lavagem ────────────────────────────────────────────────────

  async listarCiclos({ status } = {}) {
    const where = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, op.nome AS operador_nome,
              (SELECT COUNT(*) FROM lav_ciclos_itens ci WHERE ci.ciclo_id = c.id) AS total_itens
       FROM lav_ciclos_lavagem c
       LEFT JOIN usuarios op ON op.id = c.operador_id
       ${where}
       ORDER BY c.data_inicio DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async buscarCiclo(id) {
    const [[ciclo]] = await pool.execute(
      `SELECT c.*, op.nome AS operador_nome
       FROM lav_ciclos_lavagem c
       LEFT JOIN usuarios op ON op.id = c.operador_id
       WHERE c.id = ?`, [id]
    );
    if (!ciclo) throw new AppError('Ciclo não encontrado', HTTP.NOT_FOUND);
    const [itens] = await pool.execute(
      `SELECT ci.*, e.tipo_item, e.nivel_sujeira, u.nome AS funcionario_nome
       FROM lav_ciclos_itens ci
       JOIN lav_entradas e ON e.id = ci.entrada_id
       LEFT JOIN usuarios u ON u.id = e.funcionario_id
       WHERE ci.ciclo_id = ?`, [id]
    );
    return { ...ciclo, itens };
  }

  async criarCiclo(userId, { temperatura, tempo_min, tipo_lavagem, total_kg, observacao, entrada_ids }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const ano = new Date().getFullYear();
      const [[{ total }]] = await conn.execute(
        `SELECT COUNT(*) AS total FROM lav_ciclos_lavagem WHERE YEAR(created_at) = ? FOR UPDATE`, [ano]
      );
      const seq = String(Number(total) + 1).padStart(4, '0');
      const codigo_lote = `LAV-${ano}-${seq}`;
      const [res] = await conn.execute(
        `INSERT INTO lav_ciclos_lavagem (codigo_lote, temperatura, tempo_min, tipo_lavagem, total_kg, operador_id, observacao)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [codigo_lote, temperatura || null, tempo_min || null,
         tipo_lavagem || 'normal', total_kg || null, userId, observacao || null]
      );
      const cicloId = res.insertId;
      if (Array.isArray(entrada_ids) && entrada_ids.length) {
        for (const eid of entrada_ids) {
          await conn.execute(
            `INSERT IGNORE INTO lav_ciclos_itens (ciclo_id, entrada_id) VALUES (?, ?)`, [cicloId, eid]
          );
          await conn.execute(`UPDATE lav_entradas SET status = 'em_lavagem' WHERE id = ?`, [eid]);
        }
      }
      await conn.commit();
      return { id: cicloId, codigo_lote };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async concluirCiclo(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[c]] = await conn.execute(
        `SELECT id, status FROM lav_ciclos_lavagem WHERE id = ? FOR UPDATE`, [id]
      );
      if (!c) throw new AppError('Ciclo não encontrado', HTTP.NOT_FOUND);
      if (c.status !== 'em_andamento')
        throw new AppError('Ciclo já foi concluído ou cancelado', HTTP.CONFLICT);
      await conn.execute(
        `UPDATE lav_ciclos_lavagem SET status = 'concluido', data_fim = NOW() WHERE id = ?`, [id]
      );
      const [itens] = await conn.execute(
        `SELECT ci.entrada_id, e.uniforme_id FROM lav_ciclos_itens ci
         JOIN lav_entradas e ON e.id = ci.entrada_id WHERE ci.ciclo_id = ?`, [id]
      );
      for (const it of itens) {
        await conn.execute(`UPDATE lav_entradas SET status = 'lavado' WHERE id = ?`, [it.entrada_id]);
        if (it.uniforme_id) {
          await conn.execute(
            `UPDATE lav_uniformes SET ciclos_lavagem = ciclos_lavagem + 1, status = 'disponivel' WHERE id = ?`,
            [it.uniforme_id]
          );
        }
      }
      await conn.commit();
      return { ok: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── f03 Controle de Químicos ─────────────────────────────────────────────────

  async listarQuimicos() {
    const [rows] = await pool.execute(
      `SELECT * FROM lav_quimicos WHERE ativo = 1 ORDER BY nome ASC`
    );
    return rows;
  }

  async criarQuimico(userId, { nome, tipo, unidade, estoque_atual, estoque_minimo, fornecedor }) {
    if (!nome) throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO lav_quimicos (nome, tipo, unidade, estoque_atual, estoque_minimo, fornecedor)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, tipo || 'outro', unidade || 'L',
       estoque_atual || 0, estoque_minimo || 0, fornecedor || null]
    );
    return { id: res.insertId };
  }

  async atualizarQuimico(id, data) {
    const [[q]] = await pool.execute(`SELECT id FROM lav_quimicos WHERE id = ? AND ativo = 1`, [id]);
    if (!q) throw new AppError('Químico não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome','tipo','unidade','estoque_atual','estoque_minimo','fornecedor'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE lav_quimicos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async registrarUsoQuimico(userId, quimicoId, { ciclo_id, quantidade, data_uso, total_kg_roupas, observacao }) {
    if (!quantidade || quantidade <= 0) throw new AppError('Quantidade inválida', HTTP.BAD_REQUEST);
    const [[q]] = await pool.execute(`SELECT id, estoque_atual FROM lav_quimicos WHERE id = ? AND ativo = 1`, [quimicoId]);
    if (!q) throw new AppError('Químico não encontrado', HTTP.NOT_FOUND);
    if (q.estoque_atual < quantidade) throw new AppError('Estoque insuficiente', HTTP.CONFLICT);
    await pool.execute(
      `INSERT INTO lav_quimicos_uso (quimico_id, ciclo_id, quantidade, data_uso, total_kg_roupas, registrado_por, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quimicoId, ciclo_id || null, quantidade, data_uso || new Date().toISOString().split('T')[0],
       total_kg_roupas || null, userId, observacao || null]
    );
    await pool.execute(
      `UPDATE lav_quimicos SET estoque_atual = estoque_atual - ? WHERE id = ?`, [quantidade, quimicoId]
    );
    return { ok: true };
  }

  // ── f04 Higienização de Botas e Aventais ─────────────────────────────────────

  async listarHigienizacoes({ status } = {}) {
    const where = status ? 'WHERE h.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT h.*, u.nome AS funcionario_nome, r.nome AS registrado_por_nome
       FROM lav_higienizacoes h
       LEFT JOIN usuarios u ON u.id = h.funcionario_id
       LEFT JOIN usuarios r ON r.id = h.registrado_por
       ${where}
       ORDER BY h.data_higienizacao DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarHigienizacao(userId, { tipo_item, funcionario_id, data_higienizacao, metodo, temperatura, produto_usado, observacao }) {
    const [res] = await pool.execute(
      `INSERT INTO lav_higienizacoes (tipo_item, funcionario_id, data_higienizacao, metodo, temperatura, produto_usado, observacao, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo_item || 'bota', funcionario_id || null,
       data_higienizacao || new Date().toISOString().split('T')[0],
       metodo || 'lavagem_manual', temperatura || null, produto_usado || null,
       observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarStatusHigienizacao(id, status) {
    const [[h]] = await pool.execute(`SELECT id FROM lav_higienizacoes WHERE id = ?`, [id]);
    if (!h) throw new AppError('Registro não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE lav_higienizacoes SET status = ? WHERE id = ?`, [status, id]);
    return { ok: true };
  }

  // ── f05 Entrega de Limpos ────────────────────────────────────────────────────

  async listarPendentesEntrega() {
    const [rows] = await pool.execute(
      `SELECT e.*, u.nome AS funcionario_nome, d.nome AS setor_nome, r.nome AS registrado_por_nome
       FROM lav_entradas e
       LEFT JOIN usuarios u    ON u.id = e.funcionario_id
       LEFT JOIN departamentos d ON d.id = e.setor_id
       LEFT JOIN usuarios r    ON r.id = e.registrado_por
       WHERE e.status = 'lavado'
       ORDER BY e.updated_at ASC LIMIT 100`
    );
    return rows;
  }

  async registrarEntrega(userId, id) {
    const [[e]] = await pool.execute(`SELECT id, uniforme_id, funcionario_id FROM lav_entradas WHERE id = ? AND status = 'lavado'`, [id]);
    if (!e) throw new AppError('Peça não encontrada ou não está pronta para entrega', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE lav_entradas SET status = 'entregue' WHERE id = ?`, [id]);
    if (e.uniforme_id) {
      await pool.execute(`UPDATE lav_uniformes SET status = 'em_uso' WHERE id = ?`, [e.uniforme_id]);
    }
    return { ok: true };
  }

  // ── f06 Estoque de Uniformes Novos ───────────────────────────────────────────

  async listarEstoqueUniformes({ tipo } = {}) {
    const where = tipo ? 'WHERE tipo = ?' : '';
    const params = tipo ? [tipo] : [];
    const [rows] = await pool.execute(
      `SELECT * FROM lav_estoque_uniformes ${where} ORDER BY tipo, tamanho ASC`,
      params
    );
    return rows;
  }

  async criarItemEstoque(userId, { tipo, descricao, tamanho, cor, quantidade, estoque_minimo, localizacao }) {
    const [res] = await pool.execute(
      `INSERT INTO lav_estoque_uniformes (tipo, descricao, tamanho, cor, quantidade, estoque_minimo, localizacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo || 'outro', descricao || null, tamanho || null, cor || null,
       quantidade || 0, estoque_minimo || 5, localizacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarItemEstoque(id, data) {
    const [[item]] = await pool.execute(`SELECT id FROM lav_estoque_uniformes WHERE id = ?`, [id]);
    if (!item) throw new AppError('Item não encontrado', HTTP.NOT_FOUND);
    const allowed = ['tipo','descricao','tamanho','cor','quantidade','estoque_minimo','localizacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE lav_estoque_uniformes SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── f07 Baixa e Descarte ─────────────────────────────────────────────────────

  async listarDescartes() {
    const [rows] = await pool.execute(
      `SELECT d.*, u.codigo AS uniforme_codigo, r.nome AS registrado_por_nome
       FROM lav_descartes d
       LEFT JOIN lav_uniformes u ON u.id = d.uniforme_id
       LEFT JOIN usuarios r      ON r.id = d.registrado_por
       ORDER BY d.created_at DESC LIMIT 100`
    );
    return rows;
  }

  async registrarDescarte(userId, { uniforme_id, tipo_item, motivo, descricao, valor_estimado }) {
    if (!motivo) throw new AppError('Motivo é obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO lav_descartes (uniforme_id, tipo_item, motivo, descricao, valor_estimado, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uniforme_id || null, tipo_item || 'uniforme', motivo,
       descricao || null, valor_estimado || null, userId]
    );
    if (uniforme_id) {
      await pool.execute(`UPDATE lav_uniformes SET status = 'descartado', ativo = 0 WHERE id = ?`, [uniforme_id]);
    }
    return { id: res.insertId };
  }

  // ── f08 Gestão de Reparos ────────────────────────────────────────────────────

  async listarReparos({ status } = {}) {
    const where = status ? 'WHERE r.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT r.*, u.codigo AS uniforme_codigo, rb.nome AS registrado_por_nome
       FROM lav_reparos r
       LEFT JOIN lav_uniformes u ON u.id = r.uniforme_id
       LEFT JOIN usuarios rb     ON rb.id = r.registrado_por
       ${where}
       ORDER BY r.data_entrada DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarReparo(userId, { uniforme_id, tipo_item, tipo_reparo, descricao, data_entrada, responsavel }) {
    const [res] = await pool.execute(
      `INSERT INTO lav_reparos (uniforme_id, tipo_item, tipo_reparo, descricao, data_entrada, responsavel, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uniforme_id || null, tipo_item || 'uniforme', tipo_reparo || 'costura_geral',
       descricao || null, data_entrada || new Date().toISOString().split('T')[0],
       responsavel || null, userId]
    );
    if (uniforme_id) {
      await pool.execute(`UPDATE lav_uniformes SET status = 'em_reparo' WHERE id = ?`, [uniforme_id]);
    }
    return { id: res.insertId };
  }

  async atualizarReparo(id, { status, data_retorno, responsavel }) {
    const [[r]] = await pool.execute(`SELECT id, uniforme_id FROM lav_reparos WHERE id = ?`, [id]);
    if (!r) throw new AppError('Reparo não encontrado', HTTP.NOT_FOUND);
    const sets = []; const params = [];
    if (status)       { sets.push('status = ?');       params.push(status); }
    if (data_retorno) { sets.push('data_retorno = ?'); params.push(data_retorno); }
    if (responsavel)  { sets.push('responsavel = ?');  params.push(responsavel); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE lav_reparos SET ${sets.join(', ')} WHERE id = ?`, params);
    if (status === 'concluido' && r.uniforme_id) {
      await pool.execute(`UPDATE lav_uniformes SET status = 'disponivel' WHERE id = ?`, [r.uniforme_id]);
    }
    return { ok: true };
  }

  // ── f09 Controle de Toalhas (via estoque — tipo toalha) ──────────────────────
  // Reutiliza listarEstoqueUniformes / criarItemEstoque com tipo 'toalha_tecido' ou 'toalha_papel'

  // ── f10 Inventário de Enxoval ────────────────────────────────────────────────

  async listarInventarios() {
    const [rows] = await pool.execute(
      `SELECT i.*, u.nome AS registrado_por_nome
       FROM lav_inventarios i
       LEFT JOIN usuarios u ON u.id = i.registrado_por
       ORDER BY i.data_inventario DESC LIMIT 50`
    );
    return rows;
  }

  async buscarInventario(id) {
    const [[inv]] = await pool.execute(
      `SELECT i.*, u.nome AS registrado_por_nome FROM lav_inventarios i LEFT JOIN usuarios u ON u.id = i.registrado_por WHERE i.id = ?`,
      [id]
    );
    if (!inv) throw new AppError('Inventário não encontrado', HTTP.NOT_FOUND);
    const [itens] = await pool.execute(
      `SELECT * FROM lav_inventarios_itens WHERE inventario_id = ? ORDER BY tipo_peca ASC`, [id]
    );
    return { ...inv, itens };
  }

  async criarInventario(userId, { data_inventario, observacoes, itens }) {
    const [res] = await pool.execute(
      `INSERT INTO lav_inventarios (data_inventario, registrado_por, observacoes)
       VALUES (?, ?, ?)`,
      [data_inventario || new Date().toISOString().split('T')[0], userId, observacoes || null]
    );
    const invId = res.insertId;
    if (Array.isArray(itens) && itens.length) {
      for (const it of itens) {
        await pool.execute(
          `INSERT INTO lav_inventarios_itens (inventario_id, tipo_peca, em_uso, em_estoque, sujas, em_reparo, descartadas, observacoes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [invId, it.tipo_peca, it.em_uso || 0, it.em_estoque || 0, it.sujas || 0,
           it.em_reparo || 0, it.descartadas || 0, it.observacoes || null]
        );
      }
      await pool.execute(`UPDATE lav_inventarios SET status = 'finalizado' WHERE id = ?`, [invId]);
    }
    return { id: invId };
  }

  // ── f11 Gestão de Armários ───────────────────────────────────────────────────

  async listarArmarios({ status } = {}) {
    const where = status ? 'WHERE a.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS funcionario_nome
       FROM lav_armarios a
       LEFT JOIN usuarios u ON u.id = a.funcionario_id
       ${where}
       ORDER BY a.codigo ASC LIMIT 200`,
      params
    );
    return rows;
  }

  async criarArmario(userId, { codigo, tipo_vestiario, localizacao, observacao }) {
    if (!codigo) throw new AppError('Código é obrigatório', HTTP.BAD_REQUEST);
    const [[ex]] = await pool.execute(`SELECT id FROM lav_armarios WHERE codigo = ?`, [codigo]);
    if (ex) throw new AppError('Código de armário já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO lav_armarios (codigo, tipo_vestiario, localizacao, observacao)
       VALUES (?, ?, ?, ?)`,
      [codigo, tipo_vestiario || 'misto', localizacao || null, observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarArmario(id, { status, funcionario_id, localizacao, observacao }) {
    const [[a]] = await pool.execute(`SELECT id FROM lav_armarios WHERE id = ?`, [id]);
    if (!a) throw new AppError('Armário não encontrado', HTTP.NOT_FOUND);

    // Resolve status e funcionario_id de forma coerente
    let novoStatus = status;
    let novoFuncId = funcionario_id !== undefined ? (funcionario_id || null) : undefined;

    // Liberar: garante funcionario_id = NULL
    if (novoStatus === 'disponivel') novoFuncId = null;
    // Atribuir a alguém: garante status = 'ocupado'
    if (novoFuncId) novoStatus = novoStatus || 'ocupado';

    const sets = []; const params = [];
    if (novoStatus !== undefined)  { sets.push('status = ?');        params.push(novoStatus); }
    if (novoFuncId !== undefined)  { sets.push('funcionario_id = ?');params.push(novoFuncId); }
    if (localizacao !== undefined) { sets.push('localizacao = ?');   params.push(localizacao); }
    if (observacao !== undefined)  { sets.push('observacao = ?');    params.push(observacao); }

    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE lav_armarios SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── f13 Controle de EPIs ─────────────────────────────────────────────────────

  async listarEpisRegistros({ funcionario_id } = {}) {
    const where = funcionario_id ? 'WHERE e.funcionario_id = ?' : '';
    const params = funcionario_id ? [funcionario_id] : [];
    const [rows] = await pool.execute(
      `SELECT e.*, u.nome AS funcionario_nome, v.nome AS verificado_por_nome
       FROM lav_epis_registros e
       LEFT JOIN usuarios u ON u.id = e.funcionario_id
       LEFT JOIN usuarios v ON v.id = e.verificado_por
       ${where}
       ORDER BY e.data_verificacao DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async registrarEpi(userId, { funcionario_id, tipo_epi, data_verificacao, em_uso, condicao, observacao }) {
    if (!funcionario_id || !tipo_epi) throw new AppError('Funcionário e tipo de EPI são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO lav_epis_registros (funcionario_id, tipo_epi, data_verificacao, em_uso, condicao, verificado_por, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [funcionario_id, tipo_epi,
       data_verificacao || new Date().toISOString().split('T')[0],
       em_uso !== undefined ? (em_uso ? 1 : 0) : 1,
       condicao || 'bom', userId, observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f14 Gerenciar Solicitações de Higienização ───────────────────────────────

  async listarSolicitacoes({ status } = {}) {
    const where = status ? 'WHERE s.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT s.*, sol.nome AS solicitante_nome, at.nome AS atendido_por_nome
       FROM solicitacoes_lavanderia s
       LEFT JOIN usuarios sol ON sol.id = s.solicitante_id
       LEFT JOIN usuarios at  ON at.id  = s.atendido_por
       ${where}
       ORDER BY s.criado_em DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async atualizarSolicitacao(userId, id, { status }) {
    const valid = ['pendente','aceita','coletado','lavando','entregue','cancelada'];
    if (!status || !valid.includes(status))
      throw new AppError(`Status inválido. Valores aceitos: ${valid.join(', ')}`, HTTP.BAD_REQUEST);
    const [[s]] = await pool.execute(`SELECT id FROM solicitacoes_lavanderia WHERE id = ?`, [id]);
    if (!s) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE solicitacoes_lavanderia SET status = ?, atendido_por = ? WHERE id = ?`,
      [status, userId, id]
    );
    return { ok: true };
  }

  // ── f15 / f16 Escalas ────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.funcionario_nome) AS nome_exibir, c.nome AS criado_por_nome
       FROM lav_escalas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN usuarios c ON c.id = e.criado_por_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, funcionario_nome, turno, data_inicio, data_fim, tipo, observacao }) {
    if (!usuario_id && !funcionario_nome) throw new AppError('Usuário ou nome do funcionário é obrigatório', HTTP.BAD_REQUEST);
    if (!data_inicio || !data_fim)        throw new AppError('Data de início e fim são obrigatórias', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO lav_escalas (usuario_id, funcionario_nome, turno, data_inicio, data_fim, tipo, observacao, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, funcionario_nome || null, turno || 'manha',
       data_inicio, data_fim, tipo || 'normal', observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[e]] = await pool.execute(`SELECT id FROM lav_escalas WHERE id = ?`, [id]);
    if (!e) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM lav_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Uniformes (cadastro / selects) ───────────────────────────────────────────

  async listarUniformes({ status } = {}) {
    const where = ['u.ativo = 1'];
    const params = [];
    if (status) { where.push('u.status = ?'); params.push(status); }
    const [rows] = await pool.execute(
      `SELECT u.*, f.nome AS funcionario_nome, d.nome AS departamento_nome
       FROM lav_uniformes u
       LEFT JOIN usuarios f      ON f.id  = u.funcionario_id
       LEFT JOIN departamentos d ON d.id  = u.departamento_id
       WHERE ${where.join(' AND ')}
       ORDER BY u.codigo ASC LIMIT 200`,
      params
    );
    return rows;
  }

  async criarUniforme(userId, { codigo, tipo, tamanho, cor, funcionario_id, departamento_id }) {
    if (!codigo) {
      const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM lav_uniformes`);
      codigo = `UNI-${String(Number(total) + 1).padStart(5, '0')}`;
    }
    const [res] = await pool.execute(
      `INSERT INTO lav_uniformes (codigo, tipo, tamanho, cor, funcionario_id, departamento_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo, tipo || 'outro', tamanho || null, cor || null,
       funcionario_id || null, departamento_id || null]
    );
    return { id: res.insertId, codigo };
  }

  // ── Usuários (selects) ────────────────────────────────────────────────────────

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1 ORDER BY u.nome ASC`
    );
    return rows;
  }

  async listarDepartamentos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM departamentos ORDER BY nome ASC`);
    return rows;
  }
}

module.exports = new LavanderiaService();
