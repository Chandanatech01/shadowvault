#!/usr/bin/env bash
set -e

echo "========================================================"
echo "      Starting ShadowVault (Spring Boot + MySQL 8)"
echo "========================================================"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Load environment variables from .env
if [ -f "$DIR/.env" ]; then
    echo "[*] Loading configuration from .env ..."
    export $(grep -v '^#' "$DIR/.env" | xargs)
else
    echo "[!] Warning: No .env found. Copying .env.example to .env ..."
    cp "$DIR/.env.example" "$DIR/.env"
    export $(grep -v '^#' "$DIR/.env" | xargs)
fi

# 2. Defaults if not set
export DB_URL="${DB_URL:-jdbc:mysql://localhost:3306/shadowvault?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true}"
export DB_USER="${DB_USER:-root}"
export DB_PASS="${DB_PASS:-demo123}"
export JWT_SECRET="${JWT_SECRET:-4f7b2c9e8d1a5f0e3c6a9b2d5f8e1c4b7a0d3f6e9c2b5a8d1e4f7a0c3b6e9d28}"
export DATA_DIR="${DATA_DIR:-./data}"

echo "[*] Target Database: $DB_URL"
echo "[*] Database User:   $DB_USER"

# 3. Check MySQL connection
if command -v nc >/dev/null 2>&1; then
    if nc -z localhost 3306 2>/dev/null; then
        echo "[*] MySQL 8 is reachable on port 3306"
    else
        echo "[!] Warning: Port 3306 not responding. Ensure MySQL 8 is running."
    fi
fi

# 4. Build if JAR missing
JAR_FILE="$DIR/backend/target/shadowvault-backend-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "[*] Backend JAR not found. Building with Maven..."
    (cd "$DIR/backend" && mvn clean package -DskipTests)
fi

echo ""
echo "========================================================"
echo "ShadowVault starting with 'dev' profile on port 8080!"
echo "All-in-One App:          http://localhost:8080/"
echo "Secret Unlock Code:      shadow123 (type in blog search bar)"
echo "Backend REST API:        http://localhost:8080/api"
echo "Active Spring Profile:   dev (tamper simulation enabled)"
echo ""
echo "Demo Accounts (Password: demo123):"
echo "  - Victim:    victim1"
echo "  - Authority: authority1"
echo "  - Guardian:  guardian1"
echo "========================================================"
echo ""

java -jar "$JAR_FILE" --spring.profiles.active=dev
