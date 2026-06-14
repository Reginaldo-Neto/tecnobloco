-- ============================================
-- MÓDULO: Jurídico / Compliance
-- ============================================

CREATE TABLE IF NOT EXISTS jur_contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  parte_contratada VARCHAR(200),
  objeto TEXT,
  valor DECIMAL(14,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  arquivo_url VARCHAR(500),
  status ENUM('vigente','encerrado','suspenso','em_renovacao') DEFAULT 'vigente',
  observacao TEXT,
  responsavel_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS jur_processos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_processo VARCHAR(30) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  vara VARCHAR(150),
  tribunal VARCHAR(150),
  parte_contraria VARCHAR(200),
  advogado VARCHAR(150),
  descricao TEXT,
  valor_causa DECIMAL(14,2),
  status ENUM('em_andamento','aguardando_decisao','encerrado','arquivado') DEFAULT 'em_andamento',
  resultado TEXT,
  data_encerramento DATE,
  responsavel_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS jur_prazos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_prazo DATE NOT NULL,
  tipo VARCHAR(80) DEFAULT 'prazo_judicial',
  prioridade ENUM('baixa','normal','alta','critica') DEFAULT 'normal',
  processo_id INT,
  contrato_id INT,
  status ENUM('pendente','cumprido','vencido') DEFAULT 'pendente',
  observacao TEXT,
  responsavel_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (processo_id)    REFERENCES jur_processos(id),
  FOREIGN KEY (contrato_id)    REFERENCES jur_contratos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS jur_escalas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  nome_externo VARCHAR(150),
  turno ENUM('manha','tarde','noite','integral') NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dias_semana VARCHAR(20) DEFAULT '1,2,3,4,5',
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);
