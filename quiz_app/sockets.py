from flask_socketio import join_room, emit, disconnect
from flask_login import current_user
from project.settings import socketio, db
from .models import QuizSession, Question, SessionParticipant, SessionAnswer
from New_Quiz_App.models import Quiz
from flask import request
import colorama
from profile_app.models import User
user_sessions = {}

def serialize_question(q: Question):
    qz = Quiz.query.filter_by(id = q.quiz_id).first()
    print(qz)
    variants = []
    for var in q.correct_answer.split('|'):
        print(var)
        variants.append(var.split(':')[0])
    return {"id": q.id, "text": q.text, "order_index": q.order_index, "q_quantity": qz.count_questions, "q_type": q.type, "q_variants": variants}

def normalize(text: str) -> str:
    if not text:
        return ""
    t = text.strip().lower()
    filtered = "".join(ch if (ch.isalnum() or ch.isspace()) else " " for ch in t)
    return " ".join(filtered.split())

def is_correctt(user_text: str, correct_raw: str, type: str) -> bool:
    if type == 'fform' or type == 'letters':
        return normalize(user_text) == normalize(correct_raw or "")
    if type == 'select': 
        return user_text == correct_raw

def current_question(session: QuizSession):
    if session.current_order is None:
        return None
    return Question.query.filter_by(quiz_id=session.quiz_id, order_index=session.current_order).first()

def next_question(session: QuizSession):

    return (Question.query.filter(Question.quiz_id == session.quiz_id, Question.order_index > (session.current_order or 0)).order_by(Question.order_index.asc()).first())

def broadcast_state(code: str):

    sessio = QuizSession.query.filter_by(code=code).first()
    quiz = Quiz.query.filter_by(id=sessio.quiz_id).first()

    if not sessio:
        return
    
    participants = []
    
    cur_quest = current_question(sessio) if sessio.status == "IN_PROGRESS" else None
    
    answered_users = []


    if cur_quest:
        answered_users = SessionAnswer.query.filter_by(
            session_id=sessio.id,
            question_id=cur_quest.id
        ).all()

    answered_user_ids = {ans.user_id: ans.is_correct for ans in answered_users}
    

    for partici in SessionParticipant.query.filter_by(session_id=sessio.id):
        participants.append({
            "user_id": partici.user_id,
            "nickname": partici.nickname,
            "answered": partici.user_id in answered_user_ids,
            "is_correct": answered_user_ids.get(partici.user_id, None)
        })

    data = {"status": sessio.status, "participants": participants, "current_order": sessio.current_order, "quiz_name": quiz.name, "quiz_code": code}

    if sessio.status == "IN_PROGRESS":

        quest = current_question(sessio)
        
        if quest:
            data["question"] = serialize_question(quest)

    emit("room:state", data, to=code)

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
        
        return emit("error", {"message": "Session unavaible"})

    if getattr(current_user, "is_teacher", False) and not as_host:
        return emit("error", {"message": "The host cannot connect as a participant"})

    if as_host and getattr(current_user, "is_teacher", False):
        teacher = SessionParticipant.query.filter_by(session_id=sess.id, user_id=current_user.id)
        if teacher:
            teacher.delete()
        db.session.commit()
        join_room(code)
        broadcast_state(code)
        return

    display_name = f"{current_user.name}"
    display_id = current_user.id 

    p = SessionParticipant.query.filter_by(session_id=sess.id, user_id=current_user.id).first()
    is_new_participant = False
    if not p:
        p = SessionParticipant(session_id=sess.id, user_id=current_user.id, nickname=display_name)
        db.session.add(p)
        is_new_participant = True
        try:
            db.session.commit()

        except Exception:
            db.session.rollback()
            return
        
    user_sessions[display_id] = request.sid
    print(user_sessions, request.sid)
    join_room(code)

    if is_new_participant:
        emit("room:participants_update", {"nickname": display_name, "id": display_id, "sess_status" : sess.status}, to=code)

    broadcast_state(code)

@socketio.on("teacher:start")
def on_teacher_start(data):
    code = str(data.get("code", "")).strip()
    sess = QuizSession.query.filter_by(code=code).first()
    if not sess:
        return emit("error", {"message": "Session not wound"})
    if sess.status != "WAITING":
        return emit("error", {"message": "Session already run"})

    first_q = Question.query.filter_by(quiz_id=sess.quiz_id).order_by(Question.order_index.asc()).first()
    if not first_q:
        return emit("error", {"message": "This quiz without questions"})

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

    nxt = next_question(s)
    if nxt:
        s.current_order = nxt.order_index
        db.session.commit()
        emit("room:question", serialize_question(nxt), to=code)
        broadcast_state(code)
    else:
        finish_session(s, code)

def finish_session(s: QuizSession, code):
    s.status = "FINISHED"
    s.code = 0
    db.session.commit()
    final_results(s.id)
    emit('finish_session', {"session_id": s.id}, to=code)
    
