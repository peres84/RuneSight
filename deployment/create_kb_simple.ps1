# RuneSight Knowledge Base - Simplified Version
# Uses S3 only (no OpenSearch Serverless) for easier setup

$ErrorActionPreference = "Stop"

Write-Host "RuneSight Knowledge Base Setup (Simplified)" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "NOTE: This version skips OpenSearch Serverless to avoid permission issues." -ForegroundColor Yellow
Write-Host "The guides will be uploaded to S3 and can be used by agents directly." -ForegroundColor Yellow
Write-Host ""

# Check AWS CLI
try {
    $null = aws --version
    Write-Host "[OK] AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] AWS CLI not installed" -ForegroundColor Red
    exit 1
}

# Check credentials
try {
    $null = aws sts get-caller-identity 2>$null
    $ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
    Write-Host "[OK] AWS credentials configured (Account: $ACCOUNT_ID)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] AWS credentials not configured" -ForegroundColor Red
    exit 1
}

$REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "eu-central-1" }
Write-Host ""

# Step 1: Create S3 bucket
Write-Host "Step 1: Creating S3 bucket for guides..." -ForegroundColor Blue
$BUCKET_NAME = "runesight-guides-$ACCOUNT_ID-$REGION"

try {
    aws s3 ls "s3://$BUCKET_NAME" 2>$null
    Write-Host "[OK] S3 bucket already exists: $BUCKET_NAME" -ForegroundColor Green
} catch {
    if ($REGION -eq "us-east-1") {
        aws s3api create-bucket --bucket $BUCKET_NAME --region $REGION
    } else {
        aws s3api create-bucket --bucket $BUCKET_NAME --region $REGION --create-bucket-configuration LocationConstraint=$REGION
    }
    Write-Host "[OK] S3 bucket created: $BUCKET_NAME" -ForegroundColor Green
}

Write-Host ""

# Step 2: Upload League of Legends Guides
Write-Host "Step 2: Uploading League of Legends guides..." -ForegroundColor Blue

$guidesPath = Join-Path $PSScriptRoot "..\backend\knowledge_base"
$guideFiles = @(
    "01_LoL_Master_Guide.md",
    "02_Game_Fundamentals.md",
    "03_Farming_and_Economy.md",
    "04_Micro_vs_Macro.md",
    "05_Team_Composition.md",
    "06_Professional_Drafting.md"
)

$uploadedCount = 0
foreach ($file in $guideFiles) {
    $filePath = Join-Path $guidesPath $file
    if (Test-Path $filePath) {
        aws s3 cp $filePath "s3://$BUCKET_NAME/guides/$file" --region $REGION 2>$null
        if ($LASTEXITCODE -eq 0) {
            $uploadedCount++
            Write-Host "[OK] Uploaded: $file" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Failed to upload: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "[OK] Uploaded $uploadedCount/6 guide files" -ForegroundColor Green
Write-Host ""

# Step 3: Create index file
Write-Host "Step 3: Creating guides index..." -ForegroundColor Blue

$indexContent = @"
# League of Legends Strategy Guides

This bucket contains comprehensive League of Legends strategy guides for AI agents.

## Available Guides

1. **01_LoL_Master_Guide.md** - Complete learning guide overview
2. **02_Game_Fundamentals.md** - Core mechanics and game structure  
3. **03_Farming_and_Economy.md** - CS, wave management, gold generation
4. **04_Micro_vs_Macro.md** - Individual mechanics vs map strategy
5. **05_Team_Composition.md** - Building balanced teams
6. **06_Professional_Drafting.md** - Pick/ban strategies

## Usage

These guides are stored in S3 and can be:
- Downloaded by agents when needed
- Cached locally for faster access
- Used as reference material for player coaching

## S3 Location

Bucket: $BUCKET_NAME
Region: $REGION
Path: s3://$BUCKET_NAME/guides/

## Uploaded

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Files: $uploadedCount/6
"@

$indexFile = Join-Path $env:TEMP "guides-index.md"
$indexContent | Out-File -FilePath $indexFile -Encoding utf8

aws s3 cp $indexFile "s3://$BUCKET_NAME/guides/README.md" --region $REGION 2>$null
Remove-Item $indexFile -ErrorAction SilentlyContinue

Write-Host "[OK] Index file created" -ForegroundColor Green
Write-Host ""

# Step 4: Update Lambda role to access S3
Write-Host "Step 4: Updating Lambda role permissions..." -ForegroundColor Blue

# Try to load existing role from backend.config.json
$backendConfigPath = Join-Path $PSScriptRoot "backend.config.json"
$roleName = $null

if (Test-Path $backendConfigPath) {
    try {
        $backendConfig = Get-Content $backendConfigPath | ConvertFrom-Json
        $roleName = $backendConfig.iam.roleName
        Write-Host "[INFO] Found Lambda role: $roleName" -ForegroundColor Cyan
    } catch {
        Write-Host "[WARNING] Could not read backend config" -ForegroundColor Yellow
    }
}

if ($roleName) {
    # Create inline policy for S3 access
    $s3Policy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Action = @("s3:GetObject", "s3:ListBucket")
                Resource = @(
                    "arn:aws:s3:::$BUCKET_NAME",
                    "arn:aws:s3:::$BUCKET_NAME/*"
                )
            }
        )
    } | ConvertTo-Json -Depth 10

    $policyFile = Join-Path $env:TEMP "s3-policy.json"
    $s3Policy | Out-File -FilePath $policyFile -Encoding utf8

    try {
        aws iam put-role-policy `
            --role-name $roleName `
            --policy-name "RuneSightGuidesS3Access" `
            --policy-document "file://$policyFile" 2>$null
        
        Write-Host "[OK] Lambda role updated with S3 access" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Could not update Lambda role (may already have access)" -ForegroundColor Yellow
    }

    Remove-Item $policyFile -ErrorAction SilentlyContinue
} else {
    Write-Host "[INFO] No Lambda role found in config, skipping role update" -ForegroundColor Cyan
}

Write-Host ""

# Step 5: Save configuration
Write-Host "Step 5: Saving configuration..." -ForegroundColor Blue

$configDir = Join-Path $PSScriptRoot "..\backend\config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$configFile = Join-Path $configDir "guides_storage.json"

$config = @{
    storage_type = "s3"
    bucket_name = $BUCKET_NAME
    region = $REGION
    guides_path = "guides/"
    guides_uploaded = $uploadedCount
    upload_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    s3_url = "s3://$BUCKET_NAME/guides/"
    https_url = "https://$BUCKET_NAME.s3.$REGION.amazonaws.com/guides/"
} | ConvertTo-Json -Depth 10

$config | Out-File -FilePath $configFile -Encoding utf8

Write-Host "[OK] Configuration saved to $configFile" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "===========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "S3 Bucket: $BUCKET_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "Guides Uploaded: $uploadedCount/6" -ForegroundColor Cyan
Write-Host ""
Write-Host "Guides Location:" -ForegroundColor Yellow
Write-Host "s3://$BUCKET_NAME/guides/"
Write-Host ""
Write-Host "Your agents can now access League of Legends guides from S3!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Agents will download guides from S3 when needed"
Write-Host "2. Guides are cached locally for faster access"
Write-Host "3. No additional configuration needed!"
Write-Host ""
Write-Host "Note: This simplified version doesn't use Bedrock Knowledge Base," -ForegroundColor Yellow
Write-Host "but agents can still access all the strategy guides directly from S3." -ForegroundColor Yellow
