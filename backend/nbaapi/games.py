from flask import Flask, jsonify, Response, send_file, request
import io
from flask_cors import CORS
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder
from nba_boxscore_safe import get_boxscore_client  # Import the client
from nba_api.stats.endpoints import leaguestandings
from nba_api.stats.endpoints import commonteamroster
from nba_api.stats.endpoints import playercareerstats
import requests
import numpy as np
import time
import random
import pickle
import os
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"])


# Create the boxscore client instance
boxscore_client = get_boxscore_client()

# ========== SIMPLE FIXES ==========

def safe_nba_call(api_func, *args, **kwargs):
    """Simple wrapper with retry logic for NBA API calls"""
    max_retries = 3
    last_error = None
    
    # Add timeout and headers if not provided
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
                print(f"[NBA API] Attempt {attempt + 1} failed: {e}. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
    
    raise last_error

# Rate limiting decorator
def rate_limit_decorator(func):
    """Decorator for rate limiting"""
    request_times = {}
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        ip = request.remote_addr
        current_time = time.time()
        
        # Clean old requests
        if ip in request_times:
            request_times[ip] = [t for t in request_times[ip] if current_time - t < 60]  # 60 second window
        else:
            request_times[ip] = []
        
        # Check rate limit
        if len(request_times[ip]) >= 100:  # 100 requests per minute
            return jsonify({
                'success': False,
                'error': 'Rate limit exceeded',
                'message': 'Please wait 60 seconds before making more requests',
                'timestamp': datetime.now().isoformat()
            }), 429
        
        # Add current request
        request_times[ip].append(current_time)
        
        return func(*args, **kwargs)
    
    return wrapper

# Caching function
CACHE_DIR = 'nba_cache'
os.makedirs(CACHE_DIR, exist_ok=True)

def cached_nba_data(cache_key, fetch_func, cache_minutes=30, force_refresh=False):
    """
    Cache NBA data to avoid repeated API calls
    """
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.pkl")
    
    # Check if we should force refresh
    if not force_refresh and os.path.exists(cache_file):
        file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if file_age < timedelta(minutes=cache_minutes):
            print(f"[CACHE] Loading from cache: {cache_key}")
            try:
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                print(f"[CACHE] Error loading cache {cache_key}: {e}")
                # Continue to fetch fresh data
    
    # Fetch fresh data
    print(f"[CACHE] Fetching fresh data: {cache_key}")
    try:
        data = fetch_func()
        
        # Save to cache
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(data, f)
            print(f"[CACHE] Saved to cache: {cache_key}")
        except Exception as e:
            print(f"[CACHE] Error saving cache {cache_key}: {e}")
        
        return data
    except Exception as e:
        # If fetch fails but we have stale cache, use it
        if os.path.exists(cache_file) and cache_minutes < 1440:  # Less than 24 hours old
            try:
                print(f"[CACHE] Using stale cache due to fetch error: {cache_key}")
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except:
                pass
        raise e

# Safe NBA API call function (you might already have this, but here's a version if not)
def safe_nba_call(api_func, *args, **kwargs):
    """Simple wrapper with retry logic for NBA API calls"""
    max_retries = 3
    last_error = None
    
    # Add timeout and headers if not provided
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
                print(f"[NBA API] Attempt {attempt + 1} failed: {e}. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
    
    raise last_error

@app.route('/api/nba-games', methods=['GET'])
def get_nba_games_fixed():
    try:
        print("[DEBUG] Starting /api/nba-games endpoint...")
        pd.set_option('display.max_columns', None)
        
        print("[DEBUG] Fetching games from NBA API...")
        # Use safe wrapper
        gamefinder = safe_nba_call(
            leaguegamefinder.LeagueGameFinder,
            league_id_nullable='00',
            timeout=60
        )
        games = gamefinder.get_data_frames()[0]
        print(f"[DEBUG] Total games fetched: {len(games)}")
        
        # ... REST OF YOUR ORIGINAL CODE EXACTLY AS YOU HAD IT ...
        # Check what season IDs we have
        print(f"[DEBUG] Unique season IDs: {games['SEASON_ID'].unique()[:10]}")
        
        # Get all games for 2025-26 season - try multiple possible IDs
        # The season ID might be different format
        games_2526 = games[games.SEASON_ID == '22025']
        print(f"[DEBUG] Games for season '22025': {len(games_2526)}")
        
        # If no games found with '22025', try other formats
        if len(games_2526) == 0:
            print("[DEBUG] Trying alternative season IDs...")
            # Try to find any recent season
            recent_seasons = [s for s in games['SEASON_ID'].unique() if s.startswith('2')]
            print(f"[DEBUG] Recent seasons available: {recent_seasons[:5]}")
            # Use the most recent season
            if recent_seasons:
                recent_season = recent_seasons[0]
                print(f"[DEBUG] Using season: {recent_season}")
                games_2526 = games[games.SEASON_ID == recent_season]
        
        # CRITICAL: Make a copy to avoid SettingWithCopyWarning
        games_2526 = games_2526.copy()
        print(f"[DEBUG] Created copy, shape: {games_2526.shape}")
        
        # Rest of your function...
        
        # Use more flexible pattern matching
        def is_home_game(matchup):
            """Check if matchup indicates a home game"""
            if not isinstance(matchup, str):
                return False
            
            # Check for various home game indicators
            home_indicators = [
                ' vs. ',  # Standard
                ' vs ',   # Without period
                ' v. ',   # Abbreviated
                ' v ',    # More abbreviated
                '(Home)', # Explicit
            ]
            
            matchup_lower = matchup.lower()
            for indicator in home_indicators:
                if indicator in matchup_lower:
                    return True
            
            # Also check for " vs" at the end (without space after)
            if matchup_lower.endswith(' vs') or matchup_lower.endswith(' vs.'):
                return True
            
            return False
        
        def is_away_game(matchup):
            """Check if matchup indicates an away game"""
            if not isinstance(matchup, str):
                return False
            
            # Check for various away game indicators
            away_indicators = [
                ' @ ',     # Standard
                ' at ',    # Full word
                '(Away)',  # Explicit
            ]
            
            matchup_lower = matchup.lower()
            for indicator in away_indicators:
                if indicator in matchup_lower:
                    return True
            
            return False
        
        # Apply the flexible matching
        games_2526['IS_HOME'] = games_2526['MATCHUP'].apply(is_home_game)
        games_2526['IS_AWAY'] = games_2526['MATCHUP'].apply(is_away_game)
        
        # Count for debugging
        home_count = games_2526['IS_HOME'].sum()
        away_count = games_2526['IS_AWAY'].sum()
        neither_count = len(games_2526) - home_count - away_count
        
        print(f"Home games: {home_count}")
        print(f"Away games: {away_count}")
        print(f"Neither: {neither_count}")
        
        # Group games
        games_by_id = {}
        home_games = games_2526[games_2526['IS_HOME']]
        
        for _, game in home_games.iterrows():
            game_id = game['GAME_ID']
            if game_id not in games_by_id:
                # Find the away team data for this game
                away_game_data = games_2526[
                    (games_2526['GAME_ID'] == game_id) & 
                    (games_2526['IS_AWAY'])
                ]
                
                # Get away team if it exists
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
                
                # Get home team data
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
                
                # Create game structure
                games_by_id[game_id] = {
                    'game_id': game_id,
                    'game_date': game['GAME_DATE'],
                    'matchup': game['MATCHUP'],
                    'season_id': game['SEASON_ID'],
                    'teams': [home_team]
                }
                
                if away_team:
                    games_by_id[game_id]['teams'].append(away_team)
        
        # Handle games without clear home/away pattern
        all_game_ids = set(games_2526['GAME_ID'].unique())
        processed_game_ids = set(games_by_id.keys())
        unprocessed_game_ids = all_game_ids - processed_game_ids
        
        print(f"\nUnprocessed games (no clear home/away): {len(unprocessed_game_ids)}")
        
        # For games without clear pattern, just take first entry per game
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
                
                # Add all teams for this game
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
        
        # Convert to list and sort
        structured_games = list(games_by_id.values())
        structured_games.sort(key=lambda x: x['game_date'], reverse=True)
        
        return jsonify({
            'success': True,
            'games': structured_games,
            'count': len(structured_games),
            'stats': {
                'unique_game_ids': len(all_game_ids),
                'games_with_home_away': len(processed_game_ids),
                'games_without_pattern': len(unprocessed_game_ids),
                'total_processed': len(structured_games)
            }
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
        # Use the safe boxscore client
        data = boxscore_client.get_player_stats(game_id)
        
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
        print(f"[SIMPLE BOXSCORE] Getting data for game: {game_id}")
        
        data = boxscore_client.get_player_stats(game_id)
        print(f"[SIMPLE BOXSCORE] Client response keys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data returned from boxscore client',
                'game_id': game_id
            }), 404
        
        if isinstance(data, dict) and data.get('success', False):
            # Create simplified response WITHOUT team_totals
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
                # Removed 'team_totals' key since it doesn't exist
            }
            
            print(f"[SIMPLE BOXSCORE] Success! Returning {len(simplified['players'])} players")
            return jsonify(simplified)
        else:
            error_msg = data.get('error', 'Unknown error') if isinstance(data, dict) else 'Invalid response format'
            return jsonify({
                'success': False,
                'error': error_msg,
                'game_id': game_id
            }), 404
            
    except KeyError as e:
        print(f"[SIMPLE BOXSCORE] KeyError: Missing key {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Missing data key: {str(e)}',
            'game_id': game_id
        }), 500
    except Exception as e:
        print(f"[SIMPLE BOXSCORE] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'game_id': game_id
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'nba_games_api',
        'timestamp': pd.Timestamp.now().isoformat()
    })

