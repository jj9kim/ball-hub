from flask import Flask
from .database import init_db
from .routes.games import bp as games_bp

def create_app():
    app = Flask(__name__)
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(games_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)