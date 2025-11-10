# RuneSight Deployment Setup Guide

Complete guide for deploying RuneSight backend (AWS Lambda) and frontend (AWS Amplify).

## ⚠️ IMPORTANT: Setup Virtual Environment First!

Before running any deployment scripts, create and activate the backend virtual environment:

```powershell
# Navigate to backend
cd RuneSight/backend

# Create venv if it doesn't exist
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Go to deployment folder
cd ..\deployment
```

This ensures clean dependencies without conflicts from your global Python environment.

---

## 📋 Prerequisites

### Required Tools

1. **AWS CLI** - Install from https://aws.amazon.com/cli/
2. **Python 3.11+** - Install from https://www.python.org/
3. **PowerShell** - Built into Windows (NOT cmd!)
4. **Docker Desktop** - Install from https://www.docker.com/products/docker-desktop
5. **Git** - For version control
6. **AWS Account** - With appropriate permissions
7. **Python Virtual Environment** - For clean dependency management

**Important:** 
- Use **PowerShell**, not cmd (Command Prompt)
- Make sure **Docker Desktop is running** before deployment

### AWS Permissions Required

Your AWS user/role needs:
- IAM: Create roles and attach policies
- Lambda: Create/update functions and layers
- Amplify: Create/manage apps
- S3: For Amplify hosting
- CloudWatch: For logs

### Configure AWS CLI

```powershell
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `eu-central-1`)
- Output format: `json`

Verify setup:
```powershell
aws sts get-caller-identity
```

---

## 🔧 Configuration Setup

### Step 1: Create Backend Configuration

Copy the example file and fill in your details:

```powershell
cd RuneSight/deployment
copy backend.config.example.json backend.config.json
```

Edit `backend.config.json`:

```json
{
  "aws": {
    "region": "eu-central-1",           // Your AWS region
    "accountId": "123456789012"         // Your 12-digit AWS account ID
  },
  "lambda": {
    "functionName": "RuneSight-Backend",
    "runtime": "python3.11",
    "handler": "lambda_handler.handler",
    "timeout": 30,
    "memorySize": 1024,
    "architecture": "x86_64"
  },
  "layer": {
    "enabled": true,                    // Use Lambda layer for dependencies
    "layerName": "RuneSight-Dependencies",
    "compatibleRuntimes": ["python3.11", "python3.12"]
  },
  "iam": {
    "roleName": "RuneSight-Lambda-ExecutionRole",
    "policyName": "RuneSight-Lambda-Policy"
  },
  "environment": {
    "RIOT_API_KEY": "RGAPI-xxx...",     // Your Riot Games API key
    "AWS_REGION": "eu-central-1",
    "BEDROCK_MODEL_ID": "arn:aws:bedrock:...",  // Your Bedrock model ARN
    "ENVIRONMENT": "production",
    "PORT": "8000",
    "LOG_LEVEL": "INFO",
    "ALLOWED_ORIGINS": "http://localhost:5173",  // Update after frontend deploy
    "GITHUB_ACCESS_TOKEN": "ghp_xxx..."  // Optional
  },
  "paths": {
    "backend": "../backend",
    "buildDir": "./build"
  }
}
```

### Step 2: Create Frontend Configuration

Copy the example file and fill in your details:

```powershell
copy frontend.config.example.json frontend.config.json
```

Edit `frontend.config.json`:

```json
{
  "amplify": {
    "appName": "RuneSight",
    "region": "eu-central-1",           // Your AWS region
    "platform": "WEB"
  },
  "github": {
    "repository": "https://github.com/YOUR_USERNAME/RuneSight",  // Your repo
    "branch": "main",                   // Your branch
    "token": "ghp_xxx..."               // GitHub Personal Access Token
  },
  "environment": {
    "RIOT_API_KEY": "RGAPI-xxx...",     // Your Riot Games API key
    "AWS_REGION": "eu-central-1",
    "AWS_ACCESS_KEY_ID": "AKIA...",     // Your AWS access key
    "AWS_SECRET_ACCESS_KEY": "xxx...",  // Your AWS secret key
    "BEDROCK_MODEL_ID": "arn:aws:bedrock:...",
    "ENVIRONMENT": "production",
    "PORT": "8000",
    "LOG_LEVEL": "INFO"
  }
}
```

### Getting Required Credentials

#### Riot API Key
1. Go to https://developer.riotgames.com/
2. Sign in with your Riot account
3. Register your application
4. Copy your API key (starts with `RGAPI-`)

#### GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Generate and copy the token (starts with `ghp_`)

#### AWS Account ID
```powershell
aws sts get-caller-identity --query Account --output text
```

#### Bedrock Model ARN
1. Go to AWS Bedrock console
2. Navigate to "Inference profiles" or "Models"
3. Find your Claude model
4. Copy the full ARN

---

## 🚀 Deployment

### Deploy Backend (Lambda)

**IMPORTANT:** Activate the virtual environment first!

```powershell
# Activate backend virtual environment or create if doesn't exist. 
cd RuneSight/backend
.\venv\Scripts\Activate.ps1

