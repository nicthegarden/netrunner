#!/bin/bash

# NETRUNNER launcher
# Starts the frontend server and, when available, the auth/API backend.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-8000}"
AUTH_PORT="${AUTH_PORT:-3000}"
API_PID=""

port_in_use() {
  ss -tuln 2>/dev/null | grep -q ":$1 "
}

cleanup() {
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

start_auth_backend() {
  if [ ! -f "$SCRIPT_DIR/server/server.js" ]; then
    return
  fi

  if ! command -v node >/dev/null 2>&1; then
    printf 'Warning: Node.js not found, auth backend not started.\n'
    return
  fi

  if port_in_use "$AUTH_PORT"; then
    printf 'Auth backend already running on http://localhost:%s\n' "$AUTH_PORT"
    return
  fi

  printf 'Starting auth backend on http://localhost:%s\n' "$AUTH_PORT"
  (
    cd "$SCRIPT_DIR/server"
    PORT="$AUTH_PORT" node server.js
  ) &
  API_PID=$!
  sleep 2

  if ! kill -0 "$API_PID" 2>/dev/null; then
    API_PID=""
    printf 'Warning: auth backend failed to start. Login and registration will not work.\n'
  fi
}

printf 'Starting NETRUNNER frontend on http://localhost:%s\n' "$PORT"
printf 'Press Ctrl+C to stop\n'

start_auth_backend

if port_in_use "$PORT"; then
  printf 'Frontend already running on http://localhost:%s\n' "$PORT"
  if [ -n "$API_PID" ]; then
    wait "$API_PID"
  else
    printf 'Nothing to start.\n'
  fi
  exit 0
fi

if command -v python3 >/dev/null 2>&1; then
  cd "$SCRIPT_DIR"
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  cd "$SCRIPT_DIR"
  python -m SimpleHTTPServer "$PORT"
elif command -v npx >/dev/null 2>&1; then
  cd "$SCRIPT_DIR"
  npx http-server -p "$PORT"
else
  printf 'Error: No HTTP server found\n'
  printf 'Install Python 3, Python 2, or Node.js\n'
  exit 1
fi
