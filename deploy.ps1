# RuneSight AWS Amplify Deployment Script (PowerShell)
# This script deploys RuneSight to AWS Amplify using AWS CLI

$ErrorActionPreference = "Stop"

Write-Host "🚀 RuneSight AWS Amplify Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Configuration
$APP_NAME = "RuneSight"
$REGION = "us-east-1"  # Change to your preferred region
$GITHUB_REPO = "https://github.com/YOUR_USERNAME/YOUR_REPO"  # Update this
$GITHUB_BRANCH = "main"

# Environment Variables
$RIOT_API_KEY = $env:RIOT_API_KEY
$AWS_BEDROCK_REGION = if ($env:AWS_BEDROCK_REGION) { $env:AWS_BEDROCK_REGION } else { "eu-central-1" }
$BEDROCK_MODEL_ID = if ($env:BEDROCK_MODEL_ID) { $env:BEDROCK_MODEL_ID } else { "arn:aws:bedrock:eu-central-1:411583550934:inference-profile/eu.anthropic.claude-sonnet-4-5-20250929-v1:0" }

# Check if AWS CLI is installed
Write-Host "✅ Checking AWS CLI..." -ForegroundColor Green
try {
    aws --version | Out-Null
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check AWS credentials
Write-Host "✅ Checking AWS credentials..." -ForegroundColor Green
try {
    $AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
    Write-Host "   Using AWS Account: $AWS_ACCOUNT_ID" -ForegroundColor Gray
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Prompt for missing values
if (-not $RIOT_API_KEY) {
    Write-Host ""
    $RIOT_API_KEY = Read-Host "Enter your Riot API Key"
}

$GITHUB_TOKEN = Read-Host "Enter your GitHub Personal Access Token (with repo access)" -AsSecureString
$GITHUB_TOKEN_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GITHUB_TOKEN))

# Check if app already exists
Write-Host ""
Write-Host "🔍 Checking if Amplify app exists..." -ForegroundColor Cyan
$APP_ID = aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>$null

if (-not $APP_ID) {
    Write-Host "📦 Creating new Amplify app..." -ForegroundColor Yellow
    
    # Read amplify.yml
    $BUILD_SPEC = Get-Content -Path "amplify.yml" -Raw
    
    # Create environment variables JSON
    $ENV_VARS = @{
        RIOT_API_KEY = $RIOT_API_KEY
        AWS_REGION = $AWS_BEDROCK_REGION
        AWS_ACCESS_KEY_ID = $env:AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY = $env:AWS_SECRET_ACCESS_KEY
        BEDROCK_MODEL_ID = $BEDROCK_MODEL_ID
        ENVIRONMENT = "production"
        PORT = "8000"
        LOG_LEVEL = "INFO"
    } | ConvertTo-Json -Compress
    
    # Create app
    $APP_ID = aws amplify create-app `
        --name $APP_NAME `
        --region $REGION `
        --platform WEB `
        --repository $GITHUB_REPO `
        --oauth-token $GITHUB_TOKEN_PLAIN `
        --environment-variables $ENV_VARS `
        --query 'app.appId' `
        --output text
    
    Write-Host "✅ Created app with ID: $APP_ID" -ForegroundColor Green
    
    # Create branch
    Write-Host "🌿 Creating branch connection..." -ForegroundColor Cyan
    aws amplify create-branch `
        --app-id $APP_ID `
        --branch-name $GITHUB_BRANCH `
        --region $REGION `
        --enable-auto-build | Out-Null
    
    Write-Host "✅ Branch connected" -ForegroundColor Green
} else {
    Write-Host "✅ Found existing app: $APP_ID" -ForegroundColor Green
    
    # Update environment variables
    Write-Host "🔧 Updating environment variables..." -ForegroundColor Cyan
    
    $ENV_VARS = @{
        RIOT_API_KEY = $RIOT_API_KEY
        AWS_REGION = $AWS_BEDROCK_REGION
        AWS_ACCESS_KEY_ID = $env:AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY = $env:AWS_SECRET_ACCESS_KEY
        BEDROCK_MODEL_ID = $BEDROCK_MODEL_ID
        ENVIRONMENT = "production"
        PORT = "8000"
        LOG_LEVEL = "INFO"
    } | ConvertTo-Json -Compress
    
    aws amplify update-app `
        --app-id $APP_ID `
        --region $REGION `
        --environment-variables $ENV_VARS | Out-Null
    
    Write-Host "✅ Environment variables updated" -ForegroundColor Green
}

# Start deployment
Write-Host ""
Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
$JOB_ID = aws amplify start-job `
    --app-id $APP_ID `
    --branch-name $GITHUB_BRANCH `
    --job-type RELEASE `
    --region $REGION `
    --query 'jobSummary.jobId' `
    --output text

Write-Host "✅ Deployment started (Job ID: $JOB_ID)" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitoring deployment..." -ForegroundColor Cyan

# Monitor deployment
while ($true) {
    $STATUS = aws amplify get-job `
        --app-id $APP_ID `
        --branch-name $GITHUB_BRANCH `
        --job-id $JOB_ID `
        --region $REGION `
        --query 'job.summary.status' `
        --output text
    
    if ($STATUS -eq "SUCCEED") {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        break
    } elseif ($STATUS -eq "FAILED" -or $STATUS -eq "CANCELLED") {
        Write-Host "❌ Deployment failed with status: $STATUS" -ForegroundColor Red
        Write-Host "Check logs at: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "   Status: $STATUS" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

# Get app URL
$APP_URL = aws amplify get-app `
    --app-id $APP_ID `
    --region $REGION `
    --query 'app.defaultDomain' `
    --output text

$FULL_URL = "https://$GITHUB_BRANCH.$APP_URL"

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "App ID: $APP_ID"
Write-Host "URL: $FULL_URL"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update ALLOWED_ORIGINS environment variable with: $FULL_URL"
Write-Host "2. Test your app: curl $FULL_URL/api/health"
Write-Host "3. Open in browser: $FULL_URL"
Write-Host ""
Write-Host "To update CORS, run:" -ForegroundColor Cyan
Write-Host "aws amplify update-app --app-id $APP_ID --region $REGION --environment-variables ALLOWED_ORIGINS=$FULL_URL"
