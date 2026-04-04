from sqlalchemy import UniqueConstraint
from project.settings import db
import datetime
class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), index=True, nullable=False)
    order_index = db.Column(db.Integer, index=True, nullable=False)
    text = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(255), nullable=False)
    image_path = db.Column(db.String(255), nullable=True)
    time_limit = db.Column(db.Integer, nullable=True)
    points = db.Column(db.Integer, default=100)


class QuizSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), index=True, nullable=False)
    code = db.Column(db.String(6), unique=True, index=True, nullable=False)
    status = db.Column(db.String(20), default="WAITING", nullable=False)
    # Статусы: WAITING → ACTIVE → FINISHED
    current_order = db.Column(db.Integer, nullable=True)
    who_host = db.Column(db.Integer, db.ForeignKey("user.id"), index=True, nullable=False)
    group = db.Column(db.Integer, db.ForeignKey("classes.id"), index=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    started_at = db.Column(db.DateTime, nullable=True)
    ended_at = db.Column(db.DateTime, nullable=True)
    question_started_at = db.Column(db.DateTime, nullable=True)

    @property
    def duration_seconds(self):
        """Сколько длилась вся сессия в секундах"""
        if self.started_at and self.ended_at:
            return (self.ended_at - self.started_at).total_seconds()
        return None


class SessionParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_session.id"), index=True, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    nickname = db.Column(db.String(50), nullable=False)
    joined_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    finished_at = db.Column(db.DateTime, nullable=True)
    total_score = db.Column(db.Integer, default=0)

    __table_args__ = (UniqueConstraint("session_id", "user_id", name="uq_session_user"),)

    @property
    def time_spent_seconds(self):
        """Сколько участник проходил тест"""
        if self.joined_at and self.finished_at:
            return (self.finished_at - self.joined_at).total_seconds()
        return None


class SessionAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("quiz_session.id"), index=True, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("question.id"), index=True, nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=True)
    score = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Float, nullable=True)
    answered_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    total_result = db.Column(db.JSON, nullable=True)

    __table_args__ = (UniqueConstraint("session_id", "user_id", "question_id", name="uq_answer_once"),)

    @staticmethod
    def session_percentage(s_id):
        all_answers = SessionAnswer.query.filter_by(session_id=s_id).count()
        if all_answers == 0:
            return "0%"
        true_answers = SessionAnswer.query.filter_by(session_id=s_id, is_correct=True).count()
        return f"{round(true_answers / all_answers * 100, 1)}%"