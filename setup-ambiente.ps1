#Requires -RunAsAdministrator
# =============================================================================
# setup-ambiente.ps1 — Tecnobloco ERP Setup de Ambiente para Windows
# =============================================================================
# Instala e configura: Node.js 18 LTS, MySQL 8, npm deps, banco de dados
# Uso direto: .\setup-ambiente.ps1
# Com parametros: .\setup-ambiente.ps1 -DBPassword "minhasenha" -AppPort 3001
# =============================================================================

param(
    [string]$DBPassword  = "1234",
    [string]$DBName      = "tecnobloco",
    [string]$DBUser      = "root",
    [int]   $AppPort     = 3001
)

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot
$BackendDir  = Join-Path $ProjectRoot "backend"
$LogDir      = Join-Path $ProjectRoot "logs"
$LogFile     = Join-Path $LogDir "setup.log"
$script:SetupStart = Get-Date

# ─── PROGRESSO GLOBAL ─────────────────────────────────────────────────────────
# Etapas fixas para calculo de porcentagem

$script:ProgressActivity = "Tecnobloco — Setup de Ambiente"
$script:ProgressStep     = 0
$script:ProgressTotal    = 11   # total de etapas previstas

function Set-Progress {
    param(
        [string]$Status,          # Descricao curta exibida na barra
        [string]$CurrentOp = "",  # Detalhe da operacao atual
        [int]$Step = -1           # -1 = apenas incrementar
    )
    if ($Step -ge 0) { $script:ProgressStep = $Step }
    else             { $script:ProgressStep++ }

    $pct = [Math]::Min(99, [int](($script:ProgressStep / $script:ProgressTotal) * 100))
    $params = @{
        Activity         = $script:ProgressActivity
        Status           = "  Etapa $script:ProgressStep/$script:ProgressTotal — $Status"
        PercentComplete  = $pct
    }
    if ($CurrentOp) { $params.CurrentOperation = "  $CurrentOp" }
    Write-Progress @params
    Write-Log "[$pct%] $Status $(if($CurrentOp){"— $CurrentOp"})"
}

function Complete-Progress {
    Write-Progress -Activity $script:ProgressActivity -Completed
}

# ─── HELPERS DE SAIDA ─────────────────────────────────────────────────────────

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogFile -Value "[$ts][$Level] $Msg" -ErrorAction SilentlyContinue
}

function Write-OK {
    param([string]$Msg)
    Write-Host "  [+] $Msg" -ForegroundColor Green
    Write-Log "[OK] $Msg"
}

function Write-Fail {
    param([string]$Msg)
    Write-Host "  [X] $Msg" -ForegroundColor Red
    Write-Log "[ERRO] $Msg" "ERROR"
}

function Write-Info {
    param([string]$Msg)
    Write-Host "  [>] $Msg" -ForegroundColor Yellow
    Write-Log "[INFO] $Msg"
}

function Write-Detail {
    param([string]$Msg)
    Write-Host "      $Msg" -ForegroundColor DarkGray
    Write-Log "[DBG] $Msg"
}

function Write-Phase {
    param([string]$Title, [string]$Descricao = "")
    $line = ([string][char]0x2500) * 56
    Write-Host ""
    Write-Host "  $line" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    if ($Descricao) {
        Write-Host "  $Descricao" -ForegroundColor DarkCyan
    }
    Write-Host "  $line" -ForegroundColor Cyan
    Write-Host ""
}

function Get-Elapsed {
    $elapsed = (Get-Date) - $script:SetupStart
    if ($elapsed.TotalMinutes -ge 1) {
        return "$([int]$elapsed.TotalMinutes)m $($elapsed.Seconds)s"
    }
    return "$([int]$elapsed.TotalSeconds)s"
}

function Refresh-EnvPath {
    $machine = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $user    = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machine;$user"
}

# ─── SPINNER PARA PROCESSOS EXTERNOS ──────────────────────────────────────────
# Inicia um processo externo e exibe animacao enquanto aguarda a conclusao.
# Retorna: @{ ExitCode = int; Output = string[] }

