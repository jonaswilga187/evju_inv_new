#!/bin/bash
# Update-Skript: Holt den aktuellen Stand aus Git und bringt die Anwendung auf den neuesten Stand.
# Führt aus: git pull, Docker-Container neu bauen und starten.
# Auf dem Server z. B.: ./update.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
exec bash "$SCRIPT_DIR/deploy.sh"
