# Quick start script for RuneSight backend

Write-Host "Starting RuneSight Backend..." -ForegroundColor Cyan

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Virtual environment not found. Running setup..." -ForegroundColor Yellow
    .\setup_venv.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Setup failed. Please check the errors above." -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Created .env file" -ForegroundColor Green
    Write-Host "Please edit .env and add your API keys before running the server!" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Verify configuration (optional, comment out to skip)
Write-Host "Verifying configuration..." -ForegroundColor Cyan
python verify_bedrock.py
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Configuration verification failed!" -ForegroundColor Yellow
    Write-Host "You can still try to start the server, but it may not work correctly." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}
Write-Host ""

# Start the server
Write-Host "Starting FastAPI server..." -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Green
Write-Host "API documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn main:app --reload
