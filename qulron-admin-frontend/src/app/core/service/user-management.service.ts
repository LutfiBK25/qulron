import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  interval,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  throwError,
} from 'rxjs';
import { jwtDecode } from 'jwt-decode';

// makes the service available through the whole application
@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private BASE_URL = 'http://localhost:30061/api/user_management'; // api url
  private HEALTH_CHECK_URL = 'http://localhost:30061/api/health'; // ✅ Ensure this exists in your backend!
  private apiHealthCheck$ = new Subject<void>(); // Subject to manage unsubscription

  private authStatus = new BehaviorSubject<boolean>(this.isAuthenticated()); // Track auth status
  authStatus$ = this.authStatus.asObservable(); // Observable to subscribe to auth status updates

  private passwordResetStatus = new BehaviorSubject<boolean>(
    this.isPasswordResetRequired()
  );
  passwordResetStatus$ = this.passwordResetStatus.asObservable();

  // inject HTTP client to make HTTP requests
  constructor(private http: HttpClient) {}

  // Start checking API health
  checkApiHealth() {
    interval(10000) // Check every 10 seconds
      .pipe(
        takeUntil(this.apiHealthCheck$), // Unsubscribe when the component is destroyed or user logs out
        switchMap(() => {
          return this.http
            .get(this.HEALTH_CHECK_URL, { withCredentials: true })
            .pipe(
              catchError((error) => {
                console.warn('API is down. Logging out...');
                this.logout(); // Auto logout
                return EMPTY; // Prevents continuing the observable
              })
            );
        })
      )
      .subscribe();
  }

  login(username: string, password: string): Observable<any> {
    const url = `${this.BASE_URL}/auth/login`; //conroller mapping

    //calling the api, email and password are the request body
    return this.http.post<any>(url, { username, password }).pipe(
      catchError((error) => {
        console.error('Login Faild: ', error);
        return throwError(
          () => new Error('Login request faild. please try again.')
        );
      })
    );
  }

  register(userData: any): Observable<any> {
    const url = `${this.BASE_URL}/admin/new_user`;
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(url, userData, { headers }).pipe(
      catchError((error) => {
        console.error('User Creation Faild: ', error);
        return throwError(
          () => new Error('Create User Request Faild, Please try again')
        );
      })
    );
  }

  myProfile(token: string): Observable<any> {
    const url = `${this.BASE_URL}/user/me`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Profile Retrival Faild: ', error);
        return throwError(
          () => new Error('My Profile Request Faild, Please try again')
        );
      })
    );
  }

  updateProfile(userData: any): Observable<any> {
    const url = `${this.BASE_URL}/user/profile/update`;
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(url, userData, { headers }).pipe(
      catchError((error) => {
        console.error('Profile update failed: ', error);
        return throwError(
          () => new Error('Profile update failed. Please try again.')
        );
      })
    );
  }

  getUser(username: string): Observable<any> {
    const url = `${this.BASE_URL}/admin/user/${username}`;
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Getting User Faild: ', error);
        return throwError(
          () => new Error('Get User Request Faild, Please try again')
        );
      })
    );
  }

  updateUser(username: string, userData: any): Observable<any> {
    const url = `${this.BASE_URL}/admin/user/update/${username}`;
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(url, userData, { headers }).pipe(
      catchError((error) => {
        console.error('User update failed: ', error);
        return throwError(
          () => new Error('User update failed. Please try again.')
        );
      })
    );
  }

  getAllUsers(token: string): Observable<any> {
    const url = `${this.BASE_URL}/admin/all_users`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('User List Faild: ', error);
        return throwError(
          () => new Error('User List Request Faild, Please try again')
        );
      })
    );
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<any> {
    const url = `${this.BASE_URL}/user/updatepassword`;
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = {
      oldPassword,
      newPassword,
    };

    return this.http.put<any>(url, body, { headers }).pipe(
      catchError((error) => {
        console.error('Password update failed:', error);
        return throwError(
          () => new Error('Password update failed. Please try again.')
        );
      })
    );
  }

  deleteUser(username: string, token: string): Observable<any> {
    const url = `${this.BASE_URL}/admin/delete/${username}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('User Deletion Faild: ', error);
        return throwError(
          () => new Error('User Deletion Request Faild, Please try again')
        );
      })
    );
  }

  resetUserPassword(username: string, token: string): Observable<any> {
    console.log(token);
    const url = `${this.BASE_URL}/admin/passwordreset/${username}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    console.log(url);
    console.log(headers);
    return this.http.put<any>(url, {}, { headers }).pipe(
      catchError((error) => {
        console.error('User password reset Faild: ', error);
        return throwError(
          () => new Error('User Password Request Reset Faild, Please try again')
        );
      })
    );
  }

  /*** Authentication Methods ***/

  /*** 🔹 Secure Token Handling ***/
  setToken(token: string): void {
    sessionStorage.setItem('token', token); // Use sessionStorage
    this.authStatus.next(true); // Update auth status to logged in
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /*** 🔹 Logout ***/
  logout(): void {
    sessionStorage.clear(); // Clear all session data
    this.authStatus.next(false); // Update auth status to logged out
  }

  /*** 🔹 Authentication & Role Checking ***/
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

  isPasswordResetRequired(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      return !!decoded.mustResetPassword;
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

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.role; // Assumes token contains a 'role' field
    } catch (error) {
      return null;
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  ngOnDestroy() {
    this.stopApiHealthCheck(); // Stop the health check when the component is destroyed
  }

  // Stop checking API health (when user logs out or on component destroy)
  stopApiHealthCheck() {
    this.apiHealthCheck$.next(); // Emit to stop the health check
  }
}
