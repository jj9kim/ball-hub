import requests
import pandas as pd
import time
import json
from typing import List, Dict, Optional
import sqlite3
from datetime import datetime

start = 2879653
end = 2879645

class RotowireScraper:
    def __init__(self, db_name: str = "basketball_stats.db"):
        self.base_url = "https://www.rotowire.com/basketball/tables/box-score.php"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Accept': '*/*',
            'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.rotowire.com/basketball/box-score/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'TE': 'trailers'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.db_name = db_name
        self.setup_database()
        
    def setup_database(self):
        """Set up the SQLite database with the appropriate tables"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Create player_stats table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            player_name TEXT,
            player_name_short TEXT,
            position TEXT,
            position_sort INTEGER,
            game_id INTEGER,
            team_id INTEGER,
            minutes INTEGER,
            points INTEGER,
            fg_made INTEGER,
            fg_attempted INTEGER,
            fg_percentage REAL,
            three_pt_made INTEGER,
            three_pt_attempted INTEGER,
            three_pt_percentage REAL,
            ft_made INTEGER,
            ft_attempted INTEGER,
            ft_percentage REAL,
            offensive_rebounds INTEGER,
            defensive_rebounds INTEGER,
            total_rebounds INTEGER,
            assists INTEGER,
            steals INTEGER,
            blocks INTEGER,
            turnovers INTEGER,
            personal_fouls INTEGER,
            technical_fouls INTEGER,
            ejected INTEGER,
            ortg TEXT,
            usg TEXT,
            url TEXT,
            scraped_timestamp DATETIME
        )
        ''')
        
        # Create game_info table to store metadata about games
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_info (
            game_id INTEGER PRIMARY KEY,
            scraped_timestamp DATETIME,
            teams_found INTEGER
        )
        ''')
        
        conn.commit()
        conn.close()
        
    def get_team_data(self, game_global_id: int, team_global_id: int) -> Optional[Dict]:
        """Get data for a specific team in a specific game"""
        params = {
            'gameGlobalID': game_global_id,
            'teamGlobalID': team_global_id
        }
        
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for game {game_global_id}, team {team_global_id}: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON for game {game_global_id}, team {team_global_id}: {e}")
            return None
    
    def process_player_data(self, player_data: List[Dict], game_id: int, team_id: int) -> List[Dict]:
        """Process raw player data and add game/team context"""
        processed_data = []
        
        for player in player_data:
            # Skip summary rows (they have playerID 0 or empty strings)
            if player.get('playerID') == 0 or not player.get('nameLong') or player.get('nameLong') in ['Game Total', '']:
                continue
                
            # Add game and team context
            player_with_context = player.copy()
            player_with_context['game_id'] = game_id
            player_with_context['team_id'] = team_id
            
            # Convert string stats to numeric values where possible
            # Field Goals
            if 'fg' in player_with_context and isinstance(player_with_context['fg'], str):
                fg_parts = player_with_context['fg'].split('-')
                if len(fg_parts) == 2:
                    player_with_context['fg_made'] = int(fg_parts[0])
                    player_with_context['fg_attempted'] = int(fg_parts[1])
                    player_with_context['fg_percentage'] = round(int(fg_parts[0]) / int(fg_parts[1]) * 100, 1) if int(fg_parts[1]) > 0 else 0
            
            # 3-Point Field Goals
            if 'pt3' in player_with_context and isinstance(player_with_context['pt3'], str):
                pt3_parts = player_with_context['pt3'].split('-')
                if len(pt3_parts) == 2:
                    player_with_context['three_pt_made'] = int(pt3_parts[0])
                    player_with_context['three_pt_attempted'] = int(pt3_parts[1])
                    player_with_context['three_pt_percentage'] = round(int(pt3_parts[0]) / int(pt3_parts[1]) * 100, 1) if int(pt3_parts[1]) > 0 else 0
            
            # Free Throws
            if 'ft' in player_with_context and isinstance(player_with_context['ft'], str):
                ft_parts = player_with_context['ft'].split('-')
                if len(ft_parts) == 2:
                    player_with_context['ft_made'] = int(ft_parts[0])
                    player_with_context['ft_attempted'] = int(ft_parts[1])
                    player_with_context['ft_percentage'] = round(int(ft_parts[0]) / int(ft_parts[1]) * 100, 1) if int(ft_parts[1]) > 0 else 0
            
            # Convert other numeric fields including position_sort
            numeric_fields = ['minutes', 'points', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'turnovers', 'personalFouls', 'technicalFouls', 'ejected', 'positionSort']
            for field in numeric_fields:
                if field in player_with_context and player_with_context[field] not in ['', '-']:
                    try:
                        # Remove HTML tags if present
                        value = str(player_with_context[field])
                        if '<' in value:
                            # Extract numeric value from HTML
                            import re
                            numbers = re.findall(r'\d+', value)
                            if numbers:
                                player_with_context[field] = int(numbers[0])
                            else:
                                player_with_context[field] = 0
                        else:
                            player_with_context[field] = int(player_with_context[field])
                    except (ValueError, TypeError):
                        player_with_context[field] = 0
            
            # Calculate total rebounds
            oreb = player_with_context.get('oreb', 0)
            dreb = player_with_context.get('dreb', 0)
            player_with_context['total_rebounds'] = oreb + dreb
            
            processed_data.append(player_with_context)
        
        return processed_data
    
    def save_to_database(self, data: List[Dict]):
        """Save processed data to SQLite database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        games_processed = set()
        
        for player in data:
            try:
                cursor.execute('''
                INSERT INTO player_stats (
                    player_id, player_name, player_name_short, position, position_sort,
                    game_id, team_id, minutes, points, fg_made, fg_attempted, fg_percentage,
                    three_pt_made, three_pt_attempted, three_pt_percentage,
                    ft_made, ft_attempted, ft_percentage,
                    offensive_rebounds, defensive_rebounds, total_rebounds,
                    assists, steals, blocks, turnovers, personal_fouls,
                    technical_fouls, ejected, ortg, usg, url, scraped_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    player.get('playerID'),
                    player.get('nameLong'),
                    player.get('nameShort'),
                    player.get('position'),
                    player.get('positionSort', 0),  # Added position_sort
                    player.get('game_id'),
                    player.get('team_id'),
                    player.get('minutes', 0),
                    player.get('points', 0),
                    player.get('fg_made', 0),
                    player.get('fg_attempted', 0),
                    player.get('fg_percentage', 0),
                    player.get('three_pt_made', 0),
                    player.get('three_pt_attempted', 0),
                    player.get('three_pt_percentage', 0),
                    player.get('ft_made', 0),
                    player.get('ft_attempted', 0),
                    player.get('ft_percentage', 0),
                    player.get('oreb', 0),
                    player.get('dreb', 0),
                    player.get('total_rebounds', 0),
                    player.get('ast', 0),
                    player.get('stl', 0),
                    player.get('blk', 0),
                    player.get('turnovers', 0),
                    player.get('personalFouls', 0),
                    player.get('technicalFouls', 0),
                    player.get('ejected', 0),
                    player.get('ortg', ''),
                    player.get('usg', ''),
                    player.get('URL', ''),
                    datetime.now()
                ))
                
                # Track which games we've processed
                games_processed.add(player.get('game_id'))
                
            except Exception as e:
                print(f"Error inserting player data: {e}")
                print(f"Problematic player data: {player}")
        
        # Update game info table
        for game_id in games_processed:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO game_info (game_id, scraped_timestamp, teams_found)
                VALUES (?, ?, ?)
                ''', (game_id, datetime.now(), len([p for p in data if p.get('game_id') == game_id])))
            except Exception as e:
                print(f"Error updating game info: {e}")
        
        conn.commit()
        conn.close()
        print(f"Saved {len(data)} player records to database")
    
    def scrape_games_range(self, start_game_id: int, end_game_id: int, team_ids: List[int], delay: float = 1.0) -> List[Dict]:
        """Scrape data for a range of game IDs"""
        all_data = []
        
        # Create the range of game IDs (inclusive, descending order)
        game_ids = list(range(start_game_id, end_game_id - 1, -1))
        total_games = len(game_ids)
        
        print(f"Starting scrape of {total_games} games...")
        
        for i, game_id in enumerate(game_ids, 1):
            print(f"Processing game {i}/{total_games} (ID: {game_id})...")
            
            game_has_data = False
            
            for team_id in team_ids:
                print(f"  Fetching team {team_id}...")
                
                # Get raw data
                team_data = self.get_team_data(game_id, team_id)
                
                if team_data:
                    game_has_data = True
                    # Process and add to results
                    processed_data = self.process_player_data(team_data, game_id, team_id)
                    all_data.extend(processed_data)
                    
                    print(f"    Found {len(processed_data)} players for team {team_id}")
                else:
                    print(f"    No data found for team {team_id}")
                
                # Be respectful with delays
                time.sleep(delay)
            
            if not game_has_data:
                print(f"  No data found for game {game_id}")
        
        return all_data

# Example usage
def main():
    scraper = RotowireScraper(db_name="basketball_stats.db")
    
    # Define team IDs to scrape
    common_team_ids = list(range(1, 30)) + [5312]  # 1-29 + 5312
    
    # Define the range of game IDs you want to scrape
    start_game_id = start
    end_game_id = end
    
    # Scrape data for the range of games
    print(f"Scraping games from {start_game_id} to {end_game_id}...")
    all_data = scraper.scrape_games_range(start_game_id, end_game_id, common_team_ids, delay=0.5)
    
    # Save results to database
    if all_data:
        scraper.save_to_database(all_data)
        print(f"Scraped data for {len(all_data)} players across {len(set(p['game_id'] for p in all_data))} games")
        
        # Optional: Show a sample of the data with position_sort
        conn = sqlite3.connect("basketball_stats.db")
        df = pd.read_sql_query("SELECT player_name, position, position_sort, game_id, team_id, points FROM player_stats LIMIT 10", conn)
        print("\nSample of stored data (with position_sort):")
        print(df)
        conn.close()
    else:
        print("No data was scraped")

if __name__ == "__main__":
    main()