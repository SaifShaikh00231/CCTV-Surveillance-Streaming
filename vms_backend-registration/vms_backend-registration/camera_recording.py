
import time
from flask import Flask, jsonify, Blueprint, g, Response, request, current_app
import logging
import cv2
import psycopg2
import os
import base64
import threading
from datetime import datetime
from connection import connect_to_db
from datetime import datetime, timedelta
from camera_ip_feed import get_rtsp_link
from ORM_db import Camera, CameraRecordingSchedule, CameraRecording,db



logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

camera_recording_bp = Blueprint("camera_recording_app", __name__)
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


@camera_recording_bp.route("/start_recording", methods=["POST"])
def start_recording():
    data = request.json
    user_username = request.headers.get("Session-Username", None)
    camera_id = data.get("camera_id")
    channel = data.get("channel")
    camera_name = get_camera_name(camera_id)

    if not camera_id or not channel:
        return jsonify(
            {"status": "error", "message": "Camera ID or channel not provided"}
        )

    # Fetch camera type based on camera_id from the 'camera' table
    camera_type = get_camera_type(camera_id)
    if camera_type is None:
        return jsonify({"status": "error", "message": "Camera ID not found"})

    # Fetch start time
    start_time = datetime.now()

    # Generate file path
    file_path = os.path.join(
        RECORDINGS_DIR,
        f'recording_{camera_name}_{channel}_{start_time.strftime("%Y%m%d_%H%M%S")}.mp4',
    )

    # Store recording details
    recording_info = {
        "camera_id": camera_id,
        "camera_type": camera_type,
        "start_time": start_time,
        "end_time": None,
        "file_path": file_path,
        "created_by":user_username,
    }

    # Insert recording information into the database
    insert_recording_info(recording_info)

    if camera_id not in recording_status:
        recording_status[camera_id] = {}

    if channel in recording_status[camera_id] and recording_status[camera_id][channel]:
        return jsonify(
            {"status": "error", "message": "Recording already started for this channel"}
        )

    if camera_id not in recording_streams:
        recording_streams[camera_id] = {"capture": None, "writer": None, "thread": None}

    rtsp_link = get_rtsp_link(camera_id, channel)

    if not rtsp_link:
        return jsonify(
            {
                "status": "error",
                "message": "RTSP link not found for camera ID or channel",
            }
        )

    # Add a new entry for the camera_id in the recording_status dictionary
    recording_status[camera_id][channel] = True

    # Initialize the VideoCapture object in a separate thread
    def record_thread():
        if (
            camera_id not in recording_status
            or channel not in recording_status[camera_id]
            or not recording_status[camera_id][channel]
        ):
            return
            if (
                camera_id in recording_streams
                and recording_streams[camera_id]["capture"] is not None
            ):
                # If the VideoCapture object is already initialized, continue reading frames and writing them to the VideoWriter object
                while recording_status[camera_id][channel]:
                    try:
                        ret, frame = recording_streams[camera_id]["capture"].read()
                    except cv2.error as e:
                        logging.error(
                            f"Error reading frame from camera {camera_id}: {e}"
                        )
                        break
                        if not ret:
                            break
                            recording_streams[camera_id]["writer"].write(frame)
                            return

        # Initialize the VideoCapture object with the correct RTSP link
        rtsp_link = get_rtsp_link(camera_id, channel)

        if not rtsp_link:
            return

        recording_streams[camera_id] = {"capture": None, "writer": None, "thread": None}
        recording_streams[camera_id]["capture"] = cv2.VideoCapture(rtsp_link)

        if not recording_streams[camera_id]["capture"].isOpened():
            # If the VideoCapture object cannot be initialized, return early
            return

        frame_width = int(
            recording_streams[camera_id]["capture"].get(cv2.CAP_PROP_FRAME_WIDTH)
        )
        frame_height = int(
            recording_streams[camera_id]["capture"].get(cv2.CAP_PROP_FRAME_HEIGHT)
        )

        fourcc = cv2.VideoWriter_fourcc(*"H264")
        current_datetime = datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )  # Format: YYYYMMDD_HHMMSS
        output_filename = f"{RECORDINGS_DIR}/camera_{camera_name}_channel_{channel}_{current_datetime}.mp4"
        recording_streams[camera_id]["writer"] = cv2.VideoWriter(
            output_filename, fourcc, 20.0, (frame_width, frame_height)
        )

        while recording_status[camera_id][channel]:
            ret, frame = recording_streams[camera_id]["capture"].read()
            if not ret:
                break

            recording_streams[camera_id]["writer"].write(frame)

        # Release the VideoCapture and VideoWriter objects
        recording_streams[camera_id]["capture"].release()
        recording_streams[camera_id]["writer"].release()
        del recording_streams[camera_id]

    # Start the thread
    recording_streams[camera_id]["thread"] = threading.Thread(target=record_thread)
    recording_streams[camera_id]["thread"].start()

    return jsonify(
        {
            "status": "success",
            "message": f"Recording started for camera {camera_id}, channel {channel}",
        }
    )


