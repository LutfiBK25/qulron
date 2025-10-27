import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  of,
  Observable,
  throwError,
  timeout,
  retry,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DriverLocation,
  LocationUpdate,
} from '../models/interface/facility.interface';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private locationSubject = new BehaviorSubject<DriverLocation | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private isTrackingSubject = new BehaviorSubject<boolean>(false);
  private watchId: number | null = null;
  private lastLocation: DriverLocation | null = null;
  private locationHistory: DriverLocation[] = [];
  private phoneNumber: string = '';
  private lastSentLocation: DriverLocation | null = null; // Track last location sent to backend
  private updateInterval: any = null;

  public location$ = this.locationSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public isTracking$ = this.isTrackingSubject.asObservable();

  // Add this property to track logout state
  private isLoggingOut = false;

  constructor(private http: HttpClient) {}

  async startTracking(phoneNumber: string): Promise<boolean> {
    try {
      // Check permissions first
      // Only start tracking if user has granted permission
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        this.errorSubject.next('Location permission denied');
        return false;
      }

      this.isTrackingSubject.next(true);
      this.errorSubject.next(null);

      // Start GPS tracking
      this.startGPSTracking();

      // Start periodic updates to backend
      // Remind me this later need to be uncommented everytime you read this file
      this.startBackendUpdates(phoneNumber);

      return true;
    } catch (error) {
      this.handleError(error as GeolocationPositionError);
      return false;
    }
  }

  // Add this new method for logout scenario
  stopTrackingOnLogout() {
    this.isLoggingOut = true;
    this.stopTracking();
  }

  stopTracking() {
    this.isTrackingSubject.next(false);
    this.errorSubject.next(null);

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Only send final location if NOT logging out
    if (!this.isLoggingOut && this.lastLocation) {
      this.sendLocationToBackend(this.phoneNumber).subscribe({
        next: (response) => {
          console.log('Final location sent successfully:', response);
        },
        error: (error) => {
          console.error('Final location send failed:', error);
        },
      });
    }

    // Reset the logout flag
    this.isLoggingOut = false;
  }

  private async checkLocationPermission(): Promise<boolean> {
    try {
      // Checks if permission api supported by the browser
      if (!('permissions' in navigator)) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 10000 }
          );
        });
      }

      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });

      switch (permission.state) {
        case 'granted':
          return true;

        case 'prompt':
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              () => resolve(false),
              { timeout: 10000 }
            );
          });

        case 'denied':
          this.errorSubject?.next?.(
            'Location access denied. Please enable location services in your browser settings.'
          );
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  private startGPSTracking() {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      options
    );

    // Watch for position changes
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      options
    );
  }

  private startBackendUpdates(phoneNumber: string) {
    this.phoneNumber = phoneNumber;
    // Send updates every 30 seconds, but only if location has changed significantly
    this.updateInterval = setInterval(() => {
      if (
        this.lastLocation &&
        this.hasLocationChangedSignificantly(this.lastLocation)
      ) {
        this.sendLocationToBackend(phoneNumber).subscribe({
          next: (response) => {
            console.log('Location update sent successfully:', response);
            this.lastSentLocation = { ...this.lastLocation! }; // Update last sent location
          },
          error: (error) => {
            console.error('Location update failed:', error);
            this.errorSubject.next(error.message);
          },
        });
      }
    }, 30000); // 30 seconds
  }

  private handlePosition(position: GeolocationPosition) {
    const location: DriverLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      isMoving: this.calculateIsMoving(position),
      batteryLevel: this.getBatteryLevel(),
    };

    this.lastLocation = location;
    this.locationHistory.push(location);

    // Keep only last 100 locations
    if (this.locationHistory.length > 100) {
      this.locationHistory.shift();
    }

    this.locationSubject.next(location);
    this.errorSubject.next(null);
  }

  private calculateIsMoving(position: GeolocationPosition): boolean {
    if (this.locationHistory.length < 2) return false;

    const lastLocation = this.locationHistory[this.locationHistory.length - 2];
    const distance = this.calculateDistance(
      lastLocation.lat,
      lastLocation.lng,
      position.coords.latitude,
      position.coords.longitude
    );

    // Consider moving if distance > 5 meters in last 30 seconds
    return distance > 5;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if the new location has changed significantly from the last sent location
   * Returns true if location should be sent to backend
   */
  private hasLocationChangedSignificantly(
    newLocation: DriverLocation
  ): boolean {
    // If this is the first location, always send it
    if (!this.lastSentLocation) {
      return true;
    }

    // Calculate distance between current and last sent location
    const distance = this.calculateDistance(
      this.lastSentLocation.lat,
      this.lastSentLocation.lng,
      newLocation.lat,
      newLocation.lng
    );

    // Send update if:
    // 1. Distance changed by more than 10 meters (configurable threshold)
    // 2. Speed changed significantly (more than 5 m/s difference)
    // 3. Heading changed significantly (more than 30 degrees)
    // 4. Moving status changed
    const distanceThreshold = 10; // meters
    const speedThreshold = 5; // m/s
    const headingThreshold = 30; // degrees

    const distanceChanged = distance > distanceThreshold;
    const speedChanged =
      Math.abs((newLocation.speed || 0) - (this.lastSentLocation.speed || 0)) >
      speedThreshold;
    const headingChanged =
      Math.abs(
        (newLocation.heading || 0) - (this.lastSentLocation.heading || 0)
      ) > headingThreshold;
    const movingStatusChanged =
      newLocation.isMoving !== this.lastSentLocation.isMoving;

    return (
      distanceChanged || speedChanged || headingChanged || movingStatusChanged
    );
  }

  private getBatteryLevel(): number | undefined {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        return battery.level * 100;
      });
    }
    return undefined;
  }

  private handleError(error: GeolocationPositionError) {
    const errorMessage = this.getErrorMessage(error);
    this.errorSubject.next(errorMessage);
    this.isTrackingSubject.next(false);
  }

  private getErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location services in your browser settings.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable. Please check your GPS signal.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'Unknown location error occurred.';
    }
  }

  /**
   * Send location update to backend
   */
  private sendLocationToBackend(phoneNumber: string): Observable<any> {
    if (!this.lastLocation) {
      return throwError(() => new Error('No location data available'));
    }

    const url = `${environment.apiUrl}/driver/location/update`;

    // Create location update payload matching DriverLocationDTO
    const locationUpdate = {
      latitude: this.lastLocation.lat,
      longitude: this.lastLocation.lng,
      accuracy: this.lastLocation.accuracy,
      speed: this.lastLocation.speed,
      heading: this.lastLocation.heading,
      altitude: undefined, // Not available from browser geolocation
      isMoving: this.lastLocation.isMoving,
      batteryLevel: this.lastLocation.batteryLevel,
      estimatedArrival: this.calculateETA(),
      destinationWarehouse: 'unknown',
      locationTimestamp: new Date().toISOString(),
    };

    const token = this.getAuthToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.post(url, locationUpdate, { headers }).pipe(
      timeout(10000), // 10 second timeout
      retry({ count: 2, delay: 1000 }), // Retry twice with 1s delay
      catchError((error) => {
        let errorMessage = 'Failed to send location update';

        if (error.name === 'TimeoutError') {
          errorMessage = 'Location update timed out. Please try again.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'Access forbidden. Please check your permissions.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid location data';
        } else if (error.status === 429) {
          errorMessage = 'Too many location updates. Please wait.';
        } else if (error.status === 500) {
          errorMessage = 'Server error, please try again later';
        } else if (error.status === 0) {
          errorMessage = 'No internet connection. Please check your network.';
        }

        console.error('Location update failed:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Get current phone number from user management service
   */
  private getCurrentPhoneNumber(): string {
    // Get from sessionStorage like other services
    return sessionStorage.getItem('phoneNumber') || 'unknown';
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    return sessionStorage.getItem('token') || '';
  }

  /**
   * Format phone number to XXX-XXX-XXXX format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's a valid 10-digit number
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }

    // If not valid, return a default format
    return '000-000-0000';
  }

  private calculateETA(): number | undefined {
    // Simple ETA calculation based on distance and speed
    if (!this.lastLocation || !this.lastLocation.speed) return undefined;

    // You can enhance this with actual destination coordinates
    const estimatedDistance = 1000; // meters - replace with actual calculation
    const speed = this.lastLocation.speed; // m/s

    return Math.round(estimatedDistance / speed); // seconds
  }

  // Public methods for external use
  getCurrentLocation(): DriverLocation | null {
    return this.lastLocation;
  }

  getLocationHistory(): DriverLocation[] {
    return [...this.locationHistory];
  }

  calculateDistanceToDestination(
    destinationLat: number,
    destinationLng: number
  ): number {
    if (!this.lastLocation) return 0;

    return this.calculateDistance(
      this.lastLocation.lat,
      this.lastLocation.lng,
      destinationLat,
      destinationLng
    );
  }
}