function Start-ComWithSpinner {
    param(
        [string]   $FilePath,
        [string[]] $ArgumentList,
        [string]   $WorkingDirectory = $ProjectRoot,
        [string]   $SpinnerMsg,
        [string]   $OkMsg,
        [string]   $ErrMsg
    )

    $tmpOut = [System.IO.Path]::GetTempFileName()
    $tmpErr = [System.IO.Path]::GetTempFileName()

    $startArgs = @{
        FilePath               = $FilePath
        ArgumentList           = $ArgumentList
        WorkingDirectory       = $WorkingDirectory
        RedirectStandardOutput = $tmpOut
        RedirectStandardError  = $tmpErr
        PassThru               = $true
        NoNewWindow            = $true
    }

    try { $proc = Start-Process @startArgs }
    catch {
        Write-Fail "Nao foi possivel iniciar '$FilePath': $_"
        return @{ ExitCode = 1; Output = @() }
    }

    $chars    = @('|', '/', '-', '\')
    $i        = 0
    $padWidth = $SpinnerMsg.Length + 12

    while (-not $proc.HasExited) {
        $elapsed = [int]((Get-Date) - $script:SetupStart).TotalSeconds
        $frame   = "  $($chars[$i % 4])  $SpinnerMsg"
        Write-Host "`r$frame" -NoNewline -ForegroundColor Yellow
        $i++
        Start-Sleep -Milliseconds 150
    }

    # Limpar linha do spinner
    Write-Host ("`r" + (" " * $padWidth) + "`r") -NoNewline

    $stdout  = Get-Content $tmpOut -Encoding UTF8 -ErrorAction SilentlyContinue
    $stderr  = Get-Content $tmpErr -Encoding UTF8 -ErrorAction SilentlyContinue
    Remove-Item $tmpOut, $tmpErr -ErrorAction SilentlyContinue
    ($stdout + $stderr) | Where-Object { $_ } | ForEach-Object { Write-Log $_ }

    if ($proc.ExitCode -eq 0) {
        if ($OkMsg)  { Write-OK  $OkMsg  }
    } else {
        if ($ErrMsg) { Write-Fail $ErrMsg }
    }

    return @{ ExitCode = $proc.ExitCode; Output = ($stdout + $stderr) }
}

# ─── FASE 1: NODE.JS ──────────────────────────────────────────────────────────

function Test-NodeJS {
    try {
        $ver = & node --version 2>$null
        if ($ver -match 'v(\d+)') {
            $major = [int]$Matches[1]
            if ($major -ge 18) {
                Write-OK "Node.js $ver ja instalado"
                return $true
            }
            Write-Info "Node.js $ver encontrado, mas o Tecnobloco precisa de v18 ou superior"
            return $false
        }
    } catch {}
    return $false
}

function Install-NodeJS {
    Write-Info "Node.js nao encontrado. Iniciando instalacao automatica..."
    Write-Detail "O Node.js e o motor que executa o servidor do Tecnobloco."

    # Tentativa 1: winget (disponivel no Windows 10 1809+)
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Info "Usando winget (gerenciador nativo do Windows)..."
        Set-Progress "Instalando Node.js 18 LTS" "Baixando via winget..."

        $r = Start-ComWithSpinner `
            -FilePath    "winget" `
            -ArgumentList @("install","--id","OpenJS.NodeJS.LTS","--silent",
                            "--accept-package-agreements","--accept-source-agreements",
                            "--disable-interactivity") `
            -SpinnerMsg "Baixando e instalando Node.js 18 LTS via winget..." `
            -OkMsg      "Node.js instalado via winget" `
            -ErrMsg     "winget retornou erro (tentando proximo metodo)"

        Refresh-EnvPath
        Start-Sleep -Seconds 3
        if (Test-NodeJS) { return $true }
    }

    # Tentativa 2: download direto do MSI oficial
    Write-Info "Tentando download direto do instalador MSI do Node.js..."
    Set-Progress "Instalando Node.js 18 LTS" "Baixando MSI do nodejs.org..."
    try {
        $url = "https://nodejs.org/dist/v18.20.4/node-v18.20.4-x64.msi"
        $msi = Join-Path $env:TEMP "node-v18-setup.msi"
        Write-Detail "Origem: $url"

        Write-Host "  |  Baixando instalador (~30 MB)..." -ForegroundColor Yellow
        (New-Object System.Net.WebClient).DownloadFile($url, $msi)
        Write-OK "Download concluido"

        Set-Progress "Instalando Node.js 18 LTS" "Executando instalador silencioso..."
        $r = Start-ComWithSpinner `
            -FilePath    "msiexec.exe" `
            -ArgumentList @("/i", $msi, "/quiet", "/norestart", "ADDLOCAL=ALL") `
            -SpinnerMsg "Instalando Node.js 18 LTS (aguarde)..." `
            -OkMsg      "Node.js instalado com sucesso via MSI"

        Remove-Item $msi -ErrorAction SilentlyContinue
        Refresh-EnvPath
        Start-Sleep -Seconds 3
        if (Test-NodeJS) { return $true }
    } catch {
        Write-Fail "Falha no download/instalacao via MSI: $_"
    }

    return $false
}

# ─── FASE 2: MYSQL ────────────────────────────────────────────────────────────

function Find-MySQLExe {
    $candidates = @(
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\MySQL\bin\mysql.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }

    if (Test-Path "C:\Program Files\MySQL") {
        $found = Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter "mysql.exe" -ErrorAction SilentlyContinue |
                 Select-Object -First 1
        if ($found) { return $found.FullName }
    }
    $inPath = Get-Command mysql -ErrorAction SilentlyContinue
    if ($inPath) { return $inPath.Source }
    return $null
}

function Test-MySQL {
    $svc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($svc) {
        Write-OK "MySQL ja instalado — servico: $($svc.Name) ($($svc.Status))"
        return $true
    }
    $exe = Find-MySQLExe
    if ($exe) {
        Write-OK "MySQL encontrado em: $exe"
        return $true
    }
    return $false
}

function Install-MySQL {
    Write-Info "MySQL nao encontrado. Iniciando instalacao automatica..."
    Write-Detail "O MySQL e o banco de dados onde todos os registros do Tecnobloco serao armazenados."

    # Tentativa 1: winget
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Info "Usando winget para instalar MySQL..."
        Set-Progress "Instalando MySQL 8" "Baixando via winget (pode demorar 2-5 min)..."

        $r = Start-ComWithSpinner `
            -FilePath    "winget" `
            -ArgumentList @("install","--id","Oracle.MySQL","--silent",
                            "--accept-package-agreements","--accept-source-agreements",
                            "--disable-interactivity") `
            -SpinnerMsg "Baixando e instalando MySQL 8 via winget (aguarde, pode demorar)..." `
            -OkMsg      "MySQL instalado via winget" `
            -ErrMsg     "winget MySQL retornou erro (tentando Chocolatey)"

        Refresh-EnvPath
        Start-Sleep -Seconds 15
        if (Test-MySQL) { return $true }
    }

    # Tentativa 2: Chocolatey
    Write-Info "Tentando instalacao via Chocolatey..."
    Set-Progress "Instalando MySQL 8" "Preparando Chocolatey..."
    try {
        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-Info "Instalando Chocolatey (gerenciador de pacotes alternativo)..."
            Write-Detail "O Chocolatey permite instalar o MySQL com senha pre-configurada."
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol =
                [System.Net.ServicePointManager]::SecurityProtocol -bor 3072

            $r = Start-ComWithSpinner `
                -FilePath    "powershell.exe" `
                -ArgumentList @("-NoProfile","-Command",
                    "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; iex ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))") `
                -SpinnerMsg "Instalando Chocolatey..." `
                -OkMsg      "Chocolatey instalado"
            Refresh-EnvPath
        }

        Set-Progress "Instalando MySQL 8" "Instalando via Chocolatey (aguarde 3-5 min)..."
        $r = Start-ComWithSpinner `
            -FilePath    "choco" `
            -ArgumentList @("install","mysql","-y","--params","/RootPassword:$DBPassword") `
            -SpinnerMsg "Instalando MySQL 8 via Chocolatey (aguarde, pode demorar)..." `
            -OkMsg      "MySQL instalado via Chocolatey" `
            -ErrMsg     "Chocolatey MySQL retornou erro"

        Refresh-EnvPath
        Start-Sleep -Seconds 15
        if (Test-MySQL) { return $true }
    } catch { Write-Info "Chocolatey falhou: $_" }

    return $false
}

function Wait-MySQLService {
    $svc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $svc) { return }

    if ($svc.Status -ne "Running") {
        Write-Info "Iniciando servico $($svc.Name)..."
        try { Start-Service $svc.Name -ErrorAction SilentlyContinue } catch {}
    }

    $chars    = @('|', '/', '-', '\')
    $i        = 0
    $tentativas = 0
    while ($tentativas -lt 25) {
        $svc.Refresh()
        if ($svc.Status -eq "Running") { break }
        Write-Host ("`r  $($chars[$i % 4])  Aguardando servico MySQL iniciar...") -NoNewline -ForegroundColor Yellow
        $i++
        $tentativas++
        Start-Sleep -Seconds 2
    }
    Write-Host ("`r" + (" " * 50) + "`r") -NoNewline

    if ($svc.Status -eq "Running") { Write-OK "Servico MySQL em execucao" }
    else { Write-Info "MySQL ainda nao respondeu. Continuando mesmo assim..." }
}

