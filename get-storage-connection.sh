#!/bin/bash

# Script to get connection string from existing storage account
# Use this if storage account already exists

STORAGE_ACCOUNT_NAME="${1:-snapfeststorage}"
RESOURCE_GROUP="${2:-snapfest-rg}"

echo "🔍 Getting connection string for storage account: $STORAGE_ACCOUNT_NAME"
echo ""

# Try to get connection string
CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv 2>/dev/null)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Could not get connection string"
    echo ""
    echo "Possible reasons:"
    echo "1. Storage account doesn't exist"
    echo "2. Wrong resource group"
    echo "3. Subscription/permission issue"
    echo ""
    echo "💡 Solution: Create storage account via Azure Portal (see CREATE_STORAGE_PORTAL.md)"
    echo "   Then get connection string from Portal → Storage Account → Access Keys"
else
    echo "✅ Connection String:"
    echo "$CONNECTION_STRING"
    echo ""
    echo "📋 Add this to your .env file:"
    echo "AZURE_STORAGE_CONNECTION_STRING=$CONNECTION_STRING"
    echo "AZURE_STORAGE_CONTAINER_NAME=uploads"
    echo "AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME"
    echo "AZURE_STORAGE_ACCOUNT_URL=https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
fi
