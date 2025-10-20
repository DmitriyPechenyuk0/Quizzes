import flask, flask_login
from New_Quiz_App.models import Quiz

def show_home_page():
    quizzes = Quiz.query.all()
    if flask_login.current_user.is_authenticated:
        context = {'page': 'home', 'is_auth': flask_login.current_user.is_authenticated, 'name': flask_login.current_user.name, 'quizzes': quizzes}
    else:
        context = {'page': 'home', 'is_auth': flask_login.current_user.is_authenticated, 'quizzes': quizzes}
    return flask.render_template('home.html', **context)