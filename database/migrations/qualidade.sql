-- ============================================================
-- Módulo Qualidade — tabelas auxiliares
-- Executar após schema.sql (tabelas base já existem)
-- ============================================================

CREATE TABLE IF NOT EXISTS qua_analises_leite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_analise DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numero_tanque VARCHAR(50),
  lote VARCHAR(50),
  temperatura DECIMAL(5,2),
  alizarol ENUM('negativo','positivo') NOT NULL DEFAULT 'negativo',
  acidez DECIMAL(5,2) COMMENT 'Dornic',
  densidade DECIMAL(8,4),
  gordura DECIMAL(5,2),
  cbt INT COMMENT 'Contagem Bacteriana Total x1000',
  ccs INT COMMENT 'Contagem de Células Somáticas x1000',
  resultado ENUM('aprovado','reprovado','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id),
  INDEX idx_analise_data (data_analise)
);

CREATE TABLE IF NOT EXISTS qua_nao_conformidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,
  tipo ENUM('interna','externa','fornecedor','processo') NOT NULL,
  setor_origem_id INT,
  descricao TEXT NOT NULL,
  causa_raiz TEXT,
  acao_corretiva TEXT,
  acao_preventiva TEXT,
  produto_id INT,
  lote VARCHAR(50),
  data_ocorrencia DATE NOT NULL,
  data_prazo DATE,
  data_encerramento DATE,
  status ENUM('aberta','em_investigacao','acao_pendente','verificacao','encerrada') DEFAULT 'aberta',
  responsavel_id INT,
  aberto_por INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (setor_origem_id) REFERENCES departamentos(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  FOREIGN KEY (aberto_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS qua_monitoramento_ambiental (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_coleta DATE NOT NULL,
  ponto_coleta VARCHAR(200) NOT NULL,
  tipo ENUM('swab_superficie','ar','agua') NOT NULL,
  resultado ENUM('conforme','nao_conforme','pendente') DEFAULT 'pendente',
  micro_detectado VARCHAR(200),
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS qua_controle_aguas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_coleta DATE NOT NULL,
  ponto_coleta VARCHAR(150) NOT NULL,
  tipo ENUM('processo','lavagem','consumo','efluente') DEFAULT 'processo',
  ph DECIMAL(5,2),
  cloro DECIMAL(5,2),
  turbidez DECIMAL(5,2),
  coliformes ENUM('ausente','presente') DEFAULT 'ausente',
  resultado ENUM('conforme','nao_conforme','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS qua_escalas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  nome_externo VARCHAR(150),
  turno ENUM('manha','tarde','noite','integral','plantao') NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- ── f02: Análises Físico-Químicas ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_analises_fq (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_analise DATE NOT NULL,
  produto_id INT,
  lote VARCHAR(50),
  acidez DECIMAL(5,2),
  gordura DECIMAL(5,2),
  proteina DECIMAL(5,2),
  umidade DECIMAL(5,2),
  ph DECIMAL(5,2),
  aw DECIMAL(5,3) COMMENT 'Atividade de água',
  sal DECIMAL(5,2),
  resultado ENUM('aprovado','reprovado','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (analista_id) REFERENCES usuarios(id),
  INDEX idx_fq_data (data_analise)
);

-- ── f03: Análises Microbiológicas ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_analises_micro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_analise DATE NOT NULL,
  produto_id INT,
  lote VARCHAR(50),
  coliformes_totais VARCHAR(30),
  coliformes_termotolerantes VARCHAR(30),
  estafilococos VARCHAR(30),
  salmonella ENUM('ausente','presente') DEFAULT 'ausente',
  listeria ENUM('ausente','presente') DEFAULT 'ausente',
  contagem_aerobios VARCHAR(30),
  bolores_leveduras VARCHAR(30),
  resultado ENUM('aprovado','reprovado','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (analista_id) REFERENCES usuarios(id),
  INDEX idx_micro_data (data_analise)
);

-- ── f04: Monitoramento de Antibióticos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_antibioticos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_analise DATE NOT NULL,
  numero_tanque VARCHAR(50),
  lote VARCHAR(50),
  metodo VARCHAR(100),
  kit_utilizado VARCHAR(100),
  resultado ENUM('negativo','positivo','inconclusivo') DEFAULT 'negativo',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id),
  INDEX idx_antibiotic_data (data_analise)
);

-- ── f05: Liberação de Lotes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_liberacao_lotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lote VARCHAR(50) NOT NULL,
  produto_id INT,
  data_producao DATE,
  status ENUM('bloqueado','liberado','destruido','reprocesso') DEFAULT 'bloqueado',
  motivo_bloqueio TEXT,
  responsavel_id INT,
  data_decisao DATETIME,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  INDEX idx_lib_lote (lote)
);

-- ── f07: Análise Sensorial ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_analises_sensoriais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_analise DATE NOT NULL,
  produto_id INT,
  lote VARCHAR(50),
  aparencia ENUM('conforme','nao_conforme') DEFAULT 'conforme',
  cor ENUM('conforme','nao_conforme') DEFAULT 'conforme',
  aroma ENUM('conforme','nao_conforme') DEFAULT 'conforme',
  textura ENUM('conforme','nao_conforme') DEFAULT 'conforme',
  sabor ENUM('conforme','nao_conforme') DEFAULT 'conforme',
  resultado ENUM('aprovado','reprovado','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (analista_id) REFERENCES usuarios(id)
);

-- ── f08: Controle de Shelf-Life ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_shelf_life (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  lote VARCHAR(50),
  data_fabricacao DATE NOT NULL,
  data_validade DATE NOT NULL,
  status ENUM('vigente','vencido','descartado') DEFAULT 'vigente',
  temperatura_armazenagem DECIMAL(5,2),
  local_armazenagem VARCHAR(100),
  responsavel_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  INDEX idx_sl_validade (data_validade)
);

-- ── f10: Amostras de Retenção ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_amostras_retencao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT,
  lote VARCHAR(50) NOT NULL,
  data_coleta DATE NOT NULL,
  quantidade DECIMAL(10,3),
  unidade VARCHAR(20) DEFAULT 'g',
  localizacao VARCHAR(100),
  data_validade DATE,
  status ENUM('ativa','utilizada','descartada','vencida') DEFAULT 'ativa',
  motivo_uso TEXT,
  responsavel_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- ── f13: Controle de Pragas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_controle_pragas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_visita DATE NOT NULL,
  empresa_terceirizada VARCHAR(150),
  responsavel_tecnico VARCHAR(150),
  tipo_servico ENUM('monitoramento','desinsetizacao','desratizacao','descupinizacao','outros') DEFAULT 'monitoramento',
  areas_atendidas TEXT,
  pragas_detectadas TEXT,
  produtos_utilizados TEXT,
  resultado ENUM('eficaz','parcialmente_eficaz','ineficaz','pendente') DEFAULT 'pendente',
  proxima_visita DATE,
  registrado_por INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_pragas_data (data_visita)
);

-- ── f14: Estoque de Reagentes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_reagentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  fabricante VARCHAR(100),
  lote_fabricante VARCHAR(50),
  data_validade DATE,
  unidade VARCHAR(20) DEFAULT 'mL',
  saldo_atual DECIMAL(10,3) DEFAULT 0,
  estoque_minimo DECIMAL(10,3) DEFAULT 0,
  localizacao VARCHAR(100),
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qua_reagentes_movimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reagente_id INT NOT NULL,
  tipo ENUM('entrada','saida') NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL,
  motivo VARCHAR(200),
  responsavel_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reagente_id) REFERENCES qua_reagentes(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- ── f15: Calibração de Equipamentos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_calibracoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipamento VARCHAR(200) NOT NULL,
  numero_patrimonio VARCHAR(50),
  data_calibracao DATE NOT NULL,
  proxima_calibracao DATE,
  empresa_calibradora VARCHAR(150),
  certificado VARCHAR(100),
  resultado ENUM('aprovado','reprovado','condicional') DEFAULT 'aprovado',
  responsavel_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  INDEX idx_cal_proxima (proxima_calibracao)
);

