from flask import render_template, flash, redirect, current_app,url_for, request,send_from_directory,jsonify
from flask_login import login_required, current_user
from . import main
from .forms import EditProfileForm, EditProfileAdminForm, PostForm
from .. import db
from ..models import Permission, Role, User, Post,Album,Photo
from ..decorators import admin_required
import os
from .. import tools
import json
import numpy as np
import random
from werkzeug import secure_filename

APP_ROOT = '/home/chenxingli/graduation_project/webserver/sketchNNweb/app'
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'static/data')

@main.route('/')
@main.route('/index')
def index():
    return render_template('index.html')

@main.route('/user/<username>')
@login_required
def user(username):
    user = User.query.filter_by(username=username).first_or_404()
    return render_template('user.html', user=user)

@main.route('/home')
@login_required
def home():
    return render_template('home.html')


@main.route('/history', methods=['GET', 'POST'])
@login_required
def history():
    '''show the history of the user'''
    all_url = []
    user = current_user._get_current_object()
    albums = Album.query.filter_by(author_id=user.id)  # get the all albums
    for a in albums:
        photos = Photo.query.filter_by(album_id=a.id, author_id=user.id)
        for p in photos:
            # do something to deal the url
            url = p.url.split('app')
            print(url)
            all_url.append([url[1], p])

    return render_template('history.html', all_url=all_url)


@main.route('/sketch2image/<photoid>', methods=['GET', 'POST'])
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

    return render_template("sketch2image.html", top5_images=top5)

@main.route('/teacher_mimic', methods=['GET', 'POST'])
@login_required
def teacher_mimic():
    print("into the teacher-mimic")
    if request.method == 'POST' and json.loads(request.get_data()):
        # print("get the file?")
        data = json.loads(request.get_data())
        teacher_model = data["model"]
        print(data)
        author = current_user._get_current_object()
        # 只能通过model来选择，不能同时判断两个条件吗？主要是author是不能用在查找的，只能用来关联
        print("in teacher, the select_model is:" + teacher_model)
        album = Album.query.filter_by(title=teacher_model, author_id=author.id).first()  # get the album
        print(album)  # find the selected album
        if album:
            pass
        else:  # create the new album
            album = Album(title=teacher_model, author=author)
            db.session.add(album)
            db.session.commit()
            # print(album)#create new album
        amount = len(album.photos.all())
        strokes = data["strokes"]
        # use the use name to identify the files
        filename = os.path.join(UPLOAD_FOLDER, 'teacher', author.username,
                                teacher_model);  # change the data['name'] to teacher_model, you dont need to write down the name
        if not os.path.exists(filename):
            os.makedirs(filename)
        url = os.path.join(filename, str(amount) + '.npy')
        np.save(url, strokes)
        # just save the url in local file
        photo = Photo(url=url,
                      album=album, author_id=current_user._get_current_object().id)
        print(photo)
        db.session.add(photo)
        db.session.commit()
        return jsonify("save to disk is success!")
        # return redirect(url_for('teacher'))#重定向到这个url
    return render_template('myMimic.html')

@main.route('/teacher', methods=['GET', 'POST'])
@login_required
def teacher():
    print("into the teacher")
    if request.method == 'POST' and json.loads(request.get_data()):
        # print("get the file?")
        data = json.loads(request.get_data())
        teacher_model = data["model"]
        print(data)
        author = current_user._get_current_object()
        # 只能通过model来选择，不能同时判断两个条件吗？主要是author是不能用在查找的，只能用来关联
        print("in teacher, the select_model is:" + teacher_model)
        album = Album.query.filter_by(title=teacher_model, author_id=author.id).first()  # get the album
        print(album)  # find the selected album
        if album:
            pass
        else:  # create the new album
            album = Album(title=teacher_model, author=author)
            db.session.add(album)
            db.session.commit()
            # print(album)#create new album
        amount = len(album.photos.all())
        strokes = data["strokes"]
        # use the use name to identify the files
        filename = os.path.join(UPLOAD_FOLDER, 'teacher', author.username,
                                teacher_model);  # change the data['name'] to teacher_model, you dont need to write down the name
        if not os.path.exists(filename):
            os.makedirs(filename)
        url = os.path.join(filename, str(amount) + '.npy')
        np.save(url, strokes)
        # just save the url in local file
        photo = Photo(url=url,
                      album=album, author_id=current_user._get_current_object().id)
        print(photo)
        db.session.add(photo)
        db.session.commit()
        return jsonify("save to disk is success!")
        # return redirect(url_for('teacher'))#重定向到这个url
    return render_template('teacher.html')


