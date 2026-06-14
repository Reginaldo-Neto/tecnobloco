-- ============================================
-- MÓDULO: Vendas
-- ============================================

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cpf_cnpj VARCHAR(20) UNIQUE,
  tipo ENUM('PF','PJ') DEFAULT 'PJ',
  telefone VARCHAR(20),
  email VARCHAR(150),
  endereco TEXT,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vnd_pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  cliente_id INT,
  vendedor_id INT,
  status ENUM('rascunho','pendente','aprovado','em_separacao','expedido','faturado','cancelado') DEFAULT 'rascunho',
  valor_total DECIMAL(12,2) DEFAULT 0,
  data_entrega_prevista DATE,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id)  REFERENCES clientes(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS vnd_pedidos_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT,
  descricao VARCHAR(300),
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  unidade VARCHAR(10) DEFAULT 'UN',
  valor_unitario DECIMAL(12,2) DEFAULT 0,
  valor_total DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (pedido_id)  REFERENCES vnd_pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE IF NOT EXISTS vnd_escalas (
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
