# RuneSight Backend Deployment Script
# Deploys Lambda function with layers, IAM roles, and environment configuration

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "backend.config.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$UpdateOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$UpdateEnvOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipLayer,
    
    [Parameter(Mandatory=$false)]
    [switch]$CleanBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipIAM,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipPackaging,
    
    [Parameter(Mandatory=$false)]
    [switch]$UseDocker,
    
    [Parameter(Mandatory=$false)]
    [switch]$SetupGuides,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("1", "2", "3", "4", "5", "6")]
    [string]$StartFromStep
)

# Color output functions
function Write-Step { param($Message) Write-Host "[STEP] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor White }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RuneSight Backend Complete Deployment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Setup guides if requested
if ($SetupGuides) {
    Write-Step "Setting up League of Legends guides in S3..."
    
    $guidesScript = Join-Path $PSScriptRoot "create_kb_simple.ps1"
    if (Test-Path $guidesScript) {
        & $guidesScript
        Write-Success "Guides setup complete"
        Write-Host ""
    } else {
        Write-Warning "Guides setup script not found: $guidesScript"
    }
}

# Check if config file exists
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Config file not found: $ConfigFile"
    Write-Info "Please create $ConfigFile from backend.config.example.json template"
    exit 1
}

# Load configuration
try {
    Write-Step "Loading configuration from $ConfigFile"
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    Write-Success "Configuration loaded"
} catch {
    Write-Error "Failed to parse config file: $_"
    exit 1
}

# Extract configuration
$AWS_REGION = $config.aws.region
$AWS_ACCOUNT_ID = $config.aws.accountId
$FUNCTION_NAME = $config.lambda.functionName
$RUNTIME = $config.lambda.runtime
$HANDLER = $config.lambda.handler
$TIMEOUT = $config.lambda.timeout
$MEMORY_SIZE = $config.lambda.memorySize
$ARCHITECTURE = $config.lambda.architecture
$ROLE_NAME = $config.iam.roleName
$POLICY_NAME = $config.iam.policyName
$CREATE_ROLE = if ($config.iam.createRole -ne $null) { $config.iam.createRole } else { $false }
$LAYER_NAME = $config.layer.layerName
$CREATE_LAYER = $config.layer.enabled
$backendPath = Join-Path $PSScriptRoot $config.paths.backend
$buildPath = Join-Path $PSScriptRoot $config.paths.buildDir

Write-Info "Function: $FUNCTION_NAME"
Write-Info "Runtime: $RUNTIME"
Write-Info "Region: $AWS_REGION"
Write-Info ""

# Navigate to backend directory
if (-not (Test-Path $backendPath)) {
    Write-Error "Backend directory not found: $backendPath"
    exit 1
}

Set-Location $backendPath

# Step 1: Create IAM Role (if not exists)
if (-not $UpdateOnly -and -not $UpdateEnvOnly) {
    if (-not $StartFromStep -or $StartFromStep -eq "1") {
        Write-Step "Step 1: Verify IAM Role"
    } else {
        Write-Info "Skipping Step 1: IAM Role (StartFromStep=$StartFromStep)"
    }
} else {
    Write-Info "Skipping Step 1: IAM Role (Update mode)"
}

