@echo off
chcp 65001 >nul
title Tecnobloco — Setup de Ambiente

:: ============================================================
:: INSTALAR.bat — Configura todo o ambiente de trabalho do Tecnobloco
:: Execute este arquivo UMA VEZ na maquina nova.
:: ============================================================

:: Auto-elevacao para Administrador (necessario para instalar Node.js, MySQL)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Solicitando permissoes de Administrador...
    echo  (Uma janela UAC sera exibida — clique em "Sim")
    echo.
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: Garantir que estamos na pasta correta do projeto
cd /d "%~dp0"

echo.
echo  =====================================================
echo   Tecnobloco — Setup de Ambiente para Windows
echo  =====================================================
echo.

:: Verificar se o script PowerShell existe
if not exist "setup-ambiente.ps1" (
    echo  [ERRO] setup-ambiente.ps1 nao encontrado!
    echo.
    echo  Certifique-se de executar este arquivo a partir da
    echo  raiz do projeto Tecnobloco (onde ficam as pastas backend/
    echo  e frontend/).
    echo.
    pause
    exit /b 1
)

:: Verificar se a pasta backend existe (confirmar que e o projeto certo)
if not exist "backend\server.js" (
    echo  [AVISO] backend\server.js nao encontrado.
    echo  Confirme que voce esta na pasta raiz do projeto Tecnobloco.
    echo.
    pause
)

:: Executar o script PowerShell principal
echo  Iniciando setup... (pode demorar alguns minutos)
echo  Um log detalhado sera salvo em logs\setup.log
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-ambiente.ps1" %*

:: Capturar codigo de saida
set exitcode=%errorlevel%

if %exitcode% neq 0 (
    echo.
    echo  [ERRO] O setup terminou com erros (codigo: %exitcode%).
    echo  Verifique o arquivo logs\setup.log para detalhes.
    echo.
    pause
    exit /b %exitcode%
)

exit /b 0
