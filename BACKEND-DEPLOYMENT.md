# Backend Deployment Guide

## Working Solution: Minimal Lambda Deployment

This guide documents the **working deployment process** for the RuneSight backend to AWS Lambda.

## Why This Approach?

The backend uses Python packages with C extensions (pydantic, FastAPI) that are compiled for Windows. Lambda runs on Linux, so these packages don't work when installed on Windows and uploaded to Lambda.

**Solution**: Deploy a minimal Lambda function without heavy dependencies for basic functionality.

## Deployment Steps

### 1. Run the Deployment Script

```powershell
.\deploy-backend-layers.ps1
```

**What it does:**
1. Creates a minimal Lambda package with only your Python code (no dependencies)
2. Creates a standalone Lambda handler that doesn't require FastAPI
3. Deploys to AWS Lambda
4. Sets environment variables
5. Returns the backend URL

### 2. Verify Deployment

Test the health endpoint:
```powershell
curl https://your-lambda-url.lambda-url.eu-central-1.on.aws/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "message": "RuneSight Backend is running",
  "version": "1.0.0"
}
```

### 3. Connect to Frontend

The backend URL is already set in Amplify. Redeploy frontend:
```powershell
aws amplify start-job `
  --app-id YOUR_APP_ID `
  --branch-name main `
  --job-type RELEASE `
  --region eu-central-1
```

## Current Backend Capabilities

The minimal Lambda function currently supports:
- ✅ Health check endpoint (`/api/health`)
- ✅ CORS enabled for frontend
- ✅ Environment variables configured
- ✅ Fast response times (no cold start issues)

## Limitations

This minimal version does NOT include:
- ❌ Full FastAPI routing
- ❌ Riot API integration
- ❌ AI/Bedrock integration
- ❌ Database operations

## Upgrading to Full Backend

To add full FastAPI support with all features, use Docker:

### Option 1: Docker Build (Recommended)

```powershell
# Build Lambda container image
docker build -f Dockerfile.lambda -t runesight-backend .

# Tag for ECR
docker tag runesight-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/runesight-backend:latest

# Push to ECR
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com
docker push YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/runesight-backend:latest

# Update Lambda to use container
aws lambda update-function-code `
  --function-name RuneSight-Backend `
  --image-uri YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/runesight-backend:latest `
  --region eu-central-1
```

### Option 2: AWS SAM

Use AWS SAM CLI for proper infrastructure as code deployment.

## Environment Variables

The following environment variables are set in Lambda:
- `RIOT_API_KEY` - Your Riot Games API key
- `BEDROCK_REGION` - eu-central-1
- `BEDROCK_MODEL_ID` - Claude Sonnet model ARN
- `ENVIRONMENT` - production
- `PORT` - 8000
- `LOG_LEVEL` - INFO

## Troubleshooting

### 502 Bad Gateway
- Check CloudWatch logs: `aws logs tail /aws/lambda/RuneSight-Backend --region eu-central-1 --follow`
- Common cause: Import errors or missing dependencies

### Function Not Found
- Verify function exists: `aws lambda list-functions --region eu-central-1`
- Redeploy using the script

### CORS Errors
- The minimal handler includes CORS headers
- Verify `Access-Control-Allow-Origin: *` in response

## Files

- `deploy-backend-layers.ps1` - Working deployment script
- `Dockerfile.lambda` - For Docker-based deployment (future)
- `lambda-env.json` - Environment variables (gitignored)

## Deployment Configuration

**Function Name**: RuneSight-Backend
**Region**: eu-central-1
**Runtime**: Python 3.9
**Memory**: 512 MB
**Timeout**: 30 seconds
**Backend URL**: Check Lambda Console → Function URL

---

**Status**: ✅ Working - Basic health check functional
**Next Step**: Upgrade to full FastAPI with Docker when needed
