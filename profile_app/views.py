from flask_login import login_required, current_user, logout_user, UserMixin
from flask import redirect, url_for, jsonify
import flask
from control.models import Class, Group, RequestsToClass
from profile_app.models import User
from New_Quiz_App.models import Quiz, db
from quiz_app.models import QuizSession, SessionParticipant, SessionAnswer

def show_profile_page():
    if not isinstance(current_user, UserMixin):
        return flask.redirect('/login')
 
    name = current_user.name
    email = current_user.email
 
    user_class_obj = Class.query.filter_by(id=current_user.group).first()
    user_class = user_class_obj.name if user_class_obj else False
 
    user_initials = ''.join([part[0] for part in current_user.name.split() if part])
 
    created_tests = Quiz.query.filter_by(owner=current_user.id).all()
 
    completed_tests_data = []
 
    if not current_user.is_teacher:
        participations = SessionParticipant.query.filter_by(user_id=current_user.id).all()
 
        for p in participations:
            session = QuizSession.query.filter_by(id=p.session_id).first()
            if not session or session.status != 'FINISHED':
                continue
 
            quiz = Quiz.query.filter_by(id=session.quiz_id).first()
            if not quiz:
                continue
 
            answers = SessionAnswer.query.filter_by(
                session_id=session.id,
                user_id=current_user.id
            ).all()
 
            total_questions = quiz.count_questions
            answered_count = len(answers)
            correct_count = sum(1 for a in answers if a.is_correct)
 
            if total_questions > 0:
                percentage = round(correct_count / total_questions * 100)
            else:
                percentage = 0
 
            circumference = 264
            dashoffset = round(circumference * (1 - percentage / 100))
 
            session_class_obj = Class.query.filter_by(id=session.group).first()
            session_class_name = session_class_obj.name if session_class_obj else '—'
 
            completed_tests_data.append({
                'session_id': session.id,
                'user_id': current_user.id,
                'quiz_name': quiz.name,
                'subject': quiz.subject,
                'class_name': session_class_name,
                'total_questions': total_questions,
                'answered_count': answered_count,
                'correct_count': correct_count,
                'percentage': percentage,
                'dashoffset': dashoffset,
            })
 
    context = {
        'page': 'profile',
        'user_active': True,
        'is_teacher': current_user.is_teacher,
        'user_name': name,
        'user_email': email,
        'user_initials': user_initials,
        'user_class': user_class,
        'created_tests': created_tests,
        'completed_tests': completed_tests_data,
        'completed_count': len(completed_tests_data),
    }
 
    return flask.render_template("profile.html", **context)


@login_required
def logout():
    logout_user()  
    return redirect(url_for('home_app.show_home_page'))  


@login_required
def delete_quiz(quiz_id):
    try:
     
        quiz = Quiz.query.filter_by(id=quiz_id, owner=current_user.id).first()
        
        if not quiz:
            return jsonify({'message': 'Quiz not found or access denied'}), 404
            

        db.session.delete(quiz)
        db.session.commit()
        
        return jsonify({'message': 'Quiz deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting quiz: {str(e)}'}), 500
 