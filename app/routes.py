from flask import render_template, flash, redirect, url_for, request,send_from_directory,jsonify
from flask_login import login_user, logout_user, current_user, login_required
#from flask_mail import send_email
from werkzeug.urls import url_parse
from werkzeug import secure_filename
from app import app, db,bootstrap
from app.forms import LoginForm, RegistrationForm,EditProfileForm
from app.models import User,Role,Album,Photo,Post
from app import tools
from sqlalchemy import func
import matplotlib as plt
import matplotlib.image as mpimg
import os
import json
import numpy as np
from app.email import send_email

import random
from app.decorators import admin_required, permission_required

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'static/data')

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')
@app.route('/user/<username>')
@login_required
def user(username):
    user = User.query.filter_by(username=username).first_or_404()
    return render_template('user.html', user=user)

@app.route('/home')
@login_required
def home():
    return render_template('home.html')

@app.route('/history',methods=['GET','POST'])
@login_required
def history():
    '''show the history of the user'''
    all_url = []
    user = current_user._get_current_object()
    albums = Album.query.filter_by(author_id=user.id) #get the all albums
    for a in albums:
        photos = Photo.query.filter_by(album_id=a.id,author_id=user.id)
        for p in photos:
            #do something to deal the url
            url = p.url.split('app')
            print(url)
            all_url.append([url[1],p])

    return render_template('history.html',all_url=all_url)

@app.route('/sketch2image/<photoid>',methods=['GET','POST'])
@login_required
def sketch2image(photoid):
    '''the photo id is different and link to different result'''
    ##call the tools.sketch2image function
    photo = Photo.query.filter_by(id=photoid).first()
    top5_images = tools.SketchToImage(photo.url)
    top5 = []
    for image in top5_images:
        top5.append(image.split('app')[1])
        print(image.split('app'))

    return render_template("sketch2image.html",top5_images=top5)


@app.route('/teacher',methods=['GET','POST'])
@login_required
def teacher():
    if request.method == 'POST' and json.loads(request.get_data()):
        #print("get the file?")
        data = json.loads(request.get_data())
        teacher_model = data["model"]
        print(data)
        author = current_user._get_current_object()
        #只能通过model来选择，不能同时判断两个条件吗？主要是author是不能用在查找的，只能用来关联
        print("in teacher, the select_model is:"+teacher_model)
        album = Album.query.filter_by(title=teacher_model,author_id=author.id).first() #get the album
        print(album)#find the selected album
        if album:
            pass
        else: #create the new album
            album = Album(title=teacher_model, author=author)
            db.session.add(album)
            db.session.commit()
            #print(album)#create new album
        amount= len(album.photos.all())
        strokes = data["strokes"]
        #use the use name to identify the files
        filename = os.path.join(UPLOAD_FOLDER,'teacher',author.username,teacher_model);#change the data['name'] to teacher_model, you dont need to write down the name
        if not os.path.exists(filename):
            os.makedirs(filename)
        url = os.path.join(filename,str(amount)+'.npy')
        np.save(url,strokes)
        #just save the url in local file
        photo = Photo(url=url,
                          album=album, author_id=current_user._get_current_object().id)
        print(photo)
        db.session.add(photo)
        db.session.commit()
        return jsonify("save to disk is success!")
        #return redirect(url_for('teacher'))#重定向到这个url
    return render_template('teacher.html')


@app.route('/select_model',methods=['GET','POST'])#for student
@login_required
def select_model():
    if request.method == 'POST' and json.loads(request.get_data()):#get strokes
        model = json.loads(request.get_data())
        user = current_user._get_current_object()
        album = Album.query.filter_by(title=model,author_id=user.id).first() #get the album,
        #print(album)#album 1
        if album:
            pass
        else:
            album = Album(title=model, author=user)
            db.session.add(album)
            db.session.commit()
            #print(album)
        student_model = model
        print("select_model,student_model is "+ student_model)
        teacher_user_id = 1
        print(teacher_user_id)
        #if there is not the album
        album = Album.query.filter_by(title=student_model,author_id=teacher_user_id).first() #get the album,
        if album:
           print(album)
           print(len(album.photos.all()))
           ##add photo
           photo = Photo.query.filter_by(album_id=album.id).first()
           if photo:
              random_int = random.randint(0,len(album.photos.all())-1)
           #read strokes and return
              strokes = np.load(album.photos[random_int].url)
              print(strokes)
              return jsonify(strokes.tolist())
           else:
              print("there is no teacher's  photo strokes")
              pass
        else:
            print("there is no this class album ")
            pass
    return redirect(url_for('index'))
    
