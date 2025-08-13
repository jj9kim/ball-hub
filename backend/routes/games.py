from flask import Blueprint, jsonify
from ..models import Game, PlayerStat
from ..database import db

bp = Blueprint('games', __name__)

@bp.route('/games')
def get_games():
    games = Game.query.order_by(Game.date.desc()).limit(50).all()
    return jsonify([{
        'id': g.id,
        'date': g.date.isoformat(),
        'matchup': f"{g.home_team.name} vs {g.away_team.name}"
    } for g in games])

@bp.route('/games/<int:game_id>/stats')
def get_game_stats(game_id):
    stats = db.session.query(PlayerStat)\
             .filter_by(game_id=game_id)\
             .join(Player)\
             .all()
    
    return jsonify([{
        'player_id': s.player_id,
        'player_name': s.player.name,
        'points': s.points,
        'rebounds': s.rebounds,
        'assists': s.assists
    } for s in stats])