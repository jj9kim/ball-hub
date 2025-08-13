import requests
import pandas as pd
import time
import random

HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json'
}

def fetch_box_score(game_id, team_id):
    """Fetch and process box score data"""
    url = f"https://www.rotowire.com/basketball/tables/box-score.php?gameGlobalID={game_id}&teamGlobalID={team_id}"
    try:
        response = requests.get(url, headers=HEADERS)
        data = response.json()
        df = pd.json_normalize(data)
        
        if df.empty:
            return pd.DataFrame()  # Return empty DataFrame instead of None
            
        # Process shooting stats
        for stat in ['fg', 'pt3', 'ft']:
            if stat in df.columns:
                splits = df[stat].str.extract(r'(\d+)\-(\d+)').astype(float)
                if not splits.empty:
                    df[f'{stat}_made'] = splits[0]
                    df[f'{stat}_attempted'] = splits[1]
                    df[f'{stat}_missed'] = splits[1] - splits[0]
        
        return df
    except Exception as e:
        print(f"Error fetching {game_id}/{team_id}: {e}")
        return pd.DataFrame()  # Always return DataFrame

def get_data():
    """Main data fetching function"""
    game_team_pairs = [
        (2879653, 11), (2879653, 25),
        (2693972, 7), (2693602, 1)
    ]
    
    all_data = []
    for game_id, team_id in game_team_pairs:
        df = fetch_box_score(game_id, team_id)
        if not df.empty:  # Check for empty DataFrame
            all_data.append(df)
        time.sleep(1)
    
    return pd.concat(all_data) if all_data else pd.DataFrame()

if __name__ == "__main__":
    data = get_data()
    if not data.empty:
        data.to_csv('latest_data.csv', index=False)
    print(f"Found {len(data)} records")