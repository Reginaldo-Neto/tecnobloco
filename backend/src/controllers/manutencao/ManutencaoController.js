'use strict';

const ManutencaoService = require('../../services/manutencao/ManutencaoService');
const { AUDITORIA, HTTP } = require('../../../config/constants');

const STATUS_OS_VALIDOS = ['aberta','em_andamento','aguardando_peca','concluida','cancelada'];

class ManutencaoController {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats(req, res, next) {
    try {
      const data = await ManutencaoService.getStats();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Ordens de Serviço ────────────────────────────────────────────────────────

  async listarOS(req, res, next) {
    try {
      const { status, prioridade, tipo, equipamento_id } = req.query;
      const data = await ManutencaoService.listarOS({ status, prioridade, tipo, equipamento_id });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async buscarOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de OS inválido' });
      const data = await ManutencaoService.buscarOS(id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarOS(req, res, next) {
    try {
      const { descricao } = req.body;
      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Descrição é obrigatória' });
      }
      if (descricao.length > 2000) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Descrição deve ter no máximo 2000 caracteres' });
      }
      const data = await ManutencaoService.criarOS(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ordens_servico', data.id, {
        depois: { codigo: data.codigo, descricao: descricao.trim() },
      });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de OS inválido' });
      const data = await ManutencaoService.atualizarOS(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ordens_servico', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarStatusOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de OS inválido' });
      const { status } = req.body;
      if (!status || !STATUS_OS_VALIDOS.includes(status)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: `Status inválido. Valores aceitos: ${STATUS_OS_VALIDOS.join(', ')}`,
        });
      }
      const data = await ManutencaoService.atualizarStatusOS(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'ordens_servico', id, { depois: { status } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async apontarOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de OS inválido' });
      const { data_apontamento, horas_trabalhadas } = req.body;
      if (!data_apontamento) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Data do apontamento é obrigatória' });
      }
      if (horas_trabalhadas !== undefined && horas_trabalhadas !== null) {
        const h = Number(horas_trabalhadas);
        if (isNaN(h) || h <= 0) {
          return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Horas trabalhadas deve ser maior que zero' });
        }
      }
      const data = await ManutencaoService.apontarOS(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'os_apontamentos', data.id || id, {
        depois: { os_id: id, data_apontamento, horas_trabalhadas },
      });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Manutenção Preventiva ────────────────────────────────────────────────────

  async listarPreventiva(req, res, next) {
    try {
      const { tipo, ativo } = req.query;
      const data = await ManutencaoService.listarPreventiva({ tipo, ativo });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarPreventiva(req, res, next) {
    try {
      const { titulo, proxima_data } = req.body;
      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Título é obrigatório' });
      }
      if (!proxima_data) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Próxima data é obrigatória' });
      }
      if (isNaN(Date.parse(proxima_data))) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Próxima data inválida' });
      }
      const data = await ManutencaoService.criarPreventiva(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'manutencao_preventiva', data.id, {
        depois: { titulo: titulo.trim(), proxima_data },
      });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarPreventiva(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de preventiva inválido' });
      const data = await ManutencaoService.atualizarPreventiva(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'manutencao_preventiva', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async executarPreventiva(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de preventiva inválido' });
      const data = await ManutencaoService.executarPreventiva(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'manutencao_preventiva', id, {
        depois: { executado_por: req.user.id, observacoes: req.body.observacoes },
      });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── Equipamentos ─────────────────────────────────────────────────────────────

  async listarEquipamentos(req, res, next) {
    try {
      const data = await ManutencaoService.listarEquipamentos(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarEquipamento(req, res, next) {
    try {
      const { nome } = req.body;
      if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Nome é obrigatório' });
      }
      const data = await ManutencaoService.criarEquipamento(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'equipamentos', data.id, { depois: req.body });
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async atualizarEquipamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await ManutencaoService.atualizarEquipamento(req.user.id, id, req.body);
      await req.audit(AUDITORIA.ALTERACAO, 'equipamentos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async prontuarioEquipamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID de equipamento inválido' });
      const data = await ManutencaoService.prontuarioEquipamento(id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async uploadManual(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      if (!req.file) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Arquivo PDF não enviado' });
      const manualPath = `/uploads/manuals/${req.file.filename}`;
      await ManutencaoService.atualizarEquipamento(req.user.id, id, { manual_pdf: manualPath });
      await req.audit(AUDITORIA.ALTERACAO, 'equipamentos', id, { depois: { manual_pdf: manualPath } });
      res.json({ success: true, data: { manual_pdf: manualPath } });
    } catch (err) { next(err); }
  }

  async uploadFotoEquipamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      if (!req.file) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Imagem não enviada' });
      const fotoPath = `/uploads/equipamentos/${req.file.filename}`;
      await ManutencaoService.atualizarFotoEquipamento(id, fotoPath);
      await req.audit(AUDITORIA.ALTERACAO, 'equipamentos', id, { depois: { foto_url: fotoPath } });
      res.json({ success: true, data: { foto_url: fotoPath } });
    } catch (err) { next(err); }
  }

  // ── Indicadores ──────────────────────────────────────────────────────────────

  async calcularIndicadores(req, res, next) {
    try {
      const data = await ManutencaoService.calcularIndicadores();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new ManutencaoController();
