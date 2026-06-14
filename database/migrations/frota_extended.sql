-- ============================================================
-- MÓDULO: Frota — Tabelas estendidas (28 funções completas)
-- ============================================================

-- f04: Motoristas e CNH
CREATE TABLE IF NOT EXISTS fro_motoristas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  nome VARCHAR(150) NOT NULL,
  cpf VARCHAR(14),
  cnh_numero VARCHAR(20),
  cnh_categoria VARCHAR(5),
  cnh_validade DATE,
  cnh_primeira_habilitacao DATE,
  toxicologico_validade DATE,
  aso_validade DATE,
  status ENUM('ativo','inativo','suspenso') DEFAULT 'ativo',
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f05/f08: Rotas (coleta e entrega)
CREATE TABLE IF NOT EXISTS fro_rotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('coleta','entrega') NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  pontos JSON,
  km_total DECIMAL(8,2),
  tempo_estimado_min INT,
  veiculo_padrao_id INT,
  motorista_padrao_id INT,
  status ENUM('ativa','inativa') DEFAULT 'ativa',
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_padrao_id) REFERENCES veiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f09: Solicitações de uso de veículo (entre setores)
CREATE TABLE IF NOT EXISTS fro_solicitacoes_uso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  departamento_origem VARCHAR(100),
  veiculo_solicitado_id INT,
  veiculo_atendido_id INT,
  data_solicitacao DATE NOT NULL,
  data_necessidade DATE NOT NULL,
  hora_saida TIME,
  hora_retorno TIME,
  destino VARCHAR(200) NOT NULL,
  motivo TEXT,
  status ENUM('pendente','aprovada','negada','cancelada') DEFAULT 'pendente',
  aprovado_por INT,
  observacao_gestor TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (veiculo_atendido_id) REFERENCES veiculos(id) ON DELETE SET NULL
);

-- f11: Dados técnicos diários do caminhão (hodômetro, fluidos, pneus, etc.)
CREATE TABLE IF NOT EXISTS fro_dados_tecnicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  data_registro DATE NOT NULL,
  km_odometro INT,
  nivel_oleo ENUM('ok','baixo','trocar') DEFAULT 'ok',
  nivel_agua ENUM('ok','baixo','verificar') DEFAULT 'ok',
  nivel_arla ENUM('ok','baixo','trocar') DEFAULT 'ok',
  pressao_pneus VARCHAR(100),
  freios ENUM('ok','verificar','urgente') DEFAULT 'ok',
  iluminacao ENUM('ok','verificar') DEFAULT 'ok',
  observacoes TEXT,
  registrado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- f12: Plano de Manutenção Preventiva (alertas por KM/data)
CREATE TABLE IF NOT EXISTS fro_plano_preventiva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  tipo_servico VARCHAR(100) NOT NULL,
  descricao TEXT,
  intervalo_km INT,
  intervalo_dias INT,
  km_ultima_execucao INT,
  data_ultima_execucao DATE,
  km_proxima DECIMAL(10,2) AS (IF(intervalo_km IS NOT NULL AND km_ultima_execucao IS NOT NULL, km_ultima_execucao + intervalo_km, NULL)) VIRTUAL,
  data_proxima DATE AS (IF(intervalo_dias IS NOT NULL AND data_ultima_execucao IS NOT NULL, DATE_ADD(data_ultima_execucao, INTERVAL intervalo_dias DAY), NULL)) VIRTUAL,
  status ENUM('em_dia','proximo','vencido') DEFAULT 'em_dia',
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f14: Gestão de Pneus (por número de fogo/série)
CREATE TABLE IF NOT EXISTS fro_pneus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT,
  numero_fogo VARCHAR(30),
  marca VARCHAR(60),
  modelo VARCHAR(60),
  dimensao VARCHAR(20),
  posicao VARCHAR(20),
  km_instalacao INT,
  data_instalacao DATE,
  status ENUM('em_uso','estoque','recapado','descartado') DEFAULT 'em_uso',
  km_rodados INT DEFAULT 0,
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f15: Manutenção de Refrigeração / Thermo King
CREATE TABLE IF NOT EXISTS fro_refrigeracao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  data_registro DATE NOT NULL,
  tipo ENUM('preventiva','corretiva','calibracao') DEFAULT 'preventiva',
  temperatura_set DECIMAL(5,2),
  temperatura_real DECIMAL(5,2),
  pressao_alta DECIMAL(6,2),
  pressao_baixa DECIMAL(6,2),
  nivel_gas ENUM('ok','baixo','recarregar') DEFAULT 'ok',
  descricao TEXT,
  valor DECIMAL(10,2),
  fornecedor VARCHAR(150),
  status ENUM('ok','com_defeito','manutencao') DEFAULT 'ok',
  registrado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- f16: Higienização CIP dos Tanques Rodoviários
