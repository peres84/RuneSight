# RuneSight Frontend Deployment Script (AWS Amplify)
# Deploys React frontend to AWS Amplify with GitHub integration

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "frontend.config.json"
)

# Color output functions
function Write-Step { param($Message) Write-Host "[STEP] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor White }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RuneSight Frontend Deployment (AWS Amplify)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if config file exists
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Config file not found: $ConfigFile"
    Write-Info "Please create $ConfigFile from frontend.config.example.json"
    exit 1
}

# Load configuration
try {
    Write-Step "Loading configuration from $ConfigFile"
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    Write-Success "Configuration loaded"
} catch {
    Write-Error "Failed to parse config file: $_"
    exit 1
}

# Extract configuration
$APP_NAME = $config.amplify.appName
$REGION = $config.amplify.region
$GITHUB_REPO = $config.github.repository
$GITHUB_BRANCH = $config.github.branch
$GITHUB_TOKEN = $config.github.token

Write-Info "App Name: $APP_NAME"
Write-Info "Region: $REGION"
Write-Info "Repository: $GITHUB_REPO"
Write-Info "Branch: $GITHUB_BRANCH"
Write-Host ""

# Check AWS CLI
Write-Step "Checking AWS CLI"
try {
    $awsVersion = aws --version 2>&1
    Write-Success "AWS CLI found"
} catch {
    Write-Error "AWS CLI not found. Please install it from https://aws.amazon.com/cli/"
    exit 1
}

# Check AWS credentials
Write-Step "Checking AWS credentials"
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    $AWS_ACCOUNT_ID = $identity.Account
    Write-Success "Using AWS Account: $AWS_ACCOUNT_ID"
} catch {
    Write-Error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
}

Write-Host ""

# Check if app already exists
Write-Step "Checking if Amplify app exists"

$existingApps = aws amplify list-apps --region $REGION | ConvertFrom-Json
$existingApp = $existingApps.apps | Where-Object { $_.name -eq $APP_NAME }

if ($existingApp) {
    $APP_ID = $existingApp.appId
    Write-Warning "App already exists: $APP_ID"
    
    # Update environment variables
    Write-Step "Updating environment variables"
    
    $envVars = @{}
    $config.environment.PSObject.Properties | ForEach-Object {
        $envVars[$_.Name] = $_.Value
    }
    
    $envVarsJson = $envVars | ConvertTo-Json -Compress
    
    aws amplify update-app `
        --app-id $APP_ID `
        --region $REGION `
        --environment-variables ($envVarsJson -replace '"', '\"') | Out-Null
    
    Write-Success "Environment variables updated"
} else {
    Write-Step "Creating new Amplify app"
    
    # Prepare environment variables
    $envVars = @{}
    $config.environment.PSObject.Properties | ForEach-Object {
        $envVars[$_.Name] = $_.Value
    }
    
    $envVarsJson = $envVars | ConvertTo-Json -Compress
    
    # Create app
    $createResult = aws amplify create-app `
        --name $APP_NAME `
        --region $REGION `
        --platform WEB `
        --repository $GITHUB_REPO `
        --oauth-token $GITHUB_TOKEN `
        --environment-variables ($envVarsJson -replace '"', '\"') | ConvertFrom-Json
    
    $APP_ID = $createResult.app.appId
    Write-Success "Created app with ID: $APP_ID"
    
    # Create branch
    Write-Step "Creating branch connection"
    
    aws amplify create-branch `
        --app-id $APP_ID `
        --branch-name $GITHUB_BRANCH `
        --region $REGION `
        --enable-auto-build | Out-Null
    
    Write-Success "Branch connected"
}

Write-Host ""

# Start deployment
Write-Step "Starting deployment"

$jobResult = aws amplify start-job `
    --app-id $APP_ID `
    --branch-name $GITHUB_BRANCH `
    --job-type RELEASE `
    --region $REGION | ConvertFrom-Json

$JOB_ID = $jobResult.jobSummary.jobId
Write-Success "Deployment started (Job ID: $JOB_ID)"

Write-Host ""
Write-Info "Monitoring deployment..."

# Monitor deployment
$maxAttempts = 60
$attempt = 0

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 10
    $attempt++
    
    $jobStatus = aws amplify get-job `
        --app-id $APP_ID `
        --branch-name $GITHUB_BRANCH `
        --job-id $JOB_ID `
        --region $REGION | ConvertFrom-Json
    
    $status = $jobStatus.job.summary.status
    
    if ($status -eq "SUCCEED") {
        Write-Success "Deployment successful!"
        break
    } elseif ($status -eq "FAILED" -or $status -eq "CANCELLED") {
        Write-Error "Deployment failed with status: $status"
        Write-Info "Check logs at: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
        exit 1
    } else {
        Write-Info "Status: $status (attempt $attempt/$maxAttempts)"
    }
}

if ($attempt -ge $maxAttempts) {
    Write-Warning "Deployment monitoring timed out. Check console for status."
}

# Get app URL
$appInfo = aws amplify get-app --app-id $APP_ID --region $REGION | ConvertFrom-Json
$APP_DOMAIN = $appInfo.app.defaultDomain
$FULL_URL = "https://$GITHUB_BRANCH.$APP_DOMAIN"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Write-Success "App ID: $APP_ID"
Write-Success "URL: $FULL_URL"
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open your app: $FULL_URL"
Write-Host "2. Update backend ALLOWED_ORIGINS with: $FULL_URL"
Write-Host "3. Test the application"
Write-Host ""
