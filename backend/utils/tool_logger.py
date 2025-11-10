"""
Tool Logger

Provides logging utilities for tracking tool usage by agents.
"""

import logging
import time
from functools import wraps
from typing import Any, Callable

logger = logging.getLogger(__name__)


def log_tool_usage(func: Callable) -> Callable:
    """
    Decorator to log tool usage with timing information.
    
    Usage:
        @tool
        @log_tool_usage
        def my_tool(arg1, arg2):
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        tool_name = func.__name__
        
        # Log tool call start
        logger.info("=" * 60)
        logger.info(f"🔧 TOOL CALLED: {tool_name}")
        
        # Log arguments (truncate long values)
        if args:
            logger.info(f"   Args: {[str(arg)[:100] for arg in args]}")
        if kwargs:
            logger.info(f"   Kwargs: {dict((k, str(v)[:100]) for k, v in kwargs.items())}")
        
        # Execute tool
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time
            
            # Log success
            logger.info(f"   ✅ Success ({elapsed:.2f}s)")
            
            # Log result summary
            if isinstance(result, dict):
                if 'error' in result:
                    logger.warning(f"   ⚠️  Tool returned error: {result.get('error')}")
                elif 'success' in result:
                    logger.info(f"   Success: {result.get('success')}")
                
                # Log key metrics
                for key in ['results_count', 'games_analyzed', 'matches_analyzed', 'count']:
                    if key in result:
                        logger.info(f"   {key}: {result[key]}")
            
            logger.info("=" * 60)
            return result
            
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"   ❌ Error ({elapsed:.2f}s): {str(e)}")
            logger.info("=" * 60)
            raise
    
    return wrapper


def log_agent_execution(agent_name: str, query: str):
    """
    Log agent execution start.
    
    Args:
        agent_name: Name of the agent
        query: User query
    """
    logger.info("")
    logger.info("=" * 80)
    logger.info(f"🤖 AGENT EXECUTION START: {agent_name.upper()}")
    logger.info(f"Query: {query[:200]}...")
    logger.info("=" * 80)


def log_agent_completion(agent_name: str, response_length: int, elapsed: float):
    """
    Log agent execution completion.
    
    Args:
        agent_name: Name of the agent
        response_length: Length of response
        elapsed: Time elapsed in seconds
    """
    logger.info("=" * 80)
    logger.info(f"✅ AGENT EXECUTION COMPLETE: {agent_name.upper()}")
    logger.info(f"Response Length: {response_length} characters")
    logger.info(f"Time Elapsed: {elapsed:.2f}s")
    logger.info("=" * 80)
    logger.info("")
