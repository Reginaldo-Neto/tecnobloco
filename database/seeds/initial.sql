-- ============================================
-- Tecnobloco ERP — Dados Iniciais (Seeds)
-- MySQL 8.0
-- ============================================

USE tecnobloco;

-- ==============================
-- Departamentos
-- ==============================

INSERT INTO departamentos (nome, descricao) VALUES
  ('Diretoria',              'Diretoria executiva e alta gestão'),
  ('Administração',          'Administração geral, secretaria e apoio'),
  ('Financeiro',             'Financeiro, contabilidade e tesouraria'),
  ('RH',                     'Recursos Humanos, folha de pagamento e gestão de pessoal'),
  ('Compras',                'Compras, suprimentos e gestão de contratos'),
  ('TI',                     'Tecnologia da Informação e suporte de sistemas'),
  ('Vendas',                 'Comercial, atendimento a clientes e orçamentos'),
  ('Produção',               'Linha de produção de concreto, blocos e tubos pré-moldados'),
  ('Manutenção',             'Manutenção preventiva, corretiva e preditiva de equipamentos'),
  ('Qualidade',              'Controle de qualidade, laboratório e controle de traço'),
  ('Estoque',                'Almoxarifado, matéria-prima e controle de insumos'),
  ('Expedição',              'Carregamento, despacho e entrega de produtos'),
  ('Frotas',                 'Gestão da frota de caminhões e veículos'),
  ('Segurança do Trabalho',  'EPI, NRs, CIPA e segurança das instalações');

-- Nota: o usuário Admin Master é criado pelo script setup-db.js com bcrypt real.
-- Cargos são inseridos pelo setup-db.js com base nos departamentos acima.
