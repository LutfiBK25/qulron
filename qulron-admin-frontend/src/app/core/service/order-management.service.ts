import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderManagementService {
  private BASE_URL = 'http://localhost:30061/api/order_management'; // api url
  constructor(private http: HttpClient) {}

  getUnBookedOrders(token: string): Observable<any> {
    const url = `${this.BASE_URL}/unbooked_orders`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('UnBooked Orders List Faild: ', error);
        return throwError(
          () =>
            new Error('UnBooked Orders List Request Faild, Please try again')
        );
      })
    );
  }

  getCurrentOrders(token: string): Observable<any> {
    const url = `${this.BASE_URL}/booked_orders`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Orders List Faild: ', error);
        return throwError(
          () => new Error('Orders List Request Faild, Please try again')
        );
      })
    );
  }

  // In your order service
  cancelOrder(orderId: number, token: string): Observable<any> {
    const url = `${this.BASE_URL}/cancel/${orderId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(url, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Order cancellation failed:', error);
        return throwError(
          () => new Error('Order cancellation failed. Please try again.')
        );
      })
    );
  }

  getActiveOrdersForMap(token: string): Observable<any> {
    const url = `${this.BASE_URL}/active-loads`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Orders List Faild: ', error);
        return throwError(
          () => new Error('Orders List Request Faild, Please try again')
        );
      })
    );
  }
}
