#!/bin/bash

# ============================================
# SNAPFEST FULL DEPLOYMENT SCRIPT
# ============================================
# Deploys both Backend and Frontend
# Usage: ./deploy-all.sh [branch_name]
# Example: ./deploy-all.sh main
# Example: ./deploy-all.sh azure_deployment
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get branch name from argument or default to main
BRANCH=${1:-main}

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     SNAPFEST FULL DEPLOYMENT SCRIPT        ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Branch: ${BRANCH}$(printf '%*s' $((25-${#BRANCH})) '')║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if Azure CLI is logged in
echo -e "${YELLOW}Checking Azure CLI login status...${NC}"
export AZURE_CLI_DISABLE_CONNECTION_VERIFICATION=1
if ! az account show &>/dev/null; then
    echo -e "${RED}❌ Not logged into Azure CLI. Please run 'az login' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Azure CLI is authenticated${NC}"
echo ""

# Deploy Backend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  DEPLOYING BACKEND${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
./deploy-backend.sh "$BRANCH"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  DEPLOYING FRONTEND${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
./deploy-frontend.sh "$BRANCH"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              🎉 FULL DEPLOYMENT COMPLETE! 🎉               ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Backend:  https://snapfest-api.azurewebsites.net          ║${NC}"
echo -e "${CYAN}║  Frontend: https://thankful-ground-00e7d820f.1.azurestaticapps.net ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