if ((-not $StartFromStep -or $StartFromStep -eq "1") -and -not $SkipIAM -and $CREATE_ROLE -and -not $UpdateOnly -and -not $UpdateEnvOnly) {
    $roleExists = aws iam get-role --role-name $ROLE_NAME 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "IAM Role already exists: $ROLE_NAME"
    } else {
        Write-Info "Creating IAM Role: $ROLE_NAME"
        
        # Create trust policy with proper JSON formatting
        $trustPolicyJson = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@
        
        # Write to file without BOM
        [System.IO.File]::WriteAllText("$PWD\trust-policy.json", $trustPolicyJson)
        
        aws iam create-role `
            --role-name $ROLE_NAME `
            --assume-role-policy-document file://trust-policy.json `
            --description "Execution role for RuneSight Lambda function"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "IAM Role created"
        } else {
            Write-Error "Failed to create IAM Role"
            exit 1
        }
        
        Remove-Item "trust-policy.json"
        
        # Attach policies
        Write-Info "Attaching policies to role"
        
        aws iam attach-role-policy `
            --role-name $ROLE_NAME `
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        aws iam attach-role-policy `
            --role-name $ROLE_NAME `
            --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
        
        Write-Success "Policies attached"
        
        # Wait for role to propagate
        Write-Info "Waiting 10 seconds for IAM role to propagate..."
        Start-Sleep -Seconds 10
    }
} elseif (-not $StartFromStep -or $StartFromStep -eq "1") {
    Write-Info "Using existing IAM role: $ROLE_NAME"
    
    # Verify role exists
    if (-not $SkipIAM) {
        $roleCheck = aws iam get-role --role-name $ROLE_NAME 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "IAM Role '$ROLE_NAME' not found. Please create it or set createRole=true in config."
            exit 1
        }
        Write-Success "IAM Role verified"
    }
}

$roleArn = "arn:aws:iam::${AWS_ACCOUNT_ID}:role/$ROLE_NAME"

# Step 2: Create Lambda Layer (if enabled)
if (-not $UpdateOnly -and -not $UpdateEnvOnly) {
    if (-not $StartFromStep -or [int]$StartFromStep -le 2) {
        Write-Step "Step 2: Create Lambda Layer for dependencies"
    } else {
        Write-Info "Skipping Step 2: Lambda Layer (StartFromStep=$StartFromStep)"
    }
} else {
    Write-Info "Skipping Step 2: Lambda Layer (Update mode)"
}

$layerArn = $null