-- ── f17/f18: Reanálises ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_reanalises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('recepcao','fq','micro','laudo','sensorial') NOT NULL DEFAULT 'recepcao',
  referencia_id INT COMMENT 'ID do registro original',
  lote VARCHAR(50),
  motivo TEXT NOT NULL,
  status ENUM('pendente','em_andamento','concluida','indeferida') DEFAULT 'pendente',
  resultado_reanalise TEXT,
  solicitante_id INT NOT NULL,
  responsavel_id INT,
  data_solicitacao DATE NOT NULL,
  data_resposta DATE,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- ── f19: Estocagem de MP ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_estocagem_mp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('entrada','saida') NOT NULL,
  produto_id INT,
  lote VARCHAR(50),
  quantidade DECIMAL(10,3) NOT NULL,
  unidade VARCHAR(20) DEFAULT 'kg',
  temperatura DECIMAL(5,2),
  local_armazenagem VARCHAR(100),
  fornecedor VARCHAR(150),
  nota_fiscal VARCHAR(50),
  responsavel_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  INDEX idx_estmp_tipo (tipo)
);

-- ── f20: Visitas Fiscais ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_visitas_fiscais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_visita DATE NOT NULL,
  orgao ENUM('SIF','MAPA','ANVISA','VIGILANCIA_SANITARIA','OUTROS') NOT NULL DEFAULT 'SIF',
  fiscal_nome VARCHAR(150),
  fiscal_matricula VARCHAR(50),
  tipo ENUM('rotina','especial','reinspecao','intimacao','embargo') DEFAULT 'rotina',
  areas_inspecionadas TEXT,
  exigencias TEXT,
  prazo_cumprimento DATE,
  auto_infracao VARCHAR(50),
  status ENUM('pendente','em_atendimento','cumprido','recurso') DEFAULT 'pendente',
  registrado_por INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_vf_data (data_visita)
);

-- ── f21: Carga Spot ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qua_cargas_spot (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_chegada DATETIME NOT NULL,
  produtor_nome VARCHAR(150),
  placa_veiculo VARCHAR(20),
  volume_litros DECIMAL(10,2),
  temperatura DECIMAL(5,2),
  alizarol ENUM('negativo','positivo') DEFAULT 'negativo',
  acidez DECIMAL(5,2),
  resultado ENUM('aprovado','reprovado','pendente') DEFAULT 'pendente',
  motivo_rejeicao TEXT,
  responsavel_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);
