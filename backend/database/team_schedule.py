import requests
import pandas as pd
import time
import json
from typing import List, Dict, Optional
import sqlite3
from datetime import datetime
import re
from bs4 import BeautifulSoup

start = 2878571
end = 2878571

class RotowireScraper:
    def __init__(self, db_name: str = "games.db"):
        self.base_url = "https://www.rotowire.com/basketball/tables/box-score.php"
        self.schedule_url = "https://www.rotowire.com/basketball/tables/team-schedule.php"
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
        
        # Create games table WITH player_rating column
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS games (
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
            player_rating REAL,
            scraped_timestamp DATETIME,
            UNIQUE(player_id, game_id, team_id)
        )
        ''')
        
        # Create team_stats table for position_sort = 4 data (team totals)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER,
            team_id INTEGER,
            minutes TEXT,
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
            technical_fouls TEXT,
            ejected TEXT,
            ortg TEXT,
            usg TEXT,
            scraped_timestamp DATETIME,
            UNIQUE(game_id, team_id)
        )
        ''')
        
        # Create game_info table to store metadata about games
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_info (
            game_id INTEGER PRIMARY KEY,
            game_date TEXT,
            scraped_timestamp DATETIME,
            teams_found INTEGER
        )
        ''')
        
        # Create team_schedule table for team schedules
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_abbreviation TEXT NOT NULL,
            game_date TEXT NOT NULL,
            home_away TEXT NOT NULL,
            opponent_short TEXT NOT NULL,
            opponent_long TEXT NOT NULL,
            game_id INTEGER UNIQUE,
            team_record TEXT,
            did_win INTEGER,
            scraped_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.commit()
        conn.close()
        
    def scrape_team_schedule(self, team_abbreviation: str) -> List[Dict]:
        """Scrape team schedule data from Rotowire"""
        params = {'team': team_abbreviation}
        
        try:
            response = self.session.get(self.schedule_url, params=params)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            games = []
            
            # Find all table rows - adjust selector based on actual structure
            rows = soup.select('table tr')
            
            for row in rows:
                # Skip header rows and empty rows
                if row.find('th') or not row.find('td'):
                    continue
                    
                cells = row.find_all('td')
                if len(cells) < 7:  # Need at least 7 cells for all data
                    continue
                    
                try:
                    # Extract data from cells
                    date = cells[0].get_text(strip=True)
                    homeaway = cells[1].get_text(strip=True)
                    
                    # Opponent info - might be in cell with image
                    opponent_cell = cells[2]
                    opponent_short = opponent_cell.get_text(strip=True)
                    
                    # For opponent long name, try to get from alt text of image or title
                    opponent_img = opponent_cell.find('img')
                    if opponent_img and opponent_img.get('alt'):
                        opponent_long = opponent_img.get('alt')
                    else:
                        opponent_long = cells[3].get_text(strip=True)
                    
                    # Extract game ID from score link
                    score_cell = cells[4]
                    score_link = score_cell.find('a')
                    game_id = None
                    
                    if score_link and score_link.get('href'):
                        href = score_link['href']
                        # Extract game ID from URL pattern: ...-2878782
                        game_id_match = re.search(r'-(\d+)$', href)
                        if game_id_match:
                            game_id = int(game_id_match.group(1))
                    
                    record = cells[5].get_text(strip=True)
                    
                    # Determine win/loss from score cell
                    score_text = score_cell.get_text(strip=True)
                    did_win = 1 if 'W' in score_text else 0
                    
                    game_data = {
                        'team_abbreviation': team_abbreviation,
                        'game_date': date,
                        'home_away': homeaway,
                        'opponent_short': opponent_short,
                        'opponent_long': opponent_long,
                        'game_id': game_id,
                        'team_record': record,
                        'did_win': did_win
                    }
                    
                    games.append(game_data)
                    
                except Exception as e:
                    print(f"Error parsing row for {team_abbreviation}: {e}")
                    continue
                    
            return games
            
        except requests.RequestException as e:
            print(f"Error fetching schedule for {team_abbreviation}: {e}")
            return []
    
    def save_team_schedule(self, schedule_data: List[Dict]):
        """Save team schedule data to database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        games_saved = 0
        
        for game in schedule_data:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO team_schedule 
                (team_abbreviation, game_date, home_away, opponent_short, opponent_long, game_id, team_record, did_win, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    game['team_abbreviation'],
                    game['game_date'],
                    game['home_away'],
                    game['opponent_short'],
                    game['opponent_long'],
                    game['game_id'],
                    game['team_record'],
                    game['did_win'],
                    datetime.now()
                ))
                
                if cursor.rowcount > 0:
                    games_saved += 1
                    
            except Exception as e:
                print(f"Error inserting schedule data: {e}")
        
        conn.commit()
        conn.close()
        print(f"Saved {games_saved} schedule records to database")
    
    def scrape_all_team_schedules(self, teams: List[str]):
        """Scrape schedules for all specified teams"""
        all_schedule_data = []
        
        for team in teams:
            print(f"Scraping schedule for {team}...")
            schedule_data = self.scrape_team_schedule(team)
            
            if schedule_data:
                all_schedule_data.extend(schedule_data)
                print(f"  Found {len(schedule_data)} games for {team}")
                
                # Small delay to be respectful
                time.sleep(1)
            else:
                print(f"  No schedule data found for {team}")
        
        # Save all schedule data
        if all_schedule_data:
            self.save_team_schedule(all_schedule_data)
            print(f"Total schedule records saved: {len(all_schedule_data)}")
        else:
            print("No schedule data was scraped")
    
    # Rest of your existing methods remain the same...
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
    
    def extract_game_date_from_url(self, game_id: int) -> Optional[str]:
        """Extract the game date from the box score URL"""
        try:
            url = f"https://www.rotowire.com/basketball/box-score/game-{game_id}"
            response = self.session.get(url, timeout=10, allow_redirects=True)
            
            date_pattern = r'(\d{4}-\d{2}-\d{2})-\d+$'
            match = re.search(date_pattern, response.url)
            
            if match:
                return match.group(1)
            else:
                print(f"Could not extract date from URL: {response.url}")
                return None
                
        except Exception as e:
            print(f"Error extracting date for game {game_id}: {e}")
            return None
    
    def process_player_data(self, player_data: List[Dict], game_id: int, team_id: int) -> List[Dict]:
        """Process raw player data and add game/team context"""
        processed_data = []
        
        for player in player_data:
            position_sort = player.get('positionSort', 0)
            if (player.get('playerID') == 0 and position_sort != 4) or not player.get('nameLong') or player.get('nameLong') in ['', 'Game Total']:
                continue
                
            player_with_context = player.copy()
            player_with_context['game_id'] = game_id
            player_with_context['team_id'] = team_id
            
            # Convert string stats to numeric values
            if 'fg' in player_with_context and isinstance(player_with_context['fg'], str):
                fg_parts = player_with_context['fg'].split('-')
                if len(fg_parts) == 2:
                    player_with_context['fg_made'] = int(fg_parts[0])
                    player_with_context['fg_attempted'] = int(fg_parts[1])
                    player_with_context['fg_percentage'] = round(int(fg_parts[0]) / int(fg_parts[1]) * 100, 1) if int(fg_parts[1]) > 0 else 0
            
            if 'pt3' in player_with_context and isinstance(player_with_context['pt3'], str):
                pt3_parts = player_with_context['pt3'].split('-')
                if len(pt3_parts) == 2:
                    player_with_context['three_pt_made'] = int(pt3_parts[0])
                    player_with_context['three_pt_attempted'] = int(pt3_parts[1])
                    player_with_context['three_pt_percentage'] = round(int(pt3_parts[0]) / int(pt3_parts[1]) * 100, 1) if int(pt3_parts[1]) > 0 else 0
            
            if 'ft' in player_with_context and isinstance(player_with_context['ft'], str):
                ft_parts = player_with_context['ft'].split('-')
                if len(ft_parts) == 2:
                    player_with_context['ft_made'] = int(ft_parts[0])
                    player_with_context['ft_attempted'] = int(ft_parts[1])
                    player_with_context['ft_percentage'] = round(int(ft_parts[0]) / int(ft_parts[1]) * 100, 1) if int(ft_parts[1]) > 0 else 0
            
            numeric_fields = ['minutes', 'points', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'turnovers', 'personalFouls', 'technicalFouls', 'ejected', 'positionSort']
            for field in numeric_fields:
                if field in player_with_context and player_with_context[field] not in ['', '-']:
                    try:
                        value = str(player_with_context[field])
                        if '<' in value:
                            numbers = re.findall(r'\d+', value)
                            if numbers:
                                player_with_context[field] = int(numbers[0])
                            else:
                                player_with_context[field] = 0
                        else:
                            player_with_context[field] = int(player_with_context[field])
                    except (ValueError, TypeError):
                        player_with_context[field] = 0
            
            oreb = player_with_context.get('oreb', 0)
            dreb = player_with_context.get('dreb', 0)
            player_with_context['total_rebounds'] = oreb + dreb
            
            processed_data.append(player_with_context)
        
        return processed_data
    
    def extract_team_totals(self, player_data: List[Dict], game_id: int, team_id: int) -> Optional[Dict]:
        """Extract team totals from position_sort = 4 data"""
        for player in player_data:
            if player.get('positionSort') == 4 and player.get('nameLong') == 'Game Total':
                team_totals = {
                    'game_id': game_id,
                    'team_id': team_id,
                    'minutes': player.get('minutes', ''),
                    'points': self._extract_numeric(player.get('points', 0)),
                    'fg_made': self._extract_numeric(player.get('fg', '0-0').split('-')[0]),
                    'fg_attempted': self._extract_numeric(player.get('fg', '0-0').split('-')[1]),
                    'three_pt_made': self._extract_numeric(player.get('pt3', '0-0').split('-')[0]),
                    'three_pt_attempted': self._extract_numeric(player.get('pt3', '0-0').split('-')[1]),
                    'ft_made': self._extract_numeric(player.get('ft', '0-0').split('-')[0]),
                    'ft_attempted': self._extract_numeric(player.get('ft', '0-0').split('-')[1]),
                    'offensive_rebounds': self._extract_numeric(player.get('oreb', 0)),
                    'defensive_rebounds': self._extract_numeric(player.get('dreb', 0)),
                    'assists': self._extract_numeric(player.get('ast', 0)),
                    'steals': self._extract_numeric(player.get('stl', 0)),
                    'blocks': self._extract_numeric(player.get('blk', 0)),
                    'turnovers': self._extract_numeric(player.get('turnovers', 0)),
                    'personal_fouls': self._extract_numeric(player.get('personalFouls', 0)),
                    'technical_fouls': player.get('technicalFouls', ''),
                    'ejected': player.get('ejected', ''),
                    'ortg': player.get('ortg', ''),
                    'usg': player.get('usg', ''),
                    'scraped_timestamp': datetime.now()
                }
                
                if team_totals['fg_attempted'] > 0:
                    team_totals['fg_percentage'] = round(team_totals['fg_made'] / team_totals['fg_attempted'] * 100, 1)
                if team_totals['three_pt_attempted'] > 0:
                    team_totals['three_pt_percentage'] = round(team_totals['three_pt_made'] / team_totals['three_pt_attempted'] * 100, 1)
                if team_totals['ft_attempted'] > 0:
                    team_totals['ft_percentage'] = round(team_totals['ft_made'] / team_totals['ft_attempted'] * 100, 1)
                
                team_totals['total_rebounds'] = team_totals['offensive_rebounds'] + team_totals['defensive_rebounds']
                
                return team_totals
        return None
    
    def _extract_numeric(self, value):
        """Extract numeric value from potentially HTML-formatted text"""
        if isinstance(value, str) and '<' in value:
            numbers = re.findall(r'\d+', value)
            return int(numbers[0]) if numbers else 0
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0
    
    def save_to_database(self, data: List[Dict], team_totals_data: List[Dict]):
        """Save processed data to SQLite database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        games_processed = set()
        players_saved = 0
        teams_saved = 0
        
        for player in data:
            try:
                cursor.execute('''
                INSERT OR IGNORE INTO games (
                    player_id, player_name, player_name_short, position, position_sort,
                    game_id, team_id, minutes, points, fg_made, fg_attempted, fg_percentage,
                    three_pt_made, three_pt_attempted, three_pt_percentage,
                    ft_made, ft_attempted, ft_percentage,
                    offensive_rebounds, defensive_rebounds, total_rebounds,
                    assists, steals, blocks, turnovers, personal_fouls,
                    technical_fouls, ejected, ortg, usg, url, player_rating, scraped_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    player.get('playerID'),
                    player.get('nameLong'),
                    player.get('nameShort'),
                    player.get('position'),
                    player.get('positionSort', 0),
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
                    None,  # player_rating
                    datetime.now()
                ))
                
                if cursor.rowcount > 0:
                    players_saved += 1
                
                games_processed.add(player.get('game_id'))
                
            except Exception as e:
                print(f"Error inserting player data: {e}")
        
        for team_totals in team_totals_data:
            try:
                cursor.execute('''
                INSERT OR IGNORE INTO team_stats (
                    game_id, team_id, minutes, points, fg_made, fg_attempted, fg_percentage,
                    three_pt_made, three_pt_attempted, three_pt_percentage,
                    ft_made, ft_attempted, ft_percentage,
                    offensive_rebounds, defensive_rebounds, total_rebounds,
                    assists, steals, blocks, turnovers, personal_fouls,
                    technical_fouls, ejected, ortg, usg, scraped_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    team_totals['game_id'],
                    team_totals['team_id'],
                    team_totals['minutes'],
                    team_totals['points'],
                    team_totals['fg_made'],
                    team_totals['fg_attempted'],
                    team_totals.get('fg_percentage', 0),
                    team_totals['three_pt_made'],
                    team_totals['three_pt_attempted'],
                    team_totals.get('three_pt_percentage', 0),
                    team_totals['ft_made'],
                    team_totals['ft_attempted'],
                    team_totals.get('ft_percentage', 0),
                    team_totals['offensive_rebounds'],
                    team_totals['defensive_rebounds'],
                    team_totals['total_rebounds'],
                    team_totals['assists'],
                    team_totals['steals'],
                    team_totals['blocks'],
                    team_totals['turnovers'],
                    team_totals['personal_fouls'],
                    team_totals['technical_fouls'],
                    team_totals['ejected'],
                    team_totals['ortg'],
                    team_totals['usg'],
                    team_totals['scraped_timestamp']
                ))
                
                if cursor.rowcount > 0:
                    teams_saved += 1
                    
            except Exception as e:
                print(f"Error inserting team totals: {e}")
        
        for game_id in games_processed:
            try:
                game_date = self.extract_game_date_from_url(game_id)
                
                cursor.execute('''
                INSERT OR REPLACE INTO game_info (game_id, game_date, scraped_timestamp, teams_found)
                VALUES (?, ?, ?, ?)
                ''', (game_id, game_date, datetime.now(), len([p for p in data if p.get('game_id') == game_id])))
            except Exception as e:
                print(f"Error updating game info: {e}")
        
        conn.commit()
        conn.close()
        print(f"Saved {players_saved} new player records and {teams_saved} team totals to database")
    
    def scrape_games_range(self, start_game_id: int, end_game_id: int, team_ids: List[int], delay: float = 1.0):
        """Scrape data for a range of game IDs"""
        all_player_data = []
        all_team_totals = []
        
        game_ids = list(range(start_game_id, end_game_id - 1, -1))
        total_games = len(game_ids)
        
        print(f"Starting scrape of {total_games} games...")
        
        for i, game_id in enumerate(game_ids, 1):
            print(f"Processing game {i}/{total_games} (ID: {game_id})...")
            
            game_has_data = False
            
            for team_id in team_ids:
                print(f"  Fetching team {team_id}...")
                
                team_data = self.get_team_data(game_id, team_id)
                
                if team_data:
                    game_has_data = True
                    processed_data = self.process_player_data(team_data, game_id, team_id)
                    all_player_data.extend(processed_data)
                    
                    team_totals = self.extract_team_totals(team_data, game_id, team_id)
                    if team_totals:
                        all_team_totals.append(team_totals)
                    
                    print(f"    Found {len(processed_data)} players and team totals for team {team_id}")
                else:
                    print(f"    No data found for team {team_id}")
                
                time.sleep(delay)
            
            if not game_has_data:
                print(f"  No data found for game {game_id}")
        
        return all_player_data, all_team_totals

# Example usage
def main():
    scraper = RotowireScraper(db_name="games.db")
    
    # Define team abbreviations to scrape schedules for
    nba_teams = ['GSW', 'LAL', 'BOS', 'CHI', 'MIA', 'MIN', 'PHI', 'MIL', 'DEN', 'PHX']
    
    # Scrape team schedules
    print("=== SCRAPING TEAM SCHEDULES ===")
    scraper.scrape_all_team_schedules(nba_teams)
    
    # Show sample schedule data
    conn = sqlite3.connect("games.db")
    print("\nSample schedule data:")
    schedule_sample = pd.read_sql_query(
        "SELECT team_abbreviation, game_date, home_away, opponent_short, game_id, team_record, did_win FROM team_schedule LIMIT 10", 
        conn
    )
    print(schedule_sample)
    
    # Continue with your existing box score scraping
    print("\n=== SCRAPING BOX SCORES ===")
    common_team_ids = list(range(1, 29)) + [5312]
    
    start_game_id = start
    end_game_id = end
    
    print(f"Scraping games from {start_game_id} to {end_game_id}...")
    player_data, team_totals = scraper.scrape_games_range(start_game_id, end_game_id, common_team_ids, delay=0.5)
    
    if player_data or team_totals:
        scraper.save_to_database(player_data, team_totals)
        print(f"Scraped {len(player_data)} player records and {len(team_totals)} team totals")
        
        # Show sample of all tables
        print("\nSample player data:")
        player_sample = pd.read_sql_query(
            "SELECT player_name, position, points, total_rebounds, assists FROM games LIMIT 5", 
            conn
        )
        print(player_sample)
        
        print("\nSample team totals:")
        team_sample = pd.read_sql_query("SELECT game_id, team_id, points FROM team_stats LIMIT 5", conn)
        print(team_sample)
        
        print("\nSample game info:")
        game_info_sample = pd.read_sql_query("SELECT game_id, game_date FROM game_info LIMIT 5", conn)
        print(game_info_sample)
        
    else:
        print("No box score data was scraped")
    
    conn.close()

if __name__ == "__main__":
    main()