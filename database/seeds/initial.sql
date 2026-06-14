-- ============================================
-- Tecnobloco ERP — Dados Iniciais (Seeds)
-- MySQL 8.0
-- ============================================

USE tecnobloco;

-- ==============================
-- Departamentos
-- ==============================

INSERT INTO departamentos (nome, descricao) VALUES
  ('TI',              'Tecnologia da Informação e Suporte'),
  ('SAC',             'Serviço de Atendimento ao Cliente'),
  ('Limpeza',         'Higienização e limpeza das instalações'),
  ('Lavanderia',      'Lavanderia industrial de uniformes e panos'),
  ('Serviços Gerais', 'Serviços gerais e apoio operacional'),
  ('Frotas',          'Gestão da frota de veículos'),
  ('Manutenção',      'Manutenção preventiva e corretiva de equipamentos'),
  ('Estoque',         'Controle de almoxarifado e estoque'),
  ('Qualidade',       'Controle de qualidade e laboratório'),
  ('Produção',        'Linha de produção de concreto e pré-moldados'),
  ('Administração',   'Administração geral e secretaria'),
  ('RH',              'Recursos Humanos e gestão de pessoal'),
  ('Vendas',          'Comercial e força de vendas'),
  ('Financeiro',      'Financeiro, contabilidade e tesouraria'),
  ('Segurança',       'Segurança do trabalho e patrimonial'),
  ('Diretoria',       'Diretoria executiva e alta gestão'),
  ('Compras',         'Compras e suprimentos'),
  ('Fornecedores',    'Relacionamento com fornecedores de matéria-prima'),
  ('Clientes',        'Gestão de carteira de clientes');

-- Nota: o usuário Admin Master é criado pelo script setup-db.js com bcrypt real.
-- Cargos e Plano de Contas devem ser cadastrados pelo app.
