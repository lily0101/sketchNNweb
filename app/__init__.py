from flask import Flask
from flask_bootstrap import Bootstrap
from flask_mail import Mail
from flask_moment import Moment
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_pagedown import PageDown
from config import config
from flask_admin import Admin
import os.path as op
file_path = op.join(op.dirname(__file__), 'static/') # 文件上传路径

bootstrap = Bootstrap()
mail = Mail()
moment = Moment()
db = SQLAlchemy()
pagedown = PageDown()

login_manager = LoginManager()
login_manager.session_protection = 'strong'
login_manager.login_view = 'auth.login'
admin = Admin(name="administor")

def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    bootstrap.init_app(app)
    mail.init_app(app)
    moment.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    pagedown.init_app(app)

    #admin
    from .modelView import BaseMView,UModelview,AlbumVModel,RoleModelview
    from .models import Role,User,Album,Photo
    from flask_admin.contrib.fileadmin import FileAdmin
    admin.init_app(app)

    admin.add_view(UModelview(User, db.session, category="User&&Role",name="Manage User"))
    admin.add_view(RoleModelview(Role, db.session, category="User&&Role",name="Manage Role"))
    admin.add_view(BaseMView(Album,  db.session, category='Data' ,name="Manage Album"))
    admin.add_view(BaseMView(Photo, db.session,category='Data' , name="Manage Photo"))

    admin.add_view(FileAdmin(file_path, "/static/data/student",name="server data"))

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    return app