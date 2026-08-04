@echo off
echo =========================================
echo  AI Service Desk - Setup
echo =========================================

REM 1. Copy env if not exists
if not exist .env.local (
    copy .env.example .env.local >nul
    echo [OK] .env.local created
) else (
    echo [SKIP] .env.local exists
)

REM 2. Create database
echo [...] Creating database...
set PGPASSWORD=root
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'servicedesk_ai'" | findstr /C:"1" >nul
if errorlevel 1 (
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -c "CREATE DATABASE servicedesk_ai;"
)
echo [OK] Database servicedesk_ai ready

REM 3. Set Java 21
set JAVA_HOME=C:\Users\AYPAL\.jdks\ms-21.0.11
set PATH=%JAVA_HOME%\bin;%PATH%
echo [OK] JAVA_HOME=%JAVA_HOME%

REM 4. Build
echo [...] Building...
call mvn clean install -DskipTests -q
echo [OK] Build done

echo =========================================
echo  Setup complete. Now run:
echo    mvn spring-boot:run -pl api -DskipTests
echo =========================================
