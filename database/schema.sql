-- ============================================
-- Tecnobloco ERP — Schema do Banco de Dados
-- MySQL 8.0 | Charset: utf8mb4
-- ============================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

CREATE DATABASE IF NOT EXISTS tecnobloco
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tecnobloco;

-- ==============================
-- CORE: Usuários e Acesso
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
-- CORE: Auditoria
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

-- ==============================
-- CORE: Notificações
-- ==============================

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
-- RH
-- ==============================

CREATE TABLE IF NOT EXISTS colaboradores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNIQUE,
  nome_completo VARCHAR(200) NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE,
  rg VARCHAR(20),
  data_nascimento DATE,
  genero ENUM('M','F','Outro'),
  estado_civil ENUM('Solteiro','Casado','Divorciado','Viúvo','União Estável','Outro'),
  escolaridade VARCHAR(100),
  telefone VARCHAR(20),
  email_pessoal VARCHAR(150),
  cep VARCHAR(9), logradouro VARCHAR(200), numero VARCHAR(10), complemento VARCHAR(100),
  bairro VARCHAR(100), cidade VARCHAR(100), uf CHAR(2),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  tipo_contrato ENUM('CLT','Estágio','Aprendiz','PJ','Temporário') DEFAULT 'CLT',
  departamento_id INT,
  cargo_id INT,
  salario DECIMAL(10,2),
  ativo TINYINT(1) DEFAULT 1,
  foto_url VARCHAR(500),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)      REFERENCES usuarios(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (cargo_id)        REFERENCES cargos(id)
);

CREATE TABLE IF NOT EXISTS ponto_eletronico (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  tipo ENUM('entrada','saida_almoco','retorno_almoco','saida') NOT NULL,
  ip_origem VARCHAR(45),
  obs TEXT,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
  INDEX idx_ponto_colab (colaborador_id),
  INDEX idx_ponto_data  (data_hora)
);

CREATE TABLE IF NOT EXISTS ferias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id INT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_aprovados INT NOT NULL,
  status ENUM('solicitado','aprovado','rejeitado','em_gozo','concluido') DEFAULT 'solicitado',
  aprovado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
  FOREIGN KEY (aprovado_por)   REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS epis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  ca_numero VARCHAR(20) COMMENT 'Certificado de Aprovação MTE',
  validade_meses INT,
  estoque_atual INT DEFAULT 0,
  estoque_minimo INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS epis_colaboradores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  colaborador_id INT NOT NULL,
  epi_id INT NOT NULL,
  data_entrega DATE NOT NULL,
  data_devolucao DATE,
  quantidade INT DEFAULT 1,
  entregue_por INT,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
  FOREIGN KEY (epi_id)         REFERENCES epis(id),
  FOREIGN KEY (entregue_por)   REFERENCES usuarios(id)
);

-- ==============================
-- FINANCEIRO
-- ==============================

CREATE TABLE IF NOT EXISTS plano_contas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  descricao VARCHAR(200) NOT NULL,
  tipo ENUM('receita','despesa','ativo','passivo','patrimonio') NOT NULL,
  pai_id INT,
  nivel INT DEFAULT 1,
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (pai_id) REFERENCES plano_contas(id)
);

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

CREATE TABLE IF NOT EXISTS contas_pagar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(300) NOT NULL,
  fornecedor_id INT,
  conta_id INT COMMENT 'plano_contas',
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status ENUM('pendente','pago','vencido','cancelado') DEFAULT 'pendente',
  comprovante_url VARCHAR(500),
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (conta_id)      REFERENCES plano_contas(id),
  FOREIGN KEY (criado_por)    REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(300) NOT NULL,
  cliente_nome VARCHAR(200),
  cliente_doc VARCHAR(20),
  conta_id INT,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status ENUM('pendente','recebido','vencido','cancelado') DEFAULT 'pendente',
  observacao TEXT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id)   REFERENCES plano_contas(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- ==============================
-- ESTOQUE
-- ==============================

CREATE TABLE IF NOT EXISTS categorias_produto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  tipo ENUM('insumo','produto_acabado','embalagem','reagente','outros') DEFAULT 'insumo'
);

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nome VARCHAR(200) NOT NULL,
  categoria_id INT,
  unidade_medida VARCHAR(20) DEFAULT 'UN',
  estoque_atual DECIMAL(12,3) DEFAULT 0,
  estoque_minimo DECIMAL(12,3) DEFAULT 0,
  estoque_maximo DECIMAL(12,3),
  custo_unitario DECIMAL(10,4),
  localizacao VARCHAR(100),
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (categoria_id) REFERENCES categorias_produto(id)
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  tipo ENUM('entrada','saida','ajuste','transferencia','perda') NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL,
  custo_unitario DECIMAL(10,4),
  lote VARCHAR(50),
  validade DATE,
  referencia_modulo VARCHAR(50) COMMENT 'producao, compras, etc.',
  referencia_id INT,
  observacao TEXT,
  usuario_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id)  REFERENCES produtos(id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
  INDEX idx_mov_produto (produto_id),
  INDEX idx_mov_data    (criado_em)
);

-- ==============================
-- PRODUÇÃO
-- ==============================

CREATE TABLE IF NOT EXISTS ordens_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  produto_id INT NOT NULL,
  quantidade_planejada DECIMAL(12,3) NOT NULL,
  quantidade_produzida DECIMAL(12,3) DEFAULT 0,
  data_inicio_planejado DATE,
  data_fim_planejado DATE,
  data_inicio_real DATETIME,
  data_fim_real DATETIME,
  status ENUM('rascunho','aprovada','em_producao','pausada','concluida','cancelada') DEFAULT 'rascunho',
  responsavel_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id)     REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- ==============================
-- QUALIDADE
-- ==============================

CREATE TABLE IF NOT EXISTS laudos_qualidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_producao_id INT,
  produto_id INT,
  lote VARCHAR(50),
  data_coleta DATETIME NOT NULL,
  analista_id INT,
  resultado ENUM('aprovado','reprovado','condicional') NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ordem_producao_id) REFERENCES ordens_producao(id),
  FOREIGN KEY (produto_id)        REFERENCES produtos(id),
  FOREIGN KEY (analista_id)       REFERENCES usuarios(id)
);

-- ==============================
-- MANUTENÇÃO
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
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  equipamento_id INT,
  tipo ENUM('preventiva','corretiva','preditiva','emergencial') NOT NULL,
  prioridade ENUM('baixa','media','alta','critica') DEFAULT 'media',
  descricao TEXT NOT NULL,
  status ENUM('aberta','em_andamento','aguardando_peca','concluida','cancelada') DEFAULT 'aberta',
  solicitante_id INT,
  tecnico_id INT,
  data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_previsao DATE,
  data_conclusao DATETIME,
  custo_estimado DECIMAL(10,2),
  custo_real DECIMAL(10,2),
  FOREIGN KEY (equipamento_id)  REFERENCES equipamentos(id),
  FOREIGN KEY (solicitante_id)  REFERENCES usuarios(id),
  FOREIGN KEY (tecnico_id)      REFERENCES usuarios(id)
);

