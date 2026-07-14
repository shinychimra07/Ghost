#!/usr/bin/env bash
set -euo pipefail

# Redirect all output to a log file so diagnostics survive the testbot
# action's 300s setup-capture window (after which stdout is dropped).
SETUP_LOG="${GITHUB_WORKSPACE:-.}/.skyramp-setup-testbot.log"
exec > >(tee -a "$SETUP_LOG") 2>&1

COMPOSE_FILE=.skyramp/docker-compose.testbot.yml

echo "[setup-testbot] $(date -u +%FT%TZ) Starting ghost-builder..."
docker compose -f "$COMPOSE_FILE" run --rm ghost-builder
echo "[setup-testbot] $(date -u +%FT%TZ) ghost-builder done, starting ghost service..."

echo "[setup-testbot] $(date -u +%FT%TZ) Disk usage before docker build:"
df -h / | tail -1
docker system df 2>/dev/null || true

docker compose -f "$COMPOSE_FILE" up -d --build --wait ghost
echo "[setup-testbot] $(date -u +%FT%TZ) ghost service started successfully"
