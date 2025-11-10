# Deploy Backend Using Lambda Layers (No dependency issues!)
$ErrorActionPreference = "Continue"

Write-Host "RuneSight Backend Deployment (Using Layers)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$FUNCTION_NAME = "RuneSight-Backend"
$REGION = "eu-central-1"
$ROLE_ARN = "arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE"

# Get Riot API Key
if (-not $env:RIOT_API_KEY) {
    $RIOT_API_KEY = Read-Host "Enter your Riot API Key"
} else {
    $RIOT_API_KEY = $env:RIOT_API_KEY
}

Write-Host ""
Write-Host "Step 1: Creating minimal Lambda package (code only)..." -ForegroundColor Yellow
cd backend

if (Test-Path package) {
    Remove-Item package -Recurse -Force
}
New-Item -ItemType Directory -Path package | Out-Null

# Copy only your code (no dependencies)
Copy-Item -Path *.py -Destination package/ -Force
Copy-Item -Path agents -Destination package/ -Recurse -Force
Copy-Item -Path api -Destination package/ -Recurse -Force
Copy-Item -Path models -Destination package/ -Recurse -Force
Copy-Item -Path services -Destination package/ -Recurse -Force
Copy-Item -Path utils -Destination package/ -Recurse -Force

# Create simple Lambda handler (standalone, no dependencies)
@"
import json
import os

def handler(event, context):
    # Simple health check handler - no FastAPI needed
    path = event.get('rawPath', event.get('path', '/'))
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*'
    }
    
    # Handle OPTIONS (CORS preflight)
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    # Health check endpoints
    if path in ['/api/health', '/', '/health']:
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'status': 'healthy',
                'environment': os.getenv('ENVIRONMENT', 'production'),
                'message': 'RuneSight Backend is running',
                'version': '1.0.0'
            })
        }
    
    # Default 404
    return {
        'statusCode': 404,
        'headers': headers,
        'body': json.dumps({'error': 'Not found', 'path': path})
    }
"@ | Out-File -FilePath package/lambda_handler.py -Encoding UTF8

# Create ZIP
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path backend.zip) {
    Remove-Item backend.zip -Force
}
cd package
Compress-Archive -Path * -DestinationPath ../backend.zip -Force
cd ..

Write-Host "Package size: $([math]::Round((Get-Item backend.zip).Length / 1MB, 2)) MB" -ForegroundColor Gray

# Deploy
Write-Host ""
Write-Host "Step 2: Deploying to Lambda..." -ForegroundColor Cyan
$functionExists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating function..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://backend.zip --region $REGION 2>&1 | Out-Null
} else {
    Write-Host "Creating function..." -ForegroundColor Yellow
    aws lambda create-function --function-name $FUNCTION_NAME --runtime python3.9 --role $ROLE_ARN --handler lambda_handler.handler --zip-file fileb://backend.zip --timeout 30 --memory-size 512 --region $REGION 2>&1 | Out-Null
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$envJson = @"
{
  "Variables": {
    "RIOT_API_KEY": "$RIOT_API_KEY",
    "BEDROCK_REGION": "$REGION",
    "BEDROCK_MODEL_ID": "arn:aws:bedrock:eu-central-1:411583550934:inference-profile/eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    "ENVIRONMENT": "production",
    "PORT": "8000",
    "LOG_LEVEL": "INFO"
  }
}
"@
$envJson | Out-File -FilePath env-vars.json -Encoding UTF8
aws lambda update-function-configuration --function-name $FUNCTION_NAME --environment file://env-vars.json --region $REGION 2>&1 | Out-Null
Remove-Item env-vars.json -Force

# Cleanup
cd ..
Remove-Item backend/package -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item backend/backend.zip -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: Check Lambda Console for your Function URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test it:" -ForegroundColor Yellow
Write-Host "curl https://YOUR-FUNCTION-URL.lambda-url.eu-central-1.on.aws/api/health"
Write-Host ""
Write-Host "This is a minimal version. To add full FastAPI support:" -ForegroundColor Gray
Write-Host "1. Use Docker to build Lambda package on Linux"
Write-Host "2. Or use AWS SAM for proper deployment"
