from datetime import datetime
from flask import Flask, request, jsonify, Blueprint
import psutil
import GPUtil
from sqlalchemy import func
from ORM_db import Camera, CameraRecording, CameraRecordingSchedule, User, db
import asyncio
import wmi
import pythoncom
import logging
app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"

admin_reports_bp = Blueprint("admin_reports_app", __name__)

@admin_reports_bp.route("/admin_reports/", methods=["GET", "POST"])
def admin_reports():
    try:
     
        # Fetch data using ORM
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = User.query.filter_by(is_active=False).count()
        total_cameras = Camera.query.count()
        active_cameras = Camera.query.filter_by(status_name='connected').count()
        inactive_cameras = Camera.query.filter_by(status_name='disconnected').count()


        camera_data = db.session.query(Camera.camera_type, Camera.location, db.func.count()).group_by(Camera.camera_type, Camera.location).all()
        camera_data = [{'camera_type': item[0], 'location': item[1], 'count': item[2]} for item in camera_data]

        # Fetch recording count per day from both camera_recording and camera_recording_schedule tables
        daily_recordings_camera = db.session.query(db.func.date(CameraRecording.start_time), db.func.count()).group_by(db.func.date(CameraRecording.start_time)).all()
        daily_recordings_schedule = db.session.query(db.func.date(CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date(CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the daily recordings from both tables
        daily_recordings = merge_recordings(daily_recordings_camera, daily_recordings_schedule)

        # Fetch recording count per week from both camera_recording and camera_recording_schedule tables
        weekly_recordings_camera = db.session.query(db.func.date_trunc('week', CameraRecording.start_time), db.func.count()).group_by(db.func.date_trunc('week', CameraRecording.start_time)).all()
        weekly_recordings_schedule = db.session.query(db.func.date_trunc('week', CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date_trunc('week', CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the weekly recordings from both tables
        weekly_recordings = merge_recordings(weekly_recordings_camera, weekly_recordings_schedule)

        # Fetch recording count per month from both camera_recording and camera_recording_schedule tables
        monthly_recordings_camera = db.session.query(db.func.date_trunc('month', CameraRecording.start_time), db.func.count()).group_by(db.func.date_trunc('month', CameraRecording.start_time)).all()
        monthly_recordings_schedule = db.session.query(db.func.date_trunc('month', CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date_trunc('month', CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the monthly recordings from both tables
        monthly_recordings = merge_recordings(monthly_recordings_camera, monthly_recordings_schedule)

        # Fetch recording count per year from both camera_recording and camera_recording_schedule tables
        yearly_recordings_camera = db.session.query(db.func.date_trunc('year', CameraRecording.start_time), db.func.count()).group_by(db.func.date_trunc('year', CameraRecording.start_time)).all()
        yearly_recordings_schedule = db.session.query(db.func.date_trunc('year', CameraRecordingSchedule.start_datetime), db.func.count()).group_by(db.func.date_trunc('year', CameraRecordingSchedule.start_datetime)).all()
        
        # Combine and merge the yearly recordings from both tables
        yearly_recordings = merge_recordings(yearly_recordings_camera, yearly_recordings_schedule)

                # Fetching number of pending recordings
        pending_recordings = db.session.query(CameraRecordingSchedule).join(
            Camera, CameraRecordingSchedule.camera_id == Camera.camera_id
        ).count()

        complete_recordings = db.session.query(CameraRecordingSchedule).join(
            Camera, CameraRecordingSchedule.camera_id == Camera.camera_id
        ).count()

        total_scheduled_recordings = db.session.query(CameraRecordingSchedule).join(
            Camera, CameraRecordingSchedule.camera_id == Camera.camera_id
        ).count()
        scheduled_recordings = db.session.query(func.count(CameraRecordingSchedule.camera_recording_schedule_id)).scalar()


        combined_response = {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "total_cameras": total_cameras,
            "active_cameras": active_cameras,
            "inactive_cameras": inactive_cameras,
            "camera_data": camera_data,
            "daily_recordings": daily_recordings,
            "weekly_recordings": weekly_recordings,
            "monthly_recordings": monthly_recordings,
            "yearly_recordings": yearly_recordings,
            "pending_recordings": pending_recordings,
            "complete_recordings": complete_recordings,
            "total_scheduled_recordings": total_scheduled_recordings,
            "scheduled_recordings": scheduled_recordings,
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

async def fetch_cpu_ram():
    cpu_percent = psutil.cpu_percent(interval=1)  # Adjust interval as needed
    ram_percent = psutil.virtual_memory().percent
    return cpu_percent, ram_percent



async def fetch_cpu_temperature():
    pythoncom.CoInitialize()  # Initialize COM
    try:
        c = wmi.WMI()
        cpu_temperature = None
        
        # Check Win32_TemperatureProbe
        try:
            temperature_info = c.Win32_TemperatureProbe()
            for temp in temperature_info:
               
                if hasattr(temp, 'CurrentTemperature'):
                    cpu_temperature = temp.CurrentTemperature
                    break
        except Exception as e:
            logging.error(f"Error accessing Win32_TemperatureProbe: {e}")
        
        # Check MSAcpi_ThermalZoneTemperature
        if cpu_temperature is None:
            try:
                temperature_info = c.MSAcpi_ThermalZoneTemperature()
                for temp in temperature_info:
                
                    if hasattr(temp, 'CurrentTemperature'):
                        # Temperature is in tenths of Kelvin, convert it to Celsius
                        cpu_temperature = temp.CurrentTemperature / 10.0 - 273.15
                        break
            except Exception as e:
                logging.error(f"Error accessing MSAcpi_ThermalZoneTemperature: {e}")
        
        # Check Win32_PerfFormattedData_Counters_ThermalZoneInformation
        if cpu_temperature is None:
            try:
                temperature_info = c.Win32_PerfFormattedData_Counters_ThermalZoneInformation()
                for temp in temperature_info:
                  
                    if hasattr(temp, 'Temperature'):
                        # Temperature is in tenths of Kelvin, convert it to Celsius
                        cpu_temperature = temp.Temperature - 273.15
                        cpu_temperature = f"{cpu_temperature:.0f}"
                        break
            except Exception as e:
                logging.error(f"Error accessing Win32_PerfFormattedData_Counters_ThermalZoneInformation: {e}")

        
        return cpu_temperature
    except Exception as e:
        logging.error(f"Error fetching CPU temperature: {e}")
        return None
    finally:
        pythoncom.CoUninitialize()  # Uninitialize COM after usage

async def fetch_system_resources():
    cpu_ram_task = asyncio.create_task(fetch_cpu_ram())
    cpu_ram_result = await cpu_ram_task
    cpu_temp_task = asyncio.create_task(fetch_cpu_temperature())
    cpu_temp_result = await cpu_temp_task
    return cpu_ram_result[0], cpu_ram_result[1], cpu_temp_result

@admin_reports_bp.route('/system_resources/', methods=['POST'])
def get_system_resources():
    try:
        cpu_percent, ram_percent, cpu_temp = asyncio.run(fetch_system_resources())
        # logging.debug(f"Fetched System Resources - CPU Percent: {cpu_percent}, RAM Percent: {ram_percent}, CPU Temperature: {cpu_temp}")
        return jsonify({
            'cpu_percent': cpu_percent,
            'ram_percent': ram_percent,
            'cpu_temp': cpu_temp
        })
    except Exception as e:
        logging.error(f"Error in get_system_resources: {e}")
        return jsonify({'error': str(e)}), 500


async def fetch_gpu():
    try:
        gpu_info = GPUtil.getGPUs()
        if gpu_info:
            gpu_name = gpu_info[0].name
            gpu_load = gpu_info[0].load * 100
            gpu_load = round(gpu_load, 2)
            gpu_load = f"{gpu_load:.1f}%"  # Format as a string with two decimal places and a percentage sign
           
            return gpu_name, gpu_load
        
        else:
            return "No GPU found", 0.0
    except Exception as e:
        return "Error fetching GPU usage", 0.0

@admin_reports_bp.route('/gpu_stats/', methods=['POST'])
def get_gpu_stats():
    try:
        gpu_name, gpu_load = asyncio.run(fetch_gpu())
        return jsonify({
            'gpu_name': gpu_name,
            'gpu_load': gpu_load,   
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@admin_reports_bp.route('/battery_status/', methods=['POST'])
def get_battery_status():
    try:
        battery_info = psutil.sensors_battery()
        if battery_info:
            battery_percent = battery_info.percent
            battery_plugged = battery_info.power_plugged
            return jsonify({
                'battery_percent': battery_percent,
                'battery_plugged': battery_plugged
            })
        else:
            return jsonify({'error': 'Battery information not available.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# Register the blueprint
app.register_blueprint(admin_reports_bp)

# Run the Flask application
if __name__ == "__main__":
    app.run(debug=True)
