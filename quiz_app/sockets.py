from flask_socketio import join_room, emit
from flask_login import current_user
from sqlalchemy import func, case
from project.settings import socketio, db
from .models import QuizSession, Question, SessionParticipant, SessionAnswer

def serialize_question(q: Question):
    return {"id": q.id, "text": q.text, "order_index": q.order_index}

def normalize(text: str) -> str:
    if not text:
        return ""
    t = text.strip().lower()
    filtered = "".join(ch if (ch.isalnum() or ch.isspace()) else " " for ch in t)
    return " ".join(filtered.split())

def is_correct(user_text: str, correct_raw: str) -> bool:
    return normalize(user_text) == normalize(correct_raw or "")

def current_question(session: QuizSession):
    if session.current_order is None:
        return None
    return Question.query.filter_by(quiz_id=session.quiz_id, order_index=session.current_order).first()

def next_question(session: QuizSession):
    return (Question.query
            .filter(Question.quiz_id == session.quiz_id,
                    Question.order_index > (session.current_order or 0))
            .order_by(Question.order_index.asc())
            .first())

def broadcast_state(code: str):
    sess = QuizSession.query.filter_by(code=code).first()
    if not sess:
        return
    participants = [{"user_id": p.user_id, "nickname": p.nickname}
                    for p in SessionParticipant.query.filter_by(session_id=sess.id)]
    data = {
        "status": sess.status, 
        "participants": participants, 
        "current_order": sess.current_order,
        "participants_count": len(participants) 
    }
    if sess.status == "IN_PROGRESS":
        quest = current_question(sess)
        if quest:
            data["question"] = serialize_question(quest)
    emit("room:state", data, to=code)
    

    emit("room:participants_list", {
        "participants": participants,
        "count": len(participants)
    }, to=code)


@socketio.on("join")
def on_join(data):
    code = str(data.get("code", "")).strip()
    as_host = bool(data.get("as_host"))

    if not code:
        return emit("error", {"message": "need code"})
    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Please Login to account"})

    sess = QuizSession.query.filter_by(code=code).first()
    if not sess or sess.status == "FINISHED":
        return emit("error", {"message": "Session unavailable"})

    if getattr(current_user, "is_admin", False) and not as_host:
        return emit("error", {"message": "The host cannot connect as a participant"})

    if as_host and getattr(current_user, "is_admin", False):
        SessionParticipant.query.filter_by(session_id=sess.id, user_id=current_user.id).delete()
        db.session.commit()
        join_room(code)
        broadcast_state(code)
        return

    display_name = (getattr(current_user, "nickname", None) or
                    getattr(current_user, "username", None) or
                    str(current_user.name))

    p = SessionParticipant.query.filter_by(session_id=sess.id, user_id=current_user.id).first()
    if not p:
        p = SessionParticipant(session_id=sess.id, user_id=current_user.id, nickname=display_name)
        db.session.add(p)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    join_room(code)
    emit("room:participants_update", {"nickname": display_name}, to=code)
    broadcast_state(code)

@socketio.on("admin:start")
def on_admin_start(data):
    code = str(data.get("code", "")).strip()
    sess = QuizSession.query.filter_by(code=code).first()
    if not sess:
        return emit("error", {"message": "Session not found"})
    if sess.status != "WAITING":
        return emit("error", {"message": "Session already running"})

    first_q = (Question.query.filter_by(quiz_id=sess.quiz_id)
               .order_by(Question.order_index.asc())
               .first())
    if not first_q:
        return emit("error", {"message": "Quiz has no questions"})

    sess.status = "IN_PROGRESS"
    sess.current_order = first_q.order_index
    db.session.commit()


    emit("delete_user", {"id": 1}, to=code)

    emit("room:question", serialize_question(first_q), to=code)
    broadcast_state(code)

@socketio.on("teacher:next")
def on_teacher_next(data):
    code = str(data.get("code", "")).strip()
    s = QuizSession.query.filter_by(code=code).first()
    if not s or s.status != "IN_PROGRESS":
        return

    q = current_question(s)
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

    nxt = next_question(s)
    if nxt:
        s.current_order = nxt.order_index
        db.session.commit()
        emit("room:question", serialize_question(nxt), to=code)
        broadcast_state(code)
    else:
        finish_session(s)

@socketio.on("teacher:finish")
def on_teacher_finish(data):
    code = str(data.get("code", "")).strip()
    s = QuizSession.query.filter_by(code=code).first()
    if s:
        finish_session(s)

def finish_session(s: QuizSession):
    s.status = "FINISHED"
    db.session.commit()
    results = final_results(s.id)
    emit("room:final_results", results, to=s.code)

