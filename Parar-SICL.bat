@echo off
chcp 65001 >nul
title Tecnobloco — Parando servidor

:: ============================================================
:: Parar-Tecnobloco.bat — Para o servidor Node.js do Tecnobloco
:: ============================================================

:: Verificar se ha algum processo na porta 3001
netstat -ano 2>nul | find ":3001 " | find "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo.
    echo  Tecnobloco nao esta rodando no momento.
    echo.
    timeout /t 2 /nobreak >nul
    exit /b 0
)

echo.
echo  Parando o servidor Tecnobloco...

:: Obter o PID do processo na porta 3001 e finalizá-lo
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":3001 " ^| find "LISTENING"') do (
    if not "%%a"=="" (
        echo  Finalizando processo PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: Confirmar que parou
timeout /t 1 /nobreak >nul
netstat -ano 2>nul | find ":3001 " | find "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo  [OK] Tecnobloco parado com sucesso.
) else (
    echo  [AVISO] Processo ainda pode estar rodando. Tente fechar a janela "Tecnobloco Backend" manualmente.
)

echo.
timeout /t 2 /nobreak >nul
exit /b 0