-- ==============================
-- FROTA
-- ==============================

CREATE TABLE IF NOT EXISTS veiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(10) NOT NULL UNIQUE,
  modelo VARCHAR(100),
  marca VARCHAR(100),
  ano INT,
  tipo ENUM('carro','caminhao','moto','van','trator','outro') DEFAULT 'carro',
  combustivel ENUM('flex','gasolina','diesel','eletrico') DEFAULT 'flex',
  km_atual INT DEFAULT 0,
  status ENUM('disponivel','em_uso','manutencao','inativo') DEFAULT 'disponivel',
  departamento_id INT,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS viagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  motorista_id INT NOT NULL,
  destino VARCHAR(300) NOT NULL,
  km_saida INT,
  km_chegada INT,
  data_saida DATETIME,
  data_chegada DATETIME,
  motivo TEXT,
  status ENUM('agendada','em_andamento','concluida','cancelada') DEFAULT 'agendada',
  FOREIGN KEY (veiculo_id)   REFERENCES veiculos(id),
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id)
);

-- ==============================
-- SEGURANÇA DO TRABALHO
-- ==============================

CREATE TABLE IF NOT EXISTS ocorrencias_seguranca (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('acidente','incidente','quase_acidente','doenca_ocupacional') NOT NULL,
  data_ocorrencia DATETIME NOT NULL,
  local VARCHAR(200),
  envolvido_id INT,
  departamento_id INT,
  descricao TEXT NOT NULL,
  providencias TEXT,
  status ENUM('aberto','em_investigacao','encerrado') DEFAULT 'aberto',
  registrado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (envolvido_id)    REFERENCES colaboradores(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (registrado_por)  REFERENCES usuarios(id)
);

-- ==============================
-- TI / SUPORTE
-- ==============================

CREATE TABLE IF NOT EXISTS chamados_ti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  solicitante_id INT NOT NULL,
  tecnico_id INT,
  categoria VARCHAR(100),
  prioridade ENUM('baixa','media','alta','critica') DEFAULT 'media',
  status ENUM('aberto','em_atendimento','aguardando_usuario','resolvido','fechado') DEFAULT 'aberto',
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_resolucao DATETIME,
  solucao TEXT,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (tecnico_id)     REFERENCES usuarios(id)
);

-- ==============================
-- PRODUTORES RURAIS (portal externo)
-- ==============================

CREATE TABLE IF NOT EXISTS produtores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cpf_cnpj VARCHAR(20) UNIQUE,
  telefone VARCHAR(20),
  email VARCHAR(150),
  municipio VARCHAR(100),
  uf CHAR(2),
  senha_hash VARCHAR(255),
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coletas_leite (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  produtor_id INT NOT NULL,
  data_coleta DATE NOT NULL,
  quantidade_litros DECIMAL(10,2) NOT NULL,
  temperatura DECIMAL(5,2),
  resultado_qualidade ENUM('aprovado','reprovado') DEFAULT 'aprovado',
  observacao TEXT,
  operador_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produtor_id)  REFERENCES produtores(id),
  FOREIGN KEY (operador_id)  REFERENCES usuarios(id),
  INDEX idx_coleta_produtor (produtor_id),
  INDEX idx_coleta_data     (data_coleta)
);

-- ==============================
-- COMPRAS
-- ==============================

CREATE TABLE IF NOT EXISTS pedidos_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  fornecedor_id INT,
  solicitante_id INT,
  status ENUM('rascunho','pendente_aprovacao','aprovado','enviado','recebido','cancelado') DEFAULT 'rascunho',
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_aprovacao DATETIME,
  aprovado_por INT,
  valor_total DECIMAL(12,2),
  observacao TEXT,
  FOREIGN KEY (fornecedor_id)  REFERENCES fornecedores(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por)   REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS itens_pedido_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL,
  unidade VARCHAR(20),
  valor_unitario DECIMAL(10,4),
  valor_total DECIMAL(12,2),
  FOREIGN KEY (pedido_id)  REFERENCES pedidos_compra(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- ==============================
-- FUNÇÕES GLOBAIS — tabelas de suporte
-- ==============================

-- F01/F02 — Solicitações de Reunião
CREATE TABLE IF NOT EXISTS solicitacoes_reuniao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  departamento_destino_id INT,
  participante_id INT COMMENT 'Usuário específico (opcional)',
  data_preferencial DATETIME,
  duracao_minutos INT DEFAULT 60,
  local_sugerido VARCHAR(200),
  descricao TEXT,
  recorrente TINYINT(1) DEFAULT 0,
  status ENUM('pendente','aprovada','rejeitada','cancelada','concluida') DEFAULT 'pendente',
  resposta TEXT,
  respondido_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (departamento_destino_id) REFERENCES departamentos(id),
  FOREIGN KEY (participante_id) REFERENCES usuarios(id),
  FOREIGN KEY (respondido_por) REFERENCES usuarios(id),
  INDEX idx_reuniao_sol (solicitante_id),
  INDEX idx_reuniao_status (status)
);

-- F05/F06 — Solicitações de Limpeza
CREATE TABLE IF NOT EXISTS solicitacoes_limpeza (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  local_setor VARCHAR(200) NOT NULL,
  tipo ENUM('geral','pontual','urgente','agendada') DEFAULT 'pontual',
  urgencia ENUM('baixa','media','alta') DEFAULT 'media',
  descricao TEXT,
  status ENUM('pendente','aceita','em_andamento','concluida','cancelada') DEFAULT 'pendente',
  observacao_conclusao TEXT,
  atendido_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (atendido_por) REFERENCES usuarios(id),
  INDEX idx_limp_sol (solicitante_id)
);

-- F07/F08 — Solicitações de Compra Interna
CREATE TABLE IF NOT EXISTS solicitacoes_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  item_descricao VARCHAR(300) NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  unidade VARCHAR(20) DEFAULT 'UN',
  valor_estimado DECIMAL(10,2),
  justificativa TEXT,
  urgencia ENUM('baixa','media','alta','urgente') DEFAULT 'media',
  fornecedor_sugerido VARCHAR(200),
  status ENUM('pendente','aprovada','em_cotacao','concluida','rejeitada','cancelada') DEFAULT 'pendente',
  aprovado_por INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id),
  INDEX idx_compra_sol (solicitante_id)
);

