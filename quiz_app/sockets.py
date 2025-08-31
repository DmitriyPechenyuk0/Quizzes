from flask_socketio import join_room, emit
from flask_login import current_user
from sqlalchemy import func, case
from project.settings import socketio, db
from .models import QuizSession, Question, SessionParticipant, SessionAnswer

def _serialize_question(q: Question):
    return {"id": q.id, "text": q.text, "order_index": q.order_index}

def _normalize(text: str) -> str:
    if not text:
        return ""
    t = text.strip().lower()
    filtered = "".join(ch if (ch.isalnum() or ch.isspace()) else " " for ch in t)
    return " ".join(filtered.split())

def _is_correct(user_text: str, correct_raw: str) -> bool:
    return _normalize(user_text) == _normalize(correct_raw or "")

def _current_question(session: QuizSession):
    if session.current_order is None:
        return None
    return Question.query.filter_by(quiz_id=session.quiz_id, order_index=session.current_order).first()

def _next_question(session: QuizSession):
    return (Question.query
            .filter(Question.quiz_id == session.quiz_id, Question.order_index > (session.current_order or 0))
            .order_by(Question.order_index.asc())
            .first())

def _broadcast_state(code: str):
    s = QuizSession.query.filter_by(code=code).first()
    if not s:
        return
    participants = [{"user_id": p.user_id, "nickname": p.nickname}
                    for p in SessionParticipant.query.filter_by(session_id=s.id).all()]
    payload = {"status": s.status, "participants": participants, "current_order": s.current_order}
    if s.status == "IN_PROGRESS":
        q = _current_question(s)
        if q:
            payload["question"] = _serialize_question(q)
    emit("room:state", payload, to=code)

@socketio.on("join")
def on_join(data):
    code = str(data.get("code", "")).strip()
    if not code:
        return emit("error", {"message": "Нужен code"})
    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Войдите в аккаунт"})

    s = QuizSession.query.filter_by(code=code).first()
    if not s or s.status == "FINISHED":
        return emit("error", {"message": "Сессия недоступна"})

    display_name = getattr(current_user, "nickname", None) or \
                   getattr(current_user, "username", None) or f"user_{current_user.id}"

    p = SessionParticipant.query.filter_by(session_id=s.id, user_id=current_user.id).first()
    if not p:
        p = SessionParticipant(session_id=s.id, user_id=current_user.id, nickname=display_name)
        db.session.add(p)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    join_room(code)
    emit("room:participants_update", {"nickname": display_name}, to=code)
    _broadcast_state(code)

@socketio.on("teacher:start")
def on_teacher_start(data):
    code = str(data.get("code", "")).strip()
    s = QuizSession.query.filter_by(code=code).first()
    if not s:
        return emit("error", {"message": "Сессия не найдена"})
    if s.status != "WAITING":
        return emit("error", {"message": "Сессия уже запущена/завершена"})

    first_q = Question.query.filter_by(quiz_id=s.quiz_id).order_by(Question.order_index.asc()).first()
    if not first_q:
        return emit("error", {"message": "В этом квизе нет вопросов"})

    s.status = "IN_PROGRESS"
    s.current_order = first_q.order_index
    db.session.commit()

    emit("room:question", _serialize_question(first_q), to=code)
    _broadcast_state(code)

@socketio.on("teacher:next")
def on_teacher_next(data):
    code = str(data.get("code", "")).strip()
    s = QuizSession.query.filter_by(code=code).first()
    if not s or s.status != "IN_PROGRESS":
        return

    q = _current_question(s)
    if not q:
        return

    total = SessionParticipant.query.filter_by(session_id=s.id).count()
    answered = SessionAnswer.query.filter_by(session_id=s.id, question_id=q.id).count()
    correct = SessionAnswer.query.filter_by(session_id=s.id, question_id=q.id, is_correct=True).count()
    emit("room:question_closed", {
        "question_id": q.id,
        "stats": {"total": total, "answered": answered, "correct": correct},
        "correct_answer": q.correct_answer
    }, to=code)

    nxt = _next_question(s)
    if nxt:
        s.current_order = nxt.order_index
        db.session.commit()
        emit("room:question", _serialize_question(nxt), to=code)
        _broadcast_state(code)
    else:
        _finish_session(s)

@socketio.on("teacher:finish")
def on_teacher_finish(data):
    code = str(data.get("code", "")).strip()
    s = QuizSession.query.filter_by(code=code).first()
    if s:
        _finish_session(s)

def _finish_session(s: QuizSession):
    s.status = "FINISHED"
    db.session.commit()
    results = _final_results(s.id)
    emit("room:final_results", results, to=s.code)

def _final_results(session_id: int):
    sub = db.session.query(
        SessionAnswer.user_id.label("uid"),
        func.sum(
            case((SessionAnswer.is_correct == True, 1), else_=0)  # noqa: E712
        ).label("score")
    ).filter(SessionAnswer.session_id == session_id
    ).group_by(SessionAnswer.user_id).subquery()

    rows = db.session.query(
        SessionParticipant.nickname,
        func.coalesce(sub.c.score, 0).label("score")
    ).outerjoin(sub, SessionParticipant.user_id == sub.c.uid
    ).filter(SessionParticipant.session_id == session_id
    ).order_by(func.coalesce(sub.c.score, 0).desc()
    ).all()

    return [{"nickname": nick, "score": int(score)} for nick, score in rows]

@socketio.on("participant:answer")
def on_answer(data):
    code = str(data.get("code", "")).strip()
    answer_text = (data.get("answer") or data.get("selected") or "").strip()

    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Войдите в аккаунт"})

    s = QuizSession.query.filter_by(code=code).first()
    if not s or s.status != "IN_PROGRESS":
        return emit("error", {"message": "Сессия не активна"})

    q = _current_question(s)
    if not q:
        return emit("error", {"message": "Нет активного вопроса"})

    exists = SessionAnswer.query.filter_by(session_id=s.id, user_id=current_user.id, question_id=q.id).first()
    if exists:
        return

    is_correct = _is_correct(answer_text, q.correct_answer)
    db.session.add(SessionAnswer(
        session_id=s.id, user_id=current_user.id,
        question_id=q.id, answer_text=answer_text, is_correct=is_correct
    ))
    db.session.commit()

    total = SessionParticipant.query.filter_by(session_id=s.id).count()
    answered = SessionAnswer.query.filter_by(session_id=s.id, question_id=q.id).count()
    emit("room:answers_progress", {"question_id": q.id, "answered": answered, "total": total}, to=code)