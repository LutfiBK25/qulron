import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { UserRole } from '../enums/user-role.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  // Auth status observables
  private authStatus = new BehaviorSubject<boolean>(this.isAuthenticated());
  private userRole = new BehaviorSubject<UserRole | null>(
    this.getUserRole() as UserRole | null
  );

  // Public observables
  authStatus$ = this.authStatus.asObservable();
  userRole$ = this.userRole.asObservable();
  isLoggedIn$ = this.authStatus.asObservable(); // Alias for compatibility

  private BASE_URL = `${environment.apiUrl}/driver`;

  constructor(private http: HttpClient) {}

  /*** Authentication Methods ***/
  setToken(token: string): void {
    sessionStorage.setItem('token', token);
    this.authStatus.next(true);
    this.userRole.next(this.getUserRole());
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // Login method (from AuthService)
  login(role: UserRole): void {
    this.authStatus.next(true);
    this.userRole.next(role);
  }

  // Logout method (from AuthService)
  logout(): Observable<any> {
    const url = `${this.BASE_URL}/logout`;
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<any>(url, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Logout Failed: ', error);
        return throwError(
          () => new Error('Somthing Went Wrong Logining Out, Forced Logout.')
        );
      })
    );
  }

  clearSession(): void {
    sessionStorage.clear();
    this.authStatus.next(false);
    this.userRole.next(null);
  }

  /*** Authentication & Role Checking ***/
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 > Date.now(); // Check token expiration
    } catch (error) {
      return false;
    }
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub; // 'sub' is the standard claim name for subject (username)
    } catch (error) {
      return null;
    }
  }

  getUserRole(): UserRole | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      // Ensure the role matches the enum
      if (Object.values(UserRole).includes(decoded.role)) {
        return decoded.role as UserRole;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  // Helper method to check if user is logged in
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}
