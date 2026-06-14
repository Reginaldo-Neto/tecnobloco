'use strict';

const GlobalService = require('../../services/global/GlobalService');
const { AUDITORIA, HTTP } = require('../../../config/constants');

class GlobalController {

  // ─── HELPERS (DROPDOWNS) ────────────────────────────────────────────────────

  async listaDepartamentos(req, res, next) {
    try {
      const data = await GlobalService.listarDepartamentos();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listaUsuarios(req, res, next) {
    try {
      const data = await GlobalService.listarUsuarios();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listaEquipamentos(req, res, next) {
    try {
      const data = await GlobalService.listarEquipamentos();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listaVeiculosDisponiveis(req, res, next) {
    try {
      const data = await GlobalService.listarVeiculosDisponiveis();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F01 / F02 — REUNIÕES ───────────────────────────────────────────────────

  async criarReuniao(req, res, next) {
    try {
      const { titulo } = req.body;

      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O título da reunião é obrigatório',
        });
      }
      if (titulo.trim().length > 200) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O título não pode ter mais de 200 caracteres',
        });
      }

      const data = await GlobalService.criarReuniao(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_reuniao', data.id, {
        depois: { titulo: titulo.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarReunioes(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasReunioes(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarReuniao(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarReuniao(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'solicitacoes_reuniao', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F03 / F04 — ORDENS DE SERVIÇO ─────────────────────────────────────────

  async criarOs(req, res, next) {
    try {
      const { descricao } = req.body;

      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição da OS é obrigatória',
        });
      }

      const data = await GlobalService.criarOs(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'ordens_servico', data.id, {
        depois: { codigo: data.codigo },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarOs(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasOs(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarOs(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarOs(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'ordens_servico', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F05 / F06 — LIMPEZA ───────────────────────────────────────────────────

  async criarLimpeza(req, res, next) {
    try {
      const { local_setor } = req.body;

      if (!local_setor || typeof local_setor !== 'string' || local_setor.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O local/setor é obrigatório',
        });
      }

      const data = await GlobalService.criarLimpeza(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_limpeza', data.id, {
        depois: { local_setor: local_setor.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarLimpezas(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasLimpezas(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarLimpeza(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarLimpeza(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'solicitacoes_limpeza', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F07 / F08 — COMPRAS ───────────────────────────────────────────────────

  async criarCompra(req, res, next) {
    try {
      const { item_descricao, quantidade } = req.body;

      if (!item_descricao || typeof item_descricao !== 'string' || item_descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição do item é obrigatória',
        });
      }
      if (!quantidade || Number(quantidade) <= 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A quantidade deve ser maior que zero',
        });
      }

      const data = await GlobalService.criarCompra(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_compra', data.id, {
        depois: { item_descricao: item_descricao.trim(), quantidade },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarCompras(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasCompras(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarCompra(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarCompra(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'solicitacoes_compra', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F09 / F10 — DOCUMENTOS PESSOAIS ───────────────────────────────────────

  async criarDocumento(req, res, next) {
    try {
      const { tipo } = req.body;

      if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O tipo do documento é obrigatório',
        });
      }

      const data = await GlobalService.criarDocumento(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'documentos_pessoais', data.id, {
        depois: { tipo: tipo.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarDocumentos(req, res, next) {
    try {
      const data = await GlobalService.listarMeusDocumentos(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F11 / F12 — OCORRÊNCIAS ────────────────────────────────────────────────

  async criarOcorrencia(req, res, next) {
    try {
      const { descricao, data_ocorrencia } = req.body;

      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição da ocorrência é obrigatória',
        });
      }
      if (!data_ocorrencia) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A data da ocorrência é obrigatória',
        });
      }

      const data = await GlobalService.criarOcorrencia(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'ocorrencias', data.id, {
        depois: { data_ocorrencia },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarOcorrencias(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasOcorrencias(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F13 / F27 — ESTOQUE ───────────────────────────────────────────────────

  async listarEstoque(req, res, next) {
    try {
      const { search, categoria_id } = req.query;
      const data = await GlobalService.listarEstoque({ search, categoria_id });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarRequisicaoEstoque(req, res, next) {
    try {
      const { produto_id, quantidade } = req.body;

      if (!produto_id) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O produto é obrigatório',
        });
      }
      if (!quantidade || Number(quantidade) <= 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A quantidade deve ser maior que zero',
        });
      }

      const data = await GlobalService.criarRequisicaoEstoque(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_compra', data.id, {
        depois: { produto_id, quantidade, origem: 'requisicao_estoque' },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F14 — CARDÁPIO ────────────────────────────────────────────────────────

  async listarCardapio(req, res, next) {
    try {
      const { data } = req.query;
      const result = await GlobalService.listarCardapio(data || null);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listarCardapioDaSemana(req, res, next) {
    try {
      const data = await GlobalService.listarCardapioDaSemana();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F15 — TREINAMENTOS ─────────────────────────────────────────────────────

  async listarTreinamentos(req, res, next) {
    try {
      const data = await GlobalService.listarMeusTreinamentos(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F16 — HOLERITES ───────────────────────────────────────────────────────

  async listarHolerites(req, res, next) {
    try {
      const data = await GlobalService.listarHolerites(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F17 — BANCO DE HORAS ──────────────────────────────────────────────────

  async getBancoHoras(req, res, next) {
    try {
      const data = await GlobalService.getBancoHoras(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getResumoHoras(req, res, next) {
    try {
      const data = await GlobalService.getResumoHoras(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F18 — RAMAIS ──────────────────────────────────────────────────────────

  async listarRamais(req, res, next) {
    try {
      const { search, departamento_id } = req.query;
      const data = await GlobalService.listarRamais({ search, departamento_id });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F19 — CANAL DE ÉTICA (SEM AUDITORIA DE IDENTIDADE) ────────────────────

  async criarDenuncia(req, res, next) {
    try {
      const { descricao } = req.body;

      if (!descricao || typeof descricao !== 'string' || descricao.trim().length < 20) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição da denúncia deve ter no mínimo 20 caracteres',
        });
      }

      // IMPORTANT: não registrar identidade do usuário na trilha de auditoria
      const data = await GlobalService.criarDenunciaEtica(req.body);
      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F20 — EPIs ────────────────────────────────────────────────────────────

  async listarEpis(req, res, next) {
    try {
      const data = await GlobalService.listarMeusEpis(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F21 — ADIANTAMENTOS ───────────────────────────────────────────────────

  async criarAdiantamento(req, res, next) {
    try {
      const { valor_solicitado } = req.body;

      if (!valor_solicitado || Number(valor_solicitado) <= 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O valor solicitado deve ser maior que zero',
        });
      }

      const data = await GlobalService.criarAdiantamento(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'adiantamentos', data.id, {
        depois: { valor_solicitado },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarAdiantamentos(req, res, next) {
    try {
      const data = await GlobalService.listarMeusAdiantamentos(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarAdiantamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarAdiantamento(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'adiantamentos', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F22 — BUG REPORTS ─────────────────────────────────────────────────────

  async criarBug(req, res, next) {
    try {
      const { titulo, descricao } = req.body;

      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O título do bug é obrigatório',
        });
      }
      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição do bug é obrigatória',
        });
      }

      const data = await GlobalService.criarBugReport(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'bug_reports', data.id, {
        depois: { titulo: titulo.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarBugs(req, res, next) {
    try {
      const data = await GlobalService.listarMeusBugs(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F23 — CHAMADOS DE TI ──────────────────────────────────────────────────

  async criarChamadoTI(req, res, next) {
    try {
      const { titulo, descricao } = req.body;

      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O título do chamado é obrigatório',
        });
      }
      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição do chamado é obrigatória',
        });
      }

      const data = await GlobalService.criarChamadoTI(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'chamados_ti', data.id, {
        depois: { titulo: titulo.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarChamadosTI(req, res, next) {
    try {
      const data = await GlobalService.listarMeusChamadosTI(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── F24 — LAVANDERIA ──────────────────────────────────────────────────────

  async criarLavanderia(req, res, next) {
    try {
      const data = await GlobalService.criarLavanderia(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_lavanderia', data.id, {});

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarLavanderia(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasLavanderia(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarLavanderia(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarLavanderia(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'solicitacoes_lavanderia', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F25 — SERVIÇOS GERAIS ─────────────────────────────────────────────────

  async criarServicosGerais(req, res, next) {
    try {
      const { descricao } = req.body;

      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A descrição é obrigatória',
        });
      }

      const data = await GlobalService.criarServicosGerais(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_servicos_gerais', data.id, {});

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarServicosGerais(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasServicosGerais(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarServicosGerais(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarServicosGerais(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'solicitacoes_servicos_gerais', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F26 — VEÍCULOS ────────────────────────────────────────────────────────

  async criarVeiculo(req, res, next) {
    try {
      const { destino, motivo, data_saida, data_retorno } = req.body;

      if (!destino || typeof destino !== 'string' || destino.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O destino é obrigatório',
        });
      }
      if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'O motivo é obrigatório',
        });
      }
      if (!data_saida) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A data de saída é obrigatória',
        });
      }
      if (!data_retorno) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: 'A data de retorno é obrigatória',
        });
      }

      const data = await GlobalService.criarSolicitacaoVeiculo(req.user.id, req.body);

      await req.audit(AUDITORIA.CRIACAO, 'solicitacoes_veiculo', data.id, {
        depois: { destino: destino.trim(), data_saida, data_retorno },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarVeiculos(req, res, next) {
    try {
      const data = await GlobalService.listarMinhasSolicitacoesVeiculo(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancelarVeiculo(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
      const data = await GlobalService.cancelarVeiculo(req.user.id, id);
      await req.audit(AUDITORIA.EDICAO, 'solicitacoes_veiculo', id, { depois: { status: 'cancelada' } });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ─── F28 — ESCALA DE MANUTENÇÃO ────────────────────────────────────────────

  async listarEscalaManutencao(req, res, next) {
    try {
      const data = await GlobalService.listarEscalaManutencao(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GlobalController();
