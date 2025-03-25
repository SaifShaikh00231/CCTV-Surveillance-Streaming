import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@app/api.service';
import { FormsModule, ValidatorFn, AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms'; // Include ValidatorFn, AbstractControl, NG_VALIDATORS, Validator
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NavbarComponentModule } from '@app/navbar/navbar.component.module';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';


@Component({
  selector: 'app-camera-add',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponentModule], // Include FormsModule
  templateUrl: './camera-add.component.html',
  styleUrls: ['./camera-add.component.css'],
  providers: [{ provide: NG_VALIDATORS, useExisting: CameraAddComponent, multi: true }] // Register the validator

})
export class CameraAddComponent {
  @ViewChild('formContainer') formContainer: ElementRef | undefined;

  // Add a variable to track the password visibility
  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
}

  connectionTypes = ['camera_ip', 'camera_usb', 'camera_web'];
  selectedConnectionType: string = '';
  showProtocolDropdown: boolean = false;
  showcamera_ip_addressInput: boolean = false;
  showUsbCameraFields: boolean = false;
  cameraTypes: string[] = [];
  locations: string[] = [];
  models: string[] = [];
  channels: string[] = [];
  selectedCameraType: string = ''; // Add this property
  protocols: string[] = [];
  showAddForm: boolean =false;

  // Add a property to store form data
  formDataoptions: any = {
    model_name: "",
    camera_types: "",
    location: "",
    channel: "",
    protocol: "",

  };
  formData: any = {
    cameraname: '',
    model_name: '',
    connectType: '',
    camera_ip_address: '',
    channel: '',
    serial_number: '',
    port: '',
    link:'',
    protocol: '',
    location: '',
    installationDate: '',
    username: "",
    password: "",
  };
  devices: string[][] | undefined;


  adjustFormHeight() {
    if (this.formContainer) {
      const formContainerHeight = this.formContainer.nativeElement.offsetHeight;
      const windowHeight = window.innerHeight;
      const remainingHeight = windowHeight - formContainerHeight;
      const marginTopBottom = remainingHeight / 2;
      this.formContainer.nativeElement.style.marginTop = marginTopBottom + 'px';
      this.formContainer.nativeElement.style.marginBottom = marginTopBottom + 'px';
    }
  }

  // Call adjustFormHeight() when the component initializes
  ngOnInit() {
    this.adjustFormHeight();
    this.fetchCameraOptions();
    this.fetchCameraList();

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
  }

  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar) { }

  onCameraTypeChange(event: Event) {
    this.selectedConnectionType = (event.target as HTMLSelectElement).value;

    // Check if the selected connection type is 'camera_ip'
    this.showProtocolDropdown = this.selectedConnectionType === 'camera_ip';
    this.showcamera_ip_addressInput = this.selectedConnectionType === 'camera_ip';

    // Check if the selected connection type is 'camera_web' to show the Lens Type dropdown


    // Check if the selected connection type is 'camera_usb' to show additional fields
    this.showUsbCameraFields = this.selectedConnectionType === 'camera_usb';
  }
  onSubmit() {
    // Check if the entered camera name already exists in the camera list
    console.log('Devices:', this.devices);
    console.log('Camera Name:', this.formData.cameraname);
    
    const isDuplicateName = (this.devices || []).some(device => device[1] === this.formData.cameraname);
    console.log('Is Duplicate Name:', isDuplicateName);
    
    // Convert the camera name to title case
    this.formData.cameraname = this.toTitleCase(this.formData.cameraname);
  
    const isCameraTypeSelected = !!this.selectedCameraType;
  
    // Check if all compulsory fields are filled
    const allCompulsoryFieldsFilled =
      this.formData.cameraname &&
      this.formData.model_name &&
      this.formData.location &&
      this.formData.installationDate;
  
    // If camera type is 'camera_ip', validate additional fields
    if (this.selectedCameraType === 'camera_ip') {
      // If link is not provided, ensure IP Address, Protocol, and Channel are filled
      if (!this.formData.link) {
        const isIpFilled = !!this.formData.camera_ip_address;
        const isProtocolFilled = !!this.formData.protocol;
        const isChannelFilled = !!this.formData.channel;
  
        if (!isIpFilled || !isProtocolFilled || !isChannelFilled) {
          this.openSnackBar('Please fill in all IP camera fields: IP Address, Protocol, and Channel', 'custom-snackbar');
          return; // Exit function early if validation fails
        }
      }
    }
  
    if (isDuplicateName) {
      // Prompt the user to try a different name
      this.openSnackBar('Camera name already exists. Please try a different name.', 'custom-snackbar');
    } else if (!isCameraTypeSelected) {
      this.openSnackBar('Please select a camera type.', 'custom-snackbar');
    } else if (!allCompulsoryFieldsFilled) {
      // If any of the compulsory fields are not filled, prompt the user to fill them
      this.openSnackBar('Please fill in all the compulsory fields: Camera Name, Model, Location, and Installation Date.', 'custom-snackbar');
    } else {
      // If the name is not a duplicate and all compulsory fields are filled, proceed with adding the camera
      // Assign form data to formData property
      this.formData.connectType = this.selectedConnectionType;
  
      // Call the addCamera method from ApiService with form data
      this.apiService.addCamera(this.formData).subscribe(
        (response) => {
          console.log('Camera added successfully:', response);
          this.fetchCameraList();
          window.location.reload();
          // Show an alert for successful addition
          this.openSnackBar('Camera added successfully:', 'custom-snackbar');
  
          // Optionally, you can navigate to a different page or refresh the current page
          // Reload the current route to refresh the page
        },
        (error) => {
          console.error('Error adding camera:', error);
          this.openSnackBar('Camera integrating failed:', 'custom-snackbar');
  
          // Handle the error as needed
        }
      );
    }
}


  toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }


  addOptions(): void {
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
    // Reset form fields if needed

  }

  onAddSubmit(): void {
    this.apiService.addCameraOptions(this.formDataoptions).subscribe(
      (response) => {
        console.log('Camera Options added successfully:', response);
        // Check if the response status is 'error'
        if (response.status === 'error') {
          // If status is 'error', show error Snackbar
          let errorMessage = response.message || 'Unknown error occurred.';
          this.openSnackBar('Camera Options Already exist:', 'error-snackbar');
        } else {
          // Otherwise, show success Snackbar
          this.openSnackBar('Camera Options added successfully:', 'success-snackbar');
          this.fetchCameraOptions();
        }
      },
      (error) => {
        console.error('Error adding camera Options:', error);
        let errorMessage = 'Error adding camera Options. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        // Show error Snackbar with the extracted error message
        this.openSnackBar(errorMessage, 'error-snackbar');
      }
    );
  }
  
  hasPermission(permission: string): boolean {
    const sessionPermissions = localStorage.getItem('session-permissions');
    if (sessionPermissions) {
      const permissions = JSON.parse(sessionPermissions);
      return permissions.includes(permission);
    }
    return false;
  }
  hasAdminPermissions(): boolean {
    return this.hasPermission('delete_camera');
  }
  fetchCameraList() {
    this.apiService.getCameraList().subscribe(
      (response) => {
        if (response.status === 'success') {
          // Check if the camera list exists and is not null
          if (response.camera_list && response.camera_list.length > 0) {
            this.devices = response.camera_list;
          } else {
            // Handle the case where the camera list is empty or null
            // You can set this.devices to an empty array or handle it as needed
            this.devices = [];
          }
        } else {
          console.error('Failed to fetch camera list:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching camera list:', error);
      }
    );
  }
  
  openSnackBar(message: string, panelClass: string) {

    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }
}