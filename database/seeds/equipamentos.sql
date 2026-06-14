-- ============================================================
-- Tecnobloco ERP — Seed de Equipamentos Tagueados
-- Baseado no Relatório de Tagueamento 2026
-- Padrão de tag: [SETOR]-[TIPO]-[SEQUENCIAL]
-- ============================================================

-- Produção Principal: BV (Blocos Vibroprensados)
INSERT INTO equipamentos (codigo, nome, tipo, departamento_id, localizacao, status) VALUES
(
  'BV-MV-01',
  'Máquina MVP 4.12',
  'Vibroprensa',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor BV — Blocos Vibroprensados',
  'operacional'
),
(
  'BV-MB-01',
  'Máquina MBP 6 - I',
  'Vibroprensa',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor BV — Blocos Vibroprensados',
  'operacional'
),
(
  'BV-MB-02',
  'Máquina MBP 6 - II',
  'Vibroprensa',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor BV — Blocos Vibroprensados',
  'operacional'
),

-- Produção Principal: TC (Tubos de Concreto)
(
  'TC-PH-01',
  'Máquina PHA 1500',
  'Conformação por Pressão',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor TC — Tubos de Concreto',
  'operacional'
),
(
  'TC-CV-01',
  'Conjunto Vibratório — Tubos Especiais',
  'Conjunto Vibratório',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor TC — Tubos de Concreto',
  'operacional'
),

-- Produção Principal: CM (Componentes Moldados)
(
  'CM-MV-01',
  'Mesa Vibratória',
  'Mesa Vibratória',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor CM — Componentes Moldados',
  'operacional'
),

-- Apoio e Preparação: AP — CRÍTICOS (Misturadores)
(
  'AP-MS-01',
  'Misturador 1',
  'Misturador de Concreto',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor AP — Central de Mistura (CRÍTICO)',
  'operacional'
),
(
  'AP-MS-02',
  'Misturador 2',
  'Misturador de Concreto',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor AP — Central de Mistura (CRÍTICO)',
  'operacional'
),

-- Apoio e Preparação: AP — Silos
(
  'AP-SA-01',
  'Silos de Agregados',
  'Silo de Agregados',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor AP — Pátio de Agregados',
  'operacional'
),

-- Apoio e Preparação: AP — Logística
(
  'AP-PC-01',
  'Pá Carregadeira',
  'Veículo de Carga',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor AP — Pátio (Logística)',
  'operacional'
),
(
  'AP-ET-01',
  'Elevador de Tábuas',
  'Elevador de Tábuas',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor AP — Linha MVP (Logística)',
  'operacional'
),
(
  'AP-TP-01',
  'Transpallet — Linhas MBP',
  'Transpallet',
  (SELECT id FROM departamentos WHERE nome = 'Produção'),
  'Setor AP — Linhas MBP (Logística)',
  'operacional'
);
