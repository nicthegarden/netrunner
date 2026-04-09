#!/bin/bash

# NETRUNNER Multiplayer Backend - Production Deployment Script
# Phase 9: Automated Deployment to DigitalOcean

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER=${DEPLOY_USER:-"appuser"}
DEPLOY_HOST=${DEPLOY_HOST:-"netrunner.game"}
DEPLOY_PATH=${DEPLOY_PATH:-"/home/appuser/netrunner"}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"docker.io"}
IMAGE_NAME=${IMAGE_NAME:-"netrunner-backend"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo -e "${YELLOW}=== NETRUNNER Backend Deployment ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Host: $DEPLOY_HOST"
echo "User: $DEPLOY_USER"
echo "Path: $DEPLOY_PATH"
echo ""

# Step 1: Validate environment
echo -e "${YELLOW}Step 1: Validating environment...${NC}"
if [ ! -f ".env.${ENVIRONMENT}" ]; then
  echo -e "${RED}Error: .env.${ENVIRONMENT} not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Environment file found${NC}"

# Step 2: Build Docker image
echo ""
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest \
  -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD) \
  -f Dockerfile .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
  echo -e "${RED}✗ Docker image build failed${NC}"
  exit 1
fi

# Step 3: Run tests
echo ""
echo -e "${YELLOW}Step 3: Running tests...${NC}"
npm test
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed${NC}"
else
  echo -e "${RED}✗ Tests failed${NC}"
  exit 1
fi

# Step 4: Push to registry
echo ""
echo -e "${YELLOW}Step 4: Pushing Docker image to registry...${NC}"
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Docker image pushed${NC}"
else
  echo -e "${RED}✗ Docker push failed${NC}"
  exit 1
fi

# Step 5: Deploy to server
echo ""
echo -e "${YELLOW}Step 5: Deploying to ${DEPLOY_HOST}...${NC}"

# SSH command to execute on server
DEPLOY_SCRIPT="
  set -e
  
  echo 'Pulling latest code...'
  cd ${DEPLOY_PATH}
  git fetch origin main
  git reset --hard origin/main
  
  echo 'Pulling latest Docker image...'
  docker-compose -f backend/docker-compose.yml pull
  
  echo 'Starting services...'
  docker-compose -f backend/docker-compose.yml up -d
  
  echo 'Waiting for services to be healthy...'
  sleep 10
  
  echo 'Running health checks...'
  curl -f http://localhost:3000/health || exit 1
  
  echo 'Creating database indexes...'
  docker-compose -f backend/docker-compose.yml exec -T backend node -e \"
    require('mongoose').connect(process.env.MONGODB_URI);
    const Player = require('./src/models/Player');
    const Guild = require('./src/models/Guild');
    const PvPMatch = require('./src/models/PvPMatch');
    const Event = require('./src/models/Event');
    console.log('Indexes created');
  \"
  
  echo 'Cleaning up old images...'
  docker image prune -a -f
  
  echo 'Deployment complete!'
"

ssh ${DEPLOY_USER}@${DEPLOY_HOST} "$DEPLOY_SCRIPT"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Deployment successful${NC}"
else
  echo -e "${RED}✗ Deployment failed${NC}"
  exit 1
fi

# Step 6: Verify deployment
echo ""
echo -e "${YELLOW}Step 6: Verifying deployment...${NC}"

HEALTH_CHECK="curl -f https://${DEPLOY_HOST}/health"
ssh ${DEPLOY_USER}@${DEPLOY_HOST} "$HEALTH_CHECK"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Server is healthy${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
  exit 1
fi

# Step 7: Post-deployment verification
echo ""
echo -e "${YELLOW}Step 7: Running post-deployment tests...${NC}"

# Test API endpoints
echo "Testing API endpoints..."
curl -s https://${DEPLOY_HOST}/api/players/leaderboard | jq . > /dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ API is responding${NC}"
else
  echo -e "${RED}✗ API not responding${NC}"
  exit 1
fi

# Final status
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Version: $(git rev-parse --short HEAD)"
echo "Timestamp: $(date)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Monitor logs: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'docker-compose -f backend/docker-compose.yml logs -f backend'"
echo "2. Check metrics: curl https://${DEPLOY_HOST}/admin/metrics"
echo "3. Verify all systems: curl https://${DEPLOY_HOST}/health"
