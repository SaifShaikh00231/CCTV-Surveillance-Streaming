# Import necessary modules
from flask import Flask, request, jsonify, Blueprint, g
from connection import connect_to_db
from datetime import datetime
import psycopg2
import psycopg2.extras
from ORM_db import UserRole, User, Camera, CameraIP,db  # Import other models as needed


# Create Flask app
app = Flask(__name__)
app.secret_key = "your_secret_key"

# Define blueprint for user list API
users_list_bp = Blueprint("users_list_app", __name__)


# Database connection helper functions
def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = (
            connect_to_db()
        )  # Implement this function according to your database connection logic
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


# Function to execute SQL queries
def execute_query(query, params=None, fetchone=False):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        if fetchone:
            result = cursor.fetchone()
        else:
            columns = [col[0] for col in cursor.description]
            result = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
# API endpoint to get a list of all users
@users_list_bp.route("/users_list/", methods=["POST"])
def get_all_users():
    try:
        # Fetch all users using SQLAlchemy query
        users = User.query.all()
        # Convert users to JSON serializable format
        user_list = [
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "password": user.password,
                "username": user.username,
                "is_active": "active" if user.is_active else "inactive",
                "role_name": user.roles[0].role_name if user.roles else None
            }
            for user in users
        ]
        return jsonify({"status": "success", "users_list": user_list})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500




@users_list_bp.route("/update_users/", methods=["POST"])
def update_users_roles():
    try:
        # Extract session username from request headers
        user_username = request.headers.get("Session-Username", None)

        if not user_username:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "User username not found in the session",
                    }
                ),
                400,
            )

        data = request.json

        # Extract user role data from the request
        username = data.get("username")
        role_name = data.get("role_name")
        is_active = data.get("is_active")

        # Convert 'activated' and 'deactivated' back to boolean
        is_active = is_active == "active"

        # Update the users_roles table with the new role name
        user_role = UserRole.query.filter_by(username=username).first()
        if user_role:
            user_role.role_name = role_name
            user_role.updated_at = datetime.now()
            user_role.updated_by = user_username

        # Update the is_active column in the users table
        user = User.query.filter_by(username=username).first()
        if user:
            user.is_active = is_active
            user.updated_at = datetime.now()
            user.updated_by = user_username

        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "message": "User role and is_active status updated successfully",
            }
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
# Route to fetch user details based on session username
@users_list_bp.route("/users_profile/", methods=["POST"])
def fetch_users():
    try:
        # Extract session username from the request headers
        user_username = request.headers.get("Session-Username", None)

        if not user_username:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "User username not found in the session",
                    }
                ),
                400,
            )

        # Modify the query to include JOIN with UserRole table to fetch role_name
        query = """
            SELECT u.first_name, u.last_name, u.username, u.mobile, u.dob, ur.role_name
            FROM users u
            LEFT JOIN users_roles ur ON u.username = ur.username
            WHERE u.username = %s
        """
        user_details = execute_query(query, (user_username,), fetchone=True)

        if user_details:
            # Construct a dictionary with keys corresponding to user details
            user_profile = {
                "first_name": user_details[0],
                "last_name": user_details[1],
                "username": user_details[2],
                "mobile": user_details[3],
                "dob": (
                    user_details[4].strftime("%Y-%m-%d") if user_details[4] else None
                ),
                "role_name": user_details[5]  # Add the role_name to the response
            }
            return jsonify(user_profile), 200
        else:
            return (
                jsonify({"status": "error", "message": "User details not found"}),
                404,
            )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@users_list_bp.route("/edit_profile/", methods=["POST"])
def edit_user_profile():
    try:
        # Extract session username from the request headers
        user_username = request.headers.get("Session-Username", None)
        
        if not user_username:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "User username not found in the session",
                    }
                ),
                400,
            )

        # Get the updated user details from the request body
        profile_data = request.json
        username = profile_data.get("username")
        first_name = profile_data.get("first_name")
        last_name = profile_data.get("last_name")
        mobile = profile_data.get("mobile")
        dob = profile_data.get("dob")

        # Query the user based on the session username
        user = User.query.filter_by(username=user_username).first()

        if user:
            # Update user details
            user.first_name = first_name
            user.last_name = last_name
            user.mobile = mobile
            user.dob = dob

            if user.username != username:
                # Update username in users table
                user.username = username
                
                # Update username in associated tables (if necessary)
                # Assuming no associated tables in this example

            db.session.commit()

            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "User details updated successfully",
                    }
                ),
                200,
            )
        else:
            return (
                jsonify({"status": "error", "message": "User not found"}),
                404,
            )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# Register the blueprint
app.register_blueprint(users_list_bp)

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
