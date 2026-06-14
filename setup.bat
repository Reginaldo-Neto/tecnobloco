@echo off
chcp 65001 >nul
echo.
echo ============================================
echo  Tecnobloco — Setup do Ambiente (Windows)
echo ============================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado.
    echo        Instale em: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo [OK]   Node.js %%v

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado.
    pause
    exit /b 1
)

REM Garantir .env
if not exist "backend\.env" (
    if exist ".env.example" (
        echo [OK]   Criando backend\.env a partir de .env.example...
        copy ".env.example" "backend\.env" >nul
        echo [AVISO] Edite backend\.env com suas configuracoes de banco antes de continuar.
        echo.
        pause
    ) else (
        echo [AVISO] backend\.env nao encontrado. Usando variaveis padrao.
    )
) else (
    echo [OK]   backend\.env encontrado.
)

REM Instalar dependências
echo.
echo [1/2] Instalando dependencias...
cd backend
call npm install --prefer-offline
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)
echo [OK]   Dependencias instaladas.

REM Setup do banco
echo.
echo [2/2] Configurando banco de dados...
node scripts/setup-db.js
if errorlevel 1 (
    echo.
    echo [ERRO] Falha na configuracao do banco.
    echo        Verifique:
    echo          - MySQL esta rodando?
    echo          - Credenciais em backend\.env estao corretas?
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo  Setup concluido com sucesso!
echo.
echo  Para iniciar o sistema:
echo    npm run dev
echo.
echo  Ou pressione qualquer tecla para iniciar agora.
echo ============================================
echo.
pause

node scripts/dev.js
