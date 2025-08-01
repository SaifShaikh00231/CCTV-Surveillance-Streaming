import { Component, OnInit } from '@angular/core';
import { ApiService, ApiResponse } from '../api.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'] // Use styleUrls instead of styleUrl
})
export class UsersListComponent {


  users: any[] = [];
  showEditForm: boolean = false;
  selectedUsers: any[] = [];
  // Dropdown options

  isActiveOptions = ['Activate', 'Deactivate'];
  role_name: string[][] | undefined;
  roles: any;
  searchText: string = '';
  searchResults: string[] = [];


  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.fetchUsersList();
    this.fetchget_the_roles(); // Fetch roles when component initializes
  }


  fetchget_the_roles() {
    this.apiService.getRoles().subscribe(
      (response: any) => {
        this.roles = response.camera_options.roles;

      },
      (error) => {
        console.error('Error fetching camera options:', error);
      }
    );
  }
  fetchUsersList() {
    this.apiService.getUsersList().subscribe(
      (response) => {
        if (response.status === 'success') {
          this.users = response.users_list || [];
        } else {
          console.error('Failed to fetch users list:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching users list:', error);
      }
    );
  }



  startEditing(user: any) {
    // Initialize selectedUsers with user data
    this.selectedUsers = [user.role_name, user.is_active, user.username];
    this.showEditForm = true;
  }

  onEditSubmit() {
    const username = this.selectedUsers[2]; // Assuming username is the identifier for the user
    const role_name = this.selectedUsers[0];
    const is_active = this.selectedUsers[1];

    this.apiService.updateUsers({
      username: username,
      role_name: role_name,
      is_active: is_active
    }).subscribe(
      (response) => {
        if (response.status === 'success') {
          console.log('User updated successfully');
          this.openSnackBar('User updated successfully', 'custom-snackbar');
          this.showEditForm = false;
          this.fetchUsersList(); // Refresh the user list after update
        } else {
          console.error('Failed to update user:', response.message);
          this.openSnackBar('Failed to update user:', 'custom-snackbar');
        }
      },
      (error) => {
        console.error('Error updating user:', error);
      }
    );
  }


  cancelEdit() {
    this.showEditForm = false;
  }
  search() {
    if (this.searchText.trim() === '') {
      this.removeHighlight();
      return;
    }

    const textToSearch = this.searchText.toLowerCase();
    const textElements = document.querySelectorAll('.user-list table td:not(.button-cell)');

    textElements.forEach(element => {
      const text = element.textContent?.toLowerCase() || '';
      const highlightedText = this.highlightText(text, textToSearch);
      element.innerHTML = highlightedText;
    });
  }


  highlightText(text: string, search: string): string {
    const regex = new RegExp('(' + search + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  removeHighlight() {
    const textElements = document.querySelectorAll('.user-list table td:not(.button-cell)');
    textElements.forEach(element => {
      element.innerHTML = element.textContent || '';
    });
  }
  openSnackBar(message: string, panelClass: string) {

    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }
}