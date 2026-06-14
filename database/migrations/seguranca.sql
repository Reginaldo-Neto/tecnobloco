-- ============================================
-- MÓDULO: Segurança do Trabalho
-- ============================================

CREATE TABLE IF NOT EXISTS seg_cats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_cat VARCHAR(20) NOT NULL UNIQUE,
  colaborador_id INT NOT NULL,
  data_acidente DATE NOT NULL,
  hora_acidente TIME,
  local_acidente VARCHAR(200),
  descricao TEXT NOT NULL,
  parte_corpo_atingida VARCHAR(100),
  tipo_lesao VARCHAR(100),
  afastamento_dias INT DEFAULT 0,
  cid VARCHAR(10),
  status ENUM('aberta','enviada','encerrada') DEFAULT 'aberta',
  observacao TEXT,
  registrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id)  REFERENCES colaboradores(id),
  FOREIGN KEY (registrado_por)  REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS seg_inspecoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  departamento_id INT NOT NULL,
  responsavel_id INT NOT NULL,
  data_inspecao DATE NOT NULL,
  tipo VARCHAR(50) DEFAULT 'geral',
  itens_conformes JSON,
  itens_nao_conformes JSON,
  observacao TEXT,
  observacao_aprovacao TEXT,
  status ENUM('pendente','aprovada','reprovada') DEFAULT 'pendente',
  aprovado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (responsavel_id)  REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por)    REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS seg_treinamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  data_realizacao DATE NOT NULL,
  carga_horaria DECIMAL(5,1),
  local_realizacao VARCHAR(200),
  participantes JSON,
  observacao TEXT,
  ministrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ministrado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS seg_escalas (
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
