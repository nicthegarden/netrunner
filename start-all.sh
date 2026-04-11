#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PORT="${PORT:-8000}"
BACKEND_PORT="${AUTH_PORT:-3000}"
SERVER_DIR="$SCRIPT_DIR/server"
API_PID=""
FRONTEND_PID=""

port_in_use() {
  local port="$1"

  if command -v ss >/dev/null 2>&1; then
    ss -tuln 2>/dev/null | grep -q ":${port} "
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi

  return 1
}

wait_for_port() {
  local port="$1"
  local label="$2"

  for _ in $(seq 1 40); do
    if port_in_use "$port"; then
      printf '%s is ready on http://localhost:%s\n' "$label" "$port"
      return 0
    fi
    sleep 0.25
  done

  printf 'Warning: %s did not report ready on port %s\n' "$label" "$port"
  return 1
}

cleanup() {
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

ensure_backend_deps() {
  if [ ! -f "$SERVER_DIR/package.json" ]; then
    printf 'Warning: backend package file not found at %s\n' "$SERVER_DIR/package.json"
    return
  fi

  if [ -d "$SERVER_DIR/node_modules" ]; then
    return
  fi

  if ! command -v npm >/dev/null 2>&1; then
    printf 'Error: npm is required to install backend dependencies.\n'
    exit 1
  fi

  printf 'Installing backend dependencies in %s\n' "$SERVER_DIR"
  (
    cd "$SERVER_DIR"
    npm install
  )
}

start_backend() {
  if [ ! -f "$SERVER_DIR/server.js" ]; then
    printf 'Skipping backend startup: %s not found\n' "$SERVER_DIR/server.js"
    return
  fi

  if ! command -v node >/dev/null 2>&1; then
    printf 'Error: Node.js is required for the backend.\n'
    exit 1
  fi

  ensure_backend_deps

  if port_in_use "$BACKEND_PORT"; then
    printf 'Backend already running on http://localhost:%s\n' "$BACKEND_PORT"
    return
  fi

  printf 'Starting backend on http://localhost:%s\n' "$BACKEND_PORT"
  (
    cd "$SERVER_DIR"
    PORT="$BACKEND_PORT" node server.js
  ) &
  API_PID=$!
  wait_for_port "$BACKEND_PORT" 'Backend' || true
}

start_frontend() {
  if port_in_use "$FRONTEND_PORT"; then
    printf 'Frontend already running on http://localhost:%s\n' "$FRONTEND_PORT"
    return
  fi

  printf 'Starting frontend on http://localhost:%s\n' "$FRONTEND_PORT"

  if command -v python3 >/dev/null 2>&1; then
    (
      cd "$SCRIPT_DIR"
      python3 -m http.server "$FRONTEND_PORT"
    ) &
  elif command -v python >/dev/null 2>&1; then
    (
      cd "$SCRIPT_DIR"
      python -m SimpleHTTPServer "$FRONTEND_PORT"
    ) &
  elif command -v npx >/dev/null 2>&1; then
    (
      cd "$SCRIPT_DIR"
      npx http-server -p "$FRONTEND_PORT"
    ) &
  else
    printf 'Error: no frontend server command found. Install Python 3 or Node.js.\n'
    exit 1
  fi

  FRONTEND_PID=$!
  wait_for_port "$FRONTEND_PORT" 'Frontend' || true
}

printf 'NETRUNNER startup\n'
printf 'Workspace: %s\n' "$SCRIPT_DIR"
printf 'Frontend: http://localhost:%s\n' "$FRONTEND_PORT"
printf 'Backend:  http://localhost:%s\n' "$BACKEND_PORT"
printf '\n'

start_backend
start_frontend

printf '\nReady:\n'
printf '  Game:  http://localhost:%s/index.html\n' "$FRONTEND_PORT"
printf '  Auth:  http://localhost:%s/auth.html\n' "$FRONTEND_PORT"
printf '  Admin: http://localhost:%s/admin.html\n' "$FRONTEND_PORT"
printf '\nPress Ctrl+C to stop any processes started by this script.\n'

if [ -n "$FRONTEND_PID" ] || [ -n "$API_PID" ]; then
  wait
else
  printf 'Nothing new was started because both services were already running.\n'
fi
