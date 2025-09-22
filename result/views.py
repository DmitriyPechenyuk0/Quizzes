import flask
import flask_login
from flask import session

from quiz_app.models import Question, SessionAnswer

def show_result_page():
    # достаём все ответы пользователя из базы (не из flask.session, а из таблицы)
    session_id = session.get("session_id")
    user_id = flask_login.current_user.id

    user_answers = SessionAnswer.query.filter_by(session_id=session_id, user_id=user_id).all()

    results = []
    for ua in user_answers:
        question = Question.query.get(ua.question_id)
        results.append({
            "question": question.text,
            "user_answer": ua.answer_text,
            "correct_answer": question.correct_answer,
            "is_correct": ua.is_correct
        })

    # Отримуємо загальну статистику для всіх користувачів
    all_answers = SessionAnswer.query.filter_by(session_id=session_id).all()
    
    # Розраховуємо статистику по питаннях
    question_stats = {}
    for answer in all_answers:
        question_id = answer.question_id
        if question_id not in question_stats:
            question_stats[question_id] = {"total": 0, "correct": 0}
        
        question_stats[question_id]["total"] += 1
        if answer.is_correct:
            question_stats[question_id]["correct"] += 1
    
    # Перетворюємо статистику у відсотки
    question_percentages = {}
    for question_id, stats in question_stats.items():
        question = Question.query.get(question_id)
        percentage = (stats["correct"] / stats["total"]) * 100 if stats["total"] > 0 else 0
        question_percentages[question.text] = round(percentage)
    
    # Розраховуємо середню точність по групі
    total_accuracy = 0
    user_count = 0
    
    # Отримуємо унікальних користувачів
    unique_users = set([answer.user_id for answer in all_answers])
    
    for user in unique_users:
        user_answers = [a for a in all_answers if a.user_id == user]
        correct_count = sum(1 for a in user_answers if a.is_correct)
        total_questions = len(user_answers)
        
        if total_questions > 0:
            user_accuracy = (correct_count / total_questions) * 100
            total_accuracy += user_accuracy
            user_count += 1
    
    average_accuracy = round(total_accuracy / user_count) if user_count > 0 else 0
    
    return flask.render_template(
        "result.html", 
        results=results,
        question_stats=question_percentages,
        average_accuracy=average_accuracy
    )