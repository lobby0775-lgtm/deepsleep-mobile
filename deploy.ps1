# DeepSleep Mobile Deployment Script for PowerShell
# Run this script to deploy to Vercel

Write-Host "🚀 DeepSleep Mobile Deployment" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan

# Check if in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Run this script from the deepsleep-mobile directory" -ForegroundColor Red
    exit 1
}

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Yellow

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Build web version
Write-Host "`n🔨 Building web version..." -ForegroundColor Cyan
npm run build:web

# Check if Vercel CLI is installed
Write-Host "`n🔍 Checking Vercel CLI..." -ForegroundColor Cyan
$vercelCheck = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelCheck) {
    Write-Host "❌ Vercel CLI not found. Please install it:" -ForegroundColor Red
    Write-Host "   npm install -g vercel" -ForegroundColor Yellow
    Write-Host "`nThen run: vercel login" -ForegroundColor Yellow
    Write-Host "And run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Vercel
Write-Host "`n🔐 Checking Vercel login status..." -ForegroundColor Cyan
try {
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
    } else {
        Write-Host "❌ Not logged in to Vercel" -ForegroundColor Red
        Write-Host "`nPlease run: vercel login" -ForegroundColor Yellow
        Write-Host "Then run this script again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error checking Vercel login" -ForegroundColor Red
    Write-Host "Please run: vercel login" -ForegroundColor Yellow
    exit 1
}

# Deploy to Vercel
Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Green
Write-Host "Follow the prompts below:" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Cyan

vercel

Write-Host "`n✅ Deployment initiated!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the deployment URL provided above" -ForegroundColor Yellow
Write-Host "2. Test all features (login, sleep logging, etc.)" -ForegroundColor Yellow
Write-Host "3. For production deployment, run: vercel --prod" -ForegroundColor Yellow
Write-Host "`n🌐 Your app will be available at: https://deepsleep-mobile.vercel.app" -ForegroundColor Green

# Optional: Deploy to production
$deployProd = Read-Host "`nDeploy to production now? (y/n)"
if ($deployProd -eq 'y' -or $deployProd -eq 'Y') {
    Write-Host "`n🚀 Deploying to production..." -ForegroundColor Green
    vercel --prod
    Write-Host "`n✅ Production deployment complete!" -ForegroundColor Green
}