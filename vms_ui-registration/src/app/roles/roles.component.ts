import { Component, OnInit } from '@angular/core';
import { ApiService, ApiResponse } from '../api.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-users-list',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  showAddForm: boolean = false;


  roles: any[] = [];
  showEditForm: boolean = false;
  selectedRoles: any[] = [];
  newRoleName: string = '';
  addRoleform: any = {

    role_name: '',
    is_deleted: false,

  };
  searchText: string = '';
  searchResults: string[] = [];
  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.fetchRolesList();
  }

  fetchRolesList() {
    this.apiService.getRolesList().subscribe(
      (response) => {
        if (response.status === 'success') {
          this.roles = response.roles_list || [];
          console.log('Received data from API:',response.roles_list);
        } else {
          console.error('Failed to fetch roles list:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching roles list:', error);
      }
    );
  }

  startEditing(role: any) {
    // Initialize selectedRoles with role data
    this.selectedRoles = [role.role_name,role.is_deleted];
    this.showEditForm = true;
    this.newRoleName = role.role_name;
  }

  onEditSubmit() {
    this.apiService.updateRoles({
      old_role_name: this.selectedRoles[0],
      new_role_name: this.newRoleName,
      is_deleted: this.selectedRoles[2],
    }).subscribe(
      (response) => {
        if (response.status === 'success') {
          console.log('Role updated successfully');
          this.showEditForm = false;
          this.fetchRolesList(); // Refresh the role list after update
        } else {
          console.error('Failed to update role:', response.message);
        }
      },
      (error) => {
        console.error('Error updating role:', error);
      }
    );
  }


  cancelEdit() {
    this.showEditForm = false;
  }

  deleteRoles(role: any) {
    const role_name = role.role_name;
    this.apiService.deleteRoles(role_name).subscribe(
      (response) => {
        if (response.status === 'success') {
          console.log('Role deleted successfully');
          this.fetchRolesList(); // Refresh the role list after delete
        } else {
          console.error('Failed to delete role:', response.message);
        }
      },
      (error) => {
        console.error('Error deleting role:', error);
      }
    );
  }

  addRole(): void {
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
    // Reset form fields if needed
    this.newRoleName = '';
  }

  onAddSubmit(): void {

    this.apiService.addRoles(this.addRoleform).subscribe(
      (response) => {
        console.log('Role added successfully:', response);

        // Show an alert for successful addition
        this.openSnackBar('Role added successfully', 'custom-snackbar');

        // Optionally, you can navigate to a different page or refresh the current page
        // Reload the current route to refresh the page
        window.location.reload();
        this.cancelAdd();
      },
      (error) => {
        console.error('Error adding roles:', error);
        this.openSnackBar('Error - role might already exist', 'custom-snackbar');
        // Handle the error as needed
      }

    );

    const isTitleCased = this.addRoleform.role_name === this.toTitleCase(this.addRoleform.role_name);


  }


  toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  search() {
    if (this.searchText.trim() === '') {
      this.removeHighlight();
      return;
    }

    const textToSearch = this.searchText.toLowerCase();
    const textElements = document.querySelectorAll('.role-list table td:not(.button-cell)');

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
    const textElements = document.querySelectorAll('.role-list table td:not(.button-cell)');
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