function Configure-MySQL {
    param([string]$MySQLExe)

    Write-Info "Verificando e configurando acesso ao banco de dados..."
    Write-Detail "Sera testada a conexao com o MySQL e a senha do usuario root."

    Wait-MySQLService
    Start-Sleep -Seconds 3

    function Try-Connect {
        param([string]$Pwd, [string]$SQL, [switch]$ExpiredOK)
        $a = @("-u", "root", "--port=3306", "--host=127.0.0.1", "-e", $SQL)
        if ($Pwd -ne "") { $a = @("-u", "root", "-p$Pwd", "--port=3306", "--host=127.0.0.1", "-e", $SQL) }
        if ($ExpiredOK) { $a += "--connect-expired-password" }
        & $MySQLExe @a 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    }

    # 1. Sem senha (instalacao limpa ou initialize-insecure)
    if (Try-Connect -Pwd "" -SQL "SELECT 1;") {
        Write-Info "MySQL sem senha detectado. Definindo senha padrao..."
        Try-Connect -Pwd "" -SQL "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DBPassword'; FLUSH PRIVILEGES;" | Out-Null
        Write-OK "Senha do MySQL configurada com sucesso"
        return $true
    }

    # 2. Senha ja e a correta
    if (Try-Connect -Pwd $DBPassword -SQL "SELECT 1;") {
        Write-OK "MySQL respondendo com as credenciais corretas"
        return $true
    }

    # 3. Procurar senha temporaria no log de inicializacao
    Write-Info "Procurando senha temporaria nos logs do MySQL..."
    $dataDirs = @(
        "$env:ProgramData\MySQL\MySQL Server 8.4\Data",
        "$env:ProgramData\MySQL\MySQL Server 8.3\Data",
        "$env:ProgramData\MySQL\MySQL Server 8.0\Data"
    )
    foreach ($dir in $dataDirs) {
        if (-not (Test-Path $dir)) { continue }
        $errFile = Get-ChildItem $dir -Filter "*.err" -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $errFile) { continue }
        $tempLine = Get-Content $errFile.FullName -ErrorAction SilentlyContinue |
                    Where-Object { $_ -match "temporary password" } |
                    Select-Object -Last 1
        if ($tempLine) {
            $tempPwd = ($tempLine -split ": ")[-1].Trim()
            Write-Info "Senha temporaria encontrada. Redefinindo para o padrao..."
            if (Try-Connect -Pwd $tempPwd -SQL "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DBPassword'; FLUSH PRIVILEGES;" -ExpiredOK) {
                Write-OK "Senha do MySQL redefinida com sucesso"
                return $true
            }
        }
    }

    Write-Info "Nao foi possivel configurar a senha automaticamente."
    Write-Info "O setup-db.js tentara conectar com as credenciais de backend/.env"
    return $true
}

