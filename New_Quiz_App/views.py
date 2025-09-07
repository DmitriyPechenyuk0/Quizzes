
from flask import request, render_template, redirect, url_for, session
from .models import Quiz
from project.settings import db
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from user_apps.models import User
import os, json, string, flask, secrets
from flask import request, jsonify
from quiz_app.models import Question


DIR = os.path.dirname(os.path.abspath(__file__))

@login_required

def render_new_quiz(name):
    if not current_user.is_admin:
        return render_template('error_403.html')
    quiz_name = session.get('quiz_name') or request.args.get('quiz_name')
    # quiz = db.one_or_404(db.select(Quiz).filter_by(name=name))
    if not quiz_name:
        return redirect(url_for('New_Quiz.render_new_quiz_settigs'))

    quiz = db.one_or_404(db.select(Quiz).filter_by(name=name))
    num_questions = quiz.count_questions 

    questions = [f"Question #{i + 1}" for i in range(num_questions)]


    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name,
        'quiz_name': quiz_name,
        'quiz': quiz,
        'questions': questions
    }
    return render_template('New_Quiz_App.html', **context)

@login_required
def render_new_quiz_settigs():
    if not current_user.is_admin:
        return render_template('error_403.html')

    if request.method == 'POST':
        try:
            quiz_name = request.form['quiz-name']
            filename = "json_data.json"
            empty_data = []
            
            file_path = os.path.join(DIR, 'static', 'quiz_data', filename)


            base_media_dir = 'media'
            os.makedirs(base_media_dir, exist_ok=True)

            quiz_folder_in_media = os.path.join(base_media_dir, quiz_name)
            os.makedirs(quiz_folder_in_media, exist_ok=True)

            file_path = os.path.join(quiz_folder_in_media, filename)
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
            code = ''
            for number in range(6):
                code += secrets.choice(string.digits)

            images_folder_in_media = os.path.join(base_media_dir, 'Images')
            os.makedirs(images_folder_in_media, exist_ok=True)
            q_count = int(request.form['num-questions'])
            quiz = Quiz(
                name=quiz_name,
                count_questions=int(request.form['num-questions']),
                topic=request.form['topic'],
                image=f"{image_filename}" if image_filename else None,
                description=request.form['description'],
                enter_code=code,
                owner = id_user
            )
            db.session.add(quiz)
            db.session.flush()
            for question in range(q_count):
                quest = Question(
                    quiz_id = quiz.id,
                    order_index = question + 1,
                    text = "Столиця України",
                    correct_answer = "Київ"
                )
                db.session.add(quest)
            db.session.commit()


            session['quiz_name'] = quiz_name
            return redirect(url_for('home_app.show_home_page'))


        except Exception as e:
            print(f"Error while creating quiz: {e}")


    context = {
        'page': 'home',
        'is_auth': current_user.is_authenticated,
        'name': current_user.name
    }
    return render_template('New_Quiz_Settings.html', **context)


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




def render_join():
    context = {'page': 'home',
               'is_auth': current_user.is_authenticated,
               'name': current_user.name}
    return flask.render_template(template_name_or_list='join.html', **context)

saved_topic = None

@login_required
def save_topic():
    data = request.get_json()
    topic = data.get('topic')

    if topic:
        if any(char in "абвгдеєжзиіїйклмнопрстуфхцчшщьюяАБВГДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ" for char in topic):
            language = "Ukrainian"
        elif any(char in string.ascii_letters for char in topic):
            language = "English"
        else:
            language = "Unknown"

        print(f"Received topic: {topic}, Language: {language}")
        return jsonify({"status": "success", "topic": topic, "language": language})
    else:
        return jsonify({"status": "error", "message": "No topic provided"}), 400

