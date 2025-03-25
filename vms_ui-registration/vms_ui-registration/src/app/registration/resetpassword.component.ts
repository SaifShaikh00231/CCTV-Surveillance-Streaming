import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '@app/api.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.css']
})
export class ResetPasswordComponent implements OnInit {
  passwordChanged = false;
  new_password: string = '';  // Variable to bind to the input field
  token: string | null = null;  // Variable to store the token

  constructor(private apiService: ApiService, private router: Router, private route: ActivatedRoute, private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Subscribe to query parameter changes
    this.route.queryParamMap.subscribe(queryParams => {
      this.token = queryParams.get('token');
      if (!this.token) {
        console.error("Token is null. Unable to reset the password.");
      }
    });
  }

  confirm_new_password: string = '';  // Add this line to bind to the confirm password input

  // Method to handle form submission
  submitForm(): void {
    console.log('Entering submitForm()');

    if (this.token) {
      const newPassword = this.new_password;
      const confirmNewPassword = this.confirm_new_password;  // Corrected variable name

      console.log('New Password:', newPassword);
      console.log('Confirm Password:', confirmNewPassword);

      // Check if the passwords match
      if (newPassword !== confirmNewPassword) {
        console.error('Password and confirm password do not match.');

        this.openSnackBar('Password and confirm password do not match.', 'custom-snackbar');
        console.log('Exiting submitForm() due to password mismatch');
        return; // Stop further execution
      }

      // Continue with the API call only when passwords match
      console.log('Passwords match. Proceeding with API call.');
      this.apiService.resetPassword(this.token, newPassword)
        .subscribe(
          response => {
            console.log(response);

            this.openSnackBar('Password and confirm password do not match.', 'custom-snackbar');


            localStorage.clear();
            sessionStorage.clear();
            this.router.navigate(['/']); // Use router navigation instead of window.location.href
          },
          error => {
            console.error(error);

            this.openSnackBar('Failed to reset the password. Please try again.', 'custom-snackbar');
          }
        );
    } else {
      console.error("Token is null. Unable to reset the password.");
    }

    console.log('Exiting submitForm()');
  }
  openSnackBar(message: string, panelClass: string) {

    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }
}
