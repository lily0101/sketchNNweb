import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    FLASKY_ADMIN = os.environ.get('FLASKY_ADMIN')
    #just like app.config['SECRET_KEY'] = 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    FLASKY_MAIL_SUBJECT_PREFIX = '[SketchDrawing]'
    FLASKY_ADMIN ='1196027787@qq.com'
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = "smtp.qq.com"
    MAIL_PORT = 587 #or 587 or 465
    MAIL_USE_TLS = True
    MAIL_USERNAME = "1196027787@qq.com"
    MAIL_PASSWORD = "lily0101"
    FLASKY_MAIL_SENDER = '1196027787@qq.com'

