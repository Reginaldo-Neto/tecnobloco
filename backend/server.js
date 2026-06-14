'use strict';

require('dotenv').config();

const { execSync, exec } = require('child_process');
const app  = require('./src/app');

const PORT = process.env.PORT || 3002;

// ── 1. Libera a porta antes de iniciar ──────────────────────────────────────
(function liberarPorta() {
  try {
    if (process.platform === 'win32') {
      // Encontra e mata o processo que está usando a porta
      const saida = execSync(
        `netstat -aon 2>nul | findstr :${PORT} | findstr LISTENING`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      ).trim();

      if (saida) {
        const partes = saida.trim().split(/\s+/);
        const pid    = partes[partes.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Tecnobloco] Porta ${PORT} liberada (PID ${pid} encerrado).`);
        }
      }
    } else {
      execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch (_) {
    // Porta já estava livre — sem problema
  }
})();

// ── 2. Inicia o servidor ─────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[Tecnobloco] Servidor rodando na porta ${PORT}`);
  console.log(`[Tecnobloco] Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Tecnobloco] Acesse: http://localhost:${PORT}`);

  // Abre o browser apenas em desenvolvimento local
  if (process.env.NODE_ENV !== 'production') {
    const loginUrl = `http://localhost:${PORT}/?_dev=1`;
    const cmd = process.platform === 'win32'
      ? `start "" "${loginUrl}"`
      : process.platform === 'darwin'
        ? `open "${loginUrl}"`
        : `xdg-open "${loginUrl}"`;
    exec(cmd, () => {});
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERRO] Porta ${PORT} ainda em uso após tentativa de liberação.`);
    console.error(`[DICA] Feche o processo manualmente e execute npm start novamente.\n`);
  } else {
    console.error('[ERRO] Falha ao iniciar servidor:', err.message);
  }
  process.exit(1);
});