-- F09/F10 — Documentos Pessoais (atestados, certificados, etc.)
CREATE TABLE IF NOT EXISTS documentos_pessoais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('atestado_medico','certificado','declaracao','laudo','cnh','outro') DEFAULT 'atestado_medico',
  descricao VARCHAR(300),
  data_documento DATE,
  arquivo_url VARCHAR(500) COMMENT 'URL ou caminho do arquivo',
  validado TINYINT(1) DEFAULT 0,
  validado_por INT,
  observacao_rh TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (validado_por) REFERENCES usuarios(id),
  INDEX idx_doc_usuario (usuario_id)
);

-- F11/F12 — Ocorrências Internas
CREATE TABLE IF NOT EXISTS ocorrencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('incidente','acidente','comportamento','patrimonial','ambiental','outro') DEFAULT 'incidente',
  data_ocorrencia DATETIME NOT NULL,
  local VARCHAR(200),
  descricao TEXT NOT NULL,
  providencias_solicitadas TEXT,
  reportado_por INT NOT NULL,
  departamento_id INT,
  status ENUM('aberto','em_analise','encerrado') DEFAULT 'aberto',
  resposta TEXT,
  respondido_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportado_por) REFERENCES usuarios(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (respondido_por) REFERENCES usuarios(id),
  INDEX idx_ocor_reporter (reportado_por)
);

-- F14 — Cardápio do Refeitório
CREATE TABLE IF NOT EXISTS cardapio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_cardapio DATE NOT NULL,
  turno ENUM('cafe_manha','almoco','lanche','jantar') DEFAULT 'almoco',
  ativo TINYINT(1) DEFAULT 1,
  criado_por INT,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  UNIQUE KEY uq_cardapio (data_cardapio, turno)
);

CREATE TABLE IF NOT EXISTS cardapio_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cardapio_id INT NOT NULL,
  tipo ENUM('principal','acompanhamento','salada','sobremesa','bebida') DEFAULT 'principal',
  descricao VARCHAR(300) NOT NULL,
  calorias INT,
  FOREIGN KEY (cardapio_id) REFERENCES cardapio(id) ON DELETE CASCADE
);

-- F15 — Treinamentos
CREATE TABLE IF NOT EXISTS treinamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  carga_horaria INT DEFAULT 8 COMMENT 'horas',
  validade_meses INT COMMENT 'NULL = nao expira',
  modalidade ENUM('presencial','online','hibrido') DEFAULT 'presencial',
  obrigatorio TINYINT(1) DEFAULT 0,
  departamento_id INT COMMENT 'NULL = todos os setores',
  nivel_minimo TINYINT DEFAULT 0,
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS treinamentos_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  treinamento_id INT NOT NULL,
  usuario_id INT NOT NULL,
  data_inicio DATE,
  data_conclusao DATE,
  status ENUM('pendente','em_andamento','concluido','expirado','cancelado') DEFAULT 'pendente',
  certificado_url VARCHAR(500),
  nota DECIMAL(4,2),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_trein_user (treinamento_id, usuario_id),
  FOREIGN KEY (treinamento_id) REFERENCES treinamentos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- F16 — Holerites
CREATE TABLE IF NOT EXISTS holerites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  mes TINYINT NOT NULL COMMENT '1-12',
  ano YEAR NOT NULL,
  salario_bruto DECIMAL(10,2),
  inss DECIMAL(10,2),
  fgts DECIMAL(10,2),
  ir DECIMAL(10,2),
  outros_descontos DECIMAL(10,2),
  outros_acrescimos DECIMAL(10,2),
  salario_liquido DECIMAL(10,2),
  pdf_url VARCHAR(500),
  disponibilizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hol (usuario_id, mes, ano),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- F18 — Ramais / Contatos Internos
CREATE TABLE IF NOT EXISTS ramais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  ramal VARCHAR(10),
  celular VARCHAR(20),
  email VARCHAR(150),
  departamento_id INT,
  cargo VARCHAR(100),
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

-- F19 — Canal de Ética / Denúncias Anônimas
-- INTENCIONALMENTE sem usuario_id para garantir anonimato
CREATE TABLE IF NOT EXISTS denuncias_etica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  protocolo VARCHAR(20) NOT NULL UNIQUE,
  categoria ENUM('assedio','fraude','corrupcao','discriminacao','seguranca_trabalho','conflito_interesse','outro') DEFAULT 'outro',
  descricao TEXT NOT NULL,
  departamento_envolvido_id INT,
  status ENUM('recebida','em_analise','encerrada') DEFAULT 'recebida',
  resposta_publica TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departamento_envolvido_id) REFERENCES departamentos(id)
);

-- F21 — Adiantamentos Salariais
CREATE TABLE IF NOT EXISTS adiantamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  valor_solicitado DECIMAL(10,2) NOT NULL,
  motivo TEXT,
  status ENUM('pendente','aprovado','rejeitado','pago','cancelado') DEFAULT 'pendente',
  aprovado_por INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id),
  INDEX idx_adiant_usuario (usuario_id)
);

-- F22 — Relatórios de Bug
CREATE TABLE IF NOT EXISTS bug_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  modulo VARCHAR(100),
  descricao TEXT NOT NULL,
  passos_reproducao TEXT,
  prioridade ENUM('baixa','media','alta','critica') DEFAULT 'media',
  status ENUM('aberto','em_analise','corrigido','nao_reproduzivel','fechado') DEFAULT 'aberto',
  resposta_ti TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- F24 — Solicitações de Lavanderia
CREATE TABLE IF NOT EXISTS solicitacoes_lavanderia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  tipo ENUM('coleta_sujos','coleta_especial','informar_entrega') DEFAULT 'coleta_sujos',
  quantidade_pecas INT DEFAULT 1,
  observacao TEXT,
  data_preferencial DATE,
  status ENUM('pendente','aceita','coletado','lavando','entregue','cancelada') DEFAULT 'pendente',
  atendido_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (atendido_por) REFERENCES usuarios(id),
  INDEX idx_lav_sol (solicitante_id)
);

-- F25 — Solicitações de Serviços Gerais
CREATE TABLE IF NOT EXISTS solicitacoes_servicos_gerais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  tipo ENUM('mudanca_moveis','pintura','capina','coleta_lixo','instalacao','limpeza_area','outro') DEFAULT 'outro',
  descricao TEXT NOT NULL,
  local VARCHAR(200),
  urgencia ENUM('baixa','media','alta') DEFAULT 'media',
  status ENUM('pendente','aceita','em_andamento','concluida','cancelada') DEFAULT 'pendente',
  observacao_conclusao TEXT,
  atendido_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (atendido_por) REFERENCES usuarios(id),
  INDEX idx_sg_sol (solicitante_id)
);

