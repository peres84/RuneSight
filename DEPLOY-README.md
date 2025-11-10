# Deploy RuneSight to AWS Amplify

Two deployment options: Automated with GitHub or Manual via Console.

## Option 1: Simple Setup (Recommended)

Creates the Amplify app and sets environment variables. Then connect GitHub via console.

```powershell
# Windows
.\deploy-simple.ps1
```

This will:
1. Create Amplify app
2. Set all environment variables
3. Give you the console link to connect GitHub

## Option 2: Full Automated (Requires GitHub Token)

```powershell
# Windows - Edit deploy.ps1 first to add your GitHub repo URL
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

## Prerequisites

1. **AWS CLI configured**: `aws configure`
2. **Riot API Key**: Get from https://developer.riotgames.com/
3. **Bedrock Access**: Enable model in AWS Bedrock Console

## Fix GitHub Error

If you get "Not Found" or "404" error with GitHub:

**Solution**: Use the simple script instead:
```powershell
.\deploy-simple.ps1
```

Then connect GitHub manually in the AWS Console (easier and more reliable).

## Quick Deploy

### Windows (PowerShell):
```powershell
cd RuneSight
.\deploy.ps1
```

### Linux/Mac:
```bash
cd RuneSight
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Check your AWS credentials
2. Prompt for Riot API key and GitHub token
3. Create/update Amplify app
4. Deploy your code
5. Give you the app URL

## Manual Deploy (if script doesn't work)

1. **Update deploy script with your GitHub repo**:
   Edit `deploy.sh` or `deploy.ps1` and change:
   ```
   GITHUB_REPO="https://github.com/YOUR_USERNAME/YOUR_REPO"
   ```

2. **Set environment variables**:
   ```bash
   export RIOT_API_KEY="your_key"
   export AWS_ACCESS_KEY_ID="your_key"
   export AWS_SECRET_ACCESS_KEY="your_secret"
   ```

3. **Run the script**

## After Deployment

1. **Update CORS**:
   ```bash
   aws amplify update-app --app-id YOUR_APP_ID --region us-east-1 \
     --environment-variables ALLOWED_ORIGINS=https://your-app-url.amplifyapp.com
   ```

2. **Test**:
   ```bash
   curl https://your-app-url.amplifyapp.com/api/health
   ```

3. **Open in browser**:
   ```
   https://your-app-url.amplifyapp.com
   ```

## Troubleshooting

**"AWS CLI not found"**:
- Install from: https://aws.amazon.com/cli/

**"Credentials not configured"**:
- Run: `aws configure`

**"Deployment failed"**:
- Check logs in AWS Amplify Console
- Verify environment variables are set
- Check CloudWatch logs

**"Bedrock access denied"**:
- Go to Bedrock Console → Model access
- Enable your model (Claude or Nova)

## Environment Variables

The script sets these automatically:
- `RIOT_API_KEY` - Your Riot API key
- `AWS_REGION` - Bedrock region (default: eu-central-1)
- `BEDROCK_MODEL_ID` - AI model to use
- `ENVIRONMENT` - production
- `PORT` - 8000
- `LOG_LEVEL` - INFO

## Cost Estimate

~$70-250/month for moderate usage:
- Amplify hosting: $15-30
- Bedrock API: $50-200
- Data transfer: $5-15

---

**That's it!** Your app should be live in ~5 minutes.
