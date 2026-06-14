# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tecnobloco ERP** — sistema de gestão de manutenção industrial para empresa de fabricação de concreto, blocos e tubos. Foco em **cadastro de máquinas**, **ordens de serviço (OS)**, **manutenção preventiva/preditiva** e **análise de causa raiz**.

Single backend (Node.js/Express) serve tanto a API quanto o frontend como arquivos estáticos. Sem build step no frontend.

**Módulos ativos:** `dashboard`, `manutencao`, `admin`. Todos os outros estão desabilitados via `shared/feature-flags.json`.

## Commands

```bash
# Install dependencies
cd backend && npm install

# Create/reset the database (runs schema + seeds + creates admin user)
cd backend && node scripts/setup-db.js

# Development (hot-reload via nodemon)
cd backend && npm run dev

# Production
cd backend && npm start
```

Server runs on port **3001** (set in `backend/.env` → `PORT`; defaults to 3002 if not set).
Auto-kills any process on the same port at startup (Windows: `taskkill`, Linux: `fuser`).

Default credentials: CPF `000.000.000-00` / password `1234`.

MySQL database: `tecnobloco` (Railway: uses `railway` DB name from plugin).
Override via `backend/.env` — see `backend/.env.example` for all variables.

## Architecture

```
Browser → Express (Node.js) → MySQL 8.0
```

### Backend layers (`backend/src/`)

| Layer | Path | Role |
|---|---|---|
| Entry point | `server.js` | Binds port, opens browser in dev |
| App setup | `src/app.js` | Helmet CSP, CORS, body parser, static files, routes |
| Routes | `src/routes/index.js` | Registers all module routes + health check + feature-flags |
| Controllers | `src/controllers/{module}/` | HTTP input/output only |
| Services | `src/services/{module}/` | Business logic, raw SQL |
| Middleware | `src/middleware/` | auth, audit, rate-limit, error handler |
| Config | `config/database.js` | mysql2/promise pool |
| Config | `config/constants.js` | NIVEL, DEPARTAMENTO, HTTP, AUDITORIA constants |

### Key middleware

- **`auth.middleware.js`**: `authenticate` (validates JWT + checks user active in DB), `requireNivel(N)` (access level gate), `requireDepartamento(...depts)` (department gate; Diretores nivel≥6 bypass it)
- **`audit.middleware.js`**: injects `req.audit(tipo, tabela, id, {antes, depois})` — records to `auditoria_log`
- **`rate-limit.middleware.js`**: `apiLimiter` (500 req/15min global), `authLimiter` (10 req/15min on login)
- **`error-handler.middleware.js`**: global error handler; use `AppError` helpers from `src/utils/errorHandler.js`

### Frontend (`frontend/`)

Vanilla HTML + CSS + JS, no build tooling.

- `assets/js/api.js` — `API` object: all fetch calls, JWT injection, auto-redirect on 401. Server host in `localStorage.tb_server`; token in `localStorage.tb_token`
- `assets/js/components.js` — `initPage()`, sidebar, topbar, toast, confirm dialogs. Health poll every **60s** (not 5s — avoids rate limit). Security challenge every 300s — only logouts on `TypeError` (network down), not on server errors (429, 5xx).
- `pages/{module}/` — one folder per module

### API response contract

```js
// Success
{ success: true, data: {...}, message: "..." }

// Error
{ success: false, message: "Human-readable message", details: [...] }
```

### Access levels (constants.js `NIVEL`)

0 = Menor Aprendiz → 7 = Admin/Dono. Always use the `NIVEL` constants, not magic numbers.

### Audit trail

Every sensitive operation must call:
```js
await req.audit('CRIACAO', 'tabela_afetada', registroId, { antes: oldData, depois: newData });
```
Audit types are in `config/constants.js` → `AUDITORIA`.

## Manutenção Module — Key Details

The maintenance module (`/api/manutencao`) is the core of this system.

### Equipment (`equipamentos` table)
- Has `manual_pdf` column (VARCHAR 500) — stores file path to PDF manual
- Upload via `POST /equipamentos/:id/manual` with multer (disk storage, 20MB limit, PDF only)
- Files saved to `backend/uploads/manuals/`
- Served as static at `/uploads/`

### Work Orders (`ordens_servico` table)
Columns beyond the original schema:
- `motivo_manutencao TEXT` — why maintenance was needed
- `causa_raiz TEXT` — root cause identified
- `observacao_tecnico TEXT` — technician notes during execution
- `custo_total DECIMAL(10,2)` — calculated from `os_apontamentos`

### Routes access levels (manutencao.routes.js)
- `nivel >= 1` — view everything
- `nivel >= 2` — update OS status, upload manuals, create apontamentos
- `nivel >= 3` — create/edit equipment, create OS, create preventive plans

### Stats endpoint (`GET /api/manutencao/stats`)
Queries: `ordens_servico`, `manutencao_preventiva`, `ferramentas`, `pecas_manutencao` — all tables must exist.

## Feature Flags

Location: `shared/feature-flags.json`

To **disable** a module: set `"enabled": false`. Restart server. Sidebar link disappears and API returns 503.
To **re-enable**: set `"enabled": true` and restart.

Frontend fetches flags at `GET /api/feature-flags` (no auth). Backend uses `moduleRoute()` in `routes/index.js`.

**Currently enabled:** `dashboard`, `manutencao`, `admin`

## Database

