from sqlalchemy import UniqueConstraint
from project.settings import db

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), index=True, nullable=False)
    order_index = db.Column(db.Integer, index=True, nullable=False)
    text = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Text, nullable=False)

class QuizSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), index=True, nullable=False)
    code = db.Column(db.String(6), unique=True, index=True, nullable=False)
    status = db.Column(db.String(20), default="WAITING", nullable=False)
    current_order = db.Column(db.Integer, nullable=True)

class SessionParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_session.id"), index=True, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    nickname = db.Column(db.String(50), nullable=False)
    __table_args__ = (UniqueConstraint('session_id', 'user_id', name='uq_session_user'),)

class SessionAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_session.id"), index=True, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("question.id"), index=True, nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=True)
    __table_args__ = (UniqueConstraint('session_id', 'user_id', 'question_id', name='uq_answer_once'),)