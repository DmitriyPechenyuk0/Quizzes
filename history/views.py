import flask

def show_history_page():
    
    return flask.render_template(template_name_or_list="history.html" )

def show_qsr_page():
    
    return flask.render_template(template_name_or_list="quiz_student_result.html" )

def show_qtr_page():
    
    return flask.render_template(template_name_or_list="quiz_teacher_result.html" )
   