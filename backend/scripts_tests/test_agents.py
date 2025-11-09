"""
Test script for Strands Agents implementation

This script tests the basic functionality of all three agents without requiring
actual AWS Bedrock access. It verifies the agent structure and tool definitions.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all agent modules can be imported"""
    print("Testing imports...")
    
    try:
        from agents.base_agent import BedrockConfig, create_bedrock_model, initialize_bedrock_session
        print("✅ base_agent imports successful")
    except Exception as e:
        print(f"❌ base_agent import failed: {e}")
        return False
    
    try:
        from agents.performance_agent import PerformanceAgent, get_match_performance, get_recent_performance_summary
        print("✅ performance_agent imports successful")
    except Exception as e:
        print(f"❌ performance_agent import failed: {e}")
        return False
    
    try:
        from agents.champion_agent import ChampionAgent, get_champion_performance, get_champion_pool, get_matchup_history
        print("✅ champion_agent imports successful")
    except Exception as e:
        print(f"❌ champion_agent import failed: {e}")
        return False
    
    try:
        from agents.comparison_agent import ComparisonAgent, compare_players, analyze_duo_synergy, get_head_to_head
        print("✅ comparison_agent imports successful")
    except Exception as e:
        print(f"❌ comparison_agent import failed: {e}")
        return False
    
    return True


def test_agent_structure():
    """Test that agents have the expected structure"""
    print("\nTesting agent structure...")
    
    from agents.performance_agent import PerformanceAgent
    from agents.champion_agent import ChampionAgent
    from agents.comparison_agent import ComparisonAgent
    
    # Test Performance Agent
    try:
        # Check class attributes
        assert hasattr(PerformanceAgent, 'SYSTEM_PROMPT'), "PerformanceAgent missing SYSTEM_PROMPT"
        assert hasattr(PerformanceAgent, '__init__'), "PerformanceAgent missing __init__"
        assert hasattr(PerformanceAgent, 'analyze_match'), "PerformanceAgent missing analyze_match"
        assert hasattr(PerformanceAgent, 'analyze_recent_performance'), "PerformanceAgent missing analyze_recent_performance"
        assert hasattr(PerformanceAgent, 'custom_query'), "PerformanceAgent missing custom_query"
        print("✅ PerformanceAgent structure valid")
    except AssertionError as e:
        print(f"❌ PerformanceAgent structure invalid: {e}")
        return False
    
    # Test Champion Agent
    try:
        assert hasattr(ChampionAgent, 'SYSTEM_PROMPT'), "ChampionAgent missing SYSTEM_PROMPT"
        assert hasattr(ChampionAgent, '__init__'), "ChampionAgent missing __init__"
        assert hasattr(ChampionAgent, 'analyze_champion_performance'), "ChampionAgent missing analyze_champion_performance"
        assert hasattr(ChampionAgent, 'analyze_champion_pool'), "ChampionAgent missing analyze_champion_pool"
        assert hasattr(ChampionAgent, 'analyze_matchup'), "ChampionAgent missing analyze_matchup"
        assert hasattr(ChampionAgent, 'custom_query'), "ChampionAgent missing custom_query"
        print("✅ ChampionAgent structure valid")
    except AssertionError as e:
        print(f"❌ ChampionAgent structure invalid: {e}")
        return False
    
    # Test Comparison Agent
    try:
        assert hasattr(ComparisonAgent, 'SYSTEM_PROMPT'), "ComparisonAgent missing SYSTEM_PROMPT"
        assert hasattr(ComparisonAgent, '__init__'), "ComparisonAgent missing __init__"
        assert hasattr(ComparisonAgent, 'compare_multiple_players'), "ComparisonAgent missing compare_multiple_players"
        assert hasattr(ComparisonAgent, 'analyze_duo'), "ComparisonAgent missing analyze_duo"
        assert hasattr(ComparisonAgent, 'analyze_head_to_head'), "ComparisonAgent missing analyze_head_to_head"
        assert hasattr(ComparisonAgent, 'custom_query'), "ComparisonAgent missing custom_query"
        print("✅ ComparisonAgent structure valid")
    except AssertionError as e:
        print(f"❌ ComparisonAgent structure invalid: {e}")
        return False
    
    return True


def test_api_endpoints():
    """Test that API endpoints are properly defined"""
    print("\nTesting API endpoints...")
    
    try:
        from api.analysis import router
        
        # Get all routes
        routes = [route.path for route in router.routes]
        
        # Check expected endpoints exist
        expected_endpoints = [
            "/performance",
            "/performance/query",
            "/champion",
            "/champion/query",
            "/compare",
            "/compare/query",
            "/health"
        ]
        
        for endpoint in expected_endpoints:
            if endpoint in routes:
                print(f"✅ Endpoint {endpoint} exists")
            else:
                print(f"❌ Endpoint {endpoint} missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False


def test_tool_functions():
    """Test that tool functions have proper signatures"""
    print("\nTesting tool functions...")
    
    from agents.performance_agent import get_match_performance, get_recent_performance_summary
    from agents.champion_agent import get_champion_performance, get_champion_pool, get_matchup_history
    from agents.comparison_agent import compare_players, analyze_duo_synergy, get_head_to_head
    
    import inspect
    
    tools = [
        ("get_match_performance", get_match_performance, ["match_id", "riot_id"]),
        ("get_recent_performance_summary", get_recent_performance_summary, ["riot_id"]),
        ("get_champion_performance", get_champion_performance, ["riot_id", "champion_name"]),
        ("get_champion_pool", get_champion_pool, ["riot_id"]),
        ("get_matchup_history", get_matchup_history, ["riot_id", "champion_name", "enemy_champion"]),
        ("compare_players", compare_players, ["riot_ids"]),
        ("analyze_duo_synergy", analyze_duo_synergy, ["riot_id_1", "riot_id_2"]),
        ("get_head_to_head", get_head_to_head, ["riot_id_1", "riot_id_2"]),
    ]
    
    for tool_name, tool_func, required_params in tools:
        sig = inspect.signature(tool_func)
        params = list(sig.parameters.keys())
        
        # Check if all required params are present
        for required_param in required_params:
            if required_param in params:
                print(f"✅ Tool {tool_name} has parameter {required_param}")
            else:
                print(f"❌ Tool {tool_name} missing parameter {required_param}")
                return False
    
    return True


def main():
    """Run all tests"""
    print("=" * 60)
    print("RuneSight 2.0 - Strands Agents Test Suite")
    print("=" * 60)
    
    tests = [
        ("Import Test", test_imports),
        ("Agent Structure Test", test_agent_structure),
        ("API Endpoints Test", test_api_endpoints),
        ("Tool Functions Test", test_tool_functions),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'=' * 60}")
        print(f"Running: {test_name}")
        print('=' * 60)
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Agents are ready to use.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
