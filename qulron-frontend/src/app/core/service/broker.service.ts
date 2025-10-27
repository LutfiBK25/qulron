import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import {
  OrderSubmissionRequest,
  OrderSubmissionResponse,
} from '../models/interface/order-submission.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BrokerService {
  private BASE_URL = `${environment.apiUrl}/broker`; // api url

  constructor(private http: HttpClient) {}

  // Order Submission Service
  submitOrder(
    orderData: OrderSubmissionRequest
  ): Observable<OrderSubmissionResponse> {
    const url = `${this.BASE_URL}/order_submission`;

    return this.http.post<OrderSubmissionResponse>(url, orderData).pipe(
      catchError((error) => {
        // Handle different error types
        if (error.status === 400) {
          return throwError(
            () => new Error(error.error?.message || 'Validation error')
          );
        } else if (error.status === 500) {
          return throwError(
            () => new Error('Server error, please try again later')
          );
        } else if (error.status === 429) {
          return throwError(
            () => new Error('Too many submissions, please try again later.')
          );
        } else {
          return throwError(
            () => new Error('Network error, please check your connection')
          );
        }
      })
    );
  }
}
