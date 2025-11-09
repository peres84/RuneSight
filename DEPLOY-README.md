# Deploy RuneSight to AWS Amplify

Simple one-command deployment using AWS CLI.

## TL;DR

```bash
# Windows
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

That's it! Script handles everything.

## Prerequisites

1. **AWS CLI installed and configured**:
   ```bash
   aws configure
   ```

2. **GitHub Personal Access Token** (with repo access):
   - Create at: https://github.com/settings/tokens

3. **Riot API Key**:
   - Get from: https://developer.riotgames.com/

4. **Bedrock Access**:
   - Go to AWS Bedrock Console
   - Enable model access for Claude or Nova

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
