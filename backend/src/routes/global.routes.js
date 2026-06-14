'use strict';

const router = require('express').Router();
const C = require('../controllers/global/GlobalController');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// ─── HELPERS (DROPDOWNS) ────────────────────────────────────────────────────
router.get('/departamentos',         C.listaDepartamentos.bind(C));
router.get('/usuarios',              C.listaUsuarios.bind(C));
router.get('/equipamentos',          C.listaEquipamentos.bind(C));
router.get('/veiculos-disp',         C.listaVeiculosDisponiveis.bind(C));

// ─── F01 / F02 — REUNIÕES ───────────────────────────────────────────────────
router.post('/reunioes',             C.criarReuniao.bind(C));
router.get('/reunioes',              C.listarReunioes.bind(C));
router.delete('/reunioes/:id',       C.cancelarReuniao.bind(C));

// ─── F03 / F04 — ORDENS DE SERVIÇO ─────────────────────────────────────────
router.post('/os',                   C.criarOs.bind(C));
router.get('/os',                    C.listarOs.bind(C));
router.delete('/os/:id',             C.cancelarOs.bind(C));

// ─── F05 / F06 — LIMPEZA ───────────────────────────────────────────────────
router.post('/limpeza',              C.criarLimpeza.bind(C));
router.get('/limpeza',               C.listarLimpezas.bind(C));
router.delete('/limpeza/:id',        C.cancelarLimpeza.bind(C));

// ─── F07 / F08 — COMPRAS ───────────────────────────────────────────────────
router.post('/compras',              C.criarCompra.bind(C));
router.get('/compras',               C.listarCompras.bind(C));
router.delete('/compras/:id',        C.cancelarCompra.bind(C));

// ─── F09 / F10 — DOCUMENTOS PESSOAIS ───────────────────────────────────────
router.post('/documentos',           C.criarDocumento.bind(C));
router.get('/documentos',            C.listarDocumentos.bind(C));

// ─── F11 / F12 — OCORRÊNCIAS ────────────────────────────────────────────────
router.post('/ocorrencias',          C.criarOcorrencia.bind(C));
router.get('/ocorrencias',           C.listarOcorrencias.bind(C));

// ─── F13 / F27 — ESTOQUE ───────────────────────────────────────────────────
router.get('/estoque',               C.listarEstoque.bind(C));
router.post('/estoque/req',          C.criarRequisicaoEstoque.bind(C));

// ─── F14 — CARDÁPIO ─────────────────────────────────────────────────────────
// /cardapio/semana ANTES de /cardapio para não colidir com :id
router.get('/cardapio/semana',       C.listarCardapioDaSemana.bind(C));
router.get('/cardapio',              C.listarCardapio.bind(C));

// ─── F15 — TREINAMENTOS ─────────────────────────────────────────────────────
router.get('/treinamentos',          C.listarTreinamentos.bind(C));

// ─── F16 — HOLERITES ───────────────────────────────────────────────────────
router.get('/holerites',             C.listarHolerites.bind(C));

// ─── F17 — BANCO DE HORAS ──────────────────────────────────────────────────
router.get('/banco-horas',           C.getBancoHoras.bind(C));

// ─── F18 — RAMAIS ──────────────────────────────────────────────────────────
router.get('/ramais',                C.listarRamais.bind(C));

// ─── F19 — CANAL DE ÉTICA (SEM AUDITORIA DE IDENTIDADE) ────────────────────
router.post('/etica',                C.criarDenuncia.bind(C));

// ─── F20 — EPIs ────────────────────────────────────────────────────────────
router.get('/epis',                  C.listarEpis.bind(C));

// ─── F21 — ADIANTAMENTOS ───────────────────────────────────────────────────
router.post('/adiantamentos',        C.criarAdiantamento.bind(C));
router.get('/adiantamentos',         C.listarAdiantamentos.bind(C));
router.delete('/adiantamentos/:id',  C.cancelarAdiantamento.bind(C));

// ─── F22 — BUG REPORTS ─────────────────────────────────────────────────────
router.post('/bugs',                 C.criarBug.bind(C));
router.get('/bugs',                  C.listarBugs.bind(C));

// ─── F23 — CHAMADOS DE TI ──────────────────────────────────────────────────
router.post('/chamados-ti',          C.criarChamadoTI.bind(C));
router.get('/chamados-ti',           C.listarChamadosTI.bind(C));

// ─── F24 — LAVANDERIA ──────────────────────────────────────────────────────
router.post('/lavanderia',           C.criarLavanderia.bind(C));
router.get('/lavanderia',            C.listarLavanderia.bind(C));
router.delete('/lavanderia/:id',     C.cancelarLavanderia.bind(C));

// ─── F25 — SERVIÇOS GERAIS ─────────────────────────────────────────────────
router.post('/servicos-gerais',      C.criarServicosGerais.bind(C));
router.get('/servicos-gerais',       C.listarServicosGerais.bind(C));
router.delete('/servicos-gerais/:id',C.cancelarServicosGerais.bind(C));

// ─── F26 — VEÍCULOS ────────────────────────────────────────────────────────
router.post('/veiculo',              C.criarVeiculo.bind(C));
router.get('/veiculo',               C.listarVeiculos.bind(C));
router.delete('/veiculo/:id',        C.cancelarVeiculo.bind(C));

// ─── F28 — ESCALA DE MANUTENÇÃO ────────────────────────────────────────────
router.get('/escala-manutencao',     C.listarEscalaManutencao.bind(C));

module.exports = router;
