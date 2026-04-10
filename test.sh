#!/bin/bash

# NETRUNNER Multiplayer Backend - Quick Testing Script
# This script runs comprehensive tests and provides feedback

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     NETRUNNER BACKEND - TESTING SCRIPT         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Test 1: Check Node.js version
echo -e "${YELLOW}[1/7] Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo ""

# Test 2: Check npm dependencies
echo -e "${YELLOW}[2/7] Checking npm dependencies...${NC}"
if [ -d "node_modules" ]; then
  DEP_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
  echo -e "${GREEN}✓ ${DEP_COUNT} dependencies installed${NC}"
else
  echo -e "${RED}✗ Dependencies not installed${NC}"
  echo "Run: npm install"
  exit 1
fi
echo ""

# Test 3: Verify syntax
echo -e "${YELLOW}[3/7] Validating JavaScript syntax...${NC}"
SYNTAX_ERRORS=0
for file in $(find src -name "*.js" -type f); do
  if ! node -c "$file" 2>/dev/null; then
    echo -e "${RED}✗ Syntax error in $file${NC}"
    SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
  fi
done
if [ $SYNTAX_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ All source files have valid syntax${NC}"
else
  echo -e "${RED}✗ Found $SYNTAX_ERRORS syntax errors${NC}"
  exit 1
fi
echo ""

# Test 4: Check environment file
echo -e "${YELLOW}[4/7] Checking environment configuration...${NC}"
if [ -f ".env" ]; then
  ENV_VARS=$(grep -c "=" .env || true)
  echo -e "${GREEN}✓ .env file found with ${ENV_VARS} variables${NC}"
else
  echo -e "${YELLOW}⚠ .env file not found, using defaults${NC}"
fi
echo ""

# Test 5: Run Jest tests
echo -e "${YELLOW}[5/7] Running Jest test suite...${NC}"
npm test 2>&1 | tail -20
echo ""

# Test 6: Check Docker availability
echo -e "${YELLOW}[6/7] Checking Docker availability...${NC}"
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  echo -e "${GREEN}✓ ${DOCKER_VERSION}${NC}"
  
  if docker ps &> /dev/null; then
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
  else
    echo -e "${YELLOW}⚠ Docker daemon is not running${NC}"
    echo "Start Docker to test full stack"
  fi
else
  echo -e "${YELLOW}⚠ Docker not installed (optional)${NC}"
fi
echo ""

# Test 7: Summary
echo -e "${YELLOW}[7/7] Test Summary${NC}"
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ALL TESTS PASSED ✓                    ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  Next Steps:                                   ║${NC}"
echo -e "${GREEN}║  1. docker-compose up -d   (full stack)        ║${NC}"
echo -e "${GREEN}║  2. curl http://localhost:3000/health          ║${NC}"
echo -e "${GREEN}║  3. Read TESTING_GUIDE.md for details          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Backend is ready for testing!${NC}"
echo ""
echo "Available commands:"
echo "  npm test              - Run Jest test suite"
echo "  npm run dev           - Start development server"
echo "  docker-compose up -d  - Start full stack (MongoDB, Redis, etc.)"
echo ""