# Navigate to deployment directory
cd ..\deployment

# Deploy
.\deploy-backend.ps1
```

**Options:**
```powershell
# Update existing function only (faster)
.\deploy-backend.ps1 -UpdateOnly

# Skip layer creation (include deps in function)
.\deploy-backend.ps1 -SkipLayer

# Clean build (remove cached packages)
.\deploy-backend.ps1 -CleanBuild

# Use custom config file
.\deploy-backend.ps1 -ConfigFile "backend.prod.config.json"
```

**What it does:**
1. Creates IAM execution role with necessary permissions
2. Creates Lambda layer with Python dependencies
3. Packages application code
4. Creates/updates Lambda function
5. Creates public Function URL
6. Configures environment variables

**Expected output:**
```
[SUCCESS] Function URL: https://xxxxx.lambda-url.eu-central-1.on.aws/
```

**Copy this URL** - you'll need it for the frontend!

### Update Frontend Configuration

Before deploying the frontend, update it with your Lambda Function URL:

**Option 1: Update Vite environment variable (for local development)**

Edit `RuneSight/frontend/.env` or create it:
```env
VITE_API_URL=https://xxxxx.lambda-url.eu-central-1.on.aws
```

**Option 2: Update Amplify environment variable (for production)**

Edit `frontend.config.json` and add to environment variables:
```json
"environment": {
  "VITE_API_URL": "https://xxxxx.lambda-url.eu-central-1.on.aws",
  ...
}
```

### Deploy Frontend (Amplify)

```powershell
.\deploy-frontend.ps1
```

This will deploy your React frontend to AWS Amplify with the Lambda URL configured.

**Options:**
```powershell
# Use custom config file
.\deploy-frontend.ps1 -ConfigFile "frontend.prod.config.json"
```

**What it does:**
1. Creates/updates Amplify app
2. Connects to GitHub repository
3. Configures environment variables
4. Triggers build and deployment
5. Monitors deployment progress

**Expected output:**
```
[SUCCESS] URL: https://main.xxxxx.amplifyapp.com
```

### Update CORS Configuration

After frontend deployment, update backend CORS:

1. Edit `backend.config.json`
2. Update `ALLOWED_ORIGINS`:
   ```json
   "ALLOWED_ORIGINS": "https://main.xxxxx.amplifyapp.com,http://localhost:5173"
   ```
3. Redeploy backend:
   ```powershell
   .\deploy-backend.ps1 -UpdateOnly
   ```

---

## 🔄 Update Workflow

### Update Backend Code

```powershell
# Make your code changes in ../backend/
.\deploy-backend.ps1 -UpdateOnly
```

### Update Frontend Code

```powershell
# Commit and push to GitHub
git add .
git commit -m "Update frontend"
git push

# Amplify will auto-deploy, or trigger manually:
.\deploy-frontend.ps1
```

### Update Environment Variables

**Backend:**
1. Edit `backend.config.json`
2. Run: `.\deploy-backend.ps1 -UpdateOnly`

**Frontend:**
1. Edit `frontend.config.json`
2. Run: `.\deploy-frontend.ps1`

---

## 📊 Monitoring & Logs

### Backend Logs (Lambda)

View in CloudWatch:
```powershell
# Open CloudWatch Logs
aws logs tail /aws/lambda/RuneSight-Backend --follow
```

Or via AWS Console:
1. Go to CloudWatch → Log groups
2. Find `/aws/lambda/RuneSight-Backend`
3. View log streams

### Frontend Logs (Amplify)

Via AWS Console:
1. Go to AWS Amplify
2. Select your app
3. Click on branch → View build logs

### Test Backend Endpoint

```powershell
# Health check
curl https://YOUR-FUNCTION-URL.lambda-url.eu-central-1.on.aws/health

