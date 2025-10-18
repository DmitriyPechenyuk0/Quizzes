import flask
from flask import request


from project.settings import db
from quiz_app.models import Question, SessionAnswer, QuizSession,  SessionParticipant
from flask_login import current_user

def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

 
def show_qsr_page(session_id, user_id):
  

    user_id = None
    if current_user and getattr(current_user, "is_authenticated", False):
        user_id = getattr(current_user, "id", None)
    if not user_id:
        user_id = request.args.get("user_id", type=int)

    session_id = request.args.get("session_id", type=int)

    if not session_id and user_id:
        last_session = (
            db.session.query(QuizSession)
            .join(SessionParticipant, SessionParticipant.session_id == QuizSession.id)
            .filter(SessionParticipant.user_id == user_id)
            .order_by(QuizSession.id.desc())
            .first()
        )
        if last_session:
            session_id = last_session.id

    if not session_id:
        return flask.render_template("quiz_student_result.html", results=[])


    query = (
        db.session.query(SessionAnswer, Question)
        .join(Question, SessionAnswer.question_id == Question.id)
        .filter(SessionAnswer.session_id == session_id)
    )
    if user_id:
        query = query.filter(SessionAnswer.user_id == user_id)

    answers = query.order_by(Question.order_index).all()

    results = []
    for answer, question in answers:
        results.append({
            "order": question.order_index,
            "question": question.text,
            "user_answer": answer.answer_text,
            "correct_answer": question.correct_answer,
            "is_correct": bool(answer.is_correct)
            if answer.is_correct is not None
            else answer.answer_text == question.correct_answer,
        })

    return flask.render_template("quiz_student_result.html", results=results)


def show_qtr_page():
    
    return flask.render_template(template_name_or_list="quiz_teacher_result.html" )