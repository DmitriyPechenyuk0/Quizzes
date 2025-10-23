import flask
from flask import request


from project.settings import db
from quiz_app.models import Question, SessionAnswer, QuizSession,  SessionParticipant
from flask_login import current_user
from profile_app.models import User  
def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

 
def show_qsr_page(session_id=None, user_id=None):
    
    if user_id is None:
        if current_user and getattr(current_user, "is_authenticated", False):
            user_id = getattr(current_user, "id", None)
        if not user_id:
            user_id = request.args.get("user_id", type=int)

    if session_id is None:
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

    if not session_id or not user_id:
        return flask.render_template("quiz_student_result.html", results=[])

    query = (
        db.session.query(SessionAnswer, Question)
        .join(Question, SessionAnswer.question_id == Question.id)
        .filter(
            SessionAnswer.session_id == session_id,
            SessionAnswer.user_id == user_id
        )
        .order_by(Question.order_index)
    )

    answers = query.all()

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





def show_qtr_page(session_id=None):
    if session_id is None:
        session_id = request.args.get("session_id", type=int)

    if not session_id:
        return flask.render_template("quiz_teacher_result.html", students=[], stats=[], avg_accuracy=0)

    participants = db.session.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id
    ).all()

    student_results = []
    total_accuracy = 0
    count_students = 0
    question_stats = {}

    for participant in participants:
        user_id = participant.user_id

        user = db.session.query(User).filter(User.id == user_id).first()

        answers = db.session.query(SessionAnswer, Question).join(
            Question, SessionAnswer.question_id == Question.id
        ).filter(
            SessionAnswer.session_id == session_id,
            SessionAnswer.user_id == user_id
        ).all()

        if not answers:
            continue

        correct_count = sum(1 for a, q in answers if a.is_correct)
        total_count = len(answers)
        accuracy = round(correct_count / total_count * 100, 2)
        total_accuracy += accuracy
        count_students += 1

        for a, q in answers:
            if q.text not in question_stats:
                question_stats[q.text] = {"correct": 0, "total": 0}
            question_stats[q.text]["total"] += 1
            if a.is_correct:
                question_stats[q.text]["correct"] += 1

        student_results.append({
            "name": getattr(user, "username", None) or getattr(user, "name", None) or f"User {user_id}",
            "accuracy": f"{accuracy}% ({correct_count}/{total_count})"
        })

    avg_accuracy = round(total_accuracy / count_students, 2) if count_students else 0

    stats = []
    for q_text, s in question_stats.items():
        percent = round((s["correct"] / s["total"]) * 100, 2) if s["total"] else 0
        stats.append({"question": q_text, "percent": percent})

    return flask.render_template("quiz_teacher_result.html", students=student_results, stats=stats, avg_accuracy=avg_accuracy)