if ((-not $StartFromStep -or [int]$StartFromStep -le 2) -and $CREATE_LAYER -and -not $SkipLayer -and -not $UpdateOnly -and -not $UpdateEnvOnly) {
    # Clean previous builds
    Remove-Item -Recurse -Force "python" -ErrorAction SilentlyContinue | Out-Null
    Remove-Item -Force "layer.zip" -ErrorAction SilentlyContinue | Out-Null
    
    Write-Info "Installing dependencies to layer (Linux compatible)..."
    
    # Create python directory for layer
    New-Item -ItemType Directory -Path "python" -ErrorAction SilentlyContinue | Out-Null
    
    if ($UseDocker) {
        Write-Info "Using Docker to build Linux-compatible layer..."
        
        # Check if Docker is available
        try {
            docker --version | Out-Null
            Write-Success "Docker found"
        } catch {
            Write-Error "Docker not found. Install Docker Desktop or remove -UseDocker flag"
            Write-Info "Download: https://www.docker.com/products/docker-desktop"
            exit 1
        }
        
        # Get current directory path
        $currentDir = Get-Location
        Write-Info "Building layer with Amazon Linux 2..."
        
        # Run Docker command to install dependencies for Linux
        docker run --rm `
            -v "${currentDir}:/var/task" `
            -w /var/task `
            --entrypoint /bin/bash `
            public.ecr.aws/lambda/python:3.11 `
            -c "pip install -r requirements.txt -t python --no-cache-dir --platform manylinux2014_x86_64 --only-binary=:all: --upgrade || pip install -r requirements.txt -t python --no-cache-dir --upgrade"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies with Docker"
            exit 1
        }
        
        Write-Success "Dependencies installed for Linux"
    } else {
        Write-Warning "Installing without Docker may include Windows binaries"
        Write-Info "For production, use -UseDocker flag for Linux compatibility"
        
        # Install dependencies with platform specification
        python -m pip install -r requirements.txt -t python --upgrade --platform manylinux2014_x86_64 --only-binary=:all: --quiet 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Platform-specific install failed, trying standard install..."
            python -m pip install -r requirements.txt -t python --upgrade --quiet
        }
    }
    
    Write-Info "Creating layer zip..."
    $layerSize = (Get-Item -Path "python" -ErrorAction SilentlyContinue | Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Info "Layer size: $([math]::Round($layerSize / 1MB, 2)) MB"
    
    Compress-Archive -Path python -DestinationPath layer.zip -Force
    
    Write-Info "Publishing layer to AWS..."
    
    $layerOutput = aws lambda publish-layer-version `
        --layer-name $LAYER_NAME `
        --description "Python dependencies for RuneSight" `
        --compatible-runtimes $RUNTIME `
        --zip-file fileb://layer.zip | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0) {
        $layerArn = $layerOutput.LayerVersionArn
        Write-Success "Layer created: $layerArn"
        Write-Info "Layer size: $([math]::Round($layerSize / 1MB, 2)) MB"
    } else {
        Write-Warning "Failed to create layer, will include dependencies in function package"
    }
    
    # Cleanup
    Remove-Item -Recurse -Force "python" -ErrorAction SilentlyContinue | Out-Null
    Remove-Item -Force "layer.zip" -ErrorAction SilentlyContinue | Out-Null
}

# Step 3: Create deployment package
if (-not $UpdateOnly -and -not $UpdateEnvOnly) {
    if (-not $StartFromStep -or [int]$StartFromStep -le 3) {
        Write-Step "Step 3: Creating deployment package"
    } else {
        Write-Info "Skipping Step 3: Deployment Package (StartFromStep=$StartFromStep)"
    }
} else {
    Write-Info "Skipping Step 3: Deployment Package (Update mode)"
}

if ((-not $StartFromStep -or [int]$StartFromStep -le 3) -and -not $SkipPackaging -and -not $UpdateOnly -and -not $UpdateEnvOnly) {
    # Clean build directory
    if ($CleanBuild) {
        Remove-Item -Recurse -Force "package" -ErrorAction SilentlyContinue | Out-Null
    }

    Remove-Item -Force "function.zip" -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "package" -ErrorAction SilentlyContinue | Out-Null

    if ($UseDocker) {
        Write-Info "Building with Docker for Linux compatibility..."
        
        # Check if Docker is available
        try {
            docker --version | Out-Null
            Write-Success "Docker found"
        } catch {
            Write-Error "Docker not found. Install Docker Desktop or remove -UseDocker flag"
            Write-Info "Download: https://www.docker.com/products/docker-desktop"
            exit 1
        }
        
        if ($layerArn) {
            Write-Info "Using layer, packaging code only..."
            
            # Copy only application code
            Copy-Item -Path "main.py" -Destination "package/" -Force
            Copy-Item -Path "lambda_handler.py" -Destination "package/" -Force
            Copy-Item -Path "agents" -Destination "package/" -Recurse -Force
            Copy-Item -Path "api" -Destination "package/" -Recurse -Force
            Copy-Item -Path "models" -Destination "package/" -Recurse -Force
            Copy-Item -Path "services" -Destination "package/" -Recurse -Force
            Copy-Item -Path "tools" -Destination "package/" -Recurse -Force
            Copy-Item -Path "utils" -Destination "package/" -Recurse -Force
            Copy-Item -Path "knowledge_base" -Destination "package/" -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Info "Installing dependencies with Docker (Amazon Linux 2)..."
            
            # Get current directory path
            $currentDir = Get-Location
            Write-Info "Current directory: $currentDir"
            
            # Run Docker command - use bash as entrypoint to run pip
            docker run --rm `
                -v "${currentDir}:/var/task" `
                -w /var/task `
                --entrypoint /bin/bash `
                public.ecr.aws/lambda/python:3.11 `
                -c "pip install -r requirements.txt -t package --no-cache-dir"
            
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install dependencies with Docker"
                exit 1
            }
            
            Write-Success "Dependencies installed for Linux"
            
            # Copy application code
            Copy-Item -Path "main.py" -Destination "package/" -Force
            Copy-Item -Path "lambda_handler.py" -Destination "package/" -Force
            Copy-Item -Path "agents" -Destination "package/" -Recurse -Force
            Copy-Item -Path "api" -Destination "package/" -Recurse -Force
            Copy-Item -Path "models" -Destination "package/" -Recurse -Force
            Copy-Item -Path "services" -Destination "package/" -Recurse -Force
            Copy-Item -Path "tools" -Destination "package/" -Recurse -Force
            Copy-Item -Path "utils" -Destination "package/" -Recurse -Force
            Copy-Item -Path "knowledge_base" -Destination "package/" -Recurse -Force -ErrorAction SilentlyContinue
        }
    } else {
        if ($layerArn) {
            Write-Info "Using layer, packaging code only..."
            
            # Copy only application code
            Copy-Item -Path "main.py" -Destination "package/" -Force
            Copy-Item -Path "lambda_handler.py" -Destination "package/" -Force
            Copy-Item -Path "agents" -Destination "package/" -Recurse -Force
            Copy-Item -Path "api" -Destination "package/" -Recurse -Force
            Copy-Item -Path "models" -Destination "package/" -Recurse -Force
            Copy-Item -Path "services" -Destination "package/" -Recurse -Force
            Copy-Item -Path "tools" -Destination "package/" -Recurse -Force
            Copy-Item -Path "utils" -Destination "package/" -Recurse -Force
            Copy-Item -Path "knowledge_base" -Destination "package/" -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Warning "Installing dependencies without Docker may include Windows binaries"
            Write-Info "For production, use -UseDocker flag for Linux compatibility"
            Write-Info "Including dependencies in package..."
            
            # Install dependencies (may include Windows binaries)
            python -m pip install -r requirements.txt -t package --upgrade
            
            # Copy application code
            Copy-Item -Path "main.py" -Destination "package/" -Force
            Copy-Item -Path "lambda_handler.py" -Destination "package/" -Force
            Copy-Item -Path "agents" -Destination "package/" -Recurse -Force
            Copy-Item -Path "api" -Destination "package/" -Recurse -Force
            Copy-Item -Path "models" -Destination "package/" -Recurse -Force
            Copy-Item -Path "services" -Destination "package/" -Recurse -Force
            Copy-Item -Path "tools" -Destination "package/" -Recurse -Force
            Copy-Item -Path "utils" -Destination "package/" -Recurse -Force
            Copy-Item -Path "knowledge_base" -Destination "package/" -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Info "Creating zip file..."
    Compress-Archive -Path package\* -DestinationPath function.zip -Force

    $zipSize = (Get-Item function.zip).Length
    Write-Success "Package created: $([math]::Round($zipSize / 1MB, 2)) MB"

    # Clean package directory
    Remove-Item -Recurse -Force "package" -ErrorAction SilentlyContinue | Out-Null
} elseif ((-not $StartFromStep -or [int]$StartFromStep -le 3) -and -not $UpdateOnly -and -not $UpdateEnvOnly) {
    Write-Info "Using existing function.zip"
    if (-not (Test-Path "function.zip")) {
        Write-Error "function.zip not found. Remove -SkipPackaging to create it."
        exit 1
    }
}

# Step 4: Create or Update Lambda Function
if (-not $StartFromStep -or [int]$StartFromStep -le 4) {
    Write-Step "Step 4: Creating/Updating Lambda Function"
} else {
    Write-Info "Skipping Step 4: Lambda Function (StartFromStep=$StartFromStep)"
}

if (-not $StartFromStep -or [int]$StartFromStep -le 4) {

$functionExists = aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    if ($UpdateEnvOnly) {
        Write-Info "UpdateEnvOnly mode: Updating environment variables only..."
    } elseif ($UpdateOnly) {
        Write-Info "UpdateOnly mode: Updating configuration only..."
    } else {
        Write-Info "Function exists, updating code..."
        
        aws lambda update-function-code `
            --function-name $FUNCTION_NAME `
            --zip-file fileb://function.zip `
            --region $AWS_REGION | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Function code updated"
        } else {
            Write-Error "Failed to update function code"
            exit 1
        }
    }
    
    # Update configuration
    if ($UpdateEnvOnly) {
        Write-Info "Updating environment variables..."
    } else {
        Write-Info "Updating function configuration..."
    }
    
    # Prepare environment variables
    $envVars = @{ Variables = @{} }
    $config.environment.PSObject.Properties | ForEach-Object {
        $envVars.Variables[$_.Name] = $_.Value
    }
    
    $envVarsJson = $envVars | ConvertTo-Json -Compress
    $envFile = "env-vars.json"
    # Write without BOM
    [System.IO.File]::WriteAllText("$PWD\$envFile", $envVarsJson)
    
    if ($UpdateEnvOnly) {
        # Only update environment variables
        aws lambda update-function-configuration `
            --function-name $FUNCTION_NAME `
            --environment file://$envFile `
            --region $AWS_REGION | Out-Null
        
        Remove-Item $envFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Environment variables updated"
        }
    } else {
        # Update full configuration
        $updateCmd = "aws lambda update-function-configuration " +
                     "--function-name $FUNCTION_NAME " +
                     "--timeout $TIMEOUT " +
                     "--memory-size $MEMORY_SIZE " +
                     "--handler $HANDLER " +
                     "--environment file://$envFile " +
                     "--region $AWS_REGION"
        
        if ($layerArn) {
            $updateCmd += " --layers $layerArn"
        }
        
        Invoke-Expression $updateCmd | Out-Null
        Remove-Item $envFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Function configuration updated"
        }
    }
} else {
    Write-Info "Creating new Lambda function..."
    
    # Prepare environment variables
    $envVars = @{ Variables = @{} }
    $config.environment.PSObject.Properties | ForEach-Object {
        $envVars.Variables[$_.Name] = $_.Value
    }
    
    $envVarsJson = $envVars | ConvertTo-Json -Compress
    $envFile = "env-vars.json"
    # Write without BOM
    [System.IO.File]::WriteAllText("$PWD\$envFile", $envVarsJson)
    
    # Create function with proper parameter handling
    # Note: --architectures defaults to x86_64, so we omit it to avoid parsing issues
    if ($layerArn) {
        aws lambda create-function `
            --function-name $FUNCTION_NAME `
            --runtime $RUNTIME `
            --role $roleArn `
            --handler $HANDLER `
            --timeout $TIMEOUT `
            --memory-size $MEMORY_SIZE `
            --environment file://$envFile `
            --zip-file fileb://function.zip `
            --layers $layerArn | Out-Null
    } else {
        aws lambda create-function `
            --function-name $FUNCTION_NAME `
            --runtime $RUNTIME `
            --role $roleArn `
            --handler $HANDLER `
            --timeout $TIMEOUT `
            --memory-size $MEMORY_SIZE `
            --environment file://$envFile `
            --zip-file fileb://function.zip | Out-Null
    }
    
    Remove-Item $envFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Lambda function created"
    } else {
        Write-Error "Failed to create Lambda function"
        exit 1
    }
}
}

