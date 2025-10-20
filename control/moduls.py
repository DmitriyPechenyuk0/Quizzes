from project import db


class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(120), nullable = False)

class RequestsToClass(db.Model):
    __tablename__ = 'requests_to_class'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    

# statuses - Pending, Accepted, Rejected