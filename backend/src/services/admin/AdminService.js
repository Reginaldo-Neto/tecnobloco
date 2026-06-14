'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');
const bcrypt = require('bcrypt');

class AdminService {

  async getStats() {
    const [[{ totalUsuarios }]] = await pool.execute(`SELECT COUNT(*) AS totalUsuarios FROM usuarios`);
    const [[{ usuariosAtivos }]] = await pool.execute(`SELECT COUNT(*) AS usuariosAtivos FROM usuarios WHERE ativo = 1`);
    const [[{ totalDepartamentos }]] = await pool.execute(`SELECT COUNT(*) AS totalDepartamentos FROM departamentos WHERE ativo = 1`);
    const [[{ logsHoje }]] = await pool.execute(
      `SELECT COUNT(*) AS logsHoje FROM auditoria_log WHERE DATE(criado_em) = CURDATE()`
    );
    return { totalUsuarios, usuariosAtivos, totalDepartamentos, logsHoje };
  }

  // ── Usuários ──────────────────────────────────────────────────────────────────

  async listarUsuarios({ search, ativo, departamento_id } = {}) {
    const where = ['1=1']; const params = [];
    if (search)         { where.push('(u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (ativo !== undefined) { where.push('u.ativo = ?'); params.push(Number(ativo)); }
    if (departamento_id){ where.push('u.departamento_id = ?'); params.push(departamento_id); }
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.cpf, u.email, u.nivel_acesso, u.ativo, u.ultimo_login,
              d.nome AS departamento_nome, c.nome AS cargo_nome
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       LEFT JOIN cargos c ON c.id = u.cargo_id
       WHERE ${where.join(' AND ')} ORDER BY u.nome LIMIT 500`, params
    );
    return rows;
  }

  async buscarUsuario(id) {
    const [[row]] = await pool.execute(
      `SELECT u.id, u.nome, u.cpf, u.email, u.nivel_acesso, u.ativo, u.ultimo_login, u.foto_url,
              u.departamento_id, u.cargo_id, d.nome AS departamento_nome, c.nome AS cargo_nome
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       LEFT JOIN cargos c ON c.id = u.cargo_id
       WHERE u.id = ?`, [id]
    );
    if (!row) throw new AppError('Usuário não encontrado', HTTP.NOT_FOUND);
    return row;
  }

  async criarUsuario(userId, { nome, cpf, email, senha, nivel_acesso, departamento_id, cargo_id }) {
    if (!nome || !cpf || !senha) throw new AppError('Nome, CPF e senha obrigatórios', HTTP.BAD_REQUEST);
    const cpfLimpo = cpf.replace(/\D/g, '');
    const [[exCpf]] = await pool.execute(`SELECT id FROM usuarios WHERE cpf = ?`, [cpfLimpo]);
    if (exCpf) throw new AppError('CPF já cadastrado', HTTP.CONFLICT);
    if (email) {
      const [[exEmail]] = await pool.execute(`SELECT id FROM usuarios WHERE email = ?`, [email]);
      if (exEmail) throw new AppError('E-mail já cadastrado', HTTP.CONFLICT);
    }
    const senha_hash = await bcrypt.hash(senha, 12);
    const [res] = await pool.execute(
      `INSERT INTO usuarios (nome, cpf, email, senha_hash, nivel_acesso, departamento_id, cargo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, cpfLimpo, email || null, senha_hash, nivel_acesso || 0, departamento_id || null, cargo_id || null]
    );
    return { id: res.insertId };
  }

  async atualizarUsuario(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM usuarios WHERE id = ?`, [id]);
    if (!row) throw new AppError('Usuário não encontrado', HTTP.NOT_FOUND);
    const allowed = ['nome', 'email', 'nivel_acesso', 'departamento_id', 'cargo_id', 'ativo', 'foto_url'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (data.senha) {
      sets.push('senha_hash = ?');
      params.push(await bcrypt.hash(data.senha, 12));
    }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Departamentos ─────────────────────────────────────────────────────────────

  async listarDepartamentos() {
    const [rows] = await pool.execute(
      `SELECT d.*, COUNT(u.id) AS total_usuarios
       FROM departamentos d
       LEFT JOIN usuarios u ON u.departamento_id = d.id AND u.ativo = 1
       GROUP BY d.id ORDER BY d.nome`
    );
    return rows;
  }

  async criarDepartamento(userId, { nome, descricao }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [[ex]] = await pool.execute(`SELECT id FROM departamentos WHERE nome = ?`, [nome]);
    if (ex) throw new AppError('Departamento já existe', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO departamentos (nome, descricao) VALUES (?, ?)`,
      [nome, descricao || null]
    );
    return { id: res.insertId };
  }

