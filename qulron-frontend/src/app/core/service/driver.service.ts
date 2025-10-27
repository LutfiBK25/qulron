import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  DriverAuthRequest,
  DriverAuthResponse,
} from '../models/interface/driver-auth.interface';
import { catchError, Observable, retry, throwError, timeout } from 'rxjs';
import { UserManagementService } from './user-management.service';
import {
  ConfirmArrivalRequest,
  ConfirmArrivalResponse,
  DriverDashboardData,
} from '../models/interface/driver-dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  private BASE_URL = `${environment.apiUrl}/driver`; // api url

  constructor(
    private http: HttpClient,
    private userManagementService: UserManagementService
  ) {}

  requestVerificationCode(phoneNumber: string): Observable<DriverAuthResponse> {
    const url = `${this.BASE_URL}/auth/request-code`;
    const request: DriverAuthRequest = { phoneNumber };

    return this.http.post<DriverAuthResponse>(url, request).pipe(
      timeout(10000), // 10 second timeout
      retry({ count: 2, delay: 1000 }), // Retry twice with 1s delay
      catchError((error) => {
        let errorMessage = 'Network error, please check your connection';

        if (error.name === 'TimeoutError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid phone number';
        } else if (error.status === 429) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (error.status === 500) {
          errorMessage = 'Server error, please try again later';
        } else if (error.status === 404) {
          errorMessage = 'Service not available. Please try again later.';
        } else if (error.status === 0) {
          errorMessage = 'No internet connection. Please check your network.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  verifyCodeAndLogin(
    phoneNumber: string,
    verificationCode: string
  ): Observable<DriverAuthResponse> {
    const url = `${this.BASE_URL}/auth/verify-code`;
    const request: DriverAuthRequest = { phoneNumber, verificationCode };

    return this.http.post<DriverAuthResponse>(url, request).pipe(
      timeout(10000), // 10 second timeout
      retry({ count: 2, delay: 1000 }), // Retry twice with 1s delay
      catchError((error) => {
        let errorMessage = 'Network error, please check your connection';

        if (error.name === 'TimeoutError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.status === 401) {
          errorMessage = 'Invalid verification code. Please try again.';
        } else if (error.status === 429) {
          errorMessage = 'Too many attempts. Please wait before trying again.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid code format';
        } else if (error.status === 500) {
          errorMessage = 'Server error, please try again later';
        } else if (error.status === 0) {
          errorMessage = 'No internet connection. Please check your network.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getDriverDashboard(): Observable<DriverDashboardData> {
    const url = `${this.BASE_URL}/data/dashboard`;
    const token = this.userManagementService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Getting Driver Dashboard Data Faild: ', error);
        return throwError(
          () =>
            new Error('Getting Driver Dashboard Data Faild. Please try again.')
        );
      })
    );
  }

  confirmDriverArrival(
    isLocationTracking: boolean,
    driverLat: number,
    driverLng: number
  ): Observable<ConfirmArrivalResponse> {
    console.log('confirmDriverArrival');
    const url = `${this.BASE_URL}/arrival`;
    const request: ConfirmArrivalRequest = {
      isLocationTracking,
      driverLat,
      driverLng,
    };
    const token = this.userManagementService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(url, request, { headers }).pipe(
      catchError((error) => {
        console.error('Getting Driver Dashboard Data Faild: ', error);
        return throwError(
          () =>
            new Error('Getting Driver Dashboard Data Faild. Please try again.')
        );
      })
    );
  }
}
