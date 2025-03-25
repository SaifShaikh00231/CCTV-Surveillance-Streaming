import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';  // Import FormsModule
import { AuthInterceptor } from './auth.interceptor';
import { LiveViewComponent } from './live-view/live-view.component';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';


import { AppComponent } from './app.component';
import { HomeComponent } from './registration/home.component';
import { ResetPasswordComponent } from './registration/resetpassword.component';  // Ensure ResetPasswordComponent is declared here
import { CameraComponent } from './camera/camera.component';
import { DatePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';  // Import DatePipe
import { MatIconModule } from '@angular/material/icon';
import { NavbarComponentModule } from './navbar/navbar.component.module';
import { UsersListComponent } from './users-list/users-list.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { PlaybackComponent } from './playback/playback.component';
import { ReportsComponent } from './reports/reports.component';
import { ProfileComponent } from './profile/profile.component';
import {AddUsersComponent} from './add-users/add-users.component';
import { SettingsComponent } from './settings/settings.component';
import { TabsComponent } from './tabs/tabs.component';



@NgModule({
  declarations: [AppComponent, HomeComponent, ResetPasswordComponent, CameraComponent, LiveViewComponent,
    UsersListComponent, RolesComponent, PermissionsComponent, PlaybackComponent, ReportsComponent, ProfileComponent,AddUsersComponent, SettingsComponent,TabsComponent],  // Include ResetPasswordComponent
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, BrowserAnimationsModule, MatIconModule, MatSelectModule,
    MatOptionModule, MatMenuModule,
    MatButtonModule, NavbarComponentModule,
  ],  // Include FormsModule
  providers: [DatePipe, { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],  // Corrected providers array
  bootstrap: [AppComponent],
})
export class AppModule { }