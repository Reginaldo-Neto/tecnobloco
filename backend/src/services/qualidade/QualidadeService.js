'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class QualidadeService {

  async getStats() {
    const [[{ laudosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS laudosPendentes FROM laudos_qualidade WHERE resultado = 'condicional'`
    );
    const [[{ ncAbertas }]] = await pool.execute(
      `SELECT COUNT(*) AS ncAbertas FROM qua_nao_conformidades
       WHERE status IN ('aberta','em_investigacao','acao_pendente')`
    );
    const [[{ analisesHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS analisesHoje FROM qua_analises_leite WHERE DATE(data_analise) = CURDATE()`
    );
    const [[{ reprovadosHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS reprovadosHoje FROM qua_analises_leite
       WHERE DATE(data_analise) = CURDATE() AND resultado = 'reprovado'`
    );
    return { laudosPendentes, ncAbertas, analisesHoje, reprovadosHoje };
  }

  // ── f01: Análise de Recepção (Plataforma) ─────────────────────────────────────

  async listarAnalises({ data_inicio, data_fim, resultado } = {}) {
    const where = []; const params = [];
    if (data_inicio) { where.push('DATE(a.data_analise) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(a.data_analise) <= ?'); params.push(data_fim); }
    if (resultado)   { where.push('a.resultado = ?');           params.push(resultado); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS analista_nome FROM qua_analises_leite a
       LEFT JOIN usuarios u ON u.id = a.analista_id
       ${cond} ORDER BY a.data_analise DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAnalise(userId, data) {
    if (!data.data_analise) throw new AppError('Data da análise obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_analises_leite
       (data_analise, numero_tanque, lote, temperatura, alizarol, acidez, densidade, gordura, cbt, ccs, resultado, analista_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_analise, data.numero_tanque || null, data.lote || null,
       data.temperatura || null, data.alizarol || 'negativo', data.acidez || null,
       data.densidade || null, data.gordura || null, data.cbt || null, data.ccs || null,
       data.resultado || 'pendente', userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarAnalise(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_analises_leite WHERE id = ?`, [id]);
    if (!row) throw new AppError('Análise não encontrada', HTTP.NOT_FOUND);
    const allowed = ['resultado','alizarol','acidez','temperatura','densidade','gordura','cbt','ccs','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE qua_analises_leite SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── f02: Análises Físico-Químicas ─────────────────────────────────────────────

  async listarAnalisesFQ({ data_inicio, data_fim, resultado, produto_id } = {}) {
    const where = []; const params = [];
    if (data_inicio) { where.push('DATE(a.data_analise) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(a.data_analise) <= ?'); params.push(data_fim); }
    if (resultado)   { where.push('a.resultado = ?');           params.push(resultado); }
    if (produto_id)  { where.push('a.produto_id = ?');          params.push(produto_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, p.nome AS produto_nome, u.nome AS analista_nome
       FROM qua_analises_fq a
       LEFT JOIN produtos p ON p.id = a.produto_id
       LEFT JOIN usuarios u ON u.id = a.analista_id
       ${cond} ORDER BY a.data_analise DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAnaliseFQ(userId, data) {
    if (!data.data_analise) throw new AppError('Data da análise obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_analises_fq
       (data_analise, produto_id, lote, acidez, gordura, proteina, umidade, ph, aw, sal, resultado, analista_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_analise, data.produto_id || null, data.lote || null,
       data.acidez || null, data.gordura || null, data.proteina || null,
       data.umidade || null, data.ph || null, data.aw || null,
       data.sal || null, data.resultado || 'pendente', userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f03: Análises Microbiológicas ─────────────────────────────────────────────

  async listarAnalisesMicro({ data_inicio, data_fim, resultado } = {}) {
    const where = []; const params = [];
    if (data_inicio) { where.push('DATE(a.data_analise) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(a.data_analise) <= ?'); params.push(data_fim); }
    if (resultado)   { where.push('a.resultado = ?');           params.push(resultado); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, p.nome AS produto_nome, u.nome AS analista_nome
       FROM qua_analises_micro a
       LEFT JOIN produtos p ON p.id = a.produto_id
       LEFT JOIN usuarios u ON u.id = a.analista_id
       ${cond} ORDER BY a.data_analise DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAnaliseMicro(userId, data) {
    if (!data.data_analise) throw new AppError('Data da análise obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_analises_micro
       (data_analise, produto_id, lote, coliformes_totais, coliformes_termotolerantes,
        estafilococos, salmonella, listeria, contagem_aerobios, bolores_leveduras, resultado, analista_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_analise, data.produto_id || null, data.lote || null,
       data.coliformes_totais || null, data.coliformes_termotolerantes || null,
       data.estafilococos || null, data.salmonella || 'ausente', data.listeria || 'ausente',
       data.contagem_aerobios || null, data.bolores_leveduras || null,
       data.resultado || 'pendente', userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f04: Monitoramento de Antibióticos ────────────────────────────────────────

  async listarAntibioticos({ data_inicio, data_fim, resultado } = {}) {
    const where = []; const params = [];
    if (data_inicio) { where.push('DATE(a.data_analise) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(a.data_analise) <= ?'); params.push(data_fim); }
    if (resultado)   { where.push('a.resultado = ?');           params.push(resultado); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS analista_nome FROM qua_antibioticos a
       LEFT JOIN usuarios u ON u.id = a.analista_id
       ${cond} ORDER BY a.data_analise DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAntibiotico(userId, data) {
    if (!data.data_analise) throw new AppError('Data da análise obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_antibioticos
       (data_analise, numero_tanque, lote, metodo, kit_utilizado, resultado, analista_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_analise, data.numero_tanque || null, data.lote || null,
       data.metodo || null, data.kit_utilizado || null,
       data.resultado || 'negativo', userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f05: Liberação de Lotes ───────────────────────────────────────────────────

  async listarLiberacoes({ status, produto_id } = {}) {
    const where = []; const params = [];
    if (status)     { where.push('l.status = ?');     params.push(status); }
    if (produto_id) { where.push('l.produto_id = ?'); params.push(produto_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT l.*, p.nome AS produto_nome, u.nome AS responsavel_nome
       FROM qua_liberacao_lotes l
       LEFT JOIN produtos p ON p.id = l.produto_id
       LEFT JOIN usuarios u ON u.id = l.responsavel_id
       ${cond} ORDER BY l.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarLote(userId, { lote, produto_id, data_producao, motivo_bloqueio, observacao }) {
    if (!lote) throw new AppError('Lote obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_liberacao_lotes (lote, produto_id, data_producao, status, motivo_bloqueio, responsavel_id, observacao)
       VALUES (?, ?, ?, 'bloqueado', ?, ?, ?)`,
      [lote, produto_id || null, data_producao || null, motivo_bloqueio || null, userId, observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarStatusLote(id, userId, { status, observacao, motivo_bloqueio }) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_liberacao_lotes WHERE id = ?`, [id]);
    if (!row) throw new AppError('Lote não encontrado', HTTP.NOT_FOUND);
    if (!['bloqueado','liberado','destruido','reprocesso'].includes(status))
      throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    await pool.execute(
      `UPDATE qua_liberacao_lotes SET status = ?, responsavel_id = ?, data_decisao = NOW(),
       motivo_bloqueio = COALESCE(?, motivo_bloqueio), observacao = COALESCE(?, observacao) WHERE id = ?`,
      [status, userId, motivo_bloqueio || null, observacao || null, id]
    );
    return { ok: true };
  }

  // ── f06: Gestão de Não Conformidades (RNC) ────────────────────────────────────

  async listarNC({ tipo, status } = {}) {
    const where = []; const params = [];
    if (tipo)   { where.push('n.tipo = ?');   params.push(tipo); }
    if (status) { where.push('n.status = ?'); params.push(status); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT n.*, d.nome AS setor_nome, p.nome AS produto_nome,
              u.nome AS responsavel_nome, ab.nome AS aberto_por_nome
       FROM qua_nao_conformidades n
       LEFT JOIN departamentos d ON d.id = n.setor_origem_id
       LEFT JOIN produtos p ON p.id = n.produto_id
       LEFT JOIN usuarios u ON u.id = n.responsavel_id
       LEFT JOIN usuarios ab ON ab.id = n.aberto_por
       ${cond} ORDER BY n.data_ocorrencia DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarNC(userId, { tipo, setor_origem_id, descricao, produto_id, lote, data_ocorrencia, data_prazo, responsavel_id }) {
    if (!descricao) throw new AppError('Descrição obrigatória', HTTP.BAD_REQUEST);
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM qua_nao_conformidades`);
    const codigo = `NC-${String(Number(total) + 1).padStart(5, '0')}`;
    const [res] = await pool.execute(
      `INSERT INTO qua_nao_conformidades
       (codigo, tipo, setor_origem_id, descricao, produto_id, lote, data_ocorrencia, data_prazo, responsavel_id, aberto_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, tipo || 'interna', setor_origem_id || null, descricao,
       produto_id || null, lote || null,
       data_ocorrencia || new Date().toISOString().split('T')[0],
       data_prazo || null, responsavel_id || null, userId]
    );
    return { id: res.insertId, codigo };
  }

  async atualizarNC(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_nao_conformidades WHERE id = ?`, [id]);
    if (!row) throw new AppError('NC não encontrada', HTTP.NOT_FOUND);
    const allowed = ['status','causa_raiz','acao_corretiva','acao_preventiva','data_prazo','data_encerramento','responsavel_id','observacao'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE qua_nao_conformidades SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── f07: Análise Sensorial ────────────────────────────────────────────────────

  async listarAnalisesSensoriais({ data_inicio, data_fim, resultado } = {}) {
    const where = []; const params = [];
    if (data_inicio) { where.push('DATE(a.data_analise) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(a.data_analise) <= ?'); params.push(data_fim); }
    if (resultado)   { where.push('a.resultado = ?');           params.push(resultado); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, p.nome AS produto_nome, u.nome AS analista_nome
       FROM qua_analises_sensoriais a
       LEFT JOIN produtos p ON p.id = a.produto_id
       LEFT JOIN usuarios u ON u.id = a.analista_id
       ${cond} ORDER BY a.data_analise DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAnaliseSensorial(userId, data) {
    if (!data.data_analise) throw new AppError('Data da análise obrigatória', HTTP.BAD_REQUEST);
    const attrs = ['aparencia','cor','aroma','textura','sabor'];
    const resultado = attrs.some(a => data[a] === 'nao_conforme') ? 'reprovado' : (data.resultado || 'aprovado');
    const [res] = await pool.execute(
      `INSERT INTO qua_analises_sensoriais
       (data_analise, produto_id, lote, aparencia, cor, aroma, textura, sabor, resultado, analista_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_analise, data.produto_id || null, data.lote || null,
       data.aparencia || 'conforme', data.cor || 'conforme', data.aroma || 'conforme',
       data.textura || 'conforme', data.sabor || 'conforme',
       resultado, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f08: Controle de Shelf-Life ───────────────────────────────────────────────

  async listarShelfLife({ status, produto_id } = {}) {
    const where = []; const params = [];
    if (status)     { where.push('s.status = ?');     params.push(status); }
    if (produto_id) { where.push('s.produto_id = ?'); params.push(produto_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT s.*, p.nome AS produto_nome, u.nome AS responsavel_nome,
              DATEDIFF(s.data_validade, CURDATE()) AS dias_restantes
       FROM qua_shelf_life s
       LEFT JOIN produtos p ON p.id = s.produto_id
       LEFT JOIN usuarios u ON u.id = s.responsavel_id
       ${cond} ORDER BY s.data_validade ASC LIMIT 200`, params
    );
    return rows;
  }

  async registrarShelfLife(userId, data) {
    if (!data.produto_id || !data.data_fabricacao || !data.data_validade)
      throw new AppError('Produto, data de fabricação e validade são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_shelf_life
       (produto_id, lote, data_fabricacao, data_validade, temperatura_armazenagem, local_armazenagem, responsavel_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.produto_id, data.lote || null, data.data_fabricacao, data.data_validade,
       data.temperatura_armazenagem || null, data.local_armazenagem || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarShelfLife(id, { status }) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_shelf_life WHERE id = ?`, [id]);
    if (!row) throw new AppError('Registro não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE qua_shelf_life SET status = ? WHERE id = ?`, [status, id]);
    return { ok: true };
  }

  // ── f09: Emissão de Laudos Técnicos ──────────────────────────────────────────

  async listarLaudos({ resultado, data_inicio, data_fim } = {}) {
    const where = []; const params = [];
    if (resultado)   { where.push('l.resultado = ?');          params.push(resultado); }
    if (data_inicio) { where.push('DATE(l.data_coleta) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(l.data_coleta) <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT l.*, p.nome AS produto_nome, u.nome AS analista_nome
       FROM laudos_qualidade l
       LEFT JOIN produtos p ON p.id = l.produto_id
       LEFT JOIN usuarios u ON u.id = l.analista_id
       ${cond} ORDER BY l.data_coleta DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarLaudo(userId, { ordem_producao_id, produto_id, lote, data_coleta, resultado, observacoes }) {
    if (!resultado) throw new AppError('Resultado obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO laudos_qualidade (ordem_producao_id, produto_id, lote, data_coleta, analista_id, resultado, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ordem_producao_id || null, produto_id || null, lote || null,
       data_coleta || new Date(), userId, resultado, observacoes || null]
    );
    return { id: res.insertId };
  }

  async atualizarLaudo(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM laudos_qualidade WHERE id = ?`, [id]);
    if (!row) throw new AppError('Laudo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['resultado','observacoes','lote'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE laudos_qualidade SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── f10: Gestão de Amostras de Retenção ──────────────────────────────────────

  async listarAmostras({ status, produto_id } = {}) {
    const where = []; const params = [];
    if (status)     { where.push('a.status = ?');     params.push(status); }
    if (produto_id) { where.push('a.produto_id = ?'); params.push(produto_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, p.nome AS produto_nome, u.nome AS responsavel_nome,
              DATEDIFF(a.data_validade, CURDATE()) AS dias_para_vencer
       FROM qua_amostras_retencao a
       LEFT JOIN produtos p ON p.id = a.produto_id
       LEFT JOIN usuarios u ON u.id = a.responsavel_id
       ${cond} ORDER BY a.data_validade ASC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAmostra(userId, data) {
    if (!data.lote || !data.data_coleta) throw new AppError('Lote e data de coleta obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_amostras_retencao
       (produto_id, lote, data_coleta, quantidade, unidade, localizacao, data_validade, responsavel_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.produto_id || null, data.lote, data.data_coleta,
       data.quantidade || null, data.unidade || 'g', data.localizacao || null,
       data.data_validade || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarAmostra(id, { status, motivo_uso }) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_amostras_retencao WHERE id = ?`, [id]);
    if (!row) throw new AppError('Amostra não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE qua_amostras_retencao SET status = ?, motivo_uso = COALESCE(?, motivo_uso) WHERE id = ?`,
      [status, motivo_uso || null, id]
    );
    return { ok: true };
  }

  // ── f11: Monitoramento de Água e Efluentes ────────────────────────────────────

  async listarAguas({ resultado, tipo } = {}) {
    const where = []; const params = [];
    if (resultado) { where.push('a.resultado = ?'); params.push(resultado); }
    if (tipo)      { where.push('a.tipo = ?');      params.push(tipo); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS analista_nome FROM qua_controle_aguas a
       LEFT JOIN usuarios u ON u.id = a.analista_id
       ${cond} ORDER BY a.data_coleta DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarAgua(userId, data) {
    if (!data.ponto_coleta) throw new AppError('Ponto de coleta obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_controle_aguas (data_coleta, ponto_coleta, tipo, ph, cloro, turbidez, coliformes, resultado, analista_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_coleta || new Date().toISOString().split('T')[0], data.ponto_coleta,
       data.tipo || 'processo', data.ph || null, data.cloro || null, data.turbidez || null,
       data.coliformes || 'ausente', data.resultado || 'pendente', userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f12: Swab Test (Higiene) ──────────────────────────────────────────────────

  async listarSwabs({ resultado } = {}) {
    const where = [`m.tipo = 'swab_superficie'`]; const params = [];
    if (resultado) { where.push('m.resultado = ?'); params.push(resultado); }
    const cond = 'WHERE ' + where.join(' AND ');
    const [rows] = await pool.execute(
      `SELECT m.*, u.nome AS analista_nome FROM qua_monitoramento_ambiental m
       LEFT JOIN usuarios u ON u.id = m.analista_id
       ${cond} ORDER BY m.data_coleta DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarSwab(userId, data) {
    if (!data.ponto_coleta) throw new AppError('Ponto de coleta obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_monitoramento_ambiental (data_coleta, ponto_coleta, tipo, resultado, micro_detectado, analista_id, observacao)
       VALUES (?, ?, 'swab_superficie', ?, ?, ?, ?)`,
      [data.data_coleta || new Date().toISOString().split('T')[0],
       data.ponto_coleta, data.resultado || 'pendente',
       data.micro_detectado || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f13: Controle de Pragas ───────────────────────────────────────────────────

  async listarPragas({ data_inicio, data_fim } = {}) {
    const where = []; const params = [];
    if (data_inicio) { where.push('DATE(p.data_visita) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(p.data_visita) <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT p.*, u.nome AS registrado_por_nome FROM qua_controle_pragas p
       LEFT JOIN usuarios u ON u.id = p.registrado_por
       ${cond} ORDER BY p.data_visita DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarPraga(userId, data) {
    if (!data.data_visita) throw new AppError('Data da visita obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_controle_pragas
       (data_visita, empresa_terceirizada, responsavel_tecnico, tipo_servico, areas_atendidas,
        pragas_detectadas, produtos_utilizados, resultado, proxima_visita, registrado_por, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_visita, data.empresa_terceirizada || null, data.responsavel_tecnico || null,
       data.tipo_servico || 'monitoramento', data.areas_atendidas || null,
       data.pragas_detectadas || null, data.produtos_utilizados || null,
       data.resultado || 'pendente', data.proxima_visita || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f14: Estoque de Reagentes ─────────────────────────────────────────────────

  async listarReagentes({ ativo } = {}) {
    const cond = ativo !== undefined ? 'WHERE r.ativo = ?' : '';
    const params = ativo !== undefined ? [ativo] : [];
    const [rows] = await pool.execute(
      `SELECT r.*,
              CASE WHEN r.saldo_atual <= r.estoque_minimo THEN 1 ELSE 0 END AS estoque_baixo
       FROM qua_reagentes r ${cond} ORDER BY r.nome`, params
    );
    return rows;
  }

  async cadastrarReagente({ nome, fabricante, lote_fabricante, data_validade, unidade, estoque_minimo, localizacao }) {
    if (!nome) throw new AppError('Nome do reagente obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_reagentes (nome, fabricante, lote_fabricante, data_validade, unidade, estoque_minimo, localizacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, fabricante || null, lote_fabricante || null, data_validade || null,
       unidade || 'mL', estoque_minimo || 0, localizacao || null]
    );
    return { id: res.insertId };
  }

  async movimentarReagente(userId, reagenteId, { tipo, quantidade, motivo }) {
    if (!tipo || !quantidade) throw new AppError('Tipo e quantidade obrigatórios', HTTP.BAD_REQUEST);
    const [[row]] = await pool.execute(`SELECT id, saldo_atual FROM qua_reagentes WHERE id = ?`, [reagenteId]);
    if (!row) throw new AppError('Reagente não encontrado', HTTP.NOT_FOUND);
    const novoSaldo = tipo === 'entrada'
      ? Number(row.saldo_atual) + Number(quantidade)
      : Number(row.saldo_atual) - Number(quantidade);
    if (novoSaldo < 0) throw new AppError('Saldo insuficiente', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE qua_reagentes SET saldo_atual = ? WHERE id = ?`, [novoSaldo, reagenteId]);
    const [res] = await pool.execute(
      `INSERT INTO qua_reagentes_movimentos (reagente_id, tipo, quantidade, motivo, responsavel_id)
       VALUES (?, ?, ?, ?, ?)`,
      [reagenteId, tipo, quantidade, motivo || null, userId]
    );
    return { id: res.insertId, saldo_atual: novoSaldo };
  }

  // ── f15: Calibração de Equipamentos ──────────────────────────────────────────

  async listarCalibracoes({ resultado } = {}) {
    const where = resultado ? 'WHERE c.resultado = ?' : '';
    const params = resultado ? [resultado] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS responsavel_nome,
              CASE WHEN c.proxima_calibracao < CURDATE() THEN 1 ELSE 0 END AS vencida
       FROM qua_calibracoes c
       LEFT JOIN usuarios u ON u.id = c.responsavel_id
       ${where} ORDER BY c.proxima_calibracao ASC LIMIT 200`, params
    );
    return rows;
  }

  async registrarCalibracao(userId, data) {
    if (!data.equipamento || !data.data_calibracao)
      throw new AppError('Equipamento e data de calibração obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_calibracoes
       (equipamento, numero_patrimonio, data_calibracao, proxima_calibracao, empresa_calibradora, certificado, resultado, responsavel_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.equipamento, data.numero_patrimonio || null, data.data_calibracao,
       data.proxima_calibracao || null, data.empresa_calibradora || null,
       data.certificado || null, data.resultado || 'aprovado', userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f16: Ver Escala e Datas ───────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir, d.nome AS dept_nome
       FROM qua_escalas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  // ── f17: Solicitar Reanálise ──────────────────────────────────────────────────

  async listarReanalises({ status } = {}) {
    const where = status ? 'WHERE r.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT r.*, s.nome AS solicitante_nome, resp.nome AS responsavel_nome
       FROM qua_reanalises r
       LEFT JOIN usuarios s ON s.id = r.solicitante_id
       LEFT JOIN usuarios resp ON resp.id = r.responsavel_id
       ${where} ORDER BY r.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async solicitarReanalise(userId, { tipo, referencia_id, lote, motivo }) {
    if (!motivo) throw new AppError('Motivo da reanálise obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_reanalises (tipo, referencia_id, lote, motivo, solicitante_id, data_solicitacao)
       VALUES (?, ?, ?, ?, ?, CURDATE())`,
      [tipo || 'recepcao', referencia_id || null, lote || null, motivo, userId]
    );
    return { id: res.insertId };
  }

  // ── f18: Gerenciar Reanálises ─────────────────────────────────────────────────

  async responderReanalise(id, userId, { status, resultado_reanalise, observacao }) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_reanalises WHERE id = ?`, [id]);
    if (!row) throw new AppError('Reanálise não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE qua_reanalises SET status = ?, resultado_reanalise = ?, observacao = COALESCE(?, observacao),
       responsavel_id = ?, data_resposta = CURDATE() WHERE id = ?`,
      [status, resultado_reanalise || null, observacao || null, userId, id]
    );
    return { ok: true };
  }

  // ── f19: Estocagem de MP ──────────────────────────────────────────────────────

  async listarEstocagemMP({ tipo, produto_id } = {}) {
    const where = []; const params = [];
    if (tipo)       { where.push('e.tipo = ?');       params.push(tipo); }
    if (produto_id) { where.push('e.produto_id = ?'); params.push(produto_id); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT e.*, p.nome AS produto_nome, u.nome AS responsavel_nome
       FROM qua_estocagem_mp e
       LEFT JOIN produtos p ON p.id = e.produto_id
       LEFT JOIN usuarios u ON u.id = e.responsavel_id
       ${cond} ORDER BY e.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarEstocagemMP(userId, data) {
    if (!data.tipo || !data.quantidade)
      throw new AppError('Tipo e quantidade obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_estocagem_mp
       (tipo, produto_id, lote, quantidade, unidade, temperatura, local_armazenagem, fornecedor, nota_fiscal, responsavel_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.tipo, data.produto_id || null, data.lote || null, data.quantidade,
       data.unidade || 'kg', data.temperatura || null, data.local_armazenagem || null,
       data.fornecedor || null, data.nota_fiscal || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f20: Visitas Fiscais ──────────────────────────────────────────────────────

  async listarVisitasFiscais({ status, orgao } = {}) {
    const where = []; const params = [];
    if (status) { where.push('v.status = ?'); params.push(status); }
    if (orgao)  { where.push('v.orgao = ?');  params.push(orgao); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT v.*, u.nome AS registrado_por_nome FROM qua_visitas_fiscais v
       LEFT JOIN usuarios u ON u.id = v.registrado_por
       ${cond} ORDER BY v.data_visita DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarVisitaFiscal(userId, data) {
    if (!data.data_visita || !data.orgao)
      throw new AppError('Data da visita e órgão fiscalizador obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_visitas_fiscais
       (data_visita, orgao, fiscal_nome, fiscal_matricula, tipo, areas_inspecionadas, exigencias,
        prazo_cumprimento, auto_infracao, registrado_por, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_visita, data.orgao, data.fiscal_nome || null, data.fiscal_matricula || null,
       data.tipo || 'rotina', data.areas_inspecionadas || null, data.exigencias || null,
       data.prazo_cumprimento || null, data.auto_infracao || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  async atualizarVisitaFiscal(id, { status, observacao }) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_visitas_fiscais WHERE id = ?`, [id]);
    if (!row) throw new AppError('Visita não encontrada', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE qua_visitas_fiscais SET status = ?, observacao = COALESCE(?, observacao) WHERE id = ?`,
      [status, observacao || null, id]
    );
    return { ok: true };
  }

  // ── f21: Liberação de Carga Spot ──────────────────────────────────────────────

  async listarCargasSpot({ resultado } = {}) {
    const where = resultado ? 'WHERE c.resultado = ?' : '';
    const params = resultado ? [resultado] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS responsavel_nome FROM qua_cargas_spot c
       LEFT JOIN usuarios u ON u.id = c.responsavel_id
       ${where} ORDER BY c.data_chegada DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarCargaSpot(userId, data) {
    if (!data.data_chegada) throw new AppError('Data de chegada obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_cargas_spot
       (data_chegada, produtor_nome, placa_veiculo, volume_litros, temperatura, alizarol, acidez, resultado, motivo_rejeicao, responsavel_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.data_chegada, data.produtor_nome || null, data.placa_veiculo || null,
       data.volume_litros || null, data.temperatura || null,
       data.alizarol || 'negativo', data.acidez || null,
       data.resultado || 'pendente', data.motivo_rejeicao || null, userId, data.observacao || null]
    );
    return { id: res.insertId };
  }

  // ── f22: Gerenciar Escalas ────────────────────────────────────────────────────

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data de início obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO qua_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[row]] = await pool.execute(`SELECT id FROM qua_escalas WHERE id = ?`, [id]);
    if (!row) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM qua_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarProdutos() {
    const [rows] = await pool.execute(`SELECT id, nome, codigo FROM produtos WHERE ativo = 1 ORDER BY nome`);
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

  async recentesLaudos() {
    const [rows] = await pool.execute(
      `SELECT l.*, p.nome AS produto_nome FROM laudos_qualidade l
       LEFT JOIN produtos p ON p.id = l.produto_id
       ORDER BY l.criado_em DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new QualidadeService();
