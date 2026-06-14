'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class SacService {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ ticketsAbertos }]] = await pool.execute(
      `SELECT COUNT(*) AS ticketsAbertos FROM sac_tickets WHERE status IN ('aberto','em_analise','aguardando_cliente')`
    );
    const [[{ ticketsUrgentes }]] = await pool.execute(
      `SELECT COUNT(*) AS ticketsUrgentes FROM sac_tickets WHERE prioridade IN ('alta','urgente') AND status NOT IN ('resolvido','fechado','cancelado')`
    );
    const [[{ recallsAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS recallsAtivos FROM sac_recall WHERE status IN ('ativo','em_andamento')`
    );
    const [[{ slaMediaHoras }]] = await pool.execute(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, data_abertura, data_fechamento)), 1) AS slaMediaHoras
       FROM sac_tickets WHERE status IN ('resolvido','fechado') AND data_fechamento IS NOT NULL
       AND data_abertura >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [[{ npsMedia }]] = await pool.execute(
      `SELECT ROUND(AVG(satisfacao_nota), 1) AS npsMedia FROM sac_tickets
       WHERE satisfacao_nota IS NOT NULL AND data_fechamento >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [[{ atendimentosHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS atendimentosHoje FROM sac_atendimentos_avulsos WHERE DATE(created_at) = CURDATE()`
    );
    return { ticketsAbertos, ticketsUrgentes, recallsAtivos, slaMediaHoras, npsMedia, atendimentosHoje };
  }

  // ── Tickets ───────────────────────────────────────────────────────────────────

  async listarTickets({ status, categoria, prioridade, canal } = {}) {
    const where = [];
    const params = [];
    if (status)    { where.push('t.status = ?');    params.push(status); }
    if (categoria) { where.push('t.categoria = ?'); params.push(categoria); }
    if (prioridade){ where.push('t.prioridade = ?');params.push(prioridade); }
    if (canal)     { where.push('t.canal_entrada = ?'); params.push(canal); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT t.*, sol.nome AS atendente_abertura_nome, ate.nome AS atendente_nome
       FROM sac_tickets t
       LEFT JOIN usuarios sol ON sol.id = t.solicitante_id
       LEFT JOIN usuarios ate ON ate.id = t.atendente_id
       ${cond}
       ORDER BY FIELD(t.prioridade,'urgente','alta','media','baixa'),
                FIELD(t.status,'aberto','em_analise','aguardando_cliente','resolvido','fechado','cancelado'),
                t.data_abertura DESC
       LIMIT 300`,
      params
    );
    return rows;
  }

  async buscarTicket(id) {
    const [[ticket]] = await pool.execute(
      `SELECT t.*, sol.nome AS atendente_abertura_nome, ate.nome AS atendente_nome
       FROM sac_tickets t
       LEFT JOIN usuarios sol ON sol.id = t.solicitante_id
       LEFT JOIN usuarios ate ON ate.id = t.atendente_id
       WHERE t.id = ?`,
      [id]
    );
    if (!ticket) throw new AppError('Ticket não encontrado', HTTP.NOT_FOUND);
    const [historico] = await pool.execute(
      `SELECT h.*, u.nome AS usuario_nome
       FROM sac_tickets_historico h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
       WHERE h.ticket_id = ? ORDER BY h.created_at ASC`,
      [id]
    );
    return { ...ticket, historico };
  }

  async criarTicket(userId, { titulo, descricao, categoria, prioridade, canal_entrada, cliente_nome, cliente_contato, lote_vinculado }) {
    if (!titulo || !descricao) throw new AppError('Título e descrição são obrigatórios', HTTP.BAD_REQUEST);
    if (!cliente_nome)         throw new AppError('Nome do cliente é obrigatório', HTTP.BAD_REQUEST);
    const ano = new Date().getFullYear();
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM sac_tickets WHERE YEAR(created_at) = ?`, [ano]);
    const codigo = `SAC-${ano}-${String(Number(total) + 1).padStart(4, '0')}`;
    // SLA: urgente=4h, alta=8h, media=24h, baixa=48h
    const slaHoras = { urgente: 4, alta: 8, media: 24, baixa: 48 };
    const horas = slaHoras[prioridade || 'media'] || 24;
    const [res] = await pool.execute(
      `INSERT INTO sac_tickets (codigo, titulo, descricao, categoria, prioridade, canal_entrada, cliente_nome, cliente_contato, lote_vinculado, solicitante_id, prazo_sla)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [codigo, titulo, descricao, categoria || 'outro', prioridade || 'media',
       canal_entrada || 'portal', cliente_nome, cliente_contato || null,
       lote_vinculado || null, userId, horas]
    );
    return { id: res.insertId, codigo };
  }

  async atualizarStatusTicket(userId, id, { status, atendente_id, resolucao, satisfacao_nota }) {
    const statusValidos = ['aberto','em_analise','aguardando_cliente','resolvido','fechado','cancelado'];
    if (!status || !statusValidos.includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    if (satisfacao_nota !== undefined && satisfacao_nota !== null) {
      const nota = Number(satisfacao_nota);
      if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new AppError('Nota de satisfação deve ser entre 1 e 5', HTTP.BAD_REQUEST);
    }
    const [[t]] = await pool.execute(`SELECT id, status FROM sac_tickets WHERE id = ?`, [id]);
    if (!t) throw new AppError('Ticket não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (atendente_id !== undefined) { sets.push('atendente_id = ?'); params.push(atendente_id); }
    if (resolucao !== undefined)    { sets.push('resolucao = ?');    params.push(resolucao); }
    if (satisfacao_nota !== undefined) { sets.push('satisfacao_nota = ?'); params.push(satisfacao_nota); }
    if (['resolvido','fechado','cancelado'].includes(status)) sets.push('data_fechamento = NOW()');
    params.push(id);
    await pool.execute(`UPDATE sac_tickets SET ${sets.join(', ')} WHERE id = ?`, params);
    // Log history
    await pool.execute(
      `INSERT INTO sac_tickets_historico (ticket_id, usuario_id, tipo, descricao)
       VALUES (?, ?, 'status', ?)`,
      [id, userId, `Status alterado para: ${status}${resolucao ? ' — ' + resolucao.slice(0, 100) : ''}`]
    );
    return { ok: true };
  }

  async adicionarComentario(userId, ticketId, comentario) {
    if (!comentario) throw new AppError('Comentário não pode ser vazio', HTTP.BAD_REQUEST);
    const [[t]] = await pool.execute(`SELECT id FROM sac_tickets WHERE id = ?`, [ticketId]);
    if (!t) throw new AppError('Ticket não encontrado', HTTP.NOT_FOUND);
    const [res] = await pool.execute(
      `INSERT INTO sac_tickets_historico (ticket_id, usuario_id, tipo, descricao) VALUES (?, ?, 'comentario', ?)`,
      [ticketId, userId, comentario]
    );
    return { id: res.insertId };
  }

  async vincularLote(userId, ticketId, { lote_vinculado, observacao_qualidade }) {
    const [[t]] = await pool.execute(`SELECT id FROM sac_tickets WHERE id = ?`, [ticketId]);
    if (!t) throw new AppError('Ticket não encontrado', HTTP.NOT_FOUND);
    if (!lote_vinculado) throw new AppError('Número do lote é obrigatório', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE sac_tickets SET lote_vinculado = ? WHERE id = ?`, [lote_vinculado, ticketId]);
    await pool.execute(
      `INSERT INTO sac_tickets_historico (ticket_id, usuario_id, tipo, descricao) VALUES (?, ?, 'rastreabilidade', ?)`,
      [ticketId, userId, `Lote vinculado: ${lote_vinculado}${observacao_qualidade ? ' — ' + observacao_qualidade : ''}`]
    );
    return { ok: true };
  }

  // ── Atendimentos Avulsos ──────────────────────────────────────────────────────

  async listarAtendimentosAvulsos({ data_inicio, data_fim } = {}) {
    const where = [];
    const params = [];
    if (data_inicio) { where.push('DATE(a.created_at) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(a.created_at) <= ?'); params.push(data_fim); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome
       FROM sac_atendimentos_avulsos a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${cond}
       ORDER BY a.created_at DESC LIMIT 200`,
      params
    );
    return rows;
  }

  async registrarAtendimentoAvulso(userId, { canal, cliente_nome, cliente_contato, descricao, resultado }) {
    if (!cliente_nome || !descricao) throw new AppError('Cliente e descrição são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sac_atendimentos_avulsos (canal, cliente_nome, cliente_contato, descricao, resultado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [canal || 'telefone', cliente_nome, cliente_contato || null, descricao, resultado || null, userId]
    );
    return { id: res.insertId };
  }

  // ── Motivos de Reclamação ─────────────────────────────────────────────────────

  async listarMotivos() {
    const [rows] = await pool.execute(
      `SELECT * FROM sac_motivos_reclamacao WHERE ativo = 1 ORDER BY categoria, nome`
    );
    return rows;
  }

  async criarMotivo(userId, { nome, categoria }) {
    if (!nome) throw new AppError('Nome é obrigatório', HTTP.BAD_REQUEST);
    const [[dup]] = await pool.execute(`SELECT id FROM sac_motivos_reclamacao WHERE nome = ? AND ativo = 1`, [nome]);
    if (dup) throw new AppError('Motivo já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO sac_motivos_reclamacao (nome, categoria) VALUES (?, ?)`,
      [nome, categoria || 'Geral']
    );
    return { id: res.insertId };
  }

  async excluirMotivo(id) {
    const [[m]] = await pool.execute(`SELECT id FROM sac_motivos_reclamacao WHERE id = ? AND ativo = 1`, [id]);
    if (!m) throw new AppError('Motivo não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE sac_motivos_reclamacao SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Garantias e Trocas ────────────────────────────────────────────────────────

  async listarGarantias({ status } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('g.status = ?'); params.push(status); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT g.*, t.codigo AS ticket_codigo, t.cliente_nome, apr.nome AS aprovador_nome
       FROM sac_garantias g
       LEFT JOIN sac_tickets t ON t.id = g.ticket_id
       LEFT JOIN usuarios apr ON apr.id = g.aprovador_id
       ${cond}
       ORDER BY g.data_solicitacao DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async criarGarantia(userId, { ticket_id, tipo, descricao, valor_credito }) {
    if (!descricao) throw new AppError('Descrição é obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sac_garantias (ticket_id, tipo, descricao, valor_credito)
       VALUES (?, ?, ?, ?)`,
      [ticket_id || null, tipo || 'troca', descricao, valor_credito || null]
    );
    return { id: res.insertId };
  }

  async responderGarantia(userId, id, { status, observacao }) {
    const [[g]] = await pool.execute(`SELECT id, status FROM sac_garantias WHERE id = ?`, [id]);
    if (!g) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    if (g.status !== 'pendente') throw new AppError('Solicitação já foi respondida', HTTP.CONFLICT);
    if (!['aprovada','rejeitada'].includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    await pool.execute(
      `UPDATE sac_garantias SET status = ?, aprovador_id = ?, observacao_resposta = ?, data_resposta = NOW() WHERE id = ?`,
      [status, userId, observacao || null, id]
    );
    return { ok: true };
  }

  // ── Recall ────────────────────────────────────────────────────────────────────

  async listarRecall() {
    const [rows] = await pool.execute(
      `SELECT r.*, u.nome AS responsavel_nome
       FROM sac_recall r
       LEFT JOIN usuarios u ON u.id = r.responsavel_id
       ORDER BY FIELD(r.status,'ativo','em_andamento','concluido','cancelado'), r.data_inicio DESC
       LIMIT 50`
    );
    return rows;
  }

  async criarRecall(userId, { produto, lote, motivo, nivel_urgencia, descricao }) {
    if (!produto || !motivo) throw new AppError('Produto e motivo são obrigatórios', HTTP.BAD_REQUEST);
    const ano = new Date().getFullYear();
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM sac_recall WHERE YEAR(created_at) = ?`, [ano]);
    const codigo = `RCL-${ano}-${String(Number(total) + 1).padStart(3, '0')}`;
    const [res] = await pool.execute(
      `INSERT INTO sac_recall (codigo, produto, lote, motivo, nivel_urgencia, descricao, responsavel_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo, produto, lote || null, motivo, nivel_urgencia || 'alto', descricao || null, userId]
    );
    return { id: res.insertId, codigo };
  }

  async atualizarStatusRecall(id, { status, observacao }) {
    const statusValidos = ['em_andamento','concluido','cancelado'];
    if (!status || !statusValidos.includes(status)) throw new AppError('Status inválido. Use: em_andamento, concluido, cancelado', HTTP.BAD_REQUEST);
    const [[r]] = await pool.execute(`SELECT id FROM sac_recall WHERE id = ?`, [id]);
    if (!r) throw new AppError('Recall não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (observacao) { sets.push('observacao_fechamento = ?'); params.push(observacao); }
    if (status === 'concluido') sets.push('data_fechamento = NOW()');
    params.push(id);
    await pool.execute(`UPDATE sac_recall SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Templates de Resposta ─────────────────────────────────────────────────────

  async listarTemplates() {
    const [rows] = await pool.execute(
      `SELECT t.*, u.nome AS autor_nome FROM sac_templates_resposta t
       LEFT JOIN usuarios u ON u.id = t.autor_id
       WHERE t.ativo = 1 ORDER BY t.categoria, t.titulo`
    );
    return rows;
  }

  async buscarTemplate(id) {
    const [[t]] = await pool.execute(
      `SELECT t.*, u.nome AS autor_nome FROM sac_templates_resposta t
       LEFT JOIN usuarios u ON u.id = t.autor_id WHERE t.id = ? AND t.ativo = 1`, [id]
    );
    if (!t) throw new AppError('Template não encontrado', HTTP.NOT_FOUND);
    return t;
  }

  async criarTemplate(userId, { titulo, assunto, corpo, categoria }) {
    if (!titulo || !corpo) throw new AppError('Título e corpo são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sac_templates_resposta (titulo, assunto, corpo, categoria, autor_id) VALUES (?, ?, ?, ?, ?)`,
      [titulo, assunto || titulo, corpo, categoria || 'Geral', userId]
    );
    return { id: res.insertId };
  }

  async atualizarTemplate(id, { titulo, assunto, corpo, categoria }) {
    const [[t]] = await pool.execute(`SELECT id FROM sac_templates_resposta WHERE id = ? AND ativo = 1`, [id]);
    if (!t) throw new AppError('Template não encontrado', HTTP.NOT_FOUND);
    const allowed = ['titulo','assunto','corpo','categoria'];
    const data = { titulo, assunto, corpo, categoria };
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE sac_templates_resposta SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirTemplate(id) {
    const [[t]] = await pool.execute(`SELECT id FROM sac_templates_resposta WHERE id = ? AND ativo = 1`, [id]);
    if (!t) throw new AppError('Template não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE sac_templates_resposta SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Base de Conhecimento SAC ──────────────────────────────────────────────────

  async listarBaseConhecimento({ busca } = {}) {
    const where = ['b.ativo = 1'];
    const params = [];
    if (busca) { where.push('(b.titulo LIKE ? OR b.conteudo LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`); }
    const [rows] = await pool.execute(
      `SELECT b.id, b.titulo, b.categoria, b.created_at, b.updated_at, u.nome AS autor_nome
       FROM sac_base_conhecimento b
       LEFT JOIN usuarios u ON u.id = b.autor_id
       WHERE ${where.join(' AND ')} ORDER BY b.updated_at DESC LIMIT 100`,
      params
    );
    return rows;
  }

  async buscarArtigoConhecimento(id) {
    const [[art]] = await pool.execute(
      `SELECT b.*, u.nome AS autor_nome FROM sac_base_conhecimento b
       LEFT JOIN usuarios u ON u.id = b.autor_id WHERE b.id = ? AND b.ativo = 1`, [id]
    );
    if (!art) throw new AppError('Artigo não encontrado', HTTP.NOT_FOUND);
    return art;
  }

  async criarArtigoConhecimento(userId, { titulo, categoria, conteudo }) {
    if (!titulo || !conteudo) throw new AppError('Título e conteúdo são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sac_base_conhecimento (titulo, categoria, conteudo, autor_id) VALUES (?, ?, ?, ?)`,
      [titulo, categoria || 'Geral', conteudo, userId]
    );
    return { id: res.insertId };
  }

  async atualizarArtigoConhecimento(id, { titulo, categoria, conteudo }) {
    const [[art]] = await pool.execute(`SELECT id FROM sac_base_conhecimento WHERE id = ? AND ativo = 1`, [id]);
    if (!art) throw new AppError('Artigo não encontrado', HTTP.NOT_FOUND);
    const data = { titulo, categoria, conteudo };
    const sets = []; const params = [];
    for (const k of Object.keys(data)) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE sac_base_conhecimento SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirArtigoConhecimento(id) {
    const [[art]] = await pool.execute(`SELECT id FROM sac_base_conhecimento WHERE id = ? AND ativo = 1`, [id]);
    if (!art) throw new AppError('Artigo não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE sac_base_conhecimento SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Escalas SAC ───────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT es.*, COALESCE(u.nome, es.atendente_nome) AS usuario_nome, cr.nome AS criado_por_nome
       FROM sac_escalas es
       LEFT JOIN usuarios u  ON u.id  = es.usuario_id
       LEFT JOIN usuarios cr ON cr.id = es.criado_por_id
       ORDER BY es.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, atendente_nome, turno, data_inicio, data_fim, tipo, observacao }) {
    if (!usuario_id && !atendente_nome) throw new AppError('Usuário ou nome do atendente é obrigatório', HTTP.BAD_REQUEST);
    if (!data_inicio || !data_fim)      throw new AppError('Datas são obrigatórias', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sac_escalas (usuario_id, atendente_nome, turno, data_inicio, data_fim, tipo, observacao, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, atendente_nome || null, turno || 'comercial', data_inicio, data_fim, tipo || 'normal', observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[es]] = await pool.execute(`SELECT id FROM sac_escalas WHERE id = ?`, [id]);
    if (!es) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM sac_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Comunicados ───────────────────────────────────────────────────────────────

  async listarComunicados() {
    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS remetente_nome FROM sac_comunicados c
       LEFT JOIN usuarios u ON u.id = c.remetente_id
       ORDER BY c.created_at DESC LIMIT 50`
    );
    return rows;
  }

  async criarComunicado(userId, { titulo, mensagem, canal }) {
    if (!titulo || !mensagem) throw new AppError('Título e mensagem são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO sac_comunicados (titulo, mensagem, canal, remetente_id) VALUES (?, ?, ?, ?)`,
      [titulo, mensagem, canal || 'email', userId]
    );
    return { id: res.insertId };
  }

  // ── SLA / Relatórios ──────────────────────────────────────────────────────────

  async relatorioSLA() {
    const [porCategoria] = await pool.execute(
      `SELECT categoria,
              COUNT(*) AS total,
              COUNT(CASE WHEN status IN ('resolvido','fechado') THEN 1 END) AS resolvidos,
              COUNT(CASE WHEN status IN ('aberto','em_analise','aguardando_cliente') THEN 1 END) AS abertos,
              ROUND(AVG(CASE WHEN data_fechamento IS NOT NULL
                THEN TIMESTAMPDIFF(HOUR, data_abertura, data_fechamento) END), 1) AS sla_medio_horas
       FROM sac_tickets
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY categoria ORDER BY total DESC`
    );
    const [porPrioridade] = await pool.execute(
      `SELECT prioridade, COUNT(*) AS total,
              ROUND(AVG(CASE WHEN data_fechamento IS NOT NULL
                THEN TIMESTAMPDIFF(HOUR, data_abertura, data_fechamento) END), 1) AS sla_medio_horas
       FROM sac_tickets WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY prioridade`
    );
    const [porMes] = await pool.execute(
      `SELECT DATE_FORMAT(data_abertura, '%Y-%m') AS mes, COUNT(*) AS total,
              SUM(CASE WHEN status IN ('resolvido','fechado') THEN 1 ELSE 0 END) AS resolvidos
       FROM sac_tickets WHERE data_abertura >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY mes ORDER BY mes`
    );
    const [[{ totalAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS totalAtivos FROM sac_tickets WHERE status IN ('aberto','em_analise','aguardando_cliente')`
    );
    const [[{ dentroPrazo }]] = await pool.execute(
      `SELECT COUNT(*) AS dentroPrazo FROM sac_tickets WHERE status IN ('aberto','em_analise','aguardando_cliente') AND prazo_sla > NOW()`
    );
    const [[{ foraPrazo }]] = await pool.execute(
      `SELECT COUNT(*) AS foraPrazo FROM sac_tickets WHERE status IN ('aberto','em_analise','aguardando_cliente') AND prazo_sla <= NOW()`
    );
    return { porCategoria, porPrioridade, porMes, totalAtivos, dentroPrazo, foraPrazo };
  }

  // ── NPS ───────────────────────────────────────────────────────────────────────

  async getNPS() {
    const [[agg]] = await pool.execute(
      `SELECT ROUND(AVG(satisfacao_nota), 2) AS media,
              COUNT(satisfacao_nota) AS total_avaliacoes,
              SUM(CASE WHEN satisfacao_nota >= 4 THEN 1 ELSE 0 END) AS promotores,
              SUM(CASE WHEN satisfacao_nota = 3 THEN 1 ELSE 0 END) AS neutros,
              SUM(CASE WHEN satisfacao_nota <= 2 THEN 1 ELSE 0 END) AS detratores
       FROM sac_tickets WHERE satisfacao_nota IS NOT NULL AND data_fechamento >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [porNota] = await pool.execute(
      `SELECT satisfacao_nota AS nota, COUNT(*) AS total
       FROM sac_tickets WHERE satisfacao_nota IS NOT NULL AND data_fechamento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY satisfacao_nota ORDER BY satisfacao_nota DESC`
    );
    const nps = agg.total_avaliacoes > 0
      ? Math.round(((agg.promotores - agg.detratores) / agg.total_avaliacoes) * 100)
      : null;
    return { ...agg, nps_score: nps, porNota };
  }

  // ── Histórico do Cliente ──────────────────────────────────────────────────────

  async historicoCliente(cliente_nome) {
    if (!cliente_nome) throw new AppError('Nome do cliente é obrigatório', HTTP.BAD_REQUEST);
    const busca = `%${cliente_nome}%`;
    const [tickets] = await pool.execute(
      `SELECT t.id, t.codigo, t.titulo, t.categoria, t.status, t.prioridade, t.data_abertura, t.data_fechamento,
              ate.nome AS atendente_nome
       FROM sac_tickets t
       LEFT JOIN usuarios ate ON ate.id = t.atendente_id
       WHERE t.cliente_nome LIKE ?
       ORDER BY t.data_abertura DESC LIMIT 50`,
      [busca]
    );
    const [atendimentos] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome FROM sac_atendimentos_avulsos a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.cliente_nome LIKE ? ORDER BY a.created_at DESC LIMIT 20`,
      [busca]
    );
    return { tickets, atendimentos };
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.email, d.nome AS departamento
       FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1 ORDER BY u.nome ASC`
    );
    return rows;
  }
}

module.exports = new SacService();
