// forgot-password.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  private apiUrl = 'http://127.0.0.1:8000';  // Update with your Flask API URL

  constructor(private http: HttpClient) {}

  sendResetLink(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgotpassword/`, { email });
  }

  resetPassword(userId: number, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resetpassword/${userId}`, { new_password: newPassword });
  }
}
