#!/bin/bash
set -e

echo "========================================="
echo " AI Service Desk - Setup"
echo "========================================="

# 1. Copy env if not exists
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "[OK] .env.local created"
else
    echo "[SKIP] .env.local exists"
fi

# 2. Create database
echo "[...] Creating database..."
PGPASSWORD=root psql -h localhost -p 5432 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'servicedesk_ai'" | grep -q 1 || \
    PGPASSWORD=root psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE servicedesk_ai;"
echo "[OK] Database servicedesk_ai ready"

# 3. Build
echo "[...] Building..."
mvn clean install -DskipTests -q
echo "[OK] Build done"

echo "========================================="
echo " Setup complete. Now run:"
echo "   mvn spring-boot:run -pl api -DskipTests"
echo "========================================="
