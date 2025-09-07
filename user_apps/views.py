from flask_login import login_required, current_user, logout_user
from flask import redirect, url_for
import flask, flask_login
from user_apps.models import User, db
from project import login_manager
from New_Quiz_App.models import Quiz




def show_authorization():
    context = {'page': 'authorization'}
    if flask_login.current_user.is_authenticated:
        context = {'name': flask_login.current_user.name,
                   'page': 'authorization'} 
    if flask.request.method == "POST":
        users = User.query.filter_by(
            name = flask.request.form["name"],
            password = flask.request.form["password"]
        )
        
        if len(list(users)) == 0:
            return "no password"
        else:
            flask_login.login_user(users[0])
            return flask.redirect("/")
    print(User.query.all())
    

    return flask.render_template(template_name_or_list = "authorization.html", **context )







@login_required
def show_profile_page():
 
    quizzes = Quiz.query.filter_by(owner=current_user.id).all()

    context = {
        'page': 'profile',
        'name': current_user.name,
        'email': current_user.email,
        'quizzes': quizzes,
        'created_quizzes_count': len(quizzes)  
    }
    
    return flask.render_template(template_name_or_list = "profile.html", **context)


@login_required
def logout():
    logout_user()  
    return redirect(url_for('home_app.show_home_page'))  






def show_page_registration():
    context = {'page': 'home'}
    if flask.request.method == 'POST':
        user = User(
            name = flask.request.form['login'],
            email = flask.request.form['email'],
            password = flask.request.form['password'],
            is_admin = bool(int(flask.request.form['Teacher']))

        )
        
        try:
            db.session.add(user)
            db.session.commit()
            return flask.redirect("/login")
        except Exception as e:
            print(e)

    return flask.render_template(template_name_or_list="registration.html", **context)





