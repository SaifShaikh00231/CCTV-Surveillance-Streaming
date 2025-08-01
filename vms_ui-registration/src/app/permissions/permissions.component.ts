import { Component } from '@angular/core';
import { ApiResponse, ApiService } from '../api.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';



@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})


export class PermissionsComponent {
  uniquePermissionTitles: string[] = [];
  selectedPermissions: string[] = [];
  roles: any[] = [];
  showAddPerm: boolean = false;
  showEditPerm: boolean = false;
  showDeletePerm: boolean = false;

  selectAllChecked: boolean = false;
  isLocked: boolean = true;
  lockLabel: string = "Unlock";



  selectedRole: string = '';
  rolePermissions: { [key: string]: string[] } = {};
  checkboxStates: { [key: string]: boolean } = {};

  selectedRolePermissions: { [key: string]: string[] } = {};

  formPermissionData: any = {
    permission_name: "",
    permission_title: "",

  };

  permissionTitles: any;
  permission_names: any;
  permissions: any[] = [];

  selectedPermissionTitle: string = '';
  selectedPermission: string = '';
  updatedPermissionTitle: string = '';
  updatedPermission: string = '';
  permission_titles: any;
  uniqueRoles: any;


  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar
  ) {
    this.permissions = [];
    this.selectedRolePermissions = {};
  }
  ngOnInit(): void {
    this.fetchget_the_roles();
    this.fetchPermissions();
    this.uniqueRoles.forEach((role: string | number) => {
      this.rolePermissions[role] = [];
    });
  }

  ngOnChanges() {
    this.updateCheckboxes();
  }
  fetchPermissions() {
    this.apiService.fetchPermission().subscribe(
      (response: any) => {
        // Store the fetched permissions data
        this.permissions = response.permissions;

        // Extract unique permission titles
        const uniqueTitles = this.getUniquePermissionTitles(this.permissions);

        // Store unique permission titles
        this.uniquePermissionTitles = uniqueTitles;
      },
      (error) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }

  getUniquePermissionTitles(permissions: any[]): string[] {
    const uniqueTitles: string[] = [];
    const titleSet = new Set<string>(); // Use a set to ensure uniqueness

    // Iterate through permissions and add unique titles to the set
    permissions.forEach(perm => {
      if (!titleSet.has(perm.permission_title)) {
        uniqueTitles.push(perm.permission_title);
        titleSet.add(perm.permission_title);
      }
    });

    return uniqueTitles;
  }






  toggleLock() {
    this.isLocked = !this.isLocked;
    this.lockLabel = this.isLocked ? "Unlock" : "Lock";
  }

  toggleSelectAll() {
    if (!this.isLocked) {
      // Update the state of all other checkboxes based on the state of the "Select All" checkbox
      const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="cbx"]');
      checkboxes.forEach((checkbox: HTMLInputElement) => {
        checkbox.checked = this.selectAllChecked;
      });
    }
  }

  updateSelectAllChecked() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="cbx"]');
    let allChecked = true;
    checkboxes.forEach((checkbox: HTMLInputElement) => {
      if (!checkbox.checked) {
        allChecked = false;
        return;
      }
    });
    this.selectAllChecked = allChecked;
  }

  fetchPermissionsForRole(role: string) {
    this.apiService.getPermissions(role).subscribe(
      (response: ApiResponse) => {
        console.log('Permissions fetched:', response);
        if (response.status === 'success') {
          this.rolePermissions[role] = response.permissions; // Update rolePermissions for the selected role
          this.updateCheckboxes(); // Update checkboxes based on fetched permissions
        }
      },
      (error) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }



  onRoleChanged(role: string) {
    console.log('Role changed:', role);
    this.selectedRole = role;
    this.fetchPermissionsForRole(role); // Fetch permissions for the selected role
  }
  updateCheckboxes(): void {
    const selectedRolePermissions = this.rolePermissions[this.selectedRole];
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="cbx"]');
    checkboxes.forEach((checkbox: HTMLInputElement) => {
      checkbox.checked = selectedRolePermissions.includes(checkbox.value);
    });
  }





  addPermission(): void {
    this.showAddPerm = true;
  }

  cancelAdd(): void {
    this.showAddPerm = false;
    // Reset form fields if needed

  } onAddSubmit(): void {
    if (!this.formPermissionData.permission_title || !this.formPermissionData.permission_name) {

      this.openSnackBar('Both Permission Title & Permission Name are mandatory to fill', 'custom-snackbar');

      return;
    }

    // Check for duplication of both title and name
    const isDuplicate = this.permissions.some(permission => {
      return permission.permission_title === this.formPermissionData.permission_title &&
        permission.permission_name === this.formPermissionData.permission_name;
    });

    // Check for duplication of either title or name alone
    const isTitleDuplicate = this.permissions.some(permission => {
      return permission.permission_title === this.formPermissionData.permission_title;
    });

    const isNameDuplicate = this.permissions.some(permission => {
      return permission.permission_name === this.formPermissionData.permission_name;
    });

    if (isDuplicate || isTitleDuplicate || isNameDuplicate) {

      this.openSnackBar('Permission with the same Title and/or Name already exists.', 'custom-snackbar');
      return;
    }

    // If not duplicate, proceed to add the permission
    this.apiService.addPermissions(this.formPermissionData).subscribe(
      (response) => {
        console.log('Permission added successfully:', response);

        // Check if the response indicates successful addition
        if (response.status === 'success') {
          // Show an response for successful addition

          this.openSnackBar('Permission added successfully', 'custom-snackbar');
          this.fetchPermissions();
          this.formPermissionData.permission_title = '';
          this.formPermissionData.permission_name = '';

          this.showAddPerm = true;

          // Optionally, you can navigate to a different page or refresh the current page
          // Reload the current route to refresh the page
        } else {
          // Check if the error message indicates duplication
          if (response.message.includes('duplicate key value violates unique constraint')) {


            this.openSnackBar('Permission with the same Title or Name already exists.', 'custom-snackbar');
            this.showAddPerm = true;
          } else {

            this.openSnackBar('Permission with the same Title or Name already exists.' + response.message, 'custom-snackbar');
          }
        }
      },
      (error) => {
        console.error('Error adding Permission:', error);

        this.openSnackBar('Permission adding failed', 'custom-snackbar');
        // Handle the error as needed
      }
    );
    this.cancelAdd();
  }


  startEditing() {
    // Initialize selectedRoles with role data
    this.showEditPerm = true;
    this.showDeletePerm = false;
  } onEditSubmit() {
    // Check if either permission or updatedPermission is provided
    if ((this.selectedPermission || this.selectedPermissionTitle) && (this.updatedPermission || this.updatedPermissionTitle)) {
      // Prepare the data to be sent to the backend
      const data = {
        permission_name: this.selectedPermission,
        edit_permission_name: this.updatedPermission,
        permission_title: this.selectedPermissionTitle,
        edit_permission_title: this.updatedPermissionTitle
      };

      // Send the data to the backend
      this.apiService.editPermission(data).subscribe(
        (response: ApiResponse) => {
          if (response.status === 'success') {

            this.openSnackBar('Permission updated successfully', 'custom-snackbar');
            this.fetchPermissions();
            this.showEditPerm = true;
            // Optionally, you can perform additional actions after successful update
          } else {

            this.openSnackBar('Failed to update permission', 'custom-snackbar');
          }
        },
        (error) => {
          console.error('Error updating permission:', error);
          this.openSnackBar('Failed to update permission', 'custom-snackbar');
        }
      );
    } else {
      this.openSnackBar('Please select a permission and provide a new permission name or title', 'custom-snackbar');

    }
  }




  cancelEdit() {
    this.showEditPerm = false;
  }

  deletePermissions(): void {
    // Add logic to open delete form or confirmation modal
    // You can set a boolean flag to show/hide the delete form in your template
    this.showEditPerm = false;  // Ensure the edit form is hidden
    this.showDeletePerm = true;
  }

  cancelDelete(): void {
    // Add logic to close delete form or confirmation modal
    this.showDeletePerm = false;
  }
  onDeleteSubmit() {
    // Check if both permission title and permission name are not empty
    if (!this.selectedPermissionTitle && !this.selectedPermission) {
      // Show an error message if both are not selected

      this.openSnackBar('Please select either permission title or permission name to delete.', 'custom-snackbar');
      return;
    }

    // Prepare the data to send to the backend
    const data = {
      permission_title: this.selectedPermissionTitle,
      permission_name: this.selectedPermission
    };

    // Send a request to delete the permission
    this.apiService.deletePermission(data).subscribe(
      (response: ApiResponse) => {
        if (response.status === 'success') {
          // Show a success message

          this.openSnackBar('Permission(s) deleted successfully.', 'custom-snackbar');
          // Optionally, you can refresh the permissions list
          this.fetchPermissions();
          // Hide the delete permission form
          this.showDeletePerm = true;
        } else {
          // Show an error message

          this.openSnackBar('Failed to delete permission. Please try again.', 'custom-snackbar');
        }
      },
      (error) => {
        console.error('Error deleting permission:', error);
        // Show an error message

        this.openSnackBar('An error occurred while deleting permission.', 'custom-snackbar');
      }
    );
  }

  isSelected(permissionName: string): boolean {
    return this.selectedPermissions.includes(permissionName);
  }

  toggleCheckbox(permissionName: string): void {
    // Check which role is currently selected
    const selectedRole = this.selectedRole;

    // Check if the permission is already assigned to the role
    const index = this.rolePermissions[selectedRole].indexOf(permissionName);

    // If the permission is not assigned, add it; otherwise, remove it
    if (index === -1) {
      this.rolePermissions[selectedRole].push(permissionName);
    } else {
      this.rolePermissions[selectedRole].splice(index, 1);
    }
  }

  // Method to check if a checkbox should be checked based on the assigned permissions
  isPermissionAssigned(permissionName: string): boolean {
    const selectedRole = this.selectedRole;
    return this.rolePermissions[selectedRole].includes(permissionName);
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
  onSaveClicked() {
    const permissions: { [key: string]: string[] } = {};
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="cbx"]');

    checkboxes.forEach((checkbox: HTMLInputElement) => {
      const permissionName = checkbox.value; // Get the value attribute of the checkbox
      const role_name = this.selectedRole;

      if (permissions[role_name]) {
        if (checkbox.checked) {
          permissions[role_name].push(permissionName);
        }
      } else {
        if (checkbox.checked) {
          permissions[role_name] = [permissionName];
        }
      }
    });

    const data = {
      roles: [
        {
          name: this.selectedRole,
          permissions: permissions[this.selectedRole] || [],
        },
      ],
      permissions,
      isLocked: this.isLocked,
    };

    this.apiService.postStorePermissions(data).subscribe((response) => {

      this.openSnackBar('Successfully saved', 'custom-snackbar');
      // Handle response from the backend
      console.log('Permissions stored successfully', response);
      this.fetchget_the_roles();
    this.fetchPermissions();
    this.selectedRole = "ananoymous";
      this.isLocked = true;

    });
  }
  resetCheckboxes() {
    for (const permission of this.permissions) {
      this.checkboxStates[permission.permission_name] = false;
    }
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
    return this.hasPermission('delete_users') || this.hasPermission('delete_roles') || this.hasPermission('delete_permissions');
  }
  openSnackBar(message: string, panelClass: string) {
    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }

}