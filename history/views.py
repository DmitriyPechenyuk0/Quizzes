import flask
from flask import request


from project.settings import db
from quiz_app.models import Question, SessionAnswer, QuizSession,  SessionParticipant
from flask_login import current_user
from profile_app.models import User  
from New_Quiz_App.models import Quiz
from .quiz_results import get_quiz_results

def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

def show_qsr_page(session_id=None, user_id=None):
    # if user_id is None:
    #     if current_user and getattr(current_user, "is_authenticated", False):
    #         user_id = getattr(current_user, "id", None)
    #     if not user_id:
    #         user_id = request.args.get("user_id", type=int)

    # if session_id is None:
    #     session_id = request.args.get("session_id", type=int)

    # if not session_id or not user_id:
    #     return flask.render_template("quiz_student_result.html", results=[], score_percent=0)

    # query = (
    #     db.session.query(SessionAnswer, Question)
    #     .join(Question, SessionAnswer.question_id == Question.id)
    #     .filter(
    #         SessionAnswer.session_id == session_id,
    #         SessionAnswer.user_id == user_id
    #     )
    #     .order_by(Question.order_index)
    # )
    # answers = query.all()

    # results = []
    # correct_count = 0
    # total_count = len(answers)

    # for answer, question in answers:
    #     is_correct = bool(answer.is_correct) if answer.is_correct is not None else answer.answer_text.strip() == question.correct_answer.strip()
    #     if is_correct:
    #         correct_count += 1

    #     results.append({
    #         "order": question.order_index,
    #         "question": question.text,
    #         "user_answer": answer.answer_text,
    #         "correct_answer": question.correct_answer,
    #         "is_correct": is_correct
    #     })

    # score_percent = round(correct_count / total_count * 100, 2) if total_count else 0

    return flask.render_template(
        "quiz_student_result.html",
        # results=results,
        # score_percent=score_percent,
        # username=User.query.filter_by(id=user_id).first().name,
        # user_mail=User.query.filter_by(id=user_id).first().email,
        # quiz_name = Quiz.query.filter_by(id=QuizSession.query.filter_by(id=session_id).first().quiz_id).first().name
    )



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