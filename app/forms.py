from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField,SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
from app.models import User


class CategoryForm(FlaskForm):
    Select_name = SelectField('category',validators=[DataRequired()] , choices=[('0', 'flower'),('1', 'dog'),('2', 'airplane'),('3', 'cat'),(4,'test')])
    #Radio_name = RadioFieldSelectField('category',validators=[Required()] , choices=[('0', 'flower'),('1', 'dog'),('2', 'airplane'),('3', 'cat')])
    submit = SubmitField('Submit')

class NewAlbumForm(FlaskForm):
    title = StringField(u'类名')
    submit = SubmitField(u'提交')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Please use a different email address.')
