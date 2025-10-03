import flask
from flask_login import current_user
from quiz_app.models import QuizSession, Question, SessionParticipant, SessionAnswer


def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

def show_qsr_page():
    ses = QuizSession.query.filter_by(id=4).first()
    part = SessionParticipant.query.filter_by(session_id = ses.id)
    nickname = SessionParticipant.query.filter_by(user_id = current_user.id).filter_by(session_id = ses.id).first()
    # quastions = SessionAnswer.query.filter_by(session_id = ses.id).filter_by(user_id = current_user.id).first()
    # part.filter_by(user_id = 2).first()
    
    # answers = SessionAnswer.query.filter_by(user_id = part.id)
    print()

    return flask.render_template(
        "quiz_student_result.html",
        page="history",
        is_auth=current_user.is_authenticated,
    )
    

def show_qtr_page():
    
    return flask.render_template(template_name_or_list="quiz_teacher_result.html" )
   