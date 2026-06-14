'use strict';

const router = require('express').Router();
const { authenticate, requireNivel, requireDepartamento } = require('../middleware/auth.middleware');
const C = require('../controllers/rh/RhController');

const RH = requireDepartamento('RH');

router.get('/stats',    authenticate, requireNivel(4), RH, C.getStats.bind(C));
router.get('/recentes', authenticate, requireNivel(4), RH, C.recentesColaboradores.bind(C));

// ── Colaboradores ─────────────────────────────────────────────────────────────
router.get('/colaboradores',      authenticate, requireNivel(4), RH, C.listarColaboradores.bind(C));
router.get('/colaboradores/:id',  authenticate, requireNivel(4), RH, C.buscarColaborador.bind(C));
router.post('/colaboradores',     authenticate, requireNivel(4), RH, C.criarColaborador.bind(C));
router.put('/colaboradores/:id',  authenticate, requireNivel(4), RH, C.atualizarColaborador.bind(C));

// ── Ponto ─────────────────────────────────────────────────────────────────────
router.get('/ponto',   authenticate, requireNivel(4), RH, C.listarPonto.bind(C));
router.post('/ponto',  authenticate, requireNivel(3), RH, C.registrarPonto.bind(C));

// ── Férias ────────────────────────────────────────────────────────────────────
router.get('/ferias',      authenticate, requireNivel(4), RH, C.listarFerias.bind(C));
router.post('/ferias',     authenticate, requireNivel(4), RH, C.criarFerias.bind(C));
router.put('/ferias/:id',  authenticate, requireNivel(5), RH, C.atualizarFerias.bind(C));

// ── EPIs ──────────────────────────────────────────────────────────────────────
router.get('/epis',              authenticate, requireNivel(3), RH, C.listarEpis.bind(C));
router.post('/epis',             authenticate, requireNivel(4), RH, C.criarEpi.bind(C));
router.get('/epis/entregas',     authenticate, requireNivel(3), RH, C.listarEntregasEpi.bind(C));
router.post('/epis/entregas',    authenticate, requireNivel(3), RH, C.registrarEntregaEpi.bind(C));

// ── Treinamentos ──────────────────────────────────────────────────────────────
router.get('/treinamentos',              authenticate, requireNivel(3), RH, C.listarTreinamentos.bind(C));
router.post('/treinamentos',             authenticate, requireNivel(4), RH, C.criarTreinamento.bind(C));
router.get('/treinamentos/participacoes', authenticate, requireNivel(3), RH, C.listarParticipacoes.bind(C));
router.post('/treinamentos/participacoes',authenticate, requireNivel(3), RH, C.registrarParticipacao.bind(C));

// ── Holerites ─────────────────────────────────────────────────────────────────
router.get('/holerites',   authenticate, requireNivel(4), RH, C.listarHolerites.bind(C));
router.post('/holerites',  authenticate, requireNivel(5), RH, C.criarHolerite.bind(C));

// ── Adiantamentos ─────────────────────────────────────────────────────────────
router.get('/adiantamentos',      authenticate, requireNivel(4), RH, C.listarAdiantamentos.bind(C));
router.put('/adiantamentos/:id',  authenticate, requireNivel(5), RH, C.atualizarAdiantamento.bind(C));

// ── Ramais ────────────────────────────────────────────────────────────────────
router.get('/ramais',        authenticate, requireNivel(0), C.listarRamais.bind(C));
router.post('/ramais',       authenticate, requireNivel(4), RH, C.criarRamal.bind(C));
router.delete('/ramais/:id', authenticate, requireNivel(4), RH, C.excluirRamal.bind(C));

// ── Denúncias ─────────────────────────────────────────────────────────────────
router.get('/denuncias',      authenticate, requireNivel(5), RH, C.listarDenuncias.bind(C));
router.put('/denuncias/:id',  authenticate, requireNivel(5), RH, C.atualizarDenuncia.bind(C));

// ── Documentos ────────────────────────────────────────────────────────────────
router.get('/documentos',         authenticate, requireNivel(4), RH, C.listarDocumentos.bind(C));
router.put('/documentos/:id/validar', authenticate, requireNivel(4), RH, C.validarDocumento.bind(C));

// ── Escalas ───────────────────────────────────────────────────────────────────
router.get('/escalas',        authenticate, requireNivel(0), C.listarEscalas.bind(C));
router.post('/escalas',       authenticate, requireNivel(4), RH, C.criarEscala.bind(C));
router.delete('/escalas/:id', authenticate, requireNivel(4), RH, C.excluirEscala.bind(C));

