from sqlalchemy import UniqueConstraint
from project.settings import db

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), index=True, nullable=False)
    order_index = db.Column(db.Integer, index=True, nullable=False)
    text = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Text, nullable=False)
    type = db.Column(db.Integer, nullable=False)
    image_path = db.Column(db.String(255), nullable=True)

class QuizSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), index=True, nullable=False)
    code = db.Column(db.String(6), unique=True, index=True, nullable=False)
    status = db.Column(db.String(20), default="WAITING", nullable=False)
    current_order = db.Column(db.Integer, nullable=True)
    who_host = db.Column(db.Integer, db.ForeignKey("user.id"), index=True, nullable=False)
    group = db.Column(db.Integer, db.ForeignKey("classes.id"), index=True, nullable=False)

class QuizSessionReception(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.Integer, db.ForeignKey("user.id"), index=True, nullable=False)
    session = db.Column(db.Integer, db.ForeignKey("quiz_session.id"), index=True, nullable=False)
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
    total_result = db.Column(db.JSON)
    __table_args__ = (UniqueConstraint('session_id', 'user_id', 'question_id', name='uq_answer_once'),)
    
    def session_percentage(s_id):
        all_answers = len(SessionAnswer.query.filter_by(session_id=s_id).all())
        true_answers = len(SessionAnswer.query.filter_by(session_id=s_id).filter_by(is_correct=True).all())
        percentage =  true_answers / all_answers * 100
        percentage = str(percentage) + '%'
        return percentage