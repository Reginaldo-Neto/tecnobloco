'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class GlobalService {

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  async listarDepartamentos() {
    const [rows] = await pool.execute(
      `SELECT id, nome FROM departamentos WHERE ativo = 1 ORDER BY nome`
    );
    return rows;
  }

  async listarUsuarios() {
    const [rows] = await pool.execute(
      `SELECT id, nome, departamento_id FROM usuarios WHERE ativo = 1 ORDER BY nome`
    );
    return rows;
  }

  // ─── F01 / F02 — REUNIÕES ───────────────────────────────────────────────────

  async criarReuniao(userId, {
    titulo,
    departamento_destino_id,
    participante_id,
    data_preferencial,
    duracao_minutos,
    local_sugerido,
    descricao,
    recorrente,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_reuniao
         (solicitante_id, titulo, departamento_destino_id, participante_id,
          data_preferencial, duracao_minutos, local_sugerido, descricao, recorrente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        titulo,
        departamento_destino_id || null,
        participante_id         || null,
        data_preferencial       || null,
        duracao_minutos         || null,
        local_sugerido          || null,
        descricao               || null,
        recorrente              ? 1 : 0,
      ]
    );
    const [rows] = await pool.execute(
      `SELECT sr.*, d.nome AS departamento_destino, u.nome AS participante_nome,
              s.nome AS solicitante_nome, sr.criado_em
         FROM solicitacoes_reuniao sr
         LEFT JOIN departamentos d ON d.id = sr.departamento_destino_id
         LEFT JOIN usuarios u      ON u.id = sr.participante_id
         LEFT JOIN usuarios s      ON s.id = sr.solicitante_id
        WHERE sr.id = ?`,
      [result.insertId]
    );
    return rows[0];
  }

  async listarMinhasReunioes(userId) {
    const [rows] = await pool.execute(
      `SELECT sr.*, d.nome AS departamento_destino, u.nome AS participante_nome,
              s.nome AS solicitante_nome, sr.criado_em
         FROM solicitacoes_reuniao sr
         LEFT JOIN departamentos d ON d.id = sr.departamento_destino_id
         LEFT JOIN usuarios u      ON u.id = sr.participante_id
         LEFT JOIN usuarios s      ON s.id = sr.solicitante_id
        WHERE sr.solicitante_id = ?
        ORDER BY sr.criado_em DESC
        LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async cancelarReuniao(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM solicitacoes_reuniao WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE solicitacoes_reuniao SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ─── F03 / F04 — ORDENS DE SERVIÇO (MANUTENÇÃO) ────────────────────────────

  async criarOs(userId, { equipamento_id, tipo, prioridade, descricao, localizacao }) {
    const PRIORIDADE_VALID = ['baixa', 'media', 'alta', 'critica'];
    const prioridadeFinal = PRIORIDADE_VALID.includes(prioridade) ? prioridade : 'media';

    const codigo = `OS-${Date.now().toString(36).toUpperCase()}`;
    // Inclui localização na descrição quando informada (ordens_servico não possui coluna própria)
    const descFinal = localizacao
      ? `${descricao}\n[Local: ${localizacao}]`
      : descricao;

    const [result] = await pool.execute(
      `INSERT INTO ordens_servico
         (codigo, solicitante_id, equipamento_id, tipo, prioridade, descricao, status, data_abertura)
       VALUES (?, ?, ?, ?, ?, ?, 'aberta', NOW())`,
      [
        codigo,
        userId,
        equipamento_id || null,
        tipo           || 'corretiva',
        prioridadeFinal,
        descFinal,
      ]
    );
    return { id: result.insertId, codigo };
  }

  async listarMinhasOs(userId) {
    const [rows] = await pool.execute(
      `SELECT os.*, e.nome AS equipamento_nome, e.localizacao AS equipamento_local,
              os.data_abertura, os.data_previsao, os.data_conclusao
         FROM ordens_servico os
         LEFT JOIN equipamentos e ON e.id = os.equipamento_id
        WHERE os.solicitante_id = ?
        ORDER BY os.data_abertura DESC
        LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async cancelarOs(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM ordens_servico WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE ordens_servico SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  async listarEquipamentos() {
    const [rows] = await pool.execute(
      `SELECT id, codigo, nome, tipo, localizacao
         FROM equipamentos
        WHERE status != 'sucata'
        ORDER BY nome`
    );
    return rows;
  }

  // ─── F05 / F06 — LIMPEZA ───────────────────────────────────────────────────

  async criarLimpeza(userId, { local_setor, tipo, urgencia, descricao }) {
    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_limpeza
         (solicitante_id, local_setor, tipo, urgencia, descricao)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        local_setor,
        tipo      || null,
        urgencia  || null,
        descricao || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMinhasLimpezas(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM solicitacoes_limpeza
        WHERE solicitante_id = ?
        ORDER BY criado_em DESC
        LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async cancelarLimpeza(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM solicitacoes_limpeza WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE solicitacoes_limpeza SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ─── F07 / F08 — SOLICITAÇÕES DE COMPRA ────────────────────────────────────

  async criarCompra(userId, {
    item_descricao,
    quantidade,
    unidade,
    valor_estimado,
    justificativa,
    urgencia,
    fornecedor_sugerido,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_compra
         (solicitante_id, item_descricao, quantidade, unidade, valor_estimado,
          justificativa, urgencia, fornecedor_sugerido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        item_descricao,
        quantidade,
        unidade             || null,
        valor_estimado      || null,
        justificativa       || null,
        urgencia            || null,
        fornecedor_sugerido || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMinhasCompras(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM solicitacoes_compra
        WHERE solicitante_id = ?
        ORDER BY criado_em DESC
        LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async cancelarCompra(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM solicitacoes_compra WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE solicitacoes_compra SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ─── F09 / F10 — DOCUMENTOS PESSOAIS ───────────────────────────────────────

  async criarDocumento(userId, { tipo, descricao, data_documento, arquivo_url }) {
    const TIPO_DOC_VALID = ['atestado_medico', 'certificado', 'declaracao', 'laudo', 'cnh', 'outro'];
    const tipoFinal = TIPO_DOC_VALID.includes(tipo) ? tipo : 'outro';

    const [result] = await pool.execute(
      `INSERT INTO documentos_pessoais
         (usuario_id, tipo, descricao, data_documento, arquivo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        tipoFinal,
        descricao      || null,
        data_documento || null,
        arquivo_url    || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMeusDocumentos(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM documentos_pessoais
        WHERE usuario_id = ?
        ORDER BY criado_em DESC`,
      [userId]
    );
    return rows;
  }

  // ─── F11 / F12 — OCORRÊNCIAS ────────────────────────────────────────────────

  async criarOcorrencia(userId, {
    tipo,
    data_ocorrencia,
    local,
    descricao,
    providencias_solicitadas,
    departamento_id,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO ocorrencias
         (reportado_por, tipo, data_ocorrencia, local, descricao,
          providencias_solicitadas, departamento_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tipo                     || null,
        data_ocorrencia,
        local                    || null,
        descricao,
        providencias_solicitadas || null,
        departamento_id          || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMinhasOcorrencias(userId) {
    const [rows] = await pool.execute(
      `SELECT oc.*, d.nome AS departamento
         FROM ocorrencias oc
         LEFT JOIN departamentos d ON d.id = oc.departamento_id
        WHERE oc.reportado_por = ?
        ORDER BY oc.criado_em DESC
        LIMIT 50`,
      [userId]
    );
    return rows;
  }

  // ─── F13 — ESTOQUE (VISUALIZAÇÃO) ──────────────────────────────────────────

  async listarEstoque({ search, categoria_id } = {}) {
    const params = [];
    let where = 'WHERE p.ativo = 1';

    if (search && search.trim()) {
      where += ' AND (p.nome LIKE ? OR p.codigo LIKE ?)';
      const like = `%${search.trim()}%`;
      params.push(like, like);
    }
    if (categoria_id) {
      where += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    try {
      const [rows] = await pool.execute(
        `SELECT p.id, p.codigo, p.nome, p.descricao, p.unidade_medida,
                COALESCE(SUM(CASE WHEN m.tipo='entrada' THEN m.quantidade
                                  WHEN m.tipo='saida' THEN -m.quantidade ELSE 0 END), 0) AS saldo,
                p.estoque_minimo, c.nome AS categoria
           FROM produtos p
           LEFT JOIN categorias_produtos c ON c.id = p.categoria_id
           LEFT JOIN movimentacoes_estoque m ON m.produto_id = p.id
          ${where}
          GROUP BY p.id ORDER BY p.nome LIMIT 100`,
        params
      );
      return rows;
    } catch (err) {
      // Fallback if movimentacoes_estoque table doesn't exist
      const [rows] = await pool.execute(
        `SELECT id, codigo, nome, unidade_medida, estoque_minimo
           FROM produtos
          WHERE ativo = 1
          ORDER BY nome LIMIT 100`
      );
      return rows;
    }
  }

  // ─── F14 — CARDÁPIO ────────────────────────────────────────────────────────

  async listarCardapio(data) {
    const dateParam = data || null;
    const [rows] = await pool.execute(
      `SELECT c.id, c.data_cardapio, c.turno,
              ci.tipo, ci.descricao, ci.calorias
         FROM cardapio c
         JOIN cardapio_itens ci ON ci.cardapio_id = c.id
        WHERE c.data_cardapio = ${dateParam ? '?' : 'CURDATE()'}
          AND c.ativo = 1
        ORDER BY c.turno, ci.tipo`,
      dateParam ? [dateParam] : []
    );
    return rows;
  }

  async listarCardapioDaSemana() {
    const [rows] = await pool.execute(
      `SELECT c.id, c.data_cardapio, c.turno,
              DAYNAME(c.data_cardapio) AS dia_semana,
              GROUP_CONCAT(ci.descricao ORDER BY ci.tipo SEPARATOR ' | ') AS itens
         FROM cardapio c
         LEFT JOIN cardapio_itens ci ON ci.cardapio_id = c.id
        WHERE c.data_cardapio BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
          AND c.ativo = 1
        GROUP BY c.id
        ORDER BY c.data_cardapio, FIELD(c.turno,'cafe_manha','almoco','lanche','jantar')`
    );
    return rows;
  }

  // ─── F15 — TREINAMENTOS ─────────────────────────────────────────────────────

  async listarMeusTreinamentos(userId) {
    const [rows] = await pool.execute(
      `SELECT t.id, t.nome, t.descricao, t.carga_horaria, t.obrigatorio,
              t.validade_meses, t.modalidade,
              tu.status, tu.data_inicio, tu.data_conclusao
         FROM treinamentos t
         LEFT JOIN treinamentos_usuarios tu
                ON tu.treinamento_id = t.id AND tu.usuario_id = ?
        WHERE t.ativo = 1
        ORDER BY t.obrigatorio DESC, t.nome ASC`,
      [userId]
    );
    return rows;
  }

  // ─── F16 — HOLERITES ───────────────────────────────────────────────────────

  async listarHolerites(userId) {
    const [rows] = await pool.execute(
      `SELECT id, mes, ano, salario_bruto, salario_liquido, pdf_url, disponibilizado_em
         FROM holerites
        WHERE usuario_id = ?
        ORDER BY ano DESC, mes DESC`,
      [userId]
    );
    return rows;
  }

  // ─── F17 — BANCO DE HORAS ──────────────────────────────────────────────────

  async getBancoHoras(userId) {
    // Verifica se o usuário possui colaborador vinculado
    const [colab] = await pool.execute(
      `SELECT id FROM colaboradores WHERE usuario_id = ? LIMIT 1`,
      [userId]
    );

    if (!colab.length) {
      return { saldo_horas: 0, registros_mes: 0, ultimo_registro: null };
    }

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS registros, MAX(data_hora) AS ultimo_registro
         FROM ponto_eletronico pe
         JOIN colaboradores c ON c.id = pe.colaborador_id
        WHERE c.usuario_id = ?
          AND MONTH(pe.data_hora) = MONTH(CURDATE())
          AND YEAR(pe.data_hora)  = YEAR(CURDATE())`,
      [userId]
    );

    const { registros, ultimo_registro } = rows[0];
    return {
      saldo_horas:     0,           // calculado externamente; exposto como 0 por ora
      registros_mes:   registros || 0,
      ultimo_registro: ultimo_registro || null,
    };
  }

  async getResumoHoras(userId) {
    try {
      const [pontoRows] = await pool.execute(
        `SELECT DATE_FORMAT(data_ponto, '%Y-%m') AS mes,
                SEC_TO_TIME(SUM(TIME_TO_SEC(horas_trabalhadas))) AS total_horas
           FROM ponto WHERE usuario_id = ?
           GROUP BY mes ORDER BY mes DESC LIMIT 6`,
        [userId]
      );
      return pontoRows;
    } catch (err) {
      // Fallback if ponto table doesn't exist
      return [];
    }
  }

  // ─── F18 — RAMAIS / CONTATOS ────────────────────────────────────────────────

  async listarRamais({ search, departamento_id } = {}) {
    const params = [];
    let where = 'WHERE r.ativo = 1';

    if (search && search.trim()) {
      where += ' AND (r.nome LIKE ? OR r.ramal LIKE ? OR r.celular LIKE ?)';
      const like = `%${search.trim()}%`;
      params.push(like, like, like);
    }
    if (departamento_id) {
      where += ' AND r.departamento_id = ?';
      params.push(departamento_id);
    }

    const [rows] = await pool.execute(
      `SELECT r.*, d.nome AS departamento_nome
         FROM ramais r
         LEFT JOIN departamentos d ON d.id = r.departamento_id
        ${where}
        ORDER BY d.nome, r.nome`,
      params
    );
    return rows;
  }

  // ─── F19 — CANAL DE ÉTICA (ANÔNIMO) ────────────────────────────────────────

  async criarDenunciaEtica({ categoria, descricao, departamento_envolvido_id }) {
    // Protocolo único — sem vínculo com usuário (anonimato intencional)
    const protocolo = `ET-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    await pool.execute(
      `INSERT INTO denuncias_etica
         (protocolo, categoria, descricao, departamento_envolvido_id)
       VALUES (?, ?, ?, ?)`,
      [
        protocolo,
        categoria                  || null,
        descricao,
        departamento_envolvido_id  || null,
      ]
    );
    return { protocolo };
  }

  // ─── F20 — EPIs ────────────────────────────────────────────────────────────

  async listarMeusEpis(userId) {
    const [rows] = await pool.execute(
      `SELECT ec.*, e.nome AS epi_nome, e.ca_numero, e.validade_meses,
              ec.data_entrega, ec.data_devolucao
         FROM epis_colaboradores ec
         JOIN epis e          ON e.id  = ec.epi_id
         JOIN colaboradores c ON c.id  = ec.colaborador_id
        WHERE c.usuario_id = ?
          AND ec.data_devolucao IS NULL
        ORDER BY ec.data_entrega DESC`,
      [userId]
    );
    return rows;
  }

  // ─── F21 — ADIANTAMENTOS ───────────────────────────────────────────────────

  async criarAdiantamento(userId, { valor_solicitado, motivo }) {
    const [result] = await pool.execute(
      `INSERT INTO adiantamentos (usuario_id, valor_solicitado, motivo)
       VALUES (?, ?, ?)`,
      [userId, valor_solicitado, motivo || null]
    );
    return { id: result.insertId };
  }

  async listarMeusAdiantamentos(userId) {
    const [rows] = await pool.execute(
      `SELECT a.id, a.valor_solicitado, a.motivo, a.status,
              a.observacao, a.criado_em,
              u.nome AS aprovado_por_nome
         FROM adiantamentos a
         LEFT JOIN usuarios u ON u.id = a.aprovado_por
        WHERE a.usuario_id = ?
        ORDER BY a.criado_em DESC
        LIMIT 20`,
      [userId]
    );
    return rows;
  }

  async cancelarAdiantamento(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, usuario_id AS solicitante_id FROM adiantamentos WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (row.status !== 'pendente') throw new AppError('Este adiantamento não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE adiantamentos SET status = 'cancelado' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ─── F22 — BUG REPORTS ─────────────────────────────────────────────────────

  async criarBugReport(userId, { titulo, modulo, descricao, passos_reproducao, prioridade }) {
    const [result] = await pool.execute(
      `INSERT INTO bug_reports
         (usuario_id, titulo, modulo, descricao, passos_reproducao, prioridade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        titulo,
        modulo             || null,
        descricao,
        passos_reproducao  || null,
        prioridade         || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMeusBugs(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM bug_reports
        WHERE usuario_id = ?
        ORDER BY criado_em DESC
        LIMIT 30`,
      [userId]
    );
    return rows;
  }

  // ─── F23 — CHAMADOS DE TI ──────────────────────────────────────────────────

  async criarChamadoTI(userId, { titulo, descricao, categoria, prioridade }) {
    const [result] = await pool.execute(
      `INSERT INTO chamados_ti
         (solicitante_id, titulo, descricao, categoria, prioridade,
          status, data_abertura)
       VALUES (?, ?, ?, ?, ?, 'aberto', NOW())`,
      [
        userId,
        titulo,
        descricao,
        categoria  || null,
        prioridade || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMeusChamadosTI(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM chamados_ti
        WHERE solicitante_id = ?
        ORDER BY data_abertura DESC
        LIMIT 30`,
      [userId]
    );
    return rows;
  }

  // ─── F24 — LAVANDERIA ──────────────────────────────────────────────────────

  async criarLavanderia(userId, { tipo, quantidade_pecas, observacao, data_preferencial }) {
    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_lavanderia
         (solicitante_id, tipo, quantidade_pecas, observacao, data_preferencial)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        tipo               || null,
        quantidade_pecas   || null,
        observacao         || null,
        data_preferencial  || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMinhasLavanderia(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM solicitacoes_lavanderia
        WHERE solicitante_id = ?
        ORDER BY criado_em DESC
        LIMIT 30`,
      [userId]
    );
    return rows;
  }

  async cancelarLavanderia(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM solicitacoes_lavanderia WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE solicitacoes_lavanderia SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ─── F25 — SERVIÇOS GERAIS ─────────────────────────────────────────────────

  async criarServicosGerais(userId, { tipo, descricao, local, urgencia }) {
    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_servicos_gerais
         (solicitante_id, tipo, descricao, local, urgencia)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        tipo      || null,
        descricao,
        local     || null,
        urgencia  || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMinhasServicosGerais(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM solicitacoes_servicos_gerais
        WHERE solicitante_id = ?
        ORDER BY criado_em DESC
        LIMIT 30`,
      [userId]
    );
    return rows;
  }

  async cancelarServicosGerais(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM solicitacoes_servicos_gerais WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE solicitacoes_servicos_gerais SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ─── F26 — VEÍCULOS ────────────────────────────────────────────────────────

  async criarSolicitacaoVeiculo(userId, {
    destino,
    data_saida,
    data_retorno,
    motivo,
    passageiros,
    veiculo_preferido_id,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_veiculo
         (solicitante_id, destino, data_saida, data_retorno, motivo,
          passageiros, veiculo_preferido_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        destino,
        data_saida,
        data_retorno,
        motivo,
        passageiros          || null,
        veiculo_preferido_id || null,
      ]
    );
    return { id: result.insertId };
  }

  async listarMinhasSolicitacoesVeiculo(userId) {
    const [rows] = await pool.execute(
      `SELECT sv.*, v.placa, v.modelo
         FROM solicitacoes_veiculo sv
         LEFT JOIN veiculos v ON v.id = sv.veiculo_atribuido_id
        WHERE sv.solicitante_id = ?
        ORDER BY sv.criado_em DESC
        LIMIT 30`,
      [userId]
    );
    return rows;
  }

  async cancelarVeiculo(userId, id) {
    const [[row]] = await pool.execute(
      `SELECT id, status, solicitante_id FROM solicitacoes_veiculo WHERE id = ?`,
      [id]
    );
    if (!row) throw new AppError('Registro não encontrado.', HTTP.NOT_FOUND);
    if (row.solicitante_id !== userId) throw new AppError('Sem permissão.', HTTP.FORBIDDEN);
    if (!['pendente', 'aberta'].includes(row.status)) throw new AppError('Este registro não pode ser cancelado.', HTTP.BAD_REQUEST);
    await pool.execute(`UPDATE solicitacoes_veiculo SET status = 'cancelada' WHERE id = ?`, [id]);
    return { ok: true };
  }

  async listarVeiculosDisponiveis() {
    const [rows] = await pool.execute(
      `SELECT id, placa, modelo, marca, tipo
         FROM veiculos
        WHERE status = 'disponivel'
        ORDER BY modelo`
    );
    return rows;
  }

  // ─── F27 — REQUISIÇÃO DE ESTOQUE ───────────────────────────────────────────
  // listarEstoque já cobre a visualização (reutiliza F13)

  async criarRequisicaoEstoque(userId, { produto_id, quantidade, justificativa }) {
    // Busca nome do produto para registrar na solicitacao_compra
    const [prodRows] = await pool.execute(
      `SELECT nome FROM produtos WHERE id = ? AND ativo = 1 LIMIT 1`,
      [produto_id]
    );

    const item_descricao = prodRows.length
      ? `[Requisição de Estoque] ${prodRows[0].nome} (${quantidade} un.)`
      : `[Requisição de Estoque] produto_id=${produto_id} (${quantidade} un.)`;

    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_compra
         (solicitante_id, item_descricao, quantidade, justificativa, urgencia)
       VALUES (?, ?, ?, ?, 'media')`,
      [userId, item_descricao, quantidade, justificativa || null]
    );
    return { id: result.insertId };
  }

  // ─── F28 — ESCALA DE MANUTENÇÃO ────────────────────────────────────────────

  async listarEscalaManutencao(userId) {
    const [rows] = await pool.execute(
      `SELECT os.id, os.codigo, os.tipo, os.prioridade, os.descricao,
              os.status, os.data_previsao,
              e.nome AS equipamento, e.localizacao
         FROM ordens_servico os
         LEFT JOIN equipamentos e ON e.id = os.equipamento_id
        WHERE e.departamento_id = (
                SELECT departamento_id FROM usuarios WHERE id = ? LIMIT 1
              )
          AND os.status NOT IN ('concluida', 'cancelada')
        ORDER BY os.data_previsao ASC
        LIMIT 30`,
      [userId]
    );
    return rows;
  }
}

module.exports = new GlobalService();
