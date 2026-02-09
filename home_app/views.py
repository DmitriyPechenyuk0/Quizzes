import flask, flask_login
from New_Quiz_App.models import Quiz
from project.settings import project
def show_home_page():
    quizzes = Quiz.query.all()

    if flask_login.current_user.is_authenticated:
        if flask_login.current_user.is_teacher:
            context = {'page': 'home', 'is_auth': flask_login.current_user.is_authenticated, 'name': flask_login.current_user.name, 'is_teacher': flask_login.current_user.is_teacher, 'quizzes': quizzes, 'nav_act': True}
        else:
            context = {'page': 'home', 'is_auth': flask_login.current_user.is_authenticated, 'name': flask_login.current_user.name, 'is_teacher': bool(flask_login.current_user.is_teacher), 'quizzes': quizzes, 'nav_act': True}
    else:
        context = {'page': 'home', 'is_auth': flask_login.current_user.is_authenticated, 'quizzes': quizzes, 'nav_act': True}
    return flask.render_template('home.html', **context)

@project.errorhandler(404)
def page_not_found(e):
    return flask.render_template('404.html'), 404