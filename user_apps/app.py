import flask, os

DIR = os.path.abspath(os.path.dirname(__file__))


registration = flask.Blueprint(
    name="registration",
    import_name="user_apps",
    template_folder="templates",
    static_folder=os.path.join(DIR,'static'),
    static_url_path='/registration/'
)

authorization = flask.Blueprint(
    name = "authorization",
    import_name = "user_apps",
    template_folder = "templates",
    static_folder = os.path.join(DIR, 'static'),
    static_url_path= '/authorization/'
)

profile = flask.Blueprint(
    name= "profile",
    import_name = "user_apps",
    template_folder="templates",
    static_folder=os.path.join(DIR,"static"),
    static_url_path='/profile/'
)