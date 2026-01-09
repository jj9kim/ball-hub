from flask import Flask, jsonify, Response, send_file, request
import io
from flask_cors import CORS
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder
from nba_boxscore_safe import get_boxscore_client  # Import the client
from nba_api.stats.endpoints import leaguestandings
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Create the boxscore client instance
boxscore_client = get_boxscore_client()

@app.route('/api/nba-games', methods=['GET'])
def get_nba_games_fixed():
    try:
        pd.set_option('display.max_columns', None)
        
        gamefinder = leaguegamefinder.LeagueGameFinder(league_id_nullable='00')
        games = gamefinder.get_data_frames()[0]
        
        # Get all games for 2025-26 season
        games_2526 = games[games.SEASON_ID == '22025']
        
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
        'endpoints': {
            'games': '/api/nba-games',
            'boxscore': '/api/game/<id>/boxscore',
            'simple_boxscore': '/api/game/<id>/simple-boxscore'
        },
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
        
        # Get standings from NBA API
        standings_data = leaguestandings.LeagueStandings(
            league_id=league_id,
            season=season
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
        
        standings_data = leaguestandings.LeagueStandings(
            league_id='00',
            season=season
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
        
        standings_data = leaguestandings.LeagueStandings(
            league_id='00',
            season=season
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


if __name__ == '__main__':
    app.run(debug=True, port=5000)