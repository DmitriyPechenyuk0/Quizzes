import flask, os

DIR = os.path.abspath(os.path.dirname(__file__))

control = flask.Blueprint(
    name='control',
    import_name='control',
    template_folder='templates',
    static_folder=os.path.join(DIR, 'static'),
    static_url_path='/control_static'
)