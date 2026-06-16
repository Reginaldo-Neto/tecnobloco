-- ============================================
-- Tecnobloco ERP — Schema do Banco de Dados
-- MySQL 8.0 | Charset: utf8mb4
-- Módulos ativos: Core + Manutenção
-- ============================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- ==============================
-- CORE: Departamentos e Usuários
-- ==============================

CREATE TABLE IF NOT EXISTS departamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  nivel_acesso TINYINT NOT NULL DEFAULT 0 COMMENT '0=Menor Aprendiz ... 7=Admin',
  departamento_id INT,
  descricao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE COMMENT 'Apenas dígitos',
  email VARCHAR(150) UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  nivel_acesso TINYINT NOT NULL DEFAULT 0,
  departamento_id INT,
  cargo_id INT,
  foto_url VARCHAR(500),
  dashboard_rota VARCHAR(200) DEFAULT NULL COMMENT 'Rota de redirecionamento pós-login; NULL = padrão por setor',
  ativo TINYINT(1) DEFAULT 1,
  ultimo_login DATETIME,
  ultimo_ip VARCHAR(45),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (cargo_id) REFERENCES cargos(id)
);

CREATE TABLE IF NOT EXISTS funcoes_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  descricao TEXT,
  nivel_minimo TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS perfis_permissao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS perfis_funcoes (
  perfil_id INT NOT NULL,
  funcao_id INT NOT NULL,
  PRIMARY KEY (perfil_id, funcao_id),
  FOREIGN KEY (perfil_id) REFERENCES perfis_permissao(id),
  FOREIGN KEY (funcao_id) REFERENCES funcoes_sistema(id)
);

CREATE TABLE IF NOT EXISTS usuarios_perfis (
  usuario_id INT NOT NULL,
  perfil_id  INT NOT NULL,
  PRIMARY KEY (usuario_id, perfil_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (perfil_id)  REFERENCES perfis_permissao(id)
);

-- ==============================
-- CORE: Auditoria e Notificações
-- ==============================

CREATE TABLE IF NOT EXISTS auditoria_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  tipo_evento ENUM('LOGIN','LOGOUT','ACESSO_NEGADO','CRIACAO','ALTERACAO','EXCLUSAO',
                   'VISUALIZACAO','EXPORTACAO','IMPORTACAO','APROVACAO','REJEICAO','ERRO_SISTEMA')
              NOT NULL,
  tabela_afetada VARCHAR(100),
  registro_id VARCHAR(50),
  dados_antes JSON,
  dados_depois JSON,
  ip_origem VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_audit_usuario (usuario_id),
  INDEX idx_audit_tipo    (tipo_evento),
  INDEX idx_audit_tabela  (tabela_afetada),
  INDEX idx_audit_data    (criado_em)
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_destino_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT,
  modulo VARCHAR(50),
  referencia_id INT,
  lida TINYINT(1) DEFAULT 0,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id),
  INDEX idx_notif_usuario (usuario_destino_id),
  INDEX idx_notif_lida    (lida)
);

CREATE TABLE IF NOT EXISTS aprovacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modulo VARCHAR(50) NOT NULL,
  tabela_referencia VARCHAR(100) NOT NULL,
  referencia_id INT NOT NULL,
  solicitante_id INT NOT NULL,
  aprovador_id INT,
  status ENUM('pendente','aprovado','rejeitado','cancelado') DEFAULT 'pendente',
  nivel_minimo_aprovacao TINYINT DEFAULT 5,
  observacao TEXT,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvida_em DATETIME,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovador_id)   REFERENCES usuarios(id)
);

-- ==============================
-- MANUTENÇÃO: Dependência
-- ==============================

CREATE TABLE IF NOT EXISTS fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj_cpf VARCHAR(20) UNIQUE,
  tipo ENUM('PJ','PF') DEFAULT 'PJ',
  telefone VARCHAR(20),
  email VARCHAR(150),
  endereco TEXT,
  categoria VARCHAR(100),
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- MANUTENÇÃO: Equipamentos e OS
-- ==============================

