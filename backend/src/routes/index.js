'use strict';

const path   = require('path');
const router = require('express').Router();
const { apiLimiter } = require('../middleware/rate-limit.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// ── Feature flags ─────────────────────────────────────────────────────────────
const FLAGS_PATH = path.join(__dirname, '../../../shared/feature-flags.json');
let featureFlags = { modules: {} };
try {
  featureFlags = require(FLAGS_PATH);
} catch (e) {
  console.warn('[Feature Flags] Arquivo não encontrado em', FLAGS_PATH, '— usando padrão (tudo habilitado)');
}

function isEnabled(module) {
  const entry = featureFlags.modules && featureFlags.modules[module];
  if (!entry) return true;
  return entry.enabled !== false;
}

// ── Middlewares globais ───────────────────────────────────────────────────────
router.use(auditMiddleware);
router.use(apiLimiter);

// ── Endpoints públicos (sem autenticação) ─────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'online', time: new Date().toISOString() });
});

router.get('/feature-flags', (req, res) => {
  const publicFlags = {};
  const mods = (featureFlags.modules || {});
  Object.keys(mods).forEach(key => {
    publicFlags[key] = { enabled: mods[key].enabled !== false, label: mods[key].label || key };
  });
  res.json({ success: true, data: publicFlags });
});

// ── Módulos sempre ativos ─────────────────────────────────────────────────────
router.use('/auth',      require('./auth.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/admin',     require('./admin.routes'));
router.use('/manutencao', require('./manutencao.routes'));

// ── 404 para rotas não encontradas ────────────────────────────────────────────
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

module.exports = router;
