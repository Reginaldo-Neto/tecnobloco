-- ============================================================
-- RH — Ficha Completa de Colaboradores
-- Novas tabelas e colunas para ficha cadastral completa
-- ============================================================

-- ── Novos campos na tabela colaboradores ─────────────────────
ALTER TABLE colaboradores
  -- Dados pessoais estendidos
  ADD COLUMN nome_social          VARCHAR(150)  NULL,
  ADD COLUMN nacionalidade        VARCHAR(80)   NULL DEFAULT 'Brasileira',
  ADD COLUMN naturalidade_cidade  VARCHAR(100)  NULL,
  ADD COLUMN naturalidade_uf      CHAR(2)       NULL,
  ADD COLUMN nome_mae             VARCHAR(150)  NULL,
  ADD COLUMN nome_pai             VARCHAR(150)  NULL,
  ADD COLUMN raca_cor             ENUM('branca','preta','parda','amarela','indigena','nao_declarado') NULL,
  ADD COLUMN telefone2            VARCHAR(20)   NULL,
  ADD COLUMN email_corporativo    VARCHAR(150)  NULL,
  ADD COLUMN ramal                VARCHAR(20)   NULL,

  -- Documentos
  ADD COLUMN ctps_numero          VARCHAR(30)   NULL,
  ADD COLUMN ctps_serie           VARCHAR(10)   NULL,
  ADD COLUMN ctps_uf              CHAR(2)       NULL,
  ADD COLUMN pis_pasep            VARCHAR(20)   NULL,
  ADD COLUMN titulo_eleitor       VARCHAR(20)   NULL,
  ADD COLUMN zona_eleitoral       VARCHAR(10)   NULL,
  ADD COLUMN secao_eleitoral      VARCHAR(10)   NULL,
  ADD COLUMN reservista           VARCHAR(30)   NULL,
  ADD COLUMN passaporte           VARCHAR(20)   NULL,
  ADD COLUMN passaporte_validade  DATE          NULL,

  -- Contrato / cargo
  ADD COLUMN matricula            VARCHAR(30)   NULL,
  ADD COLUMN turno                ENUM('manha','tarde','noite','integral') NULL,
  ADD COLUMN data_experiencia1    DATE          NULL COMMENT 'Fim do 1° período de experiência (45 dias)',
  ADD COLUMN data_experiencia2    DATE          NULL COMMENT 'Fim do 2° período de experiência (90 dias)',
  ADD COLUMN banco                VARCHAR(100)  NULL,
  ADD COLUMN banco_agencia        VARCHAR(20)   NULL,
  ADD COLUMN banco_conta          VARCHAR(30)   NULL,
  ADD COLUMN banco_tipo_conta     ENUM('corrente','poupanca') NULL,
  ADD COLUMN banco_pix            VARCHAR(150)  NULL,

  -- Sindicato
  ADD COLUMN sindicato_nome       VARCHAR(150)  NULL,
  ADD COLUMN sindicato_contribui  TINYINT(1)    NULL DEFAULT 0,

  -- Saúde (resumo — detalhes na tabela rh_saude)
  ADD COLUMN tipo_sanguineo       ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
  ADD COLUMN deficiencia          TINYINT(1)    NULL DEFAULT 0,
  ADD COLUMN deficiencia_tipo     VARCHAR(200)  NULL,
  ADD COLUMN convenio_saude       VARCHAR(150)  NULL,
  ADD COLUMN convenio_numero      VARCHAR(50)   NULL,
  ADD COLUMN convenio_plano       VARCHAR(100)  NULL,
  ADD COLUMN convenio_odonto      VARCHAR(150)  NULL;

-- ── Saúde e alergias ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_saude (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  tipo            ENUM('alergia','medicamento_continuo','doenca_cronica','cirurgia','restricao_alimentar','vacina','outros') NOT NULL,
  descricao       TEXT NOT NULL,
  gravidade       ENUM('leve','moderada','grave') NULL,
  observacao      TEXT NULL,
  criado_por      INT NULL,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- ── CNH ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_cnh (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL UNIQUE,
  numero          VARCHAR(20)   NOT NULL,
  categoria       VARCHAR(10)   NOT NULL COMMENT 'A, B, C, D, E, AB, etc.',
  data_emissao    DATE          NULL,
  data_validade   DATE          NULL,
  uf_emissao      CHAR(2)       NULL,
  observacao      TEXT          NULL,
  atualizado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  atualizado_por  INT           NULL,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)
);

