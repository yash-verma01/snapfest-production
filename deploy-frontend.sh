#!/bin/bash

# ============================================
# SNAPFEST FRONTEND DEPLOYMENT SCRIPT
# ============================================
# Usage: ./deploy-frontend.sh [branch_name]
# Example: ./deploy-frontend.sh main
# Example: ./deploy-frontend.sh azure_deployment
# ============================================

set -e  # Exit on error

# Configuration
RESOURCE_GROUP="snapfest-rg"
STATIC_APP_NAME="snapfest-user"
FRONTEND_DIR="snapfest-frontend"
FRONTEND_URL="https://thankful-ground-00e7d820f.1.azurestaticapps.net"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get branch name from argument or default to main
BRANCH=${1:-main}

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  SNAPFEST FRONTEND DEPLOYMENT${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${YELLOW}Branch: ${BRANCH}${NC}"
echo -e "${YELLOW}Static Web App: ${STATIC_APP_NAME}${NC}"
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Checkout and pull latest from branch
echo -e "${BLUE}[1/6] Fetching latest changes from branch '${BRANCH}'...${NC}"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo -e "${GREEN}✅ Pulled latest changes${NC}"
echo ""

# Step 2: Navigate to frontend directory
echo -e "${BLUE}[2/6] Navigating to frontend directory...${NC}"
cd "$FRONTEND_DIR"
echo -e "${GREEN}✅ In $(pwd)${NC}"
echo ""

# Step 3: Check/Create .env file
echo -e "${BLUE}[3/6] Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file with Azure configuration...${NC}"
    cat > .env << 'ENVEOF'
# API Configuration
VITE_API_BASE_URL=https://snapfest-api.azurewebsites.net/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c3RpcnJpbmctYnJlYW0tNDkuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_CLERK_PUBLISHABLE_KEY_USER=pk_test_c3RpcnJpbmctYnJlYW0tNDkuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_CLERK_PUBLISHABLE_KEY_VENDOR=pk_test_c3Ryb25nLWJsdWViaXJkLTc5LmNsZXJrLmFjY291bnRzLmRldiQ
VITE_CLERK_PUBLISHABLE_KEY_ADMIN=pk_test_Z3JhdGVmdWwtZ2xvd3dvcm0tMjUuY2xlcmsuYWNjb3VudHMuZGV2JA

# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_RWpCivnUSkVbTS

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDkEhBB2xRtCaAGvbD3XA2Web-08egqoEc
ENVEOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

# Step 4: Install dependencies
echo -e "${BLUE}[4/6] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 5: Build the application
echo -e "${BLUE}[5/6] Building frontend application...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Add staticwebapp.config.json if not present
if [ ! -f "dist/staticwebapp.config.json" ]; then
    echo -e "${YELLOW}Creating staticwebapp.config.json...${NC}"
    cat > dist/staticwebapp.config.json << 'CONFIGEOF'
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.js", "/*.css", "/*.ico", "/*.png", "/*.svg"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
CONFIGEOF
fi

# Step 6: Deploy to Azure Static Web App
echo -e "${BLUE}[6/6] Deploying to Azure Static Web App...${NC}"
echo -e "${YELLOW}Getting deployment token...${NC}"

# Enable SSL bypass for Azure CLI
export AZURE_CLI_DISABLE_CONNECTION_VERIFICATION=1

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    -o tsv 2>/dev/null)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get deployment token. Make sure you're logged into Azure CLI.${NC}"
    exit 1
fi

echo -e "${YELLOW}Deploying to Azure...${NC}"

# Deploy using SWA CLI with SSL verification disabled
NODE_TLS_REJECT_UNAUTHORIZED=0 swa deploy ./dist \
    --deployment-token "$DEPLOYMENT_TOKEN" \
    --env production

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ FRONTEND DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}URL: ${FRONTEND_URL}${NC}"
echo ""

# Test the deployment
echo -e "${YELLOW}Testing deployment...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend returned HTTP $HTTP_CODE${NC}"
fi

