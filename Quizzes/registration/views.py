import flask
from profile_app.models import User, db

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

    return flask.render_template(template_name_or_list='registration.html', **context)