-- F26 — Solicitações de Uso de Veículo
CREATE TABLE IF NOT EXISTS solicitacoes_veiculo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  destino VARCHAR(300) NOT NULL,
  data_saida DATETIME NOT NULL,
  data_retorno DATETIME NOT NULL,
  motivo TEXT NOT NULL,
  passageiros INT DEFAULT 1,
  veiculo_preferido_id INT,
  status ENUM('pendente','aprovada','rejeitada','em_uso','concluida','cancelada') DEFAULT 'pendente',
  aprovado_por INT,
  veiculo_atribuido_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (veiculo_preferido_id) REFERENCES veiculos(id),
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id),
  FOREIGN KEY (veiculo_atribuido_id) REFERENCES veiculos(id),
  INDEX idx_vei_sol (solicitante_id)
);

-- === MÓDULO MANUTENÇÃO — TABELAS ADICIONAIS ===

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

CREATE TABLE IF NOT EXISTS cronograma_jardinagem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo ENUM('corte','poda','fertilizacao','irrigacao','plantio','limpeza_area','outro') DEFAULT 'corte',
  area VARCHAR(200),
  data_agendada DATE NOT NULL,
  recorrencia ENUM('unica','semanal','quinzenal','mensal') DEFAULT 'unica',
  responsavel_id INT NULL,
  status ENUM('agendado','em_andamento','concluido','cancelado') DEFAULT 'agendado',
  observacoes TEXT,
  criado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  INDEX idx_jard_data (data_agendada)
);

CREATE TABLE IF NOT EXISTS escalas_servicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  turno ENUM('manha','tarde','noite','integral') DEFAULT 'manha',
  tipo ENUM('plantao','normal','ferias','folga') DEFAULT 'normal',
  observacoes TEXT,
  criado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  INDEX idx_esc_usuario (usuario_id),
  INDEX idx_esc_data (data_inicio, data_fim)
);

CREATE TABLE IF NOT EXISTS leituras_medidores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('agua','energia','gas','vapor','outro') NOT NULL,
  ponto VARCHAR(200) NOT NULL,
  leitura DECIMAL(12,3) NOT NULL,
  unidade VARCHAR(20) DEFAULT 'kWh',
  data_leitura DATE NOT NULL,
  usuario_id INT NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_med_tipo_data (tipo, data_leitura)
);

-- ==============================
-- SAC (Serviço de Atendimento ao Cliente)
-- ==============================

CREATE TABLE IF NOT EXISTS sac_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  categoria ENUM('embalagem','qualidade_produto','entrega','atendimento','cobranca','outro') NOT NULL DEFAULT 'outro',
  prioridade ENUM('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
  canal_entrada ENUM('telefone','whatsapp','email','portal','presencial') NOT NULL DEFAULT 'portal',
  cliente_nome VARCHAR(200) NOT NULL,
  cliente_contato VARCHAR(150) NULL,
  lote_vinculado VARCHAR(100) NULL,
  solicitante_id INT NULL,
  atendente_id INT NULL,
  status ENUM('aberto','em_analise','aguardando_cliente','resolvido','fechado','cancelado') NOT NULL DEFAULT 'aberto',
  resolucao TEXT NULL,
  satisfacao_nota TINYINT UNSIGNED NULL COMMENT '1-5',
  data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_fechamento DATETIME NULL,
  prazo_sla DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (atendente_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_sac_tk_status    (status),
  INDEX idx_sac_tk_prioridade (prioridade),
  INDEX idx_sac_tk_cliente   (cliente_nome),
  INDEX idx_sac_tk_abertura  (data_abertura)
);

CREATE TABLE IF NOT EXISTS sac_tickets_historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  usuario_id INT NULL,
  tipo ENUM('status','comentario','rastreabilidade') NOT NULL DEFAULT 'comentario',
  descricao TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id)  REFERENCES sac_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_sac_hist_ticket (ticket_id)
);

CREATE TABLE IF NOT EXISTS sac_atendimentos_avulsos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  canal ENUM('telefone','whatsapp','email','portal','presencial') NOT NULL DEFAULT 'telefone',
  cliente_nome VARCHAR(200) NOT NULL,
  cliente_contato VARCHAR(150) NULL,
  descricao TEXT NOT NULL,
  resultado TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_sac_atend_usuario (usuario_id),
  INDEX idx_sac_atend_data    (created_at)
);

CREATE TABLE IF NOT EXISTS sac_motivos_reclamacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Geral',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sac_garantias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NULL,
  tipo ENUM('troca','credito','devolucao','reparo') NOT NULL DEFAULT 'troca',
  descricao TEXT NOT NULL,
  valor_credito DECIMAL(10,2) NULL,
  status ENUM('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
  aprovador_id INT NULL,
  observacao_resposta TEXT NULL,
  data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_resposta DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id)    REFERENCES sac_tickets(id) ON DELETE SET NULL,
  FOREIGN KEY (aprovador_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_sac_gar_status (status)
);

CREATE TABLE IF NOT EXISTS sac_recall (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  produto VARCHAR(200) NOT NULL,
  lote VARCHAR(100) NULL,
  motivo TEXT NOT NULL,
  nivel_urgencia ENUM('medio','alto','critico') NOT NULL DEFAULT 'alto',
  descricao TEXT NULL,
  status ENUM('ativo','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'ativo',
  responsavel_id INT NULL,
  observacao_fechamento TEXT NULL,
  data_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_fechamento DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_sac_recall_status (status)
);

CREATE TABLE IF NOT EXISTS sac_templates_resposta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  assunto VARCHAR(200) NOT NULL,
  corpo TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Geral',
  autor_id INT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sac_base_conhecimento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Geral',
  conteudo LONGTEXT NOT NULL,
  autor_id INT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FULLTEXT INDEX idx_sac_bk_busca (titulo, conteudo)
);

CREATE TABLE IF NOT EXISTS sac_escalas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  atendente_nome VARCHAR(150) NULL,
  turno ENUM('comercial','manha','tarde','noite','plantao') NOT NULL DEFAULT 'comercial',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo ENUM('normal','plantao','ferias','feriado') NOT NULL DEFAULT 'normal',
  observacao TEXT NULL,
  criado_por_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_sac_esc_data (data_inicio, data_fim)
);

CREATE TABLE IF NOT EXISTS sac_comunicados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  canal ENUM('email','sms','whatsapp','portal','todos') NOT NULL DEFAULT 'email',
  remetente_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ==============================
-- LIMPEZA
-- ==============================

CREATE TABLE IF NOT EXISTS limpeza_rotinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT NULL,
  local_setor VARCHAR(200) NOT NULL,
  frequencia ENUM('diaria','semanal','quinzenal','mensal') NOT NULL DEFAULT 'diaria',
  dia_semana TINYINT NULL COMMENT '0=dom,1=seg...6=sab (para frequencia semanal)',
  horario TIME NULL,
  responsavel_padrao_id INT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_por_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_padrao_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por_id)         REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS limpeza_checklist_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rotina_id INT NULL,
  local_setor VARCHAR(200) NOT NULL,
  descricao VARCHAR(300) NOT NULL,
  horario_execucao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  observacao TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rotina_id)  REFERENCES limpeza_rotinas(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_lcr_data  (horario_execucao),
  INDEX idx_lcr_local (local_setor(50))
);

