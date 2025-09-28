import flask , os 

DIR = os.path.abspath(os.path.dirname(__file__))

admin = flask.Blueprint(
    name = "admin_panel",
    import_name = "admin_panel",
    template_folder = "templates",
    static_folder = os.path.join(DIR, 'static'),
    static_url_path= '/admin')