// ── Selects ───────────────────────────────────────────────────────────────────
router.get('/departamentos', authenticate, requireNivel(3), C.listarDepartamentos.bind(C));
router.get('/cargos',        authenticate, requireNivel(3), C.listarCargos.bind(C));
router.get('/usuarios',      authenticate, requireNivel(3), C.listarUsuarios.bind(C));

// ── Ficha Completa ────────────────────────────────────────────────────────────
router.get('/colaboradores/:id/ficha', authenticate, requireNivel(4), RH, C.fichaCompleta.bind(C));

// ── Saúde / Alergias ──────────────────────────────────────────────────────────
router.get('/colaboradores/:id/saude',       authenticate, requireNivel(4), RH, C.listarSaude.bind(C));
router.post('/colaboradores/:id/saude',      authenticate, requireNivel(4), RH, C.criarSaude.bind(C));
router.delete('/colaboradores/:id/saude/:sid', authenticate, requireNivel(5), RH, C.excluirSaude.bind(C));

// ── CNH ───────────────────────────────────────────────────────────────────────
router.get('/colaboradores/:id/cnh',  authenticate, requireNivel(4), RH, C.buscarCnh.bind(C));
router.put('/colaboradores/:id/cnh',  authenticate, requireNivel(4), RH, C.salvarCnh.bind(C));
router.get('/cnh/proximas-vencer',    authenticate, requireNivel(4), RH, C.cnhProximasVencer.bind(C));
router.get('/cnh/vencidas',           authenticate, requireNivel(4), RH, C.cnhVencidas.bind(C));

// ── Contatos de Emergência ────────────────────────────────────────────────────
router.get('/colaboradores/:id/contatos',          authenticate, requireNivel(4), RH, C.listarContatosEmergencia.bind(C));
router.post('/colaboradores/:id/contatos',         authenticate, requireNivel(4), RH, C.criarContatoEmergencia.bind(C));
router.delete('/colaboradores/:id/contatos/:cid',  authenticate, requireNivel(4), RH, C.excluirContatoEmergencia.bind(C));

// ── Dependentes ───────────────────────────────────────────────────────────────
router.get('/colaboradores/:id/dependentes',         authenticate, requireNivel(4), RH, C.listarDependentes.bind(C));
router.post('/colaboradores/:id/dependentes',        authenticate, requireNivel(4), RH, C.criarDependente.bind(C));
router.delete('/colaboradores/:id/dependentes/:did', authenticate, requireNivel(4), RH, C.excluirDependente.bind(C));

// ── Benefícios ────────────────────────────────────────────────────────────────
router.get('/colaboradores/:id/beneficios',         authenticate, requireNivel(4), RH, C.listarBeneficios.bind(C));
router.post('/colaboradores/:id/beneficios',        authenticate, requireNivel(4), RH, C.criarBeneficio.bind(C));
router.delete('/colaboradores/:id/beneficios/:bid', authenticate, requireNivel(5), RH, C.removerBeneficio.bind(C));

// ── Histórico Salarial ────────────────────────────────────────────────────────
router.get('/colaboradores/:id/historico-salarial',  authenticate, requireNivel(5), RH, C.listarHistoricoSalarial.bind(C));
router.post('/colaboradores/:id/historico-salarial', authenticate, requireNivel(5), RH, C.criarHistoricoSalarial.bind(C));

// ── Afastamentos ──────────────────────────────────────────────────────────────
router.get('/afastamentos',      authenticate, requireNivel(4), RH, C.listarAfastamentos.bind(C));
router.post('/afastamentos',     authenticate, requireNivel(3), RH, C.criarAfastamento.bind(C));
router.put('/afastamentos/:id',  authenticate, requireNivel(4), RH, C.validarAfastamento.bind(C));

// ── Advertências ──────────────────────────────────────────────────────────────
router.get('/advertencias',   authenticate, requireNivel(5), RH, C.listarAdvertencias.bind(C));
router.post('/advertencias',  authenticate, requireNivel(5), RH, C.criarAdvertencia.bind(C));

// ── Movimentações ─────────────────────────────────────────────────────────────
router.get('/movimentacoes',  authenticate, requireNivel(4), RH, C.listarMovimentacoes.bind(C));
router.post('/movimentacoes', authenticate, requireNivel(5), RH, C.criarMovimentacao.bind(C));

// ── Organograma ───────────────────────────────────────────────────────────────
router.get('/organograma',      authenticate, requireNivel(3), RH, C.organograma.bind(C));
router.get('/aniversariantes',  authenticate, requireNivel(3), C.aniversariantesMes.bind(C));

// ── Adiantamentos: criação (todos os níveis podem solicitar) ──────────────────
router.post('/adiantamentos', authenticate, requireNivel(0), C.criarAdiantamento.bind(C));

