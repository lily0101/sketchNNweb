from app import app, db
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User, Post, Role, Album, Photo
import os
@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Post': Post, 'Role': Role, 'Album': Album, 'Photo': Photo}

if __name__ == "__main__":
    app.run(host='0.0.0.0')