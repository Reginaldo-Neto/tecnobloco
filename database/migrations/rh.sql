-- ============================================================
-- RH Module — New tables migration
-- Only tables NOT already in schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS rh_escalas (
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
