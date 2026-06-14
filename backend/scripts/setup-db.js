'use strict';

/**
 * setup-db.js
 * Cria/atualiza o banco de dados sem destruir dados existentes.
 * Para reset completo use: node scripts/reset-db.js
 * Execute: node scripts/setup-db.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs     = require('fs');
const path   = require('path');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '1234',
  multipleStatements: true,
};

const DB_NAME        = process.env.DB_NAME || 'tecnobloco';
const SCHEMA_SQL     = path.join(__dirname, '../../database/schema.sql');
const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');
const SEEDS_DIR      = path.join(__dirname, '../../database/seeds');

const ADMIN_SENHA = '123456';

function filtrar(sql) {
  return sql
    .replace(/CREATE DATABASE[\s\S]*?;/gi, '')
    .replace(/USE\s+\w+\s*;/gi, '');
}

async function run() {
  let conn;
  try {
    console.log('\n[SETUP] Conectando ao MySQL...');
    conn = await mysql.createConnection(DB_CONFIG);

    // 1. Criar banco
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    console.log(`[SETUP] Banco "${DB_NAME}" selecionado.`);

    // 2. Migração incremental: dashboard_rota
    {
      const [rows] = await conn.query(`SHOW TABLES LIKE 'usuarios'`);
      if (rows.length > 0) {
        const [[{ cnt }]] = await conn.query(
          `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'dashboard_rota'`
        );
        if (cnt === 0) {
          await conn.query(
            `ALTER TABLE usuarios ADD COLUMN dashboard_rota VARCHAR(200) DEFAULT NULL
             COMMENT 'Rota de redirecionamento pós-login; NULL = padrão por setor'
             AFTER foto_url`
          );
          console.log('[SETUP] Coluna dashboard_rota adicionada.');
        }
      }
    }

    // 3. Aplicar schema principal (idempotente — CREATE TABLE IF NOT EXISTS)
    if (!fs.existsSync(SCHEMA_SQL)) throw new Error(`schema.sql não encontrado: ${SCHEMA_SQL}`);
    console.log('[SETUP] Aplicando schema.sql...');
    await conn.query(filtrar(fs.readFileSync(SCHEMA_SQL, 'utf8')));
    console.log('[SETUP] Schema aplicado.');

    // 4. Aplicar migrations
    if (fs.existsSync(MIGRATIONS_DIR)) {
      const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();
      if (migrationFiles.length > 0) {
        console.log(`[SETUP] Aplicando ${migrationFiles.length} migration(s)...`);
        for (const file of migrationFiles) {
          const sql = filtrar(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
          try {
            await conn.query(sql);
            console.log(`[SETUP]   ✔ ${file}`);
          } catch (err) {
            if (err.errno === 1060 || err.errno === 1061) {
              console.log(`[SETUP]   ⚠ ${file} (já aplicado)`);
            } else throw err;
          }
        }
      }
    }

    // 5. Seeds de departamentos (só se tabela vazia)
    const [[{ deptCnt }]] = await conn.query('SELECT COUNT(*) AS deptCnt FROM departamentos');
    if (deptCnt === 0) {
      console.log('[SETUP] Inserindo departamentos...');
      const initialSql = path.join(SEEDS_DIR, 'initial.sql');
      if (fs.existsSync(initialSql)) {
        await conn.query(filtrar(fs.readFileSync(initialSql, 'utf8')));
        console.log('[SETUP] Departamentos inseridos.');
      }
    } else {
      console.log('[SETUP] Departamentos já existem, pulando.');
    }

    // 6. Seeds de equipamentos (só se tabela vazia)
    const [[{ equipCnt }]] = await conn.query('SELECT COUNT(*) AS equipCnt FROM equipamentos');
    if (equipCnt === 0) {
      console.log('[SETUP] Inserindo equipamentos tagueados...');
      const equipSql = path.join(SEEDS_DIR, 'equipamentos.sql');
      if (fs.existsSync(equipSql)) {
        await conn.query(filtrar(fs.readFileSync(equipSql, 'utf8')));
        console.log('[SETUP] 12 equipamentos cadastrados.');
      }
    } else {
      console.log('[SETUP] Equipamentos já existem, pulando.');
    }

    // 7. Admin Master
    const cpfAdmin = '00000000000';
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM usuarios WHERE cpf = '${cpfAdmin}'`);
    const hash     = await bcrypt.hash(ADMIN_SENHA, Number(process.env.BCRYPT_ROUNDS) || 10);
    const safeHash = hash.replace(/'/g, "\\'");

    if (total === 0) {
      console.log('[SETUP] Criando Admin Master...');
      const [[dept]] = await conn.query(`SELECT id FROM departamentos WHERE nome = 'Administração' LIMIT 1`);
      const deptId   = dept ? dept.id : null;
      await conn.query(
        `INSERT INTO usuarios (nome, cpf, email, senha_hash, nivel_acesso, departamento_id, ativo)
         VALUES ('Admin Master', '${cpfAdmin}', 'admin@tecnobloco.com', '${safeHash}', 7, ${deptId ?? 'NULL'}, 1)`
      );
    } else {
      // Atualiza senha se admin já existir (útil após reset parcial)
      await conn.query(`UPDATE usuarios SET senha_hash = '${safeHash}' WHERE cpf = '${cpfAdmin}'`);
      console.log('[SETUP] Admin já existia — senha atualizada.');
    }
    console.log(`[SETUP] Admin Master  →  CPF: 000.000.000-00  |  Senha: ${ADMIN_SENHA}`);

    console.log('\n[SETUP] ✔ Concluído! Para iniciar: npm run dev\n');

  } catch (err) {
    console.error('\n[SETUP] ERRO:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
