from datetime import datetime

from flask import Flask, request, jsonify, Blueprint, g, session
from psycopg2 import sql
from werkzeug.security import generate_password_hash, check_password_hash
from connection import connect_to_db
from flask_sqlalchemy import SQLAlchemy
import re
import uuid
from ORM_db import User, UserRole, db


app = Flask(__name__)
app.secret_key =  "cairocoders-ednalan"
  # Replace with your actual secret key

register_bp = Blueprint("register_app", __name__)

# Database connection helper functions
def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = connect_to_db()
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()
# Registration route
@register_bp.route("/register/", methods=["POST"])
def register():
    try:
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return jsonify({"status": "error", "message": "Username not found in the session"})



        else:
            data = request.get_json()
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            password = data.get("password")
            confirm_password = data.get("confirm_password")
            email = data.get("email")
            dob = data.get("dob")
            mobile = data.get("mobile")
    
            hashed_password = generate_password_hash(password)

            if email and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return jsonify({"status": "error", "message": "Invalid email address!"})
            elif not first_name or not password:
                return jsonify({"status": "error", "message": "Please fill out the required fields!"})
            elif len(password) < 8:
                return jsonify({"status": "error", "message": "Password must be at least 8 characters long!"})

            if password != confirm_password:
                return jsonify({"status": "error", "message": "Password and confirm password do not match!"})
    
        # Generate 8-digit alphanumeric UUID
            uuid_value = str(uuid.uuid4())[:8]

        # Convert dob to the desired format (yyyy/mm/dd)
            dob_date = datetime.strptime(dob, "%Y/%m/%d").date()

            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return jsonify({"status": "error", "message": "Email already registered!"})
    
            new_user = User(first_name=first_name, last_name=last_name, password=hashed_password,
                            email=email, dob=dob_date, mobile=mobile, username=uuid_value, created_by=user_username)
            db.session.add(new_user)
    
        # Add a record into the users_roles table
            new_user_role = UserRole(username=uuid_value, role_name="anonymous", created_by=user_username)
            db.session.add(new_user_role)
    
            db.session.commit()

            session["loggedin"] = True
            session["email"] = email
            session["username"] = user_username

    
        return jsonify({"status": "success", "message": "You have successfully registered!"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# Run the Flask application
if __name__ == "__main__":
    app.register_blueprint(register_bp)
    app.run(debug=True)
