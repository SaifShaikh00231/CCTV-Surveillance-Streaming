import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PreventAccessGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Check if the user is authenticated by looking into local storage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
      // If the user is not logged in, navigate to the login page
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
