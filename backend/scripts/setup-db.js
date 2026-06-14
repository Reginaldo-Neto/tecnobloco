'use strict';

/**
 * setup-db.js
 * Usa conn.query() para tudo — escape no cliente, sem prepared statements.
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
const SEED_SQL       = path.join(__dirname, '../../database/seeds/initial.sql');
const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');
const SEEDS_DIR      = path.join(__dirname, '../../database/seeds');

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

    // 2. Checar se schema está desatualizado (coluna senha_hash ausente)
    const [tabelas] = await conn.query(`SHOW TABLES LIKE 'usuarios'`);
    if (tabelas.length > 0) {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'senha_hash'`
      );
      if (cnt === 0) {
        console.log('[SETUP] Schema desatualizado. Recriando banco...');
        await conn.query(`DROP DATABASE \`${DB_NAME}\``);
        await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await conn.query(`USE \`${DB_NAME}\``);
        console.log('[SETUP] Banco recriado.');
      }
    }

    // 2b. Migração incremental: adicionar colunas novas sem recriar o banco
    {
      const [rows] = await conn.query(`SHOW TABLES LIKE 'usuarios'`);
      if (rows.length > 0) {
        const [[{ cnt }]] = await conn.query(
          `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'dashboard_rota'`
        );
        if (cnt === 0) {
          console.log('[SETUP] Migrando: adicionando coluna dashboard_rota...');
          await conn.query(
            `ALTER TABLE usuarios ADD COLUMN dashboard_rota VARCHAR(200) DEFAULT NULL
             COMMENT 'Rota de redirecionamento pós-login; NULL = padrão por setor'
             AFTER foto_url`
          );
          console.log('[SETUP] Coluna dashboard_rota adicionada.');
        }
      }
    }

    // 3. Aplicar schema principal (sempre idempotente — CREATE TABLE IF NOT EXISTS)
    if (!fs.existsSync(SCHEMA_SQL)) throw new Error(`schema.sql não encontrado: ${SCHEMA_SQL}`);
    console.log('[SETUP] Aplicando schema.sql...');
    await conn.query(filtrar(fs.readFileSync(SCHEMA_SQL, 'utf8')));
    console.log('[SETUP] Schema aplicado.');

    // 4. Aplicar TODAS as migrations de database/migrations/ automaticamente
    //    Qualquer arquivo .sql adicionado à pasta será aplicado sem precisar
    //    alterar este script. Todos usam CREATE TABLE IF NOT EXISTS (idempotente).
    if (fs.existsSync(MIGRATIONS_DIR)) {
      const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort(); // ordem alfabética garante consistência

      if (migrationFiles.length > 0) {
        console.log(`[SETUP] Aplicando ${migrationFiles.length} migration(s)...`);
        for (const file of migrationFiles) {
          const filePath = path.join(MIGRATIONS_DIR, file);
          const sql      = filtrar(fs.readFileSync(filePath, 'utf8'));
          try {
            await conn.query(sql);
            console.log(`[SETUP]   ✔ ${file}`);
          } catch (migErr) {
            // 1060 = coluna duplicada, 1061 = chave duplicada — migration já aplicada
            if (migErr.errno === 1060 || migErr.errno === 1061) {
              console.log(`[SETUP]   ⚠ ${file} (já aplicado — ignorado)`);
            } else {
              throw migErr;
            }
          }
        }
        console.log('[SETUP] Todas as migrations aplicadas.');
      }
    }

    // 5. Seeds (só se tabela vazia) — aplica todos os .sql de database/seeds/
    const [[{ cnt: deptCnt }]] = await conn.query('SELECT COUNT(*) AS cnt FROM departamentos');
    if (deptCnt === 0) {
      console.log('[SETUP] Inserindo seeds iniciais...');
      if (fs.existsSync(SEEDS_DIR)) {
        const seedFiles = fs.readdirSync(SEEDS_DIR)
          .filter(f => f.endsWith('.sql'))
          .sort();
        for (const file of seedFiles) {
          const filePath = path.join(SEEDS_DIR, file);
          await conn.query(filtrar(fs.readFileSync(filePath, 'utf8')));
          console.log(`[SETUP]   ✔ seed: ${file}`);
        }
      } else if (fs.existsSync(SEED_SQL)) {
        // fallback para caminho legado
        await conn.query(filtrar(fs.readFileSync(SEED_SQL, 'utf8')));
      }
      console.log('[SETUP] Seeds aplicados.');
    } else {
      console.log('[SETUP] Seeds já existem, pulando.');
    }

    // 5. Admin padrão
    const cpfAdmin = '00000000000';
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM usuarios WHERE cpf = '${cpfAdmin}'`);

    if (total === 0) {
      console.log('[SETUP] Criando Admin Master...');
      const [[dept]] = await conn.query(`SELECT id FROM departamentos WHERE nome = 'Administração' LIMIT 1`);
      const deptId   = dept ? dept.id : null;
      const hash     = await bcrypt.hash('1234', Number(process.env.BCRYPT_ROUNDS) || 10);
      const safeHash = hash.replace(/'/g, "\\'");

      await conn.query(
        `INSERT INTO usuarios (nome, cpf, email, senha_hash, nivel_acesso, departamento_id, ativo)
         VALUES ('Admin Master', '${cpfAdmin}', 'admin@tecnobloco.com', '${safeHash}', 7, ${deptId ?? 'NULL'}, 1)`
      );
      console.log('[SETUP] Admin criado  →  CPF: 000.000.000-00  |  Senha: 1234');
    } else {
      console.log('[SETUP] Admin já existe, pulando.');
    }

    console.log('\n[SETUP] ✔ Concluído! Para iniciar: npm start\n');

  } catch (err) {
    console.error('\n[SETUP] ERRO:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
