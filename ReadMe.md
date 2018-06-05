## Info
this is a project about sketch drawing.

- I want to use the deeplearning to do something about sketch drawing.
- I just use the flask and python to build the web system demo for visualizing.


## Run locally
if you want to run it in your own machine,you have to install all dependencies of it.
1. Create virtual environment.I use the anaconda3 to create new environment for this web system.
you can install the anaconda3 following [this](https://conda.io/docs/installation.html)
when you finished the installing, you can create new environment and activate the envs by those [commends](https://conda.io/docs/user-guide/tasks/manage-environments.html)

2. Install Extensions and Plugins

**Notice: you have to activate the envs firstly.**
in Linux,OS X, it's below:
```
- $ flask/bin/pip install flask
- $ flask/bin/pip install flask-login
- $ flask/bin/pip install flask-openid
- $ flask/bin/pip install flask-mail
- $ flask/bin/pip install flask-sqlalchemy
- $ flask/bin/pip install sqlalchemy-migrate
- $ flask/bin/pip install flask-whooshalchemy
- $ flask/bin/pip install flask-wtf
- $ flask/bin/pip install flask-babel
- $ flask/bin/pip install guess_language
- $ flask/bin/pip install flipflop
- $ flask/bin/pip install coverage
```

3.Create your own database locally

```
python manage.py db init
python manage.py db migrate -m "initial migration"
```

when you change the model, you can use the following commend to upgrade the change.

```
python manage.py db upgrade
```
 
when you want to delete the change, you can use ``` python manage.py db downgrade```  to withdraw the change.


## Run
when you finished the above steps, you can run this web system locally.

```
python manage.py runserver
```

then, you can open the link: ** http://127.0.0.1:5000/ **  to check that.


## License
This demo application is my own test.if you want to do something about this,please contact me (chenlily0101@gmail.com).
