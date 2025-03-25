import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '@app/api.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    // Add a variable to track the password visibility
    showPassword: boolean = false;
    showConfirmPassword: boolean = false;
    signUpClicked: boolean = false; // Track if the Sign Up button is clicked
  
    /**
     * togglePasswordVisibility is a function that is used to toggle the visibility of the password input field.
     */
    togglePasswordVisibility() {
      this.showPassword =!this.showPassword;
    }
  
    /**
     * toggleConfirmPasswordVisibility is a function that is used to toggle the visibility of the confirm password input field.
     */
    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword =!this.showConfirmPassword;
    }
  
    /**
     * signupForm is an object that contains the user's sign up information, including their first name, last name, email, mobile number, password, and confirm password.
     */
    signupForm: any = {
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      password: '',
      confirm_password: '',
      dob: ''
    };
  
    /**
     * forgotPasswordForm is an object that contains the user's email address for resetting their password.
     */
    forgotPasswordForm: any = {
      email: ''
    };
  
    /**
     * loginForm is an object that contains the user's login information, including their email or username and password.
     */
    loginForm: any = {};
    showForgotPassword: boolean = false;
    linkSent: boolean = false;
    showAppHome: boolean = true;
  
    constructor(
      private router: Router,
      private route: ActivatedRoute,
      private apiService: ApiService,
      private datePipe: DatePipe,
      private snackBar: MatSnackBar
    ) {}
  
    ngOnInit() {
      // Subscribe to route changes
      this.route.url.subscribe(urlSegments => {
        // Check if the route is '/' (root) or 'reset-password'
        this.showAppHome = urlSegments.length === 0 || urlSegments[0].path === 'reset-password';
      });
  
      // If you want to handle NavigationEnd event
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          // Check if the route is '/' (root) or 'reset-password'
          this.showAppHome = this.router.url === '/' || this.router.url === '/reset-password';
        }
      });
    }
  
    /**
     * register is a function that is used to register a new user with the application. It makes a call to the API to register the user, and displays a message based on the response.
     */
    register() {
      const userData = {
        first_name: this.signupForm.first_name,
        last_name: this.signupForm.last_name,
        email: this.signupForm.email,
        mobile: this.signupForm.mobile,
        password: this.signupForm.password,
        confirm_password: this.signupForm.confirm_password,
        dob: this.datePipe.transform(this.signupForm.dob, 'yyyy/MM/dd')
      };
  
      this.signUpClicked = true; // Set signUpClicked to true when the Sign Up button is clicked
  
      this.apiService.register(userData).subscribe(
        (response) => {
          console.log('Registration API response:', response);
  
          if (response.status === 'success') {
  
            this.openSnackBar('Registration successful!', 'custom-snackbar');
            window.location.reload();
          } else {
  
            this.openSnackBar(`Registration failed: ${response.message}`, 'custom-snackbar');
  
          }
        },
        (error) => {
  
          this.openSnackBar('An error occurred during registration. Please try again.', 'custom-snackbar');
          console.error('Registration error:', error);
        }
      );
    }
  
    /**
     * isInvalidInput is a function that is used to determine if an input field is invalid and if the Sign Up button was clicked. It returns true if the field is invalid and the button was clicked, false otherwise.
     * @param fieldName the name of the field to check
     */
    isInvalidInput(fieldName: string): boolean {
      // Check if the field is touched, invalid, and the Sign Up button is clicked
      return this.signupForm[fieldName].touched && this.signupForm[fieldName].invalid && this.signUpClicked;
    }
  
    /**
     * login is a function that is used to log in a user to the application. It makes a call to the API to log in the user, and displays a message based on the response.
     * @param event the event that triggered the function call
     */
    login(event: Event) {
      event.preventDefault();
  
      const loginData = {
        identifier: this.loginForm.identifier,
        password: this.loginForm.password
      };
  
      this.apiService.login(loginData).subscribe(
        response => {
          console.log('Login API response:', response);
  
          if (response.status === 'success') {
            localStorage.setItem('isLoggedIn', 'true');
  
            this.openSnackBar('Login successful!', 'custom-snackbar');
            this.router.navigate(['/reports'])
          } else {
  
            this.openSnackBar(`Login failed: ${response.message}`, 'custom-snackbar');
            
          }
        },
        error => {
  
          this.openSnackBar('An error occurred during login. Please try again.', 'custom-snackbar');
          console.error('Login error:', error);
        }
      );
    }
  
    /**
     * sendResetLink is a function that is used to send a reset link to the user's email address. It makes a call to the API to send the reset link, and displays a message based on the response.
  
    /**
     * isValidEmail is a function that is used to determine if an email address is valid. It uses a regular expression to validate the email address, and returns true if it is valid, false otherwise.
     * @param email the email address to validate
     */
    isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    /**
     * goBackToLogin is a function that is used to go back to the login page. It sets the visibility of the forgot password form to false and scrolls to the top of the page.
     */
    goBackToLogin() {
      this.showForgotPassword = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    /**
     * toggleForgotPassword is a function that is used to toggle the visibility of the forgot password form.
     */
    toggleForgotPassword() {
      this.showForgotPassword = true;
    }
  
    /**
     * hideForgotPassword is a function that is used to hide the forgot password form.
     */
    hideForgotPassword() {
      this.showForgotPassword = false;
    }
  
    /**
     * openSnackBar is a function that is used to display a snack bar message.
     * @param message the message to display
     * @param panelClass the CSS class of the snack bar panel
     */
    openSnackBar(message: string, panelClass: string) {
  
      const config = new MatSnackBarConfig();
      config.duration = 2000;
      config.panelClass = [panelClass];
      this.snackBar.open(message, 'Close', config);
    }
  }