def insert_recording_info(recording_info):
    try:
        # Create a new CameraRecording object with the provided recording_info
        new_recording = CameraRecording(
            camera_id=recording_info["camera_id"],
            camera_type=recording_info["camera_type"],
            start_time=recording_info["start_time"],
            end_time=recording_info["end_time"],
            file_path=recording_info["file_path"],
            created_by=recording_info["created_by"]
        )

        # Add the new recording to the database session and commit the transaction
        db.session.add(new_recording)
        db.session.commit()

        return jsonify({"status": "success", "message": f"Recording started for camera {recording_info['camera_id']}"})
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error inserting recording info into database: {e}")
        return jsonify({"status": "error", "message": f"Error inserting recording info into database: {e}"})


@camera_recording_bp.route("/stop_recording", methods=["POST"])
def stop_recording():
    data = request.json
    camera_id = data.get("camera_id")
    channel = data.get("channel")

    if not camera_id or not channel:
        return jsonify(
            {"status": "error", "message": "Camera ID or channel not provided"}
        )

    if (
        camera_id not in recording_status
        or channel not in recording_status[camera_id]
        or not recording_status[camera_id][channel]
    ):
        return jsonify(
            {
                "status": "error",
                "message": "Recording not started for this camera ID or channel",
            }
        )

    # Retrieve the end time
    end_time = datetime.now()

    # Release the VideoCapture and VideoWriter objects only if they exist
    if (
        camera_id in recording_streams
        and recording_streams[camera_id]["capture"] is not None
    ):
        recording_streams[camera_id]["capture"].release()

    if (
        camera_id in recording_streams
        and recording_streams[camera_id]["writer"] is not None
    ):
        recording_streams[camera_id]["writer"].release()

    # Update the end time in the recording_info dictionary
    recording_info = {"camera_id": camera_id, "end_time": end_time}

    # Update the end time in the database
    update_end_time(recording_info)

    # Update the recording status
    del recording_status[camera_id][channel]

    # Remove camera_id entry if there are no more channels being recorded
    if not recording_status[camera_id]:
        del recording_status[camera_id]
        if camera_id in recording_streams:
            del recording_streams[camera_id]

    return jsonify(
        {
            "status": "success",
            "message": f"Recording stopped for camera {camera_id}, channel {channel}",
        }
    )


def update_end_time(recording_info):
    try:
        # Update the end time in the 'camera_recording' table using SQLAlchemy ORM
        CameraRecording.query \
            .filter(CameraRecording.camera_id == recording_info["camera_id"]) \
            .filter(CameraRecording.end_time.is_(None)) \
            .update({"end_time": recording_info["end_time"]}, synchronize_session=False)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error updating end time in database: {e}")
        return jsonify({"status": "error", "message": f"Error updating end time in database: {e}"})



def get_camera_type(camera_id):
    try:
        # Fetch camera type based on camera_id using SQLAlchemy ORM
        camera = Camera.query.filter_by(camera_id=camera_id).first()
        if camera:
            return camera.camera_type
        else:
            return None  # Camera ID not found
    except Exception as e:
        logging.error(f"Error fetching camera type: {e}")
        return None


