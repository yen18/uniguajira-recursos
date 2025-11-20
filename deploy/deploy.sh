#!/usr/bin/env bash
set -euo pipefail

# deploy.sh - Script de despliegue simplificado para backend + frontend
# Requisitos: docker y docker-compose plugin (docker compose), variables en backend.env
# Uso: ./deploy.sh [--rebuild] [--pull] [--detached]

REBUILD=0
PULL=0
DETACHED=0
for arg in "$@"; do
  case "$arg" in
    --rebuild) REBUILD=1 ; shift ;;
    --pull) PULL=1 ; shift ;;
    --detached) DETACHED=1 ; shift ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/deploy"

echo "[deploy] Directorio: $PWD"

if [[ $PULL -eq 1 ]]; then
  echo "[deploy] Pull de imágenes base..."
  docker pull node:20-alpine || true
  docker pull caddy:latest || true
fi

if [[ $REBUILD -eq 1 ]]; then
  echo "[deploy] Reconstruyendo imágenes (sin cache)..."
  docker compose build --no-cache
else
  echo "[deploy] Construyendo imágenes (cache habilitado)..."
  docker compose build
fi

echo "[deploy] Aplicando migraciones ligeras (ensureSchema vía backend al iniciar)."

if [[ $DETACHED -eq 1 ]]; then
  docker compose up -d
else
  docker compose up
fi

echo "[deploy] Limpieza de imágenes huérfanas (opcional)"
if docker system df | grep -q 'Reclaimable'; then
  docker image prune -f || true
fi

echo "[deploy] Listo. Servicios activos:" 
if command -v docker &>/dev/null; then
  docker compose ps
fi
