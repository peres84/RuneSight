"""
Bedrock Configuration Verification Script

Verifies that AWS credentials and Bedrock model are properly configured.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_env_var(var_name: str, required: bool = True) -> bool:
    """Check if environment variable is set"""
    value = os.getenv(var_name)
    if value:
        # Mask sensitive values
        if "KEY" in var_name or "SECRET" in var_name:
            masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            print(f"✅ {var_name}: {masked}")
        else:
            print(f"✅ {var_name}: {value}")
        return True
    else:
        status = "❌" if required else "⚠️"
        print(f"{status} {var_name}: Not set")
        return not required

def verify_aws_credentials():
    """Verify AWS credentials"""
    print("\n🔐 Checking AWS Credentials...")
    print("-" * 50)
    
    has_key = check_env_var("AWS_ACCESS_KEY_ID")
    has_secret = check_env_var("AWS_SECRET_ACCESS_KEY")
    has_region = check_env_var("AWS_REGION")
    
    if not (has_key and has_secret and has_region):
        print("\n❌ AWS credentials incomplete!")
        return False
    
    # Try to validate credentials
    try:
        import boto3
        session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION")
        )
        sts = session.client("sts")
        identity = sts.get_caller_identity()
        print(f"\n✅ AWS credentials valid!")
        print(f"   Account: {identity['Account']}")
        print(f"   User ARN: {identity['Arn']}")
        return True
    except Exception as e:
        print(f"\n❌ AWS credentials validation failed: {e}")
        return False

def verify_bedrock_model():
    """Verify Bedrock model configuration"""
    print("\n🤖 Checking Bedrock Model Configuration...")
    print("-" * 50)
    
    model_id = os.getenv("BEDROCK_MODEL_ID")
    if not model_id:
        print("❌ BEDROCK_MODEL_ID not set!")
        return False
    
    print(f"✅ BEDROCK_MODEL_ID: {model_id}")
    
    # Check if it's a cross-region inference profile
    if "inference-profile" in model_id:
        print("✅ Using cross-region inference profile")
        if "global" in model_id:
            print("✅ Global routing enabled")
    
    # Check if it's Claude Sonnet 4.5
    if "claude-sonnet-4-5" in model_id:
        print("✅ Using Claude Sonnet 4.5 (latest)")
    
    # Try to initialize the model
    try:
        from agents.base_agent import create_bedrock_model
        model = create_bedrock_model()
        print("\n✅ Bedrock model initialized successfully!")
        return True
    except Exception as e:
        print(f"\n❌ Bedrock model initialization failed: {e}")
        return False

def verify_riot_api():
    """Verify Riot API key"""
    print("\n🎮 Checking Riot API Configuration...")
    print("-" * 50)
    
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        print("⚠️  RIOT_API_KEY not set (optional for AI features)")
        return False
    
    # Mask the key
    masked = api_key[:10] + "..." + api_key[-4:] if len(api_key) > 14 else "***"
    print(f"✅ RIOT_API_KEY: {masked}")
    
    # Check key format
    if api_key.startswith("RGAPI-"):
        print("✅ Key format valid")
    else:
        print("⚠️  Key format unusual (should start with RGAPI-)")
    
    return True

def main():
    """Main verification function"""
    print("=" * 50)
    print("🔍 RuneSight Bedrock Configuration Verification")
    print("=" * 50)
    
    # Check all configurations
    aws_ok = verify_aws_credentials()
    bedrock_ok = verify_bedrock_model()
    riot_ok = verify_riot_api()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Verification Summary")
    print("=" * 50)
    
    print(f"AWS Credentials: {'✅ Valid' if aws_ok else '❌ Invalid'}")
    print(f"Bedrock Model: {'✅ Ready' if bedrock_ok else '❌ Not Ready'}")
    print(f"Riot API: {'✅ Configured' if riot_ok else '⚠️  Not Configured'}")
    
    if aws_ok and bedrock_ok:
        print("\n✅ All critical configurations verified!")
        print("   You can now start the backend server.")
        print("\n   Run: .\\start.ps1")
        return 0
    else:
        print("\n❌ Configuration issues detected!")
        print("   Please check your .env file and fix the issues above.")
        print("\n   See SETUP.md for configuration instructions.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