def get_camera_name(camera_id):
    try:
        # Fetch camera name from the database based on camera_id using SQLAlchemy ORM
        camera = Camera.query.filter_by(camera_id=camera_id).first()
        if camera:
            return camera.camera_name
        else:
            return None  # Camera ID not found
    except Exception as e:
        logging.error(f"Error fetching camera name: {e}")
        return None

    

@camera_recording_bp.route("/capture-image", methods=["POST"])
def capture_image():
    try:
        data = request.json
        camera_id = data.get("camera_id")
        channel = data.get("channel")
        camera_name = get_camera_name(camera_id)

        if not camera_id or not channel:
            return jsonify({"error": "Camera ID or channel not provided"})

        rtsp_link = get_rtsp_link(camera_id, channel)

        if not rtsp_link:
            return jsonify({"error": "RTSP link not found for camera ID or channel"})

        cap = cv2.VideoCapture(rtsp_link)

        if not cap.isOpened():
            return jsonify({"error": "Failed to open video capture"})

        # Grab a frame from the video feed
        ret, frame = cap.read()
        cap.release()

        if not ret:
            return jsonify({"error": "Failed to capture frame"})

        # Generate a unique filename based on camera ID, channel, and timestamp
        current_datetime = datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )  # Format: YYYYMMDD_HHMMSS
        image_name = f"camera_{camera_name}_channel_{channel}_{current_datetime}.jpg"
        image_path = os.path.join(CAPTURED_IMAGES_DIR, image_name)

        # Save the frame as an image
        cv2.imwrite(image_path, frame)

        return jsonify(
            {"message": "Image saved successfully", "image_path": image_path}
        )

    except Exception as e:
        return jsonify({"error": str(e)})


# Endpoint to schedule recording
@camera_recording_bp.route("/schedule-recording", methods=["POST"])
def schedule_recording():
    data = request.json
    user_username = request.headers.get("Session-Username", None)
    camera_id = data["camera_id"]
    channel = data["channel"]
    camera_name = get_camera_name(camera_id)
    start_datetime = datetime.strptime(data["start_datetime"], "%Y-%m-%dT%H:%M")
    end_datetime = datetime.strptime(data["end_datetime"], "%Y-%m-%dT%H:%M")

    # Calculate the delay in seconds until the scheduled datetime
    delay_seconds = (start_datetime - datetime.now()).total_seconds()

    # If the delay is negative or zero, the scheduled time has passed
    if delay_seconds <= 0:
        return (
            jsonify(
                {"status": "error", "message": "Scheduled time has already passed."}
            ),
            400,
        )

    # Sleep until the scheduled datetime to start the recording
    threading.Timer(
        delay_seconds,
        start_recording_on_schedule,
        args=[camera_id, channel, start_datetime, end_datetime, camera_name],
    ).start()
    file_path = os.path.join(
        SCHEDULED_RECORDINGS_DIR,
        f'recording_{camera_name}_{channel}_{start_datetime.strftime("%Y%m%d_%H%M%S")}.mp4',
    )

    schedule_recording_info = {
        "camera_id": camera_id,
        "camera_type": get_camera_type(camera_id),  # Fetch camera type
        "start_datetime": start_datetime,
        "end_datetime": end_datetime,
        "file_path": file_path,
        "created_by": user_username,
    }

    insert_schedule_recording_info(schedule_recording_info)

    return (
        jsonify(
            {
                "status": "success",
                "message": "Scheduled recording started successfully.",
            }
        ),
        200,
    )


# Function to schedule recording
def schedule_recording_thread(camera_id, channel, scheduled_datetime, end_datetime):
    try:
        # Convert the scheduled datetime string to a datetime object
        scheduled_datetime = datetime.strptime(scheduled_datetime, "%Y-%m-%dT%H:%M")

        # Convert the end datetime string to a datetime object
        end_datetime = datetime.strptime(end_datetime, "%Y-%m-%dT%H:%M")

        # Calculate the delay in seconds until the scheduled datetime
        delay_seconds = (scheduled_datetime - datetime.now()).total_seconds()

        # If the delay is negative or zero, the scheduled time has passed
        if delay_seconds <= 0:
            logging.error("Scheduled time has already passed.")
            return

        # Sleep until the scheduled datetime
        logging.info(
            f"Waiting for {delay_seconds} seconds until scheduled recording at {scheduled_datetime}."
        )
        threading.Timer(
            delay_seconds,
            start_scheduled_recording,
            args=[camera_id, channel, scheduled_datetime, end_datetime],
        ).start()

    except Exception as e:
        logging.error(f"Error in scheduling recording: {str(e)}")


