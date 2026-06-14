#!/usr/bin/env node
'use strict';

/**
 * scripts/dev.js
 * Lançador de desenvolvimento do Tecnobloco ERP.
 *
 * O que faz:
 *   1. Copia .env se ainda não existir
 *   2. Instala dependências do backend se node_modules estiver ausente
 *   3. Inicia o servidor com nodemon (hot-reload)
 *   4. Aguarda o servidor responder em /api/health
 *   5. Abre o navegador padrão na página de login
 *
 * Uso: node scripts/dev.js
 *      npm run dev  (na raiz do projeto)
 */

const { spawn, exec } = require('child_process');
const http  = require('http');
const path  = require('path');
const fs    = require('fs');

// ── Caminhos ─────────────────────────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const ENV_FILE    = path.join(BACKEND_DIR, '.env');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const NODE_MODS   = path.join(BACKEND_DIR, 'node_modules');

// ── Configuração ──────────────────────────────────────────────────────────────
const PORT    = (() => {
  // Tenta ler PORT do .env sem carregar dotenv
  try {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    const m   = raw.match(/^PORT\s*=\s*(\d+)/m);
    return m ? m[1] : '3001';
  } catch { return '3001'; }
})();
const BASE_URL = `http://localhost:${PORT}`;
const HEALTH   = `${BASE_URL}/api/health`;

// ── Utilidades ────────────────────────────────────────────────────────────────
const log  = (msg) => console.log(`\x1b[36m[DEV]\x1b[0m ${msg}`);
const ok   = (msg) => console.log(`\x1b[32m[OK]\x1b[0m  ${msg}`);
const warn = (msg) => console.warn(`\x1b[33m[AVISO]\x1b[0m ${msg}`);
const err  = (msg) => console.error(`\x1b[31m[ERRO]\x1b[0m ${msg}`);

function banner() {
  console.log('\n\x1b[35m' +
    '╔══════════════════════════════════════╗\n' +
    '║  Tecnobloco — Ambiente de Desenvolvimento ║\n' +
    '╚══════════════════════════════════════╝' +
    '\x1b[0m\n');
}

// ── Passo 1: Garantir .env ───────────────────────────────────────────────────
function garantirEnv() {
  if (fs.existsSync(ENV_FILE)) {
    ok('.env encontrado.');
    return;
  }
  if (fs.existsSync(ENV_EXAMPLE)) {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    ok('.env criado a partir de .env.example');
    warn('Revise backend/.env antes de usar em produção.');
  } else {
    warn('.env não encontrado. Usando variáveis padrão.');
  }
}

// ── Passo 2: Instalar dependências ────────────────────────────────────────────
function instalarDeps() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(NODE_MODS)) {
      ok('Dependências já instaladas.');
      return resolve();
    }
    log('Instalando dependências do backend...');
    const proc = spawn('npm', ['install', '--prefer-offline'], {
      cwd:   BACKEND_DIR,
      stdio: 'inherit',
      shell: true,
    });
    proc.on('close', (code) => {
      if (code === 0) { ok('Dependências instaladas.'); resolve(); }
      else reject(new Error(`npm install saiu com código ${code}`));
    });
    proc.on('error', reject);
  });
}

// ── Passo 3: Iniciar backend ─────────────────────────────────────────────────
function iniciarBackend() {
  log('Iniciando servidor (nodemon)...\n');

  // Usa npm run dev para aproveitar o script do package.json do backend
  const proc = spawn('npm', ['run', 'dev'], {
    cwd:   BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
    env:   { ...process.env },
  });

  proc.on('error', (e) => err(`Falha ao iniciar servidor: ${e.message}`));

  // Encerra o servidor filho junto com este processo
  const encerrar = () => {
    log('Encerrando servidor...');
    if (process.platform === 'win32') {
      // No Windows, mata a árvore de processos pelo PID
      exec(`taskkill /PID ${proc.pid} /T /F`, () => process.exit(0));
    } else {
      proc.kill('SIGTERM');
      process.exit(0);
    }
  };
  process.on('SIGINT',  encerrar);
  process.on('SIGTERM', encerrar);

  return proc;
}

// ── Passo 4: Aguardar servidor pronto ────────────────────────────────────────
function aguardarServidor(maxTentativas = 40, intervaloMs = 1000) {
  return new Promise((resolve, reject) => {
    let tentativas = 0;

    const checar = () => {
      tentativas++;
      const req = http.get(HEALTH, { timeout: 800 }, (res) => {
        if (res.statusCode === 200) {
          ok(`Servidor pronto em ${BASE_URL}`);
          resolve();
        } else {
          tentar();
        }
        // Drena a resposta para liberar a conexão
        res.resume();
      });
      req.on('error', tentar);
      req.on('timeout', () => { req.destroy(); tentar(); });

      function tentar() {
        if (tentativas >= maxTentativas) {
          reject(new Error(`Servidor não respondeu após ${maxTentativas}s`));
        } else {
          process.stdout.write('.');
          setTimeout(checar, intervaloMs);
        }
      }
    };

    log(`Aguardando servidor em ${HEALTH}`);
    setTimeout(checar, 1500); // 1.5s de espera inicial
  });
}

// ── Passo 5: Abrir navegador ─────────────────────────────────────────────────
// Passa ?_dev=1 para que o login seja pré-preenchido automaticamente.
function abrirNavegador() {
  const devUrl = `${BASE_URL}?_dev=1`;
  const cmds = {
    win32:  `start "" "${devUrl}"`,
    darwin: `open "${devUrl}"`,
    linux:  `xdg-open "${devUrl}"`,
  };
  const cmd = cmds[process.platform] || cmds.linux;

  exec(cmd, (e) => {
    if (e) warn('Não foi possível abrir o navegador automaticamente.');
    else   ok(`Navegador aberto em ${devUrl}`);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  banner();
  try {
    garantirEnv();
    await instalarDeps();
    iniciarBackend();
    await aguardarServidor();
    console.log(''); // quebra de linha após os pontos de progresso
    abrirNavegador();
    console.log(`\n\x1b[32m  Acesse: ${BASE_URL}\x1b[0m`);
    console.log('  Pressione \x1b[33mCtrl+C\x1b[0m para encerrar.\n');
  } catch (e) {
    err(e.message);
    process.exit(1);
  }
}

main();
