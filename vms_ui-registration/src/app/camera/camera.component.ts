import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService, ApiResponse } from '../api.service';
import { Router } from '@angular/router';
import { delay } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';


@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnInit {

  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;

  devices: string[][] = [];
  showEditForm: boolean = false;
  selectedCamera: string[] = [];
  loading: boolean = false; // Add a loading flag
  loadingMap: { [key: string]: boolean } = {}; // Map to track loading state for each camera
  cameraTypes: string[] = [];
  locations: string[] = [];
  models: string[] = [];
  channels: string[] = [];
  protocols: string[] = [];

  searchText: string = '';
  searchResults: string[] = [];


  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.fetchCameraList();
    this.fetchCameraOptions();

  }
  loadCameraStatusFromLocalStorage() {
    for (let camera of this.devices) {
      const cameraId = camera[0];
      const status = localStorage.getItem(`cameraStatus_${cameraId}`);
      if (status) {
        camera[4] = status;
      }
    }
  }
  checkDeletePermission(): boolean {
    const sessionPermissions = localStorage.getItem('session-permissions');
    if (sessionPermissions) {
      const permissions = JSON.parse(sessionPermissions);
      return permissions.includes('delete_camera');
    }
    return false;
  }
  fetchCameraOptions() {
    this.apiService.getCameraOptions().subscribe(
      (response: any) => {
        this.cameraTypes = response.camera_options.camera_types;
        this.locations = response.camera_options.locations;
        this.models = response.camera_options.model_names;
        this.channels = response.camera_options.channels;
        this.protocols = response.camera_options.protocols;
      },
      (error) => {
        console.error('Error fetching camera options:', error);
      }
    );
  } connect(cameraId: string) {
    this.loadingMap[cameraId] = true;

    this.apiService.getCameraIPDetails(cameraId)
      .pipe(
        delay(1000)
      )
      .subscribe(
        (response) => {
          if (response && response.status === 'success' && response.rtsp_links && response.camera_id) {
            console.log('RTSP Link:', response.rtsp_links,'Camera_id:',response.camera_id);

            const currentStatus = this.getCameraStatus(cameraId);
            localStorage.setItem(`cameraStatus_${cameraId}`, currentStatus);
            // Refresh camera status after connection is established or disconnected
            this.fetchCameraList();
          } else {
            console.error('Failed to fetch camera IP details:', response ? response.message : 'Response is undefined');
          }
        },
        (error) => {
          console.error('Error fetching camera IP details:', error);
        },
        () => {
          this.loadingMap[cameraId] = false;
        }
      );
  }


  getCameraStatus(cameraId: string): string {
    const cameraIndex = this.devices.findIndex(camera => camera[0] === cameraId);
    if (cameraIndex !== -1) {
      return this.devices[cameraIndex][4];
    }
    return '';
  }

  fetchCameraList() {
    this.apiService.getCameraList().subscribe(
      (response) => {
        if (response.status === 'success') {
          this.devices = response.camera_list || [];

        } else {
          console.error('Failed to fetch camera list:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching camera list:', error);
      }
    );
  }






  startEditing(camera: string[]) {
    this.selectedCamera = [...camera];
    this.showEditForm = true;
  }

  onEditSubmit() {
    this.apiService.updateCamera({
      camera_id: this.selectedCamera[0],
      camera_name: this.selectedCamera[1],
      camera_type: this.selectedCamera[2],
      location: this.selectedCamera[3],
      status_name: this.selectedCamera[4],
      model_name: this.selectedCamera[5],
      camera_ip_address: this.selectedCamera[6],
      port: this.selectedCamera[7],
      link: this.selectedCamera[13],
      username: this.selectedCamera[8],
      password: this.selectedCamera[9],
      channel: this.selectedCamera[10],
      protocol: this.selectedCamera[11]
    }).subscribe(
      (response) => {
        if (response.status === 'success') {
          console.log('Camera updated successfully');
          this.openSnackBar('Camera updated successfully', 'custom-snackbar');
          this.showEditForm = false;
          this.fetchCameraList(); // Refresh the camera list after update
        } else {
          console.error('Failed to update camera:', response.message);
        }
      },
      (error) => {
        console.error('Error updating camera:', error);
      }
    );
  }
  openSnackBar(message: string, panelClass: string) {
    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }

  cancelEdit() {
    this.showEditForm = false;
  }

  deleteCamera(camera: string[]) {
    const cameraId = camera[0];
    this.apiService.deleteCamera(cameraId).subscribe(
      (response) => {
        if (response.status === 'success') {
          console.log('Camera deleted successfully');
          this.fetchCameraList(); // Refresh the camera list after delete
        } else {
          console.error('Failed to delete camera:', response.message);
        }
      },
      (error) => {
        console.error('Error deleting camera:', error);
      }
    );
  }
  getButtonName(cameraId: string): string {
    const cameraStatus = this.getCameraStatus(cameraId);
    return cameraStatus === 'connected' ? 'Disconnect' : 'Connect';
  }

  // Add a method to your CameraComponent class that returns the camera type for the selected camera
  getSelectedCameraType(): string {
    if (this.selectedCamera && this.selectedCamera.length > 2) {
      return this.selectedCamera[2]; // Assuming camera type is at index 2
    }
    return ''; // Default value if camera type is not found
  } search() {
    if (this.searchText.trim() === '') {
      this.removeHighlight();
      return;
    }

    const textToSearch = this.searchText.toLowerCase();
    const textElements = document.querySelectorAll('.camera-list table td:not(.button-cell)');

    textElements.forEach(element => {
      const text = element.textContent?.toLowerCase() || '';
      const highlightedText = this.highlightText(text, textToSearch);
      element.innerHTML = highlightedText;
    });
  }



  highlightText(text: string, search: string): string {
    const highlightColor = '#FF5733'; // Change this to your desired highlight color (e.g., '#FF5733' for orange)

    const regex = new RegExp('(' + search + ')', 'gi');
    return text.replace(regex, '<mark style="background-color:' + highlightColor + '">$1</mark>');
  }


  removeHighlight() {
    const textElements = document.querySelectorAll('.camera-list table td:not(.button-cell)');
    textElements.forEach(element => {
      element.innerHTML = element.textContent || '';
    });
  }

}