'use strict';

/**
 * reset-db.js
 * DESTRÓI o banco e recria do zero (schema + seeds + admin).
 * Use apenas para desenvolvimento / testes.
 * Execute: node scripts/reset-db.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const path  = require('path');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '1234',
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'tecnobloco';

async function reset() {
  let conn;
  try {
    console.log(`\n[RESET] ⚠  Apagando banco "${DB_NAME}"...`);
    conn = await mysql.createConnection(DB_CONFIG);
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await conn.end();
    console.log(`[RESET] Banco "${DB_NAME}" removido.`);

    console.log('[RESET] Recriando via setup-db.js...\n');
    execSync(`node "${path.join(__dirname, 'setup-db.js')}"`, { stdio: 'inherit' });

  } catch (err) {
    console.error('\n[RESET] ERRO:', err.message);
    process.exit(1);
  }
}

reset();
