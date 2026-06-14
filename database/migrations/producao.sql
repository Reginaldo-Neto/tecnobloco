-- ============================================================
-- Módulo Produção — tabelas auxiliares
-- Executar após schema.sql (tabelas base já existem)
-- ============================================================

CREATE TABLE IF NOT EXISTS pro_apontamentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ordem_producao_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('inicio','pausa','retomada','conclusao','apontamento') DEFAULT 'apontamento',
  quantidade_produzida DECIMAL(12,3),
  quantidade_perdida DECIMAL(12,3) DEFAULT 0,
  motivo_parada VARCHAR(200),
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ordem_producao_id) REFERENCES ordens_producao(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_apt_op (ordem_producao_id)
);

CREATE TABLE IF NOT EXISTS pro_controle_temperaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipamento_id INT,
  equipamento_descricao VARCHAR(200),
  temperatura DECIMAL(5,2) NOT NULL,
  umidade DECIMAL(5,2),
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  conforme TINYINT(1) DEFAULT 1,
  observacao TEXT,
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_temp_data (data_hora)
);

CREATE TABLE IF NOT EXISTS pro_higienizacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipamento_id INT,
  equipamento_descricao VARCHAR(200),
  tipo ENUM('CIP','COP','manual') DEFAULT 'CIP',
  inicio DATETIME NOT NULL,
  fim DATETIME,
  realizado_por INT,
  aprovado_por INT,
  conforme TINYINT(1) DEFAULT 1,
  observacao TEXT,
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id),
  FOREIGN KEY (realizado_por) REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS pro_perdas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT,
  ordem_producao_id INT,
  quantidade DECIMAL(12,3) NOT NULL,
  unidade VARCHAR(20) DEFAULT 'L',
  motivo ENUM('derramamento','contaminacao','quebra','vencimento','processo','outro') NOT NULL,
  descricao TEXT,
  data_perda DATE NOT NULL,
  registrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (ordem_producao_id) REFERENCES ordens_producao(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS pro_escalas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  nome_externo VARCHAR(150),
  turno ENUM('manha','tarde','noite','integral') NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);