CREATE TABLE IF NOT EXISTS limpeza_residuos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('organico','reciclavel','perigoso','rejeito','eletronico') NOT NULL,
  local_origem VARCHAR(200) NOT NULL,
  peso_kg DECIMAL(8,2) NOT NULL,
  destinacao VARCHAR(200) NULL,
  observacao TEXT NULL,
  usuario_id INT NOT NULL,
  data_coleta DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_res_data (data_coleta),
  INDEX idx_res_tipo (tipo)
);

CREATE TABLE IF NOT EXISTS limpeza_cacambas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  local VARCHAR(200) NOT NULL,
  tipo_cacamba ENUM('entulho','lixo_industrial','reciclavel','organico','misto') NOT NULL DEFAULT 'misto',
  motivo ENUM('cheia','troca','retirada','emergencial') NOT NULL DEFAULT 'cheia',
  descricao TEXT NULL,
  status ENUM('pendente','agendada','concluida','cancelada') NOT NULL DEFAULT 'pendente',
  data_prevista DATE NULL,
  solicitante_id INT NOT NULL,
  observacao_conclusao TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  INDEX idx_cac_status (status)
);

CREATE TABLE IF NOT EXISTS limpeza_lavagem_patio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area VARCHAR(200) NOT NULL,
  tipo ENUM('lavagem_leve','lavagem_pesada','dedetizacao','impermeabilizacao') NOT NULL DEFAULT 'lavagem_pesada',
  data_agendada DATE NOT NULL,
  horario_previsto TIME NULL,
  status ENUM('agendada','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'agendada',
  observacoes TEXT NULL,
  executado_por_id INT NULL,
  solicitante_id INT NOT NULL,
  observacao_conclusao TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (executado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (solicitante_id)   REFERENCES usuarios(id),
  INDEX idx_patio_data (data_agendada)
);

CREATE TABLE IF NOT EXISTS limpeza_estoque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  categoria ENUM('produto_quimico','utensilio','equipamento','descartavel','epi') NOT NULL DEFAULT 'utensilio',
  unidade VARCHAR(20) NOT NULL DEFAULT 'UN',
  quantidade_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade_minima DECIMAL(10,2) NOT NULL DEFAULT 0,
  localizacao VARCHAR(100) NULL,
  observacoes TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_por_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (criado_por_id) REFERENCES usuarios(id),
  INDEX idx_le_cat (categoria)
);

CREATE TABLE IF NOT EXISTS limpeza_estoque_movimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  tipo ENUM('entrada','saida','ajuste') NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(200) NULL,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id)    REFERENCES limpeza_estoque(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_lem_item (item_id)
);

CREATE TABLE IF NOT EXISTS limpeza_consumo_descartaveis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setor VARCHAR(150) NOT NULL,
  tipo ENUM('papel_toalha','papel_higienico','sabonete','alcool_gel','outro') NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(20) NOT NULL DEFAULT 'UN',
  periodo_ref CHAR(7) NOT NULL COMMENT 'YYYY-MM',
  usuario_id INT NOT NULL,
  observacao TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_desc_periodo (periodo_ref),
  INDEX idx_desc_setor   (setor(50))
);

CREATE TABLE IF NOT EXISTS limpeza_escalas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  funcionario_nome VARCHAR(150) NULL,
  turno ENUM('manha','tarde','noite','integral','plantao') NOT NULL DEFAULT 'integral',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo ENUM('normal','ferias','folga','plantao','feriado') NOT NULL DEFAULT 'normal',
  observacao TEXT NULL,
  criado_por_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por_id) REFERENCES usuarios(id),
  INDEX idx_le_esc_data (data_inicio, data_fim)
);

-- ==============================
-- TI — Tecnologia da Informação
-- ==============================

CREATE TABLE IF NOT EXISTS ti_chamados (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(20)  NOT NULL UNIQUE,
  titulo          VARCHAR(200) NOT NULL,
  descricao       TEXT         NOT NULL,
  categoria       ENUM('hardware','software','rede','acesso','email','outro') NOT NULL DEFAULT 'outro',
  prioridade      ENUM('baixa','media','alta','critica')                     NOT NULL DEFAULT 'media',
  status          ENUM('aberto','em_andamento','aguardando','resolvido','fechado') NOT NULL DEFAULT 'aberto',
  resolucao       TEXT         NULL,
  solicitante_id  INT          NOT NULL,
  atendente_id    INT          NULL,
  data_abertura   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_fechamento DATETIME     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (atendente_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ti_ch_status   (status),
  INDEX idx_ti_ch_prio     (prioridade),
  INDEX idx_ti_ch_sol      (solicitante_id)
);

CREATE TABLE IF NOT EXISTS ti_chamados_comentarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  chamado_id  INT  NOT NULL,
  usuario_id  INT  NOT NULL,
  comentario  TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chamado_id) REFERENCES ti_chamados(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_ti_cmt_chamado (chamado_id)
);

CREATE TABLE IF NOT EXISTS ti_base_conhecimento (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  categoria   VARCHAR(100) NOT NULL DEFAULT 'Geral',
  conteudo    TEXT         NOT NULL,
  autor_id    INT          NULL,
  ativo       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ti_bk_ativo (ativo),
  FULLTEXT  idx_ti_bk_ft (titulo, conteudo)
);

CREATE TABLE IF NOT EXISTS ti_ativos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(30)  NOT NULL UNIQUE,
  nome            VARCHAR(200) NOT NULL,
  tipo            VARCHAR(80)  NOT NULL,
  marca           VARCHAR(100) NULL,
  modelo          VARCHAR(150) NULL,
  numero_serie    VARCHAR(100) NULL,
  status          ENUM('disponivel','em_uso','manutencao','descartado') NOT NULL DEFAULT 'disponivel',
  responsavel_id  INT          NULL,
  localizacao     VARCHAR(200) NULL,
  data_aquisicao  DATE         NULL,
  valor_aquisicao DECIMAL(12,2) NULL,
  garantia_ate    DATE         NULL,
  observacoes     TEXT         NULL,
  ativo           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ti_at_status (status),
  INDEX idx_ti_at_tipo   (tipo(40))
);

CREATE TABLE IF NOT EXISTS ti_ativos_movimentacoes (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  ativo_id             INT          NOT NULL,
  tipo                 ENUM('entrega','devolucao','manutencao','descarte') NOT NULL,
  usuario_destino_id   INT          NULL,
  localizacao_destino  VARCHAR(200) NULL,
  responsavel_id       INT          NOT NULL,
  data_movimentacao    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao           TEXT         NULL,
  FOREIGN KEY (ativo_id)           REFERENCES ti_ativos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (responsavel_id)     REFERENCES usuarios(id),
  INDEX idx_ti_amov_ativo (ativo_id)
);

