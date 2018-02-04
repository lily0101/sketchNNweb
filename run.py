from app import app, db
from app.models import User, Post, Role, Album, Photo

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Post': Post, 'Role': Role, 'Album': Album, 'Photo': Photo}

