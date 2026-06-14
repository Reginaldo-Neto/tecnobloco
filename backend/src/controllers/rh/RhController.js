'use strict';

const S = require('../../services/rh/RhService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class RhController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesColaboradores(req, res, next) {
    try { res.json({ success: true, data: await S.recentesColaboradores() }); } catch(e) { next(e); }
  }

  // ── Colaboradores ─────────────────────────────────────────────────────────────

  async listarColaboradores(req, res, next) {
    try { res.json({ success: true, data: await S.listarColaboradores(req.query) }); } catch(e) { next(e); }
  }

  async buscarColaborador(req, res, next) {
    try { res.json({ success: true, data: await S.buscarColaborador(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarColaborador(req, res, next) {
    try {
      const data = await S.criarColaborador(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'colaboradores', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarColaborador(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarColaborador(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'colaboradores', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Ponto Eletrônico ──────────────────────────────────────────────────────────

  async listarPonto(req, res, next) {
    try { res.json({ success: true, data: await S.listarPonto(req.query) }); } catch(e) { next(e); }
  }

  async registrarPonto(req, res, next) {
    try {
      const data = await S.registrarPonto(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ponto_eletronico', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Férias ────────────────────────────────────────────────────────────────────

  async listarFerias(req, res, next) {
    try { res.json({ success: true, data: await S.listarFerias(req.query) }); } catch(e) { next(e); }
  }

  async criarFerias(req, res, next) {
    try {
      const data = await S.criarFerias(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ferias', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarFerias(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarFerias(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ferias', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── EPIs ──────────────────────────────────────────────────────────────────────

  async listarEpis(req, res, next) {
    try { res.json({ success: true, data: await S.listarEpis() }); } catch(e) { next(e); }
  }

  async criarEpi(req, res, next) {
    try {
      const data = await S.criarEpi(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'epis', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async listarEntregasEpi(req, res, next) {
    try { res.json({ success: true, data: await S.listarEntregasEpi(req.query) }); } catch(e) { next(e); }
  }

  async registrarEntregaEpi(req, res, next) {
    try {
      const data = await S.registrarEntregaEpi(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'epis_colaboradores', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Treinamentos ──────────────────────────────────────────────────────────────

  async listarTreinamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarTreinamentos() }); } catch(e) { next(e); }
  }

  async criarTreinamento(req, res, next) {
    try {
      const data = await S.criarTreinamento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'treinamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async listarParticipacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarParticipacoes(req.query) }); } catch(e) { next(e); }
  }

  async registrarParticipacao(req, res, next) {
    try {
      const data = await S.registrarParticipacao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'treinamentos_usuarios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Holerites ─────────────────────────────────────────────────────────────────

  async listarHolerites(req, res, next) {
    try { res.json({ success: true, data: await S.listarHolerites(req.query) }); } catch(e) { next(e); }
  }

  async criarHolerite(req, res, next) {
    try {
      const data = await S.criarHolerite(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'holerites', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Adiantamentos ─────────────────────────────────────────────────────────────

  async listarAdiantamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarAdiantamentos(req.query) }); } catch(e) { next(e); }
  }

  async atualizarAdiantamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarAdiantamento(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'adiantamentos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Ramais ────────────────────────────────────────────────────────────────────

  async listarRamais(req, res, next) {
    try { res.json({ success: true, data: await S.listarRamais() }); } catch(e) { next(e); }
  }

  async criarRamal(req, res, next) {
    try {
      const data = await S.criarRamal(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ramais', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirRamal(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirRamal(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'ramais', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Denúncias ─────────────────────────────────────────────────────────────────

  async listarDenuncias(req, res, next) {
    try { res.json({ success: true, data: await S.listarDenuncias(req.query) }); } catch(e) { next(e); }
  }

  async atualizarDenuncia(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarDenuncia(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'denuncias_etica', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Documentos ────────────────────────────────────────────────────────────────

  async listarDocumentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDocumentos(req.query) }); } catch(e) { next(e); }
  }

  async validarDocumento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.validarDocumento(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'documentos_pessoais', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarDepartamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDepartamentos() }); } catch(e) { next(e); }
  }

  async listarCargos(req, res, next) {
    try { res.json({ success: true, data: await S.listarCargos() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }

  // ── Ficha completa ────────────────────────────────────────────────────────────

  async fichaCompleta(req, res, next) {
    try { res.json({ success: true, data: await S.fichaCompleta(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  // ── Saúde ──────────────────────────────────────────────────────────────────────

  async listarSaude(req, res, next) {
    try { res.json({ success: true, data: await S.listarSaude(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarSaude(req, res, next) {
    try {
      const data = await S.criarSaude(req.user.id, { colaborador_id: Number(req.params.id), ...req.body });
      await req.audit(AUDITORIA.CRIACAO, 'rh_saude', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirSaude(req, res, next) {
    try {
      await S.excluirSaude(Number(req.params.sid));
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_saude', Number(req.params.sid), {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── CNH ───────────────────────────────────────────────────────────────────────

  async buscarCnh(req, res, next) {
    try { res.json({ success: true, data: await S.buscarCnh(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async salvarCnh(req, res, next) {
    try {
      const data = await S.salvarCnh(req.user.id, Number(req.params.id), req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'rh_cnh', Number(req.params.id), { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async cnhProximasVencer(req, res, next) {
    try { res.json({ success: true, data: await S.cnhProximasVencer(Number(req.query.dias) || 30) }); } catch(e) { next(e); }
  }

  async cnhVencidas(req, res, next) {
    try { res.json({ success: true, data: await S.cnhVencidas() }); } catch(e) { next(e); }
  }

  // ── Contatos Emergência ───────────────────────────────────────────────────────

  async listarContatosEmergencia(req, res, next) {
    try { res.json({ success: true, data: await S.listarContatosEmergencia(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarContatoEmergencia(req, res, next) {
    try {
      const data = await S.criarContatoEmergencia(Number(req.params.id), req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_contatos_emergencia', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirContatoEmergencia(req, res, next) {
    try {
      await S.excluirContatoEmergencia(Number(req.params.cid));
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_contatos_emergencia', Number(req.params.cid), {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Dependentes ───────────────────────────────────────────────────────────────

  async listarDependentes(req, res, next) {
    try { res.json({ success: true, data: await S.listarDependentes(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarDependente(req, res, next) {
    try {
      const data = await S.criarDependente(Number(req.params.id), req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_dependentes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirDependente(req, res, next) {
    try {
      await S.excluirDependente(Number(req.params.did));
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_dependentes', Number(req.params.did), {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Benefícios ────────────────────────────────────────────────────────────────

  async listarBeneficios(req, res, next) {
    try { res.json({ success: true, data: await S.listarBeneficios(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarBeneficio(req, res, next) {
    try {
      const data = await S.criarBeneficio(req.user.id, Number(req.params.id), req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_beneficios_colaborador', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async removerBeneficio(req, res, next) {
    try {
      await S.removerBeneficio(Number(req.params.bid));
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_beneficios_colaborador', Number(req.params.bid), {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Histórico Salarial ────────────────────────────────────────────────────────

  async listarHistoricoSalarial(req, res, next) {
    try { res.json({ success: true, data: await S.listarHistoricoSalarial(Number(req.params.id)) }); } catch(e) { next(e); }
  }

  async criarHistoricoSalarial(req, res, next) {
    try {
      const data = await S.criarHistoricoSalarial(req.user.id, Number(req.params.id), req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_historico_salarial', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Afastamentos ──────────────────────────────────────────────────────────────

  async listarAfastamentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarAfastamentos(req.query) }); } catch(e) { next(e); }
  }

  async criarAfastamento(req, res, next) {
    try {
      const data = await S.criarAfastamento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_afastamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async validarAfastamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      const data = await S.validarAfastamento(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'rh_afastamentos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Advertências ──────────────────────────────────────────────────────────────

  async listarAdvertencias(req, res, next) {
    try { res.json({ success: true, data: await S.listarAdvertencias(req.query) }); } catch(e) { next(e); }
  }

  async criarAdvertencia(req, res, next) {
    try {
      const data = await S.criarAdvertencia(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_advertencias', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Movimentações ─────────────────────────────────────────────────────────────

  async listarMovimentacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarMovimentacoes(req.query) }); } catch(e) { next(e); }
  }

  async criarMovimentacao(req, res, next) {
    try {
      const data = await S.criarMovimentacao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_movimentacoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Organograma / Headcount ───────────────────────────────────────────────────

  async organograma(req, res, next) {
    try { res.json({ success: true, data: await S.organograma() }); } catch(e) { next(e); }
  }

  // ── Aniversariantes ───────────────────────────────────────────────────────────

  async aniversariantesMes(req, res, next) {
    try { res.json({ success: true, data: await S.aniversariantesMes(req.query.mes) }); } catch(e) { next(e); }
  }

  // ── Adiantamentos: criação ────────────────────────────────────────────────────

  async criarAdiantamento(req, res, next) {
    try {
      const data = await S.criarAdiantamento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'adiantamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Denúncias: criação ────────────────────────────────────────────────────────

  async criarDenuncia(req, res, next) {
    try {
      const data = await S.criarDenuncia(req.body);
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Advertências: excluir ─────────────────────────────────────────────────────

  async excluirAdvertencia(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirAdvertencia(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_advertencias', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Afastamentos: excluir ─────────────────────────────────────────────────────

  async excluirAfastamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirAfastamento(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_afastamentos', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Recrutamento: Vagas ───────────────────────────────────────────────────────

  async listarVagas(req, res, next) {
    try { res.json({ success: true, data: await S.listarVagas(req.query) }); } catch(e) { next(e); }
  }
  async criarVaga(req, res, next) {
    try {
      const data = await S.criarVaga(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_vagas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }
  async atualizarVaga(req, res, next) {
    try {
      const id = Number(req.params.id);
      await S.atualizarVaga(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'rh_vagas', id, { depois: req.body });
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Recrutamento: Candidatos ──────────────────────────────────────────────────

  async listarCandidatos(req, res, next) {
    try { res.json({ success: true, data: await S.listarCandidatos(req.query) }); } catch(e) { next(e); }
  }
  async criarCandidato(req, res, next) {
    try {
      const data = await S.criarCandidato(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_candidatos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }
  async atualizarCandidato(req, res, next) {
    try {
      const id = Number(req.params.id);
      await S.atualizarCandidato(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'rh_candidatos', id, { depois: req.body });
      res.json({ success: true });
    } catch(e) { next(e); }
  }
  async excluirCandidato(req, res, next) {
    try {
      const id = Number(req.params.id);
      await S.excluirCandidato(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_candidatos', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Onboarding ────────────────────────────────────────────────────────────────

  async listarOnboarding(req, res, next) {
    try { res.json({ success: true, data: await S.listarOnboarding(Number(req.params.id)) }); } catch(e) { next(e); }
  }
  async criarOnboarding(req, res, next) {
    try {
      const data = await S.criarOnboarding(req.user.id, Number(req.params.id), req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_onboarding', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }
  async concluirOnboarding(req, res, next) {
    try {
      const id = Number(req.params.oid);
      await S.concluirOnboarding(req.user.id, id);
      await req.audit(AUDITORIA.ALTERACAO, 'rh_onboarding', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }
  async excluirOnboarding(req, res, next) {
    try {
      const id = Number(req.params.oid);
      await S.excluirOnboarding(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'rh_onboarding', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }
  async criarChecklistPadrao(req, res, next) {
    try {
      const data = await S.criarChecklistPadrao(req.user.id, Number(req.params.id));
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── ASO ───────────────────────────────────────────────────────────────────────

  async listarAso(req, res, next) {
    try { res.json({ success: true, data: await S.listarAso(req.query) }); } catch(e) { next(e); }
  }
  async criarAso(req, res, next) {
    try {
      const data = await S.criarAso(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_aso', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }
  async asoVencendo(req, res, next) {
    try { res.json({ success: true, data: await S.asoVencendo(Number(req.query.dias)||30) }); } catch(e) { next(e); }
  }
  async asoVencidos(req, res, next) {
    try { res.json({ success: true, data: await S.asoVencidos() }); } catch(e) { next(e); }
  }

  // ── Avaliações de Desempenho ──────────────────────────────────────────────────

  async listarAvaliacoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarAvaliacoes(req.query) }); } catch(e) { next(e); }
  }
  async criarAvaliacao(req, res, next) {
    try {
      const data = await S.criarAvaliacao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_avaliacoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Cardápio ─────────────────────────────────────────────────────────────────

  async listarCardapio(req, res, next) {
    try { res.json({ success: true, data: await S.listarCardapio(req.query) }); } catch(e) { next(e); }
  }
  async salvarCardapio(req, res, next) {
    try {
      const data = await S.salvarCardapio(req.user.id, req.body);
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }
  async excluirCardapio(req, res, next) {
    try {
      const id = Number(req.params.id);
      await S.excluirCardapio(id);
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Banco de Horas ────────────────────────────────────────────────────────────

  async listarBancoHoras(req, res, next) {
    try { res.json({ success: true, data: await S.listarBancoHoras(req.query) }); } catch(e) { next(e); }
  }
  async saldoBancoHoras(req, res, next) {
    try { res.json({ success: true, data: await S.saldoBancoHoras(Number(req.params.id)) }); } catch(e) { next(e); }
  }
  async criarLancamentoBancoHoras(req, res, next) {
    try {
      const data = await S.criarLancamentoBancoHoras(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'rh_banco_horas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Relatórios ────────────────────────────────────────────────────────────────

  async relatorioTurnover(req, res, next) {
    try { res.json({ success: true, data: await S.relatorioTurnover(req.query) }); } catch(e) { next(e); }
  }
  async relatorioAbsenteismo(req, res, next) {
    try { res.json({ success: true, data: await S.relatorioAbsenteismo(req.query) }); } catch(e) { next(e); }
  }
}

module.exports = new RhController();
