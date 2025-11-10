#!/bin/bash

# RuneSight AWS Amplify Deployment Script
# This script deploys RuneSight to AWS Amplify using AWS CLI

set -e  # Exit on error

echo "🚀 RuneSight AWS Amplify Deployment"
echo "===================================="

# Configuration
APP_NAME="RuneSight"
REGION="eu-central-1"
GITHUB_REPO="https://github.com/peres84/RuneSight"
GITHUB_BRANCH="main"
GITHUB_TOKEN=""  # Will prompt if not set

# Environment Variables (Update these with your actual values)
RIOT_API_KEY="${RIOT_API_KEY:-}"
AWS_BEDROCK_REGION="${AWS_BEDROCK_REGION:-eu-central-1}"
BEDROCK_MODEL_ID="${BEDROCK_MODEL_ID:-arn:aws:bedrock:eu-central-1:411583550934:inference-profile/eu.anthropic.claude-sonnet-4-5-20250929-v1:0}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    echo "   Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "✅ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   Using AWS Account: $AWS_ACCOUNT_ID"

# Prompt for missing values
if [ -z "$RIOT_API_KEY" ]; then
    echo ""
    read -p "Enter your Riot API Key: " RIOT_API_KEY
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "GitHub Personal Access Token needed (with repo access)"
    echo "Create one at: https://github.com/settings/tokens"
    read -sp "Enter your GitHub Token: " GITHUB_TOKEN
    echo ""
fi

# Check if app already exists
echo ""
echo "🔍 Checking if Amplify app exists..."
APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "📦 Creating new Amplify app..."
    
    # Create Amplify app
    APP_ID=$(aws amplify create-app \
        --name "$APP_NAME" \
        --region $REGION \
        --platform WEB \
        --repository "$GITHUB_REPO" \
        --oauth-token "$GITHUB_TOKEN" \
        --build-spec "$(cat amplify.yml)" \
        --environment-variables \
            RIOT_API_KEY="$RIOT_API_KEY" \
            AWS_REGION="$AWS_BEDROCK_REGION" \
            AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
            AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
            BEDROCK_MODEL_ID="$BEDROCK_MODEL_ID" \
            ENVIRONMENT="production" \
            PORT="8000" \
            LOG_LEVEL="INFO" \
        --query 'app.appId' \
        --output text)
    
    echo "✅ Created app with ID: $APP_ID"
    
    # Create branch
    echo "🌿 Creating branch connection..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$GITHUB_BRANCH" \
        --region $REGION \
        --enable-auto-build
    
    echo "✅ Branch connected"
else
    echo "✅ Found existing app: $APP_ID"
    
    # Update environment variables
    echo "🔧 Updating environment variables..."
    aws amplify update-app \
        --app-id "$APP_ID" \
        --region $REGION \
        --environment-variables \
            RIOT_API_KEY="$RIOT_API_KEY" \
            AWS_REGION="$AWS_BEDROCK_REGION" \
            AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
            AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
            BEDROCK_MODEL_ID="$BEDROCK_MODEL_ID" \
            ENVIRONMENT="production" \
            PORT="8000" \
            LOG_LEVEL="INFO" \
        > /dev/null
    
    echo "✅ Environment variables updated"
fi

# Start deployment
echo ""
echo "🚀 Starting deployment..."
JOB_ID=$(aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name "$GITHUB_BRANCH" \
    --job-type RELEASE \
    --region $REGION \
    --query 'jobSummary.jobId' \
    --output text)

echo "✅ Deployment started (Job ID: $JOB_ID)"
echo ""
echo "📊 Monitoring deployment..."

# Monitor deployment
while true; do
    STATUS=$(aws amplify get-job \
        --app-id "$APP_ID" \
        --branch-name "$GITHUB_BRANCH" \
        --job-id "$JOB_ID" \
        --region $REGION \
        --query 'job.summary.status' \
        --output text)
    
    if [ "$STATUS" == "SUCCEED" ]; then
        echo "✅ Deployment successful!"
        break
    elif [ "$STATUS" == "FAILED" ] || [ "$STATUS" == "CANCELLED" ]; then
        echo "❌ Deployment failed with status: $STATUS"
        echo "Check logs at: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
        exit 1
    else
        echo "   Status: $STATUS"
        sleep 10
    fi
done

# Get app URL
APP_URL=$(aws amplify get-app \
    --app-id "$APP_ID" \
    --region $REGION \
    --query 'app.defaultDomain' \
    --output text)

FULL_URL="https://$GITHUB_BRANCH.$APP_URL"

echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo "App ID: $APP_ID"
echo "URL: $FULL_URL"
echo ""
echo "📝 Next Steps:"
echo "1. Update ALLOWED_ORIGINS environment variable with: $FULL_URL"
echo "2. Test your app: curl $FULL_URL/api/health"
echo "3. Open in browser: $FULL_URL"
echo ""
echo "To update CORS, run:"
echo "aws amplify update-app --app-id $APP_ID --region $REGION --environment-variables ALLOWED_ORIGINS=$FULL_URL"
