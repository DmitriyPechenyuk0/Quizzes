from collections import defaultdict
from quiz_app.models import (
    Question, QuizSession, SessionParticipant,
    SessionAnswer
)
from New_Quiz_App.models import Quiz
from profile_app.models import User
from control.models import Group, Class

def get_student_results(session_id: int, user_id: int) -> dict:
    session = QuizSession.query.get_or_404(session_id)
    quiz    = Quiz.query.get_or_404(session.quiz_id)

    questions = (
        Question.query
        .filter_by(quiz_id=quiz.id)
        .order_by(Question.order_index)
        .all()
    )
    question_ids  = [q.id for q in questions]
    total_questions = len(questions)
    my_answers = (
        SessionAnswer.query
        .filter_by(session_id=session_id, user_id=user_id)
        .filter(SessionAnswer.question_id.in_(question_ids))
        .all()
    )
    my_map = {a.question_id: a for a in my_answers}

    answers_data = []
    correct_count = 0
    wrong_count   = 0
    skipped_count = 0

    for q in questions:
        ans = my_map.get(q.id)
        if ans is None:
            skipped_count += 1
            answers_data.append({
                "question_id":    q.id,
                "order":          q.order_index,
                "text":           q.text,
                "correct_answer": q.correct_answer,
                "status":         "skipped",
                "given":          None,
                "time_sec":       None,
            })
        else:
            if ans.is_correct:
                correct_count += 1
            else:
                wrong_count += 1
            answers_data.append({
                "question_id":    q.id,
                "order":          q.order_index,
                "text":           q.text,
                "correct_answer": q.correct_answer,
                "status":         "correct" if ans.is_correct else "wrong",
                "given":          ans.answer_text,
                "time_sec":       None,
            })

    score_pct = _pct(correct_count, total_questions)

    all_session_answers = (
        SessionAnswer.query
        .filter_by(session_id=session_id)
        .filter(SessionAnswer.question_id.in_(question_ids))
        .all()
    )

    scores_by_user = defaultdict(lambda: {"correct": 0, "total": total_questions})
    for a in all_session_answers:
        if a.is_correct:
            scores_by_user[a.user_id]["correct"] += 1

    all_scores = [
        _pct(v["correct"], total_questions)
        for v in scores_by_user.values()
    ]

    avg_score  = _avg(all_scores)
    best_score = max(all_scores) if all_scores else 0

    participant = SessionParticipant.query.filter_by(
        session_id=session_id, user_id=user_id
    ).first()
    student_name = participant.nickname if participant else "Учень"

    return {
        "meta": {
            "quiz_name":    quiz.name,
            "subject":      quiz.subject,
            "student_name": student_name,
        },
        "score": {
            "pct":     score_pct,
            "grade12": _to_12(score_pct),
            "correct": correct_count,
            "wrong":   wrong_count,
            "skipped": skipped_count,
            "avg_time_sec": None,
        },
        "comparison": {
            "my_score":  score_pct,
            "avg_score": avg_score,
            "best_score": best_score,
        },
        "answers": answers_data,
    }

def get_quiz_results(session_id: int) -> dict:
    session   = QuizSession.query.get_or_404(session_id)
    quiz      = Quiz.query.get_or_404(session.quiz_id)
    questions = (
        Question.query
        .filter_by(quiz_id=quiz.id)
        .order_by(Question.order_index)
        .all()
    )
    question_ids       = [q.id for q in questions]
    participants       = SessionParticipant.query.filter_by(session_id=session_id).all()
    total_participants = len(participants)

    all_answers = (
        SessionAnswer.query
        .filter_by(session_id=session_id)
        .filter(SessionAnswer.question_id.in_(question_ids))
        .all()
    )

    answers_by_question = defaultdict(list)
    answers_by_user     = defaultdict(list)
    for ans in all_answers:
        answers_by_question[ans.question_id].append(ans)
        answers_by_user[ans.user_id].append(ans)

    questions_data = []
    for q in questions:
        q_answers = answers_by_question[q.id]
        correct   = sum(1 for a in q_answers if a.is_correct is True)
        wrong     = sum(1 for a in q_answers if a.is_correct is False)
        questions_data.append({
            "id":             q.id,
            "order":          q.order_index,
            "text":           q.text,
            "correct_answer": q.correct_answer,
            "type":           q.type,
            "image_path":     q.image_path,
            "correct_pct":    _pct(correct, total_participants),
            "wrong_pct":      _pct(wrong,   total_participants),
            "skipped_pct":    _pct(total_participants - len(q_answers), total_participants),
        })

    students_data  = []
    total_questions = len(questions)

    for p in participants:
        p_answers    = answers_by_user[p.user_id]
        answered_map = {a.question_id: a for a in p_answers}
        correct_count = sum(1 for a in p_answers if a.is_correct is True)
        score_pct     = _pct(correct_count, total_questions)

        answers_detail = []
        for q in questions:
            ans = answered_map.get(q.id)
            if ans is None:
                answers_detail.append({"question_id": q.id, "status": "skipped", "given": None})
            else:
                answers_detail.append({
                    "question_id": q.id,
                    "status":      "correct" if ans.is_correct else "wrong",
                    "given":       ans.answer_text,
                })

        students_data.append({
            "user_id":       p.user_id,
            "name":          p.nickname,
            "score_pct":     score_pct,
            "correct_count": correct_count,
            "total":         total_questions,
            "answers":       answers_detail,
        })

    students_data.sort(key=lambda s: s["score_pct"], reverse=True)

    scores       = [s["score_pct"] for s in students_data]
    avg_score    = _avg(scores)
    below_50     = _pct(sum(1 for s in scores if s < 50),  total_participants)
    mid_50_74    = _pct(sum(1 for s in scores if 50 <= s < 75), total_participants)
    above_75     = _pct(sum(1 for s in scores if s >= 75), total_participants)

    avg_correct_pct = _avg([q["correct_pct"] for q in questions_data])
    avg_wrong_pct   = _avg([q["wrong_pct"]   for q in questions_data])
    avg_skipped_pct = _avg([q["skipped_pct"] for q in questions_data])

    return {
        "session": {
            "id":        session.id,
            "code":      session.code,
            "status":    session.status,
            "quiz_name": quiz.name,
            "subject":   quiz.subject,
        },
        "questions": questions_data,
        "students":  students_data,
        "summary": {
            "total_participants": total_participants,
            "total_questions":    total_questions,
            "avg_score_100":      avg_score,
            "avg_score_12":       _to_12(avg_score),
            "avg_correct_pct":    avg_correct_pct,
            "avg_wrong_pct":      avg_wrong_pct,
            "avg_skipped_pct":    avg_skipped_pct,
            "best":  {"name": students_data[0]["name"],  "score": students_data[0]["score_pct"]}  if students_data else None,
            "worst": {"name": students_data[-1]["name"], "score": students_data[-1]["score_pct"]} if students_data else None,
            "dist": {
                "below_50":  below_50,
                "mid_50_74": mid_50_74,
                "above_75":  above_75,
            }
        }
    }


def _pct(part: int, total: int) -> int:
    return round(part / total * 100) if total else 0

def _avg(values: list) -> int:
    return round(sum(values) / len(values)) if values else 0

def _to_12(pct: int) -> int:
    if pct >= 90: return 12
    if pct >= 83: return 11
    if pct >= 75: return 10
    if pct >= 67: return 9
    if pct >= 58: return 8
    if pct >= 50: return 7
    if pct >= 42: return 6
    if pct >= 33: return 5
    if pct >= 25: return 4
    if pct >= 17: return 3
    if pct >= 8:  return 2
    return 1