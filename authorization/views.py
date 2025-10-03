import flask, flask_login
from profile_app.models import User
from project import login_manager

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

        user_list = list(users)
        if len(user_list) == 0:
            return "no password"
        else:
            
            if not user_list[0].is_confirmed:
                flask.flash("Будь ласка, підтвердьте свою електронну пошту, перш ніж увійти.", "error")
                return flask.redirect("/login")
            
            flask_login.login_user(user_list[0])
            return flask.redirect("/")
            
    return flask.render_template("authorization.html", **context )