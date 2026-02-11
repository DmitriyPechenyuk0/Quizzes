from project import db


class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(120), nullable = False)
    users_count = db.Column(db.Integer, default=0)
    course = db.Column(db.Integer, nullable = False)
    teacher_name = db.Column(db.String(200), nullable = False)
    teacher_initials = db.Column(db.String(200), nullable = False)
    specialization = db.Column(db.String(250), nullable = False)


class RequestsToClass(db.Model):
    __tablename__ = 'requests_to_class'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    

# statuses - Pending, Accepted, Rejected