CREATE TABLE IF NOT EXISTS ti_bugs (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  titulo           VARCHAR(200) NOT NULL,
  descricao        TEXT         NOT NULL,
  modulo           VARCHAR(100) NULL,
  severidade       ENUM('baixa','media','alta','critica')                                   NOT NULL DEFAULT 'media',
  status           ENUM('aberto','em_analise','confirmado','corrigido','invalido','fechado') NOT NULL DEFAULT 'aberto',
  reportado_por_id INT          NOT NULL,
  responsavel_id   INT          NULL,
  reproducao       TEXT         NULL,
  resolucao        TEXT         NULL,
  data_report      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_resolucao   DATETIME     NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reportado_por_id) REFERENCES usuarios(id),
  FOREIGN KEY (responsavel_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ti_bug_status (status),
  INDEX idx_ti_bug_sev    (severidade)
);

CREATE TABLE IF NOT EXISTS ti_escalas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT          NULL,
  tecnico_nome  VARCHAR(150) NULL,
  turno         ENUM('manha','tarde','noite','plantao') NOT NULL DEFAULT 'plantao',
  data_inicio   DATE         NOT NULL,
  data_fim      DATE         NOT NULL,
  tipo          ENUM('plantao','janela_manutencao','backup','outro') NOT NULL DEFAULT 'plantao',
  observacao    TEXT         NULL,
  criado_por_id INT          NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por_id) REFERENCES usuarios(id),
  INDEX idx_ti_esc_data (data_inicio, data_fim)
);

CREATE TABLE IF NOT EXISTS ti_solicitacoes_exclusao (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  descricao             TEXT         NOT NULL,
  tabela_referencia     VARCHAR(100) NULL,
  registro_id           INT          NULL,
  motivo                TEXT         NOT NULL,
  solicitante_id        INT          NOT NULL,
  aprovador_id          INT          NULL,
  status                ENUM('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
  justificativa_resposta TEXT        NULL,
  data_solicitacao      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_resposta         DATETIME     NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (aprovador_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ti_se_status (status)
);

-- ==============================
-- LAVANDERIA
-- ==============================

CREATE TABLE IF NOT EXISTS lav_uniformes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(30)  NOT NULL UNIQUE,
  tipo            ENUM('camisa','calca','jaleco','avental','toalha','bone','bota','outro') NOT NULL DEFAULT 'outro',
  tamanho         VARCHAR(10)  NULL,
  cor             VARCHAR(40)  NULL,
  funcionario_id  INT          NULL,
  departamento_id INT          NULL,
  ciclos_lavagem  INT          NOT NULL DEFAULT 0,
  status          ENUM('em_uso','sujo','em_lavagem','em_reparo','disponivel','descartado') NOT NULL DEFAULT 'disponivel',
  ativo           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id)  REFERENCES usuarios(id)     ON DELETE SET NULL,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
  INDEX idx_lav_uni_status (status),
  INDEX idx_lav_uni_func   (funcionario_id)
);

CREATE TABLE IF NOT EXISTS lav_entradas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uniforme_id     INT          NULL,
  funcionario_id  INT          NULL,
  setor_id        INT          NULL,
  tipo_item       VARCHAR(80)  NOT NULL DEFAULT 'uniforme',
  nivel_sujeira   ENUM('leve','moderado','pesado')           NOT NULL DEFAULT 'leve',
  tipo_area       ENUM('area_limpa','area_suja','externo')   NOT NULL DEFAULT 'area_limpa',
  status          ENUM('recebido','em_triagem','em_lavagem','lavado','entregue','cancelado') NOT NULL DEFAULT 'recebido',
  observacao      TEXT         NULL,
  registrado_por  INT          NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uniforme_id)    REFERENCES lav_uniformes(id)  ON DELETE SET NULL,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id)       ON DELETE SET NULL,
  FOREIGN KEY (setor_id)       REFERENCES departamentos(id)  ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_lav_ent_status (status),
  INDEX idx_lav_ent_func   (funcionario_id)
);

CREATE TABLE IF NOT EXISTS lav_ciclos_lavagem (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  codigo_lote    VARCHAR(30)  NOT NULL UNIQUE,
  data_inicio    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_fim       DATETIME     NULL,
  temperatura    DECIMAL(5,1) NULL,
  tempo_min      INT          NULL,
  tipo_lavagem   ENUM('normal','esterilizacao','delicado','quimico') NOT NULL DEFAULT 'normal',
  total_kg       DECIMAL(8,2) NULL,
  operador_id    INT          NOT NULL,
  status         ENUM('em_andamento','concluido','cancelado')        NOT NULL DEFAULT 'em_andamento',
  observacao     TEXT         NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operador_id) REFERENCES usuarios(id),
  INDEX idx_lav_ciclo_status (status),
  INDEX idx_lav_ciclo_data   (data_inicio)
);

CREATE TABLE IF NOT EXISTS lav_ciclos_itens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ciclo_id    INT NOT NULL,
  entrada_id  INT NOT NULL,
  FOREIGN KEY (ciclo_id)   REFERENCES lav_ciclos_lavagem(id) ON DELETE CASCADE,
  FOREIGN KEY (entrada_id) REFERENCES lav_entradas(id),
  UNIQUE KEY uk_ciclo_entrada (ciclo_id, entrada_id)
);

CREATE TABLE IF NOT EXISTS lav_quimicos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(150) NOT NULL,
  tipo            ENUM('sabao','cloro','amaciante','desinfetante','outro') NOT NULL DEFAULT 'outro',
  unidade         VARCHAR(20)  NOT NULL DEFAULT 'L',
  estoque_atual   DECIMAL(10,3) NOT NULL DEFAULT 0,
  estoque_minimo  DECIMAL(10,3) NOT NULL DEFAULT 0,
  fornecedor      VARCHAR(150) NULL,
  ativo           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lav_qui_ativo (ativo)
);

CREATE TABLE IF NOT EXISTS lav_quimicos_uso (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  quimico_id      INT           NOT NULL,
  ciclo_id        INT           NULL,
  quantidade      DECIMAL(10,3) NOT NULL,
  data_uso        DATE          NOT NULL,
  total_kg_roupas DECIMAL(8,2)  NULL,
  registrado_por  INT           NOT NULL,
  observacao      TEXT          NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quimico_id)     REFERENCES lav_quimicos(id),
  FOREIGN KEY (ciclo_id)       REFERENCES lav_ciclos_lavagem(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_lav_qui_uso_data (data_uso)
);

