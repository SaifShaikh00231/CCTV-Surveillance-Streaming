# Import necessary modules
from flask import Flask, request, jsonify, Blueprint, g
from connection import connect_to_db
from datetime import datetime
import psycopg2
import psycopg2.extras
from ORM_db import Roles,db, RolesPermissions, UserRole 


app = Flask(__name__)
app.secret_key = "your_secret_key"

# Define blueprint for roles list API
roles_list_bp = Blueprint("roles_list_app", __name__)


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


@roles_list_bp.route("/roles_list/", methods=["POST"])
def roles_list():
    try:
        # Fetch data from the roles table
        roles = Roles.query.filter_by(is_deleted=False).all()

        # Prepare response
        roles_list = []
        for role in roles:
            roles_list.append({
                "role_name": role.role_name,
                "created_by": role.created_by,
                "updated_by": role.updated_by,
                "is_deleted": str(role.is_deleted)
            })

        return jsonify({"status": "success", "roles_list": roles_list})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@roles_list_bp.route("/update_roles/", methods=["POST"])
def update_roles():
    try:
        # Get user_username from session
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return jsonify({"status": "error", "message": "User email not found in the session"}), 400

        data = request.json

        # Extract role data from the request
        old_role_name = data.get("old_role_name")  # To identify the role to update
        new_role_name = data.get("new_role_name")  # New role
        is_deleted = data.get("is_deleted")

        # Convert 'activated' and 'deactivated' back to boolean
        is_deleted = True if is_deleted == 'true' else False

        # Update Role in Roles table
        role = Roles.query.filter_by(role_name=old_role_name).first()
        if role:
            role.role_name = new_role_name
            role.updated_by = user_username
            role.is_deleted = is_deleted
            role.updated_at = datetime.now()
            db.session.commit()
        else:
            return jsonify({"status": "error", "message": "Role not found"}), 404

        # Update Role in RolesPermissions table
        roles_permissions = RolesPermissions.query.filter_by(role_name=old_role_name).all()
        for rp in roles_permissions:
            rp.role_name = new_role_name
            rp.updated_by = user_username
            rp.updated_at = datetime.now()
        db.session.commit()

        # Update Role in UserRole table
        user_roles = UserRole.query.filter_by(role_name=old_role_name).all()
        for ur in user_roles:
            ur.role_name = new_role_name
            ur.updated_by = user_username
            ur.updated_at = datetime.now()
        db.session.commit()

        return jsonify({"status": "success", "message": "Role updated successfully"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500

@roles_list_bp.route("/delete_roles/", methods=["POST"])
def delete_role():
    try:
        # Get user_username from session
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return jsonify({"status": "error", "message": "User email not found in the session"}), 400

        data = request.json

        # Extract role data from the request
        role_name = data.get("role_name")

        # Check if the role_name is 'anonymous'
        if role_name == "anonymous":
            return jsonify({"status": "error", "message": "You cannot delete the default role."}), 400

        # Fetch the role to delete
        role = Roles.query.filter_by(role_name=role_name).first()

        if role:
            # Update the is_deleted status to True for the role being deleted
            role.is_deleted = True
            role.updated_by = user_username
            role.updated_at = datetime.now()

            # Update associated records in the users_roles table
            user_roles = UserRole.query.filter_by(role_name=role_name).all()
            for ur in user_roles:
                ur.role_name = 'anonymous'
                ur.updated_by = user_username
                ur.updated_at = datetime.now()

            db.session.commit()

            return jsonify({"status": "success", "message": "Role deactivated successfully"})
        else:
            return jsonify({"status": "error", "message": "Role not found"}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500


@roles_list_bp.route("/get_the_roles/", methods=["POST"])
def get_the_roles():
    try:
        # Fetch roles from the database using SQLAlchemy ORM
        roles = Roles.query.filter_by(is_deleted=False).with_entities(Roles.role_name).all()
        roles = [role[0] for role in roles]

        # Structure the response JSON object
        response_data = {
            "status": "success",
            "camera_options": {
                "roles": roles
            }
        }

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500




@roles_list_bp.route("/add_roles/", methods=["POST"])
def add_roles():
    try:
        # Get JSON data from the request
        data = request.json

        # Check if JSON data is provided
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Extract role data from JSON
        role_name = data.get("role_name")
        is_deleted = data.get("is_deleted")

        # Validate required fields
        if not role_name:
            return jsonify({"error": "Role name is required"}), 400

        # Get the user email from the session
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return (
                jsonify({"status": "error", "message": "User email not found in the session"}),
                400,
            )

        # Create a new role instance
        new_role = Roles(
            role_name=role_name,
            created_by=user_username
        )

        # Add optional field is_deleted if provided
        if is_deleted is not None:
            new_role.is_deleted = is_deleted

        # Add the new role to the session and commit to the database
        db.session.add(new_role)
        db.session.commit()

        return jsonify({"message": "Role added successfully"}), 201

    except Exception as e:
        # Handle errors
        return jsonify({"error": "An error occurred: " + str(e)}), 500




# Register the blueprint for roles list
app.register_blueprint(roles_list_bp)

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