# Function to start recording on schedule
def start_recording_on_schedule(
    camera_id, channel, start_datetime, end_datetime, camera_name
):
    global scheduled_recording_status

    try:
        # Your logic to start recording for the specified camera ID and channel
        if not camera_id or not channel:
            return {"status": "error", "message": "Camera ID or channel not provided"}

        if camera_id not in recording_status:
            recording_status[camera_id] = {}

        if (
            channel in recording_status[camera_id]
            and recording_status[camera_id][channel]
        ):
            return {
                "status": "error",
                "message": "Recording already started for this channel",
            }

        if camera_id not in recording_streams:
            recording_streams[camera_id] = {
                "capture": None,
                "writer": None,
                "thread": None,
            }

        rtsp_link = get_rtsp_link(camera_id, channel)

        if not rtsp_link:
            return {
                "status": "error",
                "message": "RTSP link not found for camera ID or channel",
            }

        # Add a new entry for the camera_id in the recording_status dictionary
        recording_status[camera_id][channel] = True
        scheduled_recording_status[camera_id] = {
            "channel": channel,
            "end_datetime": end_datetime,
        }

        # Initialize the VideoCapture object in a separate thread
        def record_thread():
            cap = cv2.VideoCapture(rtsp_link)
            if not cap.isOpened():
                return

            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            fourcc = cv2.VideoWriter_fourcc(*"H264")
            current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"{SCHEDULED_RECORDINGS_DIR}/camera_{camera_name}_channel_{channel}_{current_datetime}.mp4"
            writer = cv2.VideoWriter(
                output_filename, fourcc, 20.0, (frame_width, frame_height)
            )

            while (
                recording_status[camera_id][channel] and datetime.now() < end_datetime
            ):
                ret, frame = cap.read()
                if not ret:
                    break

                writer.write(frame)

            # Release resources
            cap.release()
            writer.release()

        del scheduled_recording_status[camera_id]
        # Start the thread
        recording_streams[camera_id]["thread"] = threading.Thread(target=record_thread)
        recording_streams[camera_id]["thread"].start()

        return {
            "status": "success",
            "message": f"Recording started for camera {camera_id}, channel {channel}",
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Error in starting scheduled recording: {str(e)}",
        }


def get_camera_name(camera_id):
    try:
        # Fetch camera name from the database based on camera_id using SQLAlchemy ORM
        camera = Camera.query.filter_by(camera_id=camera_id).first()
        if camera:
            return camera.camera_name
        else:
            return None  # Camera ID not found
    except Exception as e:
        logging.error(f"Error fetching camera name: {e}")
        return None



# Function to start scheduled recording
def start_scheduled_recording(camera_id, channel, start_datetime, end_datetime):
    try:
        # Convert the scheduled datetime string to a datetime object
        start_datetime = datetime.strptime(start_datetime, "%Y-%m-%dT%H:%M")

        # Convert the end datetime string to a datetime object
        end_datetime = datetime.strptime(end_datetime, "%Y-%m-%dT%H:%M")

        # Check if the end time is in the past
        if end_datetime <= datetime.now():
            logging.error("End time should be greater than the current time.")
            return
        # Fetch camera type based on camera_id from the 'camera' table

        # Calculate the delay in seconds until the scheduled datetime
        delay_seconds = (start_datetime - datetime.now()).total_seconds()

        # If the delay is negative or zero, the scheduled time has passed
        if delay_seconds <= 0:
            logging.error("Scheduled time has already passed.")
            return

        # Convert the datetime objects to strings before passing them
        start_datetime_str = start_datetime.strftime("%Y-%m-%dT%H:%M")
        end_datetime_str = end_datetime.strftime("%Y-%m-%dT%H:%M")

        # Sleep until the scheduled datetime
        logging.info(
            f"Waiting for {delay_seconds} seconds until scheduled recording at {start_datetime}."
        )
        threading.Timer(
            delay_seconds,
            start_recording_on_schedule,
            args=[camera_id, channel, start_datetime_str, end_datetime_str],
        ).start()

        # Calculate the duration of the recording in seconds
        duration_seconds = (end_datetime - start_datetime).total_seconds()

        # If the duration is negative or zero, log an error
        if duration_seconds <= 0:
            logging.error("End time should be greater than start time.")
            return

        # Continuously check whether the current time has exceeded the end datetime
        while datetime.now() < end_datetime:
            # Sleep for a short interval before checking again
            time.sleep(1)

        # Once the end time is reached, stop the scheduled recording
        stop_scheduled_recording(camera_id, channel)

    except Exception as e:
        logging.error(f"Error in starting scheduled recording: {str(e)}")


