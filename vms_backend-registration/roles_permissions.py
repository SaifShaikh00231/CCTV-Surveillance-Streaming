from datetime import datetime

from flask import Flask, request, jsonify, Blueprint, g
import psycopg2
from flask_cors import CORS, cross_origin
from connection import connect_to_db
from ORM_db import  RolesPermissions,db

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

store_permissions_bp = Blueprint("store_permissions_app", __name__)


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

@store_permissions_bp.route("/store_permissions", methods=["POST"])
def store_permissions():
    try:
        # Receive data sent from the Angular frontend
        data = request.json
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "User email not found in the session",
                    }
                ),
                400,
            )

        # Extract permissions data from the request
        permissions = data.get("permissions", {})
        roles = data.get("roles", [])

        # Process and store permissions for each role
        for role in roles:
            role_name = role.get("name")
            role_permissions = permissions.get(role_name, [])

            # Clear existing permissions for the current role
            RolesPermissions.query.filter_by(role_name=role_name).delete()

            # Store permissions for the current role in the database
            for permission_name in role_permissions:
                new_permission = RolesPermissions(
                    role_name=role_name,
                    permission_name=permission_name,
                    created_by=user_username,
                    updated_by=user_username
                )
                db.session.add(new_permission)

        # Commit the transaction
        db.session.commit()

        return jsonify(
            {"status": "success", "message": "Permissions stored successfully"}
        )

    except Exception as e:
        # Log the error
        print(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500

# Add this route to your Flask application

@store_permissions_bp.route("/get_permissions", methods=["POST"])
def get_permissions():
    try:
        data = request.json  # Get JSON data from the request body
        role_name = data.get("role_name")  # Get the role name from the JSON data

        # Query the database for permissions associated with the provided role name
        permissions = RolesPermissions.query.filter_by(role_name=role_name).all()
        permission_names = [permission.permission_name for permission in permissions]

        return jsonify({"status": "success", "permissions": permission_names})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


# Register the blueprint
app.register_blueprint(store_permissions_bp)

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
