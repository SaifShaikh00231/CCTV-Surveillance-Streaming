import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('your-token') || '';
    const sessionEmail = localStorage.getItem('session-email') || '';

    if (token && sessionEmail) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Session-Email': sessionEmail
        }
      });
    }

    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Clear the token and session email if the response status is 401 (Unauthorized)
          if (event.status === 401) {
            localStorage.removeItem('your-token');
            localStorage.removeItem('session-email');
            this.router.navigate(['/login']);
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('your-token');
          localStorage.removeItem('session-email');
          this.router.navigate(['/login']);
        }
        return throwError(error);
      })
    );
  }
}