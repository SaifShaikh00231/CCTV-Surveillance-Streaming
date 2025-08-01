import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './registration/home.component';
import { ResetPasswordComponent } from './registration/resetpassword.component';
import { CameraComponent } from './camera/camera.component';
import { CameraAddComponent } from './camera-add/camera-add.component';
import { LiveViewComponent } from './live-view/live-view.component';
import { NavbarComponent } from './navbar/navbar.component';
import { UsersListComponent } from './users-list/users-list.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { PlaybackComponent } from './playback/playback.component';
import { ReportsComponent } from './reports/reports.component';
import { ProfileComponent } from './profile/profile.component';
import { PreventAccessGuard } from './prevent-access.guard'; // Import the guard service
import { AddUsersComponent } from './add-users/add-users.component';
import { SettingsComponent } from './settings/settings.component';
import { TabsComponent } from './tabs/tabs.component';
import { DemoComponent } from './demo/demo.component';





const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'reset-password', component: ResetPasswordComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'camera', component: CameraComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'camera-add', component: CameraAddComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'live-view', component: LiveViewComponent, canActivate: [PreventAccessGuard] }, // Example route protected by the guard
  { path: 'navbar', component: NavbarComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'users-list', component: UsersListComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'roles', component: RolesComponent }, 
  { path: 'permissions', component: PermissionsComponent }, 
  { path: 'playback', component: PlaybackComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'reports', component: ReportsComponent , canActivate: [PreventAccessGuard] }, 
  { path: 'profile', component: ProfileComponent, canActivate: [PreventAccessGuard] }, 
  { path: 'add-users', component: AddUsersComponent, canActivate: [PreventAccessGuard] }, 
  { path: 'settings', component: SettingsComponent},
  { path: 'tabs', component: TabsComponent},
  { path: 'demo', component: DemoComponent},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
