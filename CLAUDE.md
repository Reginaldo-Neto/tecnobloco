# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tecnobloco ERP** — sistema de gestão industrial para empresa de fabricação de concreto, tubos e materiais de construção civil. Foco principal em **gestão de ativos**, **ordens de serviço**, **manutenção preditiva/preventiva** e **análise de causa raiz**. Sistema modular com feature flags para habilitar/desabilitar módulos.

Single backend (Node.js/Express) serve tanto a API quanto o frontend como arquivos estáticos.

## Commands

```bash
# Install dependencies
cd backend && npm install

# Create/reset the database (runs schema + seeds)
cd backend && node scripts/setup-db.js

# Development (hot-reload via nodemon)
cd backend && npm run dev

# Production
cd backend && npm start
# or from root:
npm start
```

Server runs on port **3002** (auto-kills any process occupying that port on startup).  
Default credentials: CPF `000.000.000-00` / password `1234`.

MySQL database: `tecnobloco` (default connection: localhost:3306, user root, password 1234 — override via `backend/.env`).

## Architecture

```
Browser → Express (Node.js) → MySQL 8.0
```

The backend serves the frontend as static files from `frontend/` and exposes the API under `/api`. There is no build step for the frontend.

### Backend layers (`backend/src/`)

| Layer | Path | Role |
|---|---|---|
| Entry point | `server.js` | Binds port, opens browser |
| App setup | `src/app.js` | Helmet, CORS, body parsing, static files, routes |
| Routes | `src/routes/index.js` | Registers all module routes + health check |
| Controllers | `src/controllers/{module}/` | HTTP input/output only |
| Services | `src/services/{module}/` | Business logic |
| Middleware | `src/middleware/` | auth, audit, rate-limit, error handler |
| Config | `config/database.js` | mysql2/promise pool; `config/constants.js` for NIVEL, DEPARTAMENTO, HTTP, AUDITORIA |

### Key middleware

- **`auth.middleware.js`**: `authenticate` (validates JWT + checks user active in DB), `requireNivel(N)` (access level gate), `requireDepartamento(...depts)` (department gate; Diretores nivel≥6 bypass it)
- **`audit.middleware.js`**: injects `req.audit(tipo, tabela, id, {antes, depois})` — records to `auditoria_log`
- **`error-handler.middleware.js`**: global error handler; use `AppError` helpers from `src/utils/errorHandler.js` (`notFound`, `unauthorized`, `forbidden`, `badRequest`, etc.)

### Frontend (`frontend/`)

Vanilla HTML + CSS + JS, no build tooling.

- `assets/js/api.js` — `API` object: all fetch calls, JWT injection, auto-redirect on 401. Server host stored in `localStorage.tb_server`; token in `localStorage.tb_token`
- `assets/js/components.js` — `initPage()`, sidebar, topbar, toast notifications, confirm dialogs
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

## Feature Flags

Localização: `shared/feature-flags.json`

Para **ocultar** um módulo: abra o arquivo e mude `"enabled": true` para `"enabled": false` no módulo desejado. Reinicie o servidor. O menu lateral some automaticamente e a rota de API retorna 503.

Para **reativar**: mude de volta para `true` e reinicie.

O frontend busca as flags em `GET /api/feature-flags` (sem auth) e filtra o menu antes de renderizar. O backend lê o JSON na inicialização e usa `moduleRoute()` para registrar ou bloquear rotas condicionalmente.

## Adding a new module

1. `src/routes/{module}.routes.js`
2. `src/controllers/{module}/{Module}Controller.js`
3. `src/services/{module}/{Module}Service.js`
4. Register in `src/routes/index.js`
5. Add DB tables in `database/migrations/`
6. Create pages in `frontend/pages/{module}/`
7. Add menu entry in `frontend/assets/js/components.js`

## Conventions

- All `.js` files use `'use strict'` and CommonJS (`require`/`module.exports`)
- No ORM — raw SQL with `mysql2/promise` pool from `config/database.js`
- Code language: English; user-facing logs/prints: Portuguese
- All API routes (except `/api/auth/*` and `/api/health`) require `authenticate` middleware
- localStorage prefix: always `tb_` (tb_token, tb_user, tb_server, tb_theme, tb_lang)

## localStorage Keys

| Key | Purpose |
|---|---|
| `tb_token` | JWT de sessão |
| `tb_user` | JSON do usuário logado |
| `tb_server` | IP do servidor (quando acesso remoto) |
| `tb_theme` | `'light'` ou ausente (dark) |
| `tb_lang` | `'pt'`, `'en'` ou `'es'` |
| `tb_remember_cpf` | CPF salvo no login |

## Database Seeds

`database/seeds/` contém dois arquivos aplicados pelo `setup-db.js`:

- **`initial.sql`** — insere apenas os **departamentos** (19 setores). Cargos e plano de contas devem ser cadastrados pelo app.
- **`frota_demo.sql`** — vazio intencionalmente. Dados de frota são cadastrados pelo app.

O usuário **Admin Master** (CPF `000.000.000-00` / senha `1234`) é criado pelo próprio `setup-db.js` via bcrypt — não está no SQL.

## History & Decisions

Esta seção registra decisões tomadas para evitar re-discussão.

### Origem do código
O projeto foi adaptado a partir de um ERP de laticínio (SICL). Todas as referências ao laticínio foram removidas em maio/2026. Não reintroduzir termos como SICL, szura, `sz_` (prefixo de localStorage), `szura_manager` (nome de banco), `admin@laticinio.com`, produtor rural, leite, queijo, etc.

### Banco de dados
- Nome do banco: `tecnobloco`
- Porta padrão: 3306
- Usuário padrão: root / senha 1234 (ajustável via `backend/.env`)
- O banco deve ser criado com: `node scripts/setup-db.js`
- Seeds contêm apenas dados estruturais mínimos — todo dado de negócio é inserido pelo app

### Departamentos existentes no sistema
TI, SAC, Limpeza, Lavanderia, Serviços Gerais, Frotas, Manutenção, Estoque, Qualidade, Produção, Administração, RH, Vendas, Financeiro, Segurança, Diretoria, Compras, Fornecedores, Clientes.

### Segurança / Desafio de sessão
`ChallengeService.js` usa palavras do domínio de construção civil: CONCRETO, BLOCO, TUBO, ARGAMASSA, CIMENTO, AREIA, BRITA, etc.

### Feature flags
O arquivo `shared/feature-flags.json` controla quais módulos aparecem no menu e têm rotas ativas. O frontend lê em `/api/feature-flags` (sem auth). Não é necessário reiniciar para mudanças de flag — apenas recarregar a página, mas o backend precisa reiniciar para desbloquear/bloquear rotas.

### Porta do servidor
O servidor roda na porta **3002** por padrão (`backend/.env` → `PORT`). O `server.js` mata automaticamente qualquer processo na mesma porta ao iniciar.

## Known Issues / TODO

- O módulo de qualidade ainda possui colunas no banco com nomes dairy-específicos (`alizarol`, `cbt`, `ccs`) — são campos técnicos internos que não aparecem com esses nomes na UI, mas precisam de uma migration futura para renomear adequadamente.
- O arquivo `cargos e funções.txt` na raiz é um documento de especificação legado (do SICL) e pode ser removido ou reescrito para o contexto Tecnobloco.
- `frontend/assets/js/funcoes/produtores.js` mantém o nome de variável `FuncoesProdutores` por compatibilidade — internamente já usa departamento `Fornecedores`.