// ── Denúncias: submissão (autenticado, nível mínimo 0) ───────────────────────
router.post('/denuncias', authenticate, requireNivel(0), C.criarDenuncia.bind(C));

// ── Advertências: excluir (somente diretores) ────────────────────────────────
router.delete('/advertencias/:id', authenticate, requireNivel(6), RH, C.excluirAdvertencia.bind(C));

// ── Afastamentos: excluir (gerente RH) ───────────────────────────────────────
router.delete('/afastamentos/:id', authenticate, requireNivel(5), RH, C.excluirAfastamento.bind(C));

// ── Recrutamento: Vagas ───────────────────────────────────────────────────────
router.get('/vagas',         authenticate, requireNivel(4), RH, C.listarVagas.bind(C));
router.post('/vagas',        authenticate, requireNivel(5), RH, C.criarVaga.bind(C));
router.put('/vagas/:id',     authenticate, requireNivel(5), RH, C.atualizarVaga.bind(C));

// ── Recrutamento: Candidatos ──────────────────────────────────────────────────
router.get('/vagas/:vagaId/candidatos',       authenticate, requireNivel(4), RH, C.listarCandidatos.bind(C));
router.post('/vagas/:vagaId/candidatos',      authenticate, requireNivel(4), RH, C.criarCandidato.bind(C));
router.put('/vagas/:vagaId/candidatos/:id',   authenticate, requireNivel(4), RH, C.atualizarCandidato.bind(C));
router.delete('/vagas/:vagaId/candidatos/:id',authenticate, requireNivel(5), RH, C.excluirCandidato.bind(C));

// ── Onboarding ────────────────────────────────────────────────────────────────
router.get('/onboarding/:colaboradorId',          authenticate, requireNivel(4), RH, C.listarOnboarding.bind(C));
router.post('/onboarding/:colaboradorId',         authenticate, requireNivel(4), RH, C.criarOnboarding.bind(C));
router.post('/onboarding/:colaboradorId/padrao',  authenticate, requireNivel(4), RH, C.criarChecklistPadrao.bind(C));
router.put('/onboarding/:colaboradorId/:id',      authenticate, requireNivel(3), RH, C.concluirOnboarding.bind(C));
router.delete('/onboarding/:colaboradorId/:id',   authenticate, requireNivel(5), RH, C.excluirOnboarding.bind(C));

// ── Saúde Ocupacional: ASO ────────────────────────────────────────────────────
router.get('/aso',                         authenticate, requireNivel(4), RH, C.listarAso.bind(C));
router.get('/aso/vencendo',                authenticate, requireNivel(4), RH, C.asoVencendo.bind(C));
router.get('/aso/vencidos',                authenticate, requireNivel(4), RH, C.asoVencidos.bind(C));
router.get('/colaboradores/:id/aso',       authenticate, requireNivel(4), RH, C.listarAso.bind(C));
router.post('/colaboradores/:id/aso',      authenticate, requireNivel(4), RH, C.criarAso.bind(C));

// ── Avaliações de Desempenho ──────────────────────────────────────────────────
router.get('/avaliacoes',                        authenticate, requireNivel(4), RH, C.listarAvaliacoes.bind(C));
router.get('/colaboradores/:id/avaliacoes',      authenticate, requireNivel(4), RH, C.listarAvaliacoes.bind(C));
router.post('/colaboradores/:id/avaliacoes',     authenticate, requireNivel(4), RH, C.criarAvaliacao.bind(C));

// ── Cardápio ──────────────────────────────────────────────────────────────────
router.get('/cardapio',          authenticate, requireNivel(0), C.listarCardapio.bind(C));
router.post('/cardapio',         authenticate, requireNivel(4), RH, C.salvarCardapio.bind(C));
router.delete('/cardapio/:id',   authenticate, requireNivel(4), RH, C.excluirCardapio.bind(C));

// ── Banco de Horas ────────────────────────────────────────────────────────────
router.get('/banco-horas',                            authenticate, requireNivel(4), RH, C.listarBancoHoras.bind(C));
router.get('/colaboradores/:id/banco-horas',          authenticate, requireNivel(4), RH, C.listarBancoHoras.bind(C));
router.get('/colaboradores/:id/banco-horas/saldo',    authenticate, requireNivel(4), RH, C.saldoBancoHoras.bind(C));
router.post('/colaboradores/:id/banco-horas',         authenticate, requireNivel(4), RH, C.criarLancamentoBancoHoras.bind(C));

// ── Relatórios ────────────────────────────────────────────────────────────────
router.get('/relatorios/turnover',      authenticate, requireNivel(5), RH, C.relatorioTurnover.bind(C));
router.get('/relatorios/absenteismo',   authenticate, requireNivel(5), RH, C.relatorioAbsenteismo.bind(C));

module.exports = router;
