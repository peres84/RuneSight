#!/usr/bin/env python3
"""
Knowledge Base Agent Example

Demonstrates how to use the knowledge base with RuneSight agents.
This agent can remember player insights and provide personalized coaching.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from strands import Agent
from strands.models import BedrockModel
from tools.kb_tool import (
    knowledge_base_action,
    remember_player_insight,
    recall_player_insights
)

# Bypass tool consent for demo
os.environ["BYPASS_TOOL_CONSENT"] = "true"

# System prompt for the coaching agent
COACHING_SYSTEM_PROMPT = """You are a personalized League of Legends coach with memory.

You can remember player insights across conversations using the knowledge base:
- Player weaknesses and areas for improvement
- Player strengths and what they excel at
- Player goals and aspirations
- Player preferences (champions, roles, playstyle)

When a user shares information about themselves, use remember_player_insight to store it.
When providing advice, use recall_player_insights to retrieve context about the player.

Always provide personalized, context-aware coaching based on what you remember about the player.

Examples of what to remember:
- "I struggle with CS in early game" → weakness
- "I'm really good at team fighting" → strength
- "I want to reach Diamond this season" → goal
- "I prefer playing aggressive champions" → preference

Be conversational, encouraging, and use the player's history to provide better advice."""


def create_coaching_agent():
    """Create a coaching agent with knowledge base access"""
    
    # Check if KB is configured
    kb_id = os.getenv("STRANDS_KNOWLEDGE_BASE_ID", "")
    if not kb_id:
        print("\n⚠️  Warning: STRANDS_KNOWLEDGE_BASE_ID not set!")
        print("The agent will work but won't be able to remember insights.")
        print("Set the environment variable to enable memory features.\n")
    
    # Create Bedrock model
    model = BedrockModel(
        model_id=os.getenv("BEDROCK_MODEL_ID", "eu.amazon.nova-lite-v1:0"),
        temperature=0.3
    )
    
    # Create agent with KB tools
    agent = Agent(
        model=model,
        tools=[
            knowledge_base_action,
            remember_player_insight,
            recall_player_insights
        ],
        system_prompt=COACHING_SYSTEM_PROMPT
    )
    
    return agent


def run_interactive_session():
    """Run an interactive coaching session"""
    
    print("\n🎮 RuneSight Coaching Agent with Memory 🧠\n")
    print("This agent remembers your insights across conversations!")
    print("=" * 60)
    print("\nExample commands:")
    print("- 'I struggle with CS in early game'")
    print("- 'What should I focus on to improve?'")
    print("- 'I want to reach Diamond this season'")
    print("- 'What do you remember about me?'")
    print("\nType 'exit' to quit\n")
    
    # Get player RiotID
    riot_id = input("Enter your RiotID (e.g., PlayerName#NA1): ").strip()
    if not riot_id:
        riot_id = "Demo#NA1"
        print(f"Using demo RiotID: {riot_id}\n")
    
    # Create agent
    agent = create_coaching_agent()
    
    # Interactive loop
    while True:
        try:
            user_input = input(f"\n{riot_id}> ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ["exit", "quit"]:
                print("\n👋 Thanks for using RuneSight! Keep improving!")
                break
            
            # Add RiotID context to query
            query_with_context = f"Player: {riot_id}\nQuery: {user_input}"
            
            # Get response from agent
            print("\n🤔 Thinking...")
            result = agent(query_with_context)
            
            # Extract and print response
            response = result.message['content'][0]['text']
            print(f"\n🎯 Coach: {response}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Session interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            print("Please try again.")


def demo_knowledge_base():
    """Run a quick demo of knowledge base features"""
    
    print("\n🧪 Knowledge Base Demo\n")
    print("=" * 60)
    
    agent = create_coaching_agent()
    riot_id = "DemoPlayer#NA1"
    
    # Demo 1: Store insights
    print("\n1️⃣  Storing player insights...")
    queries = [
        f"Player: {riot_id}\nQuery: I struggle with CS in early game",
        f"Player: {riot_id}\nQuery: I'm really good at team fighting",
        f"Player: {riot_id}\nQuery: I want to reach Diamond this season"
    ]
    
    for query in queries:
        print(f"\n   User: {query.split('Query: ')[1]}")
        result = agent(query)
        response = result.message['content'][0]['text']
        print(f"   Coach: {response[:100]}...")
    
    # Demo 2: Retrieve insights
    print("\n\n2️⃣  Retrieving player insights...")
    query = f"Player: {riot_id}\nQuery: What do you remember about me?"
    print(f"\n   User: What do you remember about me?")
    result = agent(query)
    response = result.message['content'][0]['text']
    print(f"   Coach: {response}")
    
    # Demo 3: Personalized advice
    print("\n\n3️⃣  Providing personalized advice...")
    query = f"Player: {riot_id}\nQuery: What should I focus on to improve?"
    print(f"\n   User: What should I focus on to improve?")
    result = agent(query)
    response = result.message['content'][0]['text']
    print(f"   Coach: {response}")
    
    print("\n\n✅ Demo complete!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="RuneSight Knowledge Base Agent")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run a quick demo instead of interactive session"
    )
    
    args = parser.parse_args()
    
    if args.demo:
        demo_knowledge_base()
    else:
        run_interactive_session()