# Test with Riot API
curl https://YOUR-FUNCTION-URL.lambda-url.eu-central-1.on.aws/api/summoner/YOUR-SUMMONER-NAME
```

---

## 🛠️ Troubleshooting

### Backend Issues

**"Config file not found"**
- Ensure `backend.config.json` exists
- Check you're in the `deployment` directory

**"Failed to create IAM Role"**
- Check AWS permissions
- Verify role name doesn't already exist
- Wait 10-15 seconds for IAM propagation

**"Function too large"**
- Use `-SkipLayer` to include deps in function
- Remove unnecessary dependencies from `requirements.txt`
- Check package size (max 50MB for layer, 250MB for function)

**"Bedrock access denied"**
- Verify Bedrock model ARN is correct
- Check IAM role has Bedrock permissions
- Ensure model is available in your region

### Frontend Issues

**"GitHub token invalid"**
- Generate new token at https://github.com/settings/tokens
- Ensure `repo` scope is selected
- Update `frontend.config.json`

**"Build failed"**
- Check Amplify build logs in console
- Verify environment variables are set
- Check `package.json` scripts

**"CORS errors"**
- Update backend `ALLOWED_ORIGINS`
- Include frontend URL
- Redeploy backend with `-UpdateOnly`

### General Issues

**"AWS credentials not configured"**
```powershell
aws configure
```

**"Region not available"**
- Check service availability in your region
- Bedrock may not be available in all regions
- Consider using `us-east-1` or `eu-central-1`

---

## 🔒 Security Best Practices

### Configuration Files

**NEVER commit these files to Git:**
- `backend.config.json`
- `frontend.config.json`

They contain sensitive credentials!

The `.gitignore` file already excludes them.

### Credential Management

1. **Rotate API keys regularly**
   - Riot API key
   - GitHub tokens
   - AWS access keys

2. **Use environment-specific configs**
   ```powershell
   # Development
   .\deploy-backend.ps1 -ConfigFile backend.dev.config.json
   
   # Production
   .\deploy-backend.ps1 -ConfigFile backend.prod.config.json
   ```

3. **Limit IAM permissions**
   - Use least-privilege principle
   - Create separate IAM users for deployment
   - Enable MFA on AWS account

4. **Monitor CloudWatch Logs**
   - Check for unauthorized access
   - Monitor API usage
   - Set up CloudWatch alarms

### CORS Configuration

Only allow trusted origins:
```json
"ALLOWED_ORIGINS": "https://your-domain.amplifyapp.com"
```

Don't use `*` in production!

---

## 📁 File Structure

After setup, your deployment directory should have:

```
deployment/
├── deploy-backend.ps1              # Backend deployment script
├── deploy-frontend.ps1             # Frontend deployment script
├── backend.config.json             # Your backend config (gitignored)
├── frontend.config.json            # Your frontend config (gitignored)
├── backend.config.example.json     # Backend template
├── frontend.config.example.json    # Frontend template
├── SETUP-README.md                 # This file
└── .gitignore                      # Protects your credentials
```

---

## 🎯 Quick Reference

### Backend Deployment
```powershell
# Setup venv first (if not done)
cd RuneSight/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\deployment

# First time deployment (with Docker for Linux compatibility)
.\deploy-backend.ps1 -UseDocker -SkipLayer -CleanBuild

# Update code only
.\deploy-backend.ps1 -UseDocker -SkipLayer

# Update environment variables only (fastest)
.\deploy-backend.ps1 -UpdateEnvOnly
```

### Frontend Deployment
```powershell
# First time or updates
.\deploy-frontend.ps1
```

### View Logs
```powershell
# Backend
aws logs tail /aws/lambda/RuneSight-Backend --follow

# Frontend - use AWS Console
```

### Test Endpoints
```powershell
# Backend health
curl https://YOUR-FUNCTION-URL/health

# Frontend
curl https://main.YOUR-APP.amplifyapp.com
```

---

## 📞 Support

If you encounter issues:

1. Check CloudWatch Logs for errors
2. Verify all credentials are correct
3. Ensure AWS services are available in your region
4. Check Riot API rate limits and status
5. Review AWS service quotas

For Riot API issues: https://developer.riotgames.com/
For AWS issues: https://console.aws.amazon.com/support/

---

## ✅ Deployment Checklist

Before deploying:

- [ ] AWS CLI installed and configured
- [ ] Python 3.11+ installed
- [ ] **Docker Desktop installed and running**
- [ ] **Using PowerShell (not cmd)**
- [ ] Backend virtual environment activated (`.\venv\Scripts\Activate.ps1`)
- [ ] Created `backend.config.json` with real values
- [ ] Created `frontend.config.json` with real values
- [ ] Obtained Riot API key
- [ ] Obtained GitHub Personal Access Token
- [ ] Verified AWS account ID
- [ ] Verified Bedrock model ARN
- [ ] Tested AWS credentials (`aws sts get-caller-identity`)

After backend deployment:

- [ ] Saved Lambda Function URL
- [ ] **Updated frontend with Lambda URL** (VITE_API_URL)
- [ ] Tested backend endpoint
- [ ] Checked CloudWatch Logs

After frontend deployment:

- [ ] Saved Amplify app URL
- [ ] **Updated backend CORS with Amplify URL**
- [ ] Redeployed backend: `.\deploy-backend.ps1 -UpdateEnvOnly`
- [ ] Tested full application

---

**Remember:** Never commit `backend.config.json` or `frontend.config.json` to version control!
