'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/frota/FrotaController');

const FRO = requireDepartamento('Frotas');

router.get('/stats',    authenticate, requireNivel(3), FRO, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(3), FRO, C.recentesViagens.bind(C));

// ── Veículos ──────────────────────────────────────────────────────────────────
router.get('/veiculos',      authenticate, requireNivel(3), FRO, C.listarVeiculos.bind(C));
router.post('/veiculos',     authenticate, requireNivel(4), FRO, C.criarVeiculo.bind(C));
router.put('/veiculos/:id',  authenticate, requireNivel(4), FRO, C.atualizarVeiculo.bind(C));

// ── Viagens ───────────────────────────────────────────────────────────────────
router.get('/viagens',          authenticate, requireNivel(3), FRO, C.listarViagens.bind(C));
router.post('/viagens',         authenticate, requireNivel(3), FRO, C.criarViagem.bind(C));
router.put('/viagens/:id/finalizar', authenticate, requireNivel(3), FRO, C.finalizarViagem.bind(C));

// ── Abastecimentos ────────────────────────────────────────────────────────────
router.get('/abastecimentos',   authenticate, requireNivel(3), FRO, C.listarAbastecimentos.bind(C));
router.post('/abastecimentos',  authenticate, requireNivel(3), FRO, C.registrarAbastecimento.bind(C));

// ── Manutenções ───────────────────────────────────────────────────────────────
router.get('/manutencoes',      authenticate, requireNivel(3), FRO, C.listarManutencoes.bind(C));
router.post('/manutencoes',     authenticate, requireNivel(3), FRO, C.criarManutencao.bind(C));
router.put('/manutencoes/:id',  authenticate, requireNivel(4), FRO, C.atualizarManutencao.bind(C));

// ── Multas ────────────────────────────────────────────────────────────────────
router.get('/multas',           authenticate, requireNivel(4), FRO, C.listarMultas.bind(C));
router.post('/multas',          authenticate, requireNivel(4), FRO, C.registrarMulta.bind(C));
router.put('/multas/:id',       authenticate, requireNivel(4), FRO, C.atualizarMulta.bind(C));

// ── Checklists ────────────────────────────────────────────────────────────────
router.get('/checklists',       authenticate, requireNivel(3), FRO, C.listarChecklists.bind(C));
router.post('/checklists',      authenticate, requireNivel(3), FRO, C.registrarChecklist.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',          authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',         authenticate, requireNivel(4), FRO, C.criarEscala.bind(C));
router.delete('/escalas/:id',   authenticate, requireNivel(4), FRO, C.excluirEscala.bind(C));

// ── Motoristas / CNH ─────────────────────────────────────────────────────────
router.get('/motoristas-cnh',      authenticate, requireNivel(4), FRO, C.listarMotoristasCNH.bind(C));
router.post('/motoristas-cnh',     authenticate, requireNivel(4), FRO, C.criarMotorista.bind(C));
router.put('/motoristas-cnh/:id',  authenticate, requireNivel(4), FRO, C.atualizarMotorista.bind(C));

// ── Rotas ─────────────────────────────────────────────────────────────────────
router.get('/rotas',           authenticate, requireNivel(4), FRO, C.listarRotas.bind(C));
router.post('/rotas',          authenticate, requireNivel(4), FRO, C.criarRota.bind(C));
router.put('/rotas/:id',       authenticate, requireNivel(4), FRO, C.atualizarRota.bind(C));
router.delete('/rotas/:id',    authenticate, requireNivel(4), FRO, C.excluirRota.bind(C));

// ── Consumo / Depreciação ─────────────────────────────────────────────────────
router.get('/consumo',          authenticate, requireNivel(3), FRO, C.consumoVeiculos.bind(C));
router.get('/depreciacao',      authenticate, requireNivel(5), FRO, C.depreciacaoVeiculos.bind(C));

// ── Solicitações de Uso ───────────────────────────────────────────────────────
router.get('/solicitacoes-uso',        authenticate, requireNivel(4), FRO, C.listarSolicitacoesUso.bind(C));
router.post('/solicitacoes-uso',       authenticate, requireNivel(2), C.criarSolicitacaoUso.bind(C));
router.put('/solicitacoes-uso/:id',    authenticate, requireNivel(4), FRO, C.responderSolicitacaoUso.bind(C));

// ── Localização ───────────────────────────────────────────────────────────────
router.get('/localizacao',      authenticate, requireNivel(3), FRO, C.localizacaoMotoristas.bind(C));

