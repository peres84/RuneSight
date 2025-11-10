# RuneSight AWS Amplify Deployment
$ErrorActionPreference = "Continue"

Write-Host "RuneSight Deployment" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# Config
$APP_NAME = "RuneSight"
$REGION = "eu-central-1"
$GITHUB_REPO = "peres84/RuneSight"
$GITHUB_BRANCH = "main"

# Check AWS CLI
aws --version | Out-Null
$AWS_ACCOUNT = aws sts get-caller-identity --query Account --output text
Write-Host "AWS Account: $AWS_ACCOUNT" -ForegroundColor Gray

# Get inputs
if (-not $env:RIOT_API_KEY) {
    $RIOT_API_KEY = Read-Host "Enter Riot API Key"
} else {
    $RIOT_API_KEY = $env:RIOT_API_KEY
}

Write-Host ""
Write-Host "GitHub Token: https://github.com/settings/tokens/new" -ForegroundColor Yellow
Write-Host "Scopes: repo, admin:repo_hook" -ForegroundColor Gray
$GITHUB_TOKEN_SECURE = Read-Host "Enter GitHub Token" -AsSecureString
$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($GITHUB_TOKEN_SECURE)
$GITHUB_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Try to create app with GitHub
Write-Host ""
Write-Host "Creating Amplify app with GitHub..." -ForegroundColor Cyan

try {
    $result = aws amplify create-app `
        --name $APP_NAME `
        --region $REGION `
        --repository "https://github.com/$GITHUB_REPO" `
        --oauth-token $GITHUB_TOKEN `
        --access-token $GITHUB_TOKEN `
        --enable-branch-auto-build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Parse JSON to get app ID
        $appData = $result | ConvertFrom-Json
        $APP_ID = $appData.app.appId
        Write-Host "GitHub connected successfully!" -ForegroundColor Green
    } else {
        throw $result
    }
} catch {
    Write-Host ""
    Write-Host "GitHub connection failed:" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating app without GitHub..." -ForegroundColor Cyan
    
    $result = aws amplify create-app --name $APP_NAME --region $REGION
    $appData = $result | ConvertFrom-Json
    $APP_ID = $appData.app.appId
    $MANUAL = $true
}

Write-Host "App created: $APP_ID" -ForegroundColor Green

# Create branch
Write-Host "Creating branch..." -ForegroundColor Cyan
if ($MANUAL) {
    aws amplify create-branch --app-id $APP_ID --branch-name $GITHUB_BRANCH --region $REGION | Out-Null
} else {
    aws amplify create-branch --app-id $APP_ID --branch-name $GITHUB_BRANCH --region $REGION --enable-auto-build | Out-Null
}
Write-Host "Branch created" -ForegroundColor Green

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Cyan
$envVars = "RIOT_API_KEY=$RIOT_API_KEY,BEDROCK_REGION=eu-central-1,BEDROCK_MODEL_ID=arn:aws:bedrock:eu-central-1:411583550934:inference-profile/eu.anthropic.claude-sonnet-4-5-20250929-v1:0,ENVIRONMENT=production,PORT=8000,LOG_LEVEL=INFO"
aws amplify update-app --app-id $APP_ID --region $REGION --environment-variables $envVars | Out-Null
Write-Host "Environment variables set" -ForegroundColor Green

if (-not $MANUAL) {
    # Start deployment
    Write-Host ""
    Write-Host "Starting deployment..." -ForegroundColor Cyan
    $JOB_ID = aws amplify start-job --app-id $APP_ID --branch-name $GITHUB_BRANCH --job-type RELEASE --region $REGION --query 'jobSummary.jobId' --output text
    
    Write-Host "Monitoring deployment (Job: $JOB_ID)..." -ForegroundColor Gray
    $attempts = 0
    while ($attempts -lt 60) {
        $STATUS = aws amplify get-job --app-id $APP_ID --branch-name $GITHUB_BRANCH --job-id $JOB_ID --region $REGION --query 'job.summary.status' --output text
        
        if ($STATUS -eq "SUCCEED") {
            Write-Host "Deployment successful!" -ForegroundColor Green
            break
        } elseif ($STATUS -eq "FAILED" -or $STATUS -eq "CANCELLED") {
            Write-Host "Deployment failed: $STATUS" -ForegroundColor Red
            Write-Host "Check logs: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID" -ForegroundColor Yellow
            break
        }
        
        Write-Host "  Status: $STATUS" -ForegroundColor Gray
        Start-Sleep -Seconds 10
        $attempts++
    }
}

# Get URL
$APP_URL = aws amplify get-app --app-id $APP_ID --region $REGION --query 'app.defaultDomain' --output text
$FULL_URL = "https://$GITHUB_BRANCH.$APP_URL"

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "App ID: $APP_ID"
Write-Host "Region: $REGION"
Write-Host "URL: $FULL_URL"
Write-Host ""

if ($MANUAL) {
    Write-Host "NEXT STEP: Connect GitHub" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
    Write-Host "2. Click 'Connect repository'"
    Write-Host "3. Select GitHub and authorize"
    Write-Host "4. Select: peres84/RuneSight"
    Write-Host "5. Branch: main"
    Write-Host "6. Click 'Save and deploy'"
    Write-Host ""
} else {
    Write-Host "Test your app: curl $FULL_URL/api/health" -ForegroundColor Cyan
}

Write-Host "Environment variables are configured!" -ForegroundColor Green