# Step 5: Create Function URL (if not exists)
if (-not $UpdateEnvOnly) {
    if (-not $StartFromStep -or [int]$StartFromStep -le 5) {
        Write-Step "Step 5: Create Function URL"
    } else {
        Write-Info "Skipping Step 5: Function URL (StartFromStep=$StartFromStep)"
    }
} else {
    Write-Info "Skipping Step 5: Function URL (UpdateEnvOnly mode)"
}

if ((-not $StartFromStep -or [int]$StartFromStep -le 5) -and -not $UpdateEnvOnly) {

# Check AWS CLI version
$awsVersion = aws --version 2>&1
if ($awsVersion -match "aws-cli/(\d+)\.(\d+)\.(\d+)") {
    $major = [int]$matches[1]
    $minor = [int]$matches[2]
    
    if ($major -lt 2 -or ($major -eq 2 -and $minor -lt 4)) {
        Write-Warning "AWS CLI version $major.$minor detected. Function URL requires AWS CLI 2.4+"
        Write-Warning "Please update AWS CLI: https://awscli.amazonaws.com/AWSCLIV2.msi"
        Write-Info ""
        Write-Info "To create Function URL manually:"
        Write-Info "1. Go to: https://console.aws.amazon.com/lambda/home?region=$AWS_REGION#/functions/$FUNCTION_NAME"
        Write-Info "2. Configuration → Function URL → Create function URL"
        Write-Info "3. Auth type: NONE"
        Write-Info "4. Save"
        Write-Info ""
        Write-Info "Or update AWS CLI and run: .\deploy-backend.ps1 -StartFromStep 5"
    } else {
        # AWS CLI is new enough, try to create Function URL
        $urlConfig = aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $AWS_REGION 2>&1
        if ($LASTEXITCODE -eq 0) {
            $urlInfo = $urlConfig | ConvertFrom-Json
            Write-Warning "Function URL already exists"
            Write-Info "URL: $($urlInfo.FunctionUrl)"
        } else {
            Write-Info "Creating Function URL..."
            
            $urlOutput = aws lambda create-function-url-config `
                --function-name $FUNCTION_NAME `
                --auth-type NONE `
                --region $AWS_REGION | ConvertFrom-Json
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Function URL created: $($urlOutput.FunctionUrl)"
                
                # Add permission for public access
                aws lambda add-permission `
                    --function-name $FUNCTION_NAME `
                    --statement-id AllowPublicAccess `
                    --action lambda:InvokeFunctionUrl `
                    --principal "*" `
                    --function-url-auth-type NONE `
                    --region $AWS_REGION 2>&1 | Out-Null
                
                Write-Success "Public access configured"
            }
        }
    }
}
}

# Step 6: Verify deployment
if (-not $UpdateEnvOnly) {
    if (-not $StartFromStep -or [int]$StartFromStep -le 6) {
        Write-Step "Step 6: Verify deployment"
    } else {
        Write-Info "Skipping Step 6: Verification (StartFromStep=$StartFromStep)"
    }
}

if ((-not $StartFromStep -or [int]$StartFromStep -le 6) -and -not $UpdateEnvOnly) {

Start-Sleep -Seconds 3

$functionInfo = aws lambda get-function --function-name $FUNCTION_NAME | ConvertFrom-Json
$functionConfig = $functionInfo.Configuration

Write-Success "Function Name: $($functionConfig.FunctionName)"
Write-Success "Runtime: $($functionConfig.Runtime)"
Write-Success "Handler: $($functionConfig.Handler)"
Write-Success "Memory: $($functionConfig.MemorySize) MB"
Write-Success "Timeout: $($functionConfig.Timeout) seconds"

if ($functionConfig.Layers.Count -gt 0) {
    Write-Success "Layers: $($functionConfig.Layers.Count) attached"
}

$urlConfig = aws lambda get-function-url-config --function-name $FUNCTION_NAME 2>&1 | ConvertFrom-Json
if ($urlConfig.FunctionUrl) {
    Write-Success "Function URL: $($urlConfig.FunctionUrl)"
}

if (-not $UpdateEnvOnly) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Test the function URL in your browser or API client"
    Write-Host "2. Update your frontend with the Function URL"
    Write-Host "3. Monitor CloudWatch Logs for any issues"
    Write-Host ""
} else {
    Write-Host ""
    Write-Success "Environment variables updated successfully!"
    Write-Host ""
}
}

# Cleanup temporary files
if (-not $SkipPackaging) {
    Write-Info "Cleaning up temporary files..."
    Remove-Item -Force "function.zip" -ErrorAction SilentlyContinue | Out-Null
}

Write-Success "Deployment script completed successfully!"
