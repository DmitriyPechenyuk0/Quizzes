import flask
from flask import request


from project.settings import db
from quiz_app.models import Question, SessionAnswer, QuizSession,  SessionParticipant
from flask_login import current_user
from profile_app.models import User  
from New_Quiz_App.models import Quiz
from .quiz_results import get_quiz_results, get_student_results

def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

def show_qsr_page(session_id=None, user_id=None):
    if session_id is None:
        session_id = request.args.get("session_id", type=int)

    if user_id is None:
        if current_user and getattr(current_user, "is_authenticated", False):
            user_id = current_user.id
        if not user_id:
            user_id = request.args.get("user_id", type=int)

    if not session_id or not user_id:
        return flask.redirect(flask.url_for('home'))

    quiz_data = get_student_results(session_id, user_id)

    return flask.render_template("quiz_student_result.html", quiz_data=quiz_data)



def show_qtr_page(session_id=None):
    if session_id is None:
        session_id = request.args.get("session_id", type=int)

    if not session_id:
        return flask.render_template("quiz_teacher_result.html", students=[], stats=[], avg_accuracy=0)

    session = QuizSession.query.get_or_404(session_id)
    
    # if session.who_host != current_user.id:

    #     return {'error': True}

    quiz_data = get_quiz_results(session_id)

    return flask.render_template( "quiz_teacher_result.html", quiz_data=quiz_data)