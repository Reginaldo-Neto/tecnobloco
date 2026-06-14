-- ── Financeiro: novas tabelas ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fin_centros_custo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  departamento_id INT,
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS fin_movimentos_bancarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(300) NOT NULL,
  tipo ENUM('credito','debito') NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_movimento DATE NOT NULL,
  conta_id INT,
  referencia VARCHAR(100),
  conciliado TINYINT(1) DEFAULT 0,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES plano_contas(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fin_escalas (
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
