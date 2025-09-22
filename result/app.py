import flask, os

DIR = os.path.abspath(os.path.dirname(__file__))

result = flask.Blueprint(
    name='result',
    import_name='result',
    template_folder='templates',
    static_folder=os.path.join(DIR, 'static'),
    static_url_path='/result_static'
)