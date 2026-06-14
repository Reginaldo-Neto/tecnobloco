#!/usr/bin/env bash
# Tecnobloco — Setup do Ambiente (Linux / macOS)
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
fail() { echo -e "${RED}[ERRO]${NC}  $1"; exit 1; }

echo ""
echo "============================================"
echo "  Tecnobloco — Setup do Ambiente"
echo "============================================"
echo ""

# Verificar Node.js
command -v node >/dev/null 2>&1 || fail "Node.js não encontrado. Instale em https://nodejs.org"
ok "Node.js $(node --version)"

# Verificar npm
command -v npm >/dev/null 2>&1 || fail "npm não encontrado."

# Garantir .env
if [ ! -f "backend/.env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example backend/.env
        ok "backend/.env criado a partir de .env.example"
        warn "Edite backend/.env com suas configurações antes de continuar."
        read -p "Pressione Enter para continuar..."
    else
        warn "backend/.env não encontrado. Usando variáveis padrão."
    fi
else
    ok "backend/.env encontrado."
fi

# Instalar dependências
echo ""
echo "[1/2] Instalando dependências..."
(cd backend && npm install --prefer-offline)
ok "Dependências instaladas."

# Setup do banco
echo ""
echo "[2/2] Configurando banco de dados..."
(cd backend && node scripts/setup-db.js) || {
    echo ""
    fail "Falha no setup do banco. Verifique:\n  - MySQL está rodando?\n  - Credenciais em backend/.env estão corretas?"
}

echo ""
echo "============================================"
echo "  Setup concluído com sucesso!"
echo ""
echo "  Para iniciar o sistema:"
echo "    npm run dev"
echo "============================================"
echo ""

read -p "Pressione Enter para iniciar o servidor agora..."
node scripts/dev.js