### Schema location
`database/schema.sql` — applied by `setup-db.js`. Uses `CREATE TABLE IF NOT EXISTS` (idempotent).

### Active tables
**Core:** `departamentos`, `cargos`, `usuarios` (with `dashboard_rota`), `funcoes_sistema`, `perfis_permissao`, `perfis_funcoes`, `usuarios_perfis`, `auditoria_log`, `notificacoes`, `aprovacoes`

**Manutenção:** `fornecedores` (FK dep), `equipamentos` (with `manual_pdf`), `ordens_servico` (with `motivo_manutencao`, `causa_raiz`, `observacao_tecnico`, `custo_total`), `manutencao_preventiva`, `ativos_hierarquia`, `pecas_manutencao`, `movimentacoes_pecas`, `ferramentas`, `ferramentas_movimentacoes`, `os_apontamentos`

### Migrations
`database/migrations/` — all non-maintenance migrations are empty stubs (modules disabled). Only applied incremental changes: `dashboard_rota` column added inline in `setup-db.js`.

### Seeds
`database/seeds/initial.sql` — inserts 19 departments only. No business data.
`database/seeds/frota_demo.sql` — intentionally empty.

Admin Master (CPF `000.000.000-00` / senha `1234`) created by `setup-db.js` via bcrypt — not in SQL.

### Railway database name
When deployed on Railway, the MySQL plugin creates a DB named `railway` (not `tecnobloco`). The `DB_NAME` env var must be set to match.

## Deploy (Railway)

Configuration in `railway.json` at repo root.

Start command: `cd backend && npm start`

Required environment variables in Railway service:
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
NODE_ENV=production
RATE_LIMIT_MAX=500
```

After first deploy, run from Railway Shell: `node scripts/setup-db.js`

**PDF uploads on Railway:** `backend/uploads/` is auto-created on startup but is ephemeral (lost on redeploy). To persist, configure Railway Volume at `/app/backend/uploads`.

## Adding a new module

1. `src/routes/{module}.routes.js`
2. `src/controllers/{module}/{Module}Controller.js`
3. `src/services/{module}/{Module}Service.js`
4. Register in `src/routes/index.js`
5. Add DB tables in `database/migrations/{module}.sql`
6. Create pages in `frontend/pages/{module}/`
7. Add menu entry in `frontend/assets/js/components.js`
8. Enable in `shared/feature-flags.json`

## Conventions

- All `.js` files use `'use strict'` and CommonJS (`require`/`module.exports`)
- No ORM — raw SQL with `mysql2/promise` pool from `config/database.js`
- Code language: English; user-facing logs/prints: Portuguese
- All API routes (except `/api/auth/*`, `/api/health`, `/api/feature-flags`) require `authenticate` middleware
- localStorage prefix: always `tb_` (tb_token, tb_user, tb_server, tb_theme, tb_lang)

## localStorage Keys

| Key | Purpose |
|---|---|
| `tb_token` | JWT de sessão |
| `tb_user` | JSON do usuário logado |
| `tb_server` | IP do servidor (acesso remoto) |
| `tb_theme` | `'light'` ou ausente (dark) |
| `tb_lang` | `'pt'`, `'en'` ou `'es'` |
| `tb_remember_cpf` | CPF salvo no login |

## History & Decisions

### Origem do código
O projeto foi adaptado a partir de um ERP de laticínio (SICL). **Não reintroduzir** termos como SICL, szura, `sz_` (prefixo de localStorage), `szura_manager` (nome de banco), `admin@laticinio.com`, produtor rural, leite, queijo, etc.

### Banco de dados
- **Local:** banco `tecnobloco`, porta 3306, root/1234
- **Railway:** banco `railway` (nome definido pelo plugin MySQL)
- Criado com: `node scripts/setup-db.js`

### Departamentos no sistema (19)
TI, SAC, Limpeza, Lavanderia, Serviços Gerais, Frotas, Manutenção, Estoque, Qualidade, Produção, Administração, RH, Vendas, Financeiro, Segurança, Diretoria, Compras, Fornecedores, Clientes.

### Segurança / Desafio de sessão
`ChallengeService.js` usa palavras de construção civil: CONCRETO, BLOCO, TUBO, ARGAMASSA, CIMENTO, AREIA, BRITA, etc.

### Porta do servidor
Definida em `backend/.env` → `PORT=3001`. Padrão no código: 3002.

### Rate limit
`RATE_LIMIT_MAX=500` no `.env`. O `.env` sobrescreve o código — sempre verificar o arquivo se o limite parecer diferente do esperado.

### Health poll
`frontend/index.html` e `frontend/assets/js/components.js` fazem health poll a cada **60s** (não 5s — o intervalo de 5s causava 429 por esgotar o rate limit).

### Chrome autofill dark mode
`frontend/assets/css/styles.css` contém override via `-webkit-box-shadow: 0 0 0 1000px #1c2236 inset` para corrigir campos de login com fundo escuro no Chrome.

### CSP para PDFs
`src/app.js` tem `objectSrc: ["'self'"]` (não `"'none'"`) para permitir visualização de PDFs inline no browser.

## Known Issues / TODO

- PDFs de manuais são ephemeral no Railway sem Volume configurado — perdem-se no redeploy.
- `ALLOWED_ORIGINS` deve ser configurado em produção para restringir CORS ao domínio Railway.
- O schema ainda tem o modelo de migrations vazio para módulos desabilitados — futuras migrações de manutenção devem ir em `database/migrations/manutencao.sql` (criar o arquivo).
