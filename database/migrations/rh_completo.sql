-- ============================================================
-- RH Módulo Completo — Novas tabelas para funções expandidas
-- Execute APÓS rh.sql e rh_ficha_completa.sql
-- ============================================================

-- ── Recrutamento: Vagas ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_vagas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(200)  NOT NULL,
  departamento_id   INT           NULL,
  cargo_id          INT           NULL,
  descricao         TEXT          NULL,
  requisitos        TEXT          NULL,
  diferenciais      TEXT          NULL,
  salario_min       DECIMAL(10,2) NULL,
  salario_max       DECIMAL(10,2) NULL,
  tipo_contrato     ENUM('clt','pj','estagio','temporario','aprendiz') DEFAULT 'clt',
  modalidade        ENUM('presencial','hibrido','remoto') DEFAULT 'presencial',
  vagas_qtd         INT           NOT NULL DEFAULT 1,
  status            ENUM('aberta','pausada','encerrada') DEFAULT 'aberta',
  prioridade        ENUM('normal','alta','urgente') DEFAULT 'normal',
  data_limite       DATE          NULL,
  criado_por        INT           NULL,
  criado_em         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  encerrada_em      TIMESTAMP     NULL,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (cargo_id)        REFERENCES cargos(id),
  FOREIGN KEY (criado_por)      REFERENCES usuarios(id)
);

-- ── Recrutamento: Candidatos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_candidatos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  vaga_id          INT           NOT NULL,
  nome             VARCHAR(200)  NOT NULL,
  email            VARCHAR(150)  NULL,
  telefone         VARCHAR(20)   NULL,
  cpf              VARCHAR(14)   NULL,
  linkedin         VARCHAR(300)  NULL,
  curriculo_url    VARCHAR(500)  NULL,
  etapa            ENUM('triagem','entrevista_rh','teste_tecnico','entrevista_gestor','proposta','aprovado','reprovado') DEFAULT 'triagem',
  nota             DECIMAL(4,2)  NULL COMMENT '0-10',
  observacao       TEXT          NULL,
  pontos_fortes    TEXT          NULL,
  pontos_fracos    TEXT          NULL,
  data_entrevista  DATETIME      NULL,
  responsavel_id   INT           NULL,
  criado_por       INT           NULL,
  criado_em        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vaga_id)          REFERENCES rh_vagas(id) ON DELETE CASCADE,
  FOREIGN KEY (responsavel_id)   REFERENCES usuarios(id),
  FOREIGN KEY (criado_por)       REFERENCES usuarios(id)
);

-- ── Onboarding: Checklist de Integração ──────────────────────
CREATE TABLE IF NOT EXISTS rh_onboarding (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id   INT           NOT NULL,
  etapa            VARCHAR(200)  NOT NULL,
  descricao        TEXT          NULL,
  categoria        ENUM('documentacao','sistemas','equipamentos','treinamento','apresentacao','outros') DEFAULT 'outros',
  responsavel_id   INT           NULL,
  concluido        TINYINT(1)    DEFAULT 0,
  data_limite      DATE          NULL,
  concluido_em     TIMESTAMP     NULL,
  concluido_por    INT           NULL,
  criado_em        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id)  REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (responsavel_id)  REFERENCES usuarios(id),
  FOREIGN KEY (concluido_por)   REFERENCES usuarios(id)
);

-- ── Saúde Ocupacional: ASO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_aso (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id   INT           NOT NULL,
  tipo             ENUM('admissional','periodico','retorno_trabalho','mudanca_funcao','demissional') NOT NULL,
  data_exame       DATE          NOT NULL,
  data_validade    DATE          NULL,
  resultado        ENUM('apto','apto_restricoes','inapto') DEFAULT 'apto',
  restricoes       TEXT          NULL,
  medico           VARCHAR(150)  NULL,
  crm              VARCHAR(20)   NULL,
  clinica          VARCHAR(200)  NULL,
  observacao       TEXT          NULL,
  arquivo_url      VARCHAR(500)  NULL,
  criado_por       INT           NULL,
  criado_em        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id)  REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (criado_por)      REFERENCES usuarios(id)
);

-- ── Avaliação de Desempenho ───────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_avaliacoes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id    INT           NOT NULL,
  avaliador_id      INT           NOT NULL,
  periodo           VARCHAR(20)   NOT NULL COMMENT 'ex: 2025-T1, 2025-SEM1',
  tipo              ENUM('auto_avaliacao','gestor','360','periodo_experiencia') DEFAULT 'gestor',
  -- Competências (1=Muito Abaixo … 5=Excelente)
  c_produtividade   TINYINT       NULL,
  c_qualidade       TINYINT       NULL,
  c_pontualidade    TINYINT       NULL,
  c_trabalho_equipe TINYINT       NULL,
  c_proatividade    TINYINT       NULL,
  c_comunicacao     TINYINT       NULL,
  c_lideranca       TINYINT       NULL,
  c_conhecimento    TINYINT       NULL,
  nota_geral        DECIMAL(4,2)  NULL COMMENT 'calculado automaticamente',
  resultado         ENUM('insatisfatorio','precisa_melhorar','satisfatorio','bom','excelente') NULL,
  pontos_fortes     TEXT          NULL,
  pontos_melhoria   TEXT          NULL,
  plano_acao        TEXT          NULL,
  metas_proximas    TEXT          NULL,
  promovivel        TINYINT(1)    DEFAULT 0,
  criado_em         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (avaliador_id)   REFERENCES usuarios(id)
);

-- ── Cardápio Semanal do Refeitório ────────────────────────────
CREATE TABLE IF NOT EXISTS rh_cardapio (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  data_cardapio    DATE          NOT NULL,
  refeicao         ENUM('cafe_manha','almoco','jantar','lanche') NOT NULL,
  prato_principal  VARCHAR(300)  NULL,
  acompanhamento1  VARCHAR(200)  NULL,
  acompanhamento2  VARCHAR(200)  NULL,
  salada           VARCHAR(200)  NULL,
  sobremesa        VARCHAR(150)  NULL,
  suco             VARCHAR(100)  NULL,
  observacao       VARCHAR(300)  NULL,
  calorias_aprox   INT           NULL,
  criado_por       INT           NULL,
  atualizado_em    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_data_refeicao (data_cardapio, refeicao),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- ── Banco de Horas ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rh_banco_horas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id   INT           NOT NULL,
  data_lancamento  DATE          NOT NULL,
  tipo             ENUM('credito','debito','ajuste','compensacao') NOT NULL,
  horas            DECIMAL(5,2)  NOT NULL COMMENT 'valor positivo sempre; sinal definido por tipo',
  motivo           VARCHAR(300)  NULL,
  aprovado_por     INT           NULL,
  criado_por       INT           NULL,
  criado_em        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (aprovado_por)   REFERENCES usuarios(id),
  FOREIGN KEY (criado_por)     REFERENCES usuarios(id)
);
