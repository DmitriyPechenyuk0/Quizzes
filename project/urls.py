import home_app, New_Quiz_App, registration, authorization, history, profile_app

from .settings import project

from project.settings import project, socketio

from quiz_app.app import quiz
from quiz_app import views as quiz_views
from quiz_app import sockets as quiz_sockets

quiz.add_url_rule("/sessions", view_func=quiz_views.create_session, methods=["POST"])
quiz.add_url_rule("/join", view_func=quiz_views.join_page, methods=["GET"])
quiz.add_url_rule("/host/<code>", view_func=quiz_views.host_page, methods=["GET"])
quiz.add_url_rule("/start/<int:quiz_id>", view_func=quiz_views.start_session_redirect, methods=["GET"])
project.register_blueprint(quiz)
profile_app.profille.add_url_rule('/quiz/delete/<int:quiz_id>', view_func=profile_app.delete_quiz, methods=['DELETE'])

home_app.home.add_url_rule(rule= '/', view_func=home_app.show_home_page, methods = ['POST', 'GET'])
registration.registration.add_url_rule(rule = '/registration', view_func= registration.show_page_registration, methods = ['POST', 'GET'])
authorization.authorization.add_url_rule( rule = "/login", view_func = authorization.show_authorization, methods = ['POST', 'GET'])
profile_app.profille.add_url_rule(rule= '/profile', view_func=profile_app.show_profile_page, methods = ['POST', 'GET'])
profile_app.profille.add_url_rule(rule= '/profile/', view_func=profile_app.show_profile_page, methods = ['POST', 'GET'])
history.history.add_url_rule(rule='/history', view_func=history.show_history_page, methods= ['POST', 'GET'])
history.history.add_url_rule(rule='/history_tr', view_func=history.show_qtr_page, methods= ['POST', 'GET'])
history.history.add_url_rule(rule='/history_sr', view_func=history.show_qsr_page, methods= ['POST', 'GET'])

New_Quiz_App.New_Quiz.add_url_rule('/joinnext', view_func=New_Quiz_App.join_next_page, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz/<name>', view_func=New_Quiz_App.render_new_quiz, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz-settings', view_func=New_Quiz_App.render_new_quiz_settigs, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz-student', view_func=New_Quiz_App.render_new_quiz_student, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz-student-2', view_func=New_Quiz_App.render_new_quiz_2_student, methods = ['POST', 'GET'])

home_app.home.add_url_rule('/log-out', view_func=profile_app.logout, methods=['POST', 'GET'])

New_Quiz_App.New_Quiz.add_url_rule('/save_quiz', view_func=New_Quiz_App.save_quiz, methods=['POST'])
New_Quiz_App.New_Quiz.add_url_rule('/save_topic', view_func=New_Quiz_App.save_topic, methods=['POST'])

New_Quiz_App.join.add_url_rule('/joinnnnn', view_func=New_Quiz_App.views.render_join, methods=['POST', 'GET'])


project.register_blueprint(blueprint=New_Quiz_App.join)
project.register_blueprint(blueprint=home_app.home)
project.register_blueprint(registration.registration)
project.register_blueprint(authorization.authorization)
project.register_blueprint(blueprint=New_Quiz_App.New_Quiz)
project.register_blueprint(blueprint=profile_app.profille)
project.register_blueprint(blueprint=history.history)