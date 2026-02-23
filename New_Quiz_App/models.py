import datetime
from project.settings import db

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    count_questions = db.Column(db.Integer, nullable=False, default=1)
    subject = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now().strftime("%d.%m.%Y"))
    runs_count = db.Column(db.Integer) 
    owner = db.Column(db.Integer, nullable=False)