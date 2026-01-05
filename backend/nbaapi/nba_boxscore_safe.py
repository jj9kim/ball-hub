# nba_boxscore_safe.py - Save this in the same directory
"""
NBA Box Score API - Safe implementation with rate limiting and caching
For educational/personal use only
"""

import requests
import time
import random
import json
import hashlib
from datetime import datetime, timedelta
import os
from typing import Optional, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NBABoxScoreClient:
    """
    Safe client for accessing NBA box score data
    with rate limiting, caching, and error handling
    """
    
    def __init__(self, cache_dir='./boxscore_cache', max_cache_days=7):
        """
        Initialize the safe client
        
        Args:
            cache_dir: Directory to cache responses
            max_cache_days: How long to keep cache files (days)
        """
        self.session = requests.Session()
        self.cache_dir = cache_dir
        self.max_cache_age = timedelta(days=max_cache_days)
        
        # Setup session headers
        self.session.headers.update({
            'User-Agent': 'NBATracker/1.0 (Educational Project)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
        })
        
        # Rate limiting settings
        self.min_delay = 2.0
        self.max_delay = 4.0
        self.last_request_time = 0
        
        # Create cache directory
        os.makedirs(cache_dir, exist_ok=True)
        
        logger.info(f"NBA Box Score Client initialized. Cache dir: {cache_dir}")
    
    def _make_safe_request(self, url: str, game_id: str) -> Optional[Dict]:
        """Make a safe HTTP request with rate limiting"""
        try:
            # Rate limiting
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            
            if time_since_last < self.min_delay:
                sleep_time = self.min_delay - time_since_last + random.uniform(0, 1.0)
                time.sleep(sleep_time)
            
            time.sleep(random.uniform(0.1, 0.5))
            
            headers = {
                'Referer': f'https://www.nba.com/game/{game_id}',
                'Origin': 'https://www.nba.com',
            }
            
            logger.info(f"Requesting box score for game {game_id}")
            response = self.session.get(url, headers=headers, timeout=30)
            
            self.last_request_time = time.time()
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                logger.warning(f"Rate limited (429) for game {game_id}")
                time.sleep(5 + random.uniform(0, 5))
                return None
            elif response.status_code == 404:
                logger.info(f"Box score not found (404) for game {game_id}")
                return None
            else:
                logger.warning(f"HTTP {response.status_code} for game {game_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error for game {game_id}: {e}")
            return None
    
    def _get_cache_path(self, game_id: str) -> str:
        """Get cache file path for a game ID"""
        cache_key = hashlib.md5(game_id.encode()).hexdigest()
        return os.path.join(self.cache_dir, f"{cache_key}.json")
    
    def _load_from_cache(self, game_id: str) -> Optional[Dict]:
        """Load data from cache if valid"""
        cache_path = self._get_cache_path(game_id)
        
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'r') as f:
                    cached_data = json.load(f)
                
                cache_time_str = cached_data.get('_cache_metadata', {}).get('cached_at')
                if cache_time_str:
                    cache_time = datetime.fromisoformat(cache_time_str)
                    if datetime.now() - cache_time < self.max_cache_age:
                        return cached_data
                    
            except Exception:
                pass
        
        return None
    
    def _save_to_cache(self, game_id: str, data: Dict):
        """Save data to cache with metadata"""
        cache_path = self._get_cache_path(game_id)
        
        try:
            if '_cache_metadata' not in data:
                data['_cache_metadata'] = {}
            
            data['_cache_metadata'].update({
                'cached_at': datetime.now().isoformat(),
                'game_id': game_id,
                'source': 'cdn.nba.com'
            })
            
            with open(cache_path, 'w') as f:
                json.dump(data, f, indent=2)
            
        except Exception:
            pass
    
    def get_boxscore(self, game_id: str, force_refresh: bool = False) -> Optional[Dict]:
        """Get box score data for a game with caching"""
        if not game_id.startswith('00') or len(game_id) != 10:
            return None
        
        if not force_refresh:
            cached_data = self._load_from_cache(game_id)
            if cached_data:
                return cached_data
        
        url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
        data = self._make_safe_request(url, game_id)
        
        if data and 'game' in data:
            self._save_to_cache(game_id, data)
            return data
        
        return None
    
    def get_player_stats(self, game_id: str) -> Dict[str, Any]:
        """Extract player statistics from box score data"""
        boxscore = self.get_boxscore(game_id)
        
        if not boxscore:
            return {
                'success': False,
                'error': 'Box score not available',
                'game_id': game_id
            }
        
        try:
            game_data = boxscore['game']
            
            game_info = {
                'game_id': game_data['gameId'],
                'status': game_data['gameStatusText'],
                'date': game_data['gameTimeUTC'],
                'arena': game_data['arena']['arenaName'],
                'attendance': game_data.get('attendance', 0),
                'home_team': {
                    'id': game_data['homeTeam']['teamId'],
                    'name': game_data['homeTeam']['teamName'],
                    'city': game_data['homeTeam']['teamCity'],
                    'score': game_data['homeTeam']['score']
                },
                'away_team': {
                    'id': game_data['awayTeam']['teamId'],
                    'name': game_data['awayTeam']['teamName'],
                    'city': game_data['awayTeam']['teamCity'],
                    'score': game_data['awayTeam']['score']
                }
            }
            
            all_players = []
            
            # Process home team players
            for player in game_data['homeTeam']['players']:
                player_data = self._process_player_data(player, game_info['home_team'])
                all_players.append(player_data)
            
            # Process away team players
            for player in game_data['awayTeam']['players']:
                player_data = self._process_player_data(player, game_info['away_team'])
                all_players.append(player_data)
            
            return {
                'success': True,
                'game': game_info,
                'players': all_players,
                'attribution': {
                    'source': 'NBA.com',
                    'disclaimer': 'Data for educational/demo purposes',
                    'copyright': '© NBA Media Ventures, LLC.'
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error processing data: {str(e)}',
                'game_id': game_id
            }
    
    def _process_player_data(self, player: Dict, team_info: Dict) -> Dict:
        """Process raw player data into consistent format"""
        stats = player.get('statistics', {})
        
        # Convert minutes
        minutes_iso = stats.get('minutes', 'PT00M00.00S')
        minutes_display = self._iso_to_minutes(minutes_iso)
        
        return {
            'player_id': player['personId'],
            'name': player['name'],
            'first_name': player['firstName'],
            'last_name': player['familyName'],
            'jersey': player['jerseyNum'],
            'position': player.get('position', ''),
            'team_id': team_info['id'],
            'team_city': team_info['city'],
            'starter': player.get('starter') == '1',
            'minutes': minutes_display,
            'points': stats.get('points', 0),
            'rebounds': stats.get('reboundsTotal', 0),
            'assists': stats.get('assists', 0),
            'steals': stats.get('steals', 0),
            'blocks': stats.get('blocks', 0),
            'turnovers': stats.get('turnovers', 0),
            'fouls': stats.get('foulsPersonal', 0),
            'fg_made': stats.get('fieldGoalsMade', 0),
            'fg_attempted': stats.get('fieldGoalsAttempted', 0),
            'fg_percentage': stats.get('fieldGoalsPercentage', 0),
            'three_made': stats.get('threePointersMade', 0),
            'three_attempted': stats.get('threePointersAttempted', 0),
            'three_percentage': stats.get('threePointersPercentage', 0),
            'ft_made': stats.get('freeThrowsMade', 0),
            'ft_attempted': stats.get('freeThrowsAttempted', 0),
            'ft_percentage': stats.get('freeThrowsPercentage', 0),
            'plus_minus': stats.get('plusMinusPoints', 0)
        }
    
    def _iso_to_minutes(self, iso_duration: str) -> str:
        """Convert ISO 8601 duration to MM:SS format"""
        try:
            import re
            match = re.match(r'PT(\d+)M(\d+\.\d+)S', iso_duration)
            if match:
                minutes = int(match.group(1))
                seconds = int(float(match.group(2)))
                return f"{minutes}:{seconds:02d}"
        except:
            pass
        return "0:00"

# Singleton instance
_boxscore_client = None

def get_boxscore_client() -> NBABoxScoreClient:
    """Get or create singleton box score client"""
    global _boxscore_client
    if _boxscore_client is None:
        _boxscore_client = NBABoxScoreClient()
    return _boxscore_client