'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            process.env.DB_PORT     || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '1234',
  database:        process.env.DB_NAME     || 'tecnobloco',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit:      0,
  timezone:        '-03:00',
  charset:         'utf8mb4',
});

// Testa a conexão na inicialização
pool.getConnection()
  .then(conn => {
    console.log('[DB] Conexão com MySQL estabelecida');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Falha na conexão com MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
