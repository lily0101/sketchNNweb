from datetime import datetime
from app import db, login
from flask import current_app
from flask_login import UserMixin,AnonymousUserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer

class Permission:
    FOLLOW = 0x01
    COMMENT = 0x02
    WRITE_ARTICLES = 0x04
    MODERATE_COMMENTS = 0x08
    ADMINISTER = 0x80

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer,primary_key = True)
    name = db.Column(db.String(64),unique=True)
    default = db.Column(db.Boolean,default=False,index = True)
    permissions=db.Column(db.Integer)
    users = db.relationship('User',backref='role',lazy='dynamic')
    
    @staticmethod
    def insert_roles():
        roles = {
            'User':(Permission.FOLLOW|Permission.COMMENT|
                     Permission.WRITE_ARTICLES, True),     # 只有普通用户的default为True
            'Moderare':(Permission.FOLLOW|Permission.COMMENT|
                    Permission.WRITE_ARTICLES|Permission.MODERATE_COMMENTS, False),
            'Administrator':(0xff, False)
        }
        for r in roles:
            role = Role.query.filter_by(name=r).first()
            if role is None:
                role = Role(name=r)
            role.permissions = roles[r][0]
            role.default = roles[r][1]
            db.session.add(role)
        db.session.commit()

    def __repr__(self):
        return '<Role %r>' %self.name

class User(UserMixin, db.Model):
    __tablename__ ="users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role_id = db.Column(db.Integer,db.ForeignKey('roles.id'))
    posts_id = db.relationship('Post', backref='author', lazy='dynamic')
    albums = db.relationship('Album', backref='author', lazy='dynamic')
    photos = db.relationship('Photo', backref='author', lazy='dynamic')
    #发送邮件进行确认
    confirmed = db.Column(db.Boolean,default=True)
    '''
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)        # 初始化父类
        if self.role is None:
            if self.email == current_app.config['FLASK_ADMIN']:                  # 邮箱与管理者邮箱相同
                self.role = Role.query.filter_by(permissions=0xff).first()    # 权限为管理者
            else:
                self.role =  Role.query.filter_by(default=True).first()       # 默认用户
    '''
    def __repr__(self):
        return '<User {}>'.format(self.username)

    def generate_confirmation_token(self,expiration=3600):
        s = Serializer(current_app.config['SECRET_KEY'],expiration)
        return s.dumps({'confirm':self.id})

    def confirm(self,token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except:
            return False
        if data.get('confirm') != self.id:
            return False
        self.confirmed = True
        db.session.add(self)
        return True

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def can(self, permissions):          # 检查用户的权限
        return self.role is not None and \
               (self.role.permissions & permissions) == permissions

    def is_administrator(self):         # 检查是否为管理者
        return self.can(Permission.ADMINISTRATOR)

class Album(db.Model):
    __tablename__ = 'albums'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64))#分类
    '''
    about = db.Column(db.Text)
    cover = db.Column(db.String(64))
    type = db.Column(db.Integer, default=0)
    tag = db.Column(db.String(64))
    no_public = db.Column(db.Boolean, default=True)
    no_comment = db.Column(db.Boolean, default=True)
    asc_order = db.Column(db.Boolean, default=True)
    '''
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    photos = db.relationship('Photo', backref='album', lazy='dynamic')

class Photo(db.Model):
    __tablename__ = 'photos'
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(64))
    '''
    url_s = db.Column(db.String(64))
    url_t = db.Column(db.String(64))
    '''
    about = db.Column(db.Text)
    score = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    order = db.Column(db.Integer)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    album_id = db.Column(db.Integer, db.ForeignKey('albums.id'))

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(140))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return '<Post {}>'.format(self.body)
