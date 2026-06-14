# Referência da API — Tecnobloco ERP

Base URL: `http://localhost:3001/api`

Autenticação: `Authorization: Bearer {token}` em todas as rotas protegidas.

---

## Health

### GET /api/health
Verifica se o servidor está online.

**Response:**
```json
{ "success": true, "status": "online", "version": "1.0.0", "time": "2026-01-01T00:00:00Z" }
```

---

## Autenticação — /api/auth

### POST /api/auth/login
**Público.** Máximo 10 tentativas por 15min (anti-bruteforce).

**Body:**
```json
{ "identifier": "000.000.000-00", "senha": "1234" }
```
`identifier` aceita CPF (com/sem máscara) ou e-mail.

**Response 200:**
```json
{
  "success": true,
  "token": "eyJ...",
  "usuario": { "id": 1, "nome": "Admin", "nivel_acesso": 7, "departamento": "Administração" }
}
```

**Erros:** 400 (campos ausentes), 400 (CPF inválido), 401 (credenciais inválidas), 429 (limite excedido)

---

### GET /api/auth/me
**Requer autenticação.**

**Response 200:**
```json
{
  "success": true,
  "usuario": { "id": 1, "nome": "...", "cpf": "00000000000", "nivel_acesso": 7, ... }
}
```

---

### POST /api/auth/logout
**Requer autenticação.** Registra evento de auditoria.

**Response 200:**
```json
{ "success": true, "message": "Logout realizado com sucesso" }
```

---

### PUT /api/auth/alterar-senha
**Requer autenticação.**

**Body:**
```json
{ "senhaAtual": "1234", "novaSenha": "nova_senha_segura" }
```

**Response 200:**
```json
{ "success": true, "message": "Senha alterada com sucesso" }
```

**Erros:** 400 (senha atual incorreta), 400 (nova senha curta demais)

---

## Módulos em Implementação

Os módulos abaixo seguem o mesmo padrão REST. Cada um tem sua rota prefixada:

| Módulo | Prefixo | Nível Mínimo |
|---|---|---|
| RH | /api/rh | 4 |
| Financeiro | /api/financeiro | 5 |
| Produção | /api/producao | 3 |
| Qualidade | /api/qualidade | 4 |
| Estoque | /api/estoque | 3 |
| Manutenção | /api/manutencao | 3 |
| Vendas | /api/vendas | 3 |
| Compras | /api/compras | 4 |
| Frota | /api/frota | 3 |
| Limpeza | /api/limpeza | 2 |
| Lavanderia | /api/lavanderia | 2 |
| TI | /api/ti | 3 |
| Segurança | /api/seguranca | 3 |
| Jurídico | /api/juridico | 5 |
| Admin | /api/admin | 7 |
| Auditoria | /api/auditoria | 6 |
| Notificações | /api/notificacoes | 1 |

### Padrão REST por módulo
```
GET    /api/{modulo}        → listar (paginado)
POST   /api/{modulo}        → criar
GET    /api/{modulo}/:id    → buscar por ID
PUT    /api/{modulo}/:id    → atualizar
DELETE /api/{modulo}/:id    → remover (soft delete quando aplicável)
```

### Parâmetros de paginação
```
GET /api/{modulo}?page=1&limit=20&busca=texto&status=ativo
```

**Response paginado:**
```json
{
  "success": true,
  "data": [...],
  "paginacao": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

---

## Códigos de Erro

| Código | Significado |
|---|---|
| 400 | Bad Request — dados inválidos ou ausentes |
| 401 | Unauthorized — token ausente, inválido ou expirado |
| 403 | Forbidden — nível de acesso insuficiente |
| 404 | Not Found — recurso não encontrado |
| 409 | Conflict — duplicidade (CPF/e-mail já cadastrado) |
| 429 | Too Many Requests — rate limit excedido |
| 500 | Internal Server Error — erro não tratado |
