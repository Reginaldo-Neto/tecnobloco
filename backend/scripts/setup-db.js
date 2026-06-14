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

    // 6. Seeds de cargos padrão (só se tabela vazia)
    const [[{ cargoCnt }]] = await conn.query('SELECT COUNT(*) AS cargoCnt FROM cargos');
    if (cargoCnt === 0) {
      console.log('[SETUP] Inserindo cargos padrão...');
      await conn.query(`
        INSERT INTO cargos (nome, nivel_acesso, departamento_id)
        SELECT t.nome, t.nivel, d.id FROM (
          -- Produção
          SELECT 'Auxiliar de Produção'              AS nome, 1 AS nivel, 'Produção'              AS dept UNION ALL
          SELECT 'Operador de Betoneira',                     2,          'Produção'                       UNION ALL
          SELECT 'Operador de Prensa',                        2,          'Produção'                       UNION ALL
          SELECT 'Operador de Máquinas',                      2,          'Produção'                       UNION ALL
          SELECT 'Encarregado de Produção',                   4,          'Produção'                       UNION ALL
          SELECT 'Supervisor de Produção',                    4,          'Produção'                       UNION ALL
          SELECT 'Gerente de Produção',                       5,          'Produção'                       UNION ALL
          -- Manutenção
          SELECT 'Auxiliar de Manutenção',                    1,          'Manutenção'                     UNION ALL
          SELECT 'Mecânico Industrial',                       2,          'Manutenção'                     UNION ALL
          SELECT 'Eletricista Industrial',                    2,          'Manutenção'                     UNION ALL
          SELECT 'Técnico de Manutenção',                     3,          'Manutenção'                     UNION ALL
          SELECT 'Supervisor de Manutenção',                  4,          'Manutenção'                     UNION ALL
          SELECT 'Gerente de Manutenção',                     5,          'Manutenção'                     UNION ALL
          -- Qualidade
          SELECT 'Auxiliar de Laboratório',                   1,          'Qualidade'                      UNION ALL
          SELECT 'Técnico de Laboratório',                    2,          'Qualidade'                      UNION ALL
          SELECT 'Analista de Qualidade',                     3,          'Qualidade'                      UNION ALL
          SELECT 'Supervisor de Qualidade',                   4,          'Qualidade'                      UNION ALL
          -- Estoque
          SELECT 'Auxiliar de Almoxarifado',                  1,          'Estoque'                        UNION ALL
          SELECT 'Almoxarife',                                2,          'Estoque'                        UNION ALL
          SELECT 'Supervisor de Estoque',                     3,          'Estoque'                        UNION ALL
          -- Expedição
          SELECT 'Auxiliar de Expedição',                     1,          'Expedição'                      UNION ALL
          SELECT 'Operador de Empilhadeira',                  2,          'Expedição'                      UNION ALL
          SELECT 'Encarregado de Expedição',                  3,          'Expedição'                      UNION ALL
          -- Frotas
          SELECT 'Motorista de Caminhão',                     2,          'Frotas'                         UNION ALL
          SELECT 'Encarregado de Frotas',                     3,          'Frotas'                         UNION ALL
          -- Vendas
          SELECT 'Assistente Comercial',                      2,          'Vendas'                         UNION ALL
          SELECT 'Vendedor Externo',                          2,          'Vendas'                         UNION ALL
          SELECT 'Analista Comercial',                        3,          'Vendas'                         UNION ALL
          SELECT 'Gerente Comercial',                         5,          'Vendas'                         UNION ALL
          -- Compras
          SELECT 'Auxiliar de Compras',                       1,          'Compras'                        UNION ALL
          SELECT 'Analista de Compras',                       3,          'Compras'                        UNION ALL
          SELECT 'Gerente de Compras',                        5,          'Compras'                        UNION ALL
          -- Financeiro
          SELECT 'Auxiliar Financeiro',                       1,          'Financeiro'                     UNION ALL
          SELECT 'Assistente Financeiro',                     2,          'Financeiro'                     UNION ALL
          SELECT 'Analista Financeiro',                       3,          'Financeiro'                     UNION ALL
          SELECT 'Contador',                                  3,          'Financeiro'                     UNION ALL
          SELECT 'Gerente Financeiro',                        5,          'Financeiro'                     UNION ALL
          -- RH
          SELECT 'Assistente de RH',                          2,          'RH'                             UNION ALL
          SELECT 'Analista de RH',                            3,          'RH'                             UNION ALL
          SELECT 'Gerente de RH',                             5,          'RH'                             UNION ALL
          -- Administração
          SELECT 'Recepcionista',                             1,          'Administração'                  UNION ALL
          SELECT 'Assistente Administrativo',                 2,          'Administração'                  UNION ALL
          SELECT 'Analista Administrativo',                   3,          'Administração'                  UNION ALL
          -- TI
          SELECT 'Técnico de TI',                             2,          'TI'                             UNION ALL
          SELECT 'Analista de TI',                            3,          'TI'                             UNION ALL
          -- Segurança do Trabalho
          SELECT 'Técnico de Segurança do Trabalho',          3,          'Segurança do Trabalho'          UNION ALL
          SELECT 'Engenheiro de Segurança do Trabalho',       4,          'Segurança do Trabalho'          UNION ALL
          -- Diretoria
          SELECT 'Diretor de Operações',                      6,          'Diretoria'                      UNION ALL
          SELECT 'Diretor Geral',                             6,          'Diretoria'
        ) t LEFT JOIN departamentos d ON d.nome = t.dept
      `);
      console.log('[SETUP] 49 cargos padrão inseridos.');
    } else {
      console.log('[SETUP] Cargos já existem, pulando.');
    }

    // 7. Seeds de equipamentos (só se tabela vazia)
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
