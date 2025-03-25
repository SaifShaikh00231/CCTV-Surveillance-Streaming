from datetime import datetime
from flask import Flask, request, jsonify, Blueprint
from ORM_db import Camera, CameraIP,db


app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

camera_list_bp = Blueprint("camera_list_app", __name__)





@camera_list_bp.route("/camera_list/", methods=["GET", "POST"])
def camera_list():
    try:
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return jsonify({"status": "error", "message": "Username not found in the session"})

        result_camera_list = Camera.query.filter_by(created_by=user_username, is_deleted=False).all()

        camera_list = []
        for camera in result_camera_list:
            camera_data = [
                camera.camera_id,
                camera.camera_name,
                camera.camera_type,
                camera.location,
                camera.status_name,
                camera.model_name,
                camera.camera_ips[0].camera_ip_address if camera.camera_ips else "null",
                camera.camera_ips[0].port if camera.camera_ips else "null",
                camera.username,
                camera.password,
                camera.camera_ips[0].channel if camera.camera_ips else "null",
                camera.camera_ips[0].protocol if camera.camera_ips else "null",
                camera.is_deleted,
                camera.camera_ips[0].link if camera.camera_ips else "null",

                camera.latitude,
                camera.longitude,
                camera.altitude,
            ]
            camera_list.append(camera_data)
            print(camera_list)

        return jsonify({"status": "success", "camera_list": camera_list})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
@camera_list_bp.route("/update_camera/", methods=["POST"])
def update_camera():
    try:
        data = request.json
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return jsonify({"status": "error", "message": "Username not found in the session"})

        camera_id = data.get("camera_id")
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({"status": "error", "message": "Camera not found"})

        camera_name = data.get("camera_name")
        camera_type = data.get("camera_type")
        location = data.get("location")
        camera_ip_address = data.get("camera_ip_address")
        port = data.get("port")
        username = data.get("username")
        password = data.get("password")
        status_name = data.get("status_name")
        protocol = data.get("protocol")
        link = data.get("link")
        model_name = data.get("model_name")
        channel = data.get("channel")


        camera.camera_name = camera_name
        camera.camera_type = camera_type
        camera.location = location
        camera.username = username
        camera.password = password
        camera.status_name = status_name
        camera.model_name = model_name
        camera.updated_by = user_username
        camera.updated_at = datetime.utcnow()

        # Update camera IP if it exists
        camera_ip = CameraIP.query.filter_by(camera_id=camera_id).first()
        if camera_ip:
            camera_ip.camera_ip_address = camera_ip_address
            camera_ip.port = port
            camera_ip.link = link
            camera_ip.protocol = protocol
            camera_ip.channel = channel
            camera_ip.updated_by = user_username
            camera_ip.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({"status": "success", "message": "Camera updated successfully"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)})




@camera_list_bp.route("/delete_camera/", methods=["POST"])
def delete_camera():
    try:
        data = request.json
        user_username = request.headers.get("Session-Username", None)
        if not user_username:
            return jsonify({"status": "error", "message": "Username not found in the session"})

        camera_id = data.get("camera_id")
        camera = Camera.query.get(camera_id)
        if not camera:
            return jsonify({"status": "error", "message": "Camera not found"})

        camera.is_deleted = True
        camera.updated_by = user_username
        camera.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({"status": "success", "message": "Camera marked as deleted successfully"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)})


# Register the blueprint
app.register_blueprint(camera_list_bp)

# Run the Flask application
if __name__ == "__main__":
    app.run(debug=True)