@main.route('/select_model', methods=['GET', 'POST'])  # for student
@login_required
def select_model():
    if request.method == 'POST' and json.loads(request.get_data()):  # get strokes
        model = json.loads(request.get_data())
        user = current_user._get_current_object()
        album = Album.query.filter_by(title=model, author_id=user.id).first()  # get the album,
        # print(album)#album 1
        if album:
            pass
        else:
            album = Album(title=model, author=user)
            db.session.add(album)
            db.session.commit()
            # print(album)
        student_model = model
        print("select_model,student_model is " + student_model)
        # if there is not the album
        teacher_user = User.query.filter_by(role_id=2).first()
        if not teacher_user:
            print("there is no teacher's drawing")
            return jsonify(0)
        album = Album.query.filter_by(title=student_model, author_id=teacher_user.id).first()  # get the album,
        if album:
            print(album)
            print(len(album.photos.all()))
            ##add photo
            photo = Photo.query.filter_by(album_id=album.id).first()
            if photo:
                random_int = random.randint(0, len(album.photos.all()) - 1)
                # read strokes and return
                strokes = np.load(album.photos[random_int].url)
                print(strokes)
                return jsonify(strokes.tolist())
            else:
                print("there is no teacher's  photo strokes")
                pass
        else:
            print("there is no this class album ")
            pass
    return redirect(url_for('main.index'))


@main.route('/student', methods=['GET', 'POST'])
@login_required
def student():
    ##怎么区别两种提交呢?---两个接口
    if request.method == 'POST' and request.files.getlist('image'):  # return the student drawing UI
        user = current_user._get_current_object()
        student_model = request.form.get('model', type=str)
        print("in student model is:" + student_model)
        album = Album.query.filter_by(title=student_model, author_id=user.id).first()  # get the album
        print(album)
        if album:
            pass
        else:
            # create a new album
            album = Album(title=student_model, author=user)
            db.session.add(album)
            db.session.commit()
            # and save that
        upload_files = request.files.getlist('image')  # the two canvas, the first is teacher,the second is student
        amount = len(album.photos.all())
        images = []
        for file in upload_files:  # always two images
            print(file)
            if file and tools.allowed_file(file.filename):
                name = secure_filename(file.filename)
                print(name)
                # images.append(file)  #can't read the storage,file is storage and name just a name
                url = os.path.join(UPLOAD_FOLDER, 'student', user.username, student_model)
                if not os.path.exists(url):
                    os.makedirs(url)
                url = os.path.join(url, str(amount) + name)
                file.save(url)
                images.append(url)

        # score = tools.templateMatch(images) #it's templateMatch
        # print(score)
        # use the CNN+LSTM
        score = tools.sketchClassifier(images[0],student_model)  # the first of the return score is the prob of the class so slowly

        photo = Photo(url=images[0], score=score,
                      album=album, author=user)
        db.session.add(photo)
        db.session.commit()
        # only save the student's url in SQLITE? or save all of them for score
        print(score)
        return jsonify(score)
    return render_template('student.html')

@main.route('/edit_profile', methods=['GET', 'POST'])
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

@main.route('/showChart', methods=['GET', 'POST'])
@login_required
@admin_required
def showChart():
    if request.method == "GET":
        res = []
        user1 = len(User.query.all())
        temp = ["user",user1]
        res.append(temp)
        role1 = len(Role.query.all())
        temp = ["role", role1]
        res.append(temp)
        album1 = len(Album.query.all())
        temp = ["album", album1]
        res.append(temp)
        photo1 = len(Photo.query.all())
        temp = ["photo", photo1]
        res.append(temp)

    return jsonify(user=[x[0] for x in res],
                   amount=[x[1] for x in res])
@main.route('/edit_profile/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_profile_admin(id):
    user = User.query.get_or_404(id)
    form = EditProfileAdminForm(user=user)
    if form.validate_on_submit():
        user.email = form.email.data
        user.username = form.username.data
        user.confirmed = form.confirmed.data
        user.role = Role.query.get(form.role.data)
        user.name = form.name.data
        user.location = form.location.data
        user.about_me = form.about_me.data
        db.session.add(user)
        flash('The profile has been updated.')
        return redirect(url_for('.user', username=user.username))
    form.email.data = user.email
    form.username.data = user.username
    form.confirmed.data = user.confirmed
    form.role.data = user.role_id
    form.name.data = user.name
    form.location.data = user.location
    form.about_me.data = user.about_me
    return render_template('edit_profile.html', form=form, user=user)



