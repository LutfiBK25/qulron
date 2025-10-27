import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserManagementService } from './user-management.service';
import { catchError, Observable, throwError } from 'rxjs';
import { RoutingRequest } from '../models/interface/routing.interface';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  private BASE_URL = `${environment.apiUrl}/routing`;

  constructor(
    private http: HttpClient,
    private userManagementService: UserManagementService
  ) {}

  calculateRoute(request: RoutingRequest): Observable<any> {
    const url = `${this.BASE_URL}/calculate-route`;
    const token = this.userManagementService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(url, request, { headers }).pipe(
      catchError((error) => {
        console.error('Calculating Route Faild: ', error);
        return throwError(
          () => new Error('Calculating Route Faild. Please try again.')
        );
      })
    );
  }
}
