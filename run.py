import sys
import os
import uvicorn

# Ensure the root project directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    print("🚀 Starting CampusMart Backend Server on http://localhost:8000 ...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

