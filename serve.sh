#!/bin/bash

# NETRUNNER — Simple HTTP Server Launcher
# This script starts a local web server so you can play the game

PORT=8000
echo "🌐 Starting NETRUNNER server..."
echo "📍 Open http://localhost:$PORT in your browser"
echo "⚠️  Press Ctrl+C to stop"

# Try Python 3 first (most common)
if command -v python3 &> /dev/null; then
  cd "$(dirname "$0")"
  python3 -m http.server $PORT
# Fall back to Python 2
elif command -v python &> /dev/null; then
  cd "$(dirname "$0")"
  python -m SimpleHTTPServer $PORT
# Try Node.js http-server
elif command -v npx &> /dev/null; then
  cd "$(dirname "$0")"
  npx http-server -p $PORT
else
  echo "❌ Error: No HTTP server found"
  echo "   Install Python 3, Python 2, or Node.js"
  exit 1
fi
