# 🚀 Quick Setup Guide - Azure Blob Storage

## Option 1: Run the Setup Script (Recommended)

```bash
./setup-azure-storage.sh
```

This will:
- Create the storage account
- Create the container
- Display the connection string

## Option 2: Manual Setup via Azure Portal

### Step 1: Create Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Storage account"**
4. Click **"Create"**
5. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: `snapfest-rg`
   - **Storage account name**: `snapfeststorage` (must be globally unique, add numbers if taken)
   - **Region**: `East US`
   - **Performance**: `Standard`
   - **Redundancy**: `Locally-redundant storage (LRS)`
6. Click **"Review + create"** → **"Create"**

### Step 2: Create Container

1. Go to your storage account
2. Click **"Containers"** in the left menu
3. Click **"+ Container"**
4. Fill in:
   - **Name**: `uploads`
   - **Public access level**: `Blob (anonymous read access for blobs only)`
5. Click **"Create"**

### Step 3: Get Connection String

1. In your storage account, go to **"Access keys"** in the left menu
2. Click **"Show"** next to **key1**
3. Copy the **Connection string** (starts with `DefaultEndpointsProtocol=https...`)

### Step 4: Configure Environment Variables

**For Local Development (.env file):**
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=snapfeststorage;AccountKey=xxxxx;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=uploads
AZURE_STORAGE_ACCOUNT_NAME=snapfeststorage
AZURE_STORAGE_ACCOUNT_URL=https://snapfeststorage.blob.core.windows.net
```

**For Azure App Service:**
```bash
az webapp config appsettings set \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="<paste-connection-string>" \
    AZURE_STORAGE_CONTAINER_NAME="uploads" \
    AZURE_STORAGE_ACCOUNT_NAME="snapfeststorage" \
    AZURE_STORAGE_ACCOUNT_URL="https://snapfeststorage.blob.core.windows.net"
```

### Step 5: Restart Backend

```bash
# Restart Azure App Service
az webapp restart --name snapfest-api --resource-group snapfest-rg
```

## ✅ Verification

After setup, test by uploading an image through your app. The image should be stored in Azure Blob Storage and accessible via a blob URL.

## 🔍 Troubleshooting

### If storage account creation fails:
- Check your Azure subscription is active
- Verify you have permissions to create resources
- Try a different storage account name (must be globally unique)

### If connection string doesn't work:
- Wait 2-3 minutes after creating storage account
- Verify the connection string is copied correctly
- Check storage account exists in the correct resource group

### If images don't upload:
- Check environment variables are set correctly
- Restart backend after setting variables
- Check backend logs for errors

## 📚 Next Steps

1. ✅ Storage account created
2. ✅ Container created
3. ✅ Environment variables set
4. ✅ Backend restarted
5. 🎉 Ready to use!

---

**Need help?** Check `BLOB_STORAGE_MIGRATION.md` for detailed documentation.
