from flask_login import login_required, current_user, logout_user
from flask import redirect, url_for, jsonify
import flask

from profile_app.models import User
from New_Quiz_App.models import Quiz, db
from quiz_app.models import QuizSession, SessionParticipant 

@login_required
def show_profile_page():

    created_quizzes = Quiz.query.filter_by(owner=current_user.id).all()

    participated_session_ids = db.session.query(SessionParticipant.session_id).filter_by(user_id=current_user.id).subquery()


    completed_quiz_ids = db.session.query(QuizSession.quiz_id).filter(QuizSession.id.in_(participated_session_ids)).distinct().subquery()

    completed_quizzes = Quiz.query.filter(Quiz.id.in_(completed_quiz_ids)).all()

    context = {
        'page': 'profile',
        'name': current_user.name,
        'email': current_user.email,
        'created_quizzes': created_quizzes, 
        'created_quizzes_count': len(created_quizzes),
        'completed_quizzes': completed_quizzes,
        'completed_quizzes_count': len(completed_quizzes),
        'is_admin': current_user.is_admin 
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
 