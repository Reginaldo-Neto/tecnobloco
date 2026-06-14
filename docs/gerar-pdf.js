'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const HTML = path.resolve(__dirname, 'apresentacao-tecnobloco.html');
const PDF  = path.resolve(__dirname, 'Tecnobloco-ERP-Apresentacao.pdf');

const BROWSERS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

const browser = BROWSERS.find(b => fs.existsSync(b));

if (!browser) {
  console.error('\n❌  Nenhum browser compatível encontrado (Edge ou Chrome).');
  console.error('   Para gerar o PDF manualmente:');
  console.error('   1. Abra o arquivo: docs/apresentacao-tecnobloco.html no Chrome ou Edge');
  console.error('   2. Pressione Ctrl+P');
  console.error('   3. Destino: "Salvar como PDF" → A4 → Salvar\n');
  process.exit(1);
}

console.log(`\n[PDF] Browser: ${path.basename(browser)}`);
console.log(`[PDF] Origem:  ${HTML}`);
console.log(`[PDF] Destino: ${PDF}`);
console.log('[PDF] Gerando...\n');

const userDataDir = path.join(require('os').tmpdir(), 'tecnobloco-pdf-gen');

const result = spawnSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--print-to-pdf=${PDF}`,
  '--no-pdf-header-footer',
  '--print-to-pdf-no-header',
  '--run-all-compositor-stages-before-draw',
  `--user-data-dir=${userDataDir}`,
  `file:///${HTML.replace(/\\/g, '/')}`,
], { encoding: 'utf8', timeout: 45000 });

if (result.error) {
  console.error('❌  Erro ao executar browser:', result.error.message);
  process.exit(1);
}

if (fs.existsSync(PDF)) {
  const kb = Math.round(fs.statSync(PDF).size / 1024);
  console.log(`✅  PDF gerado com sucesso! (${kb} KB)`);
  console.log(`   → ${PDF}\n`);
} else {
  console.error('❌  PDF não foi gerado. Tente o método manual:');
  console.error('   Abra apresentacao-tecnobloco.html no Chrome → Ctrl+P → Salvar como PDF\n');
  process.exit(1);
}
