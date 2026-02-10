import flask
import flask_login
from flask import flash, redirect, url_for, render_template
from profile_app.models import User
from project import login_manager


def show_authorization():
    context = {'page': 'authorization'}

    if flask_login.current_user.is_authenticated:
        context = {'name': flask_login.current_user.name,
                   'page': 'authorization'}

    if flask.request.method == "POST":
        username = flask.request.form.get("username")
        password = flask.request.form.get("password")

        print(username, password)
        
        user = User.query.filter_by(name=username).first()

        if not user:
            flash("Користувача з таким логіном не існує.", "error")
            return redirect(url_for('authorization.show_authorization'))

        if user.password != password:
            flash("Невірний пароль.", "error")
            return redirect(url_for('authorization.show_authorization'))

        if not user.is_email_confirmed:
            flash("Будь ласка, підтвердіть вашу електронну пошту перед входом. Перейдіть за посиланням, яке було відправлено на вашу пошту.", "warning")
            return redirect(url_for('authorization.show_authorization'))

        flask_login.login_user(user)
        flash("Вхід успішний!", "success")
        return redirect("/")

    return render_template("authorization.html", **context)