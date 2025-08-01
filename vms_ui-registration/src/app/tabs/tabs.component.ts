import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css'
})
export class TabsComponent {
  statusOptions: any;
  selectedStatus: any;
  ticketStatus: string | undefined; // Variable to hold the ticket status
  searchInput: string = ''; // Variable to hold the user-entered ticket ID
  isLoggedIn: boolean = localStorage.getItem('isLoggedIn') === 'true';
  isMobile: boolean | undefined;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 700;
  }
  
  constructor(private apiService: ApiService, private snackBar: MatSnackBar, private router: Router) { } // Inject ApiService

  
 ngOnInit(): void {
  this.isMobile = window.innerWidth <= 700;
 }
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
  setIsMobile(value: boolean) {
    this.isMobile = value;
  }
  
  

  openSnackBar(message: string, panelClass: string) {
    const config = new MatSnackBarConfig();
    config.duration = 3000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
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
  isLoginPage(): boolean {
    return this.router.url === 'login';
  }
  
}