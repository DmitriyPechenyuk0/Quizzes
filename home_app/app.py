import flask, os

DIR = os.path.abspath(os.path.dirname(__file__))

home = flask.Blueprint(
    name='home_app',
    import_name='home_app',
    template_folder='templates',
    static_folder=os.path.join(DIR, 'static'),
    static_url_path='/home_static'
)