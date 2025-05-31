import home_app, New_Quiz_App, registration, authorization, history, join

from profile.app import profille
from profile.views import show_profile_page
from profile.views import logout


from .settings import project

home_app.home.add_url_rule(rule= '/', view_func=home_app.show_home_page, methods = ['POST', 'GET'])
registration.registration.add_url_rule(rule = '/registration', view_func= registration.show_page_registration, methods = ['POST', 'GET'])
authorization.authorization.add_url_rule( rule = "/login", view_func = authorization.show_authorization, methods = ['POST', 'GET'])
profille.add_url_rule(rule= '/profile', view_func=show_profile_page, methods = ['POST', 'GET'])
history.history.add_url_rule(rule='/history', view_func=history.show_history_page, methods= ['POST', 'GET'])
history.history.add_url_rule(rule='/history_tr', view_func=history.show_qtr_page, methods= ['POST', 'GET'])
history.history.add_url_rule(rule='/history_sr', view_func=history.show_qsr_page, methods= ['POST', 'GET'])

New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz/<name>', view_func=New_Quiz_App.render_new_quiz, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz-settings', view_func=New_Quiz_App.render_new_quiz_settigs, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz-student', view_func=New_Quiz_App.render_new_quiz_student, methods = ['POST', 'GET'])
New_Quiz_App.New_Quiz.add_url_rule(rule= '/new-quiz-student-2', view_func=New_Quiz_App.render_new_quiz_2_student, methods = ['POST', 'GET'])

home_app.home.add_url_rule('/log-out', view_func=logout, methods=['POST', 'GET'])

New_Quiz_App.New_Quiz.add_url_rule('/save_quiz', view_func=New_Quiz_App.save_quiz, methods=['POST'])
New_Quiz_App.New_Quiz.add_url_rule('/save_topic', view_func=New_Quiz_App.save_topic, methods=['POST'])

join.join.add_url_rule('/join', view_func=join.views.render_join, methods=['POST', 'GET'])


project.register_blueprint(blueprint=join.join)
project.register_blueprint(blueprint=home_app.home)
project.register_blueprint(registration.registration)
project.register_blueprint(authorization.authorization)
project.register_blueprint(blueprint=New_Quiz_App.New_Quiz)
project.register_blueprint(blueprint=profille)
project.register_blueprint(blueprint=history.history)