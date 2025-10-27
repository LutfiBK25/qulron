import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DriverDashboardData } from '../../core/models/interface/driver-dashboard.interface';
import { CreateOrderTrailerComponent } from './create-order-trailer/create-order-trailer.component';
import { DriverService } from '../../core/service/driver.service';
import { catchError, EMPTY, switchMap, take } from 'rxjs';
import { PopupService } from '../../core/service/popup.service';
import { UserManagementService } from '../../core/service/user-management.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CustomFacilityMapComponent } from './custom-facility-map/custom-facility-map.component';
import { LocationService } from '../../core/service/location.service';
import { DriverLocation } from '../../core/models/interface/facility.interface';

@Component({
  selector: 'app-driver-dashboard',
  imports: [
    CreateOrderTrailerComponent,
    CommonModule,
    TranslateModule,
    CustomFacilityMapComponent,
  ],
  templateUrl: './driver-dashboard.component.html',
  styleUrl: './driver-dashboard.component.css',
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  dataMode = true;
  mapMode = false;
  driverData: DriverDashboardData = {} as DriverDashboardData;

  hasTrailer: boolean = false;
  showTrailerPopup: boolean = false;
  private pollingInterval: any;
  private isPolling = false;

  // Location tracking properties
  driverLocation: DriverLocation | null = null;
  locationError: string | null = null;
  isLocationTracking = false; // This is used to check if location tracking is enabled
  distanceToFacility: number = 0;

  // Route Data got from custom facility map comp
  routeData: any = null;
  distanceToDestination: number = 0;

  // Driver Arrival Section
  driverArrived: boolean = false;

  constructor(
    private driverService: DriverService,
    private locationService: LocationService,
    private popupService: PopupService,
    private userManagementService: UserManagementService
  ) {}
  ngOnInit() {
    // Get hasTrailer from localStorage (or a service)
    const hasTrailerStr = localStorage.getItem('hasTrailer');
    this.hasTrailer = hasTrailerStr === 'true';

    if (!this.hasTrailer) {
      this.showTrailerPopup = true;
    } else {
      // Get dashboard data first, then start location tracking
      this.initializeDashboardWithLocationTracking();
      this.startPolling();
    }

    // Subscribe to location updates
    this.locationService.location$.subscribe((location) => {
      this.driverLocation = location;
    });

    this.locationService.error$.subscribe((error) => {
      this.locationError = error;
    });

    this.locationService.isTracking$.subscribe((isTracking) => {
      this.isLocationTracking = isTracking;
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  handleTrailerPopupClose() {
    this.showTrailerPopup = false;
    this.initializeDashboardWithLocationTracking();
    this.startPolling();
  }

  // Add this method to handle route data updates
  handleRouteDataUpdate(data: any) {
    this.routeData = data;
    this.extractDistanceFromRouteData();
  }

  // Extract distance information from route data
  extractDistanceFromRouteData() {
    this.distanceToDestination = this.routeData.summary.distanceInMiles;
  }

  // Driver Location Section Begin
  async initializeDriverLocationTracking() {
    const phoneNumber = this.driverData.phoneNumber || 'unknown';

    const success = await this.locationService.startTracking(phoneNumber);

    if (!success) {
      this.popupService.show(
        'Location Required',
        'Please enable location services on your device to use the facility map and get accurate directions.'
      );
    }
  }

  startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(() => {
      this.pollForDestinationUpdates();
      if (!this.driverArrived && this.isLocationTracking) {
        this.validateDriverArrivalStatus();
      }
    }, 8000); // 8 seconds - good balance
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
    }
  }

  pollForDestinationUpdates() {
    if (!this.isPolling) return;

    if (document.hidden) return;

    this.driverService
      .getDriverDashboard()
      .pipe(
        take(1),
        catchError((err) => {
          console.error('Polling error:', err);
          return EMPTY;
        })
      )
      .subscribe((response) => {
        if (response.statusCode === 200) {
          const newDestinationLocation = response.currentDestinationLocation;
          const newDestinationArea = response.currentDestinationArea;
          const currentDestinationLocation =
            this.driverData.currentDestinationLocation;
          const currentDestinationArea = this.driverData.currentDestinationArea;

          const normalizedNewLocation = newDestinationLocation || '';
          const normalizedCurrentLocation = currentDestinationLocation || '';
          const normalizedNewArea = newDestinationArea || '';
          const normalizedCurrentArea = currentDestinationArea || '';

          if (
            normalizedNewLocation !== normalizedCurrentLocation ||
            normalizedNewArea !== normalizedCurrentArea
          ) {
            this.mapResponseToDriverData(response);

            // Fix the popup conditions to check for area changes
            if (
              (normalizedNewArea && normalizedCurrentArea) ||
              (normalizedNewLocation && normalizedCurrentLocation)
            ) {
              this.popupService.show('Update', 'New destination assigned!');
            } else if (
              (normalizedNewArea && !normalizedCurrentArea) ||
              (normalizedNewLocation && !normalizedCurrentLocation)
            ) {
              this.popupService.show('Update', 'Destination assigned!');
            }
          }
        }
      });
  }

  fetchLatestDashboardData() {
    this.driverService
      .getDriverDashboard()
      .pipe(
        switchMap((response) => {
          if (response.statusCode === 200) {
            this.mapResponseToDriverData(response);
            this.validateDriverArrivalStatus();
            return EMPTY;
          } else {
            this.popupService.show(`Error`, `${response.message}`);
            return EMPTY;
          }
        }),
        catchError((err) => {
          this.popupService.show('Error', err.message || 'Update failed');
          this.logout();
          return EMPTY;
        })
      )
      .subscribe();
  }

  initializeDashboardWithLocationTracking() {
    this.driverService
      .getDriverDashboard()
      .pipe(
        switchMap((response) => {
          if (response.statusCode === 200) {
            this.mapResponseToDriverData(response);
            this.validateDriverArrivalStatus();
            // Start location tracking after dashboard data is loaded
            this.initializeDriverLocationTracking();
            return EMPTY;
          } else {
            this.popupService.show(`Error`, `${response.message}`);
            this.logout();
            return EMPTY;
          }
        }),
        catchError((err) => {
          this.popupService.show('Error', err.message || 'Update failed');
          this.logout();
          return EMPTY;
        })
      )
      .subscribe();
  }

  handleDriverArrivalConfirmation(): void {
    if (this.driverArrived) return;

    if (this.isLocationTracking) {
      const isWithinCustomBox = this.isDriverInsideFacilityBoundary(
        this.driverLocation?.lat || 0,
        this.driverLocation?.lng || 0
      );
      if (!isWithinCustomBox) {
        this.popupService.show('Error', 'You are not within the facility');
        return;
      }
    }

    this.driverService
      .confirmDriverArrival(
        this.isLocationTracking,
        this.driverLocation?.lat || 0,
        this.driverLocation?.lng || 0
      )
      .subscribe((response) => {
        if (response.statusCode === 200) {
          this.fetchLatestDashboardData();
          this.validateDriverArrivalStatus();
        } else {
          this.popupService.show('Error', `${response.message}`);
        }
      });

    this.popupService.show(
      'Arrival Confirmed',
      'Your arrival at the destination has been confirmed. You will be assigned a new destination shortly.'
    );
  }

  validateDriverArrivalStatus(): void {
    if (this.driverData.driverArrived) {
      this.driverArrived = true;
    } else {
      this.checkIfDriverIsNearDestination();
    }
  }

  checkIfDriverIsNearDestination() {
    // check if driver is within the custom 4-point box
    const isWithinCustomBox = this.isDriverInsideFacilityBoundary(
      this.driverLocation?.lat || 0,
      this.driverLocation?.lng || 0
    );
    if (isWithinCustomBox) {
      this.handleDriverArrivalConfirmation();
    }
  }

  // Check if driver is within the custom 15-point polygon
  isDriverInsideFacilityBoundary(
    driverLat: number,
    driverLng: number
  ): boolean {
    // Custom 15-point polygon coordinates (same as in custom-facility-map component)
    const customBox = [
      [40.52302959924054, -74.32324877112171], // Point 1
      [40.523202602650116, -74.32639714054851], // Point 2
      [40.522228010948794, -74.32654886919558], // Point 3
      [40.52255095415221, -74.3299172453026], // Point 4
      [40.51962710810491, -74.3305014006403], // Point 5
      [40.5191945756738, -74.3267461166252], // Point 6
      [40.51901579475845, -74.32685232666907], // Point 7
      [40.51868130020615, -74.32425018037173], // Point 8
      [40.52066517452486, -74.32373430297169], // Point 9
      [40.5205556016006, -74.32201976919733], // Point 10
      [40.51801230609231, -74.32154182395904], // Point 11
      [40.518219925668284, -74.32056317406513], // Point 12
      [40.520930455590985, -74.32133699016521], // Point 13
      [40.52114383308044, -74.32358257414191], // Point 14
      [40.52298923171724, -74.32334739472645], // Point 15
    ];

    // Use point-in-polygon algorithm (Ray Casting Algorithm)
    return this.isCoordinateInsidePolygonBoundary(
      driverLat,
      driverLng,
      customBox
    );
  }

  // Point-in-polygon algorithm using Ray Casting Method
  private isCoordinateInsidePolygonBoundary(
    lat: number,
    lng: number,
    polygon: number[][]
  ): boolean {
    let isInside = false;
    const pointLongitude = lng;
    const pointLatitude = lat;

    // Ray casting algorithm: cast a ray from the point to infinity
    // Count how many times it intersects with polygon edges
    for (
      let currentIndex = 0, previousIndex = polygon.length - 1;
      currentIndex < polygon.length;
      previousIndex = currentIndex++
    ) {
      const currentLongitude = polygon[currentIndex][1];
      const currentLatitude = polygon[currentIndex][0];
      const previousLongitude = polygon[previousIndex][1];
      const previousLatitude = polygon[previousIndex][0];

      // Check if ray crosses this edge
      if (
        currentLatitude > pointLatitude !== previousLatitude > pointLatitude &&
        pointLongitude <
          ((previousLongitude - currentLongitude) *
            (pointLatitude - currentLatitude)) /
            (previousLatitude - currentLatitude) +
            currentLongitude
      ) {
        isInside = !isInside;
      }
    }

    return isInside;
  }

  // Check if driver is within a rectangular box around destination (kept for reference)
  isDriverWithinRectangularArea(
    driverLat: number,
    driverLng: number,
    destLat: number,
    destLng: number,
    boxSizeMeters: number
  ): boolean {
    // Convert box size from meters to degrees (approximate)
    // 1 degree of latitude ≈ 111,000 meters
    // 1 degree of longitude ≈ 111,000 * cos(latitude) meters
    const latDelta = boxSizeMeters / 111000; // ~0.003 degrees for 350m
    const lngDelta =
      boxSizeMeters / (111000 * Math.cos((destLat * Math.PI) / 180));

    // Define box boundaries
    const minLat = destLat - latDelta;
    const maxLat = destLat + latDelta;
    const minLng = destLng - lngDelta;
    const maxLng = destLng + lngDelta;

    // Check if driver is within the box
    return (
      driverLat >= minLat &&
      driverLat <= maxLat &&
      driverLng >= minLng &&
      driverLng <= maxLng
    );
  }

  // Map API response to driver data model
  mapResponseToDriverData(response: DriverDashboardData) {
    this.driverData = {
      statusCode: response.statusCode || 500,
      message: response.message || '',
      driverName: response.driverName || '',
      phoneNumber: response.phoneNumber || '',
      brokerName: response.brokerName || '',
      orderNumbers: response.orderNumbers || '',
      destinationWarehouse: response.destinationWarehouse || '',
      warehouseAddress: response.warehouseAddress || '',
      trailerNumber: response.trailerNumber || '',
      driverArrived: response.driverArrived || false,
      currentDestinationArea: response.currentDestinationArea || '',
      currentDestinationLocation: response.currentDestinationLocation || '',
      latitude: response.latitude || 0,
      longitude: response.longitude || 0,
      potentialWeight: response.potentialWeight || 0,
      customerName: response.customerName || '',
      customerAddress: response.customerAddress || '',
    };
  }

  logout(): void {
    // Stop location tracking before logout
    this.locationService.stopTrackingOnLogout();

    // Stop polling before logout
    this.stopPolling();

    this.userManagementService
      .logout()
      .pipe(
        switchMap((response) => {
          this.popupService.show(
            'Logout Success',
            'Thank you for visiting Arizona Beverage Company.'
          );
          // Always clear session on successful HTTP response
          this.userManagementService.clearSession();
          return EMPTY;
        }),
        catchError((err) => {
          this.popupService.show(
            'Error',
            err.message || 'Somthing Went Wrong Logining Out'
          );
          // Clear session even on error
          this.userManagementService.clearSession();
          return EMPTY;
        })
      )
      .subscribe();
    this.userManagementService.clearSession();
  }

  activateDataView() {
    this.dataMode = true;
    this.mapMode = false;
  }

  activateMapView() {
    this.dataMode = false;
    this.mapMode = true;
  }
}
