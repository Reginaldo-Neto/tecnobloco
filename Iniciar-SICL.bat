@echo off
chcp 65001 >nul
title Tecnobloco — Iniciando...
cd /d "%~dp0"

:: ============================================================
:: Iniciar-Tecnobloco.bat — Inicia o servidor Tecnobloco e abre o navegador
:: Use este arquivo no dia a dia para abrir o sistema.
:: ============================================================

:: Verificar se Node.js esta disponivel
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERRO] Node.js nao encontrado.
    echo  Execute INSTALAR.bat primeiro para configurar o ambiente.
    echo.
    pause
    exit /b 1
)

:: Verificar se o projeto existe
if not exist "backend\server.js" (
    echo.
    echo  [ERRO] backend\server.js nao encontrado.
    echo  Certifique-se de estar na pasta raiz do projeto Tecnobloco.
    echo.
    pause
    exit /b 1
)

:: Verificar se o .env existe
if not exist "backend\.env" (
    echo.
    echo  [AVISO] backend\.env nao encontrado.
    echo  Execute INSTALAR.bat antes de iniciar o sistema.
    echo.
    pause
    exit /b 1
)

:: Verificar se o Tecnobloco ja esta rodando na porta 3001
netstat -ano 2>nul | find ":3001 " | find "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  Tecnobloco ja esta rodando. Abrindo no navegador...
    start "" "http://localhost:3001"
    exit /b 0
)

echo.
echo  =====================================================
echo   Iniciando Tecnobloco...
echo  =====================================================
echo.

:: Iniciar o servidor Node.js em segundo plano (janela minimizada)
start "Tecnobloco Backend" /min cmd /c "cd /d "%~dp0backend" && node server.js"

echo  Aguardando o servidor inicializar...

:: Aguardar ate 40 segundos para o servidor responder
set /a tentativas=0
:aguardar
set /a tentativas+=1
if %tentativas% gtr 40 (
    echo.
    echo  [AVISO] Servidor demorou para responder. Abrindo navegador mesmo assim...
    goto abrir_browser
)

:: Pausa de 1 segundo
timeout /t 1 /nobreak >nul 2>&1

:: Verificar se o servidor respondeu (usa PowerShell para compatibilidade maxima)
powershell -Command "try { $r=(Invoke-WebRequest 'http://localhost:3001/api/health' -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop).StatusCode; if($r -eq 200){exit 0} else {exit 1} } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto aguardar

echo  [OK] Servidor iniciado!

:abrir_browser
echo.
echo  =====================================================
echo   Tecnobloco esta rodando em http://localhost:3001
echo.
echo   Login:  CPF  = 000.000.000-00
echo           Senha = 1234
echo  =====================================================
echo.
echo  Para parar o servidor, execute: Parar-Tecnobloco.bat
echo  (ou feche a janela "Tecnobloco Backend" na barra de tarefas)
echo.

:: Abrir o navegador padrao
start "" "http://localhost:3001"

exit /b 0