# ─── FASE 3: APP ──────────────────────────────────────────────────────────────

function New-JWTSecret {
    $bytes = New-Object byte[] 32
    $rng   = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return ([BitConverter]::ToString($bytes) -replace '-', '').ToLower()
}

# Valores que o setup substitui no .env.example ao gerar o .env.
# Qualquer outra variavel presente no .env.example e copiada sem alteracao.
function Get-EnvOverrides {
    return @{
        'DB_PASSWORD' = $DBPassword
        'DB_NAME'     = $DBName
        'DB_USER'     = $DBUser
        'PORT'        = "$AppPort"
        'NODE_ENV'    = 'production'
        'JWT_SECRET'  = New-JWTSecret
    }
}

function Create-EnvFile {
    $envPath    = Join-Path $BackendDir ".env"
    $envExample = Join-Path $ProjectRoot ".env.example"
    $timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    if (Test-Path $envPath) {
        Write-OK "backend/.env ja existe — configuracao atual mantida"
        Write-Detail "Para recriar o .env, apague o arquivo e execute o setup novamente."
        # Mesmo com .env existente, verificar se ha novas variaveis no .env.example
        Sync-EnvNewKeys
        return
    }

    Write-Info "Criando arquivo de configuracao do servidor (backend/.env)..."
    Write-Detail "Lendo variaveis de .env.example e substituindo valores de instalacao."

    $overrides = Get-EnvOverrides

    if (Test-Path $envExample) {
        # Ler template linha a linha e substituir apenas as chaves conhecidas
        $lines  = Get-Content $envExample -Encoding UTF8
        $output = @("# Tecnobloco ERP — Gerado automaticamente pelo setup em $timestamp")

        foreach ($line in $lines) {
            # Pular cabecalho original (comentarios da primeira linha)
            if ($line -match '^#\s*(=+|TECNOBLOCO|Copie)') { continue }

            if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
                $key = $Matches[1]
                if ($overrides.ContainsKey($key)) {
                    $output += "$key=$($overrides[$key])"
                } else {
                    $output += $line   # manter valor original do exemplo
                }
            } else {
                $output += $line       # comentarios de secao e linhas em branco
            }
        }

        Set-Content -Path $envPath -Value $output -Encoding UTF8
        Write-OK "backend/.env criado a partir de .env.example"
        Write-Detail "Variaveis substituidas: $($overrides.Keys -join ', ')"
    } else {
        # Fallback: nao ha .env.example, gerar valores minimos necessarios
        Write-Info ".env.example nao encontrado — gerando .env com valores minimos"
        $o = $overrides
        $content = @"
# Tecnobloco — Gerado automaticamente em $timestamp (sem .env.example)
PORT=$($o['PORT'])
NODE_ENV=$($o['NODE_ENV'])

DB_HOST=localhost
DB_PORT=3306
DB_USER=$($o['DB_USER'])
DB_PASSWORD=$($o['DB_PASSWORD'])
DB_NAME=$($o['DB_NAME'])
DB_CONNECTION_LIMIT=10

JWT_SECRET=$($o['JWT_SECRET'])
JWT_EXPIRES_IN=8h

BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_MAX=100

LOG_LEVEL=info
LOG_DIR=logs
"@
        Set-Content -Path $envPath -Value $content -Encoding UTF8
        Write-OK "backend/.env criado com valores minimos"
    }
}

