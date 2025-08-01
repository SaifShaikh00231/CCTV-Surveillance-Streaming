import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiResponse, ApiService } from '../api.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [DatePipe]
})
export class ProfileComponent implements OnInit {

  editModeClass: string = '';
  originalData: any; // Declare originalData without initialization
  isMobileFieldEditMode(): boolean {
    return this.editMode['mobile'];
  }


  constructor(private datePipe: DatePipe, private apiService: ApiService, private router: Router, private snackBar: MatSnackBar
  ) { }
  profileData: any = {
    first_name: '',
    last_name: '',
    username: '',
    mobile: '',
    dob: '',
    role_name: '',

  };
  profileDataedit: any = {
    first_name: '',
    last_name: '',
    username: '',
    mobile: '',
    dob: '',

  };

  editMode = {
    first_name: false,
    last_name: false,
    username: false,
    mobile: false,
    dob: false
  };


  ngOnInit(): void {
    this.fetchUsersProfile();
    this.originalData = { ...this.profileData };
  }

  fetchUsersProfile() {
    this.apiService.getUsersProfile().subscribe(
      (response) => {
        if (response && response.username) {
          // Assuming response structure is similar to what you received in Postman
          this.profileData = response;
        } else {
          console.error('Failed to fetch user profile:', response);
        }
      },
      (error) => {
        console.error('Error fetching user profile:', error);
      }
    );
  }

  editProfile() {
    // Convert date format before editing
    this.profileDataedit.dob = this.formatDateForEdit(this.profileDataedit.dob);

    // Call the API to edit the user profile
    this.apiService.editUserProfile(this.profileDataedit).subscribe(
      (response) => {
        if (response.status === 'success') {
          // Handle success response if needed
          console.log('User profile updated successfully:', response);

          this.openSnackBar('User profile updated successfully', 'custom-snackbar');
          this.fetchUsersProfile();
          // Optionally, display a success message to the user
        } else {
          // Handle error response if needed
          console.error('Failed to update user profile:', response.message);
          this.openSnackBar('Failed to update user profile', 'custom-snackbar');

          // Optionally, display an error message to the user
        }
      },
  
    );

    // Copy the original data


    // Set all fields to true to enable editing for all
    for (const key in this.editMode) {
      if (this.editMode.hasOwnProperty(key)) {
        (this.editMode as { [key: string]: boolean })[key] = true;
      }
    }

    // Set the class for adjusting padding dynamically
    this.editModeClass = this.isMobileFieldEditMode() ? 'no-padding' : '';
  }

  saveChanges() {
    // Send a POST request to the backend with updated user details
    this.apiService.editUserProfile(this.profileData).subscribe(
      (response) => {
        // Handle success response
        console.log('User profile updated successfully:', response);

        this.openSnackBar('User profile updated successfully', 'custom-snackbar');

          this.fetchUsersProfile();

        // Check if the username has been updated
        if (this.profileData.username === this.profileData.username) {
          this.openSnackBar('User profile updated successfully', 'custom-snackbar');

          this.fetchUsersProfile();
          this.resetEditMode();



        } else {
          // Reset edit mode if username is not updated
          this.resetEditMode();

        }

        // Optionally, display a success message to the user
      },
   
    );
  }



  isEditMode(): boolean {
    // Check if any field is in edit mode
    return Object.values(this.editMode).some((value) => value);
  }



  resetData() {
    // Reset profileData to the originalData
    this.profileData = { ...this.originalData };
  }

  resetEditMode() {
    // Set all fields to false to disable editing
    for (const key in this.editMode) {
      if (this.editMode.hasOwnProperty(key)) {
        (this.editMode as { [key: string]: boolean })[key] = false;
      }
    }
  }

  // Function to format the date
  formatDate(date: string): string {
    // Convert 'yyyy-MM-dd' to 'dd/MM/yyyy'
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  }

  formatDateForEdit(date: string): string {
    // Convert 'dd/MM/yyyy' to 'yyyy-MM-dd'
    const parts = date.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return date;
  }

  openSnackBar(message: string, panelClass: string) {

    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }

}