CREATE TABLE IF NOT EXISTS fro_higienizacoes_tanque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  data_higienizacao DATETIME NOT NULL,
  tipo ENUM('CIP','manual','vapor') DEFAULT 'CIP',
  produto_quimico VARCHAR(100),
  concentracao DECIMAL(6,2),
  temperatura_agua DECIMAL(5,2),
  duracao_min INT,
  volume_agua_litros DECIMAL(8,2),
  aprovado TINYINT(1) DEFAULT 0,
  aprovado_por INT,
  observacao TEXT,
  realizado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (realizado_por) REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f19: Pedágios / Sem Parar
CREATE TABLE IF NOT EXISTS fro_pedagogios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT,
  tag_semparar VARCHAR(30),
  data_passagem DATETIME NOT NULL,
  praca VARCHAR(150),
  rodovia VARCHAR(60),
  valor DECIMAL(8,2) NOT NULL,
  viagem_id INT,
  conciliado TINYINT(1) DEFAULT 0,
  registrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f21: Sinistros
CREATE TABLE IF NOT EXISTS fro_sinistros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  motorista_id INT,
  data_sinistro DATETIME NOT NULL,
  tipo ENUM('acidente','furto','roubo','incendio','alagamento','outros') NOT NULL,
  local VARCHAR(200),
  descricao TEXT NOT NULL,
  terceiros_envolvidos TINYINT(1) DEFAULT 0,
  boletim_ocorrencia VARCHAR(30),
  seguradora VARCHAR(100),
  numero_sinistro VARCHAR(50),
  valor_prejuizo DECIMAL(12,2),
  status ENUM('aberto','em_analise','indenizado','encerrado') DEFAULT 'aberto',
  fotos JSON,
  registrado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- f23: Tanques Comunitários (controle de coleta)
CREATE TABLE IF NOT EXISTS fro_tanques_comunitarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  municipio VARCHAR(100),
  capacidade_litros DECIMAL(10,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  responsavel VARCHAR(150),
  telefone VARCHAR(20),
  status ENUM('ativo','inativo') DEFAULT 'ativo',
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- f25/f26: Pesagens (Tara x Bruto)
CREATE TABLE IF NOT EXISTS fro_pesagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  viagem_id INT,
  motorista_id INT,
  data_pesagem DATETIME NOT NULL,
  peso_bruto DECIMAL(10,2),
  peso_tara DECIMAL(10,2),
  peso_liquido DECIMAL(10,2) AS (IF(peso_bruto IS NOT NULL AND peso_tara IS NOT NULL, peso_bruto - peso_tara, NULL)) VIRTUAL,
  volume_nota_fiscal DECIMAL(10,2),
  divergencia DECIMAL(10,2) AS (IF(peso_liquido IS NOT NULL AND volume_nota_fiscal IS NOT NULL, peso_liquido - volume_nota_fiscal, NULL)) VIRTUAL,
  status_divergencia ENUM('ok','divergente','critico') DEFAULT 'ok',
  observacao TEXT,
  registrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);
