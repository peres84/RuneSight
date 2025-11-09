"""
Installation Verification Script
Checks if all required dependencies are properly installed
"""

import sys
import importlib.metadata

def check_package(package_name: str, expected_version: str = None) -> bool:
    """Check if a package is installed and optionally verify version"""
    try:
        version = importlib.metadata.version(package_name)
        status = "✅"
        version_info = f"v{version}"
        
        if expected_version and version != expected_version:
            status = "⚠️"
            version_info = f"v{version} (expected {expected_version})"
        
        print(f"{status} {package_name:20s} {version_info}")
        return True
    except importlib.metadata.PackageNotFoundError:
        print(f"❌ {package_name:20s} NOT INSTALLED")
        return False

def check_imports() -> bool:
    """Check if critical imports work"""
    print("\n" + "=" * 60)
    print("Checking Critical Imports")
    print("=" * 60)
    
    imports_to_check = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "uvicorn"),
        ("boto3", "boto3"),
        ("strands", "Strands Agents"),
        ("pydantic", "Pydantic"),
        ("requests", "requests"),
        ("dotenv", "python-dotenv"),
    ]
    
    all_ok = True
    for module_name, display_name in imports_to_check:
        try:
            __import__(module_name)
            print(f"✅ {display_name:20s} imports successfully")
        except ImportError as e:
            print(f"❌ {display_name:20s} import failed: {e}")
            all_ok = False
    
    return all_ok

def check_strands_components() -> bool:
    """Check if Strands Agents components are available"""
    print("\n" + "=" * 60)
    print("Checking Strands Agents Components")
    print("=" * 60)
    
    try:
        from strands import Agent, tool
        print("✅ Agent class available")
        print("✅ @tool decorator available")
        
        from strands.models import BedrockModel
        print("✅ BedrockModel available")
        
        return True
    except ImportError as e:
        print(f"❌ Strands components import failed: {e}")
        return False

def main():
    """Run all verification checks"""
    print("=" * 60)
    print("RuneSight 2.0 - Installation Verification")
    print("=" * 60)
    print(f"Python version: {sys.version}")
    print()
    
    # Check required packages
    print("=" * 60)
    print("Checking Required Packages")
    print("=" * 60)
    
    packages = [
        ("fastapi", "0.115.6"),
        ("uvicorn", "0.34.0"),
        ("python-multipart", "0.0.20"),
        ("requests", "2.32.3"),
        ("python-dotenv", "1.0.1"),
        ("boto3", "1.35.94"),
        ("strands-agents", "1.15.0"),
        ("pydantic", "2.12.4"),
    ]
    
    all_installed = True
    for package_name, expected_version in packages:
        if not check_package(package_name, expected_version):
            all_installed = False
    
    # Check imports
    imports_ok = check_imports()
    
    # Check Strands components
    strands_ok = check_strands_components()
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    if all_installed and imports_ok and strands_ok:
        print("✅ All checks passed! Installation is complete.")
        print("\nNext steps:")
        print("1. Configure .env file with your credentials")
        print("2. Run: python main.py")
        print("3. Test endpoints: python test_agents.py")
        return 0
    else:
        print("❌ Some checks failed. Please review the errors above.")
        print("\nTo fix:")
        print("1. Run: pip install -r requirements.txt")
        print("2. Run this script again: python verify_installation.py")
        return 1

if __name__ == "__main__":
    sys.exit(main())
