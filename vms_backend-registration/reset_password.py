from flask import Flask, request, jsonify, Blueprint, g
import psycopg2
import psycopg2.extras
from werkzeug.security import generate_password_hash, check_password_hash
import smtplib
from email.mime.text import MIMEText
from connection import connect_to_db
import secrets
import string
from datetime import datetime


app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

forgotpassword_bp = Blueprint("forgotpassword_app", __name__)


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


# Function to send password reset email
def send_password_reset_email(email, reset_link):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    smtp_username = "demo7595vms"
    smtp_password = "jvxholppdtlunlai"
    sender_email = "yashthakkar7595@gmail.com"

    subject = "Password Reset Request"
    body = f"Click the following link to reset your password: {reset_link}"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = email

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(sender_email, [email], msg.as_string())


def generate_token():
    alphabet = string.ascii_letters + string.digits
    token = "".join(secrets.choice(alphabet) for i in range(32))
    return token


# Forgot password route
@forgotpassword_bp.route("/forgotpassword/", methods=["POST"])
def forgot_password():
    cursor = get_db().cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Assuming you receive the email address from the request
    email = request.json.get("email")

    # Query the database for the user with the provided email
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    account = cursor.fetchone()

    if account:
        # Generate a unique password reset token
        reset_token = generate_token()

        # Store the reset token in the database (or associate it with the user's email)
        cursor.execute(
            "UPDATE users SET reset_token = %s WHERE email = %s", (reset_token, email)
        )

        get_db().commit()

        # Construct the reset link with the reset token
        reset_link = f"https://saifshaikh00231.github.io/reset-password?token={reset_token}"

        # Send the password reset email
        send_password_reset_email(email, reset_link)

        return jsonify(
            {"status": "success", "message": "Password reset link sent to your email"}
        )
    else:
        return jsonify(
            {"status": "error", "message": "User with this email does not exist"}
        )


# Password reset route
@forgotpassword_bp.route("/reset-password", methods=["POST"])
def reset_password():
    cursor = get_db().cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Get the new password and token from the request
    new_password = request.json.get("new_password")
    reset_token = request.args.get("token")  # Use 'token' as the parameter name

    if not new_password or not reset_token:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "New password or reset token not provided",
                }
            ),
            400,
        )

    # Validate the new password
    if len(new_password) < 8:
        return jsonify(
            {
                "status": "error",
                "message": "Password must be at least 8 characters long!",
            }
        )
    elif not any(char.isupper() for char in new_password):
        return jsonify(
            {
                "status": "error",
                "message": "Password must contain at least one uppercase letter",
            }
        )
    elif not any(char.islower() for char in new_password):
        return jsonify(
            {
                "status": "error",
                "message": "Password must contain at least one lowercase letter",
            }
        )
    elif not any(char in '!@#$%^&*(),.?":{}|<>' for char in new_password):
        return jsonify(
            {
                "status": "error",
                "message": "Password must contain at least one special character",
            }
        )

    # Hash the new password before storing it
    hashed_password = generate_password_hash(new_password)

    # Update the user's password in the database based on the reset token
    cursor.execute(
        "UPDATE users SET password = %s WHERE reset_token = %s",
        (hashed_password, reset_token),
    )
    get_db().commit()

    return jsonify({"status": "success", "message": "Password reset successful"})


# Run the Flask application
if __name__ == "__main__":
    app.run(debug=True)
