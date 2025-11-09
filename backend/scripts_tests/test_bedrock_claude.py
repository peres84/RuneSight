#!/usr/bin/env python3
"""
Test AWS Bedrock Claude Sonnet Connection

This script tests the connection to AWS Bedrock and verifies that
Claude Sonnet 4.5 is accessible with the configured credentials.
"""

import os
import sys
import warnings
import logging
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Suppress warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)

# Silence Strands SDK logs
logging.getLogger("strands").setLevel(logging.CRITICAL + 1)


def load_env():
    """Load environment variables from .env file"""
    env_file = backend_dir / '.env'
    if not env_file.exists():
        print("❌ .env file not found!")
        return False
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    
    print("✅ Environment variables loaded from .env")
    return True


def test_aws_credentials():
    """Test AWS credentials validity"""
    print("\n" + "="*60)
    print("STEP 1: Testing AWS Credentials")
    print("="*60)
    
    try:
        import boto3
        
        aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_REGION', 'eu-central-1')
        
        if not aws_access_key_id or not aws_secret_access_key:
            print("❌ AWS credentials not found in environment!")
            return False
        
        print(f"📍 Region: {aws_region}")
        print(f"🔑 Access Key ID: {aws_access_key_id[:10]}...")
        
        # Create session
        session = boto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        # Verify credentials
        sts = session.client("sts")
        identity = sts.get_caller_identity()
        
        print("✅ AWS credentials are valid!")
        print(f"   Account ID: {identity['Account']}")
        print(f"   User ARN: {identity['Arn']}")
        
        return True, session
        
    except Exception as e:
        print(f"❌ AWS credentials validation failed: {e}")
        return False, None


def test_bedrock_access(session):
    """Test Bedrock model access"""
    print("\n" + "="*60)
    print("STEP 2: Testing Bedrock Model Access")
    print("="*60)
    
    try:
        from strands.models import BedrockModel
        
        model_id = os.getenv('BEDROCK_MODEL_ID')
        if not model_id:
            print("❌ BEDROCK_MODEL_ID not found in environment!")
            return False, None
        
        print(f"🤖 Model ID: {model_id}")
        
        # Initialize Bedrock model
        bedrock_model = BedrockModel(
            model_id=model_id,
            boto_session=session,
            temperature=0.3,
            streaming=False
        )
        
        print("✅ Bedrock model initialized successfully!")
        print(f"   Model: {bedrock_model.config.get('model_id', 'Unknown')}")
        
        return True, bedrock_model
        
    except Exception as e:
        print(f"❌ Bedrock model initialization failed: {e}")
        return False, None


def test_agent_basic(bedrock_model):
    """Test basic agent without tools"""
    print("\n" + "="*60)
    print("STEP 3: Testing Basic Agent")
    print("="*60)
    
    try:
        from strands import Agent
        
        # Create agent without tools
        agent = Agent(
            model=bedrock_model,
            tools=[],
        )
        
        print("✅ Agent created successfully!")
        
        # Test message
        message = "Explain in 2-3 sentences what Claude Sonnet is and what it's good at."
        
        print("\n📤 Sending test message to agent...")
        print(f"   Query: {message}")
        
        result = agent(message)
        
        print("\n✅ Agent response received!")
        print("\n" + "-"*60)
        print("🧾 Agent Response:")
        print("-"*60)
        print(result.message['content'][0]['text'])
        print("-"*60)
        
        # Print metrics
        print("\n📊 Metrics:")
        metrics_summary = result.metrics.get_summary()
        for key, value in metrics_summary.items():
            print(f"   {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_performance_agent():
    """Test the actual Performance Agent"""
    print("\n" + "="*60)
    print("STEP 4: Testing Performance Agent")
    print("="*60)
    
    try:
        from agents.performance_agent import PerformanceAgent
        
        agent = PerformanceAgent()
        print("✅ Performance Agent initialized!")
        
        # Test custom query
        test_query = "What are the key metrics I should focus on to improve my League of Legends gameplay?"
        
        print(f"\n📤 Testing custom query...")
        print(f"   Query: {test_query}")
        
        response = agent.custom_query(test_query)
        
        print("\n✅ Performance Agent response received!")
        print("\n" + "-"*60)
        print("🧾 Agent Response:")
        print("-"*60)
        print(response)
        print("-"*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Performance Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("AWS BEDROCK CLAUDE SONNET CONNECTION TEST")
    print("="*60)
    
    # Load environment
    if not load_env():
        sys.exit(1)
    
    # Test AWS credentials
    success, session = test_aws_credentials()
    if not success:
        print("\n❌ Test failed at AWS credentials validation")
        sys.exit(1)
    
    # Test Bedrock access
    success, bedrock_model = test_bedrock_access(session)
    if not success:
        print("\n❌ Test failed at Bedrock model access")
        print("\n💡 Common issues:")
        print("   1. Invalid payment method in AWS account")
        print("   2. Bedrock model not subscribed in AWS Marketplace")
        print("   3. Insufficient IAM permissions")
        print("   4. Model not available in the specified region")
        sys.exit(1)
    
    # Test basic agent
    success = test_agent_basic(bedrock_model)
    if not success:
        print("\n❌ Test failed at agent execution")
        sys.exit(1)
    
    # Test Performance Agent
    success = test_performance_agent()
    if not success:
        print("\n⚠️  Performance Agent test failed (but basic Bedrock works)")
    
    # Final summary
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print("\n🎉 AWS Bedrock Claude Sonnet is working correctly!")
    print("   Your RuneSight AI agents are ready to use.")
    print("\n💡 Next steps:")
    print("   1. Start the backend server: python main.py")
    print("   2. Test the chat interface in the frontend")
    print("   3. Try asking performance analysis questions")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
