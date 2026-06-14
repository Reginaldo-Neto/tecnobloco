# Tecnobloco ERP — Sistema de Gestão Industrial

Sistema ERP industrial para gestão completa de uma empresa de fabricação de concreto, tubos e materiais de construção civil.

## Stack

- **Backend:** Node.js + Express.js (CommonJS)
- **Frontend:** HTML5 + CSS3 + JavaScript puro
- **Banco de dados:** MySQL 8.0
- **Autenticação:** JWT (8h) + bcryptjs
- **Queries:** mysql2/promise (sem ORM)

## Módulos

| Módulo | Rota API |
|---|---|
| Autenticação | /api/auth |
| RH | /api/rh |
| Financeiro | /api/financeiro |
| Produção | /api/producao |
| Qualidade | /api/qualidade |
| Estoque | /api/estoque |
| Manutenção | /api/manutencao |
| Vendas | /api/vendas |
| Compras | /api/compras |
| Frota | /api/frota |
| Limpeza | /api/limpeza |
| Lavanderia | /api/lavanderia |
| TI / Suporte | /api/ti |
| Segurança | /api/seguranca |
| Jurídico | /api/juridico |
| Administração | /api/admin |
| Auditoria | /api/auditoria |
| Notificações | /api/notificacoes |

## Níveis de Acesso

| Nível | Perfil |
|---|---|
| 0 | Menor Aprendiz |
| 1 | Estagiário |
| 2 | Auxiliar |
| 3 | Operador |
| 4 | Supervisor |
| 5 | Gerente |
| 6 | Diretor |
| 7 | Admin / Dono |

## Instalação

```bash
# 1. Instalar dependências
cd backend
npm install

# 2. Configurar variáveis de ambiente
cp ../.env.example .env
# edite .env com suas configurações

# 3. Criar banco e rodar seeds
node scripts/setup-db.js

# 4. Iniciar servidor
npm start          # produção
npm run dev        # desenvolvimento (hot-reload)
```

Acesse: http://localhost:3001

**Credenciais padrão:**
- CPF: `000.000.000-00`
- Senha: `1234`

## Estrutura do Projeto

```
├── backend/           Node.js + Express
│   ├── config/        Banco e constantes globais
│   ├── scripts/       Setup de banco e seeds
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── modules/   Um diretório por domínio
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/          HTML + CSS + JS puro
│   ├── assets/        CSS, JS, imagens
│   ├── components/    Componentes reutilizáveis
│   └── pages/         Uma pasta por módulo
├── database/
│   ├── migrations/    Migrações versionadas
│   ├── seeds/         Dados iniciais
│   └── schema.sql     Schema completo
├── docs/              Documentação técnica
├── shared/            Constantes e helpers compartilhados
└── tests/             Testes backend e frontend
```

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [API](docs/api.md)
