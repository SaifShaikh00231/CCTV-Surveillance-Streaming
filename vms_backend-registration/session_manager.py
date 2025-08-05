from flask import Blueprint, session

session_manager_bp = Blueprint("session_manager_app", __name__)


# Route to set session data
@session_manager_bp.route("/set_session/<email>")
def set_session(email):
    session["email"] = email
    return "Session data set"


# Route to get session data
@session_manager_bp.route("/get_session")
def get_session():
    user_username = session.get("email")
    return f"Session email: {user_username}"


# Route to clear session data
@session_manager_bp.route("/clear_session")
def clear_session():
    session.clear()
    return "Session data cleared"


# Function to get session email
def get_session_email():
    return session.get("email")
