#!/usr/bin/env bash
# =============================================================================
# MakeMyCV — One-command dev runner (Git Bash on Windows)
#
#   ./dev.sh            # start backend + frontend, frontend stays in foreground
#   ./dev.sh stop       # stop the backend (docker compose down)
#
# The frontend runs in the foreground so Ctrl+C stops it (and you get live
# hot-reload). The backend runs detached inside Docker.
# =============================================================================
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$1" = "stop" ]; then
  echo "→ Stopping backend..."
  (cd "$ROOT/backend" && docker compose down)
  echo "Backend stopped. (Frontend: Ctrl+C in the terminal running dev.sh.)"
  exit 0
fi

# ---- 1. Make sure Docker Desktop is running ---------------------------------
if ! docker info > /dev/null 2>&1; then
  echo "→ Docker Desktop not running — launching it..."
  if [ -f "/c/Program Files/Docker/Docker/Docker Desktop.exe" ]; then
    "/c/Program Files/Docker/Docker/Docker Desktop.exe" &
  else
    echo "ERROR: Docker Desktop not found. Start it manually, then re-run ./dev.sh"
    exit 1
  fi

  echo "→ Waiting for Docker to be ready..."
  for i in $(seq 1 60); do
    if docker info > /dev/null 2>&1; then
      echo "  Docker ready."
      break
    fi
    sleep 3
    if [ "$i" = "60" ]; then
      echo "ERROR: Docker took too long to start. Start Docker Desktop manually."
      exit 1
    fi
  done
fi

# ---- 2. Start the backend ----------------------------------------------------
echo "→ Starting backend (docker compose up --build -d)..."
(cd "$ROOT/backend" && docker compose up --build -d)
echo "  Backend running at http://localhost:8000  (docs: /docs)"

# ---- 3. Start the frontend (foreground — Ctrl+C to stop) --------------------
echo "→ Starting frontend at http://localhost:3000 ..."
echo "  (Press Ctrl+C here to stop it. OTP codes appear in 'docker logs makemycv-api'.)"
(cd "$ROOT/frontend" && npm run dev)
