from flask_admin.contrib.sqla import ModelView
from flask_admin.contrib.fileadmin import FileAdmin
from flask_admin import Admin, form
from flask_login import current_user
from jinja2 import Markup
from flask import render_template, redirect, request, url_for, flash
import os
from sqlalchemy.event import listens_for
import os.path as op
from . import  db
from .models import  User,Role,Album,Photo

file_path = op.join(op.dirname(__file__), 'static/') # 文件上传路径
class BaseMView(ModelView):
    def is_accessible(self):
        return current_user.is_administrator()


    def inaccessible_callback(self,name,**kwargs):
        return redirect(url_for('main.index'))

@listens_for(User, 'after_delete')
def del_image(mapper, connection, target):
    if target.head_img:
        # Delete image
        try:
            os.remove(op.join(file_path, target.head_img))
        except OSError:
            pass

        # Delete thumbnail
        try:
            os.remove(op.join(file_path,
                              form.thumbgen_filename(target.head_img)))
        except OSError:
            pass

class UModelview(BaseMView):

    column_exclude_list = ['password_hash','name','' ]

    def _list_thumbnail(view, context, model, name):
        if not model.head_img:
            return ''

        return Markup('<img src="%s">' % url_for('static',
                                                 filename="images/avatar.jpg"))

    column_formatters = {
        'head_img': _list_thumbnail
    }

    # Alternative way to contribute field is to override it completely.
    # In this case, Flask-Admin won't attempt to merge various parameters for the field.
    form_extra_fields = {
        'head_img': form.ImageUploadField('Image',
                                      base_path=file_path,
                                      relative_path="images/",
                                      thumbnail_size=(100, 100, True))
    }

class RoleModelview(BaseMView):

    column_exclude_list = ['password_hash','name','' ]

    def _list_thumbnail(view, context, model, name):
        if not model.head_img:
            return ''

        return Markup('<img src="%s">' % url_for('static',
                                                 filename="images/avatar.jpg"))

    column_formatters = {
        'head_img': _list_thumbnail
    }

    # Alternative way to contribute field is to override it completely.
    # In this case, Flask-Admin won't attempt to merge various parameters for the field.
    form_extra_fields = {
        'head_img': form.ImageUploadField('Image',
                                      base_path=file_path,
                                      relative_path="images/",
                                      thumbnail_size=(100, 100, True))
    }



from wtforms import TextAreaField
from wtforms.widgets import TextArea

class CKTextAreaWidget(TextArea):
    def __call__(self, field, **kwargs):
        if kwargs.get('class'):
            kwargs['class'] += ' ckeditor'
        else:
            kwargs.setdefault('class', 'ckeditor')
        return super(CKTextAreaWidget, self).__call__(field, **kwargs)

class CKTextAreaField(TextAreaField):
    widget = CKTextAreaWidget()



#文章的自定义视图
class AlbumVModel(BaseMView):
        extra_js = ['//cdn.ckeditor.com/4.6.0/standard/ckeditor.js']

        form_overrides = {
            'content': CKTextAreaField
        }

        def _on_model_change(self, form, model, is_created):
            print(str(model.__dict__))
            if is_created:
                taglist=[]
                tagnames=model.tag.split(",")
                if tagnames is not None:
                    for tag in tagnames:
                         searchTag=Album.query.filter_by(name=tag).first()
                         if searchTag is None:
                             tagobj=Album(name=tag,desc=tag,count=1,create_time=datetime.datetime.utcnow())
                         else:
                             searchTag.count=+1
                         taglist.append(tagobj)
                db.session.add_all(taglist)


