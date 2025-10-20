import flask, os

DIR = os.path.dirname(os.path.abspath(__file__))

history = flask.Blueprint(
    name= "history" ,
    import_name = "history",
    template_folder= "templates",
    static_folder = os.path.join(DIR, 'static'),
    static_url_path='/history_static'
)