def insert_schedule_recording_info(schedule_recording_info):
    try:
        # Create a new instance of CameraRecordingSchedule model
        new_schedule_recording = CameraRecordingSchedule(
            camera_id=schedule_recording_info["camera_id"],
            camera_type=schedule_recording_info["camera_type"],
            start_datetime=schedule_recording_info["start_datetime"],
            end_datetime=schedule_recording_info["end_datetime"],
            file_path=schedule_recording_info["file_path"],
            created_by=schedule_recording_info["created_by"]
        )

        # Add the new instance to the session and commit the changes
        db.session.add(new_schedule_recording)
        db.session.commit()

        return jsonify({"status": "success", "message": "Recording scheduled successfully"})
    except Exception as e:
        logging.error(f"Error inserting recording info into database: {e}")
        return jsonify({"status": "error", "message": f"Error inserting recording info into database: {e}"})


# Function to stop recording on schedule
def stop_recording_on_schedule(camera_id, channel, end_datetime):
    try:
        # Convert the end datetime string to a datetime object
        end_datetime = datetime.strptime(end_datetime, "%Y-%m-%dT%H:%M")

        # Calculate the delay in seconds until the scheduled end datetime
        delay_seconds = (end_datetime - datetime.now()).total_seconds()

        # If the delay is negative or zero, the scheduled end time has passed
        if delay_seconds <= 0:
            logging.error("Scheduled end time has already passed.")
            return

        # Sleep until the scheduled end datetime
        logging.info(
            f"Waiting for {delay_seconds} seconds until scheduled recording ends at {end_datetime}."
        )
        threading.Timer(
            delay_seconds, stop_scheduled_recording, args=[camera_id, channel]
        ).start()

    except Exception as e:
        logging.error(f"Error in scheduling recording stop: {str(e)}")


# Function to stop scheduled recording
def stop_scheduled_recording(camera_id, channel):
    try:
        # Call the function to stop recording on schedule for the specified camera ID, channel, and end datetime
        stop_recording_on_schedule(
            camera_id, channel, scheduled_recording_status[camera_id]["end_datetime"]
        )

    except Exception as e:
        logging.error(f"Error in stopping scheduled recording: {str(e)}")


def insert_schedule_recording_info(schedule_recording_info):
    try:
        # Create a new instance of CameraRecordingSchedule model
        new_schedule_recording = CameraRecordingSchedule(
            camera_id=schedule_recording_info["camera_id"],
            camera_type=schedule_recording_info["camera_type"],
            start_datetime=schedule_recording_info["start_datetime"],
            end_datetime=schedule_recording_info["end_datetime"],
            file_path=schedule_recording_info["file_path"],
            created_by=schedule_recording_info["created_by"]
        )

        # Add the new instance to the session and commit the changes
        db.session.add(new_schedule_recording)
        db.session.commit()

        return jsonify({"status": "success", "message": "Recording scheduled successfully"})
    except Exception as e:
        logging.error(f"Error inserting recording info into database: {e}")
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Error inserting recording info into database: {e}"})



# Register the blueprint
app.register_blueprint(camera_recording_bp)
if __name__ == "__main__":
    app.run(host="127.0.0.1", debug=True, port=8000)