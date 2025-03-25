# Import necessary modules
from flask import Flask, request, jsonify, Blueprint, g
from connection import connect_to_db
from datetime import datetime
import psycopg2
import psycopg2.extras
from ORM_db import Permissions, RolesPermissions,db


app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

permissions_bp = Blueprint("permissions_app", __name__)


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


@permissions_bp.route("/add_permissions/", methods=["POST"])
def add_permissions():
    try:
        user_username = request.headers.get("Session-Username", None)

        permission_data = request.json
        permission_title = permission_data.get("permission_title")
        permission_name = permission_data.get("permission_name")

        permissions = [
            {"action": "create", "title": permission_title},
            {"action": "view", "title": permission_title},
            {"action": "update", "title": permission_title},
            {"action": "delete", "title": permission_title},
        ]

        for perm in permissions:
            permission = f"{perm['action']}_{permission_name}"
            new_permission = Permissions(
                permission_name=permission,
                permission_title=perm["title"],
                created_by=user_username
            )
            db.session.add(new_permission)

        db.session.commit()

        return jsonify({"status": "success", "message": "Permission successfully added"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"})


@permissions_bp.route("/fetch_permissions/", methods=["POST"])
def fetch_permissions():
    try:
        # Fetch permission names and titles using SQLAlchemy
        permissions = Permissions.query.with_entities(Permissions.permission_name, Permissions.permission_title).all()

        # Convert SQLAlchemy query result into a list of dictionaries
        permissions_list = [{"permission_name": permission[0], "permission_title": permission[1]} for permission in permissions]

        return jsonify({"permissions": permissions_list})

    except Exception as e:
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"})


@permissions_bp.route("/edit_permissions/", methods=["POST"])
def edit_permissions():
    try:
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

        # Get permission_title and edit_permission_title from the request JSON
        data = request.json
        permission_title = data.get("permission_title")
        edit_permission_title = data.get("edit_permission_title")

        if permission_title and edit_permission_title:
            # Update permissions in the database
            permissions_to_edit = Permissions.query.filter_by(permission_title=permission_title).all()
            if permissions_to_edit:
                for permission in permissions_to_edit:
                    permission.permission_title = edit_permission_title
                    permission.updated_by = user_username
                    permission.updated_at = datetime.utcnow()

                # Commit changes
                db.session.commit()

                return jsonify({"status": "success", "message": "Permissions updated successfully"})
            else:
                return jsonify({"status": "error", "message": "No permissions found with the given title"})

        else:
            return jsonify({"status": "error", "message": "Missing permission title or edit permission title"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"})

@permissions_bp.route("/delete_permissions/", methods=["POST"])
def delete_permissions():
    try:
        # Get permission_title from the request JSON
        data = request.json
        permission_title = data.get("permission_title")

        # Fetch all permissions with the given permission_title
        permissions_to_delete = Permissions.query.filter_by(permission_title=permission_title).all()

        if permissions_to_delete:
            # Collect permission names to delete roles_permissions records
            permission_names = [permission.permission_name for permission in permissions_to_delete]

            # Delete associated records from roles_permissions table
            RolesPermissions.query.filter(RolesPermissions.permission_name.in_(permission_names)).delete(synchronize_session=False)

            # Delete permissions from permissions table
            Permissions.query.filter_by(permission_title=permission_title).delete()

            # Commit changes
            db.session.commit()

            return jsonify({"status": "success", "message": "Permissions deleted successfully"})
        else:
            return jsonify({"status": "error", "message": "No permissions found with the provided title"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Failed to delete permissions. Error: {str(e)}"})

app.register_blueprint(permissions_bp)

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