@app.route('/student',methods=['GET','POST'])
@login_required
def student():
        ##怎么区别两种提交呢?---两个接口
    if request.method == 'POST' and request.files.getlist('image') : # return the student drawing UI
        user = current_user._get_current_object()
        student_model = request.form.get('model',type=str)
        print("in student model is:"+student_model)
        album = Album.query.filter_by(title=student_model,author_id=user.id).first() #get the album
        print(album)
        if album:
            pass
        else:
            #create a new album
            album = Album(title=student_model, author=user)
            db.session.add(album)
            db.session.commit()
            #and save that 
        upload_files = request.files.getlist('image') #the two canvas, the first is teacher,the second is student
        amount = len(album.photos.all())
        images = []
        for file in upload_files: #always two images
            print(file)
            if file and tools.allowed_file(file.filename):
                name = secure_filename(file.filename)
                print(name)
                #images.append(file)  #can't read the storage,file is storage and name just a name
                url = os.path.join(UPLOAD_FOLDER, 'student', user.username, student_model)
                if not os.path.exists(url):
                    os.makedirs(url)
                url = os.path.join(url, str(amount) + name)
                file.save(url)
                images.append(url)

        #score = tools.templateMatch(images) #it's templateMatch
        #print(score)
        #use the CNN+LSTM
        score = tools.sketchClassifier(images[1]) # the first of the return score is the prob of the class so slowly

        photo = Photo(url=images[1],score=score,
                              album=album, author=user)
        db.session.add(photo)
        db.session.commit()
        # only save the student's url in SQLITE? or save all of them for score
        print(score)
        return jsonify(score)
    return render_template('student.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        if current_user.is_administrator():
            return redirect(url_for('teacher'))
        return redirect(url_for('student'))
    form = LoginForm()
    if form.validate_on_submit():#click the button submit
        user = User.query.filter_by(username=form.username.data).first()
        #如果使用email作为用户名的话，那么这里就是
        #user = User.query.filter_by(email=form.email.data).first()
        if user is None or not user.verify_password(form.password.data):
            flash('Invalid username or password')#flash 
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        if user.is_administrator():
            return redirect(url_for('teacher'))#重定向到这个url
        return redirect(url_for('student'))
    return render_template('login.html', title='Sign In', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(email=form.email.data,
                    username=form.username.data,
                    password=form.password.data)
        db.session.add(user)
        db.session.commit()
        token = user.generate_confirmation_token()
        send_email(user.email, 'Confirm Your Account',
                   'confirm', user=user, token=token)
        flash('A confirmation email has been sent to you by email.')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.route('/confirm/<token>')
@login_required
def confirm(token):
    if current_user.confirmed:
        return redirect(url_for('index'))
    if current_user.confirm(token):
        flash('You have confirmed your account. Thanks!')
    else:
        flash('The confirmation link is invalid or has expired.')
    return redirect(url_for('index'))
'''
@app.before_app_request
def before_request():
    if current_user.is_authenticated:
        current_user.ping()
        if not current_user.confirmed \
                and request.endpoint \
                and request.endpoint[:5] != 'auth.' \
                and request.endpoint != 'static':
            return redirect(url_for('unconfirmed'))
'''



@app.route('/unconfirmed')
def unconfirmed():
    if current_user.is_anonymous or current_user.confirmed:
        return redirect(url_for('index'))
    return render_template('unconfirmed.html')

@app.route('/confirm')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    send_email(current_user.email, 'Confirm Your Account',
               'confirm', user=current_user, token=token)
    flash('A new confirmation email has been sent to you by email.')
    return redirect(url_for('index'))

@app.route('/edit-profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = EditProfileForm()
    if form.validate_on_submit():
        current_user.name = form.name.data
        current_user.location = form.location.data
        current_user.about_me = form.about_me.data
        db.session.add(current_user)
        flash('Your profile has been updated.')
        return redirect(url_for('user', username=current_user.username))
    form.name.data = current_user.name
    form.location.data = current_user.location
    form.about_me.data = current_user.about_me
    return render_template('edit_profile.html', form=form)

