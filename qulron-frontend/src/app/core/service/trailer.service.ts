import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { UserManagementService } from './user-management.service';

@Injectable({
  providedIn: 'root',
})
export class TrailerService {
  private BASE_URL = `${environment.apiUrl}/trailer`;

  constructor(
    private http: HttpClient,
    private userManagementService: UserManagementService
  ) {}

  createOrderTrailer(trailerNumber: string): Observable<any> {
    const url = `${this.BASE_URL}/new`;
    const token = this.userManagementService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(url, trailerNumber, { headers }).pipe(
      catchError((error) => {
        console.error('Trailer creation failed: ', error);
        return throwError(
          () => new Error('Trailer creation failed. Please try again.')
        );
      })
    );
  }
}