# Adiciona ao .env existente qualquer variavel nova presente no .env.example.
# Nunca sobrescreve valores ja configurados — apenas acrescenta o que falta.
function Sync-EnvNewKeys {
    $envPath    = Join-Path $BackendDir ".env"
    $envExample = Join-Path $ProjectRoot ".env.example"
    if (-not (Test-Path $envPath) -or -not (Test-Path $envExample)) { return }

    # Chaves ja presentes no .env atual
    $currentKeys = Get-Content $envPath -Encoding UTF8 |
                   Where-Object { $_ -match '^([A-Z_][A-Z0-9_]*)=' } |
                   ForEach-Object { ($_ -split '=', 2)[0] }
    $currentSet  = [System.Collections.Generic.HashSet[string]]$currentKeys

    # Linhas do .env.example que representam chaves ausentes
    $missing = @()
    foreach ($line in (Get-Content $envExample -Encoding UTF8)) {
        if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
            if (-not $currentSet.Contains($Matches[1])) {
                $missing += $line
            }
        }
    }

    if ($missing.Count -gt 0) {
        $keys = $missing | ForEach-Object { ($_ -split '=', 2)[0] }
        Write-Info "Novas variaveis detectadas no .env.example: $($keys -join ', ')"
        $date = Get-Date -Format "yyyy-MM-dd"
        Add-Content -Path $envPath -Value "" -Encoding UTF8
        Add-Content -Path $envPath -Value "# Adicionado pelo setup em $date" -Encoding UTF8
        Add-Content -Path $envPath -Value $missing -Encoding UTF8
        Write-OK "backend/.env atualizado com $($missing.Count) nova(s) variavel(is)"
    }
}

