-- ============================================
-- MÓDULO: Frota
-- ============================================

CREATE TABLE IF NOT EXISTS fro_abastecimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  data_abastecimento DATE NOT NULL,
  litros DECIMAL(8,2) NOT NULL,
  valor_total DECIMAL(10,2),
  km_atual INT,
  tipo_combustivel VARCHAR(30),
  posto VARCHAR(100),
  abastecido_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id)      REFERENCES veiculos(id),
  FOREIGN KEY (abastecido_por)  REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fro_manutencoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  tipo ENUM('preventiva','corretiva','preditiva') DEFAULT 'corretiva',
  descricao TEXT NOT NULL,
  valor_estimado DECIMAL(10,2),
  valor_real DECIMAL(10,2),
  km_atual INT,
  fornecedor VARCHAR(150),
  status ENUM('pendente','em_andamento','concluida','cancelada') DEFAULT 'pendente',
  data_conclusao DATE,
  observacao TEXT,
  solicitado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id)     REFERENCES veiculos(id),
  FOREIGN KEY (solicitado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fro_multas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  motorista_id INT,
  data_infracao DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2),
  pontos TINYINT,
  status_pagamento ENUM('pendente','pago','contestado') DEFAULT 'pendente',
  registrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id)    REFERENCES veiculos(id),
  FOREIGN KEY (motorista_id)  REFERENCES usuarios(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fro_checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('pre_viagem','pos_viagem','mensal') DEFAULT 'pre_viagem',
  itens_ok JSON,
  itens_nok JSON,
  km_atual INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fro_escalas (
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
