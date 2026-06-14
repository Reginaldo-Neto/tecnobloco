'use strict';

const pool = require('../../../config/database');
const { AppError } = require('../../utils/errorHandler');
const { HTTP } = require('../../../config/constants');

class RhService {

  async getStats() {
    const [[{ colaboradoresAtivos }]] = await pool.execute(
      `SELECT COUNT(*) AS colaboradoresAtivos FROM colaboradores WHERE ativo = 1`
    );
    const [[{ feriasEmGozo }]] = await pool.execute(
      `SELECT COUNT(*) AS feriasEmGozo FROM ferias WHERE status = 'em_gozo'`
    );
    const [[{ treinamentosVencidos }]] = await pool.execute(
      `SELECT COUNT(*) AS treinamentosVencidos FROM treinamentos_usuarios WHERE status = 'expirado'`
    );
    const [[{ adiantamentosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS adiantamentosPendentes FROM adiantamentos WHERE status = 'pendente'`
    );
    const [[{ documentosPendentes }]] = await pool.execute(
      `SELECT COUNT(*) AS documentosPendentes FROM documentos_pessoais WHERE validado = 0`
    );
    const [[{ episAbaixoMinimo }]] = await pool.execute(
      `SELECT COUNT(*) AS episAbaixoMinimo FROM epis WHERE estoque_atual <= estoque_minimo`
    );
    return { colaboradoresAtivos, feriasEmGozo, treinamentosVencidos, adiantamentosPendentes, documentosPendentes, episAbaixoMinimo };
  }

  // ── Colaboradores ─────────────────────────────────────────────────────────────

  async listarColaboradores({ departamento_id, ativo } = {}) {
    const where = ['1=1']; const params = [];
    if (departamento_id) { where.push('c.departamento_id = ?'); params.push(departamento_id); }
    if (ativo !== undefined) { where.push('c.ativo = ?'); params.push(Number(ativo)); }
    else { where.push('c.ativo = 1'); }
    const [rows] = await pool.execute(
      `SELECT c.*, d.nome AS departamento_nome, ca.nome AS cargo_nome, u.email
       FROM colaboradores c
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       LEFT JOIN cargos ca ON ca.id = c.cargo_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE ${where.join(' AND ')} ORDER BY c.nome_completo LIMIT 500`, params
    );
    return rows;
  }

  async buscarColaborador(id) {
    const [[row]] = await pool.execute(
      `SELECT c.*, d.nome AS departamento_nome, ca.nome AS cargo_nome, u.email, u.nivel_acesso
       FROM colaboradores c
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       LEFT JOIN cargos ca ON ca.id = c.cargo_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ?`, [id]
    );
    if (!row) throw new AppError('Colaborador não encontrado', HTTP.NOT_FOUND);
    return row;
  }

  async criarColaborador(userId, data) {
    if (!data.nome_completo || !data.cpf || !data.data_admissao)
      throw new AppError('Nome, CPF e data de admissão são obrigatórios', HTTP.BAD_REQUEST);
    const cpf = data.cpf.replace(/\D/g, '');
    const [[ex]] = await pool.execute(`SELECT id FROM colaboradores WHERE cpf = ?`, [cpf]);
    if (ex) throw new AppError('CPF já cadastrado', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO colaboradores (
        nome_completo, cpf, rg, data_nascimento, genero, estado_civil,
        escolaridade, telefone, telefone2, email_pessoal, email_corporativo, ramal,
        cep, logradouro, numero, complemento, bairro, cidade, uf,
        data_admissao, tipo_contrato, departamento_id, cargo_id, salario, foto_url, matricula, turno,
        nome_social, nacionalidade, naturalidade_cidade, naturalidade_uf, nome_mae, nome_pai, raca_cor,
        ctps_numero, ctps_serie, ctps_uf, pis_pasep, titulo_eleitor,
        reservista, passaporte, passaporte_validade,
        banco, banco_agencia, banco_conta, banco_tipo_conta, banco_pix,
        sindicato_nome, sindicato_contribui,
        tipo_sanguineo, deficiencia, deficiencia_tipo, convenio_saude, convenio_numero, convenio_plano, convenio_odonto
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.nome_completo, cpf, data.rg || null, data.data_nascimento || null,
        data.genero || null, data.estado_civil || null, data.escolaridade || null,
        data.telefone || null, data.telefone2 || null, data.email_pessoal || null,
        data.email_corporativo || null, data.ramal || null,
        data.cep || null, data.logradouro || null, data.numero || null,
        data.complemento || null, data.bairro || null, data.cidade || null, data.uf || null,
        data.data_admissao, data.tipo_contrato || 'CLT',
        data.departamento_id || null, data.cargo_id || null,
        data.salario || null, data.foto_url || null,
        data.matricula || null, data.turno || null,
        data.nome_social || null, data.nacionalidade || 'Brasileira',
        data.naturalidade_cidade || null, data.naturalidade_uf || null,
        data.nome_mae || null, data.nome_pai || null, data.raca_cor || null,
        data.ctps_numero || null, data.ctps_serie || null, data.ctps_uf || null,
        data.pis_pasep || null, data.titulo_eleitor || null,
        data.reservista || null, data.passaporte || null, data.passaporte_validade || null,
        data.banco || null, data.banco_agencia || null, data.banco_conta || null,
        data.banco_tipo_conta || null, data.banco_pix || null,
        data.sindicato_nome || null, data.sindicato_contribui ? 1 : 0,
        data.tipo_sanguineo || null, data.deficiencia ? 1 : 0, data.deficiencia_tipo || null,
        data.convenio_saude || null, data.convenio_numero || null,
        data.convenio_plano || null, data.convenio_odonto || null,
      ]
    );
    return { id: res.insertId };
  }

  async atualizarColaborador(id, data) {
    const [[row]] = await pool.execute(`SELECT id FROM colaboradores WHERE id = ?`, [id]);
    if (!row) throw new AppError('Colaborador não encontrado', HTTP.NOT_FOUND);
    const allowed = [
      'nome_completo','nome_social','rg','data_nascimento','genero','estado_civil','escolaridade',
      'telefone','telefone2','email_pessoal','email_corporativo','ramal',
      'cep','logradouro','numero','complemento','bairro','cidade','uf',
      'tipo_contrato','departamento_id','cargo_id','salario','foto_url','data_demissao','ativo',
      'matricula','turno','nacionalidade','naturalidade_cidade','naturalidade_uf',
      'nome_mae','nome_pai','raca_cor',
      'ctps_numero','ctps_serie','ctps_uf','pis_pasep','titulo_eleitor',
      'zona_eleitoral','secao_eleitoral','reservista','passaporte','passaporte_validade',
      'data_experiencia1','data_experiencia2',
      'banco','banco_agencia','banco_conta','banco_tipo_conta','banco_pix',
      'sindicato_nome','sindicato_contribui',
      'tipo_sanguineo','deficiencia','deficiencia_tipo',
      'convenio_saude','convenio_numero','convenio_plano','convenio_odonto',
    ];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE colaboradores SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Ponto Eletrônico ──────────────────────────────────────────────────────────

  async listarPonto({ colaborador_id, data_inicio, data_fim } = {}) {
    const where = ['1=1']; const params = [];
    if (colaborador_id) { where.push('p.colaborador_id = ?'); params.push(colaborador_id); }
    if (data_inicio) { where.push('DATE(p.data_hora) >= ?'); params.push(data_inicio); }
    if (data_fim)    { where.push('DATE(p.data_hora) <= ?'); params.push(data_fim); }
    const [rows] = await pool.execute(
      `SELECT p.*, c.nome_completo AS colaborador_nome FROM ponto_eletronico p
       LEFT JOIN colaboradores c ON c.id = p.colaborador_id
       WHERE ${where.join(' AND ')} ORDER BY p.data_hora DESC LIMIT 500`, params
    );
    return rows;
  }

  async registrarPonto(userId, { colaborador_id, tipo, obs }) {
    if (!colaborador_id || !tipo) throw new AppError('Colaborador e tipo obrigatórios', HTTP.BAD_REQUEST);
    const valid = ['entrada','saida_almoco','retorno_almoco','saida'];
    if (!valid.includes(tipo)) throw new AppError('Tipo de ponto inválido', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ponto_eletronico (colaborador_id, data_hora, tipo, obs) VALUES (?, NOW(), ?, ?)`,
      [colaborador_id, tipo, obs || null]
    );
    return { id: res.insertId };
  }

  // ── Férias ────────────────────────────────────────────────────────────────────

  async listarFerias({ colaborador_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (colaborador_id) { where.push('f.colaborador_id = ?'); params.push(colaborador_id); }
    if (status) { where.push('f.status = ?'); params.push(status); }
    const [rows] = await pool.execute(
      `SELECT f.*, c.nome_completo AS colaborador_nome, ap.nome AS aprovado_por_nome
       FROM ferias f
       LEFT JOIN colaboradores c ON c.id = f.colaborador_id
       LEFT JOIN usuarios ap ON ap.id = f.aprovado_por
       WHERE ${where.join(' AND ')} ORDER BY f.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarFerias(userId, { colaborador_id, data_inicio, data_fim, dias_aprovados }) {
    if (!colaborador_id || !data_inicio || !data_fim)
      throw new AppError('Colaborador e datas obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ferias (colaborador_id, data_inicio, data_fim, dias_aprovados) VALUES (?, ?, ?, ?)`,
      [colaborador_id, data_inicio, data_fim, dias_aprovados || 30]
    );
    return { id: res.insertId };
  }

  async atualizarFerias(userId, id, { status, observacao }) {
    const [[row]] = await pool.execute(`SELECT id FROM ferias WHERE id = ?`, [id]);
    if (!row) throw new AppError('Férias não encontradas', HTTP.NOT_FOUND);
    const sets = ['status = ?']; const params = [status];
    if (status === 'aprovado' || status === 'rejeitado') { sets.push('aprovado_por = ?'); params.push(userId); }
    params.push(id);
    await pool.execute(`UPDATE ferias SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── EPIs ──────────────────────────────────────────────────────────────────────

  async listarEpis() {
    const [rows] = await pool.execute(`SELECT * FROM epis ORDER BY nome`);
    return rows;
  }

  async listarEntregasEpi({ colaborador_id } = {}) {
    const where = colaborador_id ? 'WHERE ec.colaborador_id = ?' : '';
    const params = colaborador_id ? [colaborador_id] : [];
    const [rows] = await pool.execute(
      `SELECT ec.*, e.nome AS epi_nome, c.nome_completo AS colaborador_nome, u.nome AS entregue_por_nome
       FROM epis_colaboradores ec
       LEFT JOIN epis e ON e.id = ec.epi_id
       LEFT JOIN colaboradores c ON c.id = ec.colaborador_id
       LEFT JOIN usuarios u ON u.id = ec.entregue_por
       ${where} ORDER BY ec.data_entrega DESC LIMIT 200`, params
    );
    return rows;
  }

  async registrarEntregaEpi(userId, { colaborador_id, epi_id, data_entrega, quantidade }) {
    if (!colaborador_id || !epi_id) throw new AppError('Colaborador e EPI obrigatórios', HTTP.BAD_REQUEST);
    const [[epi]] = await pool.execute(`SELECT * FROM epis WHERE id = ?`, [epi_id]);
    if (!epi) throw new AppError('EPI não encontrado', HTTP.NOT_FOUND);
    const qtd = Number(quantidade) || 1;
    if (epi.estoque_atual < qtd) throw new AppError('Estoque insuficiente', HTTP.CONFLICT);
    const [res] = await pool.execute(
      `INSERT INTO epis_colaboradores (colaborador_id, epi_id, data_entrega, quantidade, entregue_por) VALUES (?, ?, ?, ?, ?)`,
      [colaborador_id, epi_id, data_entrega || new Date().toISOString().split('T')[0], qtd, userId]
    );
    await pool.execute(`UPDATE epis SET estoque_atual = estoque_atual - ? WHERE id = ?`, [qtd, epi_id]);
    return { id: res.insertId };
  }

  async criarEpi(userId, { nome, ca_numero, validade_meses, estoque_atual, estoque_minimo }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO epis (nome, ca_numero, validade_meses, estoque_atual, estoque_minimo) VALUES (?, ?, ?, ?, ?)`,
      [nome, ca_numero || null, validade_meses || null, estoque_atual || 0, estoque_minimo || 0]
    );
    return { id: res.insertId };
  }

  // ── Treinamentos ──────────────────────────────────────────────────────────────

  async listarTreinamentos() {
    const [rows] = await pool.execute(`SELECT t.*, d.nome AS dept_nome FROM treinamentos t LEFT JOIN departamentos d ON d.id = t.departamento_id WHERE t.ativo = 1 ORDER BY t.nome`);
    return rows;
  }

  async listarParticipacoes({ treinamento_id, usuario_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (treinamento_id) { where.push('tu.treinamento_id = ?'); params.push(treinamento_id); }
    if (usuario_id)     { where.push('tu.usuario_id = ?');     params.push(usuario_id); }
    if (status)         { where.push('tu.status = ?');         params.push(status); }
    const [rows] = await pool.execute(
      `SELECT tu.*, t.nome AS treinamento_nome, u.nome AS usuario_nome
       FROM treinamentos_usuarios tu
       LEFT JOIN treinamentos t ON t.id = tu.treinamento_id
       LEFT JOIN usuarios u ON u.id = tu.usuario_id
       WHERE ${where.join(' AND ')} ORDER BY tu.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarTreinamento(userId, { nome, descricao, carga_horaria, validade_meses, modalidade, obrigatorio, departamento_id, nivel_minimo }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO treinamentos (nome, descricao, carga_horaria, validade_meses, modalidade, obrigatorio, departamento_id, nivel_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, descricao || null, carga_horaria || 8, validade_meses || null,
       modalidade || 'presencial', obrigatorio ? 1 : 0, departamento_id || null, nivel_minimo || 0]
    );
    return { id: res.insertId };
  }

  async registrarParticipacao(userId, { treinamento_id, usuario_id, data_inicio, data_conclusao, status, nota, certificado_url }) {
    if (!treinamento_id || !usuario_id) throw new AppError('Treinamento e usuário obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO treinamentos_usuarios (treinamento_id, usuario_id, data_inicio, data_conclusao, status, nota, certificado_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE data_conclusao = VALUES(data_conclusao), status = VALUES(status), nota = VALUES(nota)`,
      [treinamento_id, usuario_id, data_inicio || null, data_conclusao || null,
       status || 'pendente', nota || null, certificado_url || null]
    );
    return { id: res.insertId };
  }

  // ── Holerites ─────────────────────────────────────────────────────────────────

  async listarHolerites({ usuario_id, mes, ano } = {}) {
    const where = ['1=1']; const params = [];
    if (usuario_id) { where.push('h.usuario_id = ?'); params.push(usuario_id); }
    if (mes)        { where.push('h.mes = ?');         params.push(mes); }
    if (ano)        { where.push('h.ano = ?');         params.push(ano); }
    const [rows] = await pool.execute(
      `SELECT h.*, u.nome AS usuario_nome FROM holerites h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
       WHERE ${where.join(' AND ')} ORDER BY h.ano DESC, h.mes DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarHolerite(userId, { usuario_id, mes, ano, salario_bruto, inss, fgts, ir, outros_descontos, outros_acrescimos, pdf_url }) {
    if (!usuario_id || !mes || !ano) throw new AppError('Usuário, mês e ano obrigatórios', HTTP.BAD_REQUEST);
    const liquido = (Number(salario_bruto||0) - Number(inss||0) - Number(ir||0) - Number(outros_descontos||0) + Number(outros_acrescimos||0)).toFixed(2);
    const [res] = await pool.execute(
      `INSERT INTO holerites (usuario_id, mes, ano, salario_bruto, inss, fgts, ir, outros_descontos, outros_acrescimos, salario_liquido, pdf_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, mes, ano, salario_bruto||0, inss||0, fgts||0, ir||0, outros_descontos||0, outros_acrescimos||0, liquido, pdf_url||null]
    );
    return { id: res.insertId };
  }

  // ── Adiantamentos ─────────────────────────────────────────────────────────────

  async listarAdiantamentos({ status } = {}) {
    const where = status ? 'WHERE a.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS usuario_nome, ap.nome AS aprovado_por_nome
       FROM adiantamentos a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN usuarios ap ON ap.id = a.aprovado_por
       ${where} ORDER BY a.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async atualizarAdiantamento(userId, id, { status, observacao }) {
    const [[row]] = await pool.execute(`SELECT id FROM adiantamentos WHERE id = ?`, [id]);
    if (!row) throw new AppError('Adiantamento não encontrado', HTTP.NOT_FOUND);
    const sets = ['status = ?']; const params = [status];
    if (status === 'aprovado' || status === 'rejeitado') { sets.push('aprovado_por = ?'); params.push(userId); }
    if (observacao !== undefined) { sets.push('observacao = ?'); params.push(observacao); }
    params.push(id);
    await pool.execute(`UPDATE adiantamentos SET ${sets.join(', ')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Ramais ────────────────────────────────────────────────────────────────────

  async listarRamais() {
    const [rows] = await pool.execute(
      `SELECT r.*, d.nome AS dept_nome FROM ramais r
       LEFT JOIN departamentos d ON d.id = r.departamento_id
       WHERE r.ativo = 1 ORDER BY d.nome, r.nome`
    );
    return rows;
  }

  async criarRamal(userId, { nome, ramal, celular, email, departamento_id, cargo }) {
    if (!nome) throw new AppError('Nome obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO ramais (nome, ramal, celular, email, departamento_id, cargo) VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, ramal || null, celular || null, email || null, departamento_id || null, cargo || null]
    );
    return { id: res.insertId };
  }

  async excluirRamal(id) {
    await pool.execute(`UPDATE ramais SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Denúncias de Ética ────────────────────────────────────────────────────────

  async listarDenuncias({ status } = {}) {
    const where = status ? 'WHERE status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT id, protocolo, categoria, descricao, departamento_envolvido_id, status, resposta_publica, criado_em
       FROM denuncias_etica ${where} ORDER BY criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async atualizarDenuncia(id, { status, resposta_publica }) {
    await pool.execute(
      `UPDATE denuncias_etica SET status = ?, resposta_publica = ? WHERE id = ?`,
      [status, resposta_publica || null, id]
    );
    return { ok: true };
  }

  // ── Documentos Pessoais ───────────────────────────────────────────────────────

  async listarDocumentos({ usuario_id, validado } = {}) {
    const where = ['1=1']; const params = [];
    if (usuario_id)   { where.push('d.usuario_id = ?'); params.push(usuario_id); }
    if (validado !== undefined) { where.push('d.validado = ?'); params.push(Number(validado)); }
    const [rows] = await pool.execute(
      `SELECT d.*, u.nome AS usuario_nome, v.nome AS validado_por_nome
       FROM documentos_pessoais d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       LEFT JOIN usuarios v ON v.id = d.validado_por
       WHERE ${where.join(' AND ')} ORDER BY d.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async validarDocumento(userId, id, { observacao_rh }) {
    await pool.execute(
      `UPDATE documentos_pessoais SET validado = 1, validado_por = ?, observacao_rh = ? WHERE id = ?`,
      [userId, observacao_rh || null, id]
    );
    return { ok: true };
  }

  // ── Escalas ───────────────────────────────────────────────────────────────────

  async listarEscalas() {
    const [rows] = await pool.execute(
      `SELECT e.*, COALESCE(u.nome, e.nome_externo) AS nome_exibir
       FROM rh_escalas e LEFT JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.data_inicio DESC LIMIT 100`
    );
    return rows;
  }

  async criarEscala(userId, { usuario_id, nome_externo, turno, data_inicio, data_fim, observacao }) {
    if (!turno || !data_inicio) throw new AppError('Turno e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_escalas (usuario_id, nome_externo, turno, data_inicio, data_fim, observacao, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, nome_externo || null, turno, data_inicio, data_fim || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirEscala(id) {
    await pool.execute(`DELETE FROM rh_escalas WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Selects ───────────────────────────────────────────────────────────────────

  async listarDepartamentos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM departamentos ORDER BY nome`);
    return rows;
  }

  async listarCargos() {
    const [rows] = await pool.execute(`SELECT id, nome, nivel_acesso FROM cargos ORDER BY nome`);
    return rows;
  }

  async listarUsuariosAtivos() {
    const [rows] = await pool.execute(`SELECT id, nome FROM usuarios WHERE ativo = 1 ORDER BY nome`);
    return rows;
  }

  async recentesColaboradores() {
    const [rows] = await pool.execute(
      `SELECT c.*, d.nome AS departamento_nome, ca.nome AS cargo_nome FROM colaboradores c
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       LEFT JOIN cargos ca ON ca.id = c.cargo_id
       WHERE c.ativo = 1 ORDER BY c.criado_em DESC LIMIT 10`
    );
    return rows;
  }

  // ── Saúde / Alergias ──────────────────────────────────────────────────────────

  async listarSaude(colaborador_id) {
    const [rows] = await pool.execute(
      `SELECT s.*, u.nome AS criado_por_nome FROM rh_saude s
       LEFT JOIN usuarios u ON u.id = s.criado_por
       WHERE s.colaborador_id = ? ORDER BY s.tipo, s.criado_em DESC`, [colaborador_id]
    );
    return rows;
  }

  async criarSaude(userId, { colaborador_id, tipo, descricao, gravidade, observacao }) {
    if (!colaborador_id || !tipo || !descricao)
      throw new AppError('Colaborador, tipo e descrição obrigatórios', HTTP.BAD_REQUEST);
    const tipos = ['alergia','medicamento_continuo','doenca_cronica','cirurgia','restricao_alimentar','vacina','outros'];
    if (!tipos.includes(tipo)) throw new AppError('Tipo inválido', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_saude (colaborador_id, tipo, descricao, gravidade, observacao, criado_por) VALUES (?,?,?,?,?,?)`,
      [colaborador_id, tipo, descricao, gravidade || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async excluirSaude(id) {
    await pool.execute(`DELETE FROM rh_saude WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── CNH ───────────────────────────────────────────────────────────────────────

  async buscarCnh(colaborador_id) {
    const [[row]] = await pool.execute(`SELECT * FROM rh_cnh WHERE colaborador_id = ?`, [colaborador_id]);
    return row || null;
  }

  async salvarCnh(userId, colaborador_id, { numero, categoria, data_emissao, data_validade, uf_emissao, observacao }) {
    if (!numero || !categoria) throw new AppError('Número e categoria obrigatórios', HTTP.BAD_REQUEST);
    const [[ex]] = await pool.execute(`SELECT id FROM rh_cnh WHERE colaborador_id = ?`, [colaborador_id]);
    if (ex) {
      await pool.execute(
        `UPDATE rh_cnh SET numero=?,categoria=?,data_emissao=?,data_validade=?,uf_emissao=?,observacao=?,atualizado_por=? WHERE colaborador_id=?`,
        [numero, categoria, data_emissao || null, data_validade || null, uf_emissao || null, observacao || null, userId, colaborador_id]
      );
      return { id: ex.id };
    }
    const [res] = await pool.execute(
      `INSERT INTO rh_cnh (colaborador_id,numero,categoria,data_emissao,data_validade,uf_emissao,observacao,atualizado_por) VALUES (?,?,?,?,?,?,?,?)`,
      [colaborador_id, numero, categoria, data_emissao || null, data_validade || null, uf_emissao || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  // ── CNH: listagem com vencimento próximo ──────────────────────────────────────

  async cnhProximasVencer(dias = 30) {
    const [rows] = await pool.execute(
      `SELECT cnh.*, c.nome_completo, c.departamento_id, d.nome AS departamento_nome
       FROM rh_cnh cnh
       JOIN colaboradores c ON c.id = cnh.colaborador_id AND c.ativo = 1
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE cnh.data_validade IS NOT NULL
         AND cnh.data_validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY cnh.data_validade ASC`, [dias]
    );
    return rows;
  }

  async cnhVencidas() {
    const [rows] = await pool.execute(
      `SELECT cnh.*, c.nome_completo, c.departamento_id, d.nome AS departamento_nome
       FROM rh_cnh cnh
       JOIN colaboradores c ON c.id = cnh.colaborador_id AND c.ativo = 1
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE cnh.data_validade IS NOT NULL AND cnh.data_validade < CURDATE()
       ORDER BY cnh.data_validade ASC`, []
    );
    return rows;
  }

  // ── Contatos de Emergência ────────────────────────────────────────────────────

  async listarContatosEmergencia(colaborador_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM rh_contatos_emergencia WHERE colaborador_id = ? ORDER BY prioridade ASC, id ASC`,
      [colaborador_id]
    );
    return rows;
  }

  async criarContatoEmergencia(colaborador_id, { nome, grau_parentesco, telefone, telefone2, email, endereco, prioridade }) {
    if (!colaborador_id || !nome || !grau_parentesco || !telefone)
      throw new AppError('Colaborador, nome, grau e telefone obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_contatos_emergencia (colaborador_id,nome,grau_parentesco,telefone,telefone2,email,endereco,prioridade)
       VALUES (?,?,?,?,?,?,?,?)`,
      [colaborador_id, nome, grau_parentesco, telefone, telefone2 || null, email || null, endereco || null, prioridade ? 1 : 0]
    );
    return { id: res.insertId };
  }

  async excluirContatoEmergencia(id) {
    await pool.execute(`DELETE FROM rh_contatos_emergencia WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Dependentes ───────────────────────────────────────────────────────────────

  async listarDependentes(colaborador_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM rh_dependentes WHERE colaborador_id = ? ORDER BY grau_parentesco, nome`,
      [colaborador_id]
    );
    return rows;
  }

  async criarDependente(colaborador_id, { nome, grau_parentesco, data_nascimento, cpf, ir, plano_saude }) {
    if (!nome || !grau_parentesco) throw new AppError('Nome e grau de parentesco obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_dependentes (colaborador_id,nome,grau_parentesco,data_nascimento,cpf,ir,plano_saude) VALUES (?,?,?,?,?,?,?)`,
      [colaborador_id, nome, grau_parentesco, data_nascimento || null, cpf || null, ir ? 1 : 0, plano_saude ? 1 : 0]
    );
    return { id: res.insertId };
  }

  async excluirDependente(id) {
    await pool.execute(`DELETE FROM rh_dependentes WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Benefícios ────────────────────────────────────────────────────────────────

  async listarBeneficios(colaborador_id) {
    const [rows] = await pool.execute(
      `SELECT b.*, u.nome AS criado_por_nome FROM rh_beneficios_colaborador b
       LEFT JOIN usuarios u ON u.id = b.criado_por
       WHERE b.colaborador_id = ? ORDER BY b.tipo, b.data_inicio DESC`, [colaborador_id]
    );
    return rows;
  }

  async criarBeneficio(userId, colaborador_id, { tipo, valor, descricao, data_inicio, data_fim }) {
    if (!tipo || !data_inicio) throw new AppError('Tipo e data início obrigatórios', HTTP.BAD_REQUEST);
    const tipos = ['vale_transporte','vale_refeicao','vale_alimentacao','plano_saude','plano_odonto','seguro_vida','cesta_basica','outros'];
    if (!tipos.includes(tipo)) throw new AppError('Tipo de benefício inválido', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_beneficios_colaborador (colaborador_id,tipo,valor,descricao,data_inicio,data_fim,criado_por) VALUES (?,?,?,?,?,?,?)`,
      [colaborador_id, tipo, valor || null, descricao || null, data_inicio, data_fim || null, userId]
    );
    return { id: res.insertId };
  }

  async removerBeneficio(id) {
    await pool.execute(`UPDATE rh_beneficios_colaborador SET ativo = 0 WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Histórico Salarial ────────────────────────────────────────────────────────

  async listarHistoricoSalarial(colaborador_id) {
    const [rows] = await pool.execute(
      `SELECT h.*, u.nome AS registrado_por_nome FROM rh_historico_salarial h
       LEFT JOIN usuarios u ON u.id = h.registrado_por
       WHERE h.colaborador_id = ? ORDER BY h.data_vigencia DESC`, [colaborador_id]
    );
    return rows;
  }

  async criarHistoricoSalarial(userId, colaborador_id, { salario, motivo, data_vigencia, observacao }) {
    if (!salario || !motivo || !data_vigencia) throw new AppError('Salário, motivo e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_historico_salarial (colaborador_id,salario,motivo,data_vigencia,observacao,registrado_por) VALUES (?,?,?,?,?,?)`,
      [colaborador_id, salario, motivo, data_vigencia, observacao || null, userId]
    );
    // Atualiza salário atual no colaborador
    await pool.execute(`UPDATE colaboradores SET salario = ? WHERE id = ?`, [salario, colaborador_id]);
    return { id: res.insertId };
  }

  // ── Afastamentos ──────────────────────────────────────────────────────────────

  async listarAfastamentos({ colaborador_id, status } = {}) {
    const where = ['1=1']; const params = [];
    if (colaborador_id) { where.push('a.colaborador_id = ?'); params.push(colaborador_id); }
    if (status)         { where.push('a.status = ?');         params.push(status); }
    const [rows] = await pool.execute(
      `SELECT a.*, c.nome_completo AS colaborador_nome, u.nome AS validado_por_nome
       FROM rh_afastamentos a
       JOIN colaboradores c ON c.id = a.colaborador_id
       LEFT JOIN usuarios u ON u.id = a.validado_por
       WHERE ${where.join(' AND ')} ORDER BY a.data_inicio DESC LIMIT 300`, params
    );
    return rows;
  }

  async criarAfastamento(userId, { colaborador_id, tipo, data_inicio, data_fim, dias, cid, medico, crm, observacao }) {
    if (!colaborador_id || !tipo || !data_inicio)
      throw new AppError('Colaborador, tipo e data início obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_afastamentos (colaborador_id,tipo,data_inicio,data_fim,dias,cid,medico,crm,observacao,criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [colaborador_id, tipo, data_inicio, data_fim || null, dias || null, cid || null, medico || null, crm || null, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  async validarAfastamento(userId, id, { status, observacao }) {
    await pool.execute(
      `UPDATE rh_afastamentos SET status = ?, validado_por = ? WHERE id = ?`,
      [status, userId, id]
    );
    return { ok: true };
  }

  // ── Advertências ──────────────────────────────────────────────────────────────

  async listarAdvertencias({ colaborador_id } = {}) {
    const where = colaborador_id ? 'WHERE a.colaborador_id = ?' : '';
    const params = colaborador_id ? [colaborador_id] : [];
    const [rows] = await pool.execute(
      `SELECT a.*, c.nome_completo AS colaborador_nome, u.nome AS registrado_por_nome
       FROM rh_advertencias a
       JOIN colaboradores c ON c.id = a.colaborador_id
       LEFT JOIN usuarios u ON u.id = a.registrado_por
       ${where} ORDER BY a.data_ocorrencia DESC LIMIT 300`, params
    );
    return rows;
  }

  async criarAdvertencia(userId, { colaborador_id, tipo, motivo, data_ocorrencia, dias_suspensao, testemunha1, testemunha2, colaborador_ciente, observacao }) {
    if (!colaborador_id || !tipo || !motivo || !data_ocorrencia)
      throw new AppError('Campos obrigatórios faltando', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_advertencias (colaborador_id,tipo,motivo,data_ocorrencia,dias_suspensao,testemunha1,testemunha2,colaborador_ciente,observacao,registrado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [colaborador_id, tipo, motivo, data_ocorrencia, dias_suspensao || null, testemunha1 || null, testemunha2 || null, colaborador_ciente ? 1 : 0, observacao || null, userId]
    );
    return { id: res.insertId };
  }

  // ── Movimentações de Pessoal ──────────────────────────────────────────────────

  async listarMovimentacoes({ colaborador_id } = {}) {
    const where = colaborador_id ? 'WHERE m.colaborador_id = ?' : '';
    const params = colaborador_id ? [colaborador_id] : [];
    const [rows] = await pool.execute(
      `SELECT m.*, c.nome_completo AS colaborador_nome,
              da.nome AS depto_anterior_nome, dn.nome AS depto_novo_nome,
              ca.nome AS cargo_anterior_nome, cn.nome AS cargo_novo_nome,
              u.nome AS aprovado_por_nome
       FROM rh_movimentacoes m
       JOIN colaboradores c ON c.id = m.colaborador_id
       LEFT JOIN departamentos da ON da.id = m.depto_anterior
       LEFT JOIN departamentos dn ON dn.id = m.depto_novo
       LEFT JOIN cargos ca ON ca.id = m.cargo_anterior
       LEFT JOIN cargos cn ON cn.id = m.cargo_novo
       LEFT JOIN usuarios u ON u.id = m.aprovado_por
       ${where} ORDER BY m.data_vigencia DESC LIMIT 300`, params
    );
    return rows;
  }

  async criarMovimentacao(userId, { colaborador_id, tipo, descricao, depto_anterior, depto_novo, cargo_anterior, cargo_novo, data_vigencia }) {
    if (!colaborador_id || !tipo || !descricao || !data_vigencia)
      throw new AppError('Campos obrigatórios faltando', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_movimentacoes (colaborador_id,tipo,descricao,depto_anterior,depto_novo,cargo_anterior,cargo_novo,data_vigencia,aprovado_por)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [colaborador_id, tipo, descricao, depto_anterior || null, depto_novo || null, cargo_anterior || null, cargo_novo || null, data_vigencia, userId]
    );
    // Se mudança de depto/cargo, atualiza colaborador
    if (depto_novo) await pool.execute(`UPDATE colaboradores SET departamento_id = ? WHERE id = ?`, [depto_novo, colaborador_id]);
    if (cargo_novo) await pool.execute(`UPDATE colaboradores SET cargo_id = ? WHERE id = ?`, [cargo_novo, colaborador_id]);
    return { id: res.insertId };
  }

  // ── Organograma / Headcount ───────────────────────────────────────────────────

  async organograma() {
    const [rows] = await pool.execute(
      `SELECT d.id AS dept_id, d.nome AS dept_nome,
              COUNT(c.id) AS total,
              SUM(c.ativo = 1) AS ativos,
              SUM(c.ativo = 0) AS inativos
       FROM departamentos d
       LEFT JOIN colaboradores c ON c.departamento_id = d.id
       GROUP BY d.id, d.nome ORDER BY d.nome`
    );
    return rows;
  }

  // ── Aniversariantes ───────────────────────────────────────────────────────────

  async aniversariantesMes(mes) {
    const m = Number(mes) || new Date().getMonth() + 1;
    const [rows] = await pool.execute(
      `SELECT c.id, c.nome_completo, c.data_nascimento, c.foto_url,
              d.nome AS departamento_nome, ca.nome AS cargo_nome,
              DAY(c.data_nascimento) AS dia
       FROM colaboradores c
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       LEFT JOIN cargos ca ON ca.id = c.cargo_id
       WHERE c.ativo = 1 AND MONTH(c.data_nascimento) = ?
       ORDER BY DAY(c.data_nascimento)`, [m]
    );
    return rows;
  }

  // ── Adiantamentos: criação ────────────────────────────────────────────────────

  async criarAdiantamento(userId, { valor, motivo }) {
    if (!valor || Number(valor) <= 0) throw new AppError('Valor obrigatório e deve ser positivo', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO adiantamentos (usuario_id, valor, motivo) VALUES (?, ?, ?)`,
      [userId, valor, motivo || null]
    );
    return { id: res.insertId };
  }

  // ── Denúncias: criação (anônima ou autenticada) ───────────────────────────────

  async criarDenuncia({ categoria, descricao, departamento_envolvido_id }) {
    if (!categoria || !descricao) throw new AppError('Categoria e descrição obrigatórios', HTTP.BAD_REQUEST);
    const protocolo = 'DEN' + Date.now().toString(36).toUpperCase().slice(-6);
    const [res] = await pool.execute(
      `INSERT INTO denuncias_etica (protocolo, categoria, descricao, departamento_envolvido_id) VALUES (?,?,?,?)`,
      [protocolo, categoria, descricao, departamento_envolvido_id || null]
    );
    return { id: res.insertId, protocolo };
  }

  // ── Advertências: excluir ─────────────────────────────────────────────────────

  async excluirAdvertencia(id) {
    await pool.execute(`DELETE FROM rh_advertencias WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Excluir afastamento ───────────────────────────────────────────────────────

  async excluirAfastamento(id) {
    await pool.execute(`DELETE FROM rh_afastamentos WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Recrutamento: Vagas ───────────────────────────────────────────────────────

  async listarVagas({ status } = {}) {
    const where = status ? 'WHERE v.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.execute(
      `SELECT v.*, d.nome AS departamento_nome, c.nome AS cargo_nome,
              (SELECT COUNT(*) FROM rh_candidatos rc WHERE rc.vaga_id = v.id) AS total_candidatos,
              (SELECT COUNT(*) FROM rh_candidatos rc WHERE rc.vaga_id = v.id AND rc.etapa = 'aprovado') AS aprovados
       FROM rh_vagas v
       LEFT JOIN departamentos d ON d.id = v.departamento_id
       LEFT JOIN cargos c ON c.id = v.cargo_id
       ${where} ORDER BY v.prioridade DESC, v.criado_em DESC LIMIT 200`, params
    );
    return rows;
  }

  async criarVaga(userId, data) {
    if (!data.titulo) throw new AppError('Título obrigatório', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_vagas (titulo,departamento_id,cargo_id,descricao,requisitos,diferenciais,
        salario_min,salario_max,tipo_contrato,modalidade,vagas_qtd,prioridade,data_limite,criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [data.titulo, data.departamento_id||null, data.cargo_id||null, data.descricao||null,
       data.requisitos||null, data.diferenciais||null, data.salario_min||null, data.salario_max||null,
       data.tipo_contrato||'clt', data.modalidade||'presencial', data.vagas_qtd||1,
       data.prioridade||'normal', data.data_limite||null, userId]
    );
    return { id: res.insertId };
  }

  async atualizarVaga(id, data) {
    const allowed = ['titulo','descricao','requisitos','diferenciais','salario_min','salario_max',
      'tipo_contrato','modalidade','vagas_qtd','prioridade','status','data_limite'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k}=?`); params.push(data[k]); } }
    if (data.status === 'encerrada') { sets.push('encerrada_em = NOW()'); }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE rh_vagas SET ${sets.join(',')} WHERE id = ?`, params);
    return { ok: true };
  }

  // ── Recrutamento: Candidatos ──────────────────────────────────────────────────

  async listarCandidatos({ vaga_id, etapa } = {}) {
    const where = ['1=1']; const params = [];
    if (vaga_id) { where.push('rc.vaga_id = ?'); params.push(vaga_id); }
    if (etapa)   { where.push('rc.etapa = ?');   params.push(etapa); }
    const [rows] = await pool.execute(
      `SELECT rc.*, v.titulo AS vaga_titulo, u.nome AS responsavel_nome
       FROM rh_candidatos rc
       LEFT JOIN rh_vagas v ON v.id = rc.vaga_id
       LEFT JOIN usuarios u ON u.id = rc.responsavel_id
       WHERE ${where.join(' AND ')} ORDER BY rc.etapa, rc.criado_em DESC LIMIT 500`, params
    );
    return rows;
  }

  async criarCandidato(userId, data) {
    if (!data.vaga_id || !data.nome) throw new AppError('Vaga e nome obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_candidatos (vaga_id,nome,email,telefone,cpf,linkedin,curriculo_url,etapa,observacao,responsavel_id,criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [data.vaga_id, data.nome, data.email||null, data.telefone||null, data.cpf||null,
       data.linkedin||null, data.curriculo_url||null, data.etapa||'triagem',
       data.observacao||null, data.responsavel_id||userId, userId]
    );
    return { id: res.insertId };
  }

  async atualizarCandidato(id, data) {
    const allowed = ['etapa','nota','observacao','pontos_fortes','pontos_fracos','data_entrevista','responsavel_id'];
    const sets = []; const params = [];
    for (const k of allowed) { if (data[k] !== undefined) { sets.push(`${k}=?`); params.push(data[k]); } }
    if (!sets.length) return { ok: true };
    params.push(id);
    await pool.execute(`UPDATE rh_candidatos SET ${sets.join(',')} WHERE id = ?`, params);
    return { ok: true };
  }

  async excluirCandidato(id) {
    await pool.execute(`DELETE FROM rh_candidatos WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Onboarding ────────────────────────────────────────────────────────────────

  async listarOnboarding(colaborador_id) {
    const [rows] = await pool.execute(
      `SELECT o.*, u.nome AS responsavel_nome, cp.nome AS concluido_por_nome
       FROM rh_onboarding o
       LEFT JOIN usuarios u  ON u.id  = o.responsavel_id
       LEFT JOIN usuarios cp ON cp.id = o.concluido_por
       WHERE o.colaborador_id = ? ORDER BY o.categoria, o.id`, [colaborador_id]
    );
    return rows;
  }

  async criarOnboarding(userId, colaborador_id, data) {
    if (!data.etapa) throw new AppError('Etapa obrigatória', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_onboarding (colaborador_id,etapa,descricao,categoria,responsavel_id,data_limite)
       VALUES (?,?,?,?,?,?)`,
      [colaborador_id, data.etapa, data.descricao||null, data.categoria||'outros',
       data.responsavel_id||null, data.data_limite||null]
    );
    return { id: res.insertId };
  }

  async concluirOnboarding(userId, id) {
    await pool.execute(
      `UPDATE rh_onboarding SET concluido=1, concluido_em=NOW(), concluido_por=? WHERE id=?`,
      [userId, id]
    );
    return { ok: true };
  }

  async excluirOnboarding(id) {
    await pool.execute(`DELETE FROM rh_onboarding WHERE id = ?`, [id]);
    return { ok: true };
  }

  // Cria checklist padrão para novo colaborador
  async criarChecklistPadrao(userId, colaborador_id) {
    const itens = [
      { etapa: 'Assinar contrato de trabalho', categoria: 'documentacao' },
      { etapa: 'Entregar documentos pessoais (RG, CPF, CTPS)', categoria: 'documentacao' },
      { etapa: 'Foto para crachá', categoria: 'documentacao' },
      { etapa: 'Criar login no sistema', categoria: 'sistemas' },
      { etapa: 'Configurar e-mail corporativo', categoria: 'sistemas' },
      { etapa: 'Entregar crachá e uniforme', categoria: 'equipamentos' },
      { etapa: 'Entrega e assinatura de EPIs', categoria: 'equipamentos' },
      { etapa: 'Treinamento de Segurança e Higiene', categoria: 'treinamento' },
      { etapa: 'Treinamento de BPF (Boas Práticas de Fabricação)', categoria: 'treinamento' },
      { etapa: 'Apresentação ao time e tour pela planta', categoria: 'apresentacao' },
      { etapa: 'Explicação do manual de conduta', categoria: 'apresentacao' },
    ];
    for (const item of itens) {
      await pool.execute(
        `INSERT INTO rh_onboarding (colaborador_id,etapa,categoria) VALUES (?,?,?)`,
        [colaborador_id, item.etapa, item.categoria]
      );
    }
    return { ok: true, total: itens.length };
  }

  // ── ASO — Saúde Ocupacional ───────────────────────────────────────────────────

  async listarAso({ colaborador_id, vencendo_em_dias } = {}) {
    const where = ['1=1']; const params = [];
    if (colaborador_id) { where.push('a.colaborador_id = ?'); params.push(colaborador_id); }
    if (vencendo_em_dias) {
      where.push('a.data_validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
      params.push(Number(vencendo_em_dias));
    }
    const [rows] = await pool.execute(
      `SELECT a.*, c.nome_completo AS colaborador_nome, d.nome AS departamento_nome
       FROM rh_aso a
       JOIN colaboradores c ON c.id = a.colaborador_id AND c.ativo = 1
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE ${where.join(' AND ')} ORDER BY a.data_validade ASC LIMIT 500`, params
    );
    return rows;
  }

  async criarAso(userId, data) {
    if (!data.colaborador_id || !data.tipo || !data.data_exame)
      throw new AppError('Colaborador, tipo e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_aso (colaborador_id,tipo,data_exame,data_validade,resultado,restricoes,medico,crm,clinica,observacao,criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [data.colaborador_id, data.tipo, data.data_exame, data.data_validade||null,
       data.resultado||'apto', data.restricoes||null, data.medico||null, data.crm||null,
       data.clinica||null, data.observacao||null, userId]
    );
    return { id: res.insertId };
  }

  async asoVencendo(dias = 30) {
    const [rows] = await pool.execute(
      `SELECT a.*, c.nome_completo, c.departamento_id, d.nome AS departamento_nome,
              DATEDIFF(a.data_validade, CURDATE()) AS dias_restantes
       FROM rh_aso a
       JOIN colaboradores c ON c.id = a.colaborador_id AND c.ativo = 1
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE a.data_validade IS NOT NULL
         AND a.data_validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY a.data_validade ASC`, [dias]
    );
    return rows;
  }

  async asoVencidos() {
    const [rows] = await pool.execute(
      `SELECT a.*, c.nome_completo, d.nome AS departamento_nome,
              DATEDIFF(CURDATE(), a.data_validade) AS dias_vencido
       FROM rh_aso a
       JOIN colaboradores c ON c.id = a.colaborador_id AND c.ativo = 1
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE a.data_validade IS NOT NULL AND a.data_validade < CURDATE()
       ORDER BY a.data_validade ASC`
    );
    return rows;
  }

  // ── Avaliação de Desempenho ───────────────────────────────────────────────────

  async listarAvaliacoes({ colaborador_id, periodo } = {}) {
    const where = ['1=1']; const params = [];
    if (colaborador_id) { where.push('av.colaborador_id = ?'); params.push(colaborador_id); }
    if (periodo)        { where.push('av.periodo = ?');        params.push(periodo); }
    const [rows] = await pool.execute(
      `SELECT av.*, c.nome_completo AS colaborador_nome, u.nome AS avaliador_nome,
              d.nome AS departamento_nome
       FROM rh_avaliacoes av
       JOIN colaboradores c ON c.id = av.colaborador_id
       JOIN usuarios u ON u.id = av.avaliador_id
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       WHERE ${where.join(' AND ')} ORDER BY av.criado_em DESC LIMIT 300`, params
    );
    return rows;
  }

  async criarAvaliacao(userId, data) {
    if (!data.colaborador_id || !data.periodo)
      throw new AppError('Colaborador e período obrigatórios', HTTP.BAD_REQUEST);
    // Calcula nota geral como média das competências preenchidas
    const comps = ['c_produtividade','c_qualidade','c_pontualidade','c_trabalho_equipe',
                   'c_proatividade','c_comunicacao','c_lideranca','c_conhecimento'];
    const vals = comps.map(c => Number(data[c])||0).filter(v => v > 0);
    const nota = vals.length > 0 ? (vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2) : null;
    const [res] = await pool.execute(
      `INSERT INTO rh_avaliacoes
       (colaborador_id,avaliador_id,periodo,tipo,c_produtividade,c_qualidade,c_pontualidade,
        c_trabalho_equipe,c_proatividade,c_comunicacao,c_lideranca,c_conhecimento,
        nota_geral,resultado,pontos_fortes,pontos_melhoria,plano_acao,metas_proximas,promovivel)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [data.colaborador_id, userId, data.periodo, data.tipo||'gestor',
       data.c_produtividade||null, data.c_qualidade||null, data.c_pontualidade||null,
       data.c_trabalho_equipe||null, data.c_proatividade||null, data.c_comunicacao||null,
       data.c_lideranca||null, data.c_conhecimento||null, nota,
       data.resultado||null, data.pontos_fortes||null, data.pontos_melhoria||null,
       data.plano_acao||null, data.metas_proximas||null, data.promovivel?1:0]
    );
    return { id: res.insertId, nota_geral: nota };
  }

  // ── Cardápio Semanal ──────────────────────────────────────────────────────────

  async listarCardapio({ data_inicio, data_fim } = {}) {
    const hoje = new Date().toISOString().split('T')[0];
    const inicio = data_inicio || hoje;
    const fim    = data_fim   || new Date(Date.now() + 6*86400000).toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT c.*, u.nome AS criado_por_nome
       FROM rh_cardapio c
       LEFT JOIN usuarios u ON u.id = c.criado_por
       WHERE c.data_cardapio BETWEEN ? AND ?
       ORDER BY c.data_cardapio, FIELD(c.refeicao,'cafe_manha','almoco','jantar','lanche')`,
      [inicio, fim]
    );
    return rows;
  }

  async salvarCardapio(userId, data) {
    if (!data.data_cardapio || !data.refeicao)
      throw new AppError('Data e refeição obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_cardapio
       (data_cardapio,refeicao,prato_principal,acompanhamento1,acompanhamento2,salada,sobremesa,suco,observacao,calorias_aprox,criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         prato_principal=VALUES(prato_principal), acompanhamento1=VALUES(acompanhamento1),
         acompanhamento2=VALUES(acompanhamento2), salada=VALUES(salada),
         sobremesa=VALUES(sobremesa), suco=VALUES(suco),
         observacao=VALUES(observacao), calorias_aprox=VALUES(calorias_aprox)`,
      [data.data_cardapio, data.refeicao, data.prato_principal||null, data.acompanhamento1||null,
       data.acompanhamento2||null, data.salada||null, data.sobremesa||null, data.suco||null,
       data.observacao||null, data.calorias_aprox||null, userId]
    );
    return { id: res.insertId || 0 };
  }

  async excluirCardapio(id) {
    await pool.execute(`DELETE FROM rh_cardapio WHERE id = ?`, [id]);
    return { ok: true };
  }

  // ── Banco de Horas ────────────────────────────────────────────────────────────

  async listarBancoHoras({ colaborador_id } = {}) {
    const where = colaborador_id ? 'WHERE bh.colaborador_id = ?' : '';
    const params = colaborador_id ? [colaborador_id] : [];
    const [rows] = await pool.execute(
      `SELECT bh.*, c.nome_completo AS colaborador_nome, u.nome AS aprovado_por_nome
       FROM rh_banco_horas bh
       JOIN colaboradores c ON c.id = bh.colaborador_id
       LEFT JOIN usuarios u ON u.id = bh.aprovado_por
       ${where} ORDER BY bh.data_lancamento DESC LIMIT 500`, params
    );
    return rows;
  }

  async saldoBancoHoras(colaborador_id) {
    const [[{ saldo }]] = await pool.execute(
      `SELECT COALESCE(
         SUM(CASE WHEN tipo IN ('credito') THEN horas
                  WHEN tipo IN ('debito','compensacao') THEN -horas
                  ELSE horas END), 0) AS saldo
       FROM rh_banco_horas WHERE colaborador_id = ?`, [colaborador_id]
    );
    return { colaborador_id, saldo: Number(saldo).toFixed(2) };
  }

  async criarLancamentoBancoHoras(userId, data) {
    if (!data.colaborador_id || !data.tipo || !data.horas || !data.data_lancamento)
      throw new AppError('Colaborador, tipo, horas e data obrigatórios', HTTP.BAD_REQUEST);
    const [res] = await pool.execute(
      `INSERT INTO rh_banco_horas (colaborador_id,data_lancamento,tipo,horas,motivo,aprovado_por,criado_por)
       VALUES (?,?,?,?,?,?,?)`,
      [data.colaborador_id, data.data_lancamento, data.tipo,
       Math.abs(Number(data.horas)), data.motivo||null, data.aprovado_por||null, userId]
    );
    return { id: res.insertId };
  }

  // ── Relatórios de Turnover e Absenteísmo ─────────────────────────────────────

  async relatorioTurnover({ ano } = {}) {
    const y = Number(ano) || new Date().getFullYear();
    const [admissoes] = await pool.execute(
      `SELECT MONTH(data_admissao) AS mes, COUNT(*) AS total
       FROM colaboradores WHERE YEAR(data_admissao) = ? GROUP BY MONTH(data_admissao)`, [y]
    );
    const [demissoes] = await pool.execute(
      `SELECT MONTH(data_demissao) AS mes, COUNT(*) AS total
       FROM colaboradores WHERE YEAR(data_demissao) = ? GROUP BY MONTH(data_demissao)`, [y]
    );
    const [[{ total_ativos }]] = await pool.execute(
      `SELECT COUNT(*) AS total_ativos FROM colaboradores WHERE ativo = 1`
    );
    return { ano: y, admissoes, demissoes, total_ativos };
  }

  async relatorioAbsenteismo({ mes, ano } = {}) {
    const m = Number(mes) || new Date().getMonth() + 1;
    const y = Number(ano) || new Date().getFullYear();
    const [rows] = await pool.execute(
      `SELECT c.id, c.nome_completo, d.nome AS departamento_nome,
              COUNT(af.id) AS total_afastamentos,
              SUM(COALESCE(af.dias, DATEDIFF(COALESCE(af.data_fim, CURDATE()), af.data_inicio)+1)) AS dias_afastados
       FROM colaboradores c
       LEFT JOIN departamentos d ON d.id = c.departamento_id
       LEFT JOIN rh_afastamentos af ON af.colaborador_id = c.id
         AND MONTH(af.data_inicio) = ? AND YEAR(af.data_inicio) = ?
       WHERE c.ativo = 1
       GROUP BY c.id, c.nome_completo, d.nome
       ORDER BY dias_afastados DESC, c.nome_completo LIMIT 200`, [m, y]
    );
    const [[{ total_dias }]] = await pool.execute(
      `SELECT SUM(COALESCE(dias, DATEDIFF(COALESCE(data_fim,CURDATE()),data_inicio)+1)) AS total_dias
       FROM rh_afastamentos WHERE MONTH(data_inicio)=? AND YEAR(data_inicio)=?`, [m, y]
    );
    return { mes: m, ano: y, rows, total_dias: total_dias || 0 };
  }

  // ── Ficha completa do colaborador ─────────────────────────────────────────────

  async fichaCompleta(id) {
    const row = await this.buscarColaborador(id);
    const [saude, cnh, contatos, dependentes, beneficios, historico, afastamentos, advertencias] = await Promise.all([
      this.listarSaude(id),
      this.buscarCnh(id),
      this.listarContatosEmergencia(id),
      this.listarDependentes(id),
      this.listarBeneficios(id),
      this.listarHistoricoSalarial(id),
      this.listarAfastamentos({ colaborador_id: id }),
      this.listarAdvertencias({ colaborador_id: id }),
    ]);
    return { ...row, saude, cnh, contatos_emergencia: contatos, dependentes, beneficios, historico_salarial: historico, afastamentos, advertencias };
  }
}

module.exports = new RhService();
