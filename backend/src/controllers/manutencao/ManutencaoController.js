'use strict';

const ManutencaoService = require('../../services/manutencao/ManutencaoService');
const { AUDITORIA, HTTP } = require('../../../config/constants');

const STATUS_OS_VALIDOS = ['aberta', 'em_andamento', 'aguardando_peca', 'concluida', 'cancelada'];
const TIPOS_MOVIMENTACAO = ['entrada', 'saida', 'ajuste', 'inventario'];

class ManutencaoController {

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats(req, res, next) {
    try {
      const data = await ManutencaoService.getStats();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Ordens de Serviço ────────────────────────────────────────────────────────

  async listarOS(req, res, next) {
    try {
      const { status, prioridade, tipo, equipamento_id } = req.query;
      const data = await ManutencaoService.listarOS({ status, prioridade, tipo, equipamento_id });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listarMinhasOS(req, res, next) {
    try {
      const data = await ManutencaoService.listarMinhasOS(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async buscarOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de OS inválido',
        });
      }
      const data = await ManutencaoService.buscarOS(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarOS(req, res, next) {
    try {
      const { descricao } = req.body;
      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Descrição é obrigatória',
        });
      }
      if (descricao.length > 2000) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Descrição deve ter no máximo 2000 caracteres',
        });
      }

      const data = await ManutencaoService.criarOS(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ordens_servico', data.id, {
        depois: { codigo: data.codigo, descricao: descricao.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async atualizarStatusOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de OS inválido',
        });
      }

