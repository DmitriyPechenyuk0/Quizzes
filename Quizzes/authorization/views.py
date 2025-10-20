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
        
        if len(list(users)) == 0:
            return "no password"
        else:
            flask_login.login_user(users[0])
            return flask.redirect("/")
    print(User.query.all())
    

    return flask.render_template("authorization.html", **context )






