import random
from flask import request, jsonify, abort, render_template, redirect, url_for
from sqlalchemy import text
from flask_login import current_user
from project.settings import db
from .models import QuizSession, Question
from profile_app.models import User
from New_Quiz_App.models import Quiz
def _gen_code():
    while True:
        code = f"{random.randint(0, 999999):06d}"
        if code != "000000" and not QuizSession.query.filter_by(code=code).first():
            return code

def _quiz_exists(quiz_id: int) -> bool:
    row = Quiz.query.filter_by(id=quiz_id).first()
    return bool(row)

def create_session():
    if not getattr(current_user, "is_authenticated", False):
        abort(401)
    if not getattr(current_user, "is_admin", False):
        abort(403)

    data = request.get_json(silent=True) or {}
    quiz_id = data.get("quiz_id") or request.form.get("quiz_id")
    try:
        quiz_id = int(quiz_id)
    except (TypeError, ValueError):
        abort(400, "quiz_id is required and must be integer")

    if not _quiz_exists(quiz_id):
        abort(404, "Quiz not found")
    if Question.query.filter_by(quiz_id=quiz_id).count() == 0:
        abort(400, "Quiz has no questions")

    s = QuizSession(quiz_id=quiz_id, code=_gen_code(), status="WAITING", current_order=None, who_host=current_user.id)
    db.session.add(s); db.session.commit()
    return jsonify({"session_id": s.id, "code": s.code})

def start_session_redirect(quiz_id: int):
    if not getattr(current_user, "is_authenticated", False):
        abort(401)
    if not getattr(current_user, "is_teacher", False):
        abort(403)

    if not _quiz_exists(quiz_id):
        abort(404, "Quiz not found")
    if Question.query.filter_by(quiz_id=quiz_id).count() == 0:
        abort(400, "Quiz has no questions")
    usr =User.query.filter_by(id=current_user.id).first()
    
    s = QuizSession(quiz_id=quiz_id, code=_gen_code(), status="WAITING", current_order=None, who_host=current_user.id, group = usr.group)
    db.session.add(s); db.session.commit()
    return redirect(url_for("quiz_app.host_page", code=s.code))

def join_page():
    code = request.args.get("code", "")
    quizzes = Quiz.query.all()
    context = {'page': 'home',
               'is_auth': current_user.is_authenticated,
               'name': current_user.name,
               'quizzes': quizzes}
    
    return render_template("join.html", code=code, **context)

def host_page(code):
    return render_template("teacher_room.html", code=code)