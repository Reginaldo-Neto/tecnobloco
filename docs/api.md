# Referência da API — Tecnobloco ERP

Base URL: `http://localhost:3001/api`

Autenticação: `Authorization: Bearer {token}` em todas as rotas protegidas.

---

## Health

### GET /api/health
Verifica se o servidor está online. Sem autenticação.

**Response:**
```json
{ "success": true, "status": "online", "version": "2.0.0", "time": "2026-01-01T00:00:00Z" }
```

---

## Feature Flags

### GET /api/feature-flags
Retorna quais módulos estão habilitados. Sem autenticação.

**Response:**
```json
{
  "success": true,
  "flags": {
    "dashboard": { "enabled": true },
    "manutencao": { "enabled": true },
    "admin": { "enabled": true }
  }
}
```

---

## Autenticação — /api/auth

### POST /api/auth/login
**Público.** Máximo 10 tentativas por 15min.

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
  "usuario": { "id": 1, "nome": "Admin Master", "nivel_acesso": 7, "departamento": "Administração" }
}
```

---

### GET /api/auth/me
**Requer auth.**

---

### POST /api/auth/logout
**Requer auth.**

---

### PUT /api/auth/alterar-senha
**Requer auth.**

**Body:** `{ "senhaAtual": "1234", "novaSenha": "nova" }`

---

## Manutenção — /api/manutencao

Nível mínimo: **1** para visualizar, **2** para atualizar status, **3** para criar equipamentos.

### GET /api/manutencao/stats
Retorna contadores do dashboard de manutenção.

**Response:**
```json
{
  "success": true,
  "data": {
    "osAberta": 5,
    "osEmAndamento": 2,
    "osAguardando": 1,
    "osCritica": 1,
    "osAlta": 3,
    "preventivaProxima": 4,
    "ferramentasEmUso": 2,
    "pecasAbaixoMin": 1,
    "calibracoesVencidas": 0
  }
}
```

---

### GET /api/manutencao/os
Lista ordens de serviço.

**Query params:** `status`, `prioridade`, `tipo`, `equipamento_id`

---

### POST /api/manutencao/os
Cria nova OS. **Nível ≥ 1.**

**Body:**
```json
{
  "equipamento_id": 1,
  "tipo": "corretiva",
  "prioridade": "alta",
  "descricao": "Motor com ruído anormal",
  "motivo_manutencao": "Vibração excessiva detectada pelo operador",
  "causa_raiz": "Rolamento desgastado",
  "data_previsao": "2026-06-20"
}
```

---

### GET /api/manutencao/os/:id
Busca OS com apontamentos incluídos.

---

### PATCH /api/manutencao/os/:id/status
Atualiza status da OS. **Nível ≥ 2.**

**Body:** `{ "status": "em_andamento", "observacao_tecnico": "...", "tecnico_id": 3 }`

---

### POST /api/manutencao/os/:id/apontar
Registra horas e peças numa OS. **Nível ≥ 2.**

**Body:**
```json
{
  "data_apontamento": "2026-06-14",
  "horas_trabalhadas": 2.5,
  "descricao_servico": "Substituição do rolamento",
  "peca_id": 5,
  "qtd_pecas": 1
}
```

---

### GET /api/manutencao/equipamentos
Lista equipamentos.

**Query params:** `status`, `departamento_id`

---

### POST /api/manutencao/equipamentos
Cria equipamento. **Nível ≥ 3.**

**Body:**
```json
{
  "codigo": "EQ-001",
  "nome": "Mesa Vibratória MV-500",
  "tipo": "Mesa vibratória",
  "departamento_id": 1,
  "marca": "Schwing",
  "modelo": "MV-500",
  "localizacao": "Galpão A"
}
```

---

### PUT /api/manutencao/equipamentos/:id
Atualiza equipamento. **Nível ≥ 3.**

---

### POST /api/manutencao/equipamentos/:id/manual
Upload do manual PDF. **Nível ≥ 2.** Multipart/form-data.

**Field:** `manual` (arquivo PDF, máx 20MB)

**Response:**
```json
{ "success": true, "message": "Manual enviado com sucesso", "path": "/uploads/manuals/manual-1234.pdf" }
```

---

### GET /api/manutencao/equipamentos/:id/prontuario
Retorna histórico completo do equipamento (OS + preventivas + totais).

---

### GET /api/manutencao/preventiva
Lista planos de manutenção preventiva.

---

### POST /api/manutencao/preventiva
Cria plano preventivo. **Nível ≥ 3.**

**Body:**
```json
{
  "equipamento_id": 1,
  "titulo": "Lubrificação mensal",
  "tipo": "lubrificacao",
  "frequencia_tipo": "mensal",
  "proxima_data": "2026-07-01",
  "responsavel_id": 3,
  "checklist": ["Verificar nível de óleo", "Aplicar graxa nos mancais"]
}
```

---

### POST /api/manutencao/preventiva/:id/executar
Marca preventiva como executada e agenda a próxima. **Nível ≥ 2.**

---

### GET /api/manutencao/pecas
Lista peças MRO.

**Query params:** `categoria`, `busca`

---

### POST /api/manutencao/pecas
Cria peça. **Nível ≥ 3.**

---

### POST /api/manutencao/pecas/:id/movimentar
Registra entrada/saída/ajuste de estoque. **Nível ≥ 2.**

---

### GET /api/manutencao/ativos
Lista árvore de ativos hierárquica.

---

## Admin — /api/admin

Nível mínimo: **5** para visualizar, **7** para criar/editar.

### GET /api/admin/usuarios
Lista usuários.

### POST /api/admin/usuarios
Cria usuário.

**Body:**
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@empresa.com",
  "senha": "senha123",
  "nivel_acesso": 3,
  "departamento_id": 6
}
```

### PUT /api/admin/usuarios/:id
Atualiza usuário.

### PATCH /api/admin/usuarios/:id/toggle-ativo
Ativa/desativa usuário.

### GET /api/admin/departamentos
Lista departamentos.

---

## Códigos de Erro

| Código | Significado |
|---|---|
| 400 | Bad Request — dados inválidos ou ausentes |
| 401 | Unauthorized — token ausente, inválido ou expirado |
| 403 | Forbidden — nível de acesso insuficiente |
| 404 | Not Found — recurso não encontrado |
| 409 | Conflict — duplicidade (CPF/código já cadastrado) |
| 429 | Too Many Requests — rate limit excedido (padrão: 500/15min) |
| 500 | Internal Server Error — erro não tratado |
| 503 | Service Unavailable — módulo desabilitado via feature flag |
