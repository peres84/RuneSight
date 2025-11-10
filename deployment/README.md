# RuneSight Deployment

Complete deployment scripts for RuneSight backend and guides.

## Quick Start

### 1. Configure Backend

```powershell
# Copy example config
Copy-Item backend.config.example.json backend.config.json

# Edit backend.config.json with your values:
# - AWS account ID
# - Riot API key
# - Bedrock model ID
```

### 2. Deploy Everything

```powershell
# Deploy backend + setup guides (first time)
.\deploy-backend.ps1 -SetupGuides

# Or deploy backend only (if guides already setup)
.\deploy-backend.ps1
```

## What Gets Deployed

### Backend Deployment
- ✅ Lambda function with all agent code
- ✅ Lambda layer with Python dependencies
- ✅ IAM role and policies
- ✅ Function URL for API access
- ✅ Environment variables

### Guides Setup (with -SetupGuides flag)
- ✅ S3 bucket for LoL strategy guides
- ✅ 6 markdown guide files uploaded
- ✅ Lambda role configured for S3 access
- ✅ Configuration saved

## Deployment Options

### Full Deployment
```powershell
.\deploy-backend.ps1 -SetupGuides
```
Use for first-time deployment.

### Update Code Only
```powershell
.\deploy-backend.ps1
```
Use when you changed agent code.

### Update Environment Variables Only
```powershell
.\deploy-backend.ps1 -UpdateEnvOnly
```
Use when you only changed config values.

### Update Configuration Only
```powershell
.\deploy-backend.ps1 -UpdateOnly
```
Use when you changed Lambda settings (timeout, memory).

### With Docker (Linux-compatible dependencies)
```powershell
.\deploy-backend.ps1 -UseDocker
```
Use for production to ensure Linux compatibility.

## Files

### Required
- `backend.config.json` - Main configuration (create from example)
- `deploy-backend.ps1` - Main deployment script

### Optional
- `create_kb_simple.ps1` - Standalone guides setup
- `SIMPLE_KB_GUIDE.md` - Guides documentation

### Auto-Generated
- `../backend/config/guides_storage.json` - Guides configuration

## Configuration

Edit `backend.config.json`:

```json
{
  "aws": {
    "region": "eu-central-1",
    "accountId": "YOUR_ACCOUNT_ID"
  },
  "lambda": {
    "functionName": "RuneSight-Backend",
    "timeout": 30,
    "memorySize": 1024
  },
  "iam": {
    "roleName": "YOUR_LAMBDA_ROLE"
  },
  "environment": {
    "RIOT_API_KEY": "YOUR_RIOT_API_KEY",
    "BEDROCK_MODEL_ID": "eu.amazon.nova-lite-v1:0"
  }
}
```

## Troubleshooting

### Deployment Fails
- Check AWS credentials: `aws sts get-caller-identity`
- Verify config file exists: `backend.config.json`
- Check IAM permissions

### Guides Not Loading
- Verify S3 bucket exists
- Check Lambda role has S3 permissions
- Run guides setup: `.\create_kb_simple.ps1`

### Function URL Not Working
- Check CORS settings in config
- Verify Function URL was created
- Test with: `curl FUNCTION_URL/health`

## Cost Estimate

- **Lambda:** ~$0.20/million requests
- **S3:** ~$0.50/month (for guides)
- **Bedrock:** ~$0.003/1K tokens
- **Total:** ~$5-10/month (light usage)

## Next Steps

After deployment:
1. ✅ Test Function URL
2. ✅ Update frontend with API endpoint
3. ✅ Test agents via chat interface
4. ✅ Monitor CloudWatch logs

## Support

For issues:
- Check CloudWatch logs
- Verify configuration
- Review error messages
- Test with curl/Postman first
