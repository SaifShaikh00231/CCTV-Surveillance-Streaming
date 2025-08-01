// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
export interface NetworkStats {
  sent_rate: number;
  recv_rate: number;
}
export interface ApiResponse {
  camera_id: string | boolean | undefined;
  counts: any;
  username?: string;
  network_stats: NetworkStats;

  chrome_usage: number;
  cpu_percent: number;
  ram_percent: number;
  gpu_name: string; // Corrected type to string
  gpu_load: number; // Corrected type to string
  user_details: never[];
  camera_data1: any;
  cpu_temp:number;

  pending_recordings: any;
  complete_recordings: any;
  total_scheduled_recordings: any;
 scheduled_recordings: any;

  combined_recordings: any;
  recordings: any;
  daily_recordings: any;
  camera_types: any[];
  inactive_users: any;
  active_users: any;
  camera_data: any[]; // Update this line to reflect the structure of camera_data
  status: string;
  message: string;
  camera_list?: string[][];
  email?: string;
  rtsp_links?: string;
  users_list?: string[][];
  roles_list?: string[][];
  data?: any;
  optionsdata?: any;
  permissions: string[];
  total_users: number;
  total_cameras: number;
  active_cameras: number;
  inactive_cameras: number;
  total_storage: number;
  total_storage_used: string;
  camera_locations: { [location: string]: number };
  video_storage_usage: { [month: string]: number };
}


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  markCameraAsDeleted(cameraId: string) {
    throw new Error('Method not implemented.');
  }
  removePermission(permissionName: string) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://127.0.0.1:8000'; // Update with your Flask API URL

  constructor(private http: HttpClient) { }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('your-token') || '';
    const sessionUsername = localStorage.getItem('session-username') || '';
    const sessionPermissions = localStorage.getItem('session-permissions') || '';

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Session-Username': sessionUsername,
      'Session-Permissions': sessionPermissions,
    });
  }

  getCameraList(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/camera_list/`, {}, { headers });
  }
  getCameraOptions(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/get_camera_options/`, {}, { headers });
  }
  updateCamera(cameraData: { camera_id: string; camera_name: string; camera_type: string; location: string; status_name: string; camera_ip_address: string; port: string, model_name: string, username: string, password: string, channel: string, protocol: string ,link:string}): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/update_camera/`, cameraData, { headers });
  }


  register(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}/register/`, data, { headers });
  }

  login(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/login/`, data).pipe(
      tap(response => {
        if (response.status === 'success' && response.username && response.permissions) {
          localStorage.setItem('session-username', response.username);
          localStorage.setItem('session-permissions', JSON.stringify(response.permissions));
        }
      })
    );
  }
  logout(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout/`, {}, { headers });
  }
  
  resetPassword(token: string, new_password: string): Observable<ApiResponse> {
    console.log(`Calling resetPassword API with token: ${token}`);
    return this.http.post<ApiResponse>(`${this.apiUrl}/reset-password?token=${token}`, { new_password });
  }

  addCamera(data: any): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/add_camera/`, data, { headers });
  }
  addCameraOptions(optionsdata: any): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/add_camera_options/`, optionsdata, { headers });
  }
  deleteCamera(cameraId: string): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/delete_camera/`, { camera_id: cameraId }, { headers });
  }

  getCameraIPDetails(cameraId: string): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/camera_ip_details/`, { camera_id: cameraId }, { headers });
  }

  connect(cameraId: string): Observable<any> {
    const data = { camera_id: cameraId };
    return this.http.post<any>(`${this.apiUrl}/camera_view/`, data);
  }
  getRTSPLinks(cameraId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/camera_ip_details/`, { camera_id: cameraId });
  }
  getUsersList(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/users_list/`, {}, { headers });
  }
  getRolesList(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/roles_list/`, {}, { headers });
  }
  getRoles(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/get_the_roles/`, {}, { headers });
  }
  updateRoles(RoleData: { old_role_name: string; new_role_name: string; is_deleted: string }): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/update_roles/`, RoleData, { headers });
  }

  deleteRoles(role_name: string): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/delete_roles/`, { role_name: role_name }, { headers });
  }
  updateUsers(UserData: { username: string; role_name: string; is_active: string }): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/update_users/`, UserData, { headers });
  }

  postStorePermissions(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/store_permissions`, data, { headers });
  }
  getPermissions(role_name: string): Observable<any> {
    const body = JSON.stringify({ role_name });
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/get_permissions`, body, { headers });
  }
  startRecording(cameraId: string, channel: string): Observable<ApiResponse> {
    const body = {
      camera_id: cameraId,
      channel: channel
    };

    const headers = this.getHeaders();

    return this.http.post<any>(`${this.apiUrl}/start_recording`, body, { headers: headers });
  }


  stopRecording(cameraId: string, channel: string): Observable<any> {
    const body = {
      camera_id: cameraId,
      channel: channel
    };

    const headers = this.getHeaders();

    return this.http.post<any>(`${this.apiUrl}/stop_recording`, body, { headers: headers });
  }
  

  captureAndSaveImage(cameraId: string, channel: string): Observable<ApiResponse> {
    const body = {
      camera_id: cameraId,
      channel: channel
    };

    const headers = this.getHeaders();

    // Send the captured image data along with camera ID and channel to the backend server
    return this.http.post<any>(`${this.apiUrl}/capture-image`, body, { headers: headers });
  }
  scheduleRecording(cameraId: string, channel: string, startDateTime: string, endDateTime: string): Observable<ApiResponse> {
    const headers = this.getHeaders(); 

    try {
      // Call the endpoint to schedule recording
      return this.http.post<any>(`${this.apiUrl}/schedule-recording`, {
        camera_id: cameraId,
        channel: channel,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
      }, { headers: headers }); // Attach headers to the request
    } catch (error) {
      console.error('Failed to schedule recording:', error);
      return throwError(error);
    }
}


  getAdminReportData(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.get<ApiResponse>(`${this.apiUrl}/admin_reports/`, { headers });
  }
  getNonAdminReportData(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.get<ApiResponse>(`${this.apiUrl}/non_admin_reports/`, { headers });
  }
  getsystemresources(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/system_resources/`,  { headers });
  }
  
  getgpuStats(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/gpu_stats/`,  { headers });
  }
  
  addPermissions(Permissiondata: { permission_name: string }): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/add_permissions/`, Permissiondata, { headers });
  }
  fetchPermission(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/fetch_permissions/`, {}, { headers });

  }
  editPermission(data: { permission_name: string; edit_permission_name: string; permission_title: string; edit_permission_title: string; }): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/edit_permissions/`, data, { headers });
  }
  deletePermission(data: { permission_title: string, permission_name: string }): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/delete_permissions/`, data, { headers });
  }
  getUsersProfile(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/users_profile/`, {}, { headers });
  }
  editUserProfile(profileDataedit: { first_name: string; last_name: string; username: string; mobile: string; dob: string; }): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/edit_profile/`, profileDataedit, { headers });
  }
  addRoles(data: any): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/add_roles/`, data, { headers });
  }
  batterystatus(): Observable<ApiResponse> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse>(`${this.apiUrl}/battery_status/`, {}, { headers });
}}