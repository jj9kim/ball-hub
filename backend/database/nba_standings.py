import requests
import json
import pandas as pd
from typing import Dict, List
import sqlite3
from datetime import datetime

class RotowireStandingsScraper:
    def __init__(self, db_name: str = "nba_standings.db"):
        self.base_url = "https://www.rotowire.com/basketball/ajax/standings-page-data.php"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.rotowire.com/basketball/standings.php',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Requested-With': 'XMLHttpRequest'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.db_name = db_name
        self.setup_database()
    
    def setup_database(self):
        """Set up SQLite database for standings data"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Create basic standings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS basic_standings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            team_short TEXT,
            conference TEXT,
            division TEXT,
            wins INTEGER,
            losses INTEGER,
            win_percentage REAL,
            points_for_per_game REAL,
            points_against_per_game REAL,
            point_differential REAL,
            home_record TEXT,
            away_record TEXT,
            conference_record TEXT,
            division_record TEXT,
            last_ten_record TEXT,
            streak TEXT,
            scraped_timestamp DATETIME,
            UNIQUE(team_name, scraped_timestamp)
        )
        ''')
        
        # Create conference standings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS conference_standings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            team_short TEXT,
            conference TEXT,
            conference_seed INTEGER,
            wins INTEGER,
            losses INTEGER,
            win_percentage REAL,
            games_back REAL,
            conference_games_back REAL,
            conference_record TEXT,
            conference_win_percentage REAL,
            division_record TEXT,
            division_win_percentage REAL,
            point_differential REAL,
            clinched_playoffs BOOLEAN,
            clinched_division BOOLEAN,
            clinched_conference BOOLEAN,
            eliminated_from_playoffs BOOLEAN,
            scraped_timestamp DATETIME,
            UNIQUE(team_name, scraped_timestamp)
        )
        ''')
        
        # Create advanced splits table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS advanced_splits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            team_short TEXT,
            wins INTEGER,
            losses INTEGER,
            win_percentage REAL,
            home_record TEXT,
            away_record TEXT,
            conference_record TEXT,
            conference_win_percentage REAL,
            division_record TEXT,
            division_win_percentage REAL,
            close_record TEXT,
            blowout_record TEXT,
            low_scoring_record TEXT,
            overtime_record TEXT,
            scraped_timestamp DATETIME,
            UNIQUE(team_name, scraped_timestamp)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def scrape_standings(self, season: int = 2024) -> Dict:
        """Scrape NBA standings data from Rotowire"""
        params = {'season': season}
        
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            print(f"Successfully scraped standings data for season {season}")
            return data
            
        except requests.RequestException as e:
            print(f"Error fetching standings data: {e}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON data: {e}")
            return {}
    
    def process_basic_standings(self, data: Dict) -> List[Dict]:
        """Process basic standings data"""
        basic_standings = []
        
        if 'basicStandings' not in data:
            return basic_standings
        
        conferences = data['basicStandings'].get('conferences', [])
        
        for conference in conferences:
            conference_name = conference.get('name', '')
            divisions = conference.get('divisions', [])
            
            for division in divisions:
                division_name = division.get('name', '')
                teams = division.get('teams', [])
                
                for team in teams:
                    team_data = {
                        'team_name': team.get('teamName', ''),
                        'team_short': team.get('teamNameShort', ''),
                        'conference': conference_name,
                        'division': division_name,
                        'wins': int(team.get('wins', 0)),
                        'losses': int(team.get('losses', 0)),
                        'win_percentage': float(team.get('winPercentage', 0)),
                        'points_for_per_game': float(team.get('pointsForPerGame', 0)),
                        'points_against_per_game': float(team.get('pointsAgainstPerGame', 0)),
                        'point_differential': float(team.get('pointDifferential', 0)),
                        'home_record': team.get('homeRecord', ''),
                        'away_record': team.get('awayRecord', ''),
                        'conference_record': team.get('conferenceRecord', ''),
                        'division_record': team.get('divisionRecord', ''),
                        'last_ten_record': team.get('lastTenRecord', ''),
                        'streak': team.get('streak', ''),
                        'scraped_timestamp': datetime.now()
                    }
                    basic_standings.append(team_data)
        
        return basic_standings
    
    def process_conference_standings(self, data: Dict) -> List[Dict]:
        """Process conference standings data"""
        conference_standings = []
        
        if 'conferenceStandings' not in data:
            return conference_standings
        
        conferences = data['conferenceStandings'].get('conferences', [])
        
        for conference in conferences:
            conference_name = conference.get('name', '')
            teams = conference.get('teams', [])
            
            for team in teams:
                team_data = {
                    'team_name': team.get('teamName', ''),
                    'team_short': team.get('teamNameShort', ''),
                    'conference': conference_name,
                    'conference_seed': int(team.get('conferenceSeed', 0)),
                    'wins': int(team.get('wins', 0)),
                    'losses': int(team.get('losses', 0)),
                    'win_percentage': float(team.get('winPercentage', 0)),
                    'games_back': float(team.get('gamesBack', 0)),
                    'conference_games_back': float(team.get('conferenceGamesBack', 0)),
                    'conference_record': team.get('conferenceRecord', ''),
                    'conference_win_percentage': float(team.get('conferenceWinPercentage', 0)),
                    'division_record': team.get('divisionRecord', ''),
                    'division_win_percentage': float(team.get('divisionWinPercentage', 0)),
                    'point_differential': float(team.get('pointDifferential', 0)),
                    'clinched_playoffs': bool(int(team.get('clinchedPlayoffs', 0))),
                    'clinched_division': bool(int(team.get('clinchedDivision', 0))),
                    'clinched_conference': bool(int(team.get('clinchedConference', 0))),
                    'eliminated_from_playoffs': bool(int(team.get('eliminatedFromPlayoffs', 0))),
                    'scraped_timestamp': datetime.now()
                }
                conference_standings.append(team_data)
        
        return conference_standings
    
    def process_advanced_splits(self, data: Dict) -> List[Dict]:
        """Process advanced splits data"""
        advanced_splits = []
        
        if 'advancedSplits' not in data:
            return advanced_splits
        
        teams = data['advancedSplits'].get('teams', [])
        
        for team in teams:
            team_data = {
                'team_name': team.get('teamName', ''),
                'team_short': team.get('teamNameShort', ''),
                'wins': int(team.get('wins', 0)),
                'losses': int(team.get('losses', 0)),
                'win_percentage': float(team.get('winPercentage', 0)),
                'home_record': team.get('homeRecord', ''),
                'away_record': team.get('awayRecord', ''),
                'conference_record': team.get('conferenceRecord', ''),
                'conference_win_percentage': float(team.get('conferenceWinPercentage', 0)),
                'division_record': team.get('divisionRecord', ''),
                'division_win_percentage': float(team.get('divisionWinPercentage', 0)),
                'close_record': team.get('closeRecord', ''),
                'blowout_record': team.get('blowoutRecord', ''),
                'low_scoring_record': team.get('lowScoringRecord', ''),
                'overtime_record': team.get('overtimeRecord', ''),
                'scraped_timestamp': datetime.now()
            }
            advanced_splits.append(team_data)
        
        return advanced_splits
    
    def save_to_database(self, basic_standings: List[Dict], conference_standings: List[Dict], advanced_splits: List[Dict]):
        """Save all standings data to database"""
        conn = sqlite3.connect(self.db_name)
        
        # Save basic standings
        if basic_standings:
            basic_df = pd.DataFrame(basic_standings)
            basic_df.to_sql('basic_standings', conn, if_exists='append', index=False)
            print(f"Saved {len(basic_standings)} basic standings records")
        
        # Save conference standings
        if conference_standings:
            conference_df = pd.DataFrame(conference_standings)
            conference_df.to_sql('conference_standings', conn, if_exists='append', index=False)
            print(f"Saved {len(conference_standings)} conference standings records")
        
        # Save advanced splits
        if advanced_splits:
            advanced_df = pd.DataFrame(advanced_splits)
            advanced_df.to_sql('advanced_splits', conn, if_exists='append', index=False)
            print(f"Saved {len(advanced_splits)} advanced splits records")
        
        conn.close()
    
    def export_to_csv(self, basic_standings: List[Dict], conference_standings: List[Dict], advanced_splits: List[Dict]):
        """Export data to CSV files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if basic_standings:
            basic_df = pd.DataFrame(basic_standings)
            basic_df.to_csv(f'nba_basic_standings_{timestamp}.csv', index=False)
            print(f"Exported basic standings to nba_basic_standings_{timestamp}.csv")
        
        if conference_standings:
            conference_df = pd.DataFrame(conference_standings)
            conference_df.to_csv(f'nba_conference_standings_{timestamp}.csv', index=False)
            print(f"Exported conference standings to nba_conference_standings_{timestamp}.csv")
        
        if advanced_splits:
            advanced_df = pd.DataFrame(advanced_splits)
            advanced_df.to_csv(f'nba_advanced_splits_{timestamp}.csv', index=False)
            print(f"Exported advanced splits to nba_advanced_splits_{timestamp}.csv")
    
    def run_scraper(self, season: int = 2024, export_csv: bool = True):
        """Run the complete scraping process"""
        print(f"Starting NBA standings scraper for season {season}...")
        
        # Scrape the data
        raw_data = self.scrape_standings(season)
        
        if not raw_data:
            print("No data was scraped. Exiting.")
            return
        
        # Process the data
        basic_standings = self.process_basic_standings(raw_data)
        conference_standings = self.process_conference_standings(raw_data)
        advanced_splits = self.process_advanced_splits(raw_data)
        
        print(f"Processed {len(basic_standings)} basic standings")
        print(f"Processed {len(conference_standings)} conference standings")
        print(f"Processed {len(advanced_splits)} advanced splits")
        
        # Save to database
        self.save_to_database(basic_standings, conference_standings, advanced_splits)
        
        # Export to CSV if requested
        if export_csv:
            self.export_to_csv(basic_standings, conference_standings, advanced_splits)
        
        print("Scraping completed successfully!")

# Example usage
def main():
    scraper = RotowireStandingsScraper()
    
    # Scrape current season (2024)
    scraper.run_scraper(season=2024, export_csv=True)
    
    # Show sample data
    conn = sqlite3.connect("nba_standings.db")
    
    print("\nSample basic standings:")
    basic_sample = pd.read_sql_query(
        "SELECT team_name, conference, division, wins, losses, win_percentage FROM basic_standings ORDER BY win_percentage DESC LIMIT 10", 
        conn
    )
    print(basic_sample)
    
    print("\nSample conference standings:")
    conference_sample = pd.read_sql_query(
        "SELECT team_name, conference, conference_seed, wins, losses FROM conference_standings ORDER BY conference, conference_seed LIMIT 10", 
        conn
    )
    print(conference_sample)
    
    print("\nSample advanced splits:")
    advanced_sample = pd.read_sql_query(
        "SELECT team_name, home_record, away_record, close_record FROM advanced_splits LIMIT 10", 
        conn
    )
    print(advanced_sample)
    
    conn.close()

if __name__ == "__main__":
    main()