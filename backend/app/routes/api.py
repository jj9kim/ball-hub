from fastapi import APIRouter
from app.services.cache_manager import cache
import math

router = APIRouter()

@router.get("/api/data")
def get_data():
    def clean_nans(data):
        # Your existing clean_nans function
        pass
    
    cleaned_data = clean_nans(cache.data)
    return {
        "success": bool(cleaned_data),
        "data": cleaned_data,
        "last_updated": cache.last_updated,
        "error": cache.error,
        "count": len(cleaned_data)
    }