def final_results(session_id: int):
    sub = (db.session.query(SessionAnswer.user_id.label("uid"),
                            func.sum(case((SessionAnswer.is_correct == True, 1), else_=0)).label("score"))
           .filter(SessionAnswer.session_id == session_id)
           .group_by(SessionAnswer.user_id)
           .subquery())

    rows = (db.session.query(SessionParticipant.nickname,
                             func.coalesce(sub.c.score, 0).label("score"))
            .outerjoin(sub, SessionParticipant.user_id == sub.c.uid)
            .filter(SessionParticipant.session_id == session_id)
            .order_by(func.coalesce(sub.c.score, 0).desc())
            .all())

    return [{"nickname": nick, "score": int(score)} for nick, score in rows]

@socketio.on("participant:answer")
def on_answer(data):
    code = str(data.get("code", "")).strip()
    answer_text = (data.get("answer") or data.get("selected") or "").strip()

    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Login to account"})

    session = QuizSession.query.filter_by(code=code).first()
    if not session or session.status != "IN_PROGRESS":
        return emit("error", {"message": "Session inactive"})

    cur_quest = current_question(session)
    if not cur_quest:
        return

    exists = SessionAnswer.query.filter_by(session_id=session.id,
                                         user_id=current_user.id,
                                         question_id=cur_quest.id).first()
    if exists:
        return

    i_correct = is_correct(answer_text, cur_quest.correct_answer)
    db.session.add(SessionAnswer(session_id=session.id,
                               user_id=current_user.id,
                               question_id=cur_quest.id,
                               answer_text=answer_text,
                               is_correct=i_correct))
    db.session.commit()

    total = SessionParticipant.query.filter_by(session_id=session.id).count()


    answered = SessionAnswer.query.filter_by(session_id=session.id, question_id=cur_quest.id).count()
    emit("room:answers_progress", {"question_id": cur_quest.id, "answered": answered, "total": total}, to=code)

@socketio.on("switch_content")
def switch(data):
    code = str(data.get("code", "")).strip()
    emit('student:switch_content', to=code)













@socketio.on("join")
def on_join(data):
    code = str(data.get("code", "")).strip()
    as_host = bool(data.get("as_host"))

    if not code:
        return emit("error", {"message": "need code"})
    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Please Login to account"})

    sess = QuizSession.query.filter_by(code=code).first()
    if not sess or sess.status == "FINISHED":
        return emit("error", {"message": "Session unavailable"})

    if getattr(current_user, "is_admin", False) and not as_host:
        return emit("error", {"message": "The host cannot connect as a participant"})

    if as_host and getattr(current_user, "is_admin", False):
        SessionParticipant.query.filter_by(session_id=sess.id, user_id=current_user.id).delete()
        db.session.commit()
        join_room(code)
        broadcast_state(code)
        return

    display_name = (getattr(current_user, "nickname", None) or
                    getattr(current_user, "username", None) or
                    str(current_user.name))

    p = SessionParticipant.query.filter_by(session_id=sess.id, user_id=current_user.id).first()
    if not p:
        p = SessionParticipant(session_id=sess.id, user_id=current_user.id, nickname=display_name)
        db.session.add(p)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    join_room(code)
    

    emit("room:joined", {"code": code, "nickname": display_name})
    

    broadcast_participants(code)
    broadcast_state(code)

def broadcast_participants(code):

    sess = QuizSession.query.filter_by(code=code).first()
    if not sess:
        return
    
    participants = SessionParticipant.query.filter_by(session_id=sess.id).all()
    participants_list = [{"id": p.user_id, "nickname": p.nickname} for p in participants]
    

    emit("room:participants_list", {
        "participants": participants_list,
        "count": len(participants_list)
    }, to=code)

@socketio.on("request_participants")
def on_request_participants(data):

    code = str(data.get("code", "")).strip()
    broadcast_participants(code)
    
    
    
    
    
    
    
    
    
    
    
    
    
@socketio.on("teacher:remove_participant")
def on_remove_participant(data):
    code = str(data.get("code", "")).strip()
    user_id = data.get("user_id")
    
    if not code or not user_id:
        return emit("error", {"message": "Need code and user_id"})
    
    sess = QuizSession.query.filter_by(code=code).first()
    if not sess:
        return emit("error", {"message": "Session not found"})
    

    participant = SessionParticipant.query.filter_by(
        session_id=sess.id, 
        user_id=user_id
    ).first()
    
    if participant:

        SessionAnswer.query.filter_by(
            session_id=sess.id,
            user_id=user_id
        ).delete()
        
        db.session.delete(participant)
        db.session.commit()
        

        broadcast_participants(code)
        broadcast_state(code)
        
        emit("teacher:participant_removed", {
            "user_id": user_id,
            "message": "Participant removed successfully"
        })
    else:
        emit("error", {"message": "Participant not found"})

@socketio.on("request_participants")
def on_request_participants(data):

    code = str(data.get("code", "")).strip()
    broadcast_participants(code)