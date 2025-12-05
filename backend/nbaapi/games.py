from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

@app.route('/api/nba-games', methods=['GET'])
def get_nba_games():
    try:
        # Set option to display all columns
        pd.set_option('display.max_columns', None)
        
        gamefinder = leaguegamefinder.LeagueGameFinder(league_id_nullable='00')
        games = gamefinder.get_data_frames()[0]
        
        games_2526 = games[games.SEASON_ID == '22025']
        games_oct21 = games_2526[games.GAME_DATE == '2025-10-22']
        
        # Convert to dictionary for JSON response
        result = games_oct21.to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'games': result,
            'count': len(result)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)