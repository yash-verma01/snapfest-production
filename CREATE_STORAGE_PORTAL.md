# 🎯 Create Azure Storage Account via Portal (RECOMMENDED)

Since Azure CLI is having subscription access issues, use the Azure Portal instead. This is the most reliable method.

## Step-by-Step Instructions

### Step 1: Go to Azure Portal
1. Open https://portal.azure.com
2. Sign in with your account (ayush5690@gmail.com)

### Step 2: Create Storage Account
1. Click **"+ Create a resource"** (top left)
2. Search for **"Storage account"**
3. Click **"Create"**

### Step 3: Fill in Details
**Basics Tab:**
- **Subscription**: Select "Azure subscription 1"
- **Resource group**: Select **"snapfest-rg"** (or create new)
- **Storage account name**: `snapfeststorage` (or `snapfeststorage123` if taken)
- **Region**: **East US**
- **Performance**: **Standard**
- **Redundancy**: **Locally-redundant storage (LRS)**

**Advanced Tab:**
- **Allow blob public access**: **Enabled** ✅
- Leave other settings as default

**Networking Tab:**
- Leave as default

**Data protection Tab:**
- Leave as default

**Encryption Tab:**
- Leave as default

**Tags Tab:**
- Leave empty

### Step 4: Review and Create
1. Click **"Review + create"**
2. Wait for validation
3. Click **"Create"**
4. Wait 1-2 minutes for deployment

### Step 5: Create Container
1. Go to **"Go to resource"** (or search for your storage account)
2. In left menu, click **"Containers"**
3. Click **"+ Container"**
4. Fill in:
   - **Name**: `uploads`
   - **Public access level**: **Blob (anonymous read access for blobs only)**
5. Click **"Create"**

### Step 6: Get Connection String
1. In storage account, go to **"Access keys"** (left menu)
2. Click **"Show"** next to **key1**
3. Copy the **Connection string** (starts with `DefaultEndpointsProtocol=https...`)

### Step 7: Configure Your App

**Add to `.env` file (local):**
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=snapfeststorage;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=uploads
AZURE_STORAGE_ACCOUNT_NAME=snapfeststorage
AZURE_STORAGE_ACCOUNT_URL=https://snapfeststorage.blob.core.windows.net
```

**Add to Azure App Service:**
1. Go to Azure Portal → App Services → `snapfest-api`
2. Click **"Configuration"** → **"Application settings"**
3. Click **"+ New application setting"** for each:
   - Name: `AZURE_STORAGE_CONNECTION_STRING`, Value: `<paste connection string>`
   - Name: `AZURE_STORAGE_CONTAINER_NAME`, Value: `uploads`
   - Name: `AZURE_STORAGE_ACCOUNT_NAME`, Value: `snapfeststorage`
   - Name: `AZURE_STORAGE_ACCOUNT_URL`, Value: `https://snapfeststorage.blob.core.windows.net`
4. Click **"Save"**
5. Restart the App Service

## ✅ Verification

After setup, test by uploading an image. It should be stored in Azure Blob Storage!

## 🔍 Troubleshooting Subscription Issue

If you see subscription errors in Azure CLI, it's usually:
- **Billing issue**: Check if payment method is added
- **Free trial expired**: Upgrade to pay-as-you-go
- **Permissions**: You might need Owner/Contributor role

**To fix:**
1. Go to https://portal.azure.com → Subscriptions
2. Check subscription status
3. Add payment method if needed
4. Or contact Azure support

---

**This Portal method always works, even if CLI has issues!** 🎉
