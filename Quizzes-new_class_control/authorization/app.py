import flask , os 

DIR = os.path.abspath(os.path.dirname(__file__))

authorization = flask.Blueprint(
    name = "authorization",
    import_name = "authorization",
    template_folder = "templates",
    static_folder = os.path.join(DIR, 'static'),
    static_url_path= '/auth')
