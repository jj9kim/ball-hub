import time
import math
import pandas as pd
from app.services.data_fetcher import DataFetcher

class CacheManager:
    def __init__(self):
        self.data = []
        self.last_updated = None
        self.error = None
        self.fetcher = DataFetcher()
    
    def update_cache(self, db):
        try:
            df = self.fetcher.get_data()
            # Add your cache update logic
            time.sleep(60)
        except Exception as e:
            self.error = str(e)