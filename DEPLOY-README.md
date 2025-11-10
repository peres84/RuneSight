# Deploy RuneSight to AWS Amplify

## Quick Deploy with PowerShell Script

```powershell
.\deploy.ps1
```

The script will:
1. Create Amplify app
2. Set environment variables
3. Try to connect GitHub (may fail - that's OK)
4. Give you console link to connect GitHub manually

## After Running Script

1. **Go to AWS Console**: The script gives you the link
2. **Connect GitHub**:
   - Click "Connect repository" or "Hosting environments"
   - Select GitHub → Authorize
   - Select: peres84/RuneSight
   - Branch: main
   - Click "Save and deploy"

## Build Time

First deployment takes ~5-10 minutes:
- Backend: Install Python packages (~2 min)
- Frontend: Install npm packages and build (~3 min)
- Deploy (~1 min)

## Environment Variables

Already configured by the script:
- ✅ RIOT_API_KEY
- ✅ BEDROCK_REGION (eu-central-1)
- ✅ BEDROCK_MODEL_ID
- ✅ ENVIRONMENT (production)
- ✅ PORT (8000)
- ✅ LOG_LEVEL (INFO)

## Your App URL

After deployment: `https://main.YOUR_APP_ID.amplifyapp.com`

## Troubleshooting

**Build fails on TypeScript errors**:
- Fixed in amplify.yml (uses `vite build` directly)

**Can't find frontend/backend directories**:
- Fixed in amplify.yml (uses correct paths with RuneSight subdirectory)

**GitHub connection fails**:
- Normal! Connect manually through AWS Console (easier anyway)

## Manual Deployment (Alternative)

If the script doesn't work, deploy manually:

1. Go to: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Select GitHub → Authorize
4. Select: peres84/RuneSight, branch: main
5. Amplify auto-detects amplify.yml
6. Add environment variables (see above)
7. Click "Save and deploy"

---

**Status**: Ready to deploy! 🚀
