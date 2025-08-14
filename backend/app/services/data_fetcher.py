import requests
import pandas as pd
import time
from datetime import datetime
from app.database import crud, models

class DataFetcher:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
        }
    
    def fetch_box_score(self, game_id, team_id):
        url = f"https://www.rotowire.com/basketball/tables/box-score.php?gameGlobalID={game_id}&teamGlobalID={team_id}"
        try:
            response = requests.get(url, headers=self.headers)
            data = response.json()
            df = pd.json_normalize(data)
            
            if df.empty:
                return pd.DataFrame()
                
            # Process shooting stats
            for stat in ['fg', 'pt3', 'ft']:
                if stat in df.columns:
                    splits = df[stat].str.extract(r'(\d+)\-(\d+)').astype(float)
                    if not splits.empty:
                        df[f'{stat}_made'] = splits[0]
                        df[f'{stat}_attempted'] = splits[1]
            
            return df
        except Exception as e:
            print(f"Error fetching {game_id}/{team_id}: {e}")
            return pd.DataFrame()
    
    def update_all_games(self, db):
        game_team_pairs = [
            (2879653, 11), (2879653, 25),
            (2693972, 7), (2693602, 1)
        ]
        
        for game_id, team_id in game_team_pairs:
            df = self.fetch_box_score(game_id, team_id)
            if not df.empty:
                self._save_to_db(db, game_id, team_id, df)
            time.sleep(1)
    
    def _save_to_db(self, db, game_id, team_id, df):
        # Implement your database saving logic here
        pass