  async atualizarDepartamento(id, { nome, descricao, ativo }) {
    const [[row]] = await pool.execute(`SELECT id FROM departamentos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Departamento não encontrado', HTTP.NOT_FOUND);
    const sets = []; const params = [];
    if (nome !== undefined)     { sets.push('nome = ?');      params.push(nome); }
    if (descricao !== undefined){ sets.push('descricao = ?'); params.push(descricao); }
    if (ativo !== undefined)    { sets.push('ativo = ?');     params.push(ativo); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE departamentos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Cargos ────────────────────────────────────────────────────────────────────

  async listarCargos() {
    const [rows] = await pool.execute(
      `SELECT c.*, d.nome AS departamento_nome FROM cargos c
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE c.ativo = 1 ORDER BY c.nome`
    );
    return rows;
  }

  async criarCargo(userId, { nome, nivel_acesso, departamento_id, descricao }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO cargos (nome, nivel_acesso, departamento_id, descricao) VALUES (?, ?, ?, ?)`,
      [nome, nivel_acesso || 0, departamento_id || null, descricao || null]
    );
    return { id: res.insertId };
  }

  async atualizarCargo(id, { nome, nivel_acesso, descricao, ativo }) {
    const [[row]] = await pool.execute(`SELECT id FROM cargos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Cargo não encontrado', HTTP.NOT_FOUND);
    const sets = []; const params = [];
    if (nome !== undefined)          { sets.push('nome = ?');          params.push(nome); }
    if (nivel_acesso !== undefined)  { sets.push('nivel_acesso = ?');  params.push(nivel_acesso); }
    if (descricao !== undefined)     { sets.push('descricao = ?');     params.push(descricao); }
    if (ativo !== undefined)         { sets.push('ativo = ?');         params.push(ativo); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE cargos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Auditoria ─────────────────────────────────────────────────────────────────

  async listarAuditoria({ usuario_id, tipo_evento, tabela, data_inicio, data_fim } = {}) {
    const where = ['1=1']; const params = [];
    if (usuario_id)   { where.push('a.usuario_id = ?');    params.push(usuario_id); }
    if (tipo_evento)  { where.push('a.tipo_evento = ?');   params.push(tipo_evento); }
    if (tabela)       { where.push('a.tabela_afetada = ?');params.push(tabela); }
    if (data_inicio)  { where.push('DATE(a.criado_em) >= ?'); params.push(data_inicio); }
    if (data_fim)     { where.push('DATE(a.criado_em) <= ?'); params.push(data_fim); }
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome FROM auditoria_log a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       WHERE ${where.join(' AND ')} ORDER BY a.criado_em DESC LIMIT 500`, params
    );
    return rows;
  }

  // ── Bug Reports ───────────────────────────────────────────────────────────────

  async listarBugs({ status } = {}) {
    const where = status ? 'WHERE b.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT b.*, u.nome AS reporter_nome FROM bug_reports b
       LEFT JOIN usuarios u ON u.id = b.reporter_id
       ${where} ORDER BY b.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async atualizarBug(id, { status, resposta }) {
    const [[row]] = await pool.execute(`SELECT id FROM bug_reports WHERE id = ?`, [id]);
    if (!row) throw new AppError('Bug report não encontrado', HTTP.NOT_FOUND);
    await pool.execute(
      `UPDATE bug_reports SET status = ?, resposta = ? WHERE id = ?`,
      [status, resposta || null, id]
    );
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async recentesLogs() {
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome FROM auditoria_log a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ORDER BY a.criado_em DESC LIMIT 10`
    );
    return rows;
  }
}

module.exports = new AdminService();