CREATE TABLE IF NOT EXISTS equipamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(100),
  departamento_id INT,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  numero_serie VARCHAR(100),
  data_aquisicao DATE,
  status ENUM('operacional','em_manutencao','inativo','sucata') DEFAULT 'operacional',
  localizacao VARCHAR(200),
  manual_pdf VARCHAR(500) NULL COMMENT 'Caminho para o PDF do manual do equipamento',
  foto_url VARCHAR(500) NULL COMMENT 'Caminho para a foto da máquina',
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  equipamento_id INT,
  tipo ENUM('preventiva','corretiva','preditiva','emergencial') NOT NULL,
  prioridade ENUM('baixa','media','alta','critica') DEFAULT 'media',
  descricao TEXT NOT NULL,
  motivo_manutencao TEXT NULL COMMENT 'Motivo que gerou a necessidade da manutenção',
  causa_raiz TEXT NULL COMMENT 'Causa raiz identificada do problema',
  observacao_tecnico TEXT NULL COMMENT 'Observações do técnico durante a execução',
  status ENUM('aberta','em_andamento','aguardando_peca','concluida','cancelada') DEFAULT 'aberta',
  solicitante_id INT,
  tecnico_id INT,
  data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_previsao DATE,
  data_conclusao DATETIME,
  custo_estimado DECIMAL(10,2),
  custo_real DECIMAL(10,2),
  custo_total DECIMAL(10,2) DEFAULT 0 COMMENT 'Calculado a partir dos apontamentos',
  FOREIGN KEY (equipamento_id)  REFERENCES equipamentos(id),
  FOREIGN KEY (solicitante_id)  REFERENCES usuarios(id),
  FOREIGN KEY (tecnico_id)      REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS manutencao_preventiva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipamento_id INT,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo ENUM('preventiva','preditiva','lubrificacao','calibracao','inspecao','utilidades') DEFAULT 'preventiva',
  frequencia_tipo ENUM('diaria','semanal','quinzenal','mensal','trimestral','semestral','anual') DEFAULT 'mensal',
  frequencia_valor INT DEFAULT 1,
  duracao_estimada_h DECIMAL(5,2),
  responsavel_id INT,
  proxima_data DATE,
  ultima_data DATE,
  checklist TEXT COMMENT 'JSON array de itens de checklist',
  ativo TINYINT(1) DEFAULT 1,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  INDEX idx_prev_equip (equipamento_id),
  INDEX idx_prev_data (proxima_data)
);

CREATE TABLE IF NOT EXISTS ativos_hierarquia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  equipamento_id INT NULL,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  tipo ENUM('fabrica','setor','equipamento','componente','sistema') DEFAULT 'componente',
  localizacao VARCHAR(200),
  descricao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES ativos_hierarquia(id),
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id),
  INDEX idx_ativo_parent (parent_id)
);

CREATE TABLE IF NOT EXISTS pecas_manutencao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  unidade VARCHAR(20) DEFAULT 'un',
  categoria ENUM('rolamento','correia','filtro','lubrificante','eletrico','hidraulico','pneumatico','vedacao','fixacao','outro') DEFAULT 'outro',
  saldo_atual DECIMAL(10,2) DEFAULT 0,
  saldo_minimo DECIMAL(10,2) DEFAULT 1,
  localizacao_estoque VARCHAR(100),
  fornecedor_id INT NULL,
  preco_unitario DECIMAL(10,2),
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  INDEX idx_peca_codigo (codigo),
  INDEX idx_peca_categoria (categoria)
);

CREATE TABLE IF NOT EXISTS movimentacoes_pecas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peca_id INT NOT NULL,
  os_id INT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('entrada','saida','ajuste','inventario') NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2),
  saldo_posterior DECIMAL(10,2),
  motivo TEXT,
  documento_ref VARCHAR(100),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (peca_id) REFERENCES pecas_manutencao(id),
  FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_mov_peca (peca_id),
  INDEX idx_mov_os (os_id)
);

CREATE TABLE IF NOT EXISTS ferramentas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo ENUM('medicao','corte','aperto','eletrica','pneumatica','hidraulica','seguranca','outro') DEFAULT 'outro',
  numero_serie VARCHAR(100),
  localizacao VARCHAR(100),
  status ENUM('disponivel','em_uso','em_manutencao','extraviada','sucata') DEFAULT 'disponivel',
  calibracao_proxima DATE NULL,
  usuario_atual_id INT NULL,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_atual_id) REFERENCES usuarios(id),
  INDEX idx_ferr_status (status)
);

CREATE TABLE IF NOT EXISTS ferramentas_movimentacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ferramenta_id INT NOT NULL,
  usuario_id INT NOT NULL,
  os_id INT NULL,
  tipo ENUM('retirada','devolucao','avaria','extravio') NOT NULL,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_devolucao_prevista DATETIME NULL,
  data_devolucao_real DATETIME NULL,
  observacao TEXT,
  FOREIGN KEY (ferramenta_id) REFERENCES ferramentas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  INDEX idx_ferrm_ferr (ferramenta_id)
);

CREATE TABLE IF NOT EXISTS os_apontamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  tecnico_id INT NOT NULL,
  data_apontamento DATE NOT NULL,
  horas_trabalhadas DECIMAL(5,2),
  descricao_servico TEXT,
  peca_id INT NULL,
  qtd_pecas DECIMAL(10,2) NULL,
  custo_material DECIMAL(10,2) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
  FOREIGN KEY (peca_id) REFERENCES pecas_manutencao(id),
  INDEX idx_apt_os (os_id),
  INDEX idx_apt_tec (tecnico_id)
);
