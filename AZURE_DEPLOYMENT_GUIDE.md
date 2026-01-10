# 🚀 Snapfest Azure Deployment Guide

This guide provides step-by-step instructions for deploying the Snapfest application to Microsoft Azure Cloud.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Azure Services Setup](#azure-services-setup)
4. [Environment Variables](#environment-variables)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Domain Configuration](#domain-configuration)
8. [Post-Deployment Tasks](#post-deployment-tasks)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Azure Static Web Apps (x3)                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │   │
│  │  │ User App   │  │ Vendor App │  │ Admin App  │              │   │
│  │  └────────────┘  └────────────┘  └────────────┘              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            Azure App Service (Node.js Backend)                │   │
│  │           Express + Socket.io + File Storage                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            Azure Cosmos DB (MongoDB API)                      │   │
│  │                  OR MongoDB Atlas                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Azure Services Required

| Service | Purpose | Recommended Tier |
|---------|---------|------------------|
| **Azure App Service** | Backend API + WebSockets | B1 or S1 (Standard) |
| **Azure Cosmos DB** | MongoDB-compatible database | Free tier or Serverless |
| **Azure Static Web Apps** (x3) | Frontend hosting | Free or Standard |
| **Azure Blob Storage** | Image/file uploads | Standard LRS |
| **Azure Key Vault** | Secrets management | Standard |

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Azure account with active subscription
- [ ] Azure CLI installed (`az --version`)
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Clerk account with API keys
- [ ] Razorpay account with API keys
- [ ] SendGrid account with API key

---

## ☁️ Azure Services Setup

### Step 1: Create Resource Group

```bash
# Login to Azure
az login

# Create a resource group
az group create --name snapfest-rg --location eastus
```

### Step 2: Create Azure Cosmos DB (MongoDB API)

```bash
# Create Cosmos DB account with MongoDB API
az cosmosdb create \
  --name snapfest-db \
  --resource-group snapfest-rg \
  --kind MongoDB \
  --server-version 4.2 \
  --default-consistency-level Session \
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=False

# Create database
az cosmosdb mongodb database create \
  --account-name snapfest-db \
  --resource-group snapfest-rg \
  --name snapfest

# Get connection string
az cosmosdb keys list \
  --name snapfest-db \
  --resource-group snapfest-rg \
  --type connection-strings
```

**Alternative: Use MongoDB Atlas**

If you prefer MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Get the connection string
4. Whitelist Azure App Service IPs or use 0.0.0.0/0 (less secure)

### Step 3: Create Azure App Service (Backend)

```bash
# Create App Service Plan
az appservice plan create \
  --name snapfest-plan \
  --resource-group snapfest-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --plan snapfest-plan \
  --runtime "NODE:18-lts"

# Enable WebSockets (for Socket.io)
az webapp config set \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --web-sockets-enabled true

# Set startup command
az webapp config set \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --startup-file "npm start"
```

### Step 4: Create Azure Blob Storage (for uploads)

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
  --resource-group snapfest-rg
```

### Step 5: Create Azure Static Web Apps (Frontend)

For each portal (User, Vendor, Admin):

```bash
# Create Static Web App for User Portal
az staticwebapp create \
  --name snapfest-user \
  --resource-group snapfest-rg \
  --location eastus2

# Create Static Web App for Vendor Portal
az staticwebapp create \
  --name snapfest-vendor \
  --resource-group snapfest-rg \
  --location eastus2

# Create Static Web App for Admin Portal
az staticwebapp create \
  --name snapfest-admin \
  --resource-group snapfest-rg \
  --location eastus2
```

---

## 🔐 Environment Variables

### Backend Environment Variables

Set these in Azure App Service → Configuration → Application settings:

```bash
# Using Azure CLI
az webapp config appsettings set \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    MONGODB_URI="<your-cosmos-db-connection-string>" \
    CLERK_PUBLISHABLE_KEY="pk_live_xxx" \
    CLERK_SECRET_KEY="sk_live_xxx" \
    RAZORPAY_KEY_ID="rzp_live_xxx" \
    RAZORPAY_KEY_SECRET="xxx" \
    SENDGRID_API_KEY="SG.xxx" \
    EMAIL_FROM="noreply@snapfest.com" \
    FRONTEND_URL="https://snapfest-user.azurestaticapps.net" \
    BACKEND_URL="https://snapfest-api.azurewebsites.net" \
    ADMIN_EMAILS="admin@yourdomain.com" \
    JWT_SECRET="your-secure-random-string"
```

### Backend .env File Template

Create a `.env` file in `snapfest-backend/`:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5001
NODE_ENV=production

# ============================================
# DATABASE (MongoDB)
# ============================================
# Azure Cosmos DB (MongoDB API)
MONGODB_URI=mongodb://snapfest-db:PRIMARY_KEY@snapfest-db.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@snapfest-db@

# OR MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snapfest?retryWrites=true&w=majority

# ============================================
# CLERK AUTHENTICATION
# ============================================
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# ============================================
# RAZORPAY PAYMENT GATEWAY
# ============================================
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# ============================================
# SENDGRID EMAIL SERVICE
# ============================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@snapfest.com

# ============================================
# URLs
# ============================================
FRONTEND_URL=https://snapfest-user.azurestaticapps.net
BACKEND_URL=https://snapfest-api.azurewebsites.net

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAILS=admin@yourdomain.com

# ============================================
# JWT (Legacy)
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
```

### Frontend Environment Variables

Create a `.env` file in `snapfest-frontend/`:

```env
# ============================================
# API CONFIGURATION
# ============================================
VITE_API_BASE_URL=https://snapfest-api.azurewebsites.net/api

# ============================================
# CLERK AUTHENTICATION
# ============================================
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# ============================================
# RAZORPAY PAYMENT GATEWAY
# ============================================
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

Set these in Azure Static Web Apps → Configuration → Application settings for each app.

---

## 🚀 Backend Deployment

### Option A: Deploy via Azure CLI (Recommended)

```bash
cd snapfest-backend

# Create deployment package
zip -r deploy.zip . -x "node_modules/*" -x ".git/*" -x "logs/*"

# Deploy to Azure App Service
az webapp deployment source config-zip \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --src deploy.zip
```

### Option B: Deploy via GitHub Actions

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches:
      - main
    paths:
      - 'snapfest-backend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: snapfest-backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd snapfest-backend
        npm ci --production
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'snapfest-api'
        slot-name: 'production'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: snapfest-backend
```

### Option C: Deploy via Git

```bash
# Configure local Git deployment
az webapp deployment source config-local-git \
  --name snapfest-api \
  --resource-group snapfest-rg

# Get Git URL
az webapp deployment list-publishing-credentials \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --query scmUri --output tsv

# Add Azure as remote and push
cd snapfest-backend
git init
git remote add azure <git-url-from-above>
git add .
git commit -m "Initial deployment"
git push azure main
```

---

## 🎨 Frontend Deployment

### Build Frontend Apps

```bash
cd snapfest-frontend

# Install dependencies
npm install

# Build User App
npm run build:user

# Build Vendor App
npm run build:vendor

# Build Admin App
npm run build:admin
```

### Deploy to Azure Static Web Apps

**Option A: Using Azure CLI**

```bash
# Deploy User App
az staticwebapp deploy \
  --name snapfest-user \
  --resource-group snapfest-rg \
  --app-location ./dist/user \
  --api-location ""

# Deploy Vendor App
az staticwebapp deploy \
  --name snapfest-vendor \
  --resource-group snapfest-rg \
  --app-location ./dist/vendor \
  --api-location ""

# Deploy Admin App
az staticwebapp deploy \
  --name snapfest-admin \
  --resource-group snapfest-rg \
  --app-location ./dist/admin \
  --api-location ""
```

**Option B: Using GitHub Actions**

Create `.github/workflows/frontend-user-deploy.yml`:

```yaml
name: Deploy User Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'snapfest-frontend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install and Build
      run: |
        cd snapfest-frontend
        npm ci
        npm run build:user
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
        VITE_RAZORPAY_KEY_ID: ${{ secrets.VITE_RAZORPAY_KEY_ID }}
    
    - name: Deploy to Azure Static Web App
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_USER_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "snapfest-frontend/dist/user"
        skip_app_build: true
```

Create similar files for vendor and admin portals.

### Configure Static Web App Routing

Create `staticwebapp.config.json` in each build output folder:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*", "/css/*", "/js/*", "/assets/*"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
```

---

## 🌐 Domain Configuration

### Custom Domain Setup

1. **Azure App Service (Backend)**:
```bash
az webapp config hostname add \
  --webapp-name snapfest-api \
  --resource-group snapfest-rg \
  --hostname api.yourdomain.com
```

2. **Azure Static Web Apps (Frontend)**:
```bash
az staticwebapp hostname set \
  --name snapfest-user \
  --resource-group snapfest-rg \
  --hostname app.yourdomain.com

az staticwebapp hostname set \
  --name snapfest-vendor \
  --resource-group snapfest-rg \
  --hostname vendor.yourdomain.com

az staticwebapp hostname set \
  --name snapfest-admin \
  --resource-group snapfest-rg \
  --hostname admin.yourdomain.com
```

### SSL Certificates

Azure provides free SSL certificates for custom domains on:
- App Service (managed certificates)
- Static Web Apps (automatic)

---

## ✅ Post-Deployment Tasks

### 1. Update CORS Origins in Backend

Update `server.js` to include your Azure domains in the allowed origins:

```javascript
const allowedOrigins = [
  'https://snapfest-user.azurestaticapps.net',
  'https://snapfest-vendor.azurestaticapps.net',
  'https://snapfest-admin.azurestaticapps.net',
  'https://app.yourdomain.com',
  'https://vendor.yourdomain.com',
  'https://admin.yourdomain.com',
  process.env.FRONTEND_URL
].filter(Boolean);
```

### 2. Update Clerk Configuration

In Clerk Dashboard → Settings:
- Add your Azure URLs to **Allowed Origins**
- Add your custom domains to **Allowed Origins**
- Update redirect URLs if needed

### 3. Update Razorpay Webhook URLs

In Razorpay Dashboard → Webhooks:
- Add webhook URL: `https://snapfest-api.azurewebsites.net/api/webhooks/razorpay`

### 4. Update SendGrid Settings

In SendGrid → Settings → Sender Authentication:
- Verify your domain
- Update FROM email if using custom domain

### 5. Set Up Monitoring

```bash
# Create Application Insights
az monitor app-insights component create \
  --app snapfest-insights \
  --location eastus \
  --resource-group snapfest-rg

# Link to App Service
az webapp config appsettings set \
  --name snapfest-api \
  --resource-group snapfest-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="<instrumentation-key>"
```

### 6. Configure Backups

```bash
# Create backup for Cosmos DB
az cosmosdb sql container throughput migrate \
  --account-name snapfest-db \
  --database-name snapfest \
  --resource-group snapfest-rg \
  --name users \
  --throughput-type autoscale
```

---

## 🔍 Troubleshooting

### Common Issues

**1. CORS Errors**
- Check that FRONTEND_URL is set correctly
- Verify allowed origins in server.js
- Check Clerk Dashboard allowed origins

**2. Database Connection Fails**
- Verify MONGODB_URI connection string
- Check firewall rules (allow Azure services)
- Test connection with MongoDB Compass

**3. WebSocket Connection Fails**
- Ensure WebSockets are enabled on App Service
- Check Socket.io CORS configuration
- Verify URL uses wss:// for HTTPS

**4. File Uploads Fail**
- Check Blob Storage permissions
- Verify container exists
- Check CORS settings on storage account

**5. Clerk Authentication Issues**
- Verify all Clerk keys are set correctly
- Check allowed origins in Clerk Dashboard
- Ensure cookies are being sent (credentials: true)

### View Logs

```bash
# Stream backend logs
az webapp log tail \
  --name snapfest-api \
  --resource-group snapfest-rg

# Download logs
az webapp log download \
  --name snapfest-api \
  --resource-group snapfest-rg
```

---

## 💰 Cost Estimation

| Service | Tier | Estimated Monthly Cost |
|---------|------|------------------------|
| App Service | B1 | ~$13 |
| Cosmos DB | Serverless | $0-25 (based on usage) |
| Static Web Apps (x3) | Free | $0 |
| Blob Storage | Standard LRS | ~$2 |
| **Total** | | **~$15-40/month** |

For production workloads, consider upgrading to:
- App Service S1 (~$70/month) for better performance
- Cosmos DB Provisioned (~$25+/month) for guaranteed throughput

---

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Cosmos DB MongoDB API](https://docs.microsoft.com/azure/cosmos-db/mongodb/)
- [Clerk Documentation](https://clerk.com/docs)
- [Razorpay Documentation](https://razorpay.com/docs/)

---

## 🆘 Support

If you encounter issues during deployment:
1. Check Azure Portal for service health
2. Review application logs
3. Verify all environment variables are set
4. Test each component individually

Good luck with your deployment! 🚀

