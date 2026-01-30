from flask import Flask, jsonify, Response, send_file, request
import io
from flask_cors import CORS
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder, playergamelog, leaguestandings, commonteamroster, playercareerstats, commonplayerinfo, leaguedashplayerstats, leaguehustlestatsplayer, playerestimatedmetrics
from nba_boxscore_safe import get_boxscore_client
import requests
import numpy as np
import time
import random
import pickle
import json
import os
from datetime import datetime, timedelta
from functools import wraps, lru_cache
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"])

# ========== CACHE CONFIGURATION ==========
CACHE_DIR = 'nba_cache'
os.makedirs(CACHE_DIR, exist_ok=True)

# Cache durations in minutes
CACHE_DURATIONS = {
    'player_profile': 1440,           # 24 hours
    'career_stats': 1440,             # 24 hours
    'gamelogs': 360,                  # 6 hours
    'all_season_gamelogs': 1440,      # 24 hours
    'standings': 180,                 # 3 hours
    'team_roster': 1440,              # 24 hours
    'player_image': 10080,            # 7 days
    'team_logo': 10080,               # 7 days
    'nba_games': 180,                 # 3 hours
    'boxscore': 1440,                 # 24 hours
    'player_stats_ranks': 180,
    'player_hustle_stats': 180,
    'player_estimated_metrics': 180,
    'player_stats_percentiles': 180,
}

# In-memory cache
memory_cache = {}
cache_lock = threading.Lock()

# ========== OPTIMIZED CACHING SYSTEM ==========
def cached_nba_data(cache_key, fetch_func, cache_minutes=30, force_refresh=False):
    """
    Advanced caching with memory and disk layers
    """
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.pkl")
    
    # Check memory cache first
    with cache_lock:
        if not force_refresh and cache_key in memory_cache:
            cached_item = memory_cache[cache_key]
            if datetime.now() - cached_item['timestamp'] < timedelta(minutes=cache_minutes):
                return cached_item['data']
    
    # Check disk cache
    if not force_refresh and os.path.exists(cache_file):
        file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if file_age < timedelta(minutes=cache_minutes):
            try:
                with open(cache_file, 'rb') as f:
                    data = pickle.load(f)
                with cache_lock:
                    memory_cache[cache_key] = {'data': data, 'timestamp': datetime.now()}
                return data
            except Exception as e:
                os.remove(cache_file)
    
    # Fetch fresh data
    try:
        data = fetch_func()
        
        # Save to disk
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(data, f, protocol=pickle.HIGHEST_PROTOCOL)
        except Exception as e:
            print(f"[CACHE] Error saving to disk {cache_key}: {e}")
        
        # Save to memory
        with cache_lock:
            memory_cache[cache_key] = {'data': data, 'timestamp': datetime.now()}
        
        return data
        
    except Exception as e:
        # If fetch fails, try to use stale cache
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except:
                pass
        raise e

# ========== OPTIMIZED NBA API CALLS ==========
def safe_nba_call(api_func, *args, **kwargs):
    """Optimized wrapper with retry logic"""
    max_retries = 3
    last_error = None
    
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 30
    if 'headers' not in kwargs:
        kwargs['headers'] = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nba.com/'
        }
    
    for attempt in range(max_retries):
        try:
            return api_func(*args, **kwargs)
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(wait_time)
    
    raise last_error

# ========== RATE LIMITING ==========
request_times = {}
rate_lock = threading.Lock()

