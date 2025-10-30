from project.settings import db

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    count_questions = db.Column(db.Integer, nullable=False, default=1)
    topic = db.Column(db.String(50), nullable=False)
    image = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=False)
    enter_code = db.Column(db.String(6), nullable=False, unique=True)
    owner = db.Column(db.Integer, nullable=False)