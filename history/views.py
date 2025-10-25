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

    if not session_id or not user_id:
        return flask.render_template("quiz_student_result.html", results=[], score_percent=0)

    # Получаем ответы пользователя
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
    correct_count = 0
    total_count = len(answers)

    for answer, question in answers:
        is_correct = bool(answer.is_correct) if answer.is_correct is not None else answer.answer_text.strip() == question.correct_answer.strip()
        if is_correct:
            correct_count += 1

        results.append({
            "order": question.order_index,
            "question": question.text,
            "user_answer": answer.answer_text,
            "correct_answer": question.correct_answer,
            "is_correct": is_correct
        })

    # Считаем общую точность
    score_percent = round(correct_count / total_count * 100, 2) if total_count else 0

    return flask.render_template(
        "quiz_student_result.html",
        results=results,
        score_percent=score_percent
    )



def show_qtr_page(session_id=None):
    if session_id is None:
        session_id = request.args.get("session_id", type=int)

    if not session_id:
        return flask.render_template("quiz_teacher_result.html", students=[], stats=[], avg_accuracy=0)

    session = db.session.query(QuizSession).filter_by(id=session_id).first()
    if not session:
        return flask.render_template("quiz_teacher_result.html", students=[], stats=[], avg_accuracy=0)

    questions = db.session.query(Question).filter(Question.quiz_id == session.quiz_id).order_by(Question.order_index).all()
    participants = db.session.query(SessionParticipant).filter_by(session_id=session_id).all()

    question_stats = {q.id: {"text": q.text, "correct": 0, "total": 0} for q in questions}
    student_results = []

    for participant in participants:
        user_id = participant.user_id
        nickname = participant.nickname

        answers = db.session.query(SessionAnswer).filter_by(session_id=session_id, user_id=user_id).all()
        correct_count = 0
        total_count = len(answers)

        for a in answers:
            question = next((q for q in questions if q.id == a.question_id), None)
            if not question:
                continue
            is_correct = (a.answer_text.strip() == question.correct_answer.strip())
            if is_correct:
                correct_count += 1
                question_stats[question.id]["correct"] += 1
            question_stats[question.id]["total"] += 1

        if total_count == 0:
            continue

        accuracy = round(correct_count / total_count * 100, 2)
        student_results.append({"id": user_id, "name": nickname, "accuracy": accuracy})

   
    avg_accuracy = round(sum(s["accuracy"] for s in student_results) / len(student_results), 2) if student_results else 0


    stats = []
    for q in questions:
        s = question_stats[q.id]
        percent = round((s["correct"] / s["total"]) * 100, 2) if s["total"] else 0
        stats.append({"question": q.text, "percent": percent})

    return flask.render_template( "quiz_teacher_result.html", students=student_results, stats=stats, avg_accuracy=avg_accuracy,session_id=session_id )
