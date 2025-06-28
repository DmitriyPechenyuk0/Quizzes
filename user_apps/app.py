import flask, os

DIR = os.path.abspath(os.path.dirname(__file__))


registration = flask.Blueprint(
    name='registration',
    import_name='registration',
    template_folder='templates',
    static_folder=os.path.join(DIR,'static'),
    static_url_path='/registration'
)

authorization = flask.Blueprint(
    name = "authorization",
    import_name = "authorization",
    template_folder = "templates",
    static_folder = os.path.join(DIR, 'static'),
    static_url_path= '/auth'
)

profile = flask.Blueprint(
    name= "profile",
    import_name = "profile",
    template_folder='templates',
    static_folder=os.path.join(DIR,"static"),
    static_url_path="/profile"
)