      const { status } = req.body;
      if (!status || !STATUS_OS_VALIDOS.includes(status)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: `Status inválido. Valores aceitos: ${STATUS_OS_VALIDOS.join(', ')}`,
        });
      }

      const data = await ManutencaoService.atualizarStatusOS(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'ordens_servico', id, {
        depois: { status },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async apontarOS(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de OS inválido',
        });
      }

      const { data_apontamento, horas_trabalhadas } = req.body;
      if (!data_apontamento) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Data do apontamento é obrigatória',
        });
      }
      if (horas_trabalhadas !== undefined && horas_trabalhadas !== null) {
        const horas = Number(horas_trabalhadas);
        if (isNaN(horas) || horas <= 0) {
          return res.status(HTTP.BAD_REQUEST).json({
            success: false, message: 'Horas trabalhadas deve ser maior que zero',
          });
        }
      }

      const data = await ManutencaoService.apontarOS(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'os_apontamentos', data.id || id, {
        depois: { os_id: id, data_apontamento, horas_trabalhadas },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Manutenção Preventiva ────────────────────────────────────────────────────

  async listarPreventiva(req, res, next) {
    try {
      const { tipo, ativo } = req.query;
      const data = await ManutencaoService.listarPreventiva({ tipo, ativo });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarPreventiva(req, res, next) {
    try {
      const { titulo, proxima_data } = req.body;
      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Título é obrigatório',
        });
      }
      if (!proxima_data) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Próxima data é obrigatória',
        });
      }
      if (isNaN(Date.parse(proxima_data))) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Próxima data inválida',
        });
      }

      const data = await ManutencaoService.criarPreventiva(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'manutencao_preventiva', data.id, {
        depois: { titulo: titulo.trim(), proxima_data },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async atualizarPreventiva(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de preventiva inválido',
        });
      }

      const data = await ManutencaoService.atualizarPreventiva(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'manutencao_preventiva', id, {
        depois: req.body,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async executarPreventiva(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de preventiva inválido',
        });
      }

      const data = await ManutencaoService.executarPreventiva(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'manutencao_preventiva', id, {
        depois: { executado_por: req.user.id, observacoes: req.body.observacoes },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Ativos ───────────────────────────────────────────────────────────────────

  async listarAtivos(req, res, next) {
    try {
      const data = await ManutencaoService.listarAtivos();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarAtivo(req, res, next) {
    try {
      const { codigo, nome, tipo } = req.body;
      if (!codigo || typeof codigo !== 'string' || codigo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Código é obrigatório',
        });
      }
      if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Nome é obrigatório',
        });
      }
      if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Tipo é obrigatório',
        });
      }

      const data = await ManutencaoService.criarAtivo(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ativos_hierarquia', data.id, {
        depois: { codigo: codigo.trim(), nome: nome.trim(), tipo: tipo.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Equipamentos ─────────────────────────────────────────────────────────────

  async listarEquipamentos(req, res, next) {
    try {
      const data = await ManutencaoService.listarEquipamentos(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
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
    } catch (err) {
      next(err);
    }
  }

  async atualizarEquipamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      }
      const data = await ManutencaoService.atualizarEquipamento(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'equipamentos', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async prontuarioEquipamento(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de equipamento inválido',
        });
      }

      const data = await ManutencaoService.prontuarioEquipamento(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async uploadManual(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      }
      if (!req.file) {
        return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'Arquivo PDF não enviado' });
      }
      const manualPath = `/uploads/manuals/${req.file.filename}`;
      await ManutencaoService.atualizarEquipamento(req.user.id, id, { manual_pdf: manualPath });
      await req.audit(AUDITORIA.EDICAO, 'equipamentos', id, { depois: { manual_pdf: manualPath } });
      res.json({ success: true, data: { manual_pdf: manualPath } });
    } catch (err) {
      next(err);
    }
  }

  // ── Peças ────────────────────────────────────────────────────────────────────

  async listarPecas(req, res, next) {
    try {
      const { categoria, busca } = req.query;
      const data = await ManutencaoService.listarPecas({ categoria, busca });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarPeca(req, res, next) {
    try {
      const { nome, categoria } = req.body;
      if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Nome é obrigatório',
        });
      }
      if (!categoria || typeof categoria !== 'string' || categoria.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Categoria é obrigatória',
        });
      }

      const data = await ManutencaoService.criarPeca(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'pecas_manutencao', data.id, {
        depois: { nome: nome.trim(), categoria: categoria.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async movimentarPeca(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de peça inválido',
        });
      }

      const { tipo, quantidade } = req.body;
      if (!tipo || !TIPOS_MOVIMENTACAO.includes(tipo)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false,
          message: `Tipo de movimentação inválido. Valores aceitos: ${TIPOS_MOVIMENTACAO.join(', ')}`,
        });
      }
      const qtd = Number(quantidade);
      if (isNaN(qtd) || qtd <= 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Quantidade deve ser maior que zero',
        });
      }

      const data = await ManutencaoService.movimentarPeca(req.user.id, id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'movimentacoes_pecas', data.id || id, {
        depois: { peca_id: id, tipo, quantidade: qtd },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Ferramentas ──────────────────────────────────────────────────────────────

  async listarFerramentas(req, res, next) {
    try {
      const data = await ManutencaoService.listarFerramentas();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async atualizarFerramenta(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(HTTP.BAD_REQUEST).json({ success: false, message: 'ID inválido' });
      const data = await ManutencaoService.atualizarFerramenta(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'ferramentas', id, { depois: req.body });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async criarFerramenta(req, res, next) {
    try {
      const { nome, tipo } = req.body;
      if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Nome é obrigatório',
        });
      }
      if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Tipo é obrigatório',
        });
      }

      const data = await ManutencaoService.criarFerramenta(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'ferramentas', data.id, {
        depois: { nome: nome.trim(), tipo: tipo.trim() },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async checkoutFerramenta(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de ferramenta inválido',
        });
      }

      const data = await ManutencaoService.checkoutFerramenta(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'ferramentas', id, {
        depois: { acao: 'checkout', usuario_id: req.user.id },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async checkinFerramenta(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de ferramenta inválido',
        });
      }

      const data = await ManutencaoService.checkinFerramenta(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'ferramentas', id, {
        depois: { acao: 'checkin', usuario_id: req.user.id },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Apoio ────────────────────────────────────────────────────────────────────

  async listarApoio(req, res, next) {
    try {
      const { status } = req.query;
      const data = await ManutencaoService.listarApoio({ status });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async distribuirApoio(req, res, next) {
    try {
      const { tipo, id: paramId } = req.params;
      const id = Number(paramId);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID inválido',
        });
      }

      const { responsavel_id } = req.body;
      if (!responsavel_id) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Responsável é obrigatório',
        });
      }

      const data = await ManutencaoService.distribuirApoio(req.user.id, tipo, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'apoio_distribuicao', id, {
        depois: { tipo, responsavel_id },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Jardinagem ───────────────────────────────────────────────────────────────

  async listarJardinagem(req, res, next) {
    try {
      const { status, mes, ano } = req.query;
      const data = await ManutencaoService.listarJardinagem({ status, mes, ano });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarJardinagem(req, res, next) {
    try {
      const { titulo, data_agendada } = req.body;
      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Título é obrigatório',
        });
      }
      if (!data_agendada) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Data agendada é obrigatória',
        });
      }

      const data = await ManutencaoService.criarJardinagem(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'cronograma_jardinagem', data.id, {
        depois: { titulo: titulo.trim(), data_agendada },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async concluirJardinagem(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de jardinagem inválido',
        });
      }

      const data = await ManutencaoService.concluirJardinagem(req.user.id, id, req.body);
      await req.audit(AUDITORIA.EDICAO, 'cronograma_jardinagem', id, {
        depois: { concluido_por: req.user.id },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Escalas ──────────────────────────────────────────────────────────────────

  async listarEscalas(req, res, next) {
    try {
      const { mes, ano } = req.query;
      const data = await ManutencaoService.listarEscalas({ mes, ano });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarEscala(req, res, next) {
    try {
      const { usuario_id, tecnico_nome, data_inicio, data_fim } = req.body;
      if (!usuario_id && !tecnico_nome) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Informe usuario_id ou tecnico_nome',
        });
      }
      if (!data_inicio) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Data de início é obrigatória',
        });
      }
      if (!data_fim) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Data de fim é obrigatória',
        });
      }
      if (new Date(data_fim) < new Date(data_inicio)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Data de fim deve ser maior ou igual à data de início',
        });
      }

      const data = await ManutencaoService.criarEscala(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'escalas_servicos', data.id, {
        depois: { usuario_id: usuario_id || null, tecnico_nome: tecnico_nome || null, data_inicio, data_fim },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async excluirEscala(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'ID de escala inválido',
        });
      }

      const data = await ManutencaoService.excluirEscala(req.user.id, id);
      await req.audit(AUDITORIA.EXCLUSAO, 'escalas_servicos', id, {
        depois: { excluido_por: req.user.id },
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Medidores ────────────────────────────────────────────────────────────────

  async listarMedidores(req, res, next) {
    try {
      const { tipo, mes, ano } = req.query;
      const data = await ManutencaoService.listarMedidores({ tipo, mes, ano });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async criarLeitura(req, res, next) {
    try {
      const { tipo, ponto, leitura, data_leitura } = req.body;
      if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Tipo é obrigatório',
        });
      }
      if (!ponto || typeof ponto !== 'string' || ponto.trim().length === 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Ponto é obrigatório',
        });
      }
      if (leitura === undefined || leitura === null || isNaN(Number(leitura))) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Leitura deve ser um número válido',
        });
      }
      if (!data_leitura) {
        return res.status(HTTP.BAD_REQUEST).json({
          success: false, message: 'Data da leitura é obrigatória',
        });
      }

      const data = await ManutencaoService.criarLeitura(req.user.id, req.body);
      await req.audit(AUDITORIA.CRIACAO, 'leituras_medidores', data.id, {
        depois: { tipo: tipo.trim(), ponto: ponto.trim(), leitura: Number(leitura), data_leitura },
      });

      res.status(HTTP.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Indicadores ──────────────────────────────────────────────────────────────

  async calcularIndicadores(req, res, next) {
    try {
      const data = await ManutencaoService.calcularIndicadores();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ManutencaoController();
