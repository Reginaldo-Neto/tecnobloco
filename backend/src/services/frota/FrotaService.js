'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class FrotaService {

  async getStats() {
    const [[{ veiculosDisponiveis }]] = await pool.execute(
      `SELECT COUNT(*) AS veiculosDisponiveis FROM veiculos WHERE status = 'disponivel'`
    );
    const [[{ veiculosEmUso }]] = await pool.execute(
      `SELECT COUNT(*) AS veiculosEmUso FROM veiculos WHERE status = 'em_uso'`
    );
    const [[{ manutencoesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS manutencoesPendentes FROM fro_manutencoes WHERE status = 'pendente'`
    );
    const [[{ viagensHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS viagensHoje FROM viagens WHERE DATE(data_saida) = CURDATE()`
    );
    return { veiculosDisponiveis, veiculosEmUso, manutencoesPendentes, viagensHoje };
  }

  // ── Veículos ──────────────────────────────────────────────────────────────────

  async listarVeiculos({ status } = {}) {
    const where = status ? 'WHERE v.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT v.*, d.nome AS departamento_nome FROM veiculos v
       LEFT JOIN departamentos d ON d.id = v.departamento_id
       ${where} ORDER BY v.placa`, params
    );
    return rows;
  }

  async criarVeiculo(userId, { placa, modelo, marca, ano, tipo, combustivel, km_atual, departamento_id }) {
    if (!placa) throw new AppError('Placa obrigatória', HTTP.BAD_REQUEST);
    const [[ex]] = await pool.execute(`SELECT id FROM veiculos WHERE placa = ?`, [placa.toUpperCase()]);
    if (ex) throw new AppError('Placa já cadastrada', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO veiculos (placa, modelo, marca, ano, tipo, combustivel, km_atual, departamento_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [placa.toUpperCase(), modelo || null, marca || null, ano || null,
       tipo || 'carro', combustivel || 'flex', km_atual || 0, departamento_id || null]
    );
    return { id: res.insertId };
  }

  async atualizarVeiculo(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM veiculos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Veículo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['modelo', 'marca', 'ano', 'tipo', 'combustivel', 'km_atual', 'status', 'departamento_id'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE veiculos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Viagens ───────────────────────────────────────────────────────────────────

  async listarViagens({ veiculo_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (veiculo_id) { where.push('v.veiculo_id = ?');   params.push(veiculo_id); }
    if (status)     { where.push('v.status = ?');        params.push(status); }
    const [rows] = await pool.execute(
      `SELECT v.*, ve.placa, ve.modelo, u.nome AS motorista_nome,
              IF(v.km_chegada IS NOT NULL AND v.km_saida IS NOT NULL, v.km_chegada - v.km_saida, NULL) AS km_percorridos
       FROM viagens v
       LEFT JOIN veiculos ve ON ve.id = v.veiculo_id
       LEFT JOIN usuarios u ON u.id = v.motorista_id
       WHERE ${where.join(' AND ')} ORDER BY v.data_saida DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarViagem(userId, { veiculo_id, motorista_id, destino, km_saida, data_saida, motivo }) {
    if (!veiculo_id || !destino) throw new AppError('Veículo e destino obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO viagens (veiculo_id, motorista_id, destino, km_saida, data_saida, motivo, status)
       VALUES (?, ?, ?, ?, ?, ?, 'agendada')`,
      [veiculo_id, motorista_id || userId, destino, km_saida || null, data_saida || null, motivo || null]
    );
    await pool.execute(`UPDATE veiculos SET status = 'em_uso' WHERE id = ?`, [veiculo_id]);
    return { id: res.insertId };
  }

  async finalizarViagem(id, { km_chegada, data_chegada, observacao }) {
    const [[row]] = await pool.execute(`SELECT * FROM viagens WHERE id = ?`, [id]);
    if (!row) throw new AppError('Viagem não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE viagens SET status = 'concluida', km_chegada = ?, data_chegada = ?, observacao = COALESCE(?, observacao) WHERE id = ?`,
      [km_chegada || null, data_chegada || new Date().toISOString().split('T')[0], observacao || null, id]
    );
    if (km_chegada) {
      await pool.execute(`UPDATE veiculos SET km_atual = ?, status = 'disponivel' WHERE id = ?`, [km_chegada, row.veiculo_id]);
    } else {
      await pool.execute(`UPDATE veiculos SET status = 'disponivel' WHERE id = ?`, [row.veiculo_id]);
    }
    return { ok: true };
  }

  // ── Abastecimentos ────────────────────────────────────────────────────────────

  async listarAbastecimentos({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE a.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT a.*, v.placa, u.nome AS abastecido_por_nome
       FROM fro_abastecimentos a
       LEFT JOIN veiculos v ON v.id = a.veiculo_id
       LEFT JOIN usuarios u ON u.id = a.abastecido_por
       ${where} ORDER BY a.data_abastecimento DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAbastecimento(userId, { veiculo_id, data_abastecimento, litros, valor_total, km_atual, tipo_combustivel, posto }) {
    if (!veiculo_id || !litros) throw new AppError('Veículo e litros obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_abastecimentos (veiculo_id, data_abastecimento, litros, valor_total, km_atual, tipo_combustivel, posto, abastecido_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, data_abastecimento || new Date().toISOString().split('T')[0],
       litros, valor_total || null, km_atual || null, tipo_combustivel || null, posto || null, userId]
    );
    if (km_atual) {
      await pool.execute(`UPDATE veiculos SET km_atual = ? WHERE id = ?`, [km_atual, veiculo_id]);
    }
    return { id: res.insertId };
  }

  // ── Manutenções ───────────────────────────────────────────────────────────────

  async listarManutencoes({ veiculo_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (veiculo_id) { where.push('m.veiculo_id = ?'); params.push(veiculo_id); }
    if (status)     { where.push('m.status = ?');     params.push(status); }
    const [rows] = await pool.execute(
      `SELECT m.*, v.placa, u.nome AS solicitado_por_nome
       FROM fro_manutencoes m
       LEFT JOIN veiculos v ON v.id = m.veiculo_id
       LEFT JOIN usuarios u ON u.id = m.solicitado_por
       WHERE ${where.join(' AND ')} ORDER BY m.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarManutencao(userId, { veiculo_id, tipo, descricao, valor_estimado, km_atual, fornecedor }) {
    if (!veiculo_id || !descricao) throw new AppError('Veículo e descrição obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_manutencoes (veiculo_id, tipo, descricao, valor_estimado, km_atual, fornecedor, status, solicitado_por)
       VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?)`,
      [veiculo_id, tipo || 'corretiva', descricao, valor_estimado || null, km_atual || null, fornecedor || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarManutencao(id, { status, valor_real, data_conclusao, observacao }) {
    const [[row]] = await pool.execute(`SELECT id, veiculo_id FROM fro_manutencoes WHERE id = ?`, [id]);
    if (!row) throw new AppError('Manutenção não encontrada', HTTP.NOT_FOUND);
    const sets = ['status = ?']; const params = [status];
    if (valor_real !== undefined)    { sets.push('valor_real = ?');    params.push(valor_real); }
    if (data_conclusao !== undefined){ sets.push('data_conclusao = ?');params.push(data_conclusao); }
    if (observacao !== undefined)    { sets.push('observacao = ?');    params.push(observacao); }
    params.push(id);
    await pool.execute(`UPDATE fro_manutencoes SET ${sets.join(', ')} WHERE id = ?`, params);
    if (status === 'concluida') {
      await pool.execute(`UPDATE veiculos SET status = 'disponivel' WHERE id = ? AND status = 'manutencao'`, [row.veiculo_id]);
    }
    return { ok: true };
  }

  // ── Multas ────────────────────────────────────────────────────────────────────

  async listarMultas({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE m.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT m.*, v.placa, u.nome AS motorista_nome
       FROM fro_multas m
       LEFT JOIN veiculos v ON v.id = m.veiculo_id
       LEFT JOIN usuarios u ON u.id = m.motorista_id
       ${where} ORDER BY m.data_infracao DESC LIMIT 200`, params
    );
    return rows;
  }

  async atualizarMulta(id, { status_pagamento, pontos, valor }) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_multas WHERE id = ?`, [id]);
    if (!row) throw new AppError('Multa não encontrada', HTTP.NOT_FOUND);
    const sets = []; const params = [];
    if (status_pagamento !== undefined) { sets.push('status_pagamento = ?'); params.push(status_pagamento); }
    if (pontos !== undefined)           { sets.push('pontos = ?');           params.push(pontos); }
    if (valor !== undefined)            { sets.push('valor = ?');            params.push(valor); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_multas SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async registrarMulta(userId, { veiculo_id, motorista_id, data_infracao, descricao, valor, pontos, status_pagamento }) {
    if (!veiculo_id || !descricao) throw new AppError('Veículo e descrição obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_multas (veiculo_id, motorista_id, data_infracao, descricao, valor, pontos, status_pagamento, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, motorista_id || null, data_infracao, descricao, valor || null, pontos || null, status_pagamento || 'pendente', userId]
    );
    return { id: res.insertId };
  }

  // ── Checklists ────────────────────────────────────────────────────────────────

  async listarChecklists({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE c.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, v.placa, u.nome AS usuario_nome
       FROM fro_checklists c
       LEFT JOIN veiculos v ON v.id = c.veiculo_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       ${where} ORDER BY c.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarChecklist(userId, { veiculo_id, tipo, itens_ok, itens_nok, km_atual, observacao }) {
    if (!veiculo_id) throw new AppError('Veículo obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_checklists (veiculo_id, usuario_id, tipo, itens_ok, itens_nok, km_atual, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, userId, tipo || 'pre_viagem', JSON.stringify(itens_ok || []),
       JSON.stringify(itens_nok || []), km_atual || null, observacao || null]
    );
    return { id: res.insertId };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir
       FROM fro_escalas e LEFT JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    await pool.execute(`DELETE FROM fro_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarMotoristas() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome FROM usuarios u
       INNER JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1 AND d.nome = 'Frota'
       UNION
       SELECT u.id, u.nome FROM usuarios u WHERE u.ativo = 1
       ORDER BY nome LIMIT 100`
    );
    return rows;
  }

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM usuarios WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async recentesViagens() {
    const [rows] = await pool.execute(
      `SELECT v.*, ve.placa, u.nome AS motorista_nome FROM viagens v
       LEFT JOIN veiculos ve ON ve.id = v.veiculo_id
       LEFT JOIN usuarios u ON u.id = v.motorista_id
       ORDER BY v.data_saida DESC LIMIT 10`
    );
    return rows;
  }

  // ── Motoristas / CNH ─────────────────────────────────────────────────────────

  async listarMotoristasCNH({ status } = {}) {
    const where = status ? 'WHERE m.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT m.*, u.nome AS usuario_nome FROM fro_motoristas m
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ${where} ORDER BY m.nome LIMIT 200`, params
    );
    return rows;
  }

  async criarMotorista(userId, { usuario_id, nome, cpf, cnh_numero, cnh_categoria, cnh_validade,
    cnh_primeira_habilitacao, toxicologico_validade, aso_validade, status, observacao }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_motoristas (usuario_id, nome, cpf, cnh_numero, cnh_categoria, cnh_validade,
       cnh_primeira_habilitacao, toxicologico_validade, aso_validade, status, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome, cpf || null, cnh_numero || null, cnh_categoria || null,
       cnh_validade || null, cnh_primeira_habilitacao || null, toxicologico_validade || null,
       aso_validade || null, status || 'ativo', observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarMotorista(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_motoristas WHERE id = ?`, [id]);
    if (!row) throw new AppError('Motorista não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome','cpf','cnh_numero','cnh_categoria','cnh_validade','cnh_primeira_habilitacao',
      'toxicologico_validade','aso_validade','status','observacao','usuario_id'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_motoristas SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Rotas (coleta e entrega) ──────────────────────────────────────────────────

  async listarRotas({ tipo, status } = {}) {
    const where = ['1=1']; const params = [];
    if (tipo)   { where.push('r.tipo = ?');   params.push(tipo); }
    if (status) { where.push('r.status = ?'); params.push(status); }
    const [rows] = await pool.execute(
      `SELECT r.*, v.placa AS veiculo_padrao_placa, u.nome AS criado_por_nome
       FROM fro_rotas r
       LEFT JOIN veiculos v ON v.id = r.veiculo_padrao_id
       LEFT JOIN usuarios u ON u.id = r.criado_por
       WHERE ${where.join(' AND ')} ORDER BY r.nome LIMIT 200`, params
    );
    return rows;
  }

  async criarRota(userId, { tipo, nome, descricao, pontos, km_total, tempo_estimado_min, veiculo_padrao_id }) {
    if (!tipo || !nome) throw new AppError('Tipo e nome obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_rotas (tipo, nome, descricao, pontos, km_total, tempo_estimado_min, veiculo_padrao_id, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, nome, descricao || null, pontos ? JSON.stringify(pontos) : null,
       km_total || null, tempo_estimado_min || null, veiculo_padrao_id || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarRota(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_rotas WHERE id = ?`, [id]);
    if (!row) throw new AppError('Rota não encontrada', HTTP.NOT_FOUND);
    const allowed = ['nome','descricao','km_total','tempo_estimado_min','veiculo_padrao_id','status'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (data.pontos !== undefined) { sets.push('pontos = ?'); params.push(JSON.stringify(data.pontos)); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_rotas SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirRota(id) {
    await pool.execute(`DELETE FROM fro_rotas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Consumo ───────────────────────────────────────────────────────────────────

  async consumoVeiculos({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE a.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT v.placa, v.modelo,
         COUNT(a.id) AS total_abastecimentos,
         SUM(a.litros) AS total_litros,
         SUM(a.valor_total) AS custo_total,
         MAX(a.km_atual) - MIN(a.km_atual) AS km_rodados,
         ROUND((MAX(a.km_atual) - MIN(a.km_atual)) / NULLIF(SUM(a.litros),0), 2) AS km_por_litro
       FROM fro_abastecimentos a
       LEFT JOIN veiculos v ON v.id = a.veiculo_id
       ${where}
       GROUP BY a.veiculo_id, v.placa, v.modelo
       ORDER BY v.placa`, params
    );
    return rows;
  }

  // ── Depreciação ───────────────────────────────────────────────────────────────

  async depreciacaoVeiculos() {
    const [rows] = await pool.execute(
      `SELECT v.id, v.placa, v.modelo, v.marca, v.ano, v.km_atual,
         YEAR(CURDATE()) - v.ano AS idade_anos,
         ROUND(((YEAR(CURDATE()) - v.ano) / 10.0) * 100, 1) AS depreciacao_pct
       FROM veiculos v WHERE v.status != 'inativo' OR v.status IS NULL
       ORDER BY v.placa`
    );
    return rows;
  }

  // ── Solicitações de Uso ───────────────────────────────────────────────────────

  async listarSolicitacoesUso({ status } = {}) {
    const where = status ? 'WHERE s.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT s.*, u.nome AS solicitante_nome, a.nome AS aprovador_nome,
         v.placa AS veiculo_atendido_placa
       FROM fro_solicitacoes_uso s
       LEFT JOIN usuarios u ON u.id = s.solicitante_id
       LEFT JOIN usuarios a ON a.id = s.aprovado_por
       LEFT JOIN veiculos v ON v.id = s.veiculo_atendido_id
       ${where} ORDER BY s.data_necessidade DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarSolicitacaoUso(userId, { departamento_origem, veiculo_solicitado_id, data_necessidade,
    hora_saida, hora_retorno, destino, motivo }) {
    if (!destino || !data_necessidade) throw new AppError('Destino e data necessidade obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_solicitacoes_uso (solicitante_id, departamento_origem, veiculo_solicitado_id,
       data_solicitacao, data_necessidade, hora_saida, hora_retorno, destino, motivo)
       VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
      [userId, departamento_origem || null, veiculo_solicitado_id || null,
       data_necessidade, hora_saida || null, hora_retorno || null, destino, motivo || null]
    );
    return { id: res.insertId };
  }

  async responderSolicitacaoUso(id, userId, { status, veiculo_atendido_id, observacao_gestor }) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_solicitacoes_uso WHERE id = ?`, [id]);
    if (!row) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE fro_solicitacoes_uso SET status = ?, aprovado_por = ?, veiculo_atendido_id = ?, observacao_gestor = ? WHERE id = ?`,
      [status, userId, veiculo_atendido_id || null, observacao_gestor || null, id]
    );
    return { ok: true };
  }

  // ── Localização ───────────────────────────────────────────────────────────────

  async localizacaoMotoristas() {
    const [rows] = await pool.execute(
      `SELECT v.id AS viagem_id, v.destino, v.data_saida, v.status AS viagem_status,
         ve.placa, ve.modelo, u.nome AS motorista_nome
       FROM viagens v
       LEFT JOIN veiculos ve ON ve.id = v.veiculo_id
       LEFT JOIN usuarios u ON u.id = v.motorista_id
       WHERE v.status IN ('em_andamento','agendada')
       ORDER BY v.data_saida DESC LIMIT 50`
    );
    return rows;
  }

  // ── Dados Técnicos ────────────────────────────────────────────────────────────

  async listarDadosTecnicos({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE d.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT d.*, v.placa, u.nome AS registrado_por_nome FROM fro_dados_tecnicos d
       LEFT JOIN veiculos v ON v.id = d.veiculo_id
       LEFT JOIN usuarios u ON u.id = d.registrado_por
       ${where} ORDER BY d.data_registro DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarDadosTecnicos(userId, { veiculo_id, data_registro, km_odometro, nivel_oleo,
    nivel_agua, nivel_arla, pressao_pneus, freios, iluminacao, observacoes }) {
    if (!veiculo_id) throw new AppError('Veículo obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_dados_tecnicos (veiculo_id, data_registro, km_odometro, nivel_oleo, nivel_agua,
       nivel_arla, pressao_pneus, freios, iluminacao, observacoes, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, data_registro || new Date().toISOString().split('T')[0],
       km_odometro || null, nivel_oleo || 'ok', nivel_agua || 'ok',
       nivel_arla || 'ok', pressao_pneus || null, freios || 'ok', iluminacao || 'ok',
       observacoes || null, userId]
    );
    if (km_odometro) await pool.execute(`UPDATE veiculos SET km_atual = ? WHERE id = ?`, [km_odometro, veiculo_id]);
    return { id: res.insertId };
  }

  // ── Plano Preventiva ──────────────────────────────────────────────────────────

  async listarPlanoPreventiva({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE p.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT p.*, v.placa, v.km_atual FROM fro_plano_preventiva p
       LEFT JOIN veiculos v ON v.id = p.veiculo_id
       ${where} ORDER BY p.status DESC, p.data_proxima ASC LIMIT 200`, params
    );
    return rows;
  }

  async criarPlanoPreventiva(userId, { veiculo_id, tipo_servico, descricao, intervalo_km,
    intervalo_dias, km_ultima_execucao, data_ultima_execucao }) {
    if (!veiculo_id || !tipo_servico) throw new AppError('Veículo e tipo de serviço obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_plano_preventiva (veiculo_id, tipo_servico, descricao, intervalo_km,
       intervalo_dias, km_ultima_execucao, data_ultima_execucao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, tipo_servico, descricao || null, intervalo_km || null,
       intervalo_dias || null, km_ultima_execucao || null, data_ultima_execucao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarPlanoPreventiva(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_plano_preventiva WHERE id = ?`, [id]);
    if (!row) throw new AppError('Plano não encontrado', HTTP.NOT_FOUND);
    const allowed = ['tipo_servico','descricao','intervalo_km','intervalo_dias',
      'km_ultima_execucao','data_ultima_execucao','status'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_plano_preventiva SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirPlanoPreventiva(id) {
    await pool.execute(`DELETE FROM fro_plano_preventiva WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Pneus ─────────────────────────────────────────────────────────────────────

  async listarPneus({ veiculo_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (veiculo_id) { where.push('p.veiculo_id = ?'); params.push(veiculo_id); }
    if (status)     { where.push('p.status = ?');     params.push(status); }
    const [rows] = await pool.execute(
      `SELECT p.*, v.placa FROM fro_pneus p
       LEFT JOIN veiculos v ON v.id = p.veiculo_id
       WHERE ${where.join(' AND ')} ORDER BY p.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarPneu(userId, { veiculo_id, numero_fogo, marca, modelo, dimensao, posicao,
    km_instalacao, data_instalacao, observacao }) {
    const [res] = await pool.execute(
      `INSERT INTO fro_pneus (veiculo_id, numero_fogo, marca, modelo, dimensao, posicao,
       km_instalacao, data_instalacao, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id || null, numero_fogo || null, marca || null, modelo || null,
       dimensao || null, posicao || null, km_instalacao || null, data_instalacao || null,
       observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarPneu(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_pneus WHERE id = ?`, [id]);
    if (!row) throw new AppError('Pneu não encontrado', HTTP.NOT_FOUND);
    const allowed = ['veiculo_id','posicao','status','km_rodados','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_pneus SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Refrigeração ──────────────────────────────────────────────────────────────

  async listarRefrigeracao({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE r.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT r.*, v.placa, u.nome AS registrado_por_nome FROM fro_refrigeracao r
       LEFT JOIN veiculos v ON v.id = r.veiculo_id
       LEFT JOIN usuarios u ON u.id = r.registrado_por
       ${where} ORDER BY r.data_registro DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarRefrigeracao(userId, { veiculo_id, data_registro, tipo, temperatura_set,
    temperatura_real, pressao_alta, pressao_baixa, nivel_gas, descricao, valor, fornecedor, status }) {
    if (!veiculo_id) throw new AppError('Veículo obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_refrigeracao (veiculo_id, data_registro, tipo, temperatura_set, temperatura_real,
       pressao_alta, pressao_baixa, nivel_gas, descricao, valor, fornecedor, status, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, data_registro || new Date().toISOString().split('T')[0],
       tipo || 'preventiva', temperatura_set || null, temperatura_real || null,
       pressao_alta || null, pressao_baixa || null, nivel_gas || 'ok',
       descricao || null, valor || null, fornecedor || null, status || 'ok', userId]
    );
    return { id: res.insertId };
  }

  // ── Higienização Tanques ──────────────────────────────────────────────────────

  async listarHigienizacoesTanque({ veiculo_id } = {}) {
    const where = veiculo_id ? 'WHERE h.veiculo_id = ?' : '';
    const params = veiculo_id ? [veiculo_id] : [];
    const [rows] = await pool.execute(
      `SELECT h.*, v.placa, u.nome AS realizado_por_nome, a.nome AS aprovado_por_nome
       FROM fro_higienizacoes_tanque h
       LEFT JOIN veiculos v ON v.id = h.veiculo_id
       LEFT JOIN usuarios u ON u.id = h.realizado_por
       LEFT JOIN usuarios a ON a.id = h.aprovado_por
       ${where} ORDER BY h.data_higienizacao DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarHigienizacaoTanque(userId, { veiculo_id, data_higienizacao, tipo,
    produto_quimico, concentracao, temperatura_agua, duracao_min, volume_agua_litros, observacao }) {
    if (!veiculo_id) throw new AppError('Veículo obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_higienizacoes_tanque (veiculo_id, data_higienizacao, tipo, produto_quimico,
       concentracao, temperatura_agua, duracao_min, volume_agua_litros, observacao, realizado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, data_higienizacao || new Date().toISOString().replace('T',' ').split('.')[0],
       tipo || 'CIP', produto_quimico || null, concentracao || null, temperatura_agua || null,
       duracao_min || null, volume_agua_litros || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async aprovarHigienizacaoTanque(id, userId) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_higienizacoes_tanque WHERE id = ?`, [id]);
    if (!row) throw new AppError('Registro não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE fro_higienizacoes_tanque SET aprovado = 1, aprovado_por = ? WHERE id = ?`, [userId, id]);
    return { ok: true };
  }

  // ── Pedágios ──────────────────────────────────────────────────────────────────

  async listarPedagios({ veiculo_id, conciliado } = {}) {
    const where = ['1=1']; const params = [];
    if (veiculo_id)           { where.push('p.veiculo_id = ?');   params.push(veiculo_id); }
    if (conciliado !== undefined) { where.push('p.conciliado = ?'); params.push(Number(conciliado)); }
    const [rows] = await pool.execute(
      `SELECT p.*, v.placa, u.nome AS registrado_por_nome FROM fro_pedagogios p
       LEFT JOIN veiculos v ON v.id = p.veiculo_id
       LEFT JOIN usuarios u ON u.id = p.registrado_por
       WHERE ${where.join(' AND ')} ORDER BY p.data_passagem DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarPedagio(userId, { veiculo_id, tag_semparar, data_passagem, praca, rodovia, valor, viagem_id }) {
    if (!valor) throw new AppError('Valor obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_pedagogios (veiculo_id, tag_semparar, data_passagem, praca, rodovia, valor, viagem_id, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id || null, tag_semparar || null,
       data_passagem || new Date().toISOString().replace('T',' ').split('.')[0],
       praca || null, rodovia || null, valor, viagem_id || null, userId]
    );
    return { id: res.insertId };
  }

  async conciliarPedagio(id) {
    await pool.execute(`UPDATE fro_pedagogios SET conciliado = 1 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Sinistros ─────────────────────────────────────────────────────────────────

  async listarSinistros({ veiculo_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (veiculo_id) { where.push('s.veiculo_id = ?'); params.push(veiculo_id); }
    if (status)     { where.push('s.status = ?');     params.push(status); }
    const [rows] = await pool.execute(
      `SELECT s.*, v.placa, u.nome AS registrado_por_nome, m.nome AS motorista_nome
       FROM fro_sinistros s
       LEFT JOIN veiculos v ON v.id = s.veiculo_id
       LEFT JOIN usuarios u ON u.id = s.registrado_por
       LEFT JOIN usuarios m ON m.id = s.motorista_id
       WHERE ${where.join(' AND ')} ORDER BY s.data_sinistro DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarSinistro(userId, { veiculo_id, motorista_id, data_sinistro, tipo, local, descricao,
    terceiros_envolvidos, boletim_ocorrencia, seguradora, numero_sinistro, valor_prejuizo }) {
    if (!veiculo_id || !descricao || !tipo) throw new AppError('Veículo, tipo e descrição obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_sinistros (veiculo_id, motorista_id, data_sinistro, tipo, local, descricao,
       terceiros_envolvidos, boletim_ocorrencia, seguradora, numero_sinistro, valor_prejuizo, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, motorista_id || null, data_sinistro, tipo, local || null, descricao,
       terceiros_envolvidos ? 1 : 0, boletim_ocorrencia || null, seguradora || null,
       numero_sinistro || null, valor_prejuizo || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarSinistro(id, { status, seguradora, numero_sinistro, valor_prejuizo }) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_sinistros WHERE id = ?`, [id]);
    if (!row) throw new AppError('Sinistro não encontrado', HTTP.NOT_FOUND);
    const sets = []; const params = [];
    if (status !== undefined)          { sets.push('status = ?');          params.push(status); }
    if (seguradora !== undefined)      { sets.push('seguradora = ?');      params.push(seguradora); }
    if (numero_sinistro !== undefined) { sets.push('numero_sinistro = ?'); params.push(numero_sinistro); }
    if (valor_prejuizo !== undefined)  { sets.push('valor_prejuizo = ?');  params.push(valor_prejuizo); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_sinistros SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Tanques Comunitários ──────────────────────────────────────────────────────

  async listarTanquesComunitarios({ status } = {}) {
    const where = status ? 'WHERE status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT * FROM fro_tanques_comunitarios ${where} ORDER BY municipio, nome LIMIT 200`, params
    );
    return rows;
  }

  async criarTanqueComunitario(userId, { nome, municipio, capacidade_litros, latitude, longitude, responsavel, telefone, observacao }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO fro_tanques_comunitarios (nome, municipio, capacidade_litros, latitude, longitude, responsavel, telefone, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, municipio || null, capacidade_litros || null, latitude || null, longitude || null,
       responsavel || null, telefone || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarTanqueComunitario(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM fro_tanques_comunitarios WHERE id = ?`, [id]);
    if (!row) throw new AppError('Tanque não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome','municipio','capacidade_litros','latitude','longitude','responsavel','telefone','status','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE fro_tanques_comunitarios SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Captação (Histórico de Coletas) ───────────────────────────────────────────

  async historicoCaptacao({ data_inicio, data_fim, veiculo_id } = {}) {
    const where = ['1=1']; const params = [];
    if (data_inicio) { where.push('DATE(v.data_saida) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(v.data_saida) <= ?'); params.push(data_fim); }
    if (veiculo_id)  { where.push('v.veiculo_id = ?');        params.push(veiculo_id); }
    const [rows] = await pool.execute(
      `SELECT v.*, ve.placa, u.nome AS motorista_nome
       FROM viagens v
       LEFT JOIN veiculos ve ON ve.id = v.veiculo_id
       LEFT JOIN usuarios u ON u.id = v.motorista_id
       WHERE ${where.join(' AND ')}
       ORDER BY v.data_saida DESC LIMIT 300`, params
    );
    return rows;
  }

  // ── Pesagens ──────────────────────────────────────────────────────────────────

  async listarPesagens({ veiculo_id, status_divergencia } = {}) {
    const where = ['1=1']; const params = [];
    if (veiculo_id)          { where.push('p.veiculo_id = ?');          params.push(veiculo_id); }
    if (status_divergencia)  { where.push('p.status_divergencia = ?');  params.push(status_divergencia); }
    const [rows] = await pool.execute(
      `SELECT p.*, v.placa, u.nome AS registrado_por_nome FROM fro_pesagens p
       LEFT JOIN veiculos v ON v.id = p.veiculo_id
       LEFT JOIN usuarios u ON u.id = p.registrado_por
       WHERE ${where.join(' AND ')} ORDER BY p.data_pesagem DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarPesagem(userId, { veiculo_id, viagem_id, motorista_id, data_pesagem,
    peso_bruto, peso_tara, volume_nota_fiscal, observacao }) {
    if (!veiculo_id) throw new AppError('Veículo obrigatório', HTTP.BAD_REQUEST);
    const peso_liquido = (peso_bruto && peso_tara) ? peso_bruto - peso_tara : null;
    const divergencia  = (peso_liquido !== null && volume_nota_fiscal) ? peso_liquido - volume_nota_fiscal : null;
    let status_divergencia = 'ok';
    if (divergencia !== null) {
      if (Math.abs(divergencia) > 50)  status_divergencia = 'critico';
      else if (Math.abs(divergencia) > 10) status_divergencia = 'divergente';
    }
    const [res] = await pool.execute(
      `INSERT INTO fro_pesagens (veiculo_id, viagem_id, motorista_id, data_pesagem,
       peso_bruto, peso_tara, volume_nota_fiscal, status_divergencia, observacao, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculo_id, viagem_id || null, motorista_id || null,
       data_pesagem || new Date().toISOString().replace('T',' ').split('.')[0],
       peso_bruto || null, peso_tara || null, volume_nota_fiscal || null,
       status_divergencia, observacao || null, userId]
    );
    return { id: res.insertId, peso_liquido, divergencia, status_divergencia };
  }

  // ── Painel de Alertas ─────────────────────────────────────────────────────────

  async painelAlertas() {
    const hoje = new Date().toISOString().split('T')[0];
    const em30Dias = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const [[cnh_vencidas]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_motoristas WHERE cnh_validade < ? AND status = 'ativo'`, [hoje]
    );
    const [[cnh_proximas]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_motoristas WHERE cnh_validade BETWEEN ? AND ? AND status = 'ativo'`, [hoje, em30Dias]
    );
    const [[toxicologico_vencido]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_motoristas WHERE toxicologico_validade < ? AND status = 'ativo'`, [hoje]
    );
    const [[preventivas_vencidas]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_plano_preventiva WHERE status = 'vencido'`
    );
    const [[preventivas_proximas]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_plano_preventiva WHERE status = 'proximo'`
    );
    const [[sinistros_abertos]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_sinistros WHERE status IN ('aberto','em_analise')`
    );
    const [[multas_pendentes]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_multas WHERE status_pagamento = 'pendente'`
    );
    const [[manutencoes_pendentes]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM fro_manutencoes WHERE status IN ('pendente','em_andamento')`
    );
    const [cnh_lista] = await pool.execute(
      `SELECT nome, cnh_validade, toxicologico_validade FROM fro_motoristas
       WHERE (cnh_validade <= ? OR toxicologico_validade < ?) AND status = 'ativo'
       ORDER BY cnh_validade ASC LIMIT 10`, [em30Dias, hoje]
    );
    const [prev_lista] = await pool.execute(
      `SELECT p.tipo_servico, p.status, v.placa, p.km_proxima, p.data_proxima
       FROM fro_plano_preventiva p
       LEFT JOIN veiculos v ON v.id = p.veiculo_id
       WHERE p.status IN ('vencido','proximo')
       ORDER BY p.status DESC, p.data_proxima ASC LIMIT 10`
    );

    return {
      resumo: {
        cnh_vencidas: cnh_vencidas.total,
        cnh_proximas: cnh_proximas.total,
        toxicologico_vencido: toxicologico_vencido.total,
        preventivas_vencidas: preventivas_vencidas.total,
        preventivas_proximas: preventivas_proximas.total,
        sinistros_abertos: sinistros_abertos.total,
        multas_pendentes: multas_pendentes.total,
        manutencoes_pendentes: manutencoes_pendentes.total,
      },
      cnh_lista,
      prev_lista,
    };
  }

  // ── Relatório de Custos ────────────────────────────────────────────────────────

  async relatorioCustos({ data_inicio, data_fim } = {}) {
    const di = data_inicio || new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const df = data_fim || new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT
         v.id, v.placa, v.modelo, v.marca,
         COALESCE(ab.total_litros, 0) AS total_litros,
         COALESCE(ab.custo_abastecimento, 0) AS custo_abastecimento,
         COALESCE(ab.num_abastecimentos, 0) AS num_abastecimentos,
         COALESCE(mn.custo_manutencao, 0) AS custo_manutencao,
         COALESCE(mn.num_manutencoes, 0) AS num_manutencoes,
         COALESCE(mt.custo_multas, 0) AS custo_multas,
         COALESCE(mt.num_multas, 0) AS num_multas,
         COALESCE(ab.custo_abastecimento, 0) + COALESCE(mn.custo_manutencao, 0) + COALESCE(mt.custo_multas, 0) AS custo_total
       FROM veiculos v
       LEFT JOIN (
         SELECT veiculo_id,
           SUM(litros) AS total_litros,
           SUM(valor_total) AS custo_abastecimento,
           COUNT(*) AS num_abastecimentos
         FROM fro_abastecimentos
         WHERE data_abastecimento BETWEEN ? AND ?
         GROUP BY veiculo_id
       ) ab ON ab.veiculo_id = v.id
       LEFT JOIN (
         SELECT veiculo_id,
           SUM(COALESCE(valor_real, valor_estimado)) AS custo_manutencao,
           COUNT(*) AS num_manutencoes
         FROM fro_manutencoes
         WHERE criado_em BETWEEN ? AND ?
         GROUP BY veiculo_id
       ) mn ON mn.veiculo_id = v.id
       LEFT JOIN (
         SELECT veiculo_id,
           SUM(valor) AS custo_multas,
           COUNT(*) AS num_multas
         FROM fro_multas
         WHERE data_infracao BETWEEN ? AND ?
         GROUP BY veiculo_id
       ) mt ON mt.veiculo_id = v.id
       WHERE v.status != 'inativo'
       ORDER BY custo_total DESC`,
      [di, df, di, df, di, df]
    );
    return { periodo: { data_inicio: di, data_fim: df }, veiculos: rows };
  }

  // ── Qualidade do Leite ────────────────────────────────────────────────────────

  async qualidadeLeiteProdutor() {
    // Reads from qualidade module tables if available
    const [rows] = await pool.execute(
      `SELECT v.id AS veiculo_id, v.placa,
         COUNT(vi.id) AS total_viagens,
         MAX(vi.data_saida) AS ultima_coleta
       FROM veiculos v
       LEFT JOIN viagens vi ON vi.veiculo_id = v.id AND vi.status = 'concluida'
       WHERE v.tipo IN ('caminhao','tanque') OR 1=1
       GROUP BY v.id, v.placa
       ORDER BY v.placa LIMIT 50`
    );
    return rows;
  }
}

module.exports = new FrotaService();
