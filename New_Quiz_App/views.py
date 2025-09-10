from flask import request, render_template, redirect, url_for, session
from .models import Quiz
from project.settings import db
from flask_login import login_required, current_user
import os
import json
from flask import request, jsonify
import string
from flask import abort
from werkzeug.utils import secure_filename
from project.settings import DIR
import secrets
from profile.models import User

@login_required
def render_new_quiz():
    quiz_name = session.get('quiz_name') or request.args.get('quiz_name')
    if not quiz_name:
        return redirect(url_for('New_Quiz.render_new_quiz_settigs'))

    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name,
        'quiz_name': quiz_name  
    }
    return render_template('New_Quiz_App.html', **context)


@login_required
def render_new_quiz_settings():
    if not current_user.is_admin:
        return render_template('error_403.html')

    if request.method == 'POST':
        try:
            quiz_name = request.form['quiz-name']
            filename = "json_data.json"
            empty_data = []

            existing_quiz = Quiz.query.filter_by(name=quiz_name).first()
            if existing_quiz:
                return abort(404)  

            file_path = os.path.join(DIR, 'static', 'quiz_data', filename)

            base_media_dir = 'media'
            os.makedirs(base_media_dir, exist_ok=True)

            quiz_folder_in_media = os.path.join(base_media_dir, quiz_name)
            os.makedirs(quiz_folder_in_media, exist_ok=True)

            file_path = os.path.join(quiz_folder_in_media, filename)
            with open(file_path, 'w') as f:
                json.dump(empty_data, f)

            image = request.files['image']
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
            code = ''
            for number in range(6):
                code += secrets.choice(string.digits)
                
                
                
                

            images_folder_in_media = os.path.join(base_media_dir, 'Images')
            os.makedirs(images_folder_in_media, exist_ok=True)

            quiz = Quiz(
                name=quiz_name,
                json_test_data=os.path.join(base_media_dir, quiz_name, filename),
                count_questions=int(request.form['num-questions']),
                topic=request.form['topic'],
                image=f"{image_filename}" if image_filename else None,
                description=request.form['description'],
                enter_code=code,
                owner=id_user
            )

            db.session.add(quiz)
            db.session.commit()

            session['quiz_name'] = quiz_name
            return redirect(url_for('New_Quiz.render_new_quiz', quiz_name=quiz_name))

        except Exception as e:
            print(f"Error while creating quiz: {e}")
            return abort(500)  

    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_Settings.html', **context)