from project.settings import db
from flask_login import UserMixin
from sqlalchemy import UniqueConstraint 

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(30), nullable=False)

    group = db.Column(db.Integer, nullable=True) 
    
    is_teacher = db.Column(db.Boolean, default=False)
    is_email_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    is_approved = db.Column(db.Boolean, default=False)

    __table_args__ = (
        UniqueConstraint('email', name='uq_user_email'),
    )

    def __repr__(self) -> str:
        return f"name: {self.name}, email: {self.email}, is_teacher: {self.is_teacher}"