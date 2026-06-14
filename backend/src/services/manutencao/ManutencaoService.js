'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class ManutencaoService {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ osAberta }]] = await pool.execute(
      `SELECT COUNT(*) AS osAberta FROM ordens_servico WHERE status = 'aberta'`
    );
    const [[{ osEmAndamento }]] = await pool.execute(
      `SELECT COUNT(*) AS osEmAndamento FROM ordens_servico WHERE status = 'em_andamento'`
    );
    const [[{ osAguardando }]] = await pool.execute(
      `SELECT COUNT(*) AS osAguardando FROM ordens_servico WHERE status = 'aguardando_peca'`
    );
    const [[{ osCritica }]] = await pool.execute(
      `SELECT COUNT(*) AS osCritica FROM ordens_servico WHERE prioridade = 'critica' AND status NOT IN ('concluida','cancelada')`
    );
    const [[{ osAlta }]] = await pool.execute(
      `SELECT COUNT(*) AS osAlta FROM ordens_servico WHERE prioridade = 'alta' AND status NOT IN ('concluida','cancelada')`
    );
    const [[{ preventivaProxima }]] = await pool.execute(
      `SELECT COUNT(*) AS preventivaProxima FROM manutencao_preventiva WHERE ativo = 1 AND proxima_data BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );
    const [[{ ferramentasEmUso }]] = await pool.execute(
      `SELECT COUNT(*) AS ferramentasEmUso FROM ferramentas WHERE status = 'em_uso'`
    );
    const [[{ pecasAbaixoMin }]] = await pool.execute(
      `SELECT COUNT(*) AS pecasAbaixoMin FROM pecas_manutencao WHERE ativo = 1 AND saldo_atual <= saldo_minimo`
    );
    const [[{ calibracoesVencidas }]] = await pool.execute(
      `SELECT COUNT(*) AS calibracoesVencidas FROM ferramentas WHERE ativo = 1 AND calibracao_proxima IS NOT NULL AND calibracao_proxima < CURDATE()`
    );
    return { osAberta, osEmAndamento, osAguardando, osCritica, osAlta, preventivaProxima, ferramentasEmUso, pecasAbaixoMin, calibracoesVencidas };
  }

  // ── Ordens de Serviço ────────────────────────────────────────────────────────

  async listarOS({ status, prioridade, tipo, equipamento_id } = {}) {
    const where = [];
    const params = [];
    if (status)        { where.push('os.status = ?');       params.push(status); }
    if (prioridade)    { where.push('os.prioridade = ?');   params.push(prioridade); }
    if (tipo)          { where.push('os.tipo = ?');         params.push(tipo); }
    if (equipamento_id){ where.push('os.equipamento_id = ?'); params.push(Number(equipamento_id)); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT os.*, e.nome AS equipamento_nome, e.localizacao AS equipamento_local,
              sol.nome AS solicitante_nome, tec.nome AS tecnico_nome
       FROM ordens_servico os
       LEFT JOIN equipamentos e ON e.id = os.equipamento_id
       LEFT JOIN usuarios sol  ON sol.id = os.solicitante_id
       LEFT JOIN usuarios tec  ON tec.id = os.tecnico_id
       ${cond}
       ORDER BY os.data_abertura DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async listarMinhasOS(userId) {
    const [rows] = await pool.execute(
      `SELECT os.*, e.nome AS equipamento_nome, e.localizacao AS equipamento_local,
              sol.nome AS solicitante_nome
       FROM ordens_servico os
       LEFT JOIN equipamentos e ON e.id = os.equipamento_id
       LEFT JOIN usuarios sol  ON sol.id = os.solicitante_id
       WHERE os.tecnico_id = ? OR os.solicitante_id = ?
       ORDER BY FIELD(os.status,'aberta','em_andamento','aguardando_peca','concluida','cancelada'),
                os.data_abertura DESC
       LIMIT 100`,
      [userId, userId]
    );
    return rows;
  }

  async buscarOS(id) {
    const [[os]] = await pool.execute(
      `SELECT os.*, e.nome AS equipamento_nome, e.localizacao AS equipamento_local,
              sol.nome AS solicitante_nome, tec.nome AS tecnico_nome
       FROM ordens_servico os
       LEFT JOIN equipamentos e ON e.id = os.equipamento_id
       LEFT JOIN usuarios sol  ON sol.id = os.solicitante_id
       LEFT JOIN usuarios tec  ON tec.id = os.tecnico_id
       WHERE os.id = ?`,
      [id]
    );
    if (!os) throw new AppError('Ordem de serviço não encontrada', HTTP.NOT_FOUND);
    const [apontamentos] = await pool.execute(
      `SELECT apt.*, u.nome AS tecnico_nome, p.nome AS peca_nome
       FROM os_apontamentos apt
       LEFT JOIN usuarios u ON u.id = apt.tecnico_id
       LEFT JOIN pecas_manutencao p ON p.id = apt.peca_id
       WHERE apt.os_id = ?
       ORDER BY apt.data_apontamento DESC`,
      [id]
    );
    return { ...os, apontamentos };
  }

  async criarOS(userId, { equipamento_id, tipo, prioridade, descricao, motivo_manutencao, causa_raiz, data_previsao }) {
    const TIPOS = ['preventiva','corretiva','preditiva','emergencial'];
    const PRIORIDADES = ['baixa','media','alta','critica'];
    const tipoFinal = TIPOS.includes(tipo) ? tipo : 'corretiva';
    const prioFinal = PRIORIDADES.includes(prioridade) ? prioridade : 'media';
    const codigo = 'OS-' + Date.now().toString(36).toUpperCase();
    const [result] = await pool.execute(
      `INSERT INTO ordens_servico
         (codigo, solicitante_id, equipamento_id, tipo, prioridade, descricao, motivo_manutencao, causa_raiz, data_previsao, status, data_abertura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberta', NOW())`,
      [codigo, userId, equipamento_id || null, tipoFinal, prioFinal, descricao,
       motivo_manutencao || null, causa_raiz || null, data_previsao || null]
    );
    return { id: result.insertId, codigo };
  }

  async atualizarStatusOS(userId, id, { status, observacao_tecnico, tecnico_id }) {
    const [[os]] = await pool.execute(`SELECT id, status FROM ordens_servico WHERE id = ?`, [id]);
    if (!os) throw new AppError('OS não encontrada', HTTP.NOT_FOUND);
    const extra = status === 'concluida' ? ', data_conclusao = NOW()' : '';
    const tecUpdate = tecnico_id ? ', tecnico_id = ?' : '';
    const params = [status, observacao_tecnico || null];
    if (tecnico_id) params.push(Number(tecnico_id));
    params.push(id);
    await pool.execute(
      `UPDATE ordens_servico SET status = ?, observacao_tecnico = ?${tecUpdate}${extra} WHERE id = ?`,
      params
    );
    return { ok: true };
  }

  async apontarOS(userId, osId, { data_apontamento, horas_trabalhadas, descricao_servico, peca_id, qtd_pecas }) {
    const [[os]] = await pool.execute(`SELECT id FROM ordens_servico WHERE id = ?`, [osId]);
    if (!os) throw new AppError('OS não encontrada', HTTP.NOT_FOUND);
    let custo_material = null;
    if (peca_id && qtd_pecas > 0) {
      await this._movimentarPeca(userId, Number(peca_id), osId, Number(qtd_pecas));
      const [[peca]] = await pool.execute(`SELECT preco_unitario FROM pecas_manutencao WHERE id = ?`, [peca_id]);
      if (peca && peca.preco_unitario) custo_material = peca.preco_unitario * qtd_pecas;
    }
    const [result] = await pool.execute(
      `INSERT INTO os_apontamentos (os_id, tecnico_id, data_apontamento, horas_trabalhadas, descricao_servico, peca_id, qtd_pecas, custo_material)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [osId, userId, data_apontamento, horas_trabalhadas || null, descricao_servico || null, peca_id || null, qtd_pecas || null, custo_material]
    );
    // Update custo_total on OS
    await pool.execute(
      `UPDATE ordens_servico SET custo_total = (SELECT COALESCE(SUM(custo_material),0) FROM os_apontamentos WHERE os_id = ?) WHERE id = ?`,
      [osId, osId]
    );
    return { id: result.insertId };
  }

  // ── Manutenção Preventiva ─────────────────────────────────────────────────────

  async listarPreventiva({ tipo, ativo } = {}) {
    const where = [];
    const params = [];
    if (tipo)  { where.push('mp.tipo = ?');  params.push(tipo); }
    if (ativo !== undefined) { where.push('mp.ativo = ?'); params.push(Number(ativo)); }
    else { where.push('mp.ativo = 1'); }
    const cond = 'WHERE ' + where.join(' AND ');
    const [rows] = await pool.execute(
      `SELECT mp.*, e.nome AS equipamento_nome, e.localizacao AS equipamento_local,
              u.nome AS responsavel_nome,
              DATEDIFF(mp.proxima_data, CURDATE()) AS dias_ate_vencimento
       FROM manutencao_preventiva mp
       LEFT JOIN equipamentos e ON e.id = mp.equipamento_id
       LEFT JOIN usuarios u     ON u.id = mp.responsavel_id
       ${cond}
       ORDER BY mp.proxima_data ASC`,
      params
    );
    return rows;
  }

  async criarPreventiva(userId, { equipamento_id, titulo, tipo, frequencia_tipo, frequencia_valor, descricao, responsavel_id, proxima_data, duracao_estimada_h, checklist }) {
    const checklistJson = Array.isArray(checklist) ? JSON.stringify(checklist) : (checklist || null);
    const [result] = await pool.execute(
      `INSERT INTO manutencao_preventiva
         (equipamento_id, titulo, tipo, frequencia_tipo, frequencia_valor, descricao, responsavel_id, proxima_data, duracao_estimada_h, checklist, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [equipamento_id || null, titulo, tipo || 'preventiva', frequencia_tipo || 'mensal', frequencia_valor || 1,
       descricao || null, responsavel_id || null, proxima_data, duracao_estimada_h || null, checklistJson, userId]
    );
    return { id: result.insertId };
  }

  async atualizarPreventiva(userId, id, data) {
    const [[mp]] = await pool.execute(`SELECT id FROM manutencao_preventiva WHERE id = ?`, [id]);
    if (!mp) throw new AppError('Plano preventivo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['titulo','tipo','frequencia_tipo','proxima_data','responsavel_id','ativo','checklist','descricao'];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(key === 'checklist' && Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key]);
      }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE manutencao_preventiva SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async executarPreventiva(userId, id, { observacoes } = {}) {
    const [[mp]] = await pool.execute(`SELECT * FROM manutencao_preventiva WHERE id = ?`, [id]);
    if (!mp) throw new AppError('Plano preventivo não encontrado', HTTP.NOT_FOUND);
    // Calculate next date
    const hoje = new Date();
    const freq = mp.frequencia_tipo;
    const next = new Date(hoje);
    const val = mp.frequencia_valor || 1;
    if (freq === 'diaria')     next.setDate(next.getDate() + val);
    else if (freq === 'semanal')    next.setDate(next.getDate() + 7 * val);
    else if (freq === 'quinzenal')  next.setDate(next.getDate() + 14);
    else if (freq === 'mensal')     next.setMonth(next.getMonth() + val);
    else if (freq === 'trimestral') next.setMonth(next.getMonth() + 3);
    else if (freq === 'semestral')  next.setMonth(next.getMonth() + 6);
    else if (freq === 'anual')      next.setFullYear(next.getFullYear() + 1);
    const nextStr = next.toISOString().split('T')[0];
    await pool.execute(
      `UPDATE manutencao_preventiva SET ultima_data = CURDATE(), proxima_data = ? WHERE id = ?`,
      [nextStr, id]
    );
    // Create OS record for this execution
    const codigo = 'OS-PREV-' + Date.now().toString(36).toUpperCase();
    await pool.execute(
      `INSERT INTO ordens_servico (codigo, solicitante_id, equipamento_id, tipo, prioridade, descricao, status, data_abertura, data_conclusao)
       VALUES (?, ?, ?, 'preventiva', 'media', ?, 'concluida', NOW(), NOW())`,
      [codigo, userId, mp.equipamento_id || null, `Execução preventiva: ${mp.titulo}${observacoes ? ' — ' + observacoes : ''}`]
    );
    return { ok: true, proxima_data: nextStr };
  }

  // ── Árvore de Ativos ──────────────────────────────────────────────────────────

  async listarAtivos() {
    const [rows] = await pool.execute(
      `SELECT ah.*, e.nome AS equip_nome, e.status AS equip_status
       FROM ativos_hierarquia ah
       LEFT JOIN equipamentos e ON e.id = ah.equipamento_id
       WHERE ah.ativo = 1
       ORDER BY ah.parent_id IS NOT NULL, ah.codigo ASC`
    );
    return rows;
  }

  async criarAtivo(userId, { parent_id, codigo, nome, tipo, localizacao, equipamento_id, descricao }) {
    const [[exist]] = await pool.execute(`SELECT id FROM ativos_hierarquia WHERE codigo = ?`, [codigo]);
    if (exist) throw new AppError('Código de ativo já existe', HTTP.CONFLICT);
    const [result] = await pool.execute(
      `INSERT INTO ativos_hierarquia (parent_id, equipamento_id, codigo, nome, tipo, localizacao, descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [parent_id || null, equipamento_id || null, codigo, nome, tipo || 'componente', localizacao || null, descricao || null]
    );
    return { id: result.insertId };
  }

  // ── Equipamentos ──────────────────────────────────────────────────────────────

  async listarEquipamentos({ status, departamento_id } = {}) {
    const where = [];
    const params = [];
    if (status)         { where.push('e.status = ?');          params.push(status); }
    if (departamento_id){ where.push('e.departamento_id = ?'); params.push(Number(departamento_id)); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT e.*, d.nome AS departamento_nome,
              (SELECT COUNT(*) FROM ordens_servico os WHERE os.equipamento_id = e.id AND os.status NOT IN ('concluida','cancelada')) AS os_abertas
       FROM equipamentos e
       LEFT JOIN departamentos d ON d.id = e.departamento_id
       ${cond}
       ORDER BY e.nome ASC`,
      params
    );
    return rows;
  }

  async criarEquipamento(userId, { codigo, nome, tipo, departamento_id, marca, modelo, numero_serie, data_aquisicao, localizacao, manual_pdf }) {
    if (codigo) {
      const [[exist]] = await pool.execute(`SELECT id FROM equipamentos WHERE codigo = ?`, [codigo]);
      if (exist) throw new AppError('Código de equipamento já existe', HTTP.CONFLICT);
    }
    const [result] = await pool.execute(
      `INSERT INTO equipamentos (codigo, nome, tipo, departamento_id, marca, modelo, numero_serie, data_aquisicao, localizacao, manual_pdf, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'operacional')`,
      [codigo || null, nome, tipo || null, departamento_id || null,
       marca || null, modelo || null, numero_serie || null,
       data_aquisicao || null, localizacao || null, manual_pdf || null]
    );
    return { id: result.insertId };
  }

  async atualizarEquipamento(userId, id, { nome, tipo, departamento_id, marca, modelo, numero_serie, data_aquisicao, localizacao, status, manual_pdf }) {
    const [[equip]] = await pool.execute(`SELECT id FROM equipamentos WHERE id = ?`, [id]);
    if (!equip) throw new AppError('Equipamento não encontrado', HTTP.NOT_FOUND);
    const STATUS_VALIDOS = ['operacional', 'em_manutencao', 'inativo', 'sucata'];
    if (status && !STATUS_VALIDOS.includes(status)) {
      throw new AppError(`Status inválido. Aceitos: ${STATUS_VALIDOS.join(', ')}`, HTTP.BAD_REQUEST);
    }
    await pool.execute(
      `UPDATE equipamentos SET
        nome = COALESCE(?, nome),
        tipo = COALESCE(?, tipo),
        departamento_id = COALESCE(?, departamento_id),
        marca = COALESCE(?, marca),
        modelo = COALESCE(?, modelo),
        numero_serie = COALESCE(?, numero_serie),
        data_aquisicao = COALESCE(?, data_aquisicao),
        localizacao = COALESCE(?, localizacao),
        status = COALESCE(?, status),
        manual_pdf = CASE WHEN ? IS NOT NULL THEN ? ELSE manual_pdf END
       WHERE id = ?`,
      [nome || null, tipo || null, departamento_id || null,
       marca || null, modelo || null, numero_serie || null,
       data_aquisicao || null, localizacao || null, status || null,
       manual_pdf || null, manual_pdf || null, id]
    );
    return { id };
  }

  async prontuarioEquipamento(id) {
    const [[equipamento]] = await pool.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!equipamento) throw new AppError('Equipamento não encontrado', HTTP.NOT_FOUND);
    const [os] = await pool.execute(
      `SELECT os.*, u.nome AS tecnico_nome,
              (SELECT COALESCE(SUM(apt.horas_trabalhadas),0) FROM os_apontamentos apt WHERE apt.os_id = os.id) AS total_horas
       FROM ordens_servico os
       LEFT JOIN usuarios u ON u.id = os.tecnico_id
       WHERE os.equipamento_id = ?
       ORDER BY os.data_abertura DESC`,
      [id]
    );
    const [preventivas] = await pool.execute(
      `SELECT mp.*, u.nome AS responsavel_nome FROM manutencao_preventiva mp
       LEFT JOIN usuarios u ON u.id = mp.responsavel_id
       WHERE mp.equipamento_id = ?
       ORDER BY mp.proxima_data ASC`,
      [id]
    );
    const totais = {
      total_os: os.length,
      total_horas: os.reduce((s, o) => s + Number(o.total_horas || 0), 0),
      custo_total: os.reduce((s, o) => s + Number(o.custo_total || 0), 0),
    };
    return { equipamento, os, preventivas, totais };
  }

  // ── Peças MRO ─────────────────────────────────────────────────────────────────

  async listarPecas({ categoria, busca } = {}) {
    const where = ['p.ativo = 1'];
    const params = [];
    if (categoria) { where.push('p.categoria = ?'); params.push(categoria); }
    if (busca)     { where.push('(p.nome LIKE ? OR p.codigo LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`); }
    const [rows] = await pool.execute(
      `SELECT p.*, f.razao_social AS fornecedor_nome,
              (p.saldo_atual <= p.saldo_minimo) AS estoque_critico
       FROM pecas_manutencao p
       LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
       WHERE ${where.join(' AND ')}
       ORDER BY p.categoria, p.nome ASC`,
      params
    );
    return rows;
  }

  async criarPeca(userId, { codigo, nome, descricao, unidade, categoria, saldo_inicial, saldo_minimo, localizacao_estoque, fornecedor_id, preco_unitario }) {
    const saldoInicial = Number(saldo_inicial) || 0;
    const [result] = await pool.execute(
      `INSERT INTO pecas_manutencao (codigo, nome, descricao, unidade, categoria, saldo_atual, saldo_minimo, localizacao_estoque, fornecedor_id, preco_unitario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo || null, nome, descricao || null, unidade || 'un', categoria, saldoInicial, Number(saldo_minimo) || 1,
       localizacao_estoque || null, fornecedor_id || null, preco_unitario || null]
    );
    const pecaId = result.insertId;
    if (saldoInicial > 0) {
      await pool.execute(
        `INSERT INTO movimentacoes_pecas (peca_id, usuario_id, tipo, quantidade, saldo_anterior, saldo_posterior, motivo)
         VALUES (?, ?, 'entrada', ?, 0, ?, 'Saldo inicial')`,
        [pecaId, userId, saldoInicial, saldoInicial]
      );
    }
    return { id: pecaId };
  }

  async movimentarPeca(userId, id, { tipo, quantidade, os_id, motivo, documento_ref }) {
    const [[peca]] = await pool.execute(`SELECT id, saldo_atual FROM pecas_manutencao WHERE id = ? AND ativo = 1`, [id]);
    if (!peca) throw new AppError('Peça não encontrada', HTTP.NOT_FOUND);
    const qtd = Number(quantidade);
    if (tipo === 'saida' && peca.saldo_atual < qtd) {
      throw new AppError(`Saldo insuficiente. Disponível: ${peca.saldo_atual}`, HTTP.BAD_REQUEST);
    }
    const saldoAnterior = Number(peca.saldo_atual);
    let saldoPosterior;
    if (tipo === 'entrada') saldoPosterior = saldoAnterior + qtd;
    else if (tipo === 'saida') saldoPosterior = saldoAnterior - qtd;
    else saldoPosterior = qtd; // ajuste/inventario sets new total
    await pool.execute(`UPDATE pecas_manutencao SET saldo_atual = ? WHERE id = ?`, [saldoPosterior, id]);
    await pool.execute(
      `INSERT INTO movimentacoes_pecas (peca_id, os_id, usuario_id, tipo, quantidade, saldo_anterior, saldo_posterior, motivo, documento_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, os_id || null, userId, tipo, qtd, saldoAnterior, saldoPosterior, motivo || null, documento_ref || null]
    );
    return { saldo_atual: saldoPosterior };
  }

  async _movimentarPeca(userId, pecaId, osId, quantidade) {
    return this.movimentarPeca(userId, pecaId, { tipo: 'saida', quantidade, os_id: osId, motivo: 'Consumo em OS' });
  }

  // ── Ferramentas ───────────────────────────────────────────────────────────────

  async listarFerramentas() {
    const [rows] = await pool.execute(
      `SELECT f.*, u.nome AS usuario_atual_nome,
              (SELECT fm.data_hora FROM ferramentas_movimentacoes fm WHERE fm.ferramenta_id = f.id ORDER BY fm.data_hora DESC LIMIT 1) AS ultima_movimentacao
       FROM ferramentas f
       LEFT JOIN usuarios u ON u.id = f.usuario_atual_id
       WHERE f.ativo = 1
       ORDER BY f.nome ASC`
    );
    return rows;
  }

  async criarFerramenta(userId, { codigo, nome, tipo, numero_serie, localizacao, descricao, calibracao_proxima }) {
    const [result] = await pool.execute(
      `INSERT INTO ferramentas (codigo, nome, descricao, tipo, numero_serie, localizacao, calibracao_proxima)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo || null, nome, descricao || null, tipo, numero_serie || null, localizacao || null, calibracao_proxima || null]
    );
    return { id: result.insertId };
  }

  async atualizarFerramenta(userId, id, data) {
    const [[ferr]] = await pool.execute(`SELECT id FROM ferramentas WHERE id = ? AND ativo = 1`, [id]);
    if (!ferr) throw new AppError('Ferramenta não encontrada', HTTP.NOT_FOUND);
    const allowed = ['nome', 'descricao', 'tipo', 'numero_serie', 'localizacao', 'calibracao_proxima', 'status'];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (data[key] !== undefined) { sets.push(`${key} = ?`); params.push(data[key]); }
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE ferramentas SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async checkoutFerramenta(userId, id, { os_id, data_devolucao_prevista, observacao }) {
    const [[ferr]] = await pool.execute(`SELECT id, status FROM ferramentas WHERE id = ? AND ativo = 1`, [id]);
    if (!ferr) throw new AppError('Ferramenta não encontrada', HTTP.NOT_FOUND);
    if (ferr.status !== 'disponivel') throw new AppError('Ferramenta não está disponível para retirada', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE ferramentas SET status = 'em_uso', usuario_atual_id = ? WHERE id = ?`, [userId, id]);
    await pool.execute(
      `INSERT INTO ferramentas_movimentacoes (ferramenta_id, usuario_id, os_id, tipo, data_devolucao_prevista, observacao)
       VALUES (?, ?, ?, 'retirada', ?, ?)`,
      [id, userId, os_id || null, data_devolucao_prevista || null, observacao || null]
    );
    return { ok: true };
  }

  async checkinFerramenta(userId, id, { observacao, avariada }) {
    const [[ferr]] = await pool.execute(`SELECT id, status FROM ferramentas WHERE id = ? AND ativo = 1`, [id]);
    if (!ferr) throw new AppError('Ferramenta não encontrada', HTTP.NOT_FOUND);
    if (ferr.status !== 'em_uso') throw new AppError('Ferramenta não está em uso', HTTP.BAD_REQUEST);
    const novoStatus = avariada ? 'em_manutencao' : 'disponivel';
    const tipoMov = avariada ? 'avaria' : 'devolucao';
    await pool.execute(`UPDATE ferramentas SET status = ?, usuario_atual_id = NULL WHERE id = ?`, [novoStatus, id]);
    await pool.execute(
      `INSERT INTO ferramentas_movimentacoes (ferramenta_id, usuario_id, tipo, data_devolucao_real, observacao)
       VALUES (?, ?, ?, NOW(), ?)`,
      [id, userId, tipoMov, observacao || null]
    );
    return { ok: true };
  }

  // ── Apoio de Outros Setores ───────────────────────────────────────────────────

  async listarApoio({ status } = {}) {
    const st = status || 'pendente';
    const [limpeza] = await pool.execute(
      `SELECT sl.*, u.nome AS solicitante_nome, 'limpeza' AS setor
       FROM solicitacoes_limpeza sl
       LEFT JOIN usuarios u ON u.id = sl.solicitante_id
       WHERE sl.status = ?
       ORDER BY sl.criado_em ASC
       LIMIT 50`,
      [st]
    );
    const [servicos] = await pool.execute(
      `SELECT sg.*, u.nome AS solicitante_nome, 'servicos_gerais' AS setor
       FROM solicitacoes_servicos_gerais sg
       LEFT JOIN usuarios u ON u.id = sg.solicitante_id
       WHERE sg.status = ?
       ORDER BY sg.criado_em ASC
       LIMIT 50`,
      [st]
    );
    return [...limpeza, ...servicos].sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
  }

  async distribuirApoio(userId, tipo, id, { responsavel_id, observacao }) {
    const tabela = tipo === 'limpeza' ? 'solicitacoes_limpeza' : 'solicitacoes_servicos_gerais';
    const [[row]] = await pool.execute(`SELECT id, status FROM ${tabela} WHERE id = ?`, [id]);
    if (!row) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE ${tabela} SET status = 'aceita', atendido_por = ? WHERE id = ?`,
      [responsavel_id, id]
    );
    return { ok: true };
  }

  // ── Jardinagem ────────────────────────────────────────────────────────────────

  async listarJardinagem({ status, mes, ano } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('cj.status = ?'); params.push(status); }
    if (mes && ano) {
      where.push('MONTH(cj.data_agendada) = ? AND YEAR(cj.data_agendada) = ?');
      params.push(Number(mes), Number(ano));
    }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT cj.*, u.nome AS responsavel_nome, c.nome AS criado_por_nome
       FROM cronograma_jardinagem cj
       LEFT JOIN usuarios u ON u.id = cj.responsavel_id
       LEFT JOIN usuarios c ON c.id = cj.criado_por
       ${cond}
       ORDER BY cj.data_agendada ASC`,
      params
    );
    return rows;
  }

  async criarJardinagem(userId, { titulo, tipo, area, data_agendada, recorrencia, responsavel_id, descricao }) {
    const [result] = await pool.execute(
      `INSERT INTO cronograma_jardinagem (titulo, descricao, tipo, area, data_agendada, recorrencia, responsavel_id, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, tipo || 'corte', area || null, data_agendada, recorrencia || 'unica', responsavel_id || null, userId]
    );
    return { id: result.insertId };
  }

  async concluirJardinagem(userId, id, { observacoes } = {}) {
    const [[jard]] = await pool.execute(`SELECT * FROM cronograma_jardinagem WHERE id = ?`, [id]);
    if (!jard) throw new AppError('Agendamento não encontrado', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE cronograma_jardinagem SET status = 'concluido', observacoes = ? WHERE id = ?`,
      [observacoes || null, id]
    );
    if (jard.recorrencia !== 'unica') {
      const next = new Date(jard.data_agendada);
      if (jard.recorrencia === 'semanal')   next.setDate(next.getDate() + 7);
      if (jard.recorrencia === 'quinzenal') next.setDate(next.getDate() + 14);
      if (jard.recorrencia === 'mensal')    next.setMonth(next.getMonth() + 1);
      await pool.execute(
        `INSERT INTO cronograma_jardinagem (titulo, descricao, tipo, area, data_agendada, recorrencia, responsavel_id, criado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [jard.titulo, jard.descricao, jard.tipo, jard.area, next.toISOString().split('T')[0], jard.recorrencia, jard.responsavel_id, userId]
      );
    }
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas({ mes, ano } = {}) {
    const where = [];
    const params = [];
    if (mes && ano) {
      where.push('MONTH(es.data_inicio) = ? AND YEAR(es.data_inicio) = ?');
      params.push(Number(mes), Number(ano));
    }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT es.*,
              COALESCE(u.nome, es.tecnico_nome) AS usuario_nome,
              c.nome AS criado_por_nome
       FROM escalas_servicos es
       LEFT JOIN usuarios u ON u.id = es.usuario_id
       LEFT JOIN usuarios c ON c.id = es.criado_por
       ${cond}
       ORDER BY es.data_inicio ASC`,
      params
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, tecnico_nome, data_inicio, data_fim, turno, tipo, observacoes }) {
    const [result] = await pool.execute(
      `INSERT INTO escalas_servicos (usuario_id, tecnico_nome, data_inicio, data_fim, turno, tipo, observacoes, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, tecnico_nome || null, data_inicio, data_fim,
       turno || 'manha', tipo || 'normal', observacoes || null, userId]
    );
    return { id: result.insertId };
  }

  async excluirEscala(userId, id) {
    const [[esc]] = await pool.execute(`SELECT id, criado_por FROM escalas_servicos WHERE id = ?`, [id]);
    if (!esc) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM escalas_servicos WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Leituras de Medidores ─────────────────────────────────────────────────────

  async listarMedidores({ tipo, mes, ano } = {}) {
    const where = [];
    const params = [];
    if (tipo) { where.push('lm.tipo = ?'); params.push(tipo); }
    if (mes && ano) {
      where.push('MONTH(lm.data_leitura) = ? AND YEAR(lm.data_leitura) = ?');
      params.push(Number(mes), Number(ano));
    }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT lm.*, u.nome AS usuario_nome
       FROM leituras_medidores lm
       LEFT JOIN usuarios u ON u.id = lm.usuario_id
       ${cond}
       ORDER BY lm.tipo, lm.data_leitura DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async criarLeitura(userId, { tipo, ponto, leitura, unidade, data_leitura, observacoes }) {
    const [result] = await pool.execute(
      `INSERT INTO leituras_medidores (tipo, ponto, leitura, unidade, data_leitura, usuario_id, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo, ponto, Number(leitura), unidade || 'kWh', data_leitura, userId, observacoes || null]
    );
    return { id: result.insertId };
  }

  // ── Indicadores MTBF/MTTR/OEE ────────────────────────────────────────────────

  async calcularIndicadores() {
    // MTTR: avg hours open→close for OS concluidas this month
    const [[{ mttr }]] = await pool.execute(
      `SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, data_abertura, data_conclusao)), 0) AS mttr
       FROM ordens_servico
       WHERE status = 'concluida'
         AND MONTH(data_conclusao) = MONTH(CURDATE())
         AND YEAR(data_conclusao) = YEAR(CURDATE())`
    );
    // MTBF: avg days between failures (LAG per row, then average across all gaps)
    const [[{ mtbf }]] = await pool.execute(
      `SELECT COALESCE(AVG(dias), 0) AS mtbf FROM (
         SELECT DATEDIFF(data_abertura,
                  LAG(data_abertura) OVER (PARTITION BY equipamento_id ORDER BY data_abertura)) AS dias
         FROM ordens_servico
         WHERE tipo = 'corretiva' AND equipamento_id IS NOT NULL
       ) t
       WHERE dias IS NOT NULL`
    );
    // OEE approximation
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM equipamentos WHERE status != 'sucata'`);
    const [[{ operacional }]] = await pool.execute(`SELECT COUNT(*) AS operacional FROM equipamentos WHERE status = 'operacional'`);
    const oee = total > 0 ? Math.round((operacional / total) * 100) : 0;
    // OS por tipo
    const [porTipo] = await pool.execute(
      `SELECT tipo, COUNT(*) AS total FROM ordens_servico WHERE status NOT IN ('cancelada') GROUP BY tipo`
    );
    // OS por prioridade
    const [porPrioridade] = await pool.execute(
      `SELECT prioridade, COUNT(*) AS total FROM ordens_servico WHERE status NOT IN ('cancelada') GROUP BY prioridade`
    );
    // OS por mês últimos 6 meses
    const [porMes] = await pool.execute(
      `SELECT DATE_FORMAT(data_abertura, '%Y-%m') AS mes, COUNT(*) AS total
       FROM ordens_servico
       WHERE data_abertura >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(data_abertura, '%Y-%m')
       ORDER BY mes ASC`
    );
    return {
      mtbf: Math.round(Number(mtbf) || 0),
      mttr: Math.round(Number(mttr) || 0),
      oee,
      porTipo,
      porPrioridade,
      porMes,
    };
  }
}

module.exports = new ManutencaoService();
