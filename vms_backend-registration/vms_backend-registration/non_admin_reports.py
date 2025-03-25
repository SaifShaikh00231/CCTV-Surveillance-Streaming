from datetime import datetime
from flask import Flask, request, jsonify, Blueprint
from sqlalchemy import func
from ORM_db import Camera, CameraRecording, CameraRecordingSchedule, User, db

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

non_admin_reports_bp = Blueprint("non_admin_reports_app", __name__)

@non_admin_reports_bp.route("/non_admin_reports/", methods=["GET", "POST"])
def non_admin_reports():
    try:
        # Extract session email from the request headers
        user_username = request.headers.get("Session-Username", None)

        if not user_username:
            return jsonify({"status": "error", "message": "User not found in the session"})
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = User.query.filter_by(is_active=False).count()

        # Fetch data using ORM
        total_cameras = Camera.query.filter_by(created_by=user_username).count()
        active_cameras = Camera.query.filter_by(status_name='connected', created_by=user_username).count()
        inactive_cameras = Camera.query.filter_by(status_name='disconnected', created_by=user_username, is_deleted=False).count()

        camera_data = db.session.query(Camera.camera_type, Camera.location, db.func.count()).filter_by(created_by=user_username).group_by(Camera.camera_type, Camera.location).all()
        camera_data = [{'camera_type': item[0], 'location': item[1], 'count': item[2]} for item in camera_data]
    
        # Fetch recording count per day from both camera_recording and camera_recording_schedule tables
        daily_recordings_camera = db.session.query(db.func.date(CameraRecording.start_time), db.func.count()).filter_by(created_by=user_username).group_by(db.func.date(CameraRecording.start_time)).all()
        daily_recordings_schedule = db.session.query(db.func.date(CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date(CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the daily recordings from both tables
        daily_recordings = merge_recordings(daily_recordings_camera, daily_recordings_schedule)

        # Fetch recording count per week from both camera_recording and camera_recording_schedule tables
        weekly_recordings_camera = db.session.query(db.func.date_trunc('week', CameraRecording.start_time), db.func.count()).filter_by(created_by=user_username).group_by(db.func.date_trunc('week', CameraRecording.start_time)).all()
        weekly_recordings_schedule = db.session.query(db.func.date_trunc('week', CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date_trunc('week', CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the weekly recordings from both tables
        weekly_recordings = merge_recordings(weekly_recordings_camera, weekly_recordings_schedule)

        # Fetch recording count per month from both camera_recording and camera_recording_schedule tables
        monthly_recordings_camera = db.session.query(db.func.date_trunc('month', CameraRecording.start_time), db.func.count()).filter_by(created_by=user_username).group_by(db.func.date_trunc('month', CameraRecording.start_time)).all()
        monthly_recordings_schedule = db.session.query(db.func.date_trunc('month', CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date_trunc('month', CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the monthly recordings from both tables
        monthly_recordings = merge_recordings(monthly_recordings_camera, monthly_recordings_schedule)

        # Fetch recording count per year from both camera_recording and camera_recording_schedule tables
        yearly_recordings_camera = db.session.query(db.func.date_trunc('year', CameraRecording.start_time), db.func.count()).filter_by(created_by=user_username).group_by(db.func.date_trunc('year', CameraRecording.start_time)).all()
        yearly_recordings_schedule = db.session.query(db.func.date_trunc('year', CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date_trunc('year', CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the yearly recordings from both tables
        yearly_recordings = merge_recordings(yearly_recordings_camera, yearly_recordings_schedule)

        # Fetching number of pending recordings
        pending_recordings = db.session.query(CameraRecordingSchedule).join(
            Camera, CameraRecordingSchedule.camera_id == Camera.camera_id
        ).filter(
            Camera.created_by == user_username,
            CameraRecordingSchedule.start_datetime > datetime.now()
        ).count()

        complete_recordings = db.session.query(CameraRecordingSchedule).join(
            Camera, CameraRecordingSchedule.camera_id == Camera.camera_id
        ).filter(
            Camera.created_by == user_username,
            CameraRecordingSchedule.end_datetime < datetime.now()
        ).count()

        total_scheduled_recordings = db.session.query(CameraRecordingSchedule).join(
            Camera, CameraRecordingSchedule.camera_id == Camera.camera_id
        ).filter(
            Camera.created_by == user_username
        ).count()
        scheduled_recordings = db.session.query(CameraRecordingSchedule.camera_recording_schedule_id).filter(
            Camera.created_by == user_username
        ).count()

        combined_response = {
            "total_cameras": total_cameras,
             "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "active_cameras": active_cameras,
            "inactive_cameras": inactive_cameras,
            "pending_recordings": pending_recordings,
            "complete_recordings": complete_recordings,
            "total_scheduled_recordings": total_scheduled_recordings,
            "scheduled_recordings": scheduled_recordings,
            "camera_data": camera_data,
            "daily_recordings": daily_recordings,
            "weekly_recordings": weekly_recordings,
            "monthly_recordings": monthly_recordings,
            "yearly_recordings": yearly_recordings,
        }

        return jsonify(combined_response)

    except Exception as e:
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500
def merge_recordings(recordings1, recordings2):
    merged_recordings = {}
    for recording in recordings1:
        date = recording[0].strftime('%a, %d %b %Y %H:%M:%S GMT')
        count = recording[1]
        if date in merged_recordings:
            merged_recordings[date] += count
        else:
            merged_recordings[date] = count

    for recording in recordings2:
        date = recording[0].strftime('%a, %d %b %Y %H:%M:%S GMT')
        count = recording[1]
        if date in merged_recordings:
            merged_recordings[date] += count
        else:
            merged_recordings[date] = count

    return [{"daily_recordings": str(count), "date": date} for date, count in merged_recordings.items()]

# Register the blueprint
app.register_blueprint(non_admin_reports_bp)

# Run the Flask application
if __name__ == "__main__":
    app.run(debug=True)
