// app.route.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './registration/home.component';
import { ResetPasswordComponent } from './registration/resetpassword.component'; // Adjust the import path as needed
import { TabsComponent } from './tabs/tabs.component';



export const routes: Routes = [
  { path: '', component: HomeComponent },  // Set HomeComponent as the default route
  { path: 'reset-password', component: ResetPasswordComponent },  // Add a route for ResetPasswordComponent
  // Add other routes here
];
