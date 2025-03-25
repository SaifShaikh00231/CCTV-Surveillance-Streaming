import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, ApiResponse } from '../api.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
interface CardData1 {
  cpu_percent: number;
  ram_percent: number;
 

}



@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  styles: [`
    .custom-snackbar {
      background-color: #4caf50; /* Green background color */
      color: #fff; /* White text color */
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isSidebarClosed = true;
  batteryStatus: any;
  battery_percent: any;
  batteryStatusSubscription: Subscription | undefined;
  cardData1: CardData1 = { 
    cpu_percent: 0,  
   
    ram_percent: 0,
  
  };
  statsSubscription: Subscription | undefined;
  profileData: any = {
    first_name: '',
    last_name: '',
    username: '',
    mobile: '',
    dob: '',
    role_name: '',

  };
  currentDate: string = '';

  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.fetchBatteryStatus(); // Fetch initially
    this.fetchstats(); // Fetch initially
    this.fetchUsersProfile();

     // Set initial current date
     this.updateCurrentDate();

     // Update current date every second
     setInterval(() => {
       this.updateCurrentDate();
     }, 1000);
    // Fetch battery status every minute
    this.batteryStatusSubscription = interval(10000).pipe(
      switchMap(() => this.apiService.batterystatus())
    ).subscribe(
      (response) => {
        this.batteryStatus = response;
        console.log('Battery status response:', response);
      },
      (error) => {
        console.error('Error fetching battery status:', error);
      }
    );
    this.statsSubscription = interval(5000).pipe(
      switchMap(() => this.apiService.getsystemresources())
    ).subscribe(
      (statsdata: ApiResponse) => {
        console.log('Received data from API:', statsdata);
        this.processReportData1(statsdata);
      },
      (error: any) => {
        console.error('Error fetching system resources:', error);
      }
    );

  }


  updateCurrentDate() {
    this.currentDate = new Date().toLocaleString();
  }


  ngOnDestroy(): void {
    if (this.batteryStatusSubscription) {
      this.batteryStatusSubscription.unsubscribe();
    }
 
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

  fetchstats(): void {
    if (this.hasAdminPermissions()) {
        this.apiService.getsystemresources().subscribe(
            (statsdata: ApiResponse) => {
                console.log('Received data from API:', statsdata);
                this.processReportData1(statsdata);
            },
            (error: any) => {
                console.error('Error fetching admin report data:', error);
            }
        );
    } else {
        this.apiService.getsystemresources().subscribe(
            (statsdata: ApiResponse) => {
                console.log('Received data from API:', statsdata);
                this.processReportData1(statsdata);
            },
            (error: any) => {
                console.error('Error fetching non-admin report data:', error);
            }
        );
    }
}

processReportData1(statsdata: ApiResponse): void {
  console.log(statsdata);
  // Process data based on permissions
  if (this.hasAdminPermissions()) {
    this.cardData1 = {
      cpu_percent: statsdata.cpu_percent,
    
      ram_percent: statsdata.ram_percent,
     
    
    };
  } else {
    this.cardData1 = {
      cpu_percent: statsdata.cpu_percent,
     
      ram_percent: statsdata.ram_percent,
     
      
    };
  }
}

  fetchBatteryStatus() {
    this.apiService.batterystatus().subscribe(
      (response) => {
        this.batteryStatus = response;
        console.log('Battery status response:', response);
      },
      (error) => {
        console.error('Error fetching battery status:', error);
      }
    );
  }

  getBatteryIconClass(batteryPercent: number) {
    if (batteryPercent >= 90) {
      return 'fa fa-battery-full';
    } else if (batteryPercent >= 60) {
      return 'fa fa-battery-three-quarters';
    } else if (batteryPercent >= 40) {
      return 'fa fa-battery-half';
    } else if (batteryPercent >= 20) {
      return 'fa fa-battery-quarter';
    } else {
      return 'fa fa-battery-empty';
    }
  }

  
  logout() {
    console.log('Logging out...');

    this.apiService.logout().subscribe(
      (response) => {
        console.log(response);
        this.openSnackBar('Successfully logged out', 'custom-snackbar');
        localStorage.clear();
        sessionStorage.clear();
        localStorage.removeItem('isLoggedIn');

        this.router.navigate(['/'], { replaceUrl: true });
      },
      (error) => {
        console.error('Error logging out:', error);
        this.openSnackBar('You are not Logged in', 'custom-snackbar');
      }
    );
  }

  openSnackBar(message: string, panelClass: string) {
    const config = new MatSnackBarConfig();
    config.duration = 3000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
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
    return this.hasPermission('view_users') || this.hasPermission('view_roles') || this.hasPermission('view_permissions');
  }

  isLoginPage(): boolean {
    return this.router.url === '/' || this.router.url === '/reset-password';
  }
  toggleSidebar(): void {
    this.isSidebarClosed = !this.isSidebarClosed;
  }
}
