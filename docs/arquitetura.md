# Arquitetura do Sistema — Tecnobloco ERP

## Visão Geral

O Tecnobloco ERP é um sistema web modular para indústria de construção civil, organizado em camadas bem definidas para facilitar manutenção e crescimento.

```
Browser ──► Express (Node.js) ──► MySQL 8.0
              │
              ├─ Middleware (auth, audit, rate-limit, error)
              ├─ Routes (por módulo)
              ├─ Controllers (receber/responder HTTP)
              ├─ Services (lógica de negócio)
              └─ Database (queries raw com mysql2/promise)
```

## Stack Técnica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Node.js 18+ + Express | Assíncrono, leve, amplo ecossistema |
| Frontend | HTML5 + CSS3 + JS puro | Zero dependências, carregamento rápido |
| Banco | MySQL 8.0 | Robustez, suporte JSON nativo, transações |
| Autenticação | JWT (8h) + bcryptjs | Stateless, escalável |
| Queries | mysql2/promise (sem ORM) | Controle total sobre SQL, performance |

## Estrutura de Camadas

### Backend

```
backend/
├── config/
│   ├── database.js      — pool de conexões MySQL
│   └── constants.js     — NIVEL, HTTP, AUDITORIA, MODULOS, ACOES
├── scripts/
│   └── setup-db.js      — cria banco, roda schema + seeds
├── src/
│   ├── app.js           — Express: middleware, rotas, static
│   ├── middleware/
│   │   ├── auth.middleware.js         — authenticate, requireNivel, requireDepartamento
│   │   ├── audit.middleware.js        — logAudit(), req.audit()
│   │   ├── error-handler.middleware.js — handler global de erros
│   │   └── rate-limit.middleware.js   — apiLimiter, authLimiter
│   ├── utils/
│   │   ├── logger.js       — Winston (console + arquivo)
│   │   ├── errorHandler.js — AppError e helpers (notFound, forbidden, etc.)
│   │   └── helpers.js      — CPF, paginação, pick, omitEmpty
│   ├── routes/
│   │   ├── index.js        — registra todas as rotas + health check
│   │   ├── auth.routes.js  — /api/auth/*
│   │   └── {modulo}.routes.js — um arquivo por módulo
│   ├── controllers/
│   │   └── {modulo}/{Modulo}Controller.js
│   ├── services/
│   │   └── {modulo}/{Modulo}Service.js
│   └── modules/
│       └── {modulo}/index.js — ponto de entrada de cada domínio
└── server.js            — entry point, bind na porta
```

### Frontend

```
frontend/
├── index.html           — página de login
├── assets/
│   ├── css/styles.css   — design system completo
│   ├── js/api.js        — wrapper fetch com JWT + gestão de sessão
│   └── js/components.js — initPage, sidebar, topbar, toast, confirm
├── components/          — componentes HTML reutilizáveis
└── pages/
    ├── dashboard.html
    └── {modulo}/        — pasta por módulo
```

## Hierarquia de Acesso

| Nível | Perfil | Acesso |
|---|---|---|
| 7 | Admin / Dono | Tudo, sem restrições |
| 6 | Diretor | Todos os módulos + relatórios |
| 5 | Gerente | Módulos do setor + aprovações |
| 4 | Supervisor | Operação + aprovações de 1º nível |
| 3 | Operador | Criar/editar registros do setor |
| 2 | Auxiliar | Criar registros básicos |
| 1 | Estagiário | Visualizar e criar rascunhos |
| 0 | Menor Aprendiz | Apenas visualizar |

## Fluxo de Autenticação

```
1. POST /api/auth/login { identifier, senha }
   ├─ identifier pode ser CPF (com/sem máscara) ou e-mail
   └─ IP do servidor configurável no frontend

2. Backend valida → gera JWT (8h)
3. Frontend armazena em localStorage: tb_token, tb_user
4. Toda requisição envia: Authorization: Bearer {token}
5. authenticate middleware valida JWT + verifica usuário ativo no banco
6. requireNivel(N) verifica nível de acesso
```

## Trilha de Auditoria

Toda operação sensível é registrada na tabela `auditoria_log`:
- Quem (usuario_id)
- O quê (tipo_evento: LOGIN, CRIACAO, ALTERACAO, EXCLUSAO...)
- Onde (tabela_afetada, registro_id)
- Estado antes/depois (dados_antes, dados_depois em JSON)
- IP e User-Agent
- Quando (criado_em)

Uso nos controllers:
```js
await req.audit('CRIACAO', 'colaboradores', novoId, { depois: dadosCriados });
```

## Padrão de Response da API

```json
// Sucesso
{ "success": true, "data": {...}, "message": "..." }

// Erro
{ "success": false, "message": "Mensagem legível", "details": [...] }
```

## Adicionando Novos Módulos

1. Criar `src/routes/{modulo}.routes.js`
2. Criar `src/controllers/{modulo}/{Modulo}Controller.js`
3. Criar `src/services/{modulo}/{Modulo}Service.js`
4. Descomentar a linha em `src/routes/index.js`
5. Adicionar tabelas em `database/migrations/`
6. Criar páginas em `frontend/pages/{modulo}/`
7. Adicionar item ao menu em `frontend/assets/js/components.js`