def rate_limit_decorator(func):
    """Optimized rate limiting decorator"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        ip = request.remote_addr
        current_time = time.time()
        
        with rate_lock:
            if ip in request_times:
                request_times[ip] = [t for t in request_times[ip] if current_time - t < 60]
            else:
                request_times[ip] = []
            
            if len(request_times[ip]) >= 100:
                return jsonify({
                    'success': False,
                    'error': 'Rate limit exceeded',
                    'message': 'Please wait 60 seconds before making more requests',
                    'timestamp': datetime.now().isoformat()
                }), 429
            
            request_times[ip].append(current_time)
        
        return func(*args, **kwargs)
    
    return wrapper

# ========== HELPER FUNCTIONS ==========
def clean_value(value):
    """Convert pandas/numpy types to Python types"""
    if pd.isna(value):
        return None
    if hasattr(value, 'item'):
        return value.item()
    if isinstance(value, (np.integer, np.floating)):
        return value.item()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value

def convert_row_to_dict(row, columns=None):
    """Convert a pandas row to a clean dictionary"""
    if columns is None:
        columns = row.index
    
    result = {}
    for col in columns:
        result[col] = clean_value(row[col])
    return result

def format_season_id(season_id):
    """Convert NBA season ID format (e.g., '22025' to '2025-26')"""
    if not season_id or not isinstance(season_id, str):
        return str(season_id)
    
    if len(season_id) == 5 and season_id.startswith('2'):
        year = season_id[1:5]
        try:
            next_year = str(int(year) + 1)[2:]
            return f"{year}-{next_year}"
        except:
            return season_id
    return season_id

# Create the boxscore client instance
boxscore_client = get_boxscore_client()

# ========== YOUR EXISTING ENDPOINTS (OPTIMIZED) ==========

@app.route('/api/nba-games', methods=['GET'])
def get_nba_games_fixed():
    """Get NBA games with caching"""
    try:
        cache_key = "nba_games_2025_26"
        
        def fetch_games():
            print("[DEBUG] Fetching games from NBA API...")
            pd.set_option('display.max_columns', None)
            
            gamefinder = safe_nba_call(
                leaguegamefinder.LeagueGameFinder,
                league_id_nullable='00',
                timeout=60
            )
            games = gamefinder.get_data_frames()[0]
            print(f"[DEBUG] Total games fetched: {len(games)}")
            
            print(f"[DEBUG] Unique season IDs: {games['SEASON_ID'].unique()[:10]}")
            
            # Get all games for 2025-26 season
            games_2526 = games[games.SEASON_ID == '22025']
            print(f"[DEBUG] Games for season '22025': {len(games_2526)}")
            
            if len(games_2526) == 0:
                print("[DEBUG] Trying alternative season IDs...")
                recent_seasons = [s for s in games['SEASON_ID'].unique() if s.startswith('2')]
                print(f"[DEBUG] Recent seasons available: {recent_seasons[:5]}")
                if recent_seasons:
                    recent_season = recent_seasons[0]
                    print(f"[DEBUG] Using season: {recent_season}")
                    games_2526 = games[games.SEASON_ID == recent_season]
            
            games_2526 = games_2526.copy()
            print(f"[DEBUG] Created copy, shape: {games_2526.shape}")
            
            def is_home_game(matchup):
                if not isinstance(matchup, str):
                    return False
                
                home_indicators = [' vs. ', ' vs ', ' v. ', ' v ', '(Home)']
                matchup_lower = matchup.lower()
                for indicator in home_indicators:
                    if indicator in matchup_lower:
                        return True
                
                if matchup_lower.endswith(' vs') or matchup_lower.endswith(' vs.'):
                    return True
                
                return False
            
            def is_away_game(matchup):
                if not isinstance(matchup, str):
                    return False
                
                away_indicators = [' @ ', ' at ', '(Away)']
                matchup_lower = matchup.lower()
                for indicator in away_indicators:
                    if indicator in matchup_lower:
                        return True
                return False
            
            games_2526['IS_HOME'] = games_2526['MATCHUP'].apply(is_home_game)
            games_2526['IS_AWAY'] = games_2526['MATCHUP'].apply(is_away_game)
            
            home_count = games_2526['IS_HOME'].sum()
            away_count = games_2526['IS_AWAY'].sum()
            neither_count = len(games_2526) - home_count - away_count
            
            print(f"Home games: {home_count}")
            print(f"Away games: {away_count}")
            print(f"Neither: {neither_count}")
            
            games_by_id = {}
            home_games = games_2526[games_2526['IS_HOME']]
            
            for _, game in home_games.iterrows():
                game_id = game['GAME_ID']
                if game_id not in games_by_id:
                    away_game_data = games_2526[
                        (games_2526['GAME_ID'] == game_id) & 
                        (games_2526['IS_AWAY'])
                    ]
                    
                    away_team = None
                    if not away_game_data.empty:
                        away_game = away_game_data.iloc[0]
                        away_team = {
                            'team_id': int(away_game['TEAM_ID']),
                            'team_abbreviation': away_game['TEAM_ABBREVIATION'],
                            'team_name': away_game['TEAM_NAME'],
                            'wl': away_game['WL'],
                            'pts': int(away_game['PTS']),
                            'fgm': int(away_game['FGM']),
                            'fga': int(away_game['FGA']),
                            'fg_pct': float(away_game['FG_PCT']),
                            'fg3m': int(away_game['FG3M']),
                            'fg3a': int(away_game['FG3A']),
                            'fg3_pct': float(away_game['FG3_PCT']),
                            'ftm': int(away_game['FTM']),
                            'fta': int(away_game['FTA']),
                            'ft_pct': float(away_game['FT_PCT']),
                            'oreb': int(away_game['OREB']),
                            'dreb': int(away_game['DREB']),
                            'reb': int(away_game['REB']),
                            'ast': int(away_game['AST']),
                            'stl': int(away_game['STL']),
                            'blk': int(away_game['BLK']),
                            'tov': int(away_game['TOV']),
                            'pf': int(away_game['PF']),
                            'plus_minus': float(away_game['PLUS_MINUS'])
                        }
                    
                    home_team = {
                        'team_id': int(game['TEAM_ID']),
                        'team_abbreviation': game['TEAM_ABBREVIATION'],
                        'team_name': game['TEAM_NAME'],
                        'wl': game['WL'],
                        'pts': int(game['PTS']),
                        'fgm': int(game['FGM']),
                        'fga': int(game['FGA']),
                        'fg_pct': float(game['FG_PCT']),
                        'fg3m': int(game['FG3M']),
                        'fg3a': int(game['FG3A']),
                        'fg3_pct': float(game['FG3_PCT']),
                        'ftm': int(game['FTM']),
                        'fta': int(game['FTA']),
                        'ft_pct': float(game['FT_PCT']),
                        'oreb': int(game['OREB']),
                        'dreb': int(game['DREB']),
                        'reb': int(game['REB']),
                        'ast': int(game['AST']),
                        'stl': int(game['STL']),
                        'blk': int(game['BLK']),
                        'tov': int(game['TOV']),
                        'pf': int(game['PF']),
                        'plus_minus': float(game['PLUS_MINUS'])
                    }
                    
                    games_by_id[game_id] = {
                        'game_id': game_id,
                        'game_date': game['GAME_DATE'],
                        'matchup': game['MATCHUP'],
                        'season_id': game['SEASON_ID'],
                        'teams': [home_team]
                    }
                    
                    if away_team:
                        games_by_id[game_id]['teams'].append(away_team)
            
            all_game_ids = set(games_2526['GAME_ID'].unique())
            processed_game_ids = set(games_by_id.keys())
            unprocessed_game_ids = all_game_ids - processed_game_ids
            
            print(f"\nUnprocessed games (no clear home/away): {len(unprocessed_game_ids)}")
            
            for game_id in unprocessed_game_ids:
                game_rows = games_2526[games_2526['GAME_ID'] == game_id]
                if len(game_rows) > 0:
                    first_game = game_rows.iloc[0]
                    games_by_id[game_id] = {
                        'game_id': game_id,
                        'game_date': first_game['GAME_DATE'],
                        'matchup': first_game['MATCHUP'],
                        'season_id': first_game['SEASON_ID'],
                        'teams': []
                    }
                    
                    for _, team_row in game_rows.iterrows():
                        team_data = {
                            'team_id': int(team_row['TEAM_ID']),
                            'team_abbreviation': team_row['TEAM_ABBREVIATION'],
                            'team_name': team_row['TEAM_NAME'],
                            'wl': team_row['WL'],
                            'pts': int(team_row['PTS']),
                            'fgm': int(team_row['FGM']),
                            'fga': int(team_row['FGA']),
                            'fg_pct': float(team_row['FG_PCT']),
                            'fg3m': int(team_row['FG3M']),
                            'fg3a': int(team_row['FG3A']),
                            'fg3_pct': float(team_row['FG3_PCT']),
                            'ftm': int(team_row['FTM']),
                            'fta': int(team_row['FTA']),
                            'ft_pct': float(team_row['FT_PCT']),
                            'oreb': int(team_row['OREB']),
                            'dreb': int(team_row['DREB']),
                            'reb': int(team_row['REB']),
                            'ast': int(team_row['AST']),
                            'stl': int(team_row['STL']),
                            'blk': int(team_row['BLK']),
                            'tov': int(team_row['TOV']),
                            'pf': int(team_row['PF']),
                            'plus_minus': float(team_row['PLUS_MINUS'])
                        }
                        games_by_id[game_id]['teams'].append(team_data)
            
            structured_games = list(games_by_id.values())
            structured_games.sort(key=lambda x: x['game_date'], reverse=True)
            
            return {
                'games': structured_games,
                'count': len(structured_games),
                'stats': {
                    'unique_game_ids': len(all_game_ids),
                    'games_with_home_away': len(processed_game_ids),
                    'games_without_pattern': len(unprocessed_game_ids),
                    'total_processed': len(structured_games)
                }
            }
        
        # Use cache with 3 hour expiration
        data = cached_nba_data(cache_key, fetch_games, 
                              cache_minutes=CACHE_DURATIONS['nba_games'])
        
        return jsonify({
            'success': True,
            **data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/game/<game_id>/boxscore', methods=['GET'])
def get_game_boxscore(game_id):
    """Get detailed box score for a specific game"""
    try:
        cache_key = f"boxscore_{game_id}"
        
        def fetch_boxscore():
            data = boxscore_client.get_player_stats(game_id)
            return data
        
        data = cached_nba_data(cache_key, fetch_boxscore,
                              cache_minutes=CACHE_DURATIONS['boxscore'])
        
        if data['success']:
            return jsonify(data)
        else:
            return jsonify({
                'success': False,
                'error': data.get('error', 'Box score not available'),
                'game_id': game_id
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'game_id': game_id
        }), 500

@app.route('/api/game/<game_id>/simple-boxscore', methods=['GET'])
def get_simple_boxscore(game_id):
    """Get simplified box score for frontend display"""
    try:
        cache_key = f"simple_boxscore_{game_id}"
        
        def fetch_simple_boxscore():
            data = boxscore_client.get_player_stats(game_id)
            
            if not data:
                raise Exception('No data returned from boxscore client')
            
            if isinstance(data, dict) and data.get('success', False):
                simplified = {
                    'success': True,
                    'game_id': game_id,
                    'home_team': {
                        'name': data['game']['home_team']['name'],
                        'city': data['game']['home_team']['city'],
                        'score': data['game']['home_team']['score']
                    },
                    'away_team': {
                        'name': data['game']['away_team']['name'],
                        'city': data['game']['away_team']['city'],
                        'score': data['game']['away_team']['score']
                    },
                    'players': [
                        {
                            'name': p['name'],
                            'player_id': p['player_id'],
                            'team_id': p['team_id'],
                            'team_city': p['team_city'],
                            'position': p['position'],
                            'jersey': p['jersey'],
                            'starter': p['starter'],
                            'minutes': p['minutes'],
                            'points': p['points'],
                            'rebounds': p['rebounds'],
                            'assists': p['assists'],
                            'steals': p['steals'],
                            'blocks': p['blocks'],
                            'turnovers': p['turnovers'],
                            'fouls': p['fouls'],
                            'fg_made': p['fg_made'],
                            'fg_attempted': p['fg_attempted'],
                            'fg_percentage': p['fg_percentage'],
                            'three_made': p['three_made'],
                            'three_attempted': p['three_attempted'],
                            'three_percentage': p['three_percentage'],
                            'ft_made': p['ft_made'],
                            'ft_attempted': p['ft_attempted'],
                            'ft_percentage': p['ft_percentage'],
                            'plus_minus': p['plus_minus']
                        }
                        for p in data['players']
                    ]
                }
                return simplified
            else:
                error_msg = data.get('error', 'Unknown error') if isinstance(data, dict) else 'Invalid response format'
                raise Exception(error_msg)
        
        data = cached_nba_data(cache_key, fetch_simple_boxscore,
                              cache_minutes=CACHE_DURATIONS['boxscore'])
        
        return jsonify(data)
            
    except KeyError as e:
        return jsonify({
            'success': False,
            'error': f'Missing data key: {str(e)}',
            'game_id': game_id
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'game_id': game_id
        }), 500

@app.route('/api/standings', methods=['GET'])
def get_standings():
    """Get NBA standings for current season"""
    try:
        season = request.args.get('season', '2025-26')
        league_id = request.args.get('league_id', '00')
        
        cache_key = f"standings_{season}_{league_id}"
        
        def fetch_standings():
            print(f"[STANDINGS] Fetching standings for season: {season}")
            
            standings_data = safe_nba_call(
                leaguestandings.LeagueStandings,
                league_id=league_id,
                season=season,
                timeout=60
            )
            
            df_standings = standings_data.get_data_frames()[0]
            print(f"[STANDINGS] Retrieved {len(df_standings)} teams")
            
            def parse_record(record_str):
                if isinstance(record_str, str) and '-' in record_str:
                    try:
                        wins_str, losses_str = record_str.split('-')
                        return int(wins_str), int(losses_str)
                    except:
                        return 0, 0
                return 0, 0
            
            standings_list = []
            for _, team in df_standings.iterrows():
                home_wins, home_losses = parse_record(team['HOME'])
                away_wins, away_losses = parse_record(team['ROAD'])
                last10_wins, last10_losses = parse_record(team['L10'])
                
                team_info = {
                    'team_id': int(team['TeamID']),
                    'team_city': team['TeamCity'],
                    'team_name': team['TeamName'],
                    'team_conference': team['Conference'],
                    'team_division': team['Division'],
                    'wins': int(team['WINS']),
                    'losses': int(team['LOSSES']),
                    'win_pct': float(team['WinPCT']),
                    'playoff_rank': int(team['PlayoffRank']),
                    'division_rank': int(team['DivisionRank']),
                    'home_wins': home_wins,
                    'home_losses': home_losses,
                    'home_record': team['HOME'],
                    'away_wins': away_wins,
                    'away_losses': away_losses,
                    'away_record': team['ROAD'],
                    'last_10_wins': last10_wins,
                    'last_10_losses': last10_losses,
                    'last_10_record': team['L10'],
                    'streak': team['strCurrentStreak'],
                    'points_per_game': float(team['PointsPG']),
                    'opp_points_per_game': float(team['OppPointsPG']),
                    'point_differential': float(team['DiffPointsPG']),
                    'conference_games_back': float(team['ConferenceGamesBack']),
                    'division_games_back': float(team['DivisionGamesBack']),
                    'record': team['Record'],
                    'vs_east': team['vsEast'],
                    'vs_west': team['vsWest'],
                    'clinched_playoffs': team.get('ClinchedPlayoffBirth', '') == 'x' or team.get('ClinchedPlayoffBirth', '') == 'y'
                }
                standings_list.append(team_info)
            
            eastern_conf = sorted(
                [t for t in standings_list if t['team_conference'] == 'East'],
                key=lambda x: (x['playoff_rank'])
            )
            
            western_conf = sorted(
                [t for t in standings_list if t['team_conference'] == 'West'],
                key=lambda x: (x['playoff_rank'])
            )
            
            return {
                'season': season,
                'last_updated': pd.Timestamp.now().isoformat(),
                'eastern_conference': {
                    'name': 'Eastern Conference',
                    'teams': eastern_conf,
                    'count': len(eastern_conf)
                },
                'western_conference': {
                    'name': 'Western Conference',
                    'teams': western_conf,
                    'count': len(western_conf)
                },
                'overall': {
                    'teams': standings_list,
                    'count': len(standings_list)
                }
            }
        
        data = cached_nba_data(cache_key, fetch_standings,
                              cache_minutes=CACHE_DURATIONS['standings'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[STANDINGS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to fetch standings'
        }), 500

@app.route('/api/standings/simple', methods=['GET'])
def get_simple_standings():
    """Get simplified standings (just win-loss records)"""
    try:
        season = request.args.get('season', '2025-26')
        cache_key = f"simple_standings_{season}"
        
        def fetch_simple_standings():
            standings_data = safe_nba_call(
                leaguestandings.LeagueStandings,
                league_id='00',
                season=season,
                timeout=60
            )
            
            df_standings = standings_data.get_data_frames()[0]
            
            def parse_record(record_str):
                if isinstance(record_str, str) and '-' in record_str:
                    try:
                        wins_str, losses_str = record_str.split('-')
                        return int(wins_str), int(losses_str)
                    except:
                        return 0, 0
                return 0, 0
            
            simple_standings = []
            for _, team in df_standings.iterrows():
                home_wins, home_losses = parse_record(team['HOME'])
                away_wins, away_losses = parse_record(team['ROAD'])
                last10_wins, last10_losses = parse_record(team['L10'])
                
                simple_standings.append({
                    'team_id': int(team['TeamID']),
                    'team_name': f"{team['TeamCity']} {team['TeamName']}",
                    'team_abbreviation': team['TeamName'],
                    'team_city': team['TeamCity'],
                    'team_conference': team['Conference'],
                    'team_division': team['Division'],
                    'wins': int(team['WINS']),
                    'losses': int(team['LOSSES']),
                    'win_pct': float(team['WinPCT']),
                    'conference_rank': int(team['PlayoffRank']),
                    'division_rank': int(team['DivisionRank']),
                    'games_back': float(team['ConferenceGamesBack']),
                    'streak': team['strCurrentStreak'],
                    'record': team['Record'],
                    'home_record': team['HOME'],
                    'home_wins': home_wins,
                    'home_losses': home_losses,
                    'away_record': team['ROAD'],
                    'away_wins': away_wins,
                    'away_losses': away_losses,
                    'last_10_record': team['L10'],
                    'last_10_wins': last10_wins,
                    'last_10_losses': last10_losses,
                    'points_per_game': float(team['PointsPG']),
                    'opp_points_per_game': float(team['OppPointsPG']),
                    'point_differential': float(team['DiffPointsPG'])
                })
            
            return {
                'season': season,
                'standings': simple_standings
            }
        
        data = cached_nba_data(cache_key, fetch_simple_standings,
                              cache_minutes=CACHE_DURATIONS['standings'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/standings/minimal', methods=['GET'])
def get_minimal_standings():
    """Get minimal standings data - just essentials"""
    try:
        season = request.args.get('season', '2025-26')
        cache_key = f"minimal_standings_{season}"
        
        def fetch_minimal_standings():
            standings_data = safe_nba_call(
                leaguestandings.LeagueStandings,
                league_id='00',
                season=season,
                timeout=60
            )
            
            df_standings = standings_data.get_data_frames()[0]
            
            minimal_standings = []
            for _, team in df_standings.iterrows():
                minimal_standings.append({
                    'team_id': int(team['TeamID']),
                    'team_name': f"{team['TeamCity']} {team['TeamName']}",
                    'wins': int(team['WINS']),
                    'losses': int(team['LOSSES']),
                    'win_pct': float(team['WinPCT']),
                    'conference': team['Conference'],
                    'conference_rank': int(team['PlayoffRank']),
                    'streak': team['strCurrentStreak'],
                    'record': team['Record'],
                    'games_back': float(team['ConferenceGamesBack'])
                })
            
            eastern = sorted(
                [t for t in minimal_standings if t['conference'] == 'East'],
                key=lambda x: x['conference_rank']
            )
            
            western = sorted(
                [t for t in minimal_standings if t['conference'] == 'West'],
                key=lambda x: x['conference_rank']
            )
            
            return {
                'season': season,
                'eastern_conference': eastern,
                'western_conference': western
            }
        
        data = cached_nba_data(cache_key, fetch_minimal_standings,
                              cache_minutes=CACHE_DURATIONS['standings'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/team/<team_id>/roster', methods=['GET'])
def get_team_roster(team_id):
    """Get team roster with player details"""
    try:
        season = request.args.get('season', '2025-26')
        cache_key = f"team_roster_{team_id}_{season}"
        
        def fetch_roster():
            print(f"[ROSTER] Fetching roster for team {team_id}, season {season}")
            
            max_retries = 3
            roster_data = None
            
            for attempt in range(max_retries):
                try:
                    print(f"[ROSTER] Attempt {attempt + 1}...")
                    roster_data = commonteamroster.CommonTeamRoster(
                        team_id=team_id,
                        season=season,
                        timeout=60,
                        headers={
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://www.nba.com/'
                        }
                    )
                    break
                except Exception as e:
                    print(f"[ROSTER] Attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(wait_time)
            
            df_roster = roster_data.get_data_frames()[0]
            df_coaches = roster_data.get_data_frames()[1]
            
            print(f"[ROSTER] Columns available: {list(df_roster.columns)}")
            
            players = []
            for _, player in df_roster.iterrows():
                height = player['HEIGHT']
                height_display = str(height)
                if pd.notna(height) and isinstance(height, str):
                    if '-' in height:
                        feet, inches = height.split('-')
                        height_display = f"{feet}'{inches}\""
                
                weight = player['WEIGHT']
                if pd.isna(weight):
                    weight_display = "N/A"
                else:
                    try:
                        weight_display = f"{int(weight)} lbs"
                    except:
                        weight_display = str(weight)
                
                experience = player['EXP']
                if pd.isna(experience):
                    experience_display = 'N/A'
                elif experience == 'R':
                    experience_display = 'Rookie'
                else:
                    try:
                        exp_years = int(experience)
                        if exp_years == 0:
                            experience_display = 'Rookie'
                        elif exp_years == 1:
                            experience_display = '1 year'
                        else:
                            experience_display = f'{exp_years} years'
                    except:
                        experience_display = str(experience)
                
                jersey_number = ''
                if 'NUM' in player:
                    jersey_number = str(player['NUM'])
                elif 'JERSEY_NUMBER' in player:
                    jersey_number = str(player['JERSEY_NUMBER'])
                
                position = player.get('POSITION', 'N/A')
                
                college = player.get('SCHOOL', '')
                if pd.isna(college) or college == '':
                    college = 'Not Available'
                
                birth_date = player.get('BIRTH_DATE', '')
                if pd.isna(birth_date):
                    birth_date = 'N/A'
                
                age = player.get('AGE')
                if pd.isna(age):
                    age_display = None
                else:
                    try:
                        age_display = int(age)
                    except:
                        age_display = None
                
                player_name = player.get('PLAYER', '')
                nickname = player.get('NICKNAME', '')
                player_slug = player.get('PLAYER_SLUG', '')
                
                display_name = nickname if nickname and nickname != '' else player_name
                
                players.append({
                    'player_id': int(player['PLAYER_ID']),
                    'player_name': player_name,
                    'display_name': display_name,
                    'player_slug': player_slug,
                    'jersey_number': jersey_number,
                    'position': position,
                    'height': height_display,
                    'height_raw': str(height) if pd.notna(height) else '',
                    'weight': weight_display,
                    'weight_raw': float(weight) if pd.notna(weight) else None,
                    'birth_date': birth_date,
                    'age': age_display,
                    'experience': experience_display,
                    'experience_raw': experience if pd.notna(experience) else '',
                    'college': college,
                    'country': player.get('COUNTRY', 'USA') if pd.notna(player.get('COUNTRY')) else 'USA',
                    'how_acquired': player.get('HOW_ACQUIRED', '') if pd.notna(player.get('HOW_ACQUIRED')) else ''
                })
            
            coaches = []
            if not df_coaches.empty:
                print(f"[ROSTER] Coach columns: {list(df_coaches.columns)}")
                
                coach_name_col = next((col for col in df_coaches.columns if 'COACH' in col and 'NAME' in col), None)
                coach_type_col = next((col for col in df_coaches.columns if 'COACH' in col and 'TYPE' in col), None)
                is_assistant_col = next((col for col in df_coaches.columns if 'ASSISTANT' in col or 'IS_' in col), None)
                sort_seq_col = next((col for col in df_coaches.columns if 'SORT' in col or 'SEQUENCE' in col), None)
                
                for _, coach in df_coaches.iterrows():
                    coach_name = coach[coach_name_col] if coach_name_col else 'Unknown Coach'
                    coach_type = coach[coach_type_col] if coach_type_col else 'Unknown'
                    
                    is_assistant = False
                    if is_assistant_col:
                        is_assistant_val = coach[is_assistant_col]
                        if pd.notna(is_assistant_val):
                            if isinstance(is_assistant_val, (int, float)):
                                is_assistant = is_assistant_val == 1
                            else:
                                is_assistant = str(is_assistant_val).lower() in ['true', 'yes', '1', 'assistant']
                    else:
                        is_assistant = 'assistant' in str(coach_type).lower() or coach_type != 'Head Coach'
                    
                    sort_sequence = 999
                    if sort_seq_col and pd.notna(coach[sort_seq_col]):
                        try:
                            sort_sequence = int(coach[sort_seq_col])
                        except:
                            pass
                    
                    coaches.append({
                        'coach_name': str(coach_name),
                        'coach_type': str(coach_type),
                        'is_assistant': is_assistant,
                        'sort_sequence': sort_sequence
                    })
            
            coaches.sort(key=lambda x: (
                not any(word in x['coach_type'].lower() for word in ['head', 'head coach', 'hc']),
                x['sort_sequence']
            ))
            
            return {
                'team_id': int(team_id),
                'season': season,
                'last_updated': pd.Timestamp.now().isoformat(),
                'roster': {
                    'players': players,
                    'player_count': len(players),
                    'coaches': coaches,
                    'coach_count': len(coaches)
                }
            }
        
        data = cached_nba_data(cache_key, fetch_roster,
                              cache_minutes=CACHE_DURATIONS['team_roster'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[ROSTER] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'team_id': team_id
        }), 500

@app.route('/api/team-logo/<team_id>', methods=['GET'])
def get_team_logo(team_id):
    """Get team logo"""
    try:
        cache_key = f"team_logo_{team_id}"
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.svg")
        
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age < timedelta(minutes=CACHE_DURATIONS['team_logo']):
                with open(cache_file, 'rb') as f:
                    return Response(
                        f.read(),
                        mimetype='image/svg+xml',
                        headers={
                            'Cache-Control': 'public, max-age=86400',
                            'Access-Control-Allow-Origin': '*'
                        }
                    )
        
        logo_url = f"https://cdn.nba.com/logos/nba/{team_id}/primary/L/logo.svg"
        
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.nba.com/'
        }
        response = requests.get(logo_url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            with open(cache_file, 'wb') as f:
                f.write(response.content)
            
            return Response(
                response.content,
                mimetype='image/svg+xml',
                headers={
                    'Cache-Control': 'public, max-age=86400',
                    'Access-Control-Allow-Origin': '*'
                }
            )
        else:
            return Response(b'<svg><!-- Placeholder --></svg>', mimetype='image/svg+xml')
            
    except Exception as e:
        return Response(b'<svg><!-- Error --></svg>', mimetype='image/svg+xml')

# ========== NEW OPTIMIZED PLAYER ENDPOINTS ==========

@app.route('/api/player/<player_id>/full-profile', methods=['GET'])
@rate_limit_decorator
def get_player_full_profile(player_id):
    """Get ALL player data in a single optimized API call"""
    try:
        cache_key = f"full_profile_{player_id}"
        
        def fetch_full_profile():
            print(f"[FULL PROFILE] Fetching for player {player_id}")
            
            # Fetch player profile and career stats
            profile_data = safe_nba_call(
                commonplayerinfo.CommonPlayerInfo,
                player_id=player_id,
                timeout=45
            )
            
            career_data = safe_nba_call(
                playercareerstats.PlayerCareerStats,
                player_id=player_id,
                timeout=45
            )
            
            # Process profile data
            df_info = profile_data.get_data_frames()[0]
            if df_info.empty:
                raise Exception(f"Player {player_id} not found")
            
            player_info = convert_row_to_dict(df_info.iloc[0])
            
            # Process career stats
            df_career = career_data.get_data_frames()[0]
            career_stats = []
            if not df_career.empty:
                for _, row in df_career.iterrows():
                    career_stats.append(convert_row_to_dict(row))
            
            # Get current season (most recent regular season)
            current_season = None
            if career_stats:
                regular_seasons = [s for s in career_stats if str(s.get('SEASON_ID', '')).startswith('2')]
                if regular_seasons:
                    regular_seasons.sort(key=lambda x: str(x.get('SEASON_ID', '')), reverse=True)
                    current_season = format_season_id(regular_seasons[0].get('SEASON_ID'))
            
            return {
                'player_info': player_info,
                'career_stats': career_stats,
                'current_season': current_season,
                'timestamp': datetime.now().isoformat()
            }
        
        data = cached_nba_data(cache_key, fetch_full_profile, 
                              cache_minutes=CACHE_DURATIONS['player_profile'])
        
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        print(f"[FULL PROFILE] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/player/<player_id>/profile', methods=['GET'])
def get_player_profile(player_id):
    """Get detailed player profile information"""
    try:
        cache_key = f"player_profile_{player_id}"
        
        def fetch_profile():
            print(f"[PLAYER PROFILE] Fetching profile for player ID: {player_id}")
            
            player_info = safe_nba_call(
                commonplayerinfo.CommonPlayerInfo,
                player_id=player_id,
                timeout=45
            )
            df_info = player_info.get_data_frames()[0]
            
            if df_info.empty:
                raise Exception(f'Player with ID {player_id} not found')
            
            row = df_info.iloc[0]
            
            player_data = {}
            for col in df_info.columns:
                player_data[col] = clean_value(row[col])
            
            career_stats = safe_nba_call(
                playercareerstats.PlayerCareerStats,
                player_id=player_id,
                timeout=45
            )
            df_career = career_stats.get_data_frames()[0]
            
            career_stats_data = []
            if not df_career.empty:
                regular_season = df_career[df_career['SEASON_ID'].astype(str).str.startswith('2')]
                
                for _, season in regular_season.head(5).iterrows():
                    season_dict = {}
                    for col in df_career.columns:
                        season_dict[col] = clean_value(season[col])
                    career_stats_data.append(season_dict)
            
            return {
                'player_info': player_data,
                'career_stats': career_stats_data[:5] if career_stats_data else [],
                'has_career_stats': not df_career.empty
            }
        
        data = cached_nba_data(cache_key, fetch_profile,
                              cache_minutes=CACHE_DURATIONS['player_profile'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER PROFILE] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/player/<player_id>/career-stats', methods=['GET'])
@rate_limit_decorator
def get_player_career_stats(player_id):
    """Get RAW career statistics for a player"""
    try:
        cache_key = f"career_stats_raw_{player_id}"
        
        def fetch_career_stats():
            print(f"[CAREER STATS RAW] Fetching raw career stats for player ID: {player_id}")
            
            career = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                timeout=60,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://www.nba.com/'
                }
            )
            
            df_raw = career.get_data_frames()[0]
            
            print(f"[CAREER STATS RAW] Raw DataFrame shape: {df_raw.shape}")
            print(f"[CAREER STATS RAW] Columns: {list(df_raw.columns)}")
            
            if df_raw.empty:
                raise Exception(f'Career stats not found for player ID {player_id}')
            
            raw_data = []
            for _, row in df_raw.iterrows():
                row_dict = {}
                for col in df_raw.columns:
                    row_dict[col] = clean_value(row[col])
                raw_data.append(row_dict)
            
            return {
                'raw_data': raw_data,
                'columns': list(df_raw.columns),
                'row_count': len(raw_data)
            }
        
        data = cached_nba_data(cache_key, fetch_career_stats,
                              cache_minutes=CACHE_DURATIONS['career_stats'])
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            **data
        })
        
    except Exception as e:
        print(f"[CAREER STATS RAW] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/player/<player_id>/gamelogs', methods=['GET'])
def get_player_gamelogs(player_id):
    """Get game-by-game statistics for a player"""
    try:
        season = request.args.get('season', '2025-26')
        season_type = request.args.get('season_type', 'Regular Season')
        
        cache_key = f"gamelogs_{player_id}_{season}_{season_type}"
        
        def fetch_gamelogs():
            print(f"[GAMELOGS] Fetching gamelogs for player ID: {player_id}, season: {season}")
            
            gamelogs = playergamelog.PlayerGameLog(
                player_id=player_id,
                season=season,
                season_type_all_star=season_type,
                timeout=60,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://www.nba.com/'
                }
            )
            
            df_gamelogs = gamelogs.get_data_frames()[0]
            
            print(f"[GAMELOGS] Raw DataFrame shape: {df_gamelogs.shape}")
            print(f"[GAMELOGS] Columns: {list(df_gamelogs.columns)}")
            
            if df_gamelogs.empty:
                return []
            
            gamelogs_list = []
            for _, row in df_gamelogs.iterrows():
                game_log = {}
                for col in df_gamelogs.columns:
                    value = row[col]
                    if pd.isna(value):
                        game_log[col] = None
                    elif hasattr(value, 'item'):
                        game_log[col] = value.item()
                    else:
                        game_log[col] = value
                gamelogs_list.append(game_log)
            
            return gamelogs_list
        
        gamelogs_data = cached_nba_data(cache_key, fetch_gamelogs,
                                       cache_minutes=CACHE_DURATIONS['gamelogs'])
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'season': season,
            'season_type': season_type,
            'gamelogs': gamelogs_data,
            'columns': list(df_gamelogs.columns) if 'df_gamelogs' in locals() else [],
            'count': len(gamelogs_data)
        })
        
    except Exception as e:
        print(f"[GAMELOGS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/player/<player_id>/all-season-gamelogs', methods=['GET'])
def get_all_season_gamelogs(player_id):
    """Get game logs for all seasons for a player"""
    try:
        cache_key = f"all_season_gamelogs_{player_id}"
        
        def fetch_all_season_gamelogs():
            print(f"[ALL SEASON GAMELOGS] Fetching for player ID: {player_id}")
            
            career = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                timeout=60,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://www.nba.com/'
                }
            )
            
            df_career = career.get_data_frames()[0]
            
            if df_career.empty:
                return {}
            
            unique_seasons = df_career[
                df_career['SEASON_ID'].astype(str).str.startswith('2')
            ]['SEASON_ID'].unique()
            
            print(f"[ALL SEASON GAMELOGS] Found seasons: {unique_seasons}")
            
            all_season_data = {}
            
            for season_id in unique_seasons:
                try:
                    season_str = str(season_id)
                    print(f"[ALL SEASON GAMELOGS] Processing season: {season_str}")
                    
                    season_formatted = ""
                    if len(season_str) == 5 and season_str.startswith('2'):
                        year = season_str[1:5]
                        try:
                            next_year = str(int(year) + 1)[2:]
                            season_formatted = f"{year}-{next_year}"
                        except:
                            season_formatted = season_str
                    else:
                        season_formatted = season_str
                    
                    print(f"[ALL SEASON GAMELOGS] Formatted as: {season_formatted}")
                    
                    # Use cached gamelogs
                    gamelogs_cache_key = f"gamelogs_{player_id}_{season_formatted}_Regular Season"
                    
                    def fetch_season_gamelogs():
                        print(f"[ALL SEASON GAMELOGS] Fetching fresh: {season_formatted}")
                        gamelogs = playergamelog.PlayerGameLog(
                            player_id=player_id,
                            season=season_formatted,
                            season_type_all_star='Regular Season',
                            timeout=30,
                            headers={
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': 'application/json, text/plain, */*',
                                'Referer': 'https://www.nba.com/'
                            }
                        )
                        return gamelogs.get_data_frames()[0]
                    
                    df_season = cached_nba_data(gamelogs_cache_key, fetch_season_gamelogs, 
                                               cache_minutes=CACHE_DURATIONS['gamelogs'])
                    
                    if not df_season.empty:
                        print(f"[ALL SEASON GAMELOGS] Found {len(df_season)} games for {season_formatted}")
                        
                        season_logs = []
                        for _, row in df_season.iterrows():
                            game_log = {}
                            for col in df_season.columns:
                                value = row[col]
                                if pd.isna(value):
                                    game_log[col] = None
                                elif hasattr(value, 'item'):
                                    game_log[col] = value.item()
                                else:
                                    game_log[col] = value
                            season_logs.append(game_log)
                        
                        all_season_data[season_str] = {
                            'season_id': season_str,
                            'season_formatted': season_formatted,
                            'games': season_logs,
                            'game_count': len(season_logs)
                        }
                    else:
                        print(f"[ALL SEASON GAMELOGS] No games found for {season_formatted}")
                        all_season_data[season_str] = {
                            'season_id': season_str,
                            'season_formatted': season_formatted,
                            'games': [],
                            'game_count': 0
                        }
                    
                    time.sleep(0.3)
                    
                except Exception as e:
                    print(f"[ALL SEASON GAMELOGS] Error for season {season_id}: {str(e)}")
                    all_season_data[str(season_id)] = {
                        'season_id': str(season_id),
                        'season_formatted': str(season_id),
                        'games': [],
                        'game_count': 0,
                        'error': str(e)
                    }
                    continue
            
            return all_season_data
        
        data = cached_nba_data(cache_key, fetch_all_season_gamelogs,
                              cache_minutes=CACHE_DURATIONS['all_season_gamelogs'])
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'seasons': data,
            'total_seasons': len(data),
            'total_games': sum(season_data['game_count'] for season_data in data.values())
        })
        
    except Exception as e:
        print(f"[ALL SEASON GAMELOGS] General error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/player/<player_id>/season-ratings', methods=['GET'])
@rate_limit_decorator
def get_season_ratings(player_id):
    """Get pre-calculated ratings for all seasons"""
    try:
        cache_key = f"season_ratings_{player_id}"
        
        def calculate_season_ratings():
            print(f"[SEASON RATINGS] Calculating for player {player_id}")
            
            # Get career stats to find seasons
            career = safe_nba_call(
                playercareerstats.PlayerCareerStats,
                player_id=player_id,
                timeout=45
            )
            
            df_career = career.get_data_frames()[0]
            if df_career.empty:
                return {}
            
            regular_seasons = df_career[
                df_career['SEASON_ID'].astype(str).str.startswith('2')
            ]
            
            if regular_seasons.empty:
                return {}
            
            season_ratings = {}
            
            for _, row in regular_seasons.iterrows():
                season_id = str(row['SEASON_ID'])
                season_formatted = format_season_id(season_id)
                
                try:
                    # Get cached gamelogs for this season
                    gamelogs_cache_key = f"gamelogs_{player_id}_{season_formatted}_Regular Season"
                    gamelogs_file = os.path.join(CACHE_DIR, f"{gamelogs_cache_key}.pkl")
                    
                    if os.path.exists(gamelogs_file):
                        with open(gamelogs_file, 'rb') as f:
                            season_games = pickle.load(f)
                        
                        if season_games and len(season_games) > 0:
                            # Placeholder for rating calculation - you'll implement this
                            total_points = sum(game.get('PTS', 0) for game in season_games)
                            avg_rating = total_points / len(season_games) if len(season_games) > 0 else 0
                            
                            season_ratings[season_id] = {
                                'season_id': season_id,
                                'season_formatted': season_formatted,
                                'rating': round(avg_rating, 1),
                                'games': len(season_games),
                                'last_updated': datetime.now().isoformat()
                            }
                
                except Exception as e:
                    print(f"[SEASON RATINGS] Error for season {season_id}: {e}")
                    continue
            
            return season_ratings
        
        ratings = cached_nba_data(cache_key, calculate_season_ratings,
                                 cache_minutes=CACHE_DURATIONS['all_season_gamelogs'])
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'ratings': ratings,
            'total_seasons': len(ratings)
        })
        
    except Exception as e:
        print(f"[SEASON RATINGS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/player/<player_id>/image', methods=['GET'])
def player_image(player_id):
    """Get player image with multiple fallback sources"""
    try:
        cache_key = f"player_image_{player_id}"
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.png")
        
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age < timedelta(minutes=CACHE_DURATIONS['player_image']):
                with open(cache_file, 'rb') as f:
                    return Response(
                        f.read(),
                        mimetype='image/png',
                        headers={
                            'Cache-Control': 'public, max-age=86400',
                            'Access-Control-Allow-Origin': '*'
                        }
                    )
        
        image_sources = [
            f"https://cdn.nba.com/headshots/nba/latest/260x190/{player_id}.png",
            f"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{player_id}.png",
        ]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.nba.com/'
        }
        
        for url in image_sources:
            try:
                response = requests.get(url, headers=headers, timeout=5)
                if response.status_code == 200:
                    with open(cache_file, 'wb') as f:
                        f.write(response.content)
                    
                    return Response(
                        response.content,
                        mimetype='image/png',
                        headers={
                            'Cache-Control': 'public, max-age=86400',
                            'Access-Control-Allow-Origin': '*'
                        }
                    )
            except:
                continue
        
        return Response(b'Image not available', status=404)
        
    except Exception as e:
        print(f"[PLAYER IMAGE] Error: {e}")
        return Response(b'Server error', status=500)

@app.route('/api/nba-image/<player_id>', methods=['GET'])
def nba_image_proxy(player_id):
    """Proxy NBA images to avoid CORS issues"""
    try:
        nba_url = f"https://cdn.nba.com/headshots/nba/latest/260x190/{player_id}.png"
        
        headers = {
            'X-Data-Source': 'NBA.com',
            'X-Attribution': 'Data and images © NBA Media Ventures, LLC.',
            'X-Usage': 'For educational/demonstration purposes only'
        }
        
        response = requests.get(nba_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return Response(
                response.content,
                mimetype='image/png',
                headers={
                    'Cache-Control': 'public, max-age=86400',
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'image/png'
                }
            )
        else:
            return Response(b'Image not found', status=404)
            
    except Exception as e:
        print(f"Image proxy error for player {player_id}: {e}")
        return Response(b'Server error', status=500)
    
@app.route('/api/player-stats-ranks', methods=['GET'])
@rate_limit_decorator
def get_player_stats_ranks():
    """Get ALL player statistics with ALL rankings"""
    try:
        season = request.args.get('season', '2025-26')
        per_mode = request.args.get('per_mode', 'PerGame')
        
        cache_key = f"player_stats_ranks_{season}_{per_mode}"
        
        def fetch_player_stats_ranks():
            print(f"[PLAYER STATS RANKS] Fetching ALL data for season: {season}")
            
            stats_data = safe_nba_call(
                leaguedashplayerstats.LeagueDashPlayerStats,
                season=season,
                per_mode_detailed=per_mode,
                timeout=60
            )
            
            df_stats = stats_data.get_data_frames()[0]
            print(f"[PLAYER STATS RANKS] Retrieved {len(df_stats)} players with {len(df_stats.columns)} columns")
            print(f"[PLAYER STATS RANKS] Columns: {list(df_stats.columns)}")
            
            # Convert ALL data to a list of dictionaries
            players_list = []
            for _, row in df_stats.iterrows():
                player_dict = {}
                for col in df_stats.columns:
                    player_dict[col] = clean_value(row[col])
                players_list.append(player_dict)
            
            return {
                'season': season,
                'per_mode': per_mode,
                'players': players_list,
                'count': len(players_list),
                'columns': list(df_stats.columns),
                'last_updated': datetime.now().isoformat()
            }
        
        data = cached_nba_data(cache_key, fetch_player_stats_ranks,
                              cache_minutes=CACHE_DURATIONS['player_stats_ranks'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER STATS RANKS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to fetch player statistics'
        }), 500

@app.route('/api/player-hustle-stats', methods=['GET'])
@rate_limit_decorator
def get_player_hustle_stats():
    """Get ALL player hustle statistics"""
    try:
        season = request.args.get('season', '2025-26')
        
        cache_key = f"player_hustle_stats_{season}"
        
        def fetch_player_hustle_stats():
            print(f"[PLAYER HUSTLE STATS] Fetching ALL hustle data for season: {season}")
            
            hustle_data = safe_nba_call(
                leaguehustlestatsplayer.LeagueHustleStatsPlayer,
                season=season,
                timeout=60
            )
            
            df_hustle = hustle_data.get_data_frames()[0]
            print(f"[PLAYER HUSTLE STATS] Retrieved {len(df_hustle)} players with {len(df_hustle.columns)} columns")
            print(f"[PLAYER HUSTLE STATS] Columns: {list(df_hustle.columns)}")
            
            # Convert ALL data to a list of dictionaries
            hustle_list = []
            for _, row in df_hustle.iterrows():
                player_dict = {}
                for col in df_hustle.columns:
                    player_dict[col] = clean_value(row[col])
                hustle_list.append(player_dict)
            
            return {
                'season': season,
                'players': hustle_list,
                'count': len(hustle_list),
                'columns': list(df_hustle.columns),
                'last_updated': datetime.now().isoformat()
            }
        
        data = cached_nba_data(cache_key, fetch_player_hustle_stats,
                              cache_minutes=CACHE_DURATIONS['player_hustle_stats'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER HUSTLE STATS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to fetch player hustle statistics'
        }), 500

@app.route('/api/player-estimated-metrics', methods=['GET'])
@rate_limit_decorator
def get_player_estimated_metrics():
    """Get ALL player estimated impact metrics"""
    try:
        season = request.args.get('season', '2025-26')
        
        cache_key = f"player_estimated_metrics_{season}"
        
        def fetch_player_estimated_metrics():
            print(f"[PLAYER ESTIMATED METRICS] Fetching ALL metrics data for season: {season}")
            
            metrics_data = safe_nba_call(
                playerestimatedmetrics.PlayerEstimatedMetrics,
                season=season,
                league_id="00",
                timeout=60
            )
            
            df_metrics = metrics_data.get_data_frames()[0]
            print(f"[PLAYER ESTIMATED METRICS] Retrieved {len(df_metrics)} players with {len(df_metrics.columns)} columns")
            print(f"[PLAYER ESTIMATED METRICS] Columns: {list(df_metrics.columns)}")
            
            # Convert ALL data to a list of dictionaries
            metrics_list = []
            for _, row in df_metrics.iterrows():
                player_dict = {}
                for col in df_metrics.columns:
                    player_dict[col] = clean_value(row[col])
                metrics_list.append(player_dict)
            
            return {
                'season': season,
                'players': metrics_list,
                'count': len(metrics_list),
                'columns': list(df_metrics.columns),
                'last_updated': datetime.now().isoformat()
            }
        
        data = cached_nba_data(cache_key, fetch_player_estimated_metrics,
                              cache_minutes=CACHE_DURATIONS['player_estimated_metrics'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER ESTIMATED METRICS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to fetch player estimated metrics'
        }), 500

# ========== COMBINED PLAYER DATA ENDPOINTS ==========

@app.route('/api/player/<player_id>/all-stats', methods=['GET'])
@rate_limit_decorator
def get_player_all_stats(player_id):
    """Get ALL stats for a specific player from all three datasets"""
    try:
        season = request.args.get('season', '2025-26')
        
        cache_key = f"player_all_stats_{player_id}_{season}"
        
        def fetch_player_all_stats():
            print(f"[PLAYER ALL STATS] Fetching ALL data for player {player_id}")
            
            # Fetch all three datasets
            stats_response = safe_nba_call(
                leaguedashplayerstats.LeagueDashPlayerStats,
                season=season,
                per_mode_detailed='PerGame',
                timeout=60
            )
            
            hustle_response = safe_nba_call(
                leaguehustlestatsplayer.LeagueHustleStatsPlayer,
                season=season,
                timeout=60
            )
            
            metrics_response = safe_nba_call(
                playerestimatedmetrics.PlayerEstimatedMetrics,
                season=season,
                league_id="00",
                timeout=60
            )
            
            df_stats = stats_response.get_data_frames()[0]
            df_hustle = hustle_response.get_data_frames()[0]
            df_metrics = metrics_response.get_data_frames()[0]
            
            player_id_int = int(player_id)
            
            # Find player in each dataset
            player_stats = None
            player_hustle = None
            player_metrics = None
            
            # Get basic stats
            stats_match = df_stats[df_stats['PLAYER_ID'] == player_id_int]
            if not stats_match.empty:
                player_stats = {}
                for col in df_stats.columns:
                    player_stats[col] = clean_value(stats_match.iloc[0][col])
            
            # Get hustle stats
            hustle_match = df_hustle[df_hustle['PLAYER_ID'] == player_id_int]
            if not hustle_match.empty:
                player_hustle = {}
                for col in df_hustle.columns:
                    player_hustle[col] = clean_value(hustle_match.iloc[0][col])
            
            # Get estimated metrics
            metrics_match = df_metrics[df_metrics['PLAYER_ID'] == player_id_int]
            if not metrics_match.empty:
                player_metrics = {}
                for col in df_metrics.columns:
                    player_metrics[col] = clean_value(metrics_match.iloc[0][col])
            
            return {
                'player_id': player_id_int,
                'season': season,
                'basic_stats': player_stats,
                'hustle_stats': player_hustle,
                'estimated_metrics': player_metrics,
                'has_data': {
                    'basic': player_stats is not None,
                    'hustle': player_hustle is not None,
                    'estimated': player_metrics is not None
                },
                'last_updated': datetime.now().isoformat()
            }
        
        data = cached_nba_data(cache_key, fetch_player_all_stats,
                              cache_minutes=180)
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER ALL STATS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/players/all-stats', methods=['GET'])
@rate_limit_decorator
def get_all_players_all_stats():
    """Get ALL stats for ALL players (for leaderboards/rankings)"""
    try:
        season = request.args.get('season', '2025-26')
        
        cache_key = f"all_players_all_stats_{season}"
        
        def fetch_all_players_all_stats():
            print(f"[ALL PLAYERS ALL STATS] Fetching ALL data for ALL players")
            
            # Fetch all three datasets
            stats_response = safe_nba_call(
                leaguedashplayerstats.LeagueDashPlayerStats,
                season=season,
                per_mode_detailed='PerGame',
                timeout=60
            )
            
            hustle_response = safe_nba_call(
                leaguehustlestatsplayer.LeagueHustleStatsPlayer,
                season=season,
                timeout=60
            )
            
            metrics_response = safe_nba_call(
                playerestimatedmetrics.PlayerEstimatedMetrics,
                season=season,
                league_id="00",
                timeout=60
            )
            
            df_stats = stats_response.get_data_frames()[0]
            df_hustle = hustle_response.get_data_frames()[0]
            df_metrics = metrics_response.get_data_frames()[0]
            
            # Merge all data into one dictionary by player_id
            all_players_data = {}
            
            # Process basic stats
            for _, row in df_stats.iterrows():
                player_id = row['PLAYER_ID']
                if player_id not in all_players_data:
                    all_players_data[player_id] = {
                        'player_id': player_id,
                        'player_name': row['PLAYER_NAME'],
                        'team': row['TEAM_ABBREVIATION']
                    }
                
                # Add ALL basic stats columns
                for col in df_stats.columns:
                    if col not in ['PLAYER_ID', 'PLAYER_NAME', 'TEAM_ABBREVIATION']:
                        all_players_data[player_id][col] = clean_value(row[col])
            
            # Process hustle stats
            for _, row in df_hustle.iterrows():
                player_id = row['PLAYER_ID']
                if player_id in all_players_data:
                    # Add ALL hustle stats columns
                    for col in df_hustle.columns:
                        if col not in ['PLAYER_ID', 'PLAYER_NAME', 'TEAM_ABBREVIATION']:
                            all_players_data[player_id][f'hustle_{col}'] = clean_value(row[col])
            
            # Process estimated metrics
            for _, row in df_metrics.iterrows():
                player_id = row['PLAYER_ID']
                if player_id in all_players_data:
                    # Add ALL estimated metrics columns
                    for col in df_metrics.columns:
                        if col not in ['PLAYER_ID', 'PLAYER_NAME']:
                            all_players_data[player_id][f'estimated_{col}'] = clean_value(row[col])
            
            # Convert to list
            players_list = list(all_players_data.values())
            
            return {
                'season': season,
                'players': players_list,
                'count': len(players_list),
                'stats_columns': list(df_stats.columns),
                'hustle_columns': list(df_hustle.columns),
                'metrics_columns': list(df_metrics.columns),
                'last_updated': datetime.now().isoformat()
            }
        
        data = cached_nba_data(cache_key, fetch_all_players_all_stats,
                              cache_minutes=180)
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[ALL PLAYERS ALL STATS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to fetch all players data'
        }), 500
    
@app.route('/api/player/<player_id>/all-ranking-stats', methods=['GET'])
@rate_limit_decorator
def get_player_all_ranking_stats(player_id):
    """Get ALL stats for a specific player from all datasets - comprehensive"""
    try:
        season = request.args.get('season', '2025-26')
        
        cache_key = f"player_all_ranking_stats_{player_id}_{season}"
        
        def fetch_player_all_ranking_stats():
            print(f"[PLAYER ALL RANKING STATS] Fetching ALL data for player {player_id}")
            
            # Fetch all three datasets
            stats_response = safe_nba_call(
                leaguedashplayerstats.LeagueDashPlayerStats,
                season=season,
                per_mode_detailed='PerGame',
                timeout=60
            )
            
            hustle_response = safe_nba_call(
                leaguehustlestatsplayer.LeagueHustleStatsPlayer,
                season=season,
                timeout=60
            )
            
            metrics_response = safe_nba_call(
                playerestimatedmetrics.PlayerEstimatedMetrics,
                season=season,
                league_id="00",
                timeout=60
            )
            
            df_stats = stats_response.get_data_frames()[0]
            df_hustle = hustle_response.get_data_frames()[0]
            df_metrics = metrics_response.get_data_frames()[0]
            
            player_id_int = int(player_id)
            
            # Initialize result with player info
            result = {
                'player_id': player_id_int,
                'season': season,
                'basic_stats': {},
                'hustle_stats': {},
                'estimated_metrics': {},
                'all_stats_flat': {},  # Combined flat structure
                'last_updated': datetime.now().isoformat()
            }
            
            # Get basic stats - ALL columns
            stats_match = df_stats[df_stats['PLAYER_ID'] == player_id_int]
            if not stats_match.empty:
                for col in df_stats.columns:
                    result['basic_stats'][col] = clean_value(stats_match.iloc[0][col])
                    result['all_stats_flat'][col] = clean_value(stats_match.iloc[0][col])
            
            # Get hustle stats - ALL columns
            hustle_match = df_hustle[df_hustle['PLAYER_ID'] == player_id_int]
            if not hustle_match.empty:
                for col in df_hustle.columns:
                    result['hustle_stats'][col] = clean_value(hustle_match.iloc[0][col])
                    result['all_stats_flat'][col] = clean_value(hustle_match.iloc[0][col])
            
            # Get estimated metrics - ALL columns
            metrics_match = df_metrics[df_metrics['PLAYER_ID'] == player_id_int]
            if not metrics_match.empty:
                for col in df_metrics.columns:
                    result['estimated_metrics'][col] = clean_value(metrics_match.iloc[0][col])
                    result['all_stats_flat'][col] = clean_value(metrics_match.iloc[0][col])
            
            return result
        
        data = cached_nba_data(cache_key, fetch_player_all_ranking_stats,
                              cache_minutes=180)
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER ALL RANKING STATS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500
    
@app.route('/api/player/<player_id>/stats-with-percentiles', methods=['GET'])
@rate_limit_decorator
def get_player_stats_with_percentiles(player_id):
    """Get ALL player stats with proper percentile calculations"""
    try:
        season = request.args.get('season', '2025-26')
        
        cache_key = f"player_stats_percentiles_{player_id}_{season}"
        
        def fetch_player_stats_with_percentiles():
            print(f"[PLAYER STATS PERCENTILES] Fetching data for player {player_id}")
            
            # Fetch all three datasets for ALL players
            stats_response = safe_nba_call(
                leaguedashplayerstats.LeagueDashPlayerStats,
                season=season,
                per_mode_detailed='PerGame',
                timeout=60
            )
            
            hustle_response = safe_nba_call(
                leaguehustlestatsplayer.LeagueHustleStatsPlayer,
                season=season,
                timeout=60
            )
            
            metrics_response = safe_nba_call(
                playerestimatedmetrics.PlayerEstimatedMetrics,
                season=season,
                league_id="00",
                timeout=60
            )
            
            df_stats = stats_response.get_data_frames()[0]
            df_hustle = hustle_response.get_data_frames()[0]
            df_metrics = metrics_response.get_data_frames()[0]
            
            player_id_int = int(player_id)
            
            # Find player in each dataset
            player_stats = {}
            player_hustle = {}
            player_metrics = {}
            
            # Get player basic stats
            stats_match = df_stats[df_stats['PLAYER_ID'] == player_id_int]
            if not stats_match.empty:
                for col in df_stats.columns:
                    player_stats[col] = clean_value(stats_match.iloc[0][col])
            
            # Get player hustle stats
            hustle_match = df_hustle[df_hustle['PLAYER_ID'] == player_id_int]
            if not hustle_match.empty:
                for col in df_hustle.columns:
                    player_hustle[col] = clean_value(hustle_match.iloc[0][col])
            
            # Get player estimated metrics
            metrics_match = df_metrics[df_metrics['PLAYER_ID'] == player_id_int]
            if not metrics_match.empty:
                for col in df_metrics.columns:
                    player_metrics[col] = clean_value(metrics_match.iloc[0][col])
            
            # Helper function to calculate percentile
            def calculate_percentile(df, column_name, player_value, higher_is_better=True):
                if player_value is None:
                    return None
                
                # Get all non-null values for this column
                valid_values = df[column_name].dropna()
                if len(valid_values) == 0:
                    return None
                
                if higher_is_better:
                    # Higher value is better (points, assists, etc.)
                    better_count = (valid_values > player_value).sum()
                    percentile = (1 - (better_count / len(valid_values))) * 100
                else:
                    # Lower value is better (turnovers, fouls, etc.)
                    better_count = (valid_values < player_value).sum()
                    percentile = (1 - (better_count / len(valid_values))) * 100
                
                return round(percentile, 1)
            
            # Calculate percentiles for hustle stats
            hustle_percentiles = {}
            hustle_columns_to_calc = [
                'DEFLECTIONS', 'CHARGES_DRAWN', 'SCREEN_ASSISTS', 'SCREEN_AST_PTS',
                'OFF_LOOSE_BALLS_RECOVERED', 'DEF_LOOSE_BALLS_RECOVERED', 'LOOSE_BALLS_RECOVERED',
                'OFF_BOXOUTS', 'DEF_BOXOUTS', 'BOX_OUT_PLAYER_TEAM_REBS', 'BOX_OUT_PLAYER_REBS', 'BOX_OUTS',
                'CONTESTED_SHOTS', 'CONTESTED_SHOTS_2PT', 'CONTESTED_SHOTS_3PT'
            ]
            
            for column in hustle_columns_to_calc:
                if column in player_hustle and player_hustle[column] is not None:
                    percentile = calculate_percentile(df_hustle, column, player_hustle[column], higher_is_better=True)
                    if percentile is not None:
                        hustle_percentiles[column] = percentile
            
            # For basic stats, use the pre-calculated ranks to compute percentiles
            basic_percentiles = {}
            basic_columns_with_ranks = [
                'PTS', 'REB', 'AST', 'STL', 'BLK', 'FGM', 'FGA', 'FG_PCT',
                'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT',
                'OREB', 'DREB', 'TOV', 'BLKA', 'PF', 'PFD', 'PLUS_MINUS',
                'MIN', 'GP', 'GS', 'W', 'L', 'W_PCT', 'NBA_FANTASY_PTS', 'DD2', 'TD3'
            ]
            
            total_players_basic = len(df_stats)
            for column in basic_columns_with_ranks:
                rank_key = f"{column}_RANK"
                if rank_key in player_stats and player_stats[rank_key] is not None:
                    rank = player_stats[rank_key]
                    if rank > 0:
                        # Determine if higher is better (most stats) or lower is better (TOV, PF, etc.)
                        higher_is_better = column not in ['TOV', 'BLKA', 'PF', 'L']
                        if higher_is_better:
                            percentile = (1 - (rank - 1) / total_players_basic) * 100
                        else:
                            percentile = ((rank - 1) / total_players_basic) * 100
                        basic_percentiles[column] = round(percentile, 1)
            
            # For estimated metrics, use pre-calculated ranks
            metrics_percentiles = {}
            metrics_columns_with_ranks = [
                'E_OFF_RATING', 'E_DEF_RATING', 'E_NET_RATING', 'E_PACE',
                'E_USG_PCT', 'E_AST_RATIO', 'E_OREB_PCT', 'E_DREB_PCT',
                'E_REB_PCT', 'E_TOV_PCT'
            ]
            
            total_players_estimated = len(df_metrics)
            
            for column in metrics_columns_with_ranks:
                rank_key = f"{column}_RANK"
                if rank_key in player_metrics and player_metrics[rank_key] is not None:
                    rank = player_metrics[rank_key]
                    if rank > 0 and total_players_estimated > 0:
                        # Calculate percentile based on rank
                        # For E_DEF_RATING, lower values are better (rank 1 = best defense)
                        if column == 'E_DEF_RATING':
                            # Invert the rank: rank 1 becomes 100%, rank N becomes 0%
                            percentile = ((total_players_estimated - rank + 1) / total_players_estimated) * 100
                        else:
                            # For all other metrics, rank 1 is best (100th percentile)
                            percentile = ((total_players_estimated - rank + 1) / total_players_estimated) * 100
                        
                        metrics_percentiles[column] = round(percentile, 1)
            
            return {
                'player_id': player_id_int,
                'season': season,
                'basic_stats': player_stats,
                'hustle_stats': player_hustle,
                'estimated_metrics': player_metrics,
                'percentiles': {
                    'basic': basic_percentiles,
                    'hustle': hustle_percentiles,
                    'estimated': metrics_percentiles
                },
                'total_players': {
                    'basic': total_players_basic,
                    'hustle': len(df_hustle),
                    'estimated': total_players_estimated
                },
                'last_updated': datetime.now().isoformat()
            }
        
        # Use the new cache duration
        data = cached_nba_data(cache_key, fetch_player_stats_with_percentiles,
                              cache_minutes=CACHE_DURATIONS['player_stats_percentiles'])
        
        return jsonify({
            'success': True,
            **data
        })
        
    except Exception as e:
        print(f"[PLAYER STATS PERCENTILES] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    memory_items = len(memory_cache)
    return jsonify({
        'status': 'healthy',
        'service': 'nba_games_api',
        'timestamp': pd.Timestamp.now().isoformat(),
        'cache': {
            'memory_items': memory_items,
            'cache_dir': CACHE_DIR
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)