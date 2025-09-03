import requests
import pandas as pd
import time
import json

def validate_team_ids():
    """Function to help you discover valid team IDs"""
    test_game_id = 2879653  # Use a known valid game ID
    valid_team_ids = []
    
    # Test common ranges
    test_ranges = [range(1, 30), [5312], range(30, 50)]  # Add more ranges as needed
    
    for test_range in test_ranges:
        for team_id in test_range:
            url = f"https://www.rotowire.com/basketball/tables/box-score.php?gameGlobalID={test_game_id}&teamGlobalID={team_id}"
            try:
                response = requests.get(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0'
                })
                if response.status_code == 200 and response.json():
                    valid_team_ids.append(team_id)
                    print(f"Found valid team ID: {team_id}")
            except:
                continue
            time.sleep(0.000001)
    
    return valid_team_ids

# To discover valid team IDs, run:
# valid_teams = validate_team_ids()
# print(f"Valid team IDs: {valid_teams}")