function Install-NpmDeps {
    Write-Info "Instalando dependencias do servidor..."
    Write-Detail "O npm vai baixar: express, mysql2, jsonwebtoken, bcrypt, helmet, etc."
    Write-Detail "Na primeira execucao isso pode levar 1-2 minutos."

    $r = Start-ComWithSpinner `
        -FilePath        "cmd.exe" `
        -ArgumentList    @("/c", "npm install") `
        -WorkingDirectory $BackendDir `
        -SpinnerMsg "Baixando e instalando pacotes npm (express, mysql2, jwt...)..." `
        -OkMsg      "Dependencias npm instaladas" `
        -ErrMsg     "npm install retornou erro"

    if ($r.ExitCode -ne 0) {
        Write-Detail "Saida do npm: $($r.Output -join '; ')"
        return $false
    }
    return $true
}

function Init-Database {
    Write-Info "Inicializando o banco de dados..."
    Write-Detail "Sera criado o banco '$DBName', todas as tabelas e o usuario administrador padrao."

    $r = Start-ComWithSpinner `
        -FilePath        "node" `
        -ArgumentList    @("scripts/setup-db.js") `
        -WorkingDirectory $BackendDir `
        -SpinnerMsg "Criando tabelas e populando dados iniciais no MySQL..." `
        -OkMsg      "Banco de dados inicializado com sucesso" `
        -ErrMsg     "setup-db.js retornou erro"

    if ($r.ExitCode -ne 0) {
        # Mostrar saida relevante do setup-db
        $r.Output | Where-Object { $_ -match "erro|error|fail|WARN" -or $_ -match "\[" } |
            Select-Object -Last 10 |
            ForEach-Object { Write-Detail $_ }
        return $false
    }

    # Exibir linhas informativas do setup-db (schema criado, seeds, etc.)
    $r.Output | Where-Object { $_ -match "\[|OK|criado|criada|seed|Tabela" } |
        ForEach-Object { Write-Detail $_ }
    return $true
}

# ─── FASE 4: ATALHOS ──────────────────────────────────────────────────────────

function Create-Shortcuts {
    Write-Info "Criando atalhos no Windows..."
    Write-Detail "Atalho na Area de Trabalho e no Menu Iniciar > Tecnobloco."
    try {
        $wsh      = New-Object -ComObject WScript.Shell
        $desktop  = [Environment]::GetFolderPath("Desktop")
        $programs = [Environment]::GetFolderPath("CommonPrograms")
        $TecnoblocoDir  = Join-Path $programs "Tecnobloco"

        if (-not (Test-Path $TecnoblocoDir)) {
            New-Item -ItemType Directory -Path $TecnoblocoDir -Force | Out-Null
        }

        $iniciarBat = Join-Path $ProjectRoot "Iniciar-Tecnobloco.bat"
        $pararBat   = Join-Path $ProjectRoot "Parar-Tecnobloco.bat"

        $sc = $wsh.CreateShortcut("$desktop\Tecnobloco - Iniciar.lnk")
        $sc.TargetPath       = $iniciarBat
        $sc.WorkingDirectory = $ProjectRoot
        $sc.IconLocation     = "shell32.dll,144"
        $sc.Description      = "Iniciar Tecnobloco - Sistema de Gestão Industrial"
        $sc.Save()

        $sc2 = $wsh.CreateShortcut("$TecnoblocoDir\Tecnobloco - Iniciar.lnk")
        $sc2.TargetPath       = $iniciarBat
        $sc2.WorkingDirectory = $ProjectRoot
        $sc2.IconLocation     = "shell32.dll,144"
        $sc2.Description      = "Iniciar Tecnobloco"
        $sc2.Save()

        $sc3 = $wsh.CreateShortcut("$TecnoblocoDir\Tecnobloco - Parar.lnk")
        $sc3.TargetPath       = $pararBat
        $sc3.WorkingDirectory = $ProjectRoot
        $sc3.IconLocation     = "shell32.dll,27"
        $sc3.Description      = "Parar Tecnobloco"
        $sc3.Save()

        Write-OK "Atalhos criados: Area de Trabalho e Menu Iniciar > Tecnobloco"
    } catch {
        Write-Info "Nao foi possivel criar atalhos (nao critico): $_"
    }
}

