import os, json
from flask import request, render_template, redirect, url_for
from .models import Quiz
from project.settings import db
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from user_apps.models import User

DIR = os.path.dirname(os.path.abspath(__file__))

@login_required

def render_new_quiz():
    if not current_user.is_admin:
        return render_template('error_403.html')

    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_App.html', **context)


@login_required
def render_new_quiz_settigs():
    if not current_user.is_admin:
        return render_template('error_403.html')

    if request.method == 'POST':
        try:

            quiz_name = request.form['quiz-name'] 
            filename = f"{quiz_name}.json"
            empty_data = []
            

            
            file_path = os.path.join(DIR, 'static', 'quiz_data', filename)


            quiz_folder = os.path.join('New_Quiz_App', 'static', 'quiz_data', quiz_name)
            os.makedirs(quiz_folder, exist_ok=True)

        
            file_path = os.path.join(quiz_folder, filename)
            with open(file_path, 'w') as f:
                json.dump(empty_data, f)
            
            image =request.files['image']

            image = request.files.get('image')
            image_filename = None
            if image and image.filename != '':
                image_filename = secure_filename(image.filename)
                media_folder = os.path.join(DIR, 'static', 'media')
                os.makedirs(media_folder, exist_ok=True)
                image_path = os.path.join(media_folder, image_filename)
                image.save(image_path)

            id_user = User.get_id(current_user)

      
            media_path = os.path.join('media', quiz_name)
            os.makedirs(media_path, exist_ok=True)

            quiz = Quiz(
                name=quiz_name,
                json_test_data=os.path.join(quiz_name, filename), 
                count_questions=int(request.form['num-questions']),
                topic=request.form['topic'],
                image=f"{image_filename}" if image_filename else None,
                description=request.form['description'],
                owner = id_user
            )
            db.session.add(quiz)
            db.session.commit()

            return redirect(f'/new-quiz/{quiz_name}')

        except Exception as e:
            print(f"Error while creating quiz: {e}")


    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_Settings.html', **context)



# Для студентов

@login_required
def render_new_quiz_student():
    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_App_Student.html', **context)


@login_required
def render_new_quiz_student_correct_answer():
    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_App_Student_Correct_Answer.html', **context)


@login_required
def render_new_quiz_student_wrong_answer():
    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_App_Student_Wrong_Answer.html', **context)


@login_required
def render_new_quiz_2_student():
    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_App_Student_2.html', **context)
