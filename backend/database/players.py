import requests
import pandas as pd
import sqlite3
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

class PlayerStatsScraper:
    def __init__(self, db_name: str = "player_stats.db"):
        self.base_url = "https://www.rotowire.com/basketball/ajax/player-page-data.php"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-CA,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.rotowire.com/basketball/player/',
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
        """Set up the SQLite database for player statistics"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Player basic info table (simplified as requested)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            player_id INTEGER PRIMARY KEY,
            team TEXT,
            current_age INTEGER,
            scraped_timestamp DATETIME,
            UNIQUE(player_id)
        )
        ''')
        
        # Season statistics table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_season_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            season TEXT,
            age INTEGER,
            team TEXT,
            games INTEGER,
            minutes REAL,
            points REAL,
            rebounds REAL,
            assists REAL,
            steals REAL,
            blocks REAL,
            three_point_made REAL,
            fg_percentage REAL,
            ft_percentage REAL,
            turnovers REAL,
            offensive_rebounds REAL,
            defensive_rebounds REAL,
            three_point_attempted REAL,
            three_point_percentage REAL,
            fg_made REAL,
            fg_attempted REAL,
            ft_made REAL,
            ft_attempted REAL,
            three_point_made_total INTEGER,
            three_point_attempted_total INTEGER,
            fg_made_total INTEGER,
            fg_attempted_total INTEGER,
            ft_made_total INTEGER,
            ft_attempted_total INTEGER,
            stat_type TEXT,
            scraped_timestamp DATETIME
        )
        ''')
        
        # Game logs table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_game_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            game_id INTEGER,
            date TEXT,
            full_date TEXT,
            game_date DATETIME,
            opponent TEXT,
            home_away TEXT,
            score TEXT,
            minutes INTEGER,
            points INTEGER,
            rebounds INTEGER,
            assists INTEGER,
            steals INTEGER,
            blocks INTEGER,
            turnovers INTEGER,
            fg_made INTEGER,
            fg_attempted INTEGER,
            ft_made INTEGER,
            ft_attempted INTEGER,
            three_point_made INTEGER,
            three_point_attempted INTEGER,
            offensive_rebounds INTEGER,
            defensive_rebounds INTEGER,
            fouls INTEGER,
            played_game BOOLEAN,
            scraped_timestamp DATETIME,
            UNIQUE(player_id, game_id)
        )
        ''')
        
        # Advanced statistics table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_advanced_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            season TEXT,
            team TEXT,
            games INTEGER,
            mpg REAL,
            true_shooting REAL,
            efg REAL,
            assist_ratio REAL,
            turnover_ratio REAL,
            ast_to_ratio REAL,
            efficiency REAL,
            scraped_timestamp DATETIME,
            UNIQUE(player_id, season)
        )
        ''')
        
        # NBA Ratings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            season TEXT,
            team TEXT,
            pts_rating REAL,
            reb_rating REAL,
            ast_rating REAL,
            stl_rating REAL,
            blk_rating REAL,
            pt3m_rating REAL,
            fgpct_rating REAL,
            ftpct_rating REAL,
            overall_rating REAL,
            rank INTEGER,
            rating_type TEXT,
            scraped_timestamp DATETIME,
            UNIQUE(player_id, season, rating_type)
        )
        ''')
        
        # Splits table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_splits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            split_type TEXT,
            split_category TEXT,
            games INTEGER,
            minutes REAL,
            points REAL,
            rebounds REAL,
            assists REAL,
            steals REAL,
            blocks REAL,
            three_point_made REAL,
            fg_percentage REAL,
            ft_percentage REAL,
            turnovers REAL,
            offensive_rebounds REAL,
            defensive_rebounds REAL,
            three_point_attempted REAL,
            three_point_percentage REAL,
            fg_made REAL,
            fg_attempted REAL,
            ft_made REAL,
            ft_attempted REAL,
            scraped_timestamp DATETIME,
            UNIQUE(player_id, split_type, split_category)
        )
        ''')
        
        # Scraping log table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS scraping_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            team TEXT,
            success BOOLEAN,
            error_message TEXT,
            scraped_timestamp DATETIME,
            UNIQUE(player_id)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_player_data(self, player_id: int) -> Optional[Dict]:
        """Get comprehensive player data"""
        # First try without specifying team
        params = {
            'id': player_id,
            'nba': 'true'
        }
    
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
        
            # Check if we have valid player data with the expected structure
            if data and isinstance(data, dict) and 'basic' in data:
                return data
        
            # If no data, try with a common team parameter
            params['team'] = 'GSW'
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
        
            if data and isinstance(data, dict) and 'basic' in data:
                return data
            
            return None
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for player {player_id}: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON for player {player_id}: {e}")
            return None
        
    def debug_player_info(self, player_id: int):
        """Debug method to help identify extraction issues"""
        data = self.get_player_data(player_id)
        if not data:
            print(f"No data for player {player_id}")
            return
    
        print(f"=== Debug info for player {player_id} ===")
    
        # Check basic stats for team info
        if 'basic' in data and 'nba' in data['basic'] and 'body' in data['basic']['nba']:
            seasons = data['basic']['nba']['body']
            nba_seasons = [s for s in seasons if s.get('team') not in ['CBB', '']]
            print(f"NBA seasons found: {len(nba_seasons)}")
            for season in nba_seasons:
                print(f"  Season: {season.get('season')}, Team: {season.get('team')}, Age: {season.get('age')}")
    
        # Test the extraction
        player_info = self.extract_player_info_from_data(data, player_id)
        print(f"Extracted info: {player_info}")
    
    def extract_player_info_from_data(self, data: Dict, player_id: int) -> Dict:
        """Extract player information from the API response"""
        player_info = {
            'player_id': player_id,
            'team': '',
            'current_age': None,
        }
    
        # Get team and age from the most recent NBA season
        if 'basic' in data and 'nba' in data['basic'] and 'body' in data['basic']['nba']:
            seasons = data['basic']['nba']['body']
            nba_seasons = [s for s in seasons if s.get('team') not in ['CBB', '']]
        
            # Get the MOST RECENT NBA season (last one in the list)
            if nba_seasons:
                most_recent_season = nba_seasons[-1]
                player_info['team'] = most_recent_season.get('team', '')
            
                # Extract age if available
                age_str = most_recent_season.get('age', '')
                if age_str and age_str.isdigit():
                    player_info['current_age'] = int(age_str)
    
        return player_info
    
    def is_nba_player(self, data: Dict) -> bool:
        """Check if the player has NBA seasons"""
        if not data or 'basic' not in data or 'nba' not in data['basic']:
            return False
        
        seasons = data['basic']['nba']['body']
        nba_seasons = [s for s in seasons if s.get('team') not in ['CBB', '']]
        return len(nba_seasons) > 0
    
    def process_season_stats(self, data: Dict, player_id: int, stat_type: str) -> List[Dict]:
        """Process season statistics"""
        stats_data = []
        source_key = ''
        
        if stat_type == 'per_game':
            source_key = 'basic'
        elif stat_type == 'total':
            source_key = 'basicTotal'
        elif stat_type == 'per_36':
            source_key = 'basicPer36'
        else:
            return stats_data
        
        if source_key in data and 'nba' in data[source_key] and 'body' in data[source_key]['nba']:
            for season in data[source_key]['nba']['body']:
                if season.get('team') == 'CBB':
                    continue
                    
                season_str = season.get('season', '').replace('&ndash;', '-')
                
                stats = {
                    'player_id': player_id,
                    'season': season_str,
                    'age': int(season.get('age')) if season.get('age') and season.get('age').isdigit() else None,
                    'team': season.get('team', ''),
                    'games': self._to_int(season.get('games')),
                    'minutes': self._to_float(season.get('minutes')),
                    'points': self._to_float(season.get('pts')),
                    'rebounds': self._to_float(season.get('reb')),
                    'assists': self._to_float(season.get('ast')),
                    'steals': self._to_float(season.get('stl')),
                    'blocks': self._to_float(season.get('blk')),
                    'three_point_made': self._to_float(season.get('pt3m')),
                    'fg_percentage': self._to_float(season.get('fgpct')),
                    'ft_percentage': self._to_float(season.get('ftpct')),
                    'turnovers': self._to_float(season.get('to')),
                    'offensive_rebounds': self._to_float(season.get('oreb')),
                    'defensive_rebounds': self._to_float(season.get('dreb')),
                    'three_point_attempted': self._to_float(season.get('pt3a')),
                    'three_point_percentage': self._to_float(season.get('pt3pct')),
                    'fg_made': self._to_float(season.get('fgm')),
                    'fg_attempted': self._to_float(season.get('fga')),
                    'ft_made': self._to_float(season.get('ftm')),
                    'ft_attempted': self._to_float(season.get('fta')),
                    'three_point_made_total': self._to_int(season.get('pt3mtotal')),
                    'three_point_attempted_total': self._to_int(season.get('pt3atotal')),
                    'fg_made_total': self._to_int(season.get('fgmtotal')),
                    'fg_attempted_total': self._to_int(season.get('fgatotal')),
                    'ft_made_total': self._to_int(season.get('ftmtotal')),
                    'ft_attempted_total': self._to_int(season.get('ftatotal')),
                    'stat_type': stat_type,
                    'scraped_timestamp': datetime.now()
                }
                stats_data.append(stats)
                
        return stats_data
    
    def process_game_logs(self, data: Dict, player_id: int) -> List[Dict]:
        """Process game log data"""
        game_logs = []
        
        for key in data.keys():
            if key.startswith('gl') and 'body' in data[key]:
                for game in data[key]['body']:
                    if game.get('min') == 'DNP' or not game.get('playerid'):
                        continue
                    
                    game_log = {
                        'player_id': player_id,
                        'game_id': self._to_int(game.get('gameid')),
                        'date': game.get('date', ''),
                        'full_date': game.get('fulldate', ''),
                        'game_date': game.get('gamedate', ''),
                        'opponent': game.get('opp', ''),
                        'home_away': 'Home' if game.get('home') in [True, 'true', '1'] else 'Away',
                        'score': game.get('score', ''),
                        'minutes': self._to_int(game.get('min')),
                        'points': self._to_int(game.get('pts')),
                        'rebounds': self._to_int(game.get('reb')),
                        'assists': self._to_int(game.get('ast')),
                        'steals': self._to_int(game.get('stl')),
                        'blocks': self._to_int(game.get('blk')),
                        'turnovers': self._to_int(game.get('to')),
                        'fg_made': self._to_int(game.get('fgm')),
                        'fg_attempted': self._to_int(game.get('fga')),
                        'ft_made': self._to_int(game.get('ftm')),
                        'ft_attempted': self._to_int(game.get('fta')),
                        'three_point_made': self._to_int(game.get('pt3fgm')),
                        'three_point_attempted': self._to_int(game.get('pt3fga')),
                        'offensive_rebounds': self._to_int(game.get('oreb')),
                        'defensive_rebounds': self._to_int(game.get('dreb')),
                        'fouls': self._to_int(game.get('fouls')),
                        'played_game': bool(game.get('playedgame')),
                        'scraped_timestamp': datetime.now()
                    }
                    game_logs.append(game_log)
        
        return game_logs
    
    def process_advanced_stats(self, data: Dict, player_id: int) -> List[Dict]:
        """Process advanced statistics"""
        advanced_stats = []
        
        if 'advanced' in data and 'nba' in data['advanced'] and 'body' in data['advanced']['nba']:
            for season in data['advanced']['nba']['body']:
                season_str = season.get('season', '').replace('&ndash;', '-')
                
                stats = {
                    'player_id': player_id,
                    'season': season_str,
                    'team': season.get('team', ''),
                    'games': self._to_int(season.get('games')),
                    'mpg': self._to_float(season.get('mpg')),
                    'true_shooting': self._to_float(season.get('trueshoot')),
                    'efg': self._to_float(season.get('efg')),
                    'assist_ratio': self._to_float(season.get('ar')),
                    'turnover_ratio': self._to_float(season.get('toratio')),
                    'ast_to_ratio': self._to_float(season.get('asttoratio')),
                    'efficiency': self._to_float(season.get('eff')),
                    'scraped_timestamp': datetime.now()
                }
                advanced_stats.append(stats)
        
        return advanced_stats
    
    def process_ratings(self, data: Dict, player_id: int, rating_type: str) -> List[Dict]:
        """Process NBA ratings"""
        ratings = []
        source_key = ''
        
        if rating_type == 'total':
            source_key = 'nbaRatings'
        elif rating_type == 'per_game':
            source_key = 'nbaRatingsPerGame'
        elif rating_type == 'per_36':
            source_key = 'nbaRatingsPer36'
        else:
            return ratings
        
        if source_key in data and 'nba' in data[source_key] and 'body' in data[source_key]['nba']:
            for rating in data[source_key]['nba']['body']:
                season_str = rating.get('season', '').replace('&ndash;', '-')
                
                rating_data = {
                    'player_id': player_id,
                    'season': season_str,
                    'team': rating.get('team', ''),
                    'pts_rating': self._to_float(rating.get('pts')),
                    'reb_rating': self._to_float(rating.get('reb')),
                    'ast_rating': self._to_float(rating.get('ast')),
                    'stl_rating': self._to_float(rating.get('stl')),
                    'blk_rating': self._to_float(rating.get('blk')),
                    'pt3m_rating': self._to_float(rating.get('pt3m')),
                    'fgpct_rating': self._to_float(rating.get('fgpct')),
                    'ftpct_rating': self._to_float(rating.get('ftpct')),
                    'overall_rating': self._to_float(rating.get('overall')),
                    'rank': self._to_int(rating.get('rank')),
                    'rating_type': rating_type,
                    'scraped_timestamp': datetime.now()
                }
                ratings.append(rating_data)
        
        return ratings
    
    def process_splits(self, data: Dict, player_id: int) -> List[Dict]:
        """Process player splits data"""
        splits_data = []
        split_types = {
            'splits': 'general',
            'splitsStarter': 'starter',
            'splitsMonth': 'month',
            'splitsRest': 'rest',
            'splitsOpp': 'opponent',
            'splitsResults': 'results'
        }
        
        for data_key, split_type in split_types.items():
            if data_key in data and 'nba' in data[data_key] and 'body' in data[data_key]['nba']:
                for split in data[data_key]['nba']['body']:
                    split_data = {
                        'player_id': player_id,
                        'split_type': split_type,
                        'split_category': split.get('season', ''),
                        'games': self._to_int(split.get('games')),
                        'minutes': self._to_float(split.get('minutes')),
                        'points': self._to_float(split.get('pts')),
                        'rebounds': self._to_float(split.get('reb')),
                        'assists': self._to_float(split.get('ast')),
                        'steals': self._to_float(split.get('stl')),
                        'blocks': self._to_float(split.get('blk')),
                        'three_point_made': self._to_float(split.get('pt3m')),
                        'fg_percentage': self._to_float(split.get('fgpct')),
                        'ft_percentage': self._to_float(split.get('ftpct')),
                        'turnovers': self._to_float(split.get('to')),
                        'offensive_rebounds': self._to_float(split.get('oreb')),
                        'defensive_rebounds': self._to_float(split.get('dreb')),
                        'three_point_attempted': self._to_float(split.get('pt3a')),
                        'three_point_percentage': self._to_float(split.get('pt3pct')),
                        'fg_made': self._to_float(split.get('fgm')),
                        'fg_attempted': self._to_float(split.get('fga')),
                        'ft_made': self._to_float(split.get('ftm')),
                        'ft_attempted': self._to_float(split.get('fta')),
                        'scraped_timestamp': datetime.now()
                    }
                    splits_data.append(split_data)
        
        return splits_data
    
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
    
    def save_to_database(self, player_info: Dict, season_stats: List[Dict], 
                        game_logs: List[Dict], advanced_stats: List[Dict], 
                        ratings: List[Dict], splits: List[Dict]):
        """Save all player data to database"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Save player info (simplified to match the new table structure)
        try:
            cursor.execute('''
            INSERT OR REPLACE INTO players 
            (player_id, team, current_age, scraped_timestamp)
            VALUES (?, ?, ?, ?)
            ''', (
                player_info['player_id'],
                player_info['team'],
                player_info['current_age'],
                datetime.now()
            ))
        except Exception as e:
            print(f"Error saving player info: {e}")
        
        # Save season stats
        for stats in season_stats:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO player_season_stats 
                (player_id, season, age, team, games, minutes, points, rebounds, assists, steals, blocks,
                 three_point_made, fg_percentage, ft_percentage, turnovers, offensive_rebounds, defensive_rebounds,
                 three_point_attempted, three_point_percentage, fg_made, fg_attempted, ft_made, ft_attempted,
                 three_point_made_total, three_point_attempted_total, fg_made_total, fg_attempted_total,
                 ft_made_total, ft_attempted_total, stat_type, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    stats['player_id'], stats['season'], stats['age'], stats['team'], stats['games'], 
                    stats['minutes'], stats['points'], stats['rebounds'], stats['assists'], stats['steals'], 
                    stats['blocks'], stats['three_point_made'], stats['fg_percentage'], stats['ft_percentage'], 
                    stats['turnovers'], stats['offensive_rebounds'], stats['defensive_rebounds'], 
                    stats['three_point_attempted'], stats['three_point_percentage'], stats['fg_made'], 
                    stats['fg_attempted'], stats['ft_made'], stats['ft_attempted'], stats['three_point_made_total'], 
                    stats['three_point_attempted'], stats['fg_made_total'], stats['fg_attempted_total'], 
                    stats['ft_made_total'], stats['ft_attempted_total'], stats['stat_type'], stats['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving season stats: {e}")
        
        # Save game logs
        for game in game_logs:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO player_game_logs 
                (player_id, game_id, date, full_date, game_date, opponent, home_away, score, minutes, points,
                 rebounds, assists, steals, blocks, turnovers, fg_made, fg_attempted, ft_made, ft_attempted,
                 three_point_made, three_point_attempted, offensive_rebounds, defensive_rebounds, fouls,
                 played_game, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    game['player_id'], game['game_id'], game['date'], game['full_date'], game['game_date'],
                    game['opponent'], game['home_away'], game['score'], game['minutes'], game['points'],
                    game['rebounds'], game['assists'], game['steals'], game['blocks'], game['turnovers'],
                    game['fg_made'], game['fg_attempted'], game['ft_made'], game['ft_attempted'],
                    game['three_point_made'], game['three_point_attempted'], game['offensive_rebounds'],
                    game['defensive_rebounds'], game['fouls'], game['played_game'], game['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving game log: {e}")
        
        # Save advanced stats
        for stats in advanced_stats:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO player_advanced_stats 
                (player_id, season, team, games, mpg, true_shooting, efg, assist_ratio, turnover_ratio,
                 ast_to_ratio, efficiency, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    stats['player_id'], stats['season'], stats['team'], stats['games'], stats['mpg'],
                    stats['true_shooting'], stats['efg'], stats['assist_ratio'], stats['turnover_ratio'],
                    stats['ast_to_ratio'], stats['efficiency'], stats['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving advanced stats: {e}")
        
        # Save ratings
        for rating in ratings:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO player_ratings 
                (player_id, season, team, pts_rating, reb_rating, ast_rating, stl_rating, blk_rating,
                 pt3m_rating, fgpct_rating, ftpct_rating, overall_rating, rank, rating_type, scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    rating['player_id'], rating['season'], rating['team'], rating['pts_rating'], 
                    rating['reb_rating'], rating['ast_rating'], rating['stl_rating'], rating['blk_rating'],
                    rating['pt3m_rating'], rating['fgpct_rating'], rating['ftpct_rating'], 
                    rating['overall_rating'], rating['rank'], rating['rating_type'], rating['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving ratings: {e}")
        
        # Save splits
        for split in splits:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO player_splits 
                (player_id, split_type, split_category, games, minutes, points, rebounds, assists, steals, blocks,
                 three_point_made, fg_percentage, ft_percentage, turnovers, offensive_rebounds, defensive_rebounds,
                 three_point_attempted, three_point_percentage, fg_made, fg_attempted, ft_made, ft_attempted,
                 scraped_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    split['player_id'], split['split_type'], split['split_category'], split['games'],
                    split['minutes'], split['points'], split['rebounds'], split['assists'], split['steals'],
                    split['blocks'], split['three_point_made'], split['fg_percentage'], split['ft_percentage'],
                    split['turnovers'], split['offensive_rebounds'], split['defensive_rebounds'],
                    split['three_point_attempted'], split['three_point_percentage'], split['fg_made'],
                    split['fg_attempted'], split['ft_made'], split['ft_attempted'], split['scraped_timestamp']
                ))
            except Exception as e:
                print(f"Error saving splits: {e}")
        
        conn.commit()
        conn.close()
    
    def log_scraping_attempt(self, player_id: int, team: str, success: bool, error_message: str = ""):
        """Log scraping attempts to track progress"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO scraping_log 
        (player_id, team, success, error_message, scraped_timestamp)
        VALUES (?, ?, ?, ?, ?)
        ''', (player_id, team, success, error_message, datetime.now()))
        
        conn.commit()
        conn.close()
    
    def scrape_player_by_id(self, player_id: int):
        """Scrape a player by ID"""
        print(f"Attempting to scrape player {player_id}...")
        
        data = self.get_player_data(player_id)
        if not data:
            print(f"No data found for player {player_id}")
            self.log_scraping_attempt(player_id, "UNKNOWN", False, "No data returned from API")
            return
        
        if not self.is_nba_player(data):
            print(f"Player {player_id} is not an NBA player")
            self.log_scraping_attempt(player_id, "NON_NBA", False, "Not an NBA player")
            return
        
        try:
            player_info = self.extract_player_info_from_data(data, player_id)
            
            if not player_info['team']:
                print(f"Could not determine team for player {player_id}")
                self.log_scraping_attempt(player_id, "UNKNOWN", False, "Could not determine team")
                return
            
            print(f"Found NBA player {player_id} on team {player_info['team']}")
            
            # Process all data types
            per_game_stats = self.process_season_stats(data, player_id, 'per_game')
            total_stats = self.process_season_stats(data, player_id, 'total')
            per_36_stats = self.process_season_stats(data, player_id, 'per_36')
            all_season_stats = per_game_stats + total_stats + per_36_stats
            
            game_logs = self.process_game_logs(data, player_id)
            advanced_stats = self.process_advanced_stats(data, player_id)
            
            total_ratings = self.process_ratings(data, player_id, 'total')
            per_game_ratings = self.process_ratings(data, player_id, 'per_game')
            per_36_ratings = self.process_ratings(data, player_id, 'per_36')
            all_ratings = total_ratings + per_game_ratings + per_36_ratings
            
            splits = self.process_splits(data, player_id)
            
            # Save to database
            self.save_to_database(player_info, all_season_stats, game_logs, advanced_stats, all_ratings, splits)
            
            print(f"Successfully scraped player {player_id}. "
                  f"Stats: {len(all_season_stats)} seasons, "
                  f"Games: {len(game_logs)} logs, "
                  f"Splits: {len(splits)} categories")
            
            self.log_scraping_attempt(player_id, player_info['team'], True, "")
            
        except Exception as e:
            error_msg = f"Error processing data for player {player_id}: {str(e)}"
            print(error_msg)
            self.log_scraping_attempt(player_id, "UNKNOWN", False, error_msg)
    
    def scrape_player_range(self, start_id: int, end_id: int, delay: float = 1.0):
        """Scrape a range of player IDs"""
        total_players = end_id - start_id + 1
        print(f"Starting to scrape {total_players} players from ID {start_id} to {end_id}")
        
        for i, player_id in enumerate(range(start_id, end_id + 1), 1):
            print(f"Processing player {i}/{total_players} (ID: {player_id})")
            
            # Check if we've already processed this player
            conn = sqlite3.connect(self.db_name)
            cursor = conn.cursor()
            cursor.execute("SELECT success FROM scraping_log WHERE player_id = ?", (player_id,))
            result = cursor.fetchone()
            conn.close()
            
            if result:
                print(f"Player {player_id} already processed, skipping...")
                continue
            
            self.scrape_player_by_id(player_id)
            time.sleep(delay)
        
        print("Finished scraping player range")

# Example usage
def main():
    scraper = PlayerStatsScraper(db_name="player_stats.db")
    
    # Scrape a range of player IDs
    start_id = 2000
    end_id = 2100
    
    scraper.scrape_player_range(start_id, end_id, delay=1.0)
    
    # Show scraping summary
    conn = sqlite3.connect("player_stats.db")
    summary = pd.read_sql_query("""
        SELECT 
            COUNT(*) as total_attempts,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN team = 'NON_NBA' THEN 1 ELSE 0 END) as non_nba
        FROM scraping_log
        WHERE player_id BETWEEN ? AND ?
    """, conn, params=(start_id, end_id))
    
    print("\nScraping Summary:")
    print(summary)
    
    # Show successfully scraped players
    successful_players = pd.read_sql_query("""
        SELECT p.player_id, p.team, p.current_age
        FROM players p
        JOIN scraping_log sl ON p.player_id = sl.player_id
        WHERE sl.success = 1 AND p.player_id BETWEEN ? AND ?
        LIMIT 10
    """, conn, params=(start_id, end_id))
    
    print("\nSample of successfully scraped NBA players:")
    print(successful_players)
    
    # Verify data is actually in the database
    season_stats_count = pd.read_sql_query("""
        SELECT COUNT(*) as season_stats_count FROM player_season_stats
        WHERE player_id BETWEEN ? AND ?
    """, conn, params=(start_id, end_id))
    
    print(f"\nSeason stats records: {season_stats_count.iloc[0,0]}")
    
    conn.close()

if __name__ == "__main__":
    main()