CREATE TABLE IF NOT EXISTS lav_higienizacoes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tipo_item       ENUM('bota','avental','luva','capacete','outro') NOT NULL DEFAULT 'bota',
  funcionario_id  INT          NULL,
  data_higienizacao DATE       NOT NULL,
  metodo          ENUM('lavagem_manual','imersao_quimica','vapor','combinado') NOT NULL DEFAULT 'lavagem_manual',
  temperatura     DECIMAL(5,1) NULL,
  produto_usado   VARCHAR(150) NULL,
  status          ENUM('pendente','em_processo','concluido') NOT NULL DEFAULT 'pendente',
  registrado_por  INT          NOT NULL,
  observacao      TEXT         NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_lav_hig_data   (data_higienizacao),
  INDEX idx_lav_hig_status (status)
);

CREATE TABLE IF NOT EXISTS lav_estoque_uniformes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tipo           ENUM('camisa','calca','jaleco','avental','toalha_tecido','toalha_papel','bone','bota','outro') NOT NULL DEFAULT 'outro',
  descricao      VARCHAR(200) NULL,
  tamanho        VARCHAR(10)  NULL,
  cor            VARCHAR(40)  NULL,
  quantidade     INT          NOT NULL DEFAULT 0,
  estoque_minimo INT          NOT NULL DEFAULT 5,
  localizacao    VARCHAR(150) NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lav_est_tipo (tipo)
);

CREATE TABLE IF NOT EXISTS lav_descartes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uniforme_id     INT          NULL,
  tipo_item       VARCHAR(80)  NOT NULL DEFAULT 'uniforme',
  motivo          ENUM('rasgado','manchado','desgastado','perdido','outro') NOT NULL DEFAULT 'desgastado',
  descricao       TEXT         NULL,
  valor_estimado  DECIMAL(10,2) NULL,
  registrado_por  INT          NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uniforme_id)    REFERENCES lav_uniformes(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_lav_desc_data (created_at)
);

CREATE TABLE IF NOT EXISTS lav_reparos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uniforme_id     INT          NULL,
  tipo_item       VARCHAR(80)  NOT NULL DEFAULT 'uniforme',
  tipo_reparo     ENUM('botao','ziper','remendo','costura_geral','outro') NOT NULL DEFAULT 'costura_geral',
  descricao       TEXT         NULL,
  data_entrada    DATE         NOT NULL,
  data_retorno    DATE         NULL,
  status          ENUM('aguardando','em_reparo','concluido','sem_conserto') NOT NULL DEFAULT 'aguardando',
  responsavel     VARCHAR(150) NULL,
  registrado_por  INT          NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uniforme_id)    REFERENCES lav_uniformes(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_lav_rep_status (status)
);

CREATE TABLE IF NOT EXISTS lav_inventarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  data_inventario DATE         NOT NULL,
  registrado_por  INT          NOT NULL,
  status          ENUM('em_andamento','finalizado') NOT NULL DEFAULT 'em_andamento',
  observacoes     TEXT         NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_lav_inv_data (data_inventario)
);

CREATE TABLE IF NOT EXISTS lav_inventarios_itens (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  inventario_id   INT          NOT NULL,
  tipo_peca       VARCHAR(100) NOT NULL,
  em_uso          INT          NOT NULL DEFAULT 0,
  em_estoque      INT          NOT NULL DEFAULT 0,
  sujas           INT          NOT NULL DEFAULT 0,
  em_reparo       INT          NOT NULL DEFAULT 0,
  descartadas     INT          NOT NULL DEFAULT 0,
  observacoes     TEXT         NULL,
  FOREIGN KEY (inventario_id) REFERENCES lav_inventarios(id) ON DELETE CASCADE,
  INDEX idx_lav_inv_item (inventario_id)
);

CREATE TABLE IF NOT EXISTS lav_armarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(20)  NOT NULL UNIQUE,
  tipo_vestiario  ENUM('masculino','feminino','misto') NOT NULL DEFAULT 'misto',
  localizacao     VARCHAR(150) NULL,
  funcionario_id  INT          NULL,
  status          ENUM('disponivel','ocupado','manutencao') NOT NULL DEFAULT 'disponivel',
  observacao      TEXT         NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_lav_arm_status (status)
);

CREATE TABLE IF NOT EXISTS lav_epis_registros (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id  INT          NOT NULL,
  tipo_epi        ENUM('luva_termica','mascara','oculos','avental_quimico','outro') NOT NULL,
  data_verificacao DATE        NOT NULL,
  em_uso          TINYINT(1)   NOT NULL DEFAULT 1,
  condicao        ENUM('bom','regular','substituir') NOT NULL DEFAULT 'bom',
  verificado_por  INT          NOT NULL,
  observacao      TEXT         NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id),
  FOREIGN KEY (verificado_por) REFERENCES usuarios(id),
  INDEX idx_lav_epi_func (funcionario_id),
  INDEX idx_lav_epi_data (data_verificacao)
);

CREATE TABLE IF NOT EXISTS lav_escalas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT          NULL,
  funcionario_nome VARCHAR(150) NULL,
  turno           ENUM('manha','tarde','noite','plantao') NOT NULL DEFAULT 'manha',
  data_inicio     DATE         NOT NULL,
  data_fim        DATE         NOT NULL,
  tipo            ENUM('normal','ferias','folga','plantao') NOT NULL DEFAULT 'normal',
  observacao      TEXT         NULL,
  criado_por_id   INT          NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por_id) REFERENCES usuarios(id),
  INDEX idx_lav_esc_data (data_inicio, data_fim)
);

-- ==============================
-- SERVIÇOS GERAIS
-- ==============================

CREATE TABLE IF NOT EXISTS sg_atividades (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  tipo              ENUM(
    'ervas_daninhas','manutencao_cerca','limpeza_externa',
    'reparo_alvenaria','pintura','limpeza_calha_telhado',
    'limpeza_caixa_agua','limpeza_caixa_gordura',
    'hidrojateamento','controle_pragas','outro'
  ) NOT NULL DEFAULT 'outro',
  titulo            VARCHAR(200) NOT NULL,
  local             VARCHAR(200) NULL,
  descricao         TEXT         NULL,
  data_execucao     DATE         NOT NULL,
  data_conclusao    DATE         NULL,
  status            ENUM('planejado','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'planejado',
  responsavel_id    INT          NULL,
  responsavel_nome  VARCHAR(150) NULL,
  produto_utilizado VARCHAR(150) NULL,
  observacao        TEXT         NULL,
  registrado_por    INT          NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_sg_atv_tipo   (tipo),
  INDEX idx_sg_atv_status (status),
  INDEX idx_sg_atv_data   (data_execucao)
);

CREATE TABLE IF NOT EXISTS sg_ferramentas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(40)  NOT NULL UNIQUE,
  nome              VARCHAR(150) NOT NULL,
  tipo              ENUM('manual','motorizada','eletronica','outro') NOT NULL DEFAULT 'manual',
  quantidade        INT          NOT NULL DEFAULT 1,
  quantidade_minima INT          NOT NULL DEFAULT 1,
  localizacao       VARCHAR(150) NULL,
  status            ENUM('disponivel','em_uso','em_manutencao','extraviado') NOT NULL DEFAULT 'disponivel',
  observacao        TEXT         NULL,
  ativo             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sg_ferr_status (status)
);

