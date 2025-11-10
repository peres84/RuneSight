# RuneSight Deployment

Streamlined deployment system for RuneSight backend (AWS Lambda) and frontend (AWS Amplify).

## 📁 What's Here

- **deploy-backend.ps1** - Deploy backend to AWS Lambda
- **deploy-frontend.ps1** - Deploy frontend to AWS Amplify
- **backend.config.json** - Backend configuration (your credentials)
- **frontend.config.json** - Frontend configuration (your credentials)
- **\*.example.json** - Configuration templates
- **QUICK-START.md** - Fast deployment guide
- **SETUP-README.md** - Complete documentation

## 🚀 Quick Start

1. **Configure:**
   ```powershell
   copy backend.config.example.json backend.config.json
   copy frontend.config.example.json frontend.config.json
   # Edit both files with your credentials
   ```

2. **Setup Virtual Environment:**
   ```powershell
   cd RuneSight/backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   cd ..\deployment
   ```

3. **Deploy Backend:**
   ```powershell
   .\deploy-backend.ps1
   ```

4. **Deploy Frontend:**
   ```powershell
   .\deploy-frontend.ps1
   ```

5. **Update CORS:**
   - Add Amplify URL to `backend.config.json` → `ALLOWED_ORIGINS`
   - Run: `.\deploy-backend.ps1 -UpdateOnly`

## 📚 Documentation

See **[SETUP-README.md](SETUP-README.md)** for complete setup guide, configuration details, and troubleshooting.

## 🔒 Security

**Never commit these files to Git:**
- `backend.config.json`
- `frontend.config.json`

They're already in `.gitignore` to protect your credentials.

## 🔄 Updates

**Backend:**
```powershell
.\deploy-backend.ps1 -UpdateOnly
```

**Frontend:**
```powershell
git push  # Auto-deploys via Amplify
```

## ✅ What You Need

- AWS CLI configured
- Python 3.11+
- PowerShell
- AWS account with Lambda/Amplify permissions
- Riot API key
- GitHub Personal Access Token

---

**Ready to deploy?** See [SETUP-README.md](SETUP-README.md) for complete instructions!
