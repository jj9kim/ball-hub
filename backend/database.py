from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://tsdbadmin:vcamodvuaknlkq1l@ut4x7c7v5n.t9gy6vbcvu.tsdb.cloud.timescale.com:38723/tsdb?sslmode=require'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)