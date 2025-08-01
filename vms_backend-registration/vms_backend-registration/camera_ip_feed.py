
from flask import Flask, jsonify, Blueprint, g, Response, request, current_app
import logging
import cv2
import psycopg2
import psycopg2.extras
import os
from ORM_db import Camera, CameraIP,db


logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

camera_feed_bp = Blueprint("camera_feed_app", __name__)
RECORDINGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recordings")
os.makedirs(RECORDINGS_DIR, exist_ok=True)

CAPTURED_IMAGES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "captured_images"
)
os.makedirs(CAPTURED_IMAGES_DIR, exist_ok=True)

SCHEDULED_RECORDINGS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "scheduled_recordings"
)
os.makedirs(SCHEDULED_RECORDINGS_DIR, exist_ok=True)

# Define the RTSP URL with parameters for accessing different channels
recording = False
rtsp_links = []
recording_info = {}
schedule_recording_info = {}


# Define global variables
recording_status = {}
scheduled_recording_status = {}
recording_streams = {}
# Initialize the VideoCapture and VideoWriter objects
out = None

DB_NAME = "vms"
DB_USER = "postgres"
DB_PASS = "root"
DB_HOST = "localhost"
DB_PORT = 5211


def connect_to_db():
    return psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
    )


def execute_query(query, params=None, fetchone=False):
    conn = connect_to_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute(query, params)
    conn.commit()

    if fetchone:
        result = cursor.fetchone()
    else:
        result = cursor.fetchall()

    cursor.close()
    conn.close()
    return result
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



@camera_feed_bp.route("/camera_ip_details/", methods=["GET", "POST"])
def camera_ip_details():
    global camera_id, rtsp_links
    camera_id = None
    rtsp_links = []  # Reset rtsp_links

    try:
        data = request.json
        camera_id = data.get("camera_id")

        if not camera_id:
            return jsonify({"status": "error", "message": "Camera ID not found"})

        cursor = get_db().cursor()

        # Fetch camera status from the database
        query_camera_status = """
            SELECT status_name FROM camera WHERE camera_id = %s;
        """
        cursor.execute(query_camera_status, (camera_id,))
        camera_status = cursor.fetchone()

        if not camera_status:
            return jsonify({"status": "error", "message": "Camera status not found"})

        # Update camera status based on current status
        if camera_status[0] == "disconnected":
            # If the camera status is 'disconnected', update it to 'connected'
            update_camera_status("connected", camera_id)
        elif camera_status[0] == "connected":
            # If the camera status is 'connected', update it to 'disconnected'
            update_camera_status("disconnected", camera_id)

        # Fetch camera details including RTSP link if available
        query_camera_details = """
            SELECT c.username, c.password, ci.camera_ip_address, ci.port, ci.protocol, ci.channel, ci.link
            FROM camera c
            LEFT JOIN camera_ip ci ON c.camera_id = ci.camera_id
            WHERE c.camera_id = %s;
        """
        cursor.execute(query_camera_details, (camera_id,))
        camera_details = cursor.fetchall()

        if not camera_details:
            return jsonify({"status": "error", "message": "Camera details not found"})

        for detail in camera_details:
            if detail[6]:
                # If RTSP link is present in the 'link' column, directly assign it to rtsp_links
                rtsp_links.append(detail[6])
            else:
                # Generate RTSP link for each channel up to max_channel
                max_channel = int(detail[5])
                for channel in range(1, max_channel + 1):
                    rtsp_link = f"{detail[4]}://{detail[2]}:{detail[3]}/user={detail[0]}_password={detail[1]}_channel={channel}_stream=0.sdp"
                    rtsp_links.append(rtsp_link)

        return jsonify(
            {"status": "success", "rtsp_links": rtsp_links, "camera_id": camera_id}
        )

    except psycopg2.Error as e:
        logging.error(f"Database error: {str(e)}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"})

    finally:
        if cursor is not None:
            cursor.close()





def update_camera_status(status, camera_id):
    try:
        # Fetch camera object from the database using SQLAlchemy ORM
        camera = Camera.query.filter_by(camera_id=camera_id).first()

        if camera:
            # Update camera status
            camera.status_name = status
            db.session.commit()
        else:
            logging.error("Camera not found.")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error updating camera status in database: {e}")


@camera_feed_bp.route("/camera_ip_feed/<int:camera_id>/<int:channel>", methods=["GET", "POST"])
def video_feed(camera_id, channel):
    try:
        if not rtsp_links:
            logging.error("RTSP links not provided")
            return jsonify({"status": "error", "message": "RTSP links not provided"})

        # Check camera status before serving the video feed
        camera_status = get_camera_status(camera_id)
        if camera_status != "connected":
            logging.error("Camera is disconnected")
            return jsonify({"status": "error", "message": "Camera is disconnected"})

        # Get the RTSP link for the requested channel
        rtsp_link = rtsp_links[channel - 1]

        return Response(
            generate_frames(rtsp_link),
            mimetype="multipart/x-mixed-replace; boundary=frame",
        )

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": f"Error: {str(e)}"})



def get_camera_status(camera_id):
    try:
        # Fetch camera status from the database using SQLAlchemy ORM
        camera = Camera.query.filter_by(camera_id=camera_id).first()

        if camera:
            return camera.status_name
        else:
            logging.error("Camera not found.")
            return None
    except Exception as e:
        logging.error(f"Error fetching camera status from database: {e}")
        return None


# Function to generate frames from a single video feed

def generate_frames(rtsp_link):
    try:
        cap = cv2.VideoCapture(rtsp_link)
        if not cap.isOpened():
            raise Exception("Error opening video stream or file")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            ret, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )

    except Exception as e:
        print(str(e))
        pass
    finally:
        cap.release()


@camera_feed_bp.route("/get_rtsp_link", methods=["POST"])
# Function to get RTSP link
def get_rtsp_link(camera_id, channel):
    try:
        # Make a request to fetch the camera details and obtain the camera_id and RTSP link
        response = app.test_client().post(
            "/camera_ip_details/", json={"camera_id": camera_id}
        )
        data = response.get_json()

        if data["status"] == "error":
            logging.error(data["message"])
            return None  # Return None if there's an error

        rtsp_links = data["rtsp_links"]

        # Ensure the channel is within bounds
        if int(channel) < 1 or int(channel) > len(rtsp_links):
            logging.error("Invalid channel")
            return None  # Return None for invalid channel

        rtsp_link = rtsp_links[int(channel) - 1]

        return rtsp_link

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return None  # Return None if there's an error


def fetch_rtsp_link(camera_id, channel):
    try:
        # Make a request to fetch the camera details and obtain the RTSP link
        response = app.test_client().post(
            "/camera_ip_details/", json={"camera_id": camera_id}
        )
        data = response.get_json()

        if data["status"] == "error":
            logging.error(data["message"])
            return None

        rtsp_links = data["rtsp_links"]

        # Ensure the channel is within bounds
        if int(channel) < 1 or int(channel) > len(rtsp_links):
            return None

        return rtsp_links[int(channel) - 1]

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return None

    return jsonify({"message": "Image saved successfully"})




# Register the blueprint
app.register_blueprint(camera_feed_bp)

# Run the Flask application
if __name__ == "__main__":
    app.run(host="127.0.0.1", debug=True, port=8000)
