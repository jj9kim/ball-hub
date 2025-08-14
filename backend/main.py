from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import sys
from pathlib import Path

# Add this before any app imports
sys.path.insert(0, str(Path(__file__).parent))

# Now import your app modules
from app.services.cache_manager import CacheManager
from app.routes import api, games
from app.database.database import SessionLocal

app = FastAPI()
cache = CacheManager()

# Mount frontend
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# Include routes
app.include_router(api.router)
app.include_router(games.router)

@app.on_event("startup")
def startup_event():
    # Start background thread
    import threading
    def run_cache():
        while True:
            db = SessionLocal()
            cache.update_cache(db)
            db.close()
    thread = threading.Thread(target=run_cache, daemon=True)
    thread.start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)