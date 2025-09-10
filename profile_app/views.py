from flask_login import login_required, current_user, logout_user
from flask import redirect, url_for
import flask

from profile_app.models import User
from New_Quiz_App.models import Quiz
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
    
    return flask.render_template("profile.html", **context)

@login_required
def logout():
    logout_user()  
    return redirect(url_for('home_app.show_home_page'))  