CREATE TABLE IF NOT EXISTS sg_ferramentas_movimentos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  ferramenta_id     INT          NOT NULL,
  tipo_movimento    ENUM('retirada','devolucao','manutencao','extravio','ajuste') NOT NULL,
  usuario_id        INT          NULL,
  quantidade        INT          NOT NULL DEFAULT 1,
  observacao        TEXT         NULL,
  registrado_por    INT          NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ferramenta_id) REFERENCES sg_ferramentas(id),
  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_sg_ferr_mov_ferr (ferramenta_id)
);

CREATE TABLE IF NOT EXISTS sg_insumos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(150) NOT NULL,
  tipo              ENUM('combustivel','cimento','tinta','fertilizante','herbicida','outro') NOT NULL DEFAULT 'outro',
  unidade           VARCHAR(20)  NOT NULL DEFAULT 'L',
  estoque_atual     DECIMAL(10,3) NOT NULL DEFAULT 0,
  estoque_minimo    DECIMAL(10,3) NOT NULL DEFAULT 0,
  observacao        TEXT         NULL,
  ativo             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sg_ins_ativo (ativo)
);

CREATE TABLE IF NOT EXISTS sg_insumos_uso (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id         INT           NOT NULL,
  quantidade        DECIMAL(10,3) NOT NULL,
  data_uso          DATE          NOT NULL,
  equipamento       VARCHAR(150)  NULL,
  responsavel_id    INT           NULL,
  observacao        TEXT          NULL,
  registrado_por    INT           NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insumo_id)      REFERENCES sg_insumos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  INDEX idx_sg_ins_uso_data (data_uso)
);

CREATE TABLE IF NOT EXISTS sg_cronograma_jardinagem (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(200) NOT NULL,
  tipo              ENUM('corte_grama','poda','manutencao_paisagistica','adubacao','outro') NOT NULL DEFAULT 'corte_grama',
  local             VARCHAR(200) NULL,
  data_prevista     DATE         NOT NULL,
  data_realizada    DATE         NULL,
  status            ENUM('agendado','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'agendado',
  responsavel_id    INT          NULL,
  responsavel_nome  VARCHAR(150) NULL,
  observacao        TEXT         NULL,
  criado_por        INT          NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por)     REFERENCES usuarios(id),
  INDEX idx_sg_jard_data   (data_prevista),
  INDEX idx_sg_jard_status (status)
);

CREATE TABLE IF NOT EXISTS sg_pendencias_auditoria (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(200) NOT NULL,
  descricao         TEXT         NULL,
  local             VARCHAR(200) NULL,
  responsavel       VARCHAR(150) NULL,
  prazo             DATE         NULL,
  status            ENUM('pendente','em_correcao','corrigido','nao_conformidade') NOT NULL DEFAULT 'pendente',
  origem            VARCHAR(100) NULL,
  criado_por        INT          NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  INDEX idx_sg_aud_status (status),
  INDEX idx_sg_aud_prazo  (prazo)
);

CREATE TABLE IF NOT EXISTS sg_escalas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id        INT          NULL,
  funcionario_nome  VARCHAR(150) NULL,
  turno             ENUM('manha','tarde','noite','plantao') NOT NULL DEFAULT 'manha',
  data_inicio       DATE         NOT NULL,
  data_fim          DATE         NOT NULL,
  tipo              ENUM('normal','ferias','folga','plantao') NOT NULL DEFAULT 'normal',
  observacao        TEXT         NULL,
  criado_por_id     INT          NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por_id) REFERENCES usuarios(id),
  INDEX idx_sg_esc_data (data_inicio, data_fim)
);
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
-- ============================================================
-- Módulo Qualidade — tabelas auxiliares
-- Executar após schema.sql (tabelas base já existem)
-- ============================================================

CREATE TABLE IF NOT EXISTS qua_analises_leite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_analise DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numero_tanque VARCHAR(50),
  lote VARCHAR(50),
  temperatura DECIMAL(5,2),
  alizarol ENUM('negativo','positivo') NOT NULL,
  acidez DECIMAL(5,2) COMMENT 'Dornic',
  densidade DECIMAL(8,4),
  gordura DECIMAL(5,2),
  cbt INT COMMENT 'Contagem Bacteriana Total x1000',
  ccs INT COMMENT 'Contagem de Células Somáticas x1000',
  resultado ENUM('aprovado','reprovado','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id),
  INDEX idx_analise_data (data_analise)
);

CREATE TABLE IF NOT EXISTS qua_nao_conformidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,
  tipo ENUM('interna','externa','fornecedor','processo') NOT NULL,
  setor_origem_id INT,
  descricao TEXT NOT NULL,
  causa_raiz TEXT,
  acao_corretiva TEXT,
  acao_preventiva TEXT,
  produto_id INT,
  lote VARCHAR(50),
  data_ocorrencia DATE NOT NULL,
  data_prazo DATE,
  data_encerramento DATE,
  status ENUM('aberta','em_investigacao','acao_pendente','verificacao','encerrada') DEFAULT 'aberta',
  responsavel_id INT,
  aberto_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (setor_origem_id) REFERENCES departamentos(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  FOREIGN KEY (aberto_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS qua_monitoramento_ambiental (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_coleta DATE NOT NULL,
  ponto_coleta VARCHAR(200) NOT NULL,
  tipo ENUM('swab_superficie','ar','agua') NOT NULL,
  resultado ENUM('conforme','nao_conforme','pendente') DEFAULT 'pendente',
  micro_detectado VARCHAR(200),
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS qua_controle_aguas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data_coleta DATE NOT NULL,
  ponto_coleta VARCHAR(150) NOT NULL,
  ph DECIMAL(5,2),
  cloro DECIMAL(5,2),
  turbidez DECIMAL(5,2),
  coliformes ENUM('ausente','presente') DEFAULT 'ausente',
  resultado ENUM('conforme','nao_conforme','pendente') DEFAULT 'pendente',
  analista_id INT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analista_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS qua_escalas (
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
-- ============================================================
-- COMPRAS — tabelas extras (execute uma vez)
-- ============================================================

CREATE TABLE IF NOT EXISTS com_cotacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_compra_id INT NOT NULL,
  fornecedor_id INT NOT NULL,
  valor_total DECIMAL(12,2),
  prazo_entrega_dias INT,
  condicoes_pagamento VARCHAR(200),
  observacao TEXT,
  selecionado TINYINT(1) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_compra_id) REFERENCES pedidos_compra(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

CREATE TABLE IF NOT EXISTS com_escalas (
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
