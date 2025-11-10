# Deploy RuneSight to AWS Amplify

## Step 1: Deploy Frontend

```powershell
.\deploy.ps1
```

The script will:
1. Create Amplify app
2. Set environment variables
3. Try to connect GitHub (may fail - that's OK)
4. Give you console link to connect GitHub manually

**Then connect GitHub in AWS Console**:
1. Go to the Amplify Console link from the script
2. Click "Connect repository" → GitHub → Authorize
3. Select your repository and branch: main
4. Click "Save and deploy"

## Step 2: Deploy Backend

```powershell
.\deploy-backend-layers.ps1
```

**Note**: Update the script first with your AWS account details:
- Replace `YOUR_ACCOUNT_ID` with your AWS account ID
- Replace `YOUR_LAMBDA_ROLE` with your Lambda execution role name

**If environment variables weren't set**, set them manually:
```powershell
cd backend
aws lambda update-function-configuration `
  --function-name RuneSight-Backend `
  --environment file://lambda-env.json `
  --region eu-central-1
```

**Note**: `lambda-env.json` is in `.gitignore` - don't commit it!

## Step 3: Connect Frontend to Backend

Add the backend URL to Amplify environment variables:

```powershell
aws amplify update-app `
  --app-id YOUR_APP_ID `
  --region eu-central-1 `
  --environment-variables VITE_API_URL=https://your-lambda-url.lambda-url.eu-central-1.on.aws,RIOT_API_KEY=$env:RIOT_API_KEY,BEDROCK_REGION=eu-central-1,BEDROCK_MODEL_ID=YOUR_BEDROCK_MODEL_ARN,ENVIRONMENT=production,PORT=8000,LOG_LEVEL=INFO
```

**Or via Console**:
1. Go to AWS Amplify Console
2. Select your app → Environment variables
3. Add: `VITE_API_URL` = `your-lambda-function-url`
4. Save

## Step 4: Redeploy Frontend

Go to Amplify Console → Hosting environments → Click "Redeploy this version"

Or trigger via CLI:
```powershell
aws amplify start-job `
  --app-id YOUR_APP_ID `
  --branch-name main `
  --job-type RELEASE `
  --region eu-central-1
```

## Step 5: Test Your App

1. **Test Backend**:
   ```powershell
   curl https://your-lambda-url.lambda-url.eu-central-1.on.aws/api/health
   ```
   Should return: `{"status":"healthy","environment":"production"}`

2. **Test Frontend**:
   Open your Amplify URL
   
3. **Test Full Integration**:
   - Enter a RiotID in the app
   - Verify it connects to the backend
   - Check that data loads

---

## Environment Variables

Configure these in both Amplify (frontend) and Lambda (backend):

**Frontend (Amplify)**:
- `VITE_API_URL` - Your Lambda function URL

**Backend (Lambda)**:
- `RIOT_API_KEY` - Your Riot Games API key
- `BEDROCK_REGION` - eu-central-1
- `BEDROCK_MODEL_ID` - Your Bedrock model ARN
- `ENVIRONMENT` - production
- `PORT` - 8000
- `LOG_LEVEL` - INFO

## Troubleshooting

**Build fails on TypeScript errors**:
- Fixed in amplify.yml (uses `vite build` directly)

**Can't find frontend/backend directories**:
- Fixed in amplify.yml (uses correct paths with RuneSight subdirectory)

**GitHub connection fails**:
- Normal! Connect manually through AWS Console (easier anyway)

**502 Backend Error**:
- Check CloudWatch logs for Lambda function
- Verify environment variables are set
- See BACKEND-DEPLOYMENT.md for details

---

**Status**: Ready to deploy! 🚀
