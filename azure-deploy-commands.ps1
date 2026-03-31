# ═══════════════════════════════════════════════════════════════
# POLARIS — Azure Deployment Commands
# Run these AFTER you have Contributor access
# ═══════════════════════════════════════════════════════════════

# Step 1: Login to Azure
az login

# Step 2: Set subscription
az account set --subscription "Pay-As-You-Go"

# Step 3: Create Resource Group (West Europe = closest to Greece)
az group create --name polaris-rg --location westeurope

# Step 4: Create App Service Plan (B1 = Basic, ~$13/month)
az appservice plan create `
  --name polaris-plan `
  --resource-group polaris-rg `
  --sku B1 `
  --is-linux

# Step 5: Create Web App (Node 20 LTS)
az webapp create `
  --name polaris-tpa `
  --resource-group polaris-rg `
  --plan polaris-plan `
  --runtime "NODE:20-lts"

# Step 6: Configure Environment Variables
az webapp config appsettings set `
  --name polaris-tpa `
  --resource-group polaris-rg `
  --settings `
    NEXTAUTH_SECRET="GENERATE-A-SECRET-KEY-HERE" `
    NEXTAUTH_URL="https://polaris-tpa.azurewebsites.net" `
    GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/AKfycbye9XIpC0VLyBLftcN3ew5nw7BvbKd19-_JCR-xfKWEtjbvWYJqdvOSjfoaruI7ixp6/exec" `
    NEXT_PUBLIC_APP_NAME="Polaris" `
    NEXT_PUBLIC_APP_URL="https://polaris-tpa.azurewebsites.net" `
    NODE_ENV="production" `
    WEBSITE_NODE_DEFAULT_VERSION="~20" `
    SCM_DO_BUILD_DURING_DEPLOYMENT="false"

# Step 7: Set startup command
az webapp config set `
  --name polaris-tpa `
  --resource-group polaris-rg `
  --startup-file "node server.js"

# Step 8: Enable logging
az webapp log config `
  --name polaris-tpa `
  --resource-group polaris-rg `
  --application-logging filesystem `
  --level information

# Step 9: Download publish profile (for GitHub Actions)
az webapp deployment list-publishing-profiles `
  --name polaris-tpa `
  --resource-group polaris-rg `
  --xml

# ═══════════════════════════════════════════════════════════════
# After running Step 9, copy the XML output and add it as a
# GitHub secret named AZURE_PUBLISH_PROFILE
# ═══════════════════════════════════════════════════════════════

# Step 10: View the live app
Write-Output ""
Write-Output "Your app will be live at:"
Write-Output "https://polaris-tpa.azurewebsites.net"
Write-Output ""

# ═══════════════════════════════════════════════════════════════
# MONTHLY COST ESTIMATE (West Europe, B1 plan):
# App Service B1:  ~$13/month (1 core, 1.75GB RAM)
# Cosmos DB Free:  $0/month (first 1000 RU/s free)
# Total:           ~$13/month
# ═══════════════════════════════════════════════════════════════
