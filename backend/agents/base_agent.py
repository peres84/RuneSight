"""
Base Agent Configuration for RuneSight AI Agents

Provides shared Bedrock model initialization and configuration for all Strands agents.
Based on working examples from examples/strands_agents.py
"""

import os
import boto3
import logging
from typing import Optional
from strands.models import BedrockModel

# Silence Strands SDK logs for cleaner output
logging.getLogger("strands").setLevel(logging.CRITICAL + 1)


class BedrockConfig:
    """
    Configuration manager for Amazon Bedrock integration.
    
    Handles AWS session creation and Bedrock model initialization
    with environment-based configuration.
    """
    
    _session: Optional[boto3.Session] = None
    _model: Optional[BedrockModel] = None
    
    @classmethod
    def get_session(cls) -> boto3.Session:
        """
        Get or create AWS boto3 session with credentials from environment.
        
        Returns:
            Configured boto3 Session
            
        Raises:
            ValueError: If required AWS credentials are not found in environment
        """
        if cls._session is None:
            aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
            aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
            aws_region = os.getenv("AWS_REGION", "eu-central-1")
            
            if not aws_access_key_id or not aws_secret_access_key:
                raise ValueError(
                    "AWS credentials not found. Please set AWS_ACCESS_KEY_ID "
                    "and AWS_SECRET_ACCESS_KEY environment variables."
                )
            
            cls._session = boto3.Session(
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                region_name=aws_region
            )
            
            # Verify credentials are valid
            try:
                sts = cls._session.client("sts")
                identity = sts.get_caller_identity()
                logging.info(f"✅ AWS credentials validated for account: {identity['Account']}")
            except Exception as e:
                raise ValueError(f"AWS credentials validation failed: {e}")
        
        return cls._session
    
    @classmethod
    def get_model(
        cls,
        temperature: float = 0.3,
        streaming: bool = False
    ) -> BedrockModel:
        """
        Get or create Bedrock model instance.
        
        Args:
            temperature: Model temperature for response randomness (0.0-1.0)
            streaming: Whether to enable streaming responses
            
        Returns:
            Configured BedrockModel instance
            
        Raises:
            ValueError: If BEDROCK_MODEL_ID is not set in environment
        """
        if cls._model is None:
            model_id = os.getenv("BEDROCK_MODEL_ID")
            if not model_id:
                raise ValueError(
                    "BEDROCK_MODEL_ID not found in environment. "
                    "Please set it to a valid Bedrock model ID "
                    "(e.g., 'eu.amazon.nova-lite-v1:0')"
                )
            
            session = cls.get_session()
            
            cls._model = BedrockModel(
                model_id=model_id,
                boto_session=session,
                temperature=temperature,
                streaming=streaming
            )
            
            logging.info(f"✅ Bedrock model initialized: {model_id}")
        
        return cls._model
    
    @classmethod
    def reset(cls):
        """Reset cached session and model (useful for testing)"""
        cls._session = None
        cls._model = None


def initialize_bedrock_session():
    """
    Initialize Bedrock session on application startup.
    
    This function should be called during FastAPI startup to validate
    AWS credentials and Bedrock access early.
    
    Raises:
        ValueError: If credentials are invalid or Bedrock is not accessible
    """
    try:
        BedrockConfig.get_session()
        BedrockConfig.get_model()
        logging.info("✅ Bedrock session initialized successfully")
    except Exception as e:
        logging.error(f"❌ Failed to initialize Bedrock session: {e}")
        raise


def create_bedrock_model(
    temperature: float = 0.3,
    streaming: bool = False
) -> BedrockModel:
    """
    Create a Bedrock model instance for use in agents.
    
    Args:
        temperature: Model temperature for response randomness (0.0-1.0)
        streaming: Whether to enable streaming responses
        
    Returns:
        Configured BedrockModel instance
        
    Example:
        >>> model = create_bedrock_model(temperature=0.5)
        >>> agent = Agent(model=model, tools=[...])
    """
    return BedrockConfig.get_model(temperature=temperature, streaming=streaming)
