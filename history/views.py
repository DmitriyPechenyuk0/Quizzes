import flask
from flask_login import current_user

def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

def show_qsr_page():
    return flask.render_template(
        "quiz_student_result.html",
        page="history",
        is_auth=current_user.is_authenticated,
        name=current_user.name if current_user.is_authenticated else "Anonymous"
    )

def show_qtr_page():
    
    return flask.render_template(template_name_or_list="quiz_teacher_result.html" )
   