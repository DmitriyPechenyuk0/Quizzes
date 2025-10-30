import flask, os

DIR = os.path.abspath(os.path.dirname(__file__))

quiz = flask.Blueprint(
    name='quiz_app',
    import_name='quiz_app',
    template_folder='templates',
    static_folder=os.path.join(DIR, 'static'),
    static_url_path='/quiz_static',
    url_prefix='/quiz'
)