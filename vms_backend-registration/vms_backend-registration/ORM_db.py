from flask import Flask
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "cairocoders-ednalan"
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:root@localhost5432/vms'

db = SQLAlchemy()



class UserRole(db.Model):
    __tablename__ = 'users_roles'

    users_roles_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), db.ForeignKey('users.username'), nullable=False)
    role_name = db.Column(db.String(255), nullable=False)
    created_by = db.Column(db.String(255), nullable=False)


    def __repr__(self):
        return f"<UserRole {self.username} - {self.role_name}>"

class User(db.Model):
    __tablename__ = 'users'

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    mobile = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_logout_time = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token = db.Column(db.String(255), nullable=False)
    updated_by = db.Column(db.String(50), nullable=False)
    created_by = db.Column(db.String(50), nullable=False)
    username = db.Column(db.String(20), nullable=False, unique=True, primary_key=True)
    roles = db.relationship("UserRole", backref="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.username}>"


class Camera(db.Model):
    __tablename__ = 'camera'

    camera_id = db.Column(db.Integer, primary_key=True)
    status_name = db.Column(db.String(50))
    model_name = db.Column(db.String(50))
    camera_name = db.Column(db.String(100))
    location = db.Column(db.String(255))
    updated_by = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime)
    is_deleted = db.Column(db.Boolean, default=False)
    camera_type = db.Column(db.String)
    username = db.Column(db.String(50))
    password = db.Column(db.String)
    latitude = db.Column(db.String(50))
    longitude = db.Column(db.String(50))
    altitude = db.Column(db.String(50))
    created_by = db.Column(db.String(100))
    camera_ips = db.relationship('CameraIP', backref='camera', lazy=True)

class CameraIP(db.Model):
    __tablename__ = 'camera_ip'

    camera_id = db.Column(db.Integer, db.ForeignKey('camera.camera_id'), nullable=False)
    camera_ip_address = db.Column(db.String(255))
    link = db.Column(db.String(255))
    protocol = db.Column(db.String(10))
    serial_number = db.Column(db.String(50))
    camera_ip_id = db.Column(db.Integer, primary_key=True)
    channel = db.Column(db.String(255))
    port = db.Column(db.String(255))
    is_deleted = db.Column(db.Boolean, default=False)
    updated_by = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime)
    created_by = db.Column(db.String(100))

class CameraModel(db.Model):
    __tablename__ = 'camera_model'

    model_name = db.Column(db.String(50), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(100))

class CameraRecording(db.Model):
    __tablename__ = 'camera_recording'

    camera_recording_id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.Integer)
    file_path = db.Column(db.Text)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    is_deleted = db.Column(db.Boolean, default=False)
    camera_type = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(100))
class CameraRecordingSchedule(db.Model):
    __tablename__ = 'camera_recording_schedule'

    camera_recording_schedule_id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.Integer)
    file_path = db.Column(db.Text)
    start_datetime = db.Column(db.DateTime)
    end_datetime = db.Column(db.DateTime)
    is_deleted = db.Column(db.Boolean, default=False)
    camera_type = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(100))

class CameraTypes(db.Model):
    __tablename__ = 'camera_types'
    camera_type = db.Column(db.String(50), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(100))

class Channels(db.Model):
    __tablename__ = 'channels'

    channel = db.Column(db.String(255), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(100))

class Locations(db.Model):
    __tablename__ = 'locations'

    location = db.Column(db.String(255), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(100))

class Permissions(db.Model):
    __tablename__ = 'permissions'

    permission_name = db.Column(db.String(50), primary_key=True)
    updated_by = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    permission_title = db.Column(db.String(100))
    created_by = db.Column(db.String(100))

class Protocols(db.Model):
    __tablename__ = 'protocols'

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    protocol = db.Column(db.String(255), primary_key=True)
    created_by = db.Column(db.String(100))

class Roles(db.Model):
    __tablename__ = 'roles'

    role_name = db.Column(db.String(50), primary_key=True)
    updated_by = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(100))

class RolesPermissions(db.Model):
    __tablename__ = 'roles_permissions'

    role_name = db.Column(db.String(50))
    updated_by = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    permission_name = db.Column(db.String(255))
    roles_permissions_id = db.Column(db.Integer, primary_key=True)
    created_by = db.Column(db.String(100))

class Status(db.Model):
    __tablename__ = 'status'

    status_name = db.Column(db.String(50), primary_key=True)