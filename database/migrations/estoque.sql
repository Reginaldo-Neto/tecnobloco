-- ============================================================
-- ESTOQUE — tabelas extras (execute uma vez)
-- ============================================================

CREATE TABLE IF NOT EXISTS est_inventarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  descricao VARCHAR(200),
  data_inicio DATE NOT NULL,
  data_conclusao DATE,
  status ENUM('em_andamento','concluido','cancelado') DEFAULT 'em_andamento',
  responsavel_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS est_inventarios_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventario_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade_sistema DECIMAL(12,3),
  quantidade_contada DECIMAL(12,3),
  diferenca DECIMAL(12,3) GENERATED ALWAYS AS (quantidade_contada - quantidade_sistema) STORED,
  usuario_id INT,
  observacao TEXT,
  FOREIGN KEY (inventario_id) REFERENCES est_inventarios(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY uq_inv_prod (inventario_id, produto_id)
);

CREATE TABLE IF NOT EXISTS est_bloqueios_lote (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  lote VARCHAR(50) NOT NULL,
  motivo TEXT NOT NULL,
  status ENUM('bloqueado','liberado','descartado') DEFAULT 'bloqueado',
  bloqueado_por INT,
  liberado_por INT,
  data_bloqueio DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_liberacao DATETIME,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (bloqueado_por) REFERENCES usuarios(id),
  FOREIGN KEY (liberado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS est_escalas (
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
