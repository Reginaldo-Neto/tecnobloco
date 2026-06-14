'use strict';

const S = require('../../services/frota/FrotaService');
const { HTTP, AUDITORIA } = require('../../../config/constants');

class FrotaController {

  async getStats(req, res, next) {
    try { res.json({ success: true, data: await S.getStats() }); } catch(e) { next(e); }
  }

  async recentesViagens(req, res, next) {
    try { res.json({ success: true, data: await S.recentesViagens() }); } catch(e) { next(e); }
  }

  // ── Veículos ──────────────────────────────────────────────────────────────────

  async listarVeiculos(req, res, next) {
    try { res.json({ success: true, data: await S.listarVeiculos(req.query) }); } catch(e) { next(e); }
  }

  async criarVeiculo(req, res, next) {
    try {
      const data = await S.criarVeiculo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'veiculos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarVeiculo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarVeiculo(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'veiculos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Viagens ───────────────────────────────────────────────────────────────────

  async listarViagens(req, res, next) {
    try { res.json({ success: true, data: await S.listarViagens(req.query) }); } catch(e) { next(e); }
  }

  async criarViagem(req, res, next) {
    try {
      const data = await S.criarViagem(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'viagens', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async finalizarViagem(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.finalizarViagem(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'viagens', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Abastecimentos ────────────────────────────────────────────────────────────

  async listarAbastecimentos(req, res, next) {
    try { res.json({ success: true, data: await S.listarAbastecimentos(req.query) }); } catch(e) { next(e); }
  }

  async registrarAbastecimento(req, res, next) {
    try {
      const data = await S.registrarAbastecimento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_abastecimentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Manutenções ───────────────────────────────────────────────────────────────

  async listarManutencoes(req, res, next) {
    try { res.json({ success: true, data: await S.listarManutencoes(req.query) }); } catch(e) { next(e); }
  }

  async criarManutencao(req, res, next) {
    try {
      const data = await S.criarManutencao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_manutencoes', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarManutencao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarManutencao(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_manutencoes', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Multas ────────────────────────────────────────────────────────────────────

  async listarMultas(req, res, next) {
    try { res.json({ success: true, data: await S.listarMultas(req.query) }); } catch(e) { next(e); }
  }

  async atualizarMulta(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarMulta(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_multas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async registrarMulta(req, res, next) {
    try {
      const data = await S.registrarMulta(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_multas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Checklists ────────────────────────────────────────────────────────────────

  async listarChecklists(req, res, next) {
    try { res.json({ success: true, data: await S.listarChecklists(req.query) }); } catch(e) { next(e); }
  }

  async registrarChecklist(req, res, next) {
    try {
      const data = await S.registrarChecklist(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_checklists', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try { res.json({ success: true, data: await S.listarEscalas() }); } catch(e) { next(e); }
  }

  async criarEscala(req, res, next) {
    try {
      const data = await S.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_escalas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirEscala(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'fro_escalas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarMotoristas(req, res, next) {
    try { res.json({ success: true, data: await S.listarMotoristas() }); } catch(e) { next(e); }
  }

  async listarUsuarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarUsuariosAtivos() }); } catch(e) { next(e); }
  }

  // ── Motoristas / CNH ─────────────────────────────────────────────────────────

  async listarMotoristasCNH(req, res, next) {
    try { res.json({ success: true, data: await S.listarMotoristasCNH(req.query) }); } catch(e) { next(e); }
  }

  async criarMotorista(req, res, next) {
    try {
      const data = await S.criarMotorista(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_motoristas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarMotorista(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarMotorista(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_motoristas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Rotas ─────────────────────────────────────────────────────────────────────

  async listarRotas(req, res, next) {
    try { res.json({ success: true, data: await S.listarRotas(req.query) }); } catch(e) { next(e); }
  }

  async criarRota(req, res, next) {
    try {
      const data = await S.criarRota(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_rotas', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarRota(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarRota(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_rotas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirRota(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirRota(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'fro_rotas', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Consumo / Depreciação ─────────────────────────────────────────────────────

  async consumoVeiculos(req, res, next) {
    try { res.json({ success: true, data: await S.consumoVeiculos(req.query) }); } catch(e) { next(e); }
  }

  async depreciacaoVeiculos(req, res, next) {
    try { res.json({ success: true, data: await S.depreciacaoVeiculos() }); } catch(e) { next(e); }
  }

  // ── Solicitações de Uso ───────────────────────────────────────────────────────

  async listarSolicitacoesUso(req, res, next) {
    try { res.json({ success: true, data: await S.listarSolicitacoesUso(req.query) }); } catch(e) { next(e); }
  }

  async criarSolicitacaoUso(req, res, next) {
    try {
      const data = await S.criarSolicitacaoUso(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_solicitacoes_uso', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async responderSolicitacaoUso(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.responderSolicitacaoUso(id, req.user.id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_solicitacoes_uso', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Localização ───────────────────────────────────────────────────────────────

  async localizacaoMotoristas(req, res, next) {
    try { res.json({ success: true, data: await S.localizacaoMotoristas() }); } catch(e) { next(e); }
  }

  // ── Dados Técnicos ────────────────────────────────────────────────────────────

  async listarDadosTecnicos(req, res, next) {
    try { res.json({ success: true, data: await S.listarDadosTecnicos(req.query) }); } catch(e) { next(e); }
  }

  async registrarDadosTecnicos(req, res, next) {
    try {
      const data = await S.registrarDadosTecnicos(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_dados_tecnicos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Plano Preventiva ──────────────────────────────────────────────────────────

  async listarPlanoPreventiva(req, res, next) {
    try { res.json({ success: true, data: await S.listarPlanoPreventiva(req.query) }); } catch(e) { next(e); }
  }

  async criarPlanoPreventiva(req, res, next) {
    try {
      const data = await S.criarPlanoPreventiva(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_plano_preventiva', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarPlanoPreventiva(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarPlanoPreventiva(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_plano_preventiva', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  async excluirPlanoPreventiva(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.excluirPlanoPreventiva(id);
      await req.audit(AUDITORIA.EXCLUSAO, 'fro_plano_preventiva', id, {});
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Pneus ─────────────────────────────────────────────────────────────────────

  async listarPneus(req, res, next) {
    try { res.json({ success: true, data: await S.listarPneus(req.query) }); } catch(e) { next(e); }
  }

  async criarPneu(req, res, next) {
    try {
      const data = await S.criarPneu(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_pneus', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarPneu(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarPneu(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_pneus', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Refrigeração ──────────────────────────────────────────────────────────────

  async listarRefrigeracao(req, res, next) {
    try { res.json({ success: true, data: await S.listarRefrigeracao(req.query) }); } catch(e) { next(e); }
  }

  async registrarRefrigeracao(req, res, next) {
    try {
      const data = await S.registrarRefrigeracao(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_refrigeracao', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Higienização Tanques ──────────────────────────────────────────────────────

  async listarHigienizacoesTanque(req, res, next) {
    try { res.json({ success: true, data: await S.listarHigienizacoesTanque(req.query) }); } catch(e) { next(e); }
  }

  async registrarHigienizacaoTanque(req, res, next) {
    try {
      const data = await S.registrarHigienizacaoTanque(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_higienizacoes_tanque', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async aprovarHigienizacaoTanque(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.aprovarHigienizacaoTanque(id, req.user.id);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_higienizacoes_tanque', id, { depois: { aprovado: true } });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Pedágios ──────────────────────────────────────────────────────────────────

  async listarPedagios(req, res, next) {
    try { res.json({ success: true, data: await S.listarPedagios(req.query) }); } catch(e) { next(e); }
  }

  async registrarPedagio(req, res, next) {
    try {
      const data = await S.registrarPedagio(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_pedagogios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async conciliarPedagio(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      await S.conciliarPedagio(id);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_pedagogios', id, { depois: { conciliado: true } });
      res.json({ success: true });
    } catch(e) { next(e); }
  }

  // ── Sinistros ─────────────────────────────────────────────────────────────────

  async listarSinistros(req, res, next) {
    try { res.json({ success: true, data: await S.listarSinistros(req.query) }); } catch(e) { next(e); }
  }

  async criarSinistro(req, res, next) {
    try {
      const data = await S.criarSinistro(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_sinistros', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarSinistro(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarSinistro(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_sinistros', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Tanques Comunitários ──────────────────────────────────────────────────────

  async listarTanquesComunitarios(req, res, next) {
    try { res.json({ success: true, data: await S.listarTanquesComunitarios(req.query) }); } catch(e) { next(e); }
  }

  async criarTanqueComunitario(req, res, next) {
    try {
      const data = await S.criarTanqueComunitario(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_tanques_comunitarios', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  async atualizarTanqueComunitario(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await S.atualizarTanqueComunitario(id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'fro_tanques_comunitarios', id, { depois: req.body });
      res.json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Captação / Pesagem ────────────────────────────────────────────────────────

  async historicoCaptacao(req, res, next) {
    try { res.json({ success: true, data: await S.historicoCaptacao(req.query) }); } catch(e) { next(e); }
  }

  async listarPesagens(req, res, next) {
    try { res.json({ success: true, data: await S.listarPesagens(req.query) }); } catch(e) { next(e); }
  }

  async registrarPesagem(req, res, next) {
    try {
      const data = await S.registrarPesagem(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'fro_pesagens', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch(e) { next(e); }
  }

  // ── Qualidade Leite ───────────────────────────────────────────────────────────

  async qualidadeLeiteProdutor(req, res, next) {
    try { res.json({ success: true, data: await S.qualidadeLeiteProdutor() }); } catch(e) { next(e); }
  }

  // ── Alertas ───────────────────────────────────────────────────────────────────

  async painelAlertas(req, res, next) {
    try { res.json({ success: true, data: await S.painelAlertas() }); } catch(e) { next(e); }
  }

  // ── Relatório de Custos ───────────────────────────────────────────────────────

  async relatorioCustos(req, res, next) {
    try { res.json({ success: true, data: await S.relatorioCustos(req.query) }); } catch(e) { next(e); }
  }
}

module.exports = new FrotaController();
