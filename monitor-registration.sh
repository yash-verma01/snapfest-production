#!/bin/bash

# Registration Monitoring Script
# Run this after user registration to check everything

echo "🔍 MONITORING REGISTRATION PROCESS..."
echo "======================================"
echo ""

# Get Azure connection string
AZURE_MONGODB_URI=$(az webapp config appsettings list \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --query "[?name=='MONGODB_URI'].value" \
  -o tsv 2>/dev/null)

if [ -z "$AZURE_MONGODB_URI" ]; then
  echo "❌ Could not get Azure MONGODB_URI"
  exit 1
fi

echo "1️⃣ Checking Azure Database for new users..."
echo ""

cd snapfest-backend
MONGODB_URI="$AZURE_MONGODB_URI" node scripts/test-azure-db-connection.js

echo ""
echo "2️⃣ Checking Azure Logs for sync requests..."
echo ""

# Download recent logs
az webapp log download \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --log-file /tmp/azure-registration-logs.zip 2>/dev/null

if [ -f /tmp/azure-registration-logs.zip ]; then
  unzip -q /tmp/azure-registration-logs.zip -d /tmp/azure-registration-logs 2>/dev/null
  echo "Recent syncClerkUser calls:"
  grep -i "syncClerkUser\|Created new user\|User synced" /tmp/azure-registration-logs/LogFiles/*.log 2>/dev/null | tail -20
  echo ""
fi

echo "3️⃣ Summary..."
echo ""
