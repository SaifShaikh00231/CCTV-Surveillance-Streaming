from flask import Flask, request, jsonify, Blueprint, g, session
from werkzeug.security import check_password_hash
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from ORM_db import User, Camera, CameraIP, CameraModel,CameraTypes,Locations,Channels,Protocols,db

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"
add_camera_bp = Blueprint("add_camera_app", __name__)



# Add Camera route
@add_camera_bp.route("/add_camera/", methods=["POST"])
def add_camera():
    try:
        data = request.json
        user_username = request.headers.get("Session-Username", None)

        if not user_username:
            return jsonify({"status": "error", "message": "User username not found in the session"}), 400
        


        camera_name = data.get("cameraname")
        model_name = data.get("model_name")
        location = data.get("location")
        username = data.get("username")
        password = data.get("password")
        camera_type = data.get("connectType")

        camera_ip_address = data.get("camera_ip_address")
        serial_number = data.get("serial_number")
        port = data.get("port")
        link = data.get("link")
        protocol = data.get("protocol")
        channel = data.get("channel")
        print(channel)

        if channel is None or not channel.strip():
            channel = "1"

       
        new_camera = Camera(camera_name=camera_name, model_name=model_name, location=location,
                            username=username, password=password, camera_type=camera_type,
                            created_by=user_username, created_at=datetime.now(),status_name='disconnected')

        db.session.add(new_camera)
        db.session.commit()

        if camera_type == "camera_ip":
            new_camera_ip = CameraIP(camera_id=new_camera.camera_id, camera_ip_address=camera_ip_address,
                                     serial_number=serial_number, port=port, protocol=protocol,
                                     channel=channel, link=link,created_by=user_username)

            db.session.add(new_camera_ip)
            db.session.commit()

        return jsonify({"status": "success", "message": "Camera added successfully", "camera_id": new_camera.camera_id})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@add_camera_bp.route("/add_camera_options/", methods=["POST"])
def add_camera_options():
    try:
        data = request.json
        user_username = request.headers.get("Session-Username", None)

        if not user_username:
            return jsonify({"status": "error", "message": "User username not found in the session"}), 400

        model_name = data.get("model_name", "").lower()
        camera_type = data.get("camera_type", "").lower()
        location = data.get("location", "").lower()
        channel = data.get("channel", "").lower()
        protocol = data.get("protocol", "").lower()

        if model_name:
            new_model = CameraModel(model_name=model_name, created_by=user_username)
            db.session.add(new_model)

        if camera_type:
            new_type = CameraTypes(camera_type=camera_type, created_by=user_username)
            db.session.add(new_type)

        if location:
            new_location = Locations(location=location, created_by=user_username)
            db.session.add(new_location)

        if channel:
            new_channel = Channels(channel=channel, created_by=user_username)
            db.session.add(new_channel)

        if protocol:
            new_protocol = Protocols(protocol=protocol, created_by=user_username)
            db.session.add(new_protocol)

        db.session.commit()

        return jsonify({"status": "success", "message": "Camera options added successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@add_camera_bp.route("/get_camera_options/", methods=["POST"])
def get_camera_options():
    try:
        camera_options = {
            "camera_types": [camera_type.camera_type for camera_type in CameraTypes.query.all()],
            "locations": [location.location for location in Locations.query.all()],
            "model_names": [model.model_name for model in CameraModel.query.all()],
            "channels": [channel.channel for channel in Channels.query.all()],
            "protocols": [protocol.protocol for protocol in Protocols.query.all()],
        }

        return jsonify({"status": "success", "camera_options": camera_options})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})



# Register the blueprint
app.register_blueprint(add_camera_bp)

# Run the Flask application
if __name__ == "__main__":
    app.run(port=8001, debug=True)
