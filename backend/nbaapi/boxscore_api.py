"""
Flask API endpoints for box scores
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from nba_boxscore_safe import get_boxscore_client
import logging
from datetime import datetime
import time
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Get the safe client
client = get_boxscore_client()

@app.route('/api/boxscore/<game_id>', methods=['GET'])
def get_boxscore(game_id):
    """
    Get complete box score for a game
    
    Query parameters:
        refresh: If true, ignore cache and fetch fresh data
        simple: If true, return simplified player stats only
    """
    try:
        # Get query parameters
        force_refresh = request.args.get('refresh', 'false').lower() == 'true'
        simple_format = request.args.get('simple', 'false').lower() == 'true'
        
        # Get box score data
        data = client.get_player_stats(game_id)
        
        if data['success']:
            if simple_format:
                # Return simplified version for frontend
                simplified = {
                    'success': True,
                    'game_id': game_id,
                    'home_team': data['game']['home_team'],
                    'away_team': data['game']['away_team'],
                    'players': [
                        {
                            'name': p['name'],
                            'team': p['team_city'],
                            'points': p['points'],
                            'rebounds': p['rebounds'],
                            'assists': p['assists'],
                            'minutes': p['minutes'],
                            'fg': f"{p['fg_made']}/{p['fg_attempted']}",
                            'three': f"{p['three_made']}/{p['three_attempted']}"
                        }
                        for p in data['players']
                    ],
                    'attribution': data['attribution']
                }
                return jsonify(simplified)
            else:
                return jsonify(data)
        else:
            return jsonify({
                'success': False,
                'error': data.get('error', 'Unknown error'),
                'game_id': game_id
            }), 404
            
    except Exception as e:
        logging.error(f"Error in boxscore endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'game_id': game_id
        }), 500

@app.route('/api/boxscore/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'nba_boxscore_api',
        'cache_dir': client.cache_dir,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/boxscore/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the cache (admin endpoint)"""
    import shutil
    try:
        if os.path.exists(client.cache_dir):
            shutil.rmtree(client.cache_dir)
            os.makedirs(client.cache_dir, exist_ok=True)
            return jsonify({'success': True, 'message': 'Cache cleared'})
        else:
            return jsonify({'success': False, 'error': 'Cache directory not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Rate limiting middleware
@app.before_request
def rate_limit():
    """Simple rate limiting"""
    from flask import g
    g.request_start_time = time.time()

@app.after_request
def add_rate_limit_headers(response):
    """Add rate limiting headers to responses"""
    from flask import g
    if hasattr(g, 'request_start_time'):
        response.headers['X-Response-Time'] = time.time() - g.request_start_time
    response.headers['X-RateLimit-Limit'] = '10'
    response.headers['X-RateLimit-Remaining'] = '9'  # Simplified
    return response

if __name__ == '__main__':
    # Run on different port than your games.py
    app.run(debug=True, port=5002, host='0.0.0.0')