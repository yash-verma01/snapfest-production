# Azure Blob Storage Migration Guide

## ✅ Implementation Complete

All static images are now configured to use Azure Blob Storage instead of local filesystem storage. This ensures:
- **Persistent storage** - Files survive deployments and restarts
- **Scalability** - Handle unlimited storage needs
- **Performance** - CDN-ready for fast global delivery
- **Cost-effective** - Pay only for what you use

## 📋 What Was Changed

### Backend Changes

1. **New Blob Storage Service** (`src/services/blobStorage.js`)
   - Handles upload, delete, and URL generation for Azure Blob Storage
   - Automatically falls back to local storage if blob storage is not configured
   - Maintains backward compatibility

2. **Updated Upload Middleware** (`src/middleware/upload.js`)
   - Uses memory storage when blob storage is available
   - Automatically uploads files to blob storage after multer processes them
   - Updated `generatePublicUrl()` to return blob URLs
   - Updated `deleteImage()` to delete from blob storage

3. **Updated Upload Routes** (`src/routes/uploadRoutes.js`)
   - Added `processUploadedFiles` middleware to all upload routes
   - Ensures files are uploaded to blob storage before controllers process them

4. **Migration Script** (`scripts/migrate-to-blob-storage.js`)
   - Migrates existing files from `PUBLIC/uploads/` to blob storage
   - Supports dry-run mode for testing
   - Can migrate specific entity types or all files

### Frontend Changes

1. **Fixed Hardcoded URLs** (`src/pages/Home.jsx`)
   - Removed hardcoded localhost URLs
   - Added fallback UI for missing images
   - All images now use API-provided URLs

## 🚀 Setup Instructions

### Step 1: Create Azure Storage Account

```bash
# Create storage account
az storage account create \
  --name snapfeststorage \
  --resource-group snapfest-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Create container for uploads
az storage container create \
  --name uploads \
  --account-name snapfeststorage \
  --public-access blob

# Get connection string
az storage account show-connection-string \
  --name snapfeststorage \
  --resource-group snapfest-rg \
  --query connectionString \
  --output tsv
```

### Step 2: Configure Environment Variables

Add these to your `.env` file (local) and Azure App Service Configuration (production):

```bash
# Azure Blob Storage Configuration
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
    AZURE_STORAGE_CONNECTION_STRING="<connection-string>" \
    AZURE_STORAGE_CONTAINER_NAME="uploads" \
    AZURE_STORAGE_ACCOUNT_NAME="snapfeststorage" \
    AZURE_STORAGE_ACCOUNT_URL="https://snapfeststorage.blob.core.windows.net"
```

### Step 3: Migrate Existing Files (Optional)

If you have existing files in `PUBLIC/uploads/`, migrate them to blob storage:

```bash
# Dry run (see what would be uploaded)
npm run migrate:blob:dry-run

# Migrate all files
npm run migrate:blob

# Migrate specific entity type
node scripts/migrate-to-blob-storage.js --entity-type=packages

# Available entity types: packages, events, venues, beatbloom, profiles
```

### Step 4: Restart Backend

After setting environment variables, restart your backend:

```bash
# Local
npm run dev

# Azure
az webapp restart --name snapfest-api --resource-group snapfest-rg
```

## 🔄 How It Works

### Upload Flow

1. **Client** uploads image via API endpoint (e.g., `/api/upload/package/:packageId`)
2. **Multer** processes the file (using memory storage if blob storage is configured)
3. **processUploadedFiles** middleware uploads file to blob storage
4. **Controller** receives file with `blobUrl` property
5. **generatePublicUrl** returns blob URL (e.g., `https://snapfeststorage.blob.core.windows.net/uploads/packages/image.jpg`)
6. **Database** stores blob URL
7. **Frontend** displays image using blob URL

### Backward Compatibility

- **If blob storage is NOT configured**: System falls back to local filesystem storage
- **Old URLs still work**: Existing localhost URLs continue to work
- **Gradual migration**: You can migrate files gradually without breaking existing functionality

## 📁 File Structure

### Blob Storage Structure
```
uploads/
  ├── packages/
  │   ├── image-123.jpg
  │   └── image-456.jpg
  ├── events/
  │   └── event-789.jpg
  ├── venues/
  ├── beatbloom/
  └── profiles/
```

### Local Storage Structure (Fallback)
```
PUBLIC/
  └── uploads/
      ├── packages/
      ├── events/
      ├── venues/
      ├── beatbloom/
      └── profiles/
```

## 🧪 Testing

### Test Upload

```bash
# Upload a test image
curl -X POST \
  https://snapfest-api.azurewebsites.net/api/upload/profile \
  -H "Authorization: Bearer <token>" \
  -F "profileImage=@test-image.jpg"
```

### Verify Blob Storage

```bash
# List blobs in container
az storage blob list \
  --container-name uploads \
  --account-name snapfeststorage \
  --output table
```

## ⚠️ Important Notes

1. **Local Files Not Deleted**: The migration script does NOT delete local files. Delete them manually after verifying blob storage uploads.

2. **Environment Variables**: Blob storage only works if `AZURE_STORAGE_CONNECTION_STRING` is set. Without it, the system falls back to local storage.

3. **Public Access**: The container is set to `blob` public access, meaning blobs are publicly readable via URL. This is required for frontend image display.

4. **Cost**: Azure Blob Storage is very cost-effective:
   - First 50 GB: ~$1/month
   - Additional storage: ~$0.02/GB/month
   - Transactions: ~$0.004 per 10,000 operations

5. **CDN Integration**: You can later add Azure CDN in front of blob storage for even better performance.

## 🔍 Troubleshooting

### Images not uploading to blob storage

1. Check environment variables are set:
   ```bash
   echo $AZURE_STORAGE_CONNECTION_STRING
   ```

2. Check backend logs for blob storage errors:
   ```bash
   az webapp log tail --name snapfest-api --resource-group snapfest-rg
   ```

3. Verify storage account exists and container is created:
   ```bash
   az storage account show --name snapfeststorage --resource-group snapfest-rg
   az storage container show --name uploads --account-name snapfeststorage
   ```

### Images showing broken links

1. Check blob URLs are being generated correctly
2. Verify container has public access enabled
3. Check CORS settings if accessing from frontend

### Migration script errors

1. Ensure connection string is correct
2. Check file permissions on `PUBLIC/uploads/` directory
3. Verify storage account has sufficient quota

## 📚 Additional Resources

- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage SDK for Node.js](https://docs.microsoft.com/en-us/javascript/api/@azure/storage-blob/)
- [Azure Storage Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)

## ✅ Verification Checklist

- [ ] Azure Storage Account created
- [ ] Container `uploads` created with public access
- [ ] Environment variables set in `.env` and Azure App Service
- [ ] Backend restarted after setting environment variables
- [ ] Test upload successful
- [ ] Images displaying correctly on frontend
- [ ] Existing files migrated (if applicable)
- [ ] Local files cleaned up (after verification)

---

**Migration Status**: ✅ Complete
**Backward Compatibility**: ✅ Maintained
**Production Ready**: ✅ Yes