def final_results(session_idd: int):
    # quiz_session = QuizSession.query.filter_by(id=session_idd).first()
    # quiz = Quiz.query.filter_by(id=quiz_session.quiz_id).first()
    # participants = SessionParticipant.query.filter_by(session_id=session_idd).all()
    # print(f"\nquiz_session:\n{quiz_session}\n\nquiz:\n{quiz}\n\nparticipants:\n{participants}")
    # for part in participants:
    #     print(f"{part.nickname} and {part.user_id}\n")
    pass
@socketio.on("check_answers")
def check_answer(data):
    code = str(data.get("code", "")).strip()
    session = QuizSession.query.filter_by(code=code).first()
    cur_quest = current_question(session)

    total = SessionParticipant.query.filter_by(session_id=session.id).count()
    answered = SessionAnswer.query.filter_by(session_id=session.id, question_id=cur_quest.id).count()
    emit('update_answers', {"total": total, "answered": answered}, to=code)

@socketio.on("participant:answer")
def on_answer(data):

    code = str(data.get("code", "")).strip()

    answer_text = (data.get("answer")).strip()

    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Login to account"})

    session = QuizSession.query.filter_by(code=code).first()
    if not session or session.status != "IN_PROGRESS":
        return emit("error", {"message": "Session inactive"})

    cur_quest = current_question(session)
    if not cur_quest:
        return

    exists = SessionAnswer.query.filter_by(session_id=session.id, user_id=current_user.id, question_id=cur_quest.id).first()
    if exists:
        return

    print("YOYOYOY", answer_text)
    i_correct = is_correctt(answer_text, cur_quest.correct_answer, type=cur_quest.type)
    
    answr = SessionAnswer(
        session_id=session.id,
        user_id=current_user.id,
        question_id=cur_quest.id,
        answer_text=answer_text,
        is_correct=i_correct)
    db.session.add(answr)
    db.session.commit()
    print(type(current_user.id), user_sessions)
    if current_user.id in user_sessions:
        
        sid = user_sessions[current_user.id]
        print(sid)
        emit("waiting_overlay", {"overlay": True, "answer": i_correct}, to=sid)

    all_participants = SessionParticipant.query.filter_by(session_id=session.id).all()

    answered_users = SessionAnswer.query.filter_by(
        session_id=session.id, 
        question_id=cur_quest.id
    ).all()
    
    participants_status = []
    answered_user_ids = {ans.user_id for ans in answered_users}
    
    for participant in all_participants:
        user = User.query.get(participant.user_id)
        if not user:
            continue
        participants_status.append({
            "user_id": user.id,
            "username": participant.nickname,
            "email": user.email,
            "answered": user.id in answered_user_ids,
            "is_correct": next((ans.is_correct for ans in answered_users if ans.user_id == user.id), None)
        })

    answered = len(answered_users)
    total = len(all_participants)

    emit("room:answers_progress", {
        "question_id": cur_quest.id,
        "answered": answered,
        "total": total,
        "participants": participants_status
    }, to=code)

@socketio.on("switch_content")
def switch_content(data):
    print(1234123)
    code = str(data.get("code", "")).strip()
    emit('student:switch_content', {}, to=code)


@socketio.on("rm_user_from_session")
def on_remove_user(data):
    code = str(data.get("code", "")).strip()
    user_id = int(data.get("user_id"))
    print('WEBSOCKET: rm_user_from_session', code, user_id)
    if not code:
        return emit("error", {"message": "need code"})
    
    if not user_id:
        return emit("error", {"message": "need user_id"})

    if not getattr(current_user, "is_authenticated", False):
        return emit("error", {"message": "Please Login to account"})
    
    if not getattr(current_user, "is_teacher", False):
        return emit("error", {"message": "Only host can remove participants"})

    sess = QuizSession.query.filter_by(code=code).first()
    if not sess:
        return emit("error", {"message": "Session not found"})

    participant = SessionParticipant.query.filter_by(session_id=sess.id, user_id=user_id).first()
    
    if not participant:
        return emit("error", {"message": "Participant not found"})
    
    removed_id = participant.user_id
    removed_nickname = participant.nickname
    

    print(type(user_id), user_sessions)
    if user_id in user_sessions:
        sid = user_sessions[user_id]

        emit('kickedd', {"message": 'Вчитель вигнав тебе з класу.'} , to=sid)
        
        try:
            del user_sessions[user_id]
            db.session.delete(participant)
            print("successfully deleted")
        except Exception as e:
            print(e)
            return
        return
   

    SessionAnswer.query.filter_by(session_id=sess.id, user_id=user_id).delete()
    
    try:
        db.session.commit()
        
        emit("room:user_kicked", {
            "id": removed_id,
            "nickname": removed_nickname
        }, to=code)
        
        broadcast_state(code)
        
    except Exception as e:
        db.session.rollback()
        return emit("error", {"message": f"Failed to remove user: {str(e)}"})
    

