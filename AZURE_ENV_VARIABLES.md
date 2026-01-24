# Azure Environment Variables Configuration

## 🔴 CRITICAL: Required Environment Variables for Backend

These environment variables **MUST** be set in Azure App Service Configuration for the backend to work correctly with token-based authentication.

### Backend Azure App Service Configuration

Navigate to: Azure Portal → App Services → `snapfest-api` → Configuration → Application settings

#### Required Variables:

```bash
# ============================================
# CORS CONFIGURATION (CRITICAL FOR TOKEN AUTH)
# ============================================
FRONTEND_URL=https://thankful-ground-00e7d820f.1.azurestaticapps.net
ALLOWED_ORIGINS=https://thankful-ground-00e7d820f.1.azurestaticapps.net

# ============================================
# CLERK AUTHENTICATION (CRITICAL)
# ============================================
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb://account:key@account.mongo.cosmos.azure.com:10255/snapfest?ssl=true&replicaSet=globaldb

# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=8080

# ============================================
# BACKEND URL
# ============================================
BACKEND_URL=https://snapfest-api.azurewebsites.net

# ============================================
# RAZORPAY (if using payments)
# ============================================
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# ============================================
# SENDGRID (if using email)
# ============================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@snapfest.com

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_EMAILS=admin@yourdomain.com

# ============================================
# AZURE BLOB STORAGE (for image uploads)
# ============================================
# Get connection string from Azure Portal -> Storage Account -> Access Keys
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=snapfeststorage;AccountKey=xxxxx;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=uploads
AZURE_STORAGE_ACCOUNT_NAME=snapfeststorage
AZURE_STORAGE_ACCOUNT_URL=https://snapfeststorage.blob.core.windows.net

# ============================================
# JWT (Legacy - for backward compatibility)
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### ⚠️ IMPORTANT NOTES:

1. **FRONTEND_URL**: Must match your Azure Static Web App URL exactly
   - Current: `https://thankful-ground-00e7d820f.1.azurestaticapps.net`
   - This is used for CORS validation

2. **ALLOWED_ORIGINS**: Must include all frontend URLs (comma-separated)
   - If you have multiple frontend apps (user, vendor, admin), add them all
   - Example: `https://thankful-ground-00e7d820f.1.azurestaticapps.net,https://vendor-app.azurestaticapps.net`

3. **CLERK_SECRET_KEY**: Must be the **production** secret key (starts with `sk_live_`)
   - Do NOT use development keys (`sk_test_`) in production

4. **CLERK_PUBLISHABLE_KEY**: Must be the **production** publishable key (starts with `pk_live_`)
   - Do NOT use development keys (`pk_test_`) in production

### Setting Environment Variables via Azure CLI:

```bash
az webapp config appsettings set \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    FRONTEND_URL="https://thankful-ground-00e7d820f.1.azurestaticapps.net" \
    ALLOWED_ORIGINS="https://thankful-ground-00e7d820f.1.azurestaticapps.net" \
    CLERK_PUBLISHABLE_KEY="pk_live_xxx" \
    CLERK_SECRET_KEY="sk_live_xxx" \
    MONGODB_URI="<your-cosmos-db-connection-string>" \
    BACKEND_URL="https://snapfest-api.azurewebsites.net"
```

### Verifying Environment Variables:

```bash
# List all environment variables
az webapp config appsettings list \
  --name snapfest-api \
  --resource-group snapfest-rg

# Check specific variable
az webapp config appsettings show \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --query "[?name=='FRONTEND_URL']"
```

### After Setting Variables:

1. **Restart the App Service**:
   ```bash
   az webapp restart --name snapfest-api --resource-group snapfest-rg
   ```

2. **Check Logs**:
   ```bash
   az webapp log tail --name snapfest-api --resource-group snapfest-rg
   ```

3. **Test Health Endpoint**:
   ```bash
   curl https://snapfest-api.azurewebsites.net/api/health
   ```

## ✅ Verification Checklist

- [ ] `FRONTEND_URL` is set and matches your frontend URL exactly
- [ ] `ALLOWED_ORIGINS` includes all frontend URLs
- [ ] `CLERK_SECRET_KEY` is production key (starts with `sk_live_`)
- [ ] `CLERK_PUBLISHABLE_KEY` is production key (starts with `pk_live_`)
- [ ] `MONGODB_URI` is correct and accessible
- [ ] `AZURE_STORAGE_CONNECTION_STRING` is set (for blob storage)
- [ ] `AZURE_STORAGE_CONTAINER_NAME` is set (default: uploads)
- [ ] `NODE_ENV=production`
- [ ] App Service has been restarted after setting variables
- [ ] Health check endpoint returns success

## 🔍 Troubleshooting

### If you see "Origin header required" error:
- Check that `FRONTEND_URL` is set correctly
- Check that `ALLOWED_ORIGINS` includes your frontend URL
- Restart the App Service

### If you see 401 Unauthorized errors:
- Verify `CLERK_SECRET_KEY` is correct (production key)
- Check backend logs for authentication errors
- Verify token is being sent in Authorization header (check browser Network tab)

### If CORS errors persist:
- Ensure `FRONTEND_URL` matches exactly (no trailing slash)
- Add frontend URL to `ALLOWED_ORIGINS` if not already there
- Restart App Service after changes
