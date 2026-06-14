'use strict';

const bcrypt = require('bcryptjs');
const pool = require('../../../config/database');
const JWTService = require('./JWTService');
const { AppError, unauthorized } = require('../../utils/errorHandler');
const { normalizeCpf } = require('../../utils/helpers');
const { HTTP } = require('../../../config/constants');

// Whitelist explícita para o campo de busca no login.
// Garante que nenhum valor externo possa ser interpolado na query.
const CAMPOS_LOGIN = Object.freeze({ cpf: 'cpf', email: 'email' });

// Mapeamento departamento → rota padrão de dashboard
const DEPT_ROTA = {
  'Manutenção': '/pages/manutencao/index.html',
};

/**
 * Determina a rota de dashboard padrão com base no nível e departamento.
 * Nível 6+ (Diretor/Admin) sempre vai para o dashboard principal.
 */
function _dashboardPadrao(nivel, dept) {
  if (nivel >= 6) return '/pages/dashboard.html';
  return DEPT_ROTA[dept] || '/pages/dashboard.html';
}

class AuthService {
  // Aceita CPF (com/sem máscara) ou e-mail como identificador
  async login(identifier, senha, ip) {
    const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(identifier.trim());
    const campo = isCpf ? CAMPOS_LOGIN.cpf : CAMPOS_LOGIN.email;
    const valor = isCpf ? normalizeCpf(identifier) : identifier.toLowerCase().trim();

    // campo só pode ser 'cpf' ou 'email' — sem injeção possível.
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.cpf, u.email, u.senha_hash, u.nivel_acesso,
              u.departamento_id, u.dashboard_rota, u.ativo, d.nome AS departamento
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.${campo} = ?`,
      [valor]
    );

    const usuario = rows[0];

    // Always run bcrypt.compare() regardless of whether the user exists.
    // Skipping it for missing users leaks timing information that enables
    // user enumeration (bcrypt takes ~100ms; an immediate throw does not).
    const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    const senhaOk = await bcrypt.compare(senha, usuario ? usuario.senha_hash : DUMMY_HASH);

    // Mensagem genérica intencional: evita enumeração de usuários/senhas
    if (!usuario) throw unauthorized('Credenciais inválidas');
    if (!usuario.ativo) throw unauthorized('Usuário desativado. Contate o administrador.');
    if (!senhaOk) throw unauthorized('Credenciais inválidas');

    // Atualiza último login
    await pool.execute(
      'UPDATE usuarios SET ultimo_login = NOW(), ultimo_ip = ? WHERE id = ?',
      [ip, usuario.id]
    );

    const payload = {
      id:           usuario.id,
      nivel_acesso: usuario.nivel_acesso,
    };

    const token = JWTService.sign(payload);

    // Remove hash antes de devolver ao cliente
    delete usuario.senha_hash;

    // Resolve rota de redirecionamento: coluna do banco tem prioridade
    usuario.dashboard_rota = usuario.dashboard_rota ||
      _dashboardPadrao(usuario.nivel_acesso, usuario.departamento);

    return { token, usuario };
  }

  async me(userId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.cpf, u.email, u.nivel_acesso, u.foto_url,
              u.departamento_id, d.nome AS departamento, u.ultimo_login, u.ultimo_ip
       FROM usuarios u
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.id = ? AND u.ativo = 1`,
      [userId]
    );
    if (!rows.length) throw unauthorized('Usuário não encontrado');
    return rows[0];
  }

  async atualizarPerfil(userId, nome) {
    nome = (nome || '').trim();
    if (!nome) throw new AppError('Informe o nome', HTTP.BAD_REQUEST);
    if (nome.length > 100) throw new AppError('Nome muito longo', HTTP.BAD_REQUEST);
    await pool.execute('UPDATE usuarios SET nome = ? WHERE id = ?', [nome, userId]);
    return this.me(userId);
  }

  async alterarSenha(userId, senhaAtual, novaSenha) {
    if (novaSenha.length < 8) {
      throw new AppError('A nova senha deve ter no mínimo 8 caracteres', HTTP.BAD_REQUEST);
    }
    if (novaSenha.length > 128) {
      throw new AppError('Senha muito longa', HTTP.BAD_REQUEST);
    }
    // Require at least one letter and one number or special character
    if (!/[a-zA-Z]/.test(novaSenha) || !/[\d\W_]/.test(novaSenha)) {
      throw new AppError('A senha deve conter letras e ao menos um número ou caractere especial', HTTP.BAD_REQUEST);
    }

    const [rows] = await pool.execute('SELECT senha_hash FROM usuarios WHERE id = ?', [userId]);
    if (!rows.length) throw unauthorized();

    const ok = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
    if (!ok) throw new AppError('Senha atual incorreta', HTTP.BAD_REQUEST);

    const rounds   = Number(process.env.BCRYPT_ROUNDS) || 10;
    const novoHash = await bcrypt.hash(novaSenha, rounds);
    await pool.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [novoHash, userId]);
  }
}

module.exports = new AuthService();