// ── Dados Técnicos ────────────────────────────────────────────────────────────
router.get('/dados-tecnicos',    authenticate, requireNivel(3), FRO, C.listarDadosTecnicos.bind(C));
router.post('/dados-tecnicos',   authenticate, requireNivel(3), FRO, C.registrarDadosTecnicos.bind(C));

// ── Plano Preventiva ──────────────────────────────────────────────────────────
router.get('/preventiva',        authenticate, requireNivel(4), FRO, C.listarPlanoPreventiva.bind(C));
router.post('/preventiva',       authenticate, requireNivel(4), FRO, C.criarPlanoPreventiva.bind(C));
router.put('/preventiva/:id',    authenticate, requireNivel(4), FRO, C.atualizarPlanoPreventiva.bind(C));
router.delete('/preventiva/:id', authenticate, requireNivel(4), FRO, C.excluirPlanoPreventiva.bind(C));

// ── Pneus ─────────────────────────────────────────────────────────────────────
router.get('/pneus',          authenticate, requireNivel(3), FRO, C.listarPneus.bind(C));
router.post('/pneus',         authenticate, requireNivel(3), FRO, C.criarPneu.bind(C));
router.put('/pneus/:id',      authenticate, requireNivel(3), FRO, C.atualizarPneu.bind(C));

// ── Refrigeração ──────────────────────────────────────────────────────────────
router.get('/refrigeracao',    authenticate, requireNivel(3), FRO, C.listarRefrigeracao.bind(C));
router.post('/refrigeracao',   authenticate, requireNivel(3), FRO, C.registrarRefrigeracao.bind(C));

// ── Higienização Tanques ──────────────────────────────────────────────────────
router.get('/higienizacoes',              authenticate, requireNivel(3), FRO, C.listarHigienizacoesTanque.bind(C));
router.post('/higienizacoes',             authenticate, requireNivel(3), FRO, C.registrarHigienizacaoTanque.bind(C));
router.put('/higienizacoes/:id/aprovar',  authenticate, requireNivel(4), FRO, C.aprovarHigienizacaoTanque.bind(C));

// ── Pedágios ──────────────────────────────────────────────────────────────────
router.get('/pedagogios',               authenticate, requireNivel(2), FRO, C.listarPedagios.bind(C));
router.post('/pedagogios',              authenticate, requireNivel(2), FRO, C.registrarPedagio.bind(C));
router.put('/pedagogios/:id/conciliar', authenticate, requireNivel(4), FRO, C.conciliarPedagio.bind(C));

// ── Sinistros ─────────────────────────────────────────────────────────────────
router.get('/sinistros',      authenticate, requireNivel(4), FRO, C.listarSinistros.bind(C));
router.post('/sinistros',     authenticate, requireNivel(4), FRO, C.criarSinistro.bind(C));
router.put('/sinistros/:id',  authenticate, requireNivel(4), FRO, C.atualizarSinistro.bind(C));

// ── Tanques Comunitários ──────────────────────────────────────────────────────
router.get('/tanques-comunitarios',      authenticate, requireNivel(4), FRO, C.listarTanquesComunitarios.bind(C));
router.post('/tanques-comunitarios',     authenticate, requireNivel(4), FRO, C.criarTanqueComunitario.bind(C));
router.put('/tanques-comunitarios/:id',  authenticate, requireNivel(4), FRO, C.atualizarTanqueComunitario.bind(C));

// ── Captação / Pesagem ────────────────────────────────────────────────────────
router.get('/captacao',        authenticate, requireNivel(4), FRO, C.historicoCaptacao.bind(C));
router.get('/pesagens',        authenticate, requireNivel(2), FRO, C.listarPesagens.bind(C));
router.post('/pesagens',       authenticate, requireNivel(2), FRO, C.registrarPesagem.bind(C));

// ── Qualidade Leite ───────────────────────────────────────────────────────────
router.get('/qualidade-leite', authenticate, requireNivel(4), FRO, C.qualidadeLeiteProdutor.bind(C));

// ── Alertas ───────────────────────────────────────────────────────────────────
router.get('/alertas',         authenticate, requireNivel(3), FRO, C.painelAlertas.bind(C));

// ── Relatório de Custos ───────────────────────────────────────────────────────
router.get('/relatorio-custos', authenticate, requireNivel(4), FRO, C.relatorioCustos.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/motoristas', authenticate, requireNivel(3), C.listarMotoristas.bind(C));
router.get('/usuarios',   authenticate, requireNivel(3), C.listarUsuarios.bind(C));

module.exports = router;
