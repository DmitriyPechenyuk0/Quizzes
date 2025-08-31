import flask, flask_sqlalchemy, flask_migrate, os, flask_socketio

DIR = os.path.abspath(os.path.dirname(__file__))

project = flask.Flask(
    import_name="project",
    template_folder="templates",
    static_folder=os.path.join(DIR, 'static'),
    instance_path= os.path.abspath(__file__ + '/..')
)

project.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.db"
project.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
project.config["SECRET_KEY"] = "dev"

db = flask_sqlalchemy.SQLAlchemy(app = project)

migrate = flask_migrate.Migrate(app = project, db = db)

socketio = flask_socketio.SocketIO(app=project, cors_allowed_origins="*")