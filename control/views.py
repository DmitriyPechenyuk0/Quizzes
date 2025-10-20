import flask, flask_login
from profile_app.models import User, db


def show_control_page():
    
    return flask.render_template('control.html')
