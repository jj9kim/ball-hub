import requests
import pandas as pd
import time
import json
from typing import List, Dict, Optional


def discover_game_ids(start_id: int, end_id: int) -> List[int]:
    """Discover valid game IDs within a range"""
    valid_game_ids = []
    
    for game_id in range(start_id, end_id + 1):
        # Test with a common team ID
        test_team_id = 11  # Oklahoma City Thunder
        url = f"https://www.rotowire.com/basketball/tables/box-score.php?gameGlobalID={game_id}&teamGlobalID={test_team_id}"
        
        try:
            response = requests.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0'
            })
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 1:  # Should have at least one real player
                    valid_game_ids.append(game_id)
                    print(f"Found valid game ID: {game_id}")
        except:
            continue
        
        time.sleep(0.00001)
    
    return valid_game_ids

# To discover game IDs, run:
# game_ids = discover_game_ids(2879600, 2879700)