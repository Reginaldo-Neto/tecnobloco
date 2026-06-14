'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class TiService {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [[{ chamadosAbertos }]] = await pool.execute(
      `SELECT COUNT(*) AS chamadosAbertos FROM ti_chamados WHERE status = 'aberto'`
    );
    const [[{ chamadosCriticos }]] = await pool.execute(
      `SELECT COUNT(*) AS chamadosCriticos FROM ti_chamados WHERE prioridade IN ('alta','critica') AND status NOT IN ('resolvido','fechado')`
    );
    const [[{ ativosEmUso }]] = await pool.execute(
      `SELECT COUNT(*) AS ativosEmUso FROM ti_ativos WHERE status = 'em_uso' AND ativo = 1`
    );
    const [[{ bugsAbertos }]] = await pool.execute(
      `SELECT COUNT(*) AS bugsAbertos FROM ti_bugs WHERE status IN ('aberto','em_analise','confirmado')`
    );
    const [[{ solicitacoesPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS solicitacoesPendentes FROM ti_solicitacoes_exclusao WHERE status = 'pendente'`
    );
    return { chamadosAbertos, chamadosCriticos, ativosEmUso, bugsAbertos, solicitacoesPendentes };
  }

  // ── Chamados (Helpdesk) ───────────────────────────────────────────────────────

  async listarChamados({ status, categoria, prioridade } = {}) {
    const where = [];
    const params = [];
    if (status)    { where.push('c.status = ?');    params.push(status); }
    if (categoria) { where.push('c.categoria = ?'); params.push(categoria); }
    if (prioridade){ where.push('c.prioridade = ?');params.push(prioridade); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT c.*, sol.nome AS solicitante_nome, ate.nome AS atendente_nome
       FROM ti_chamados c
       LEFT JOIN usuarios sol ON sol.id = c.solicitante_id
       LEFT JOIN usuarios ate ON ate.id = c.atendente_id
       ${cond}
       ORDER BY FIELD(c.prioridade,'critica','alta','media','baixa'), c.data_abertura DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async meusChamados(userId) {
    const [rows] = await pool.execute(
      `SELECT c.*, sol.nome AS solicitante_nome, ate.nome AS atendente_nome
       FROM ti_chamados c
       LEFT JOIN usuarios sol ON sol.id = c.solicitante_id
       LEFT JOIN usuarios ate ON ate.id = c.atendente_id
       WHERE c.solicitante_id = ? OR c.atendente_id = ?
       ORDER BY FIELD(c.status,'aberto','em_andamento','aguardando','resolvido','fechado'),
                c.data_abertura DESC
       LIMIT 100`,
      [userId, userId]
    );
    return rows;
  }

  async buscarChamado(id) {
    const [[chamado]] = await pool.execute(
      `SELECT c.*, sol.nome AS solicitante_nome, ate.nome AS atendente_nome
       FROM ti_chamados c
       LEFT JOIN usuarios sol ON sol.id = c.solicitante_id
       LEFT JOIN usuarios ate ON ate.id = c.atendente_id
       WHERE c.id = ?`,
      [id]
    );
    if (!chamado) throw new AppError('Chamado não encontrado', HTTP.NOT_FOUND);
    const [comentarios] = await pool.execute(
      `SELECT cc.*, u.nome AS usuario_nome
       FROM ti_chamados_comentarios cc
       LEFT JOIN usuarios u ON u.id = cc.usuario_id
       WHERE cc.chamado_id = ?
       ORDER BY cc.created_at ASC`,
      [id]
    );
    return { ...chamado, comentarios };
  }

  async criarChamado(userId, { titulo, descricao, categoria, prioridade }) {
    if (!titulo || !descricao) throw new AppError('Título e descrição são obrigatórios', HTTP.BAD_REQUEST);
    const ano = new Date().getFullYear();
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM ti_chamados WHERE YEAR(created_at) = ?`, [ano]
    );
    const seq = String(Number(total) + 1).padStart(4, '0');
    const codigo = `TI-${ano}-${seq}`;
    const [res] = await pool.execute(
      `INSERT INTO ti_chamados (codigo, titulo, descricao, categoria, prioridade, solicitante_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo, titulo, descricao, categoria || 'outro', prioridade || 'media', userId]
    );
    return { id: res.insertId, codigo };
  }

  async atualizarStatusChamado(id, { status, atendente_id, resolucao }) {
    const [[ch]] = await pool.execute(`SELECT id, status FROM ti_chamados WHERE id = ?`, [id]);
    if (!ch) throw new AppError('Chamado não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (atendente_id !== undefined) { sets.push('atendente_id = ?'); params.push(atendente_id); }
    if (resolucao !== undefined)    { sets.push('resolucao = ?');   params.push(resolucao); }
    if (['resolvido','fechado'].includes(status)) {
      sets.push('data_fechamento = NOW()');
    }
    params.push(id);
    await pool.execute(`UPDATE ti_chamados SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async adicionarComentario(chamadoId, userId, comentario) {
    if (!comentario) throw new AppError('Comentário não pode ser vazio', HTTP.BAD_REQUEST);
    const [[ch]] = await pool.execute(`SELECT id FROM ti_chamados WHERE id = ?`, [chamadoId]);
    if (!ch) throw new AppError('Chamado não encontrado', HTTP.NOT_FOUND);
    const [res] = await pool.execute(
      `INSERT INTO ti_chamados_comentarios (chamado_id, usuario_id, comentario) VALUES (?, ?, ?)`,
      [chamadoId, userId, comentario]
    );
    return { id: res.insertId };
  }

  // ── Base de Conhecimento ──────────────────────────────────────────────────────

  async listarBaseConhecimento({ categoria, busca } = {}) {
    const where = ['bk.ativo = 1'];
    const params = [];
    if (categoria) { where.push('bk.categoria = ?'); params.push(categoria); }
    if (busca)     { where.push('(bk.titulo LIKE ? OR bk.conteudo LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`); }
    const [rows] = await pool.execute(
      `SELECT bk.id, bk.titulo, bk.categoria, bk.autor_id, bk.created_at, bk.updated_at,
              u.nome AS autor_nome
       FROM ti_base_conhecimento bk
       LEFT JOIN usuarios u ON u.id = bk.autor_id
       WHERE ${where.join(' AND ')}
       ORDER BY bk.updated_at DESC
       LIMIT 100`,
      params
    );
    return rows;
  }

  async buscarArtigoConhecimento(id) {
    const [[art]] = await pool.execute(
      `SELECT bk.*, u.nome AS autor_nome
       FROM ti_base_conhecimento bk
       LEFT JOIN usuarios u ON u.id = bk.autor_id
       WHERE bk.id = ? AND bk.ativo = 1`,
      [id]
    );
    if (!art) throw new AppError('Artigo não encontrado', HTTP.NOT_FOUND);
    return art;
  }

  async criarArtigoConhecimento(userId, { titulo, categoria, conteudo }) {
    if (!titulo || !conteudo) throw new AppError('Título e conteúdo são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ti_base_conhecimento (titulo, categoria, conteudo, autor_id) VALUES (?, ?, ?, ?)`,
      [titulo, categoria || 'Geral', conteudo, userId]
    );
    return { id: res.insertId };
  }

  async atualizarArtigoConhecimento(id, { titulo, categoria, conteudo }) {
    const [[art]] = await pool.execute(`SELECT id FROM ti_base_conhecimento WHERE id = ? AND ativo = 1`, [id]);
    if (!art) throw new AppError('Artigo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['titulo', 'categoria', 'conteudo'];
    const data = { titulo, categoria, conteudo };
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE ti_base_conhecimento SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirArtigoConhecimento(id) {
    const [[art]] = await pool.execute(`SELECT id FROM ti_base_conhecimento WHERE id = ? AND ativo = 1`, [id]);
    if (!art) throw new AppError('Artigo não encontrado', HTTP.NOT_FOUND);
    await pool.execute(`UPDATE ti_base_conhecimento SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Ativos TI ────────────────────────────────────────────────────────────────

  async listarAtivos({ tipo, status } = {}) {
    const where = ['a.ativo = 1'];
    const params = [];
    if (tipo)  { where.push('a.tipo = ?');  params.push(tipo); }
    if (status){ where.push('a.status = ?');params.push(status); }
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS responsavel_nome
       FROM ti_ativos a
       LEFT JOIN usuarios u ON u.id = a.responsavel_id
       WHERE ${where.join(' AND ')}
       ORDER BY a.nome ASC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async buscarAtivo(id) {
    const [[ativo]] = await pool.execute(
      `SELECT a.*, u.nome AS responsavel_nome
       FROM ti_ativos a
       LEFT JOIN usuarios u ON u.id = a.responsavel_id
       WHERE a.id = ? AND a.ativo = 1`,
      [id]
    );
    if (!ativo) throw new AppError('Ativo não encontrado', HTTP.NOT_FOUND);
    const [movs] = await pool.execute(
      `SELECT am.*, ud.nome AS usuario_destino_nome, resp.nome AS responsavel_nome
       FROM ti_ativos_movimentacoes am
       LEFT JOIN usuarios ud   ON ud.id   = am.usuario_destino_id
       LEFT JOIN usuarios resp ON resp.id = am.responsavel_id
       WHERE am.ativo_id = ?
       ORDER BY am.data_movimentacao DESC
       LIMIT 50`,
      [id]
    );
    return { ...ativo, movimentacoes: movs };
  }

  async criarAtivo(userId, { codigo, nome, tipo, marca, modelo, numero_serie, localizacao, data_aquisicao, valor_aquisicao, garantia_ate, observacoes }) {
    if (!nome || !tipo) throw new AppError('Nome e tipo são obrigatórios', HTTP.BAD_REQUEST);
    let finalCodigo = codigo;
    if (!finalCodigo) {
      const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM ti_ativos`);
      finalCodigo = `TI-AT-${String(Number(total) + 1).padStart(5, '0')}`;
    }
    const [res] = await pool.execute(
      `INSERT INTO ti_ativos (codigo, nome, tipo, marca, modelo, numero_serie, localizacao, data_aquisicao, valor_aquisicao, garantia_ate, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalCodigo, nome, tipo, marca || null, modelo || null, numero_serie || null, localizacao || null,
       data_aquisicao || null, valor_aquisicao || null, garantia_ate || null, observacoes || null]
    );
    return { id: res.insertId, codigo: finalCodigo };
  }

  async atualizarAtivo(userId, id, data) {
    const [[ativo]] = await pool.execute(`SELECT id FROM ti_ativos WHERE id = ? AND ativo = 1`, [id]);
    if (!ativo) throw new AppError('Ativo não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome','tipo','marca','modelo','numero_serie','status','responsavel_id','localizacao','garantia_ate','observacoes'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE ti_ativos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  async movimentarAtivo(userId, id, { tipo, usuario_destino_id, localizacao_destino, observacao }) {
    const [[ativo]] = await pool.execute(`SELECT id FROM ti_ativos WHERE id = ? AND ativo = 1`, [id]);
    if (!ativo) throw new AppError('Ativo não encontrado', HTTP.NOT_FOUND);
    if (!tipo) throw new AppError('Tipo de movimentação é obrigatório', HTTP.BAD_REQUEST);
    const statusMap = { entrega: 'em_uso', devolucao: 'disponivel', manutencao: 'manutencao', descarte: 'descartado' };
    await pool.execute(
      `INSERT INTO ti_ativos_movimentacoes (ativo_id, tipo, usuario_destino_id, localizacao_destino, responsavel_id, observacao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tipo, usuario_destino_id || null, localizacao_destino || null, userId, observacao || null]
    );
    const novoStatus = statusMap[tipo];
    if (novoStatus) {
      const sets = ['status = ?'];
      const params = [novoStatus];
      if (tipo === 'entrega' && usuario_destino_id) { sets.push('responsavel_id = ?'); params.push(usuario_destino_id); }
      if (tipo === 'devolucao') { sets.push('responsavel_id = NULL'); }
      params.push(id);
      await pool.execute(`UPDATE ti_ativos SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    return { ok: true };
  }

  // ── Bugs ─────────────────────────────────────────────────────────────────────

  async listarBugs({ status, severidade } = {}) {
    const where = [];
    const params = [];
    if (status)    { where.push('b.status = ?');    params.push(status); }
    if (severidade){ where.push('b.severidade = ?');params.push(severidade); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT b.*, rep.nome AS reportado_por_nome, resp.nome AS responsavel_nome
       FROM ti_bugs b
       LEFT JOIN usuarios rep  ON rep.id  = b.reportado_por_id
       LEFT JOIN usuarios resp ON resp.id = b.responsavel_id
       ${cond}
       ORDER BY FIELD(b.severidade,'critica','alta','media','baixa'), b.data_report DESC
       LIMIT 200`,
      params
    );
    return rows;
  }

  async buscarBug(id) {
    const [[bug]] = await pool.execute(
      `SELECT b.*, rep.nome AS reportado_por_nome, resp.nome AS responsavel_nome
       FROM ti_bugs b
       LEFT JOIN usuarios rep  ON rep.id  = b.reportado_por_id
       LEFT JOIN usuarios resp ON resp.id = b.responsavel_id
       WHERE b.id = ?`,
      [id]
    );
    if (!bug) throw new AppError('Bug não encontrado', HTTP.NOT_FOUND);
    return bug;
  }

  async atualizarStatusBug(id, { status, responsavel_id, resolucao }) {
    const [[bug]] = await pool.execute(`SELECT id FROM ti_bugs WHERE id = ?`, [id]);
    if (!bug) throw new AppError('Bug não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?'];
    const params = [status];
    if (responsavel_id !== undefined) { sets.push('responsavel_id = ?'); params.push(responsavel_id); }
    if (resolucao !== undefined)      { sets.push('resolucao = ?');      params.push(resolucao); }
    if (['corrigido','invalido','fechado'].includes(status)) {
      sets.push('data_resolucao = NOW()');
    }
    params.push(id);
    await pool.execute(`UPDATE ti_bugs SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT es.*, COALESCE(u.nome, es.tecnico_nome) AS usuario_nome, cr.nome AS criado_por_nome
       FROM ti_escalas es
       LEFT JOIN usuarios u  ON u.id  = es.usuario_id
       LEFT JOIN usuarios cr ON cr.id = es.criado_por_id
       ORDER BY es.data_inicio DESC
       LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, tecnico_nome, turno, data_inicio, data_fim, tipo, observacao }) {
    if (!usuario_id && !tecnico_nome) throw new AppError('Usuário ou nome do técnico é obrigatório', HTTP.BAD_REQUEST);
    if (!data_inicio || !data_fim)    throw new AppError('Data de início e fim são obrigatórias', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ti_escalas (usuario_id, tecnico_nome, turno, data_inicio, data_fim, tipo, observacao, criado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, tecnico_nome || null, turno || 'plantao', data_inicio, data_fim, tipo || 'plantao', observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    const [[es]] = await pool.execute(`SELECT id FROM ti_escalas WHERE id = ?`, [id]);
    if (!es) throw new AppError('Escala não encontrada', HTTP.NOT_FOUND);
    await pool.execute(`DELETE FROM ti_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Solicitações de Exclusão ──────────────────────────────────────────────────

  async listarSolicitacoesExclusao({ status } = {}) {
    const where = [];
    const params = [];
    if (status) { where.push('se.status = ?'); params.push(status); }
    const cond = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT se.*, sol.nome AS solicitante_nome, apr.nome AS aprovador_nome
       FROM ti_solicitacoes_exclusao se
       LEFT JOIN usuarios sol ON sol.id = se.solicitante_id
       LEFT JOIN usuarios apr ON apr.id = se.aprovador_id
       ${cond}
       ORDER BY se.data_solicitacao DESC
       LIMIT 100`,
      params
    );
    return rows;
  }

  async criarSolicitacaoExclusao(userId, { descricao, tabela_referencia, registro_id, motivo }) {
    if (!descricao || !motivo) throw new AppError('Descrição e motivo são obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ti_solicitacoes_exclusao (descricao, tabela_referencia, registro_id, motivo, solicitante_id)
       VALUES (?, ?, ?, ?, ?)`,
      [descricao, tabela_referencia || null, registro_id || null, motivo, userId]
    );
    return { id: res.insertId };
  }

  async responderSolicitacaoExclusao(userId, id, { status, justificativa_resposta }) {
    const [[sol]] = await pool.execute(
      `SELECT id, status FROM ti_solicitacoes_exclusao WHERE id = ?`, [id]
    );
    if (!sol) throw new AppError('Solicitação não encontrada', HTTP.NOT_FOUND);
    if (sol.status !== 'pendente') throw new AppError('Solicitação já foi respondida', HTTP.CONFLICT);
    if (!['aprovada','rejeitada'].includes(status)) throw new AppError('Status inválido', HTTP.BAD_REQUEST);
    await pool.execute(
      `UPDATE ti_solicitacoes_exclusao
       SET status = ?, aprovador_id = ?, justificativa_resposta = ?, data_resposta = NOW()
       WHERE id = ?`,
      [status, userId, justificativa_resposta || null, id]
    );
    return { ok: true };
  }

  // ── Reset de Senha (Admin TI) ─────────────────────────────────────────────────

  async resetarSenhaUsuario(adminId, targetUserId) {
    const [[target]] = await pool.execute(
      `SELECT id, nome, nivel_acesso FROM usuarios WHERE id = ? AND ativo = 1`, [targetUserId]
    );
    if (!target) throw new AppError('Usuário não encontrado', HTTP.NOT_FOUND);
    if (target.nivel_acesso >= 6) throw new AppError('Não é possível resetar senha de diretores/admins via TI', HTTP.FORBIDDEN);
    const bcrypt = require('bcryptjs');
    const novaSenha = Math.random().toString(36).slice(2, 10).toUpperCase();
    const hash = await bcrypt.hash(novaSenha, 12);
    await pool.execute(`UPDATE usuarios SET senha = ? WHERE id = ?`, [hash, targetUserId]);
    return { novaSenha, usuario: target.nome };
  }

  // ── Usuários (para selects) ───────────────────────────────────────────────────

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.email, d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.ativo = 1
       ORDER BY u.nome ASC`
    );
    return rows;
  }
}

module.exports = new TiService();
