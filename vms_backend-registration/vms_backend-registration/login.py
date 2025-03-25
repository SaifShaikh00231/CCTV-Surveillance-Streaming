from flask import Flask, request, session, jsonify, Blueprint, g, redirect, url_for
from datetime import datetime
from werkzeug.security import check_password_hash
import psycopg2
from flask_sqlalchemy import SQLAlchemy

from flask_login import logout_user, LoginManager
from session_manager import set_session, get_session_email, clear_session

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:root@localhost:1024/VMS'

login_bp = Blueprint("login_app", __name__)
from ORM_db import User,UserRole,RolesPermissions,db

@login_bp.route("/login/", methods=["POST"])
def login():
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        password = data.get("password")

        user = User.query.filter((User.username == identifier) & (User.is_active == True)).first()

        if user and check_password_hash(user.password, password):
            session["loggedin"] = True
            session["username"] = user.username

            # Fetch the user's role from users_roles table
            user_role = UserRole.query.filter_by(username=user.username).first()

            # Fetch permissions associated with the user's role
            permissions = []
            if user_role:
                role_name = user_role.role_name
                role_permissions = RolesPermissions.query.filter_by(role_name=role_name).all()
                permissions = [permission.permission_name for permission in role_permissions]

            # Store permissions in the session
            session["permissions"] = permissions

            user.last_login_time = datetime.now()
            db.session.commit()

            return jsonify(
                {
                    "status": "success",
                    "message": "Login successful",
                    "username": user.username,
                    "permissions": permissions,
                }
            )
        else:
            return jsonify(
                {"status": "error", "message": "Incorrect Email/password or account is not active"}
            )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})








@login_bp.route("/logout/", methods=["POST"])
def logout():
    try:
        user_username = request.headers.get("Session-Username", None)

        if not user_username:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Username not found in the session",
                    }
                ),
                400,
            )

        else:
            user = User.query.filter_by(username=user_username).first()
            if user:
                user.last_logout_time = datetime.now()
                db.session.commit()

            session.clear()

            return jsonify({"status": "success", "message": "Logout successful"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@login_bp.route("/permissions/", methods=["POST"])
def get_permissions():
    if "permissions" in session:
        permissions = session["permissions"]
        return jsonify({"status": "success", "permissions": permissions})
    else:
        return jsonify(
            {"status": "error", "message": "Permissions not found in session"}
        )

# Register the blueprint
app.register_blueprint(login_bp)

# Initialize SQLAlchemy after app is created


# Run the Flask application
if __name__ == "__main__":
    app.run(debug=True)