@echo off
chcp 65001 >nul
title Tecnobloco ERP — Compilando INSTALAR.exe
cd /d "%~dp0"

:: ============================================================
:: Compilar-Exe.bat — Gera INSTALAR.exe a partir de setup-ambiente.ps1
::
:: USE ESTE ARQUIVO na maquina de desenvolvimento para gerar
:: um .exe distribuivel apos atualizar o setup-ambiente.ps1.
::
:: Nao requer Inno Setup nem modulo PS2EXE instalado:
:: baixa o compilador diretamente do GitHub.
::
:: Resultado: INSTALAR.exe na raiz do projeto (~54 KB)
:: ============================================================

echo.
echo  =====================================================
echo   Tecnobloco — Compilando INSTALAR.exe
echo  =====================================================
echo.

if not exist "setup-ambiente.ps1" (
    echo  [ERRO] setup-ambiente.ps1 nao encontrado.
    pause
    exit /b 1
)

echo  Baixando compilador PS2EXE do GitHub e compilando...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ps2exe = '%TEMP%\ps2exe_build.ps1'; " ^
    "(New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/MScholtes/PS2EXE/master/Module/ps2exe.ps1', $ps2exe); " ^
    ". $ps2exe; " ^
    "Invoke-ps2exe " ^
    "    -inputFile  '%~dp0setup-ambiente.ps1' " ^
    "    -outputFile '%~dp0INSTALAR.exe' " ^
    "    -requireAdmin " ^
    "    -title       'Tecnobloco ERP - Setup de Ambiente' " ^
    "    -description 'Configura Node.js, MySQL e banco de dados para o Tecnobloco ERP' " ^
    "    -company     'Tecnobloco' " ^
    "    -version     '1.0.0'; " ^
    "Remove-Item $ps2exe -ErrorAction SilentlyContinue"

if exist "INSTALAR.exe" (
    for %%F in ("INSTALAR.exe") do set tamanho=%%~zF
    echo.
    echo  =====================================================
    echo   INSTALAR.exe gerado com sucesso!
    echo   Distribua junto com o restante da pasta do projeto.
    echo  =====================================================
) else (
    echo.
    echo  [ERRO] Compilacao falhou. Verifique a conexao com a internet.
    echo  ALTERNATIVA: INSTALAR.bat funciona igualmente em qualquer Windows.
)

echo.
pause
exit /b 0