# ─── MAIN ─────────────────────────────────────────────────────────────────────

function Main {
    # ── Cabecalho ─────────────────────────────────────────────────────────────
    Clear-Host
    $sep = "=" * 58
    Write-Host ""
    Write-Host "  $sep" -ForegroundColor Cyan
    Write-Host "   Tecnobloco — Setup de Ambiente para Windows" -ForegroundColor Cyan
    Write-Host "   Sistema de Gestão Industrial" -ForegroundColor Cyan
    Write-Host "  $sep" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Este assistente vai instalar e configurar tudo o que" -ForegroundColor Gray
    Write-Host "  o Tecnobloco precisa para funcionar nesta maquina:" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    1. Node.js 18 LTS  (motor do servidor)" -ForegroundColor Gray
    Write-Host "    2. MySQL 8         (banco de dados)"     -ForegroundColor Gray
    Write-Host "    3. Pacotes npm     (dependencias do app)" -ForegroundColor Gray
    Write-Host "    4. Banco de dados  (tabelas + dados iniciais)" -ForegroundColor Gray
    Write-Host "    5. Atalhos         (Area de Trabalho + Menu Iniciar)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  O log completo sera salvo em: logs\setup.log" -ForegroundColor DarkGray
    Write-Host ""
    Write-Log "=== INICIO DO SETUP === Dir=$ProjectRoot"

    Set-Progress "Iniciando setup..." "Verificando estrutura do projeto..." -Step 0

    # Validacao basica da estrutura
    if (-not (Test-Path $BackendDir)) {
        Write-Fail "Pasta 'backend/' nao encontrada em $ProjectRoot"
        Write-Fail "Certifique-se de executar este script na raiz do projeto Tecnobloco."
        Complete-Progress
        Read-Host "`n  Pressione Enter para sair"
        exit 1
    }

    # ── FASE 1: Node.js ───────────────────────────────────────────────────────
    Write-Phase "FASE 1 de 4 — Node.js" "Verificando se o Node.js esta instalado e atualizado..."
    Set-Progress "Verificando Node.js" "Checando versao instalada..."

    if (-not (Test-NodeJS)) {
        Set-Progress "Instalando Node.js 18 LTS" "Aguarde, o download pode levar alguns minutos..."
        if (-not (Install-NodeJS)) {
            Complete-Progress
            Write-Host ""
            Write-Fail "ERRO FATAL: Nao foi possivel instalar o Node.js automaticamente."
            Write-Host ""
            Write-Host "  Instale manualmente:" -ForegroundColor Yellow
            Write-Host "  https://nodejs.org/en/download — versao 18 LTS (Windows Installer)" -ForegroundColor Cyan
            Write-Host "  Apos instalar, execute este setup novamente." -ForegroundColor Yellow
            Read-Host "`n  Pressione Enter para sair"
            exit 1
        }
    }
    Set-Progress "Node.js OK" "" -Step 2

    # ── FASE 2: MySQL ─────────────────────────────────────────────────────────
    Write-Phase "FASE 2 de 4 — MySQL" "Verificando se o MySQL esta instalado e configurado..."
    Set-Progress "Verificando MySQL" "Procurando servico e binarios do MySQL..."

    if (-not (Test-MySQL)) {
        Set-Progress "Instalando MySQL 8" "Aguarde, pode demorar 3-5 minutos..."
        if (-not (Install-MySQL)) {
            Complete-Progress
            Write-Host ""
            Write-Fail "ERRO FATAL: Nao foi possivel instalar o MySQL automaticamente."
            Write-Host ""
            Write-Host "  Instale manualmente:" -ForegroundColor Yellow
            Write-Host "  https://dev.mysql.com/downloads/mysql/ — MySQL Community Server 8.0" -ForegroundColor Cyan
            Write-Host "  Apos instalar, execute este setup novamente." -ForegroundColor Yellow
            Read-Host "`n  Pressione Enter para sair"
            exit 1
        }
    }

    Set-Progress "Configurando MySQL" "Verificando credenciais e configurando banco de dados..."
    $mysqlExe = Find-MySQLExe
    if ($mysqlExe) {
        Write-Detail "Executavel MySQL: $mysqlExe"
        Configure-MySQL -MySQLExe $mysqlExe | Out-Null
    } else {
        Write-Info "mysql.exe nao localizado no PATH. O setup-db.js usara as credenciais do .env"
    }
    Set-Progress "MySQL OK" "" -Step 5

    # ── FASE 3: App ───────────────────────────────────────────────────────────
    Write-Phase "FASE 3 de 4 — Configuracao do App" "Criando configuracoes, instalando pacotes e inicializando o banco..."
    Set-Progress "Criando arquivo de configuracao" "Gerando backend/.env com JWT secret aleatorio..."
    Create-EnvFile

    Set-Progress "Instalando pacotes npm" "Baixando dependencias (express, mysql2, jwt, bcrypt...)..."
    if (-not (Install-NpmDeps)) {
        Complete-Progress
        Write-Host ""
        Write-Fail "ERRO FATAL: Falha ao instalar dependencias npm."
        Write-Host ""
        Write-Host "  Possiveis causas:" -ForegroundColor Yellow
        Write-Host "    - Sem acesso a internet" -ForegroundColor Gray
        Write-Host "    - Proxy ou firewall bloqueando o npm" -ForegroundColor Gray
        Write-Host "    - Node.js nao esta no PATH (reinicie e tente novamente)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Verifique logs\setup.log para mais detalhes." -ForegroundColor DarkGray
        Read-Host "`n  Pressione Enter para sair"
        exit 1
    }

    Set-Progress "Inicializando banco de dados" "Criando tabelas, indices e dados iniciais no MySQL..."
    if (-not (Init-Database)) {
        Complete-Progress
        Write-Host ""
        Write-Fail "ERRO FATAL: Falha ao inicializar o banco de dados."
        Write-Host ""
        Write-Host "  Possiveis causas:" -ForegroundColor Yellow
        Write-Host "    - MySQL nao esta rodando (servico parado?)" -ForegroundColor Gray
        Write-Host "    - Senha incorreta em backend/.env" -ForegroundColor Gray
        Write-Host "    - Nome do banco ou usuario sem permissao" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Verifique backend/.env e logs\setup.log para mais detalhes." -ForegroundColor DarkGray
        Read-Host "`n  Pressione Enter para sair"
        exit 1
    }
    Set-Progress "App configurado" "" -Step 9

    # ── FASE 4: Windows ───────────────────────────────────────────────────────
    Write-Phase "FASE 4 de 4 — Integracao com o Windows" "Criando atalhos para facilitar o uso diario..."
    Set-Progress "Criando atalhos" "Area de Trabalho e Menu Iniciar..."
    Create-Shortcuts
    Set-Progress "Concluido" "" -Step 11
    Complete-Progress

    # ── Tela de conclusao ─────────────────────────────────────────────────────
    $tempo = Get-Elapsed
    Write-Host ""
    Write-Host "  $sep" -ForegroundColor Green
    Write-Host "   SETUP CONCLUIDO COM SUCESSO!  ($tempo)" -ForegroundColor Green
    Write-Host "  $sep" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Como acessar o Tecnobloco:" -ForegroundColor Cyan
    Write-Host "    URL  : " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:$AppPort" -ForegroundColor White
    Write-Host "    CPF  : " -NoNewline -ForegroundColor Gray
    Write-Host "000.000.000-00" -ForegroundColor White
    Write-Host "    Senha: " -NoNewline -ForegroundColor Gray
    Write-Host "1234" -ForegroundColor White
    Write-Host ""
    Write-Host "  Para iniciar o Tecnobloco no dia a dia:" -ForegroundColor Cyan
    Write-Host "    -> Clique no atalho 'Tecnobloco - Iniciar' na Area de Trabalho" -ForegroundColor Gray
    Write-Host "    -> Ou execute: Iniciar-Tecnobloco.bat" -ForegroundColor Gray
    Write-Host ""
    Write-Log "=== SETUP CONCLUIDO === tempo=$tempo"

    $resp = Read-Host "  Deseja iniciar o Tecnobloco agora? (S/N)"
    if ($resp -match '^[Ss]') {
        Write-Host ""
        Write-Info "Iniciando Tecnobloco..."
        Start-Process (Join-Path $ProjectRoot "Iniciar-Tecnobloco.bat")
    }

    Write-Host ""
    Read-Host "  Pressione Enter para fechar"
}

Main
