import flask
import flask_sqlalchemy
import flask_migrate
import os
import flask_socketio
from flask_mail import Mail
from dotenv import load_dotenv


load_dotenv()

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
socketio = flask_socketio.SocketIO(app=project, cors_allowed_origins="*", async_mode="eventlet")

project.config['MAIL_SERVER'] = 'smtp.gmail.com'
project.config['MAIL_PORT'] = 587
project.config['MAIL_USE_TLS'] = True
project.config['MAIL_USERNAME'] = os.getenv('MAILER')
project.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
project.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAILER')

mail = Mail(project)