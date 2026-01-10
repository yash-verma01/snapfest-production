#!/bin/bash

# ============================================
# SNAPFEST BACKEND DEPLOYMENT SCRIPT
# ============================================
# Usage: ./deploy-backend.sh [branch_name]
# Example: ./deploy-backend.sh main
# Example: ./deploy-backend.sh azure_deployment
# ============================================

set -e  # Exit on error

# Configuration
RESOURCE_GROUP="snapfest-rg"
APP_NAME="snapfest-api"
BACKEND_DIR="snapfest-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get branch name from argument or default to main
BRANCH=${1:-main}

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  SNAPFEST BACKEND DEPLOYMENT${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${YELLOW}Branch: ${BRANCH}${NC}"
echo -e "${YELLOW}App Service: ${APP_NAME}${NC}"
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Checkout and pull latest from branch
echo -e "${BLUE}[1/5] Fetching latest changes from branch '${BRANCH}'...${NC}"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo -e "${GREEN}✅ Pulled latest changes${NC}"
echo ""

# Step 2: Navigate to backend directory
echo -e "${BLUE}[2/5] Navigating to backend directory...${NC}"
cd "$BACKEND_DIR"
echo -e "${GREEN}✅ In $(pwd)${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}[3/5] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Create deployment package
echo -e "${BLUE}[4/5] Creating deployment package...${NC}"
rm -f deploy.zip
zip -r deploy.zip . \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "logs/*" \
    -x ".env" \
    -x ".env.backup" \
    -x ".env.local" \
    -x "deploy.zip" \
    -x "*.log"
echo -e "${GREEN}✅ Deployment package created (deploy.zip)${NC}"
echo ""

# Step 5: Deploy to Azure
echo -e "${BLUE}[5/5] Deploying to Azure App Service...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"

# Enable SSL bypass for deployment (if needed due to proxy issues)
export AZURE_CLI_DISABLE_CONNECTION_VERIFICATION=1

az webapp deploy \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --src-path deploy.zip \
    --type zip \
    --async false

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ BACKEND DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}URL: https://${APP_NAME}.azurewebsites.net${NC}"
echo -e "${BLUE}Health Check: https://${APP_NAME}.azurewebsites.net/api/health${NC}"
echo ""

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_NAME}.azurewebsites.net/api/health" -H "Origin: https://thankful-ground-00e7d820f.1.azurestaticapps.net" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️ Backend returned HTTP $HTTP_CODE (may still be starting up)${NC}"
fi

# Cleanup
rm -f deploy.zip
echo -e "${GREEN}✅ Cleanup complete${NC}"