@app.route('/api/nba-image/<player_id>', methods=['GET'])
def nba_image_proxy(player_id):
    """Proxy NBA images to avoid CORS issues"""
    import requests
    from flask import Response
    
    try:
        # NBA CDN URL
        nba_url = f"https://cdn.nba.com/headshots/nba/latest/260x190/{player_id}.png"
        
        # Fetch the image with proper headers
        headers = {
            'X-Data-Source': 'NBA.com',
            'X-Attribution': 'Data and images © NBA Media Ventures, LLC.',
            'X-Usage': 'For educational/demonstration purposes only'
        }
        
        response = requests.get(nba_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Return the image with CORS headers
            return Response(
                response.content,
                mimetype='image/png',
                headers={
                    'Cache-Control': 'public, max-age=86400',  # Cache for 1 day
                    'Access-Control-Allow-Origin': '*',  # Allow all origins
                    'Content-Type': 'image/png'
                }
            )
        else:
            # Return a 404
            return Response(b'Image not found', status=404)
            
    except Exception as e:
        print(f"Image proxy error for player {player_id}: {e}")
        return Response(b'Server error', status=500)


@app.route('/api/player/<player_id>/image', methods=['GET'])
def player_image(player_id):
    """Get player image with multiple fallback sources"""
    import requests
    from flask import Response
    
    # Try multiple image sources
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
    
    # If all fail, return a placeholder or 404
    return Response(b'Image not available', status=404)


@app.route('/api/standings', methods=['GET'])
def get_standings():
    """Get NBA standings for current season"""
    try:
        # Get parameters from request
        season = request.args.get('season', '2025-26')
        league_id = request.args.get('league_id', '00')
        
        print(f"[STANDINGS] Fetching standings for season: {season}")
        
        # Use safe wrapper for NBA API call
        standings_data = safe_nba_call(
            leaguestandings.LeagueStandings,
            league_id=league_id,
            season=season,
            timeout=60
        )
        
        # Get the DataFrame
        df_standings = standings_data.get_data_frames()[0]
        
        print(f"[STANDINGS] Retrieved {len(df_standings)} teams")
        
        # Helper function to parse record strings like "18-2"
        def parse_record(record_str):
            """Parse a record string like '18-2' or '25-10' into wins and losses"""
            if isinstance(record_str, str) and '-' in record_str:
                try:
                    wins_str, losses_str = record_str.split('-')
                    return int(wins_str), int(losses_str)
                except:
                    return 0, 0
            return 0, 0
        
        # Convert to clean JSON format
        standings_list = []
        for _, team in df_standings.iterrows():
            # Parse record strings
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
                'playoff_rank': int(team['PlayoffRank']),  # Conference rank (1-15)
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
        
        # Sort by conference and playoff rank
        eastern_conf = sorted(
            [t for t in standings_list if t['team_conference'] == 'East'],
            key=lambda x: (x['playoff_rank'])
        )
        
        western_conf = sorted(
            [t for t in standings_list if t['team_conference'] == 'West'],
            key=lambda x: (x['playoff_rank'])
        )
        
        return jsonify({
            'success': True,
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
        })
        
    except Exception as e:
        print(f"[STANDINGS] Error: {str(e)}")
        import traceback
        traceback.print_exc()
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
        
        # Use safe wrapper
        standings_data = safe_nba_call(
            leaguestandings.LeagueStandings,
            league_id='00',
            season=season,
            timeout=60
        )
        
        df_standings = standings_data.get_data_frames()[0]
        
        # Helper function to parse record strings
        def parse_record(record_str):
            if isinstance(record_str, str) and '-' in record_str:
                try:
                    wins_str, losses_str = record_str.split('-')
                    return int(wins_str), int(losses_str)
                except:
                    return 0, 0
            return 0, 0
        
        # Simplified format
        simple_standings = []
        for _, team in df_standings.iterrows():
            # Parse records
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
                'conference_rank': int(team['PlayoffRank']),  # PlayoffRank is the conference rank
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
        
        return jsonify({
            'success': True,
            'season': season,
            'standings': simple_standings
        })
        
    except Exception as e:
        print(f"[SIMPLE STANDINGS] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/standings/minimal', methods=['GET'])
def get_minimal_standings():
    """Get minimal standings data - just essentials"""
    try:
        season = request.args.get('season', '2025-26')
        
        # Use safe wrapper
        standings_data = safe_nba_call(
            leaguestandings.LeagueStandings,
            league_id='00',
            season=season,
            timeout=60
        )
        
        df_standings = standings_data.get_data_frames()[0]
        
        # Minimal format - just what's needed for basic display
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
        
        # Sort by conference and rank
        eastern = sorted(
            [t for t in minimal_standings if t['conference'] == 'East'],
            key=lambda x: x['conference_rank']
        )
        
        western = sorted(
            [t for t in minimal_standings if t['conference'] == 'West'],
            key=lambda x: x['conference_rank']
        )
        
        return jsonify({
            'success': True,
            'season': season,
            'eastern_conference': eastern,
            'western_conference': western
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/team-logo/<team_id>', methods=['GET'])
def get_team_logo(team_id):
    """Get team logo"""
    try:
        # NBA logo URLs pattern
        logo_url = f"https://cdn.nba.com/logos/nba/{team_id}/primary/L/logo.svg"
        
        # Fetch the logo
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.nba.com/'
        }
        response = requests.get(logo_url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            return Response(
                response.content,
                mimetype='image/svg+xml',
                headers={
                    'Cache-Control': 'public, max-age=86400',
                    'Access-Control-Allow-Origin': '*'
                }
            )
        else:
            # Return a placeholder
            return Response(b'<svg><!-- Placeholder --></svg>', mimetype='image/svg+xml')
            
    except Exception as e:
        return Response(b'<svg><!-- Error --></svg>', mimetype='image/svg+xml')
    

@app.route('/api/team/<team_id>/roster', methods=['GET'])
def get_team_roster(team_id):
    """Get team roster with player details"""
    try:
        # Get parameters
        season = request.args.get('season', '2025-26')
        
        print(f"[ROSTER] Fetching roster for team {team_id}, season {season}")
        
        # Get roster data with retry logic
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
                # Success - break out of retry loop
                break
            except Exception as e:
                print(f"[ROSTER] Attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise e
                # Wait before retrying
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                print(f"[ROSTER] Waiting {wait_time:.1f} seconds before retry...")
                time.sleep(wait_time)
        
        # Get the dataframes
        df_roster = roster_data.get_data_frames()[0]  # Players
        df_coaches = roster_data.get_data_frames()[1]  # Coaches
        
        print(f"[ROSTER] Columns available: {list(df_roster.columns)}")
        
        # Convert player roster to list
        players = []
        for _, player in df_roster.iterrows():
            # Format height (handle NaN and different formats)
            height = player['HEIGHT']
            height_display = str(height)
            if pd.notna(height) and isinstance(height, str):
                if '-' in height:
                    feet, inches = height.split('-')
                    height_display = f"{feet}'{inches}\""
            
            # Format weight
            weight = player['WEIGHT']
            if pd.isna(weight):
                weight_display = "N/A"
            else:
                try:
                    weight_display = f"{int(weight)} lbs"
                except:
                    weight_display = str(weight)
            
            # Format experience
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
            
            # Get jersey number
            jersey_number = ''
            if 'NUM' in player:
                jersey_number = str(player['NUM'])
            elif 'JERSEY_NUMBER' in player:  # Some APIs use different column names
                jersey_number = str(player['JERSEY_NUMBER'])
            
            # Get position
            position = player.get('POSITION', 'N/A')
            
            # Get college
            college = player.get('SCHOOL', '')
            if pd.isna(college) or college == '':
                college = 'Not Available'
            
            # Get birth date
            birth_date = player.get('BIRTH_DATE', '')
            if pd.isna(birth_date):
                birth_date = 'N/A'
            
            # Get age
            age = player.get('AGE')
            if pd.isna(age):
                age_display = None
            else:
                try:
                    age_display = int(age)
                except:
                    age_display = None
            
            # Get nickname/player slug for display name
            player_name = player.get('PLAYER', '')
            nickname = player.get('NICKNAME', '')
            player_slug = player.get('PLAYER_SLUG', '')
            
            # Use nickname if available, otherwise use full name
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
        
        # Convert coaches to list (check for correct column names)
        coaches = []
        if not df_coaches.empty:
            print(f"[ROSTER] Coach columns: {list(df_coaches.columns)}")
            
            # Map column names (they might vary)
            coach_name_col = next((col for col in df_coaches.columns if 'COACH' in col and 'NAME' in col), None)
            coach_type_col = next((col for col in df_coaches.columns if 'COACH' in col and 'TYPE' in col), None)
            is_assistant_col = next((col for col in df_coaches.columns if 'ASSISTANT' in col or 'IS_' in col), None)
            sort_seq_col = next((col for col in df_coaches.columns if 'SORT' in col or 'SEQUENCE' in col), None)
            
            for _, coach in df_coaches.iterrows():
                coach_name = coach[coach_name_col] if coach_name_col else 'Unknown Coach'
                coach_type = coach[coach_type_col] if coach_type_col else 'Unknown'
                
                # Determine if assistant
                is_assistant = False
                if is_assistant_col:
                    is_assistant_val = coach[is_assistant_col]
                    if pd.notna(is_assistant_val):
                        if isinstance(is_assistant_val, (int, float)):
                            is_assistant = is_assistant_val == 1
                        else:
                            is_assistant = str(is_assistant_val).lower() in ['true', 'yes', '1', 'assistant']
                else:
                    # Guess based on coach type
                    is_assistant = 'assistant' in str(coach_type).lower() or coach_type != 'Head Coach'
                
                # Get sort sequence
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
        
        # Sort coaches: Head coach first, then assistants
        coaches.sort(key=lambda x: (
            not any(word in x['coach_type'].lower() for word in ['head', 'head coach', 'hc']),
            x['sort_sequence']
        ))
        
        return jsonify({
            'success': True,
            'team_id': int(team_id),
            'season': season,
            'last_updated': pd.Timestamp.now().isoformat(),
            'roster': {
                'players': players,
                'player_count': len(players),
                'coaches': coaches,
                'coach_count': len(coaches),
                'metadata': {
                    'player_columns_found': list(df_roster.columns),
                    'coach_columns_found': list(df_coaches.columns) if not df_coaches.empty else []
                }
            }
        })
        
    except Exception as e:
        print(f"[ROSTER] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'team_id': team_id
        }), 500

@app.route('/api/player/<player_id>/profile', methods=['GET'])
def get_player_profile(player_id):
    """Get detailed player profile information"""
    try:
        from nba_api.stats.endpoints import commonplayerinfo, playercareerstats
        
        print(f"[PLAYER PROFILE] Fetching profile for player ID: {player_id}")
        
        # Get player info - EXACTLY as you showed
        player_info = safe_nba_call(
            commonplayerinfo.CommonPlayerInfo,
            player_id=player_id,
            timeout=45
        )
        df_info = player_info.get_data_frames()[0]
        
        if df_info.empty:
            return jsonify({
                'success': False,
                'error': f'Player with ID {player_id} not found'
            }), 404
        
        # Get career stats
        career_stats = safe_nba_call(
            playercareerstats.PlayerCareerStats,
            player_id=player_id,
            timeout=45
        )
        df_career = career_stats.get_data_frames()[0]
        
        # Get the first row - EXACTLY as your DataFrame shows
        row = df_info.iloc[0]
        
        # Helper to convert numpy/pandas types to JSON serializable
        def clean_value(value):
            if pd.isna(value):
                return None
            # Convert numpy types
            if hasattr(value, 'item'):
                return value.item()
            return value
        
        # Extract ALL fields from YOUR EXACT DataFrame
        player_data = {
            'PERSON_ID': clean_value(row['PERSON_ID']),
            'FIRST_NAME': clean_value(row['FIRST_NAME']),
            'LAST_NAME': clean_value(row['LAST_NAME']),
            'DISPLAY_FIRST_LAST': clean_value(row['DISPLAY_FIRST_LAST']),
            'DISPLAY_LAST_COMMA_FIRST': clean_value(row['DISPLAY_LAST_COMMA_FIRST']),
            'DISPLAY_FI_LAST': clean_value(row['DISPLAY_FI_LAST']),
            'PLAYER_SLUG': clean_value(row['PLAYER_SLUG']),
            'BIRTHDATE': clean_value(row['BIRTHDATE']),
            'SCHOOL': clean_value(row['SCHOOL']),
            'COUNTRY': clean_value(row['COUNTRY']),
            'LAST_AFFILIATION': clean_value(row['LAST_AFFILIATION']),
            'HEIGHT': clean_value(row['HEIGHT']),
            'WEIGHT': clean_value(row['WEIGHT']),
            'SEASON_EXP': clean_value(row['SEASON_EXP']),
            'JERSEY': clean_value(row['JERSEY']),
            'POSITION': clean_value(row['POSITION']),
            'ROSTERSTATUS': clean_value(row['ROSTERSTATUS']),
            'GAMES_PLAYED_CURRENT_SEASON_FLAG': clean_value(row['GAMES_PLAYED_CURRENT_SEASON_FLAG']),
            'TEAM_ID': clean_value(row['TEAM_ID']),
            'TEAM_NAME': clean_value(row['TEAM_NAME']),
            'TEAM_ABBREVIATION': clean_value(row['TEAM_ABBREVIATION']),
            'TEAM_CODE': clean_value(row['TEAM_CODE']),
            'TEAM_CITY': clean_value(row['TEAM_CITY']),
            'PLAYERCODE': clean_value(row['PLAYERCODE']),
            'FROM_YEAR': clean_value(row['FROM_YEAR']),
            'TO_YEAR': clean_value(row['TO_YEAR']),
            'DLEAGUE_FLAG': clean_value(row['DLEAGUE_FLAG']),
            'NBA_FLAG': clean_value(row['NBA_FLAG']),
            'GAMES_PLAYED_FLAG': clean_value(row['GAMES_PLAYED_FLAG']),
            'DRAFT_YEAR': clean_value(row['DRAFT_YEAR']),
            'DRAFT_ROUND': clean_value(row['DRAFT_ROUND']),
            'DRAFT_NUMBER': clean_value(row['DRAFT_NUMBER']),
            'GREATEST_75_FLAG': clean_value(row['GREATEST_75_FLAG'])
        }
        
        # Process career stats if available
        career_stats_data = []
        if not df_career.empty:
            # Get regular season stats (SEASON_ID starting with '2')
            regular_season = df_career[df_career['SEASON_ID'].astype(str).str.startswith('2')]
            
            # Get last 5 seasons
            for _, season in regular_season.head(5).iterrows():
                season_dict = {}
                # Add all columns from the career stats DataFrame
                for col in df_career.columns:
                    season_dict[col] = clean_value(season[col])
                career_stats_data.append(season_dict)
        
        # Return the EXACT data from the DataFrame
        return jsonify({
            'success': True,
            'player_info': player_data,
            'career_stats': career_stats_data[:5] if career_stats_data else [],
            'has_career_stats': not df_career.empty
        })
        
    except Exception as e:
        print(f"[PLAYER PROFILE] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500
    
@app.route('/api/player/<player_id>/career-stats', methods=['GET'])
@rate_limit_decorator
def get_player_career_stats(player_id):
    """Get RAW career statistics for a player - NO CHANGES"""
    try:
        print(f"[CAREER STATS RAW] Fetching raw career stats for player ID: {player_id}")
        
        # Get the raw data
        career = playercareerstats.PlayerCareerStats(
            player_id=player_id,
            timeout=60,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.nba.com/'
            }
        )
        
        # Get the raw DataFrame
        df_raw = career.get_data_frames()[0]
        
        print(f"[CAREER STATS RAW] Raw DataFrame shape: {df_raw.shape}")
        print(f"[CAREER STATS RAW] Columns: {list(df_raw.columns)}")
        
        if df_raw.empty:
            return jsonify({
                'success': False,
                'error': f'Career stats not found for player ID {player_id}'
            }), 404
        
        # Convert to list of dictionaries - EXACTLY as they are
        raw_data = []
        for _, row in df_raw.iterrows():
            row_dict = {}
            for col in df_raw.columns:
                # Keep everything exactly as it is
                row_dict[col] = row[col] if not pd.isna(row[col]) else None
            raw_data.append(row_dict)
        
        # Return RAW data - no processing, no categorizing
        return jsonify({
            'success': True,
            'player_id': player_id,
            'raw_data': raw_data,  # ALL rows, ALL columns, exactly as they come
            'columns': list(df_raw.columns),  # All 27 column names
            'row_count': len(raw_data)
        })
        
    except Exception as e:
        print(f"[CAREER STATS RAW] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500

# Add this import at the top with other imports
from nba_api.stats.endpoints import playergamelog

# Add this endpoint after your other player endpoints
@app.route('/api/player/<player_id>/gamelogs', methods=['GET'])
def get_player_gamelogs(player_id):
    """Get game-by-game statistics for a player - RAW DATA ONLY"""
    try:
        # Get parameters from request
        season = request.args.get('season', '2025-26')
        season_type = request.args.get('season_type', 'Regular Season')
        
        print(f"[GAMELOGS] Fetching gamelogs for player ID: {player_id}, season: {season}")
        
        # Get gamelogs data
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
        
        # Get the DataFrame
        df_gamelogs = gamelogs.get_data_frames()[0]
        
        print(f"[GAMELOGS] Raw DataFrame shape: {df_gamelogs.shape}")
        print(f"[GAMELOGS] Columns: {list(df_gamelogs.columns)}")
        
        if df_gamelogs.empty:
            return jsonify({
                'success': True,
                'player_id': player_id,
                'gamelogs': [],
                'count': 0,
                'message': 'No game logs found'
            })
        
        # Convert DataFrame to list of dictionaries - RAW DATA ONLY
        gamelogs_list = []
        for _, row in df_gamelogs.iterrows():
            # Get all columns as they are
            game_log = {}
            for col in df_gamelogs.columns:
                value = row[col]
                # Convert numpy types to Python types
                if pd.isna(value):
                    game_log[col] = None
                elif hasattr(value, 'item'):  # numpy types
                    game_log[col] = value.item()
                else:
                    game_log[col] = value
            gamelogs_list.append(game_log)
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'season': season,
            'season_type': season_type,
            'gamelogs': gamelogs_list,
            'columns': list(df_gamelogs.columns),
            'count': len(gamelogs_list)
        })
        
    except Exception as e:
        print(f"[GAMELOGS] Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500
    
# Add this to your games.py file after the existing player endpoints
@app.route('/api/player/<player_id>/all-season-gamelogs', methods=['GET'])
def get_all_season_gamelogs(player_id):
    """Get game logs for all seasons for a player - CACHED VERSION"""
    try:
        from nba_api.stats.endpoints import playergamelog
        
        print(f"[ALL SEASON GAMELOGS] Fetching for player ID: {player_id}")
        
        # First, get player's career to find all seasons
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
            return jsonify({
                'success': True,
                'player_id': player_id,
                'seasons': {},
                'count': 0,
                'message': 'No career data found'
            })
        
        # Get unique regular seasons (starting with '2')
        unique_seasons = df_career[
            df_career['SEASON_ID'].astype(str).str.startswith('2')
        ]['SEASON_ID'].unique()
        
        print(f"[ALL SEASON GAMELOGS] Found seasons: {unique_seasons}")
        
        all_season_data = {}
        
        for season_id in unique_seasons:
            try:
                season_str = str(season_id)
                print(f"[ALL SEASON GAMELOGS] Processing season: {season_str}")
                
                # Convert season ID to proper format
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
                
                # Use cached version to avoid rate limiting
                cache_key = f"gamelogs_{player_id}_{season_formatted}"
                
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
                
                # Cache for 24 hours (1440 minutes)
                df_season = cached_nba_data(cache_key, fetch_season_gamelogs, cache_minutes=1440)
                
                if not df_season.empty:
                    print(f"[ALL SEASON GAMELOGS] Found {len(df_season)} games for {season_formatted}")
                    
                    # Convert to list
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
                
                # Small delay to be nice to the API
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
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'seasons': all_season_data,
            'total_seasons': len(all_season_data),
            'total_games': sum(data['game_count'] for data in all_season_data.values())
        })
        
    except Exception as e:
        print(f"[ALL SEASON GAMELOGS] General error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'player_id': player_id
        }), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)