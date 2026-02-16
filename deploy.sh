#!/bin/bash
# Deploy/Update-Skript für das Inventarsystem auf dem Ubuntu-Server.
# Führt git pull aus und baut die Docker-Container neu, dann startet alles neu.
# Ausführung: im Projektordner z. B. ./deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Inventarsystem – Deployment ==="
echo "Projektordner: $SCRIPT_DIR"
echo ""

if [ ! -f .env ]; then
    echo "Hinweis: Keine .env gefunden. Beim ersten Start: cp .env.example .env und Werte anpassen."
    echo "Abbruch. Bitte .env anlegen und erneut ausführen."
    exit 1
fi

echo "1. Git Pull..."
git pull

echo ""
echo "2. Docker-Container neu bauen und starten..."
if command -v docker-compose &> /dev/null; then
    docker-compose build --no-cache
    docker-compose up -d
else
    docker compose build --no-cache
    docker compose up -d
fi

echo ""
echo "3. Status:"
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi

echo ""
echo "=== Deployment abgeschlossen. ==="
