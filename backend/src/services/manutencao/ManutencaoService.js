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
    const [[{ preventivaProxima }]] = await pool.execute(
      `SELECT COUNT(*) AS preventivaProxima FROM manutencao_preventiva WHERE ativo = 1 AND proxima_data BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );
    const [[{ osConcluida30d }]] = await pool.execute(
      `SELECT COUNT(*) AS osConcluida30d FROM ordens_servico WHERE status = 'concluida' AND data_conclusao >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );
    return { osAberta, osEmAndamento, osAguardando, osCritica, preventivaProxima, osConcluida30d };
  }

  // ── Ordens de Serviço ────────────────────────────────────────────────────────

  async listarOS({ status, prioridade, tipo, equipamento_id } = {}) {
    const where = [];
    const params = [];
    if (status)         { where.push('os.status = ?');         params.push(status); }
    if (prioridade)     { where.push('os.prioridade = ?');     params.push(prioridade); }
    if (tipo)           { where.push('os.tipo = ?');           params.push(tipo); }
    if (equipamento_id) { where.push('os.equipamento_id = ?'); params.push(Number(equipamento_id)); }
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
      `SELECT apt.*, u.nome AS tecnico_nome
       FROM os_apontamentos apt
       LEFT JOIN usuarios u ON u.id = apt.tecnico_id
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

  async atualizarOS(userId, id, { equipamento_id, tipo, prioridade, descricao, motivo_manutencao, causa_raiz, data_previsao, tecnico_id }) {
    const [[os]] = await pool.execute(`SELECT id FROM ordens_servico WHERE id = ?`, [id]);
    if (!os) throw new AppError('OS não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE ordens_servico SET
         equipamento_id    = COALESCE(?, equipamento_id),
         tipo              = COALESCE(?, tipo),
         prioridade        = COALESCE(?, prioridade),
         descricao         = COALESCE(?, descricao),
         motivo_manutencao = COALESCE(?, motivo_manutencao),
         causa_raiz        = COALESCE(?, causa_raiz),
         data_previsao     = COALESCE(?, data_previsao),
         tecnico_id        = COALESCE(?, tecnico_id)
       WHERE id = ?`,
      [equipamento_id || null, tipo || null, prioridade || null, descricao || null,
       motivo_manutencao || null, causa_raiz || null, data_previsao || null,
       tecnico_id || null, id]
    );
    return { ok: true };
  }

  async apontarOS(userId, osId, { data_apontamento, horas_trabalhadas, descricao_servico }) {
    const [[os]] = await pool.execute(`SELECT id FROM ordens_servico WHERE id = ?`, [osId]);
    if (!os) throw new AppError('OS não encontrada', HTTP.NOT_FOUND);
    const [result] = await pool.execute(
      `INSERT INTO os_apontamentos (os_id, tecnico_id, data_apontamento, horas_trabalhadas, descricao_servico)
       VALUES (?, ?, ?, ?, ?)`,
      [osId, userId, data_apontamento, horas_trabalhadas || null, descricao_servico || null]
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
    const allowed = ['titulo','tipo','frequencia_tipo','proxima_data','responsavel_id','ativo','checklist','descricao','duracao_estimada_h'];
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
    const hoje = new Date();
    const next = new Date(hoje);
    const val = mp.frequencia_valor || 1;
    if (mp.frequencia_tipo === 'diaria')     next.setDate(next.getDate() + val);
    else if (mp.frequencia_tipo === 'semanal')    next.setDate(next.getDate() + 7 * val);
    else if (mp.frequencia_tipo === 'quinzenal')  next.setDate(next.getDate() + 14);
    else if (mp.frequencia_tipo === 'mensal')     next.setMonth(next.getMonth() + val);
    else if (mp.frequencia_tipo === 'trimestral') next.setMonth(next.getMonth() + 3);
    else if (mp.frequencia_tipo === 'semestral')  next.setMonth(next.getMonth() + 6);
    else if (mp.frequencia_tipo === 'anual')      next.setFullYear(next.getFullYear() + 1);
    const nextStr = next.toISOString().split('T')[0];
    await pool.execute(
      `UPDATE manutencao_preventiva SET ultima_data = CURDATE(), proxima_data = ? WHERE id = ?`,
      [nextStr, id]
    );
    const codigo = 'OS-PREV-' + Date.now().toString(36).toUpperCase();
    await pool.execute(
      `INSERT INTO ordens_servico (codigo, solicitante_id, equipamento_id, tipo, prioridade, descricao, status, data_abertura, data_conclusao)
       VALUES (?, ?, ?, 'preventiva', 'media', ?, 'concluida', NOW(), NOW())`,
      [codigo, userId, mp.equipamento_id || null, `Execução preventiva: ${mp.titulo}${observacoes ? ' — ' + observacoes : ''}`]
    );
    return { ok: true, proxima_data: nextStr };
  }

  // ── Equipamentos ──────────────────────────────────────────────────────────────

  async listarEquipamentos({ status, departamento_id } = {}) {
    const where = [];
    const params = [];
    if (status)          { where.push('e.status = ?');          params.push(status); }
    if (departamento_id) { where.push('e.departamento_id = ?'); params.push(Number(departamento_id)); }
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

  async criarEquipamento(userId, { codigo, nome, tipo, departamento_id, marca, modelo, numero_serie, data_aquisicao, localizacao }) {
    if (codigo) {
      const [[exist]] = await pool.execute(`SELECT id FROM equipamentos WHERE codigo = ?`, [codigo]);
      if (exist) throw new AppError('Código de equipamento já existe', HTTP.CONFLICT);
    }
    const [result] = await pool.execute(
      `INSERT INTO equipamentos (codigo, nome, tipo, departamento_id, marca, modelo, numero_serie, data_aquisicao, localizacao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'operacional')`,
      [codigo || null, nome, tipo || null, departamento_id || null,
       marca || null, modelo || null, numero_serie || null,
       data_aquisicao || null, localizacao || null]
    );
    return { id: result.insertId };
  }

  async atualizarEquipamento(userId, id, { nome, tipo, departamento_id, marca, modelo, numero_serie, data_aquisicao, localizacao, status, manual_pdf }) {
    const [[equip]] = await pool.execute(`SELECT id FROM equipamentos WHERE id = ?`, [id]);
    if (!equip) throw new AppError('Equipamento não encontrado', HTTP.NOT_FOUND);
    const STATUS_VALIDOS = ['operacional','em_manutencao','inativo','sucata'];
    if (status && !STATUS_VALIDOS.includes(status)) {
      throw new AppError(`Status inválido. Aceitos: ${STATUS_VALIDOS.join(', ')}`, HTTP.BAD_REQUEST);
    }
    await pool.execute(
      `UPDATE equipamentos SET
         nome           = COALESCE(?, nome),
         tipo           = COALESCE(?, tipo),
         departamento_id = COALESCE(?, departamento_id),
         marca          = COALESCE(?, marca),
         modelo         = COALESCE(?, modelo),
         numero_serie   = COALESCE(?, numero_serie),
         data_aquisicao = COALESCE(?, data_aquisicao),
         localizacao    = COALESCE(?, localizacao),
         status         = COALESCE(?, status),
         manual_pdf     = CASE WHEN ? IS NOT NULL THEN ? ELSE manual_pdf END
       WHERE id = ?`,
      [nome || null, tipo || null, departamento_id || null,
       marca || null, modelo || null, numero_serie || null,
       data_aquisicao || null, localizacao || null, status || null,
       manual_pdf || null, manual_pdf || null, id]
    );
    return { id };
  }

  async atualizarFotoEquipamento(id, fotoUrl) {
    const [[equip]] = await pool.execute(`SELECT id FROM equipamentos WHERE id = ?`, [id]);
    if (!equip) throw new AppError('Equipamento não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE equipamentos SET foto_url = ? WHERE id = ?`, [fotoUrl, id]);
    return { id };
  }

  async prontuarioEquipamento(id) {
    const [[equipamento]] = await pool.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!equipamento) throw new AppError('Equipamento não encontrado', HTTP.NOT_FOUND);
    const [os] = await pool.execute(
      `SELECT os.*, u.nome AS tecnico_nome, sol.nome AS solicitante_nome,
              (SELECT COALESCE(SUM(apt.horas_trabalhadas),0) FROM os_apontamentos apt WHERE apt.os_id = os.id) AS total_horas
       FROM ordens_servico os
       LEFT JOIN usuarios u   ON u.id = os.tecnico_id
       LEFT JOIN usuarios sol ON sol.id = os.solicitante_id
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

  // ── Indicadores MTBF/MTTR/OEE ────────────────────────────────────────────────

  async calcularIndicadores() {
    const [[{ mttr }]] = await pool.execute(
      `SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, data_abertura, data_conclusao)), 0) AS mttr
       FROM ordens_servico
       WHERE status = 'concluida'
         AND MONTH(data_conclusao) = MONTH(CURDATE())
         AND YEAR(data_conclusao) = YEAR(CURDATE())`
    );
    const [[{ mtbf }]] = await pool.execute(
      `SELECT COALESCE(AVG(dias), 0) AS mtbf FROM (
         SELECT DATEDIFF(data_abertura,
                  LAG(data_abertura) OVER (PARTITION BY equipamento_id ORDER BY data_abertura)) AS dias
         FROM ordens_servico
         WHERE tipo = 'corretiva' AND equipamento_id IS NOT NULL
       ) t
       WHERE dias IS NOT NULL`
    );
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM equipamentos WHERE status != 'sucata'`);
    const [[{ operacional }]] = await pool.execute(`SELECT COUNT(*) AS operacional FROM equipamentos WHERE status = 'operacional'`);
    const oee = total > 0 ? Math.round((operacional / total) * 100) : 0;
    const [porTipo] = await pool.execute(
      `SELECT tipo, COUNT(*) AS total FROM ordens_servico WHERE status NOT IN ('cancelada') GROUP BY tipo`
    );
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
      porMes,
    };
  }
}

module.exports = new ManutencaoService();
