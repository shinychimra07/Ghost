#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE=.skyramp/docker-compose.testbot.yml

docker compose -f "$COMPOSE_FILE" run --rm ghost-builder
docker compose -f "$COMPOSE_FILE" up -d --build --wait ghost
