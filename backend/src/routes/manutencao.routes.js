'use strict';

const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const router = require('express').Router();
const { authenticate, requireNivel } = require('../middleware/auth.middleware');
const C    = require('../controllers/manutencao/ManutencaoController');
const pool = require('../../config/database');

// ── Multer: upload de manuais PDF ─────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../../uploads/manuals');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Apenas arquivos PDF são aceitos'));
  },
});

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',
  authenticate, requireNivel(1),
  C.getStats.bind(C));

// ── Ordens de Serviço ─────────────────────────────────────────────────────────
router.get('/os',
  authenticate, requireNivel(1),
  C.listarOS.bind(C));

router.post('/os',
  authenticate, requireNivel(1),
  C.criarOS.bind(C));

router.get('/os/:id',
  authenticate, requireNivel(1),
  C.buscarOS.bind(C));

router.put('/os/:id',
  authenticate, requireNivel(2),
  C.atualizarOS.bind(C));

router.put('/os/:id/status',
  authenticate, requireNivel(2),
  C.atualizarStatusOS.bind(C));

router.post('/os/:id/apontar',
  authenticate, requireNivel(2),
  C.apontarOS.bind(C));

// ── Manutenção Preventiva ─────────────────────────────────────────────────────
router.get('/preventiva',
  authenticate, requireNivel(1),
  C.listarPreventiva.bind(C));

router.post('/preventiva',
  authenticate, requireNivel(3),
  C.criarPreventiva.bind(C));

router.put('/preventiva/:id',
  authenticate, requireNivel(3),
  C.atualizarPreventiva.bind(C));

router.post('/preventiva/:id/executar',
  authenticate, requireNivel(2),
  C.executarPreventiva.bind(C));

// ── Departamentos (lookup para formulários) ───────────────────────────────────
router.get('/departamentos',
  authenticate, requireNivel(1),
  async (req, res, next) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, nome FROM departamentos WHERE ativo = 1 ORDER BY nome'
      );
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  }
);

// ── Equipamentos ──────────────────────────────────────────────────────────────
router.get('/equipamentos',
  authenticate, requireNivel(1),
  C.listarEquipamentos.bind(C));

router.post('/equipamentos',
  authenticate, requireNivel(3),
  C.criarEquipamento.bind(C));

router.put('/equipamentos/:id',
  authenticate, requireNivel(2),
  C.atualizarEquipamento.bind(C));

router.get('/equipamentos/:id/prontuario',
  authenticate, requireNivel(1),
  C.prontuarioEquipamento.bind(C));

router.post('/equipamentos/:id/manual',
  authenticate, requireNivel(2),
  upload.single('manual'),
  C.uploadManual.bind(C));

// ── Indicadores ───────────────────────────────────────────────────────────────
router.get('/indicadores',
  authenticate, requireNivel(3),
  C.calcularIndicadores.bind(C));

module.exports = router;
