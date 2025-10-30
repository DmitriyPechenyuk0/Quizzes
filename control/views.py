from flask import Blueprint, redirect, url_for, flash, render_template, jsonify
import flask_login
from profile_app.models import User, db 
from .moduls import Class, RequestsToClass
from project.email import send_student_approval_email
from flask import jsonify
from New_Quiz_App.models import Quiz
from quiz_app.models import QuizSession, SessionParticipant
from profile_app.models import User

control = Blueprint(
    'control', 
    __name__, 
    template_folder='templates', 
    static_folder='static',
    static_url_path='/control/static' 
)

@flask_login.login_required
def show_control_page():
    user = flask_login.current_user
    
    if not user.is_teacher:
        return redirect("/")

    teacher_class_id = user.group
    
    if not teacher_class_id:
        flash("Вам ще не призначено клас. Зверніться до адміністратора.", "warning")
        return render_template("control.html", students=[], requests=[])

    accepted_members = User.query.filter_by(group=teacher_class_id, is_teacher=False, is_approved=True).all()
    
    pending_requests_query = RequestsToClass.query.filter_by(
        class_id=teacher_class_id, 
        status='Pending'
    ).all()
    
    requesting_user_ids = [req.user_id for req in pending_requests_query]
    pending_users = User.query.filter(User.id.in_(requesting_user_ids)).all()
            
    return render_template("control.html", students=accepted_members, requests=pending_users)



@flask_login.login_required
def accept_student(student_id):
    teacher = flask_login.current_user
    
    if not teacher.is_teacher or not teacher.group:
        return jsonify({
            'success': False,
            'message': "Дія заборонена."
        })
    
    request = RequestsToClass.query.filter_by(
        user_id=student_id, 
        class_id=teacher.group, 
        status='Pending'
    ).first()
    
    student = User.query.get(student_id)
    teacher_class = Class.query.get(teacher.group)

    if request and student and teacher_class:
        try:
            request.status = 'Accepted'
            student.group = teacher.group
            student.is_approved = True
            db.session.commit()
            
            send_student_approval_email(student.email, teacher.name, teacher_class.name)
            
            return jsonify({
                'success': True,
                'message': f"Учень {student.name} був успішно доданий до класу."
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': f"Помилка при додаванні учня: {str(e)}"
            })
    else:
        return jsonify({
            'success': False,
            'message': "Запит не знайдено або він недійсний."
        })



@flask_login.login_required
def remove_student(student_id):
    teacher = flask_login.current_user
    
    if not teacher.is_teacher or not teacher.group:
        return jsonify({
            'success': False,
            'message': "Дія заборонена."
        })

    student = User.query.get(student_id)
    membership = RequestsToClass.query.filter_by(
        user_id=student_id, 
        class_id=teacher.group
    ).first()

    if student and student.group == teacher.group:
        try:
            student.group = None
            student.is_approved = False
            
            if membership:
                db.session.delete(membership)
            
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f"Учень {student.name} був видалений з класу."
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': f"Помилка при видаленні учня: {str(e)}"
            })
    else:
        return jsonify({
            'success': False,
            'message': "Учень не належить до вашого класу."
        })
        
        
@flask_login.login_required
def get_class_quiz_history():
    teacher = flask_login.current_user
    if not teacher.is_teacher or not teacher.group:
        return jsonify({'success': False, 'message': 'Дія заборонена.'}), 403

    students = User.query.filter_by(group=teacher.group, is_teacher=False, is_approved=True).all()
    student_ids = [s.id for s in students]

    sessions = (
        db.session.query(QuizSession)
        .join(SessionParticipant, SessionParticipant.session_id == QuizSession.id)
        .filter(SessionParticipant.user_id.in_(student_ids))
        .distinct(QuizSession.id)
        .all()
    )

    quizzes_info = []
    for session in sessions:
        quiz = Quiz.query.get(session.quiz_id)
        if quiz:
            quizzes_info.append({
                'id': quiz.id,
                'name': quiz.name,
                'topic': quiz.topic,
                'image': quiz.image,
                'session_code': session.code,
                'session_id': session.id,
            })

    return jsonify({'success': True, 'quizzes': quizzes_info})