import requests
import sqlite3
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

class TeamRosterScraper:
    def __init__(self, db_name: str = "team_stats.db"):
        self.base_url = "https://www.rotowire.com/basketball/ajax/team-page-roster-data.php"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.rotowire.com/basketball/teams.php',
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
        """Set up the SQLite database for team roster data"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Team roster bio table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_roster_bio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_code TEXT,
            player_id INTEGER,
            player_url TEXT,
            name_long TEXT,
            name_short TEXT,
            position TEXT,
            jersey TEXT,
            height_inches INTEGER,
            height TEXT,
            weight TEXT,
            draft TEXT,
            school TEXT,
            age INTEGER,
            scraped_timestamp DATETIME,
            UNIQUE(team_code, player_id)
        )
        ''')
        
        # Team roster totals table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_roster_totals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_code TEXT,
            player_id INTEGER,
            player_url TEXT,
            name_long TEXT,
            name_short TEXT,
            position TEXT,
            games INTEGER,
            minutes INTEGER,
            field_goals_pct REAL,
            three_pointers_pct REAL,
            free_throws_pct REAL,
            steals INTEGER,
            turnovers INTEGER,
            offensive_rebounds INTEGER,
            defensive_rebounds INTEGER,
            total_rebounds INTEGER,
            assists INTEGER,
            blocks INTEGER,
            fouls INTEGER,
            points INTEGER,
            fg_made INTEGER,
            fg_attempted INTEGER,
            three_pt_made INTEGER,
            three_pt_attempted INTEGER,
            ft_made INTEGER,
            ft_attempted INTEGER,
            scraped_timestamp DATETIME,
            UNIQUE(team_code, player_id)
        )
        ''')
        
        # Team roster per game table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_roster_per_game (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_code TEXT,
            player_id INTEGER,
            player_url TEXT,
            name_long TEXT,
            name_short TEXT,
            position TEXT,
            games INTEGER,
            minutes REAL,
            points REAL,
            rebounds REAL,
            assists REAL,
            steals REAL,
            blocks REAL,
            three_point_made REAL,
            turnovers REAL,
            fouls REAL,
            scraped_timestamp DATETIME,
            UNIQUE(team_code, player_id)
        )
        ''')
        
        # Team roster other stats table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_roster_other (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_code TEXT,
            player_id INTEGER,
            player_url TEXT,
            name_long TEXT,
            name_short TEXT,
            position TEXT,
            games_started INTEGER,
            ejected INTEGER,
            high_points INTEGER,
            triple_double INTEGER,
            double_double INTEGER,
            plus_minus INTEGER,
            scraped_timestamp DATETIME,
            UNIQUE(team_code, player_id)
        )
        ''')
        
        # Team scraping log table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_scraping_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_code TEXT,
            success BOOLEAN,
            error_message TEXT,
            scraped_timestamp DATETIME,
            UNIQUE(team_code)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_team_data(self, team_code: str) -> Optional[Dict]:
        """Get team roster data"""
        params = {
            'team': team_code
        }
    
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data and isinstance(data, dict):
                return data
            return None
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for team {team_code}: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON for team {team_code}: {e}")
            return None
    
    def process_bio_data(self, data: List[Dict], team_code: str) -> List[Dict]:
        """Process bio data from team roster"""
        bio_data = []
        
        for player in data:
            bio = {
                'team_code': team_code,
                'player_id': self._to_int(player.get('playerID')),
                'player_url': player.get('playerURL', ''),
                'name_long': player.get('nameLong', ''),
                'name_short': player.get('nameShort', ''),
                'position': player.get('position', ''),
                'jersey': player.get('jersey', ''),
                'height_inches': self._to_int(player.get('heightInches')),
                'height': player.get('height', ''),
                'weight': player.get('weight', ''),
                'draft': player.get('draft', ''),
                'school': player.get('school', ''),
                'age': self._to_int(player.get('age')),
                'scraped_timestamp': datetime.now()
            }
            bio_data.append(bio)
        
        return bio_data
    
    def process_totals_data(self, data: List[Dict], team_code: str) -> List[Dict]:
        """Process totals data from team roster"""
        totals_data = []
        
        for player in data:
            totals = {
                'team_code': team_code,
                'player_id': self._to_int(player.get('playerID')),
                'player_url': player.get('playerURL', ''),
                'name_long': player.get('nameLong', ''),
                'name_short': player.get('nameShort', ''),
                'position': player.get('position', ''),
                'games': self._to_int(player.get('games')),
                'minutes': self._to_int(player.get('minutes')),
                'field_goals_pct': self._to_float(player.get('fieldGoals')),
                'three_pointers_pct': self._to_float(player.get('threePointers')),
                'free_throws_pct': self._to_float(player.get('freeThrows')),
                'steals': self._to_int(player.get('steals')),
                'turnovers': self._to_int(player.get('turnovers')),
                'offensive_rebounds': self._to_int(player.get('oreb')),
                'defensive_rebounds': self._to_int(player.get('dreb')),
                'total_rebounds': self._to_int(player.get('treb')),
                'assists': self._to_int(player.get('assists')),
                'blocks': self._to_int(player.get('blocks')),
                'fouls': self._to_int(player.get('fouls')),
                'points': self._to_int(player.get('points')),
                'fg_made': self._to_int(player.get('fgMade')),
                'fg_attempted': self._to_int(player.get('fgAtt')),
                'three_pt_made': self._to_int(player.get('3ptMade')),
                'three_pt_attempted': self._to_int(player.get('3ptAtt')),
                'ft_made': self._to_int(player.get('ftMade')),
                'ft_attempted': self._to_int(player.get('ftAtt')),
                'scraped_timestamp': datetime.now()
            }
            totals_data.append(totals)
        
        return totals_data
    
    def process_per_game_data(self, data: List[Dict], team_code: str) -> List[Dict]:
        """Process per game data from team roster"""
        per_game_data = []
        
        for player in data:
            per_game = {
                'team_code': team_code,
                'player_id': self._to_int(player.get('playerID')),
                'player_url': player.get('playerURL', ''),
                'name_long': player.get('nameLong', ''),
                'name_short': player.get('nameShort', ''),
                'position': player.get('position', ''),
                'games': self._to_int(player.get('games')),
                'minutes': self._to_float(player.get('minutes')),
                'points': self._to_float(player.get('points')),
                'rebounds': self._to_float(player.get('rebounds')),
                'assists': self._to_float(player.get('assists')),
                'steals': self._to_float(player.get('steals')),
                'blocks': self._to_float(player.get('blocks')),
                'three_point_made': self._to_float(player.get('threepointmade')),
                'turnovers': self._to_float(player.get('turnovers')),
                'fouls': self._to_float(player.get('fouls')),
                'scraped_timestamp': datetime.now()
            }
            per_game_data.append(per_game)
        
        return per_game_data
    
    def process_other_data(self, data: List[Dict], team_code: str) -> List[Dict]:
        """Process other data from team roster"""
        other_data = []
        
        for player in data:
            other = {
                'team_code': team_code,
                'player_id': self._to_int(player.get('playerID')),
                'player_url': player.get('playerURL', ''),
                'name_long': player.get('nameLong', ''),
                'name_short': player.get('nameShort', ''),
                'position': player.get('position', ''),
                'games_started': self._to_int(player.get('gs')),
                'ejected': self._to_int(player.get('ejected')),
                'high_points': self._to_int(player.get('points')),
                'triple_double': self._to_int(player.get('tripleDouble')),
                'double_double': self._to_int(player.get('doubleDouble')),
                'plus_minus': self._to_int(player.get('plusMinus')),
                'scraped_timestamp': datetime.now()
            }
            other_data.append(other)
        
        return other_data
    
    def _to_int(self, value):
        """Convert value to integer"""
        if not value or value in ['', '-', 'DNP']:
            return None
        try:
            if isinstance(value, str):
                value = value.replace(',', '')
            return int(float(value))
        except (ValueError, TypeError):
            return None
    
    def _to_float(self, value):
        """Convert value to float"""
        if not value or value in ['', '-', 'DNP']:
            return None
        try:
            if isinstance(value, str) and '%' in value:
                value = value.replace('%', '')
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def save_to_database(self, team_code: str, bio_data: List[Dict], 
                        totals_data: List[Dict], per_game_data: List[Dict], 
                        other_data: List[Dict]):
        """Save all team roster data to database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Save bio data
        for bio in bio_data:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO team_roster_bio 
                (team_code, player_id, player_url, name_long, name_short, position, jersey, 
                 height_inches, height, weight, draft, school, age, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    bio['team_code'], bio['player_id'], bio['player_url'], bio['name_long'], 
                    bio['name_short'], bio['position'], bio['jersey'], bio['height_inches'], 
                    bio['height'], bio['weight'], bio['draft'], bio['school'], bio['age'], 
                    bio['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving bio data for player {bio['player_id']}: {e}")
        
        # Save totals data
        for totals in totals_data:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO team_roster_totals 
                (team_code, player_id, player_url, name_long, name_short, position, games, 
                 minutes, field_goals_pct, three_pointers_pct, free_throws_pct, steals, 
                 turnovers, offensive_rebounds, defensive_rebounds, total_rebounds, assists, 
                 blocks, fouls, points, fg_made, fg_attempted, three_pt_made, three_pt_attempted, 
                 ft_made, ft_attempted, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    totals['team_code'], totals['player_id'], totals['player_url'], 
                    totals['name_long'], totals['name_short'], totals['position'], 
                    totals['games'], totals['minutes'], totals['field_goals_pct'], 
                    totals['three_pointers_pct'], totals['free_throws_pct'], totals['steals'], 
                    totals['turnovers'], totals['offensive_rebounds'], totals['defensive_rebounds'], 
                    totals['total_rebounds'], totals['assists'], totals['blocks'], totals['fouls'], 
                    totals['points'], totals['fg_made'], totals['fg_attempted'], 
                    totals['three_pt_made'], totals['three_pt_attempted'], totals['ft_made'], 
                    totals['ft_attempted'], totals['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving totals data for player {totals['player_id']}: {e}")
        
        # Save per game data
        for per_game in per_game_data:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO team_roster_per_game 
                (team_code, player_id, player_url, name_long, name_short, position, games, 
                 minutes, points, rebounds, assists, steals, blocks, three_point_made, 
                 turnovers, fouls, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    per_game['team_code'], per_game['player_id'], per_game['player_url'], 
                    per_game['name_long'], per_game['name_short'], per_game['position'], 
                    per_game['games'], per_game['minutes'], per_game['points'], 
                    per_game['rebounds'], per_game['assists'], per_game['steals'], 
                    per_game['blocks'], per_game['three_point_made'], per_game['turnovers'], 
                    per_game['fouls'], per_game['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving per game data for player {per_game['player_id']}: {e}")
        
        # Save other data
        for other in other_data:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO team_roster_other 
                (team_code, player_id, player_url, name_long, name_short, position, 
                 games_started, ejected, high_points, triple_double, double_double, 
                 plus_minus, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    other['team_code'], other['player_id'], other['player_url'], 
                    other['name_long'], other['name_short'], other['position'], 
                    other['games_started'], other['ejected'], other['high_points'], 
                    other['triple_double'], other['double_double'], other['plus_minus'], 
                    other['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving other data for player {other['player_id']}: {e}")
        
        conn.commit()
        conn.close()
    
    def log_scraping_attempt(self, team_code: str, success: bool, error_message: str = ""):
        """Log scraping attempts to track progress"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO team_scraping_log 
        (team_code, success, error_message, scraped_timestamp)
        VALUES (?, ?, ?, ?)
        ''', (team_code, success, error_message, datetime.now()))
        
        conn.commit()
        conn.close()
    
    def scrape_team_roster(self, team_code: str):
        """Scrape a team's roster data"""
        print(f"Attempting to scrape team {team_code} roster...")
        
        data = self.get_team_data(team_code)
        if not data:
            print(f"No data found for team {team_code}")
            self.log_scraping_attempt(team_code, False, "No data returned from API")
            return
        
        try:
            # Process all data types
            bio_data = self.process_bio_data(data.get('bio', []), team_code)
            totals_data = self.process_totals_data(data.get('totals', []), team_code)
            per_game_data = self.process_per_game_data(data.get('perGame', []), team_code)
            other_data = self.process_other_data(data.get('other', []), team_code)
            
            # Save to database
            self.save_to_database(team_code, bio_data, totals_data, per_game_data, other_data)
            
            print(f"Successfully scraped team {team_code} roster. "
                  f"Players: {len(bio_data)}")
            
            self.log_scraping_attempt(team_code, True, "")
            
        except Exception as e:
            error_msg = f"Error processing data for team {team_code}: {str(e)}"
            print(error_msg)
            self.log_scraping_attempt(team_code, False, error_msg)
    
    def scrape_all_teams(self, delay: float = 1.0):
        """Scrape all NBA teams"""
        nba_teams = [
            'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
            'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
            'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'
        ]
        
        print(f"Starting to scrape {len(nba_teams)} NBA teams")
        
        for i, team_code in enumerate(nba_teams, 1):
            print(f"Processing team {i}/{len(nba_teams)} ({team_code})")
            
            # Check if we've already processed this team
            conn = sqlite3.connect(self.db_name)
            cursor = conn.cursor()
            cursor.execute("SELECT success FROM team_scraping_log WHERE team_code = ?", (team_code,))
            result = cursor.fetchone()
            conn.close()
            
            if result:
                print(f"Team {team_code} already processed, skipping...")
                continue
            
            self.scrape_team_roster(team_code)
            time.sleep(delay)
        
        print("Finished scraping all teams")

# Example usage
def main():
    scraper = TeamRosterScraper(db_name="team_stats.db")
    
    # Scrape all NBA teams
    scraper.scrape_all_teams(delay=1.0)

if __name__ == "__main__":
    main()