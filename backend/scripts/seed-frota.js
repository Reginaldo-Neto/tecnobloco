'use strict';

/**
 * seed-frota.js
 * Insere dados de demonstração para o setor de Frotas.
 * Execute: node scripts/seed-frota.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const DB_CONFIG = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '1234',
  database:           process.env.DB_NAME     || 'tecnobloco',
  multipleStatements: true,
};

const SEED_SQL = path.join(__dirname, '../../database/seeds/frota_demo.sql');

async function run() {
  let conn;
  try {
    console.log('\n[SEED-FROTA] Conectando ao MySQL...');
    conn = await mysql.createConnection(DB_CONFIG);

    // Verificar se departamento Frotas existe
    const [[dept]] = await conn.query(`SELECT id FROM departamentos WHERE nome = 'Frotas' LIMIT 1`);
    if (!dept) {
      console.error('[SEED-FROTA] ERRO: Departamento "Frotas" não encontrado.');
      console.error('[SEED-FROTA] Execute "node scripts/setup-db.js" primeiro.');
      process.exit(1);
    }

    // Verificar se já há dados
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) AS cnt FROM veiculos');
    if (cnt > 0) {
      console.log(`[SEED-FROTA] Já existem ${cnt} veículo(s). Pulando seed.`);
      console.log('[SEED-FROTA] Para re-inserir, truncate manualmente as tabelas fro_* e veiculos.');
      process.exit(0);
    }

    if (!fs.existsSync(SEED_SQL)) {
      throw new Error(`Arquivo não encontrado: ${SEED_SQL}`);
    }

    console.log('[SEED-FROTA] Inserindo dados de demonstração...');
    const sql = fs.readFileSync(SEED_SQL, 'utf8');
    await conn.query(sql);

    // Contar resultados
    const [[{ v }]] = await conn.query('SELECT COUNT(*) AS v FROM veiculos');
    const [[{ m }]] = await conn.query('SELECT COUNT(*) AS m FROM fro_motoristas');
    const [[{ vi }]] = await conn.query('SELECT COUNT(*) AS vi FROM viagens');
    const [[{ ab }]] = await conn.query('SELECT COUNT(*) AS ab FROM fro_abastecimentos');

    console.log('\n[SEED-FROTA] ✔ Concluído!');
    console.log(`  • ${v}  veículos`);
    console.log(`  • ${m}  motoristas/CNH`);
    console.log(`  • ${vi} viagens`);
    console.log(`  • ${ab} abastecimentos`);
    console.log('\n[SEED-FROTA] Acesse o setor de Frotas no sistema para ver os dados.\n');

  } catch (err) {
    console.error('\n[SEED-FROTA] ERRO:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
