from flask import Blueprint, request
import os
import json

New_Quiz = Blueprint(
    "New_Quiz",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/new_quiz",

)

import flask,os


DIR=os.path.abspath(os.path.dirname(__file__))

join = flask.Blueprint(
    name= "join",
    import_name = "join",
    template_folder='templates',
    static_folder=os.path.join(DIR, "static"),
    static_url_path="/join"
)

MEDIA_BASE_FOLDER = os.path.join(os.path.dirname(__file__), "static", "Media")
os.makedirs(MEDIA_BASE_FOLDER, exist_ok=True)

def save_quiz():
    new_data = request.get_json()
    
    quiz_name = new_data.get('quiz_name')
    if not quiz_name:
        return {'status': 'error', 'message': 'Quiz name not provided'}, 400

    quiz_folder = os.path.join(MEDIA_BASE_FOLDER, quiz_name)
    os.makedirs(quiz_folder, exist_ok=True)

    quiz_data_file = os.path.join(quiz_folder, "json_data.json")

    quiz_content = {}
    if os.path.exists(quiz_data_file):
        with open(quiz_data_file, 'r', encoding='utf-8') as file:
            try:
                quiz_content = json.load(file)
            except json.JSONDecodeError:
                quiz_content = {}
    
    if not isinstance(quiz_content, dict):
        quiz_content = {}

    if not quiz_content:
        quiz_content = {
            'name': quiz_name,
            'topic': new_data.get('topic', ''),
            'questions': []
        }
    
    if 'questions' not in quiz_content or not isinstance(quiz_content['questions'], list):
        quiz_content['questions'] = []


    question_data = {
        'mode': new_data.get('mode'),
        'question': new_data.get('question'),
        'answers': new_data.get('answers', [])
    }
    quiz_content['questions'].append(question_data)

    with open(quiz_data_file, 'w', encoding='utf-8') as file:
        json.dump(quiz_content, file, ensure_ascii=False, indent=2)

    return {'status': 'success', 'message': f'Quiz "{quiz_name}" data saved successfully.'}