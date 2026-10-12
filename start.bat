@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo       Starting ShadowVault (Spring Boot + MySQL 8)
echo ========================================================

REM 1. Load environment variables from .env if present
if exist "%~dp0.env" (
    echo [*] Loading configuration from .env ...
    for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
        set "line=%%A"
        if not "!line:~0,1!"=="#" (
            if not "%%B"=="" set "%%A=%%B"
        )
    )
) else (
    echo [!] Warning: No .env found. Copying .env.example to .env ...
    copy "%~dp0.env.example" "%~dp0.env" >nul
)

REM 2. Set Java and tool paths
if not defined JAVA_HOME (
    set "JAVA_HOME=C:\Program Files\Java\jdk-25"
)
set "PATH=%JAVA_HOME%\bin;%LOCALAPPDATA%\apache-maven\apache-maven-3.9.9\bin;%LOCALAPPDATA%\nvm\v22.14.0;C:\Program Files\MySQL\MySQL Server 8.0\bin;%PATH%"

REM 3. Defaults if not in .env
if not defined DB_URL set "DB_URL=jdbc:mysql://localhost:3306/shadowvault?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
if not defined DB_USER set "DB_USER=root"
if not defined DB_PASS set "DB_PASS=chandu01"
if not defined JWT_SECRET set "JWT_SECRET=4f7b2c9e8d1a5f0e3c6a9b2d5f8e1c4b7a0d3f6e9c2b5a8d1e4f7a0c3b6e9d28"
if not defined DATA_DIR set "DATA_DIR=./data"

echo [*] Target Database: %DB_URL%
echo [*] Database User:   %DB_USER%

REM 4. Quick MySQL Port Check
powershell -Command "$tcp = New-Object Net.Sockets.TcpClient; try { $tcp.Connect('127.0.0.1', 3306); Write-Host '[*] MySQL 8 is running on port 3306'; $tcp.Close() } catch { Write-Host '[!] Warning: Port 3306 is not open. Ensure MySQL 8 service is started.' }"

REM 5. Build JAR if not present
if not exist "%~dp0backend\target\shadowvault-backend-1.0.0.jar" (
    echo [*] Backend JAR not found. Building with Maven...
    cd /d "%~dp0backend"
    call mvn clean package -DskipTests
    cd /d "%~dp0"
)

echo.
echo [*] Launching ShadowVault Backend with 'dev' profile on http://localhost:8080 ...
start "ShadowVault-Backend" cmd /k "cd /d %~dp0backend && set "DB_URL=%DB_URL%" && set "DB_USER=%DB_USER%" && set "DB_PASS=%DB_PASS%" && set "JWT_SECRET=%JWT_SECRET%" && set "DATA_DIR=%DATA_DIR%" && "%JAVA_HOME%\bin\java.exe" -jar target\shadowvault-backend-1.0.0.jar --spring.profiles.active=dev"

echo.
echo ========================================================
echo ShadowVault is running!
echo All-in-One App (Decoy Blog + Portal): http://localhost:8080/
echo Secret Unlock Code:   shadow123 (type in blog search bar)
echo Backend REST API:     http://localhost:8080/api
echo Database:             MySQL 8 (shadowvault)
echo Active Spring Profile: dev (tamper simulation enabled)
echo.
echo Demo Accounts (Password: demo123):
echo   - Victim:    victim1
echo   - Authority: authority1
echo   - Guardian:  guardian1
echo ========================================================
pause
