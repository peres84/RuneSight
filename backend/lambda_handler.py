"""
AWS Lambda Handler for FastAPI Application
Uses Mangum to adapt FastAPI for AWS Lambda
"""
from mangum import Mangum
from main import app

# Create Lambda handler
# Note: CORS should be configured in FastAPI (main.py), not in Lambda Function URL
handler = Mangum(app, lifespan="off")

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
