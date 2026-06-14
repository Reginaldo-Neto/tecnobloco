# Tecnobloco ERP — Sistema de Gestão de Manutenção Industrial

Sistema web para gestão de ativos e manutenção de máquinas em empresa de fabricação de blocos, tubos e concreto.

## Stack

- **Backend:** Node.js + Express.js (CommonJS)
- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem build)
- **Banco de dados:** MySQL 8.0
- **Autenticação:** JWT (8h) + bcryptjs
- **Queries:** mysql2/promise (sem ORM)
- **Deploy:** Railway (Node.js + MySQL plugin)

## Módulos Ativos

| Módulo | Rota API | Descrição |
|---|---|---|
| Autenticação | `/api/auth` | Login, logout, troca de senha |
| Manutenção | `/api/manutencao` | Equipamentos, OS, preventivas, peças, ferramentas |
| Admin | `/api/admin` | Gestão de usuários e departamentos |
| Dashboard | `/api/dashboard` | Indicadores e estatísticas |

Outros módulos existem no código mas estão **desabilitados** via `shared/feature-flags.json`.

## Instalação Local

```bash
# 1. Instalar dependências
cd backend
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com suas configurações (DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET)

# 3. Criar banco e tabelas
node scripts/setup-db.js

# 4. Iniciar servidor
npm run dev        # desenvolvimento (hot-reload)
npm start          # produção
```

Acesse: `http://localhost:3001`

**Credenciais padrão:**
- CPF: `000.000.000-00`
- Senha: `1234`

## Variáveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e preencha:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=tecnobloco
JWT_SECRET=<gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
RATE_LIMIT_MAX=500
```

## Deploy no Railway

O projeto está configurado para Railway com `railway.json` na raiz.

**Passos:**
1. Push para GitHub
2. Criar projeto no Railway → Deploy from GitHub
3. Adicionar MySQL plugin
4. Configurar variáveis de ambiente no painel (ver `backend/.env.example`)
5. No Shell do serviço: `node scripts/setup-db.js`

**Variáveis Railway para o serviço Node:**
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=<gerar e colar manualmente>
NODE_ENV=production
RATE_LIMIT_MAX=500
```

## Estrutura do Projeto

```
├── backend/
│   ├── config/            Pool MySQL e constantes globais
│   ├── scripts/           setup-db.js (cria banco + admin)
│   ├── uploads/manuals/   PDFs de manuais de equipamentos
│   └── src/
│       ├── app.js         Express: middleware, CORS, CSP, rotas
│       ├── controllers/   HTTP input/output
│       ├── middleware/    auth, audit, rate-limit, error-handler
│       ├── routes/        index.js registra todas as rotas
│       ├── services/      Lógica de negócio (raw SQL)
│       └── utils/         logger, errorHandler, helpers
├── database/
│   ├── schema.sql         Schema principal (core + manutenção)
│   ├── migrations/        Migrações incrementais
│   └── seeds/             Dados iniciais (departamentos)
├── frontend/
│   ├── index.html         Página de login
│   ├── assets/
│   │   ├── css/styles.css Design system completo
│   │   ├── js/api.js      Fetch wrapper com JWT
│   │   └── js/components.js Sidebar, topbar, toast, confirm
│   └── pages/
│       ├── dashboard/
│       ├── manutencao/    index.html + equipamentos.html
│       └── admin/
├── shared/
│   └── feature-flags.json Habilita/desabilita módulos
├── docs/
│   ├── api.md             Referência de endpoints
│   └── arquitetura.md     Decisões técnicas
├── railway.json           Configuração de deploy Railway
└── CLAUDE.md              Contexto para Claude Code
```

## Funcionalidades de Manutenção

### Equipamentos
- Cadastro com código, nome, tipo, departamento, marca, modelo, localização
- Upload de manual em PDF (armazenado em `backend/uploads/manuals/`)
- Prontuário: histórico de OS e preventivas por equipamento
- Status: operacional, em manutenção, inativo, sucata

### Ordens de Serviço (OS)
- Tipos: preventiva, corretiva, preditiva, emergencial
- Prioridades: baixa, média, alta, crítica
- Campos: descrição, **motivo da manutenção**, **causa raiz**, observação do técnico
- Status: aberta → em andamento → aguardando peça → concluída / cancelada
- Apontamentos de horas e peças utilizadas

### Manutenção Preventiva
- Planos com frequência configurável (diária a anual)
- Checklist em JSON
- Geração automática de OS ao executar

### Peças MRO
- Estoque com saldo mínimo e alertas
- Movimentações vinculadas às OS

## Níveis de Acesso

| Nível | Perfil | O que pode fazer |
|---|---|---|
| 7 | Admin / Dono | Tudo |
| 6 | Diretor | Tudo exceto configurações de sistema |
| 5 | Gerente | Aprovações e relatórios |
| 4 | Supervisor | Gerenciar OS e equipamentos |
| 3 | Operador | Criar OS e atualizar status |
| 2 | Auxiliar | Criar OS básicas |
| 1 | Estagiário | Visualizar |
| 0 | Menor Aprendiz | Visualizar |

## Troubleshooting

**MySQL não conecta:**
- Windows: `net start MySQL80` como Administrador
- Verificar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` no `.env`

**Too Many Requests (429):**
- Aumentar `RATE_LIMIT_MAX` no `.env` (padrão: 500)

**PDF não abre:**
- Verificar se `objectSrc: ["'self'"]` está no CSP em `src/app.js`
- Railway: PDFs são perdidos a cada redeploy sem Volume configurado

**Campos de login escuros (Chrome autofill):**
- Resolvido via CSS `-webkit-box-shadow` inset em `assets/css/styles.css`
