import flask,os
DIR=os.path.abspath(os.path.dirname(__file__))

profille = flask.Blueprint(
     "profile_app",
    __name__,
    template_folder='templates',
    static_folder=os.path.join(DIR,"static"),
    static_url_path="/profile_app"
)