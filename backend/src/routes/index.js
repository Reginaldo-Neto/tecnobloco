'use strict';

const path   = require('path');
const router = require('express').Router();
const { apiLimiter } = require('../middleware/rate-limit.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// ── Feature flags ─────────────────────────────────────────────────────────────
// Lê shared/feature-flags.json em tempo de inicialização.
// Para alterar flags, edite o arquivo e reinicie o servidor.
const FLAGS_PATH = path.join(__dirname, '../../../shared/feature-flags.json');
let featureFlags = { modules: {} };
try {
  featureFlags = require(FLAGS_PATH);
} catch (e) {
  console.warn('[Feature Flags] Arquivo não encontrado em', FLAGS_PATH, '— usando padrão (tudo habilitado)');
}

function isEnabled(module) {
  const entry = featureFlags.modules && featureFlags.modules[module];
  if (!entry) return true; // se não configurado, habilita por padrão
  return entry.enabled !== false;
}

// ── Middlewares globais ───────────────────────────────────────────────────────
router.use(auditMiddleware);
router.use(apiLimiter);

// ── Endpoints públicos (sem autenticação) ─────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'online', time: new Date().toISOString() });
});

// Expõe as feature flags para o frontend (sem dados sensíveis)
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
router.use('/global',    require('./global.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/admin',     require('./admin.routes'));

// ── Módulos condicionais por feature flag ─────────────────────────────────────
function moduleRoute(name, routeFile) {
  if (!isEnabled(name)) {
    // Responde 503 para qualquer rota do módulo desabilitado
    router.use(`/${name}`, (req, res) => {
      res.status(503).json({ success: false, message: `Módulo "${name}" desabilitado nesta instalação.` });
    });
    return;
  }
  router.use(`/${name}`, require(routeFile));
}

moduleRoute('rh',              './rh.routes');
moduleRoute('financeiro',      './financeiro.routes');
moduleRoute('producao',        './producao.routes');
moduleRoute('qualidade',       './qualidade.routes');
moduleRoute('estoque',         './estoque.routes');
moduleRoute('manutencao',      './manutencao.routes');
moduleRoute('sac',             './sac.routes');
moduleRoute('vendas',          './vendas.routes');
moduleRoute('compras',         './compras.routes');
moduleRoute('frota',           './frota.routes');
moduleRoute('limpeza',         './limpeza.routes');
moduleRoute('lavanderia',      './lavanderia.routes');
moduleRoute('ti',              './ti.routes');
moduleRoute('servicos-gerais', './servicos-gerais.routes');
moduleRoute('seguranca',       './seguranca.routes');
moduleRoute('juridico',        './juridico.routes');
// moduleRoute('auditoria',    './auditoria.routes');
// moduleRoute('notificacoes', './notificacoes.routes');

// ── 404 para rotas não encontradas ────────────────────────────────────────────
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

module.exports = router;