-- ── Contatos de emergência ────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_contatos_emergencia (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  nome            VARCHAR(150)  NOT NULL,
  grau_parentesco VARCHAR(50)   NOT NULL,
  telefone        VARCHAR(20)   NOT NULL,
  telefone2       VARCHAR(20)   NULL,
  email           VARCHAR(150)  NULL,
  endereco        VARCHAR(255)  NULL,
  prioridade      TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '1 = contato primário',
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);

-- ── Dependentes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_dependentes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  nome            VARCHAR(150)  NOT NULL,
  grau_parentesco VARCHAR(50)   NOT NULL,
  data_nascimento DATE          NULL,
  cpf             VARCHAR(14)   NULL,
  ir              TINYINT(1)    DEFAULT 0 COMMENT 'Dedução de IR',
  plano_saude     TINYINT(1)    DEFAULT 0,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);

-- ── Benefícios dos colaboradores ─────────────────────────────
CREATE TABLE IF NOT EXISTS rh_beneficios_colaborador (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  tipo            ENUM('vale_transporte','vale_refeicao','vale_alimentacao','plano_saude','plano_odonto','seguro_vida','cesta_basica','outros') NOT NULL,
  valor           DECIMAL(10,2) NULL,
  descricao       VARCHAR(200)  NULL,
  data_inicio     DATE          NOT NULL,
  data_fim        DATE          NULL,
  ativo           TINYINT(1)    DEFAULT 1,
  criado_por      INT           NULL,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- ── Histórico salarial ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_historico_salarial (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  salario         DECIMAL(10,2) NOT NULL,
  motivo          ENUM('admissao','reajuste_anual','promocao','enquadramento','outros') NOT NULL,
  data_vigencia   DATE          NOT NULL,
  observacao      TEXT          NULL,
  registrado_por  INT           NULL,
  criado_em       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- ── Afastamentos (atestados, licenças) ───────────────────────
CREATE TABLE IF NOT EXISTS rh_afastamentos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  tipo            ENUM('atestado_medico','licenca_maternidade','licenca_paternidade','acidente_trabalho','doenca','outros') NOT NULL,
  data_inicio     DATE          NOT NULL,
  data_fim        DATE          NULL,
  dias            INT           NULL,
  cid             VARCHAR(10)   NULL,
  medico          VARCHAR(100)  NULL,
  crm             VARCHAR(20)   NULL,
  observacao      TEXT          NULL,
  arquivo_url     VARCHAR(500)  NULL,
  status          ENUM('pendente','validado','rejeitado') DEFAULT 'pendente',
  validado_por    INT           NULL,
  criado_por      INT           NULL,
  criado_em       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (validado_por) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- ── Advertências e ocorrências ────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_advertencias (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  tipo            ENUM('verbal','escrita','suspensao','justa_causa') NOT NULL,
  motivo          TEXT          NOT NULL,
  data_ocorrencia DATE          NOT NULL,
  dias_suspensao  INT           NULL,
  testemunha1     VARCHAR(150)  NULL,
  testemunha2     VARCHAR(150)  NULL,
  colaborador_ciente TINYINT(1) DEFAULT 0,
  observacao      TEXT          NULL,
  arquivo_url     VARCHAR(500)  NULL,
  registrado_por  INT           NULL,
  criado_em       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- ── Movimentações de pessoal ─────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_movimentacoes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id  INT NOT NULL,
  tipo            ENUM('promocao','transferencia','rebaixamento','mudanca_turno','mudanca_cargo','mudanca_departamento') NOT NULL,
  descricao       TEXT          NOT NULL,
  depto_anterior  INT           NULL,
  depto_novo      INT           NULL,
  cargo_anterior  INT           NULL,
  cargo_novo      INT           NULL,
  data_vigencia   DATE          NOT NULL,
  aprovado_por    INT           NULL,
  criado_em       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id)
);
