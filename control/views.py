from flask import Blueprint, redirect, url_for
import flask_login
from profile_app.models import User, db 
import flask
from .moduls import Class

@flask_login.login_required
def show_control_page():
    user = flask_login.current_user
    if not user.is_teacher:
        return redirect("/")
    students = User.query.filter_by(group=user.group, is_teacher=False, is_approved=True).all()
    requests_list = User.query.filter_by(group=user.group, is_teacher=False, is_approved=False).all()
    return flask.render_template("control.html", students=students, requests=requests_list)


@flask_login.login_required
def accept_student(student_id):
    student = User.query.get(student_id)
    if student:
        student.is_approved = True
        db.session.commit()
    return redirect(url_for('control.show_control_page'))


@flask_login.login_required
def remove_student(student_id):
    student = User.query.get(student_id)
    if student:
        student.group = None  
        student.is_approved = False 
        db.session.commit()
    return redirect(url_for('control.show_control_page'))


def add_class(class_name):
    
    classs = Class(
        name=class_name
    )
    db.session.add(classs)
    db.session.commit()