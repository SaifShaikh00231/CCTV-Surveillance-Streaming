from flask import Flask
from flask_cors import CORS, cross_origin
from register import register_bp
from login import login_bp
from camera_ip_feed import camera_feed_bp
from camera_recording import camera_recording_bp
from reset_password import forgotpassword_bp
from add_camera import add_camera_bp
from camera_list import camera_list_bp
from users_list import users_list_bp
from roles_list import roles_list_bp
from roles_permissions import store_permissions_bp
from admin_reports import admin_reports_bp
from non_admin_reports import non_admin_reports_bp
from permissions import permissions_bp
from ORM_db import db


from session_manager import session_manager_bp  # Import the session_manager blueprint
import re


app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {"origins": "http://localhost:4200", "supports_credentials": True}
    },
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Session-Username",
        "Session-Permissions",
        "camera_id",
        "channel",
    ],
    expose_headers=[
        "Content-Type",
        "Authorization",
        "Session-Username",
        "Session-Permissions",
        "camera_id",
        "channel",
    ],
)
app.secret_key = "cairocoders-ednalan"

app.config["SESSION_TYPE"] = "filesystem"
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:root@localhost:5432/vms'


# Mount the individual blueprints on the main app
app.register_blueprint(register_bp)
app.register_blueprint(login_bp)
app.register_blueprint(forgotpassword_bp)
app.register_blueprint(users_list_bp)
app.register_blueprint(add_camera_bp)
app.register_blueprint(camera_list_bp)
app.register_blueprint(session_manager_bp)
app.register_blueprint(camera_feed_bp)
app.register_blueprint(roles_list_bp)
app.register_blueprint(store_permissions_bp)
app.register_blueprint(admin_reports_bp)
app.register_blueprint(non_admin_reports_bp)
app.register_blueprint(permissions_bp)
app.register_blueprint(camera_recording_bp)

db.init_app(app)

if __name__ == "__main__":
    app.run(debug=True, port=8000)
    