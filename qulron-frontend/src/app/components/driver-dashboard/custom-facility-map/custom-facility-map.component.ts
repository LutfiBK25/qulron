import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DriverDashboardData } from '../../../core/models/interface/driver-dashboard.interface';
import { CommonModule } from '@angular/common';
import {
  DriverLocation,
  FacilityPoint,
} from '../../../core/models/interface/facility.interface';

import { LocationService } from '../../../core/service/location.service';
import { RoutingService } from '../../../core/service/routing.service';
import { environment } from '../../../../environments/environment';

import L from 'leaflet';
import { Control } from '../../../../libs/leaflet-routing/control';
import { OSRMv1 } from '../../../../libs/leaflet-routing/osrm-v1';
import { Formatter } from '../../../../libs/leaflet-routing/formatter';
import { Waypoint } from '../../../../libs/leaflet-routing/waypoint';
import { LineOptions } from '../../../../libs/leaflet-routing/line';
import { MetersToMilesFormatter } from '../../../core/models/class/MetersToMilesFormatter';
import { PopupService } from '../../../core/service/popup.service';

@Component({
  selector: 'app-custom-facility-map',
  imports: [CommonModule],
  templateUrl: './custom-facility-map.component.html',
  styleUrl: './custom-facility-map.component.css',
})
export class CustomFacilityMapComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() driverData!: DriverDashboardData;
  @Input() realDriverLocation?: DriverLocation | null;
  // Add this property to your component class
  @Output() routeDataUpdated = new EventEmitter<any>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private driverMarker!: L.Marker;
  private destinationMarker!: L.Marker;
  private facilityMarkers: L.Marker[] = [];
  private facilityAreas: L.Polygon[] = [];
  private entrance = L.latLng(40.52089277603273, -74.3238705322726);
  // 40.52255875661384, -74.33348546469773
  private exit = L.latLng(40.52092168218135, -74.33031143249039);
  private scaleRoadCord = L.latLng(40.522938276208464, -74.32479685593358);

  isLocationTracking = false; // This is used to check if location tracking is enabled

  // Route data
  private routingControl?: Control;
  private routeData: any = null;
  private routeSummary: any = null;
  private routeSteps: any[] = [];
  routeInstructions: string[] = [];

  constructor(
    private locationService: LocationService,
    private popupService: PopupService,
    private routingService: RoutingService
  ) {}

  // Facility points with your real coordinates
  facilityPoints: FacilityPoint[] = [
    {
      id: 'keasby-warehouse',
      name: 'Keasby Warehouse',
      type: 'warehouse',
      lat: 40.52110811959847,
      lng: -74.32518090892168,
      icon: '🏭',
    },
    {
      id: 'edison-facility',
      name: 'Edison Warehouse',
      type: 'warehouse',
      lat: 40.52077350945153,
      lng: -74.32823664353462,
      icon: '🏭',
    },
    {
      id: 'yard',
      name: 'Yard Area',
      type: 'yard',
      lat: 40.52208284394376,
      lng: -74.32851733730054,
      icon: '🚚',
    },
    {
      id: 'entrance',
      name: 'Main Entrance',
      type: 'entrance',
      lat: 40.52089277603273,
      lng: -74.3238705322726,
      icon: '🚪',
    },
    {
      id: 'exit',
      name: 'Exit Gate',
      type: 'exit',
      lat: 40.52095077401237,
      lng: -74.33012071183727,
      icon: '🚪',
    },
    {
      id: 'parking',
      name: 'Employee Parking',
      type: 'parking',
      lat: 40.51900382485979,
      lng: -74.32548866567979,
      icon: '🅿️',
    },
  ];

  // Facility areas with your real coordinates
  facilityAreasData = [
    {
      name: 'Keasby Warehouse Area',
      coordinates: [
        [40.522854961560824, -74.32416972109392] as [number, number],
        [40.523019837006935, -74.32577733084416] as [number, number],
        [40.51931974045873, -74.32644716824011] as [number, number],
        [40.51916455501402, -74.32483317908607] as [number, number],
      ],
      color: '#4CAF50',
      type: 'warehouse',
    },
    {
      name: 'Edison Warehouse Area',
      coordinates: [
        [40.5217590144595, -74.32929238246729] as [number, number],
        [40.521516545867215, -74.3268618296306] as [number, number],
        [40.51967375590442, -74.32718717922292] as [number, number],
        [40.51995017762826, -74.32959859384827] as [number, number],
      ],
      color: '#FF9800',
      type: 'warehouse',
    },
    {
      name: 'Yard Area',
      coordinates: [
        [40.52204720353357, -74.32741745523055] as [number, number],
        [40.52186889515224, -74.32744452074854] as [number, number],
        [40.52212435605154, -74.3298104981135] as [number, number],
        [40.52228894779312, -74.32976538891683] as [number, number],
      ],
      color: '#2196F3',
      type: 'yard',
    },
  ];

  // 450m box around destination
  private destinationBox: L.Polygon | null = null;
  private destinationCenter = [40.52073949391192, -74.32665600727385];

  // Method to create facility box coordinates based on specific points
  private createFacilityBox(): [number, number][] {
    // Custom 15-point polygon coordinates provided by user
    return [
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
    ] as [number, number][];
  }

  ngOnInit() {
    this.locationService.isTracking$.subscribe((isTracking) => {
      this.isLocationTracking = isTracking;
    });
    // Apply the patch BEFORE any Leaflet initialization
    //  this.patchLeafletEvents(); removed because its causing issues
    this.preMapInitialization();

    this.initializeMap();

    // Subscribe to location updates if not provided via input
    this.locationService.location$.subscribe((location) => {
      if (location) {
        this.updateDriverLocationFromGPS(location);
        // this.checkArrivalAtEntrance(location);
      }
    });

    this.resetToDriver();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only run if the map is initialized
    if (this.map) {
      // If either driverData or realDriverLocation changed, update the route
      if (changes['driverData']) {
        this.getRoute(this.driverData);
        this.getDestination(this.driverData);
      }
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  updateDriverLocationFromGPS(location: DriverLocation) {
    if (this.driverMarker) {
      const newLatLng = L.latLng(location.lat, location.lng);
      this.driverMarker.setLatLng(newLatLng);
      this.driverMarker.bindPopup(`
        <div style="text-align: center;">
          <b style="color: #007bff;"> Driver Location</b><br>
          <small style="color: #666;">Lat: ${location.lat.toFixed(
            6
          )}</small><br>
          <small style="color: #666;">Lng: ${location.lng.toFixed(
            6
          )}</small><br>
          <small style="color: #666;">Accuracy: ${location.accuracy?.toFixed(
            1
          )}m</small><br>
          <small style="color: #666;">Speed: ${
            location.speed ? (location.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'
          }</small>
        </div>
      `);
    }
  }

  preMapInitialization() {
    // Fix Leaflet's default icon path
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/images/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/images/marker-icon.png',
      shadowUrl: 'assets/leaflet/images/marker-shadow.png',
    });
  }

  private initializeMap() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [40.52073949391192, -74.32665600727385],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      // Add these options to improve performance
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 10,
    }).addTo(this.map);

    this.addFacilityAreas();
    this.addFacilityMarkers();
    this.updateDriverLocation();
    this.getDestination(this.driverData);
    this.getRoute(this.driverData);
  }

  private addFacilityAreas() {
    this.facilityAreasData.forEach((area) => {
      const polygon = L.polygon(area.coordinates, {
        color: area.color,
        weight: 2,
        fillColor: area.color,
        fillOpacity: 0.3,
      }).addTo(this.map);
      polygon.bindPopup(`<b>${area.name}</b><br>Type: ${area.type}`);
      this.facilityAreas.push(polygon);
    });

    // Add box around destination (disabled for now)
    // this.addDestinationBox();
  }

  // Add facility box around destination
  private addDestinationBox() {
    // Remove existing box if it exists
    if (this.destinationBox) {
      this.map.removeLayer(this.destinationBox);
    }

    // Create custom box coordinates
    const boxCoordinates = this.createFacilityBox();

    // Create the box polygon
    this.destinationBox = L.polygon(boxCoordinates, {
      color: '#FF5722', // Red color for destination box
      weight: 3,
      fillColor: '#FF5722',
      fillOpacity: 0.2,
      dashArray: '5, 5', // Dashed line for better visibility
    }).addTo(this.map);

    // Add popup with distance information
    this.destinationBox.bindPopup(`
      <b>Custom Destination Area</b><br>
      <small>Custom 15-point arrival zone</small><br>
      <small>Custom boundary defined by 15 coordinates</small>
    `);

    this.facilityAreas.push(this.destinationBox);
  }

  private addFacilityMarkers() {
    this.facilityPoints.forEach((point) => {
      const customIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: `<div style="font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${point.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([point.lat, point.lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(`<b>${point.name}</b><br>Type: ${point.type}`);
      marker.on('click', () => {});
      this.facilityMarkers.push(marker);
    });
  }

  private updateDriverLocation() {
    const driverLatLng = this.realDriverLocation
      ? ([this.realDriverLocation.lat, this.realDriverLocation.lng] as [
          number,
          number
        ])
      : ([40.52077772489141, -74.32183388092261] as [number, number]);
    if (!this.driverMarker) {
      const driverIcon = L.divIcon({
        className: 'driver-marker',
        html: `
        <div style="font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.5); background: rgba(255,255,255,0); border-radius: 50%; animation: pulse 2s infinite;">🚛</div>
        <style>@keyframes pulse {0% { transform: scale(1); }50% { transform: scale(1.2); }100% { transform: scale(1); }}</style>
      `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      this.driverMarker = L.marker(driverLatLng, { icon: driverIcon }).addTo(
        this.map
      ).bindPopup(`
        <div style="text-align: center;"><small style="color: #666;">Current position</small></div>
      `);
    } else {
      this.driverMarker.setLatLng(driverLatLng);
    }
  }

  private getDestination(dashData: DriverDashboardData) {
    // Validate and get destination coordinates
    if (!dashData.latitude || !dashData.longitude) {
      return;
    }

    const { latitude, longitude } = dashData;
    const isValidCoordinate =
      latitude > 40 && latitude < 41 && longitude < -74 && longitude > -75;

    if (!isValidCoordinate) {
      return;
    }

    const destination = L.latLng(latitude, longitude);
    if (destination) {
      if (!this.destinationMarker) {
        const destinationIcon = L.divIcon({
          className: 'destination-marker',
          html: '<div style="font-size: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">📍</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        this.destinationMarker = L.marker(destination, {
          icon: destinationIcon,
        })
          .addTo(this.map)
          .bindPopup(
            `Destination<br>Area: ${this.driverData.currentDestinationArea}<br>Location: ${this.driverData.currentDestinationLocation}`
          );
      } else {
        this.destinationMarker.setLatLng(destination);
      }
    }
  }

  private getRoute(dashData: DriverDashboardData) {
    // Remove the old routing control if it exists
    if (this.routingControl) {
      try {
        this.map.removeControl(this.routingControl);
      } catch (e) {
        console.warn('Routing control already removed or error:', e);
      }
      this.routingControl = undefined;
    }

    let assignedWaypoints: Waypoint[] = [];

    // Get waypoints
    const latLngWaypoints = this.getWaypoints(dashData);
    assignedWaypoints = latLngWaypoints.map((latLng) => new Waypoint(latLng));

    // Create OSRM router
    const router = new OSRMv1(
      {
        profile: 'driving',
      },
      this.routingService
    );

    // Add the routing control
    this.routingControl = new Control({
      position: 'topright',
      waypoints: assignedWaypoints,
      router: router,
      show: false, // hide route instructions
      formatter: new MetersToMilesFormatter() as any,
      collapsible: true,
      addWaypoints: false,
      fitSelectedRoutes: true, //after route is calculated, the map will fit the whole route
      lineOptions: {
        styles: [{ color: 'red', weight: 6 }],
        missingRouteStyles: [{ color: 'gray', weight: 6, dashArray: '5,5' }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
        addWaypoints: false,
      } as LineOptions,
      routeWhileDragging: false,
    }).addTo(this.map);

    // Override the plan's createMarker function to remove waypoint markers
    if (this.routingControl) {
      const plan = this.routingControl.getPlan();
      (plan as any).options.createMarker = function () {
        return null;
      };
    }

    // Listen for route calculation events
    (this.routingControl as any).on('routesfound', (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];

        // Store the complete route data
        this.routeData = route;

        // Extract route summary (total distance, duration)
        this.routeSummary = {
          distance: route.summary.totalDistance, // in meters
          duration: route.summary.totalTime, // in seconds
          distanceInMiles: (route.summary.totalDistance * 0.000621371).toFixed(
            1
          ), // convert to miles
          durationInMinutes: Math.round(route.summary.totalTime / 60), // convert to minutes
        };

        // Extract route steps/instructions
        this.routeSteps = route.instructions.map(
          (instruction: any, index: number) => ({
            step: index + 1,
            instruction: instruction.text,
            distance: instruction.distance, // in meters
            time: instruction.time, // in seconds
            distanceInFeet: Math.round(instruction.distance * 3.28084), // convert to feet
            timeInMinutes: Math.round(instruction.time / 60), // convert to minutes
          })
        );

        // Update your route instructions array
        this.routeInstructions = this.routeSteps.map(
          (step) =>
            `${step.step}. ${step.instruction} (${step.distanceInFeet} ft, ${step.timeInMinutes} min)`
        );

        // Emit the route data to parent component
        this.routeDataUpdated.emit({
          summary: this.routeSummary,
          steps: this.routeSteps,
          instructions: this.routeInstructions,
          fullRoute: this.routeData,
        });
      }
    });

    // Listen for routing errors
    (this.routingControl as any).on('routingerror', (e: any) => {
      console.error('Routing error:', e);
      console.error('Error details:', {
        error: e.error,
        status: e.status,
        message: e.message,
        url: e.url,
      });

      // Provide user-friendly error message
      if (
        e.status === 0 ||
        e.error?.message?.includes('CERT_AUTHORITY_INVALID')
      ) {
        console.error(
          'Certificate error detected. Please check OSRM service configuration.'
        );
      }
    });
  }

  // Waypoint Logic
  private getWaypoints(dashData: DriverDashboardData): L.LatLng[] {
    let assignedWaypoints: L.LatLng[] = [];

    // Get start and destination
    const start = this.realDriverLocation
      ? L.latLng(this.realDriverLocation.lat, this.realDriverLocation.lng)
      : L.latLng(40.52077772489141, -74.32183388092261);
    // const start = L.latLng(40.52190134226207, -74.32783711580372);

    // Get destination
    const destination = L.latLng(
      dashData.latitude ?? 0,
      dashData.longitude ?? 0
    );

    // if the destination is 0,0, then we don't have assignment and we direct to the entrance
    if (destination.lat === 0 && destination.lng === 0) {
      assignedWaypoints = [start, this.entrance];
      return assignedWaypoints;
    }

    // Check if driver is sharing location
    // if the driver is not sharing location
    if (!this.isLocationTracking) {
      // if the driver desitnation is keasby , then we go to the entrance and then to the destination
      if (dashData.currentDestinationArea === 'Keasby Warehouse') {
        assignedWaypoints = [start, this.entrance, destination];
        return assignedWaypoints;
      }
      // if the driver desitnation is edison , then we go to the entrance and then to the scale road and then to the destination
      else {
        assignedWaypoints = [
          start,
          this.entrance,
          this.scaleRoadCord,
          destination,
        ];
        return assignedWaypoints;
      }
    }
    // if the driver is sharing location, then we go to the destination
    else {
      // if the driver is not within the facility box
      if (!this.isInFacilityBox(start)) {
        // if the driver is going to keasby
        if (dashData.currentDestinationArea === 'Keasby Warehouse') {
          assignedWaypoints = [start, this.entrance, destination];
          return assignedWaypoints;
        }
        // if the driver is going to edison or yard
        else {
          assignedWaypoints = [
            start,
            this.entrance,
            this.scaleRoadCord,
            destination,
          ];
          return assignedWaypoints;
        }
      }
      // if the driver is within the facility box
      else {
        // if the driver is going out (load is shipped)
        if (dashData.currentDestinationArea === 'EXIT'){
          // if the driver is in keasby box
          if (this.isInKeasbyBox(start)) {
            assignedWaypoints = [start, this.scaleRoadCord, destination];
            return assignedWaypoints;
          }
          // if the driver is in edison/yard box
          else {
            assignedWaypoints = [start, this.exit, this.entrance, destination];
            return assignedWaypoints;
          }
        }
        // if the driver is going to keasby
        else if (dashData.currentDestinationArea === 'Keasby Warehouse') {
          // if the driver is in keasby box
          if (this.isInKeasbyBox(start)) {
            assignedWaypoints = [start, destination];
            return assignedWaypoints;
          }
          // if the driver is in edison/yard box
          else {
            assignedWaypoints = [start, this.exit, this.entrance, destination];
            return assignedWaypoints;
          }
        }
        // if the driver is going to edison or yard
        else {
          // if the driver is in keasby box
          if (this.isInKeasbyBox(start)) {
            assignedWaypoints = [start, this.scaleRoadCord, destination];
            return assignedWaypoints;
          }
          // if the driver is in edison/yard box
          else {
            assignedWaypoints = [start, destination];
            return assignedWaypoints;
          }
        }
      }
    }
  }

  private isInFacilityBox(latLng: L.LatLng) {
    const facilityBox = [
      [40.52302959924054, -74.32324877112171], // Point 1
      [40.523202602650116, -74.32639714054851], // Point 2
      [40.522228010948794, -74.32654886919558], // Point 3
      [40.52255095415221, -74.3299172453026], // Point 4
      [40.51962710810491, -74.3305014006403], // Point 5
      [40.5191945756738, -74.3267461166252], // Point 6
      [40.51901579475845, -74.32685232666907], // Point 7
      [40.51868130020615, -74.32425018037173], // Point 8
    ];

    return this.isCoordinateInsidePolygonBoundary(
      latLng.lat,
      latLng.lng,
      facilityBox
    );
  }

  private isInKeasbyBox(latLng: L.LatLng) {
    const keasbyBox = [
      [40.52289761332336, -74.32345174168512],
      [40.52297305038485, -74.32411935775559],
      [40.51879645258316, -74.32485914853635],
      [40.51868130020615, -74.32425018037173],
    ];

    return this.isCoordinateInsidePolygonBoundary(
      latLng.lat,
      latLng.lng,
      keasbyBox
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

  // Public methods for zoom controls
  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  resetToDriver() {
    this.map.setView(
      this.realDriverLocation
        ? ([this.realDriverLocation.lat, this.realDriverLocation.lng] as [
            number,
            number
          ])
        : ([40.52077772489141, -74.32183388092261] as [number, number]),
      18
    );
  }

  resetToFacility() {
    this.map.setView(
      [40.52073949391192, -74.32665600727385] as [number, number],
      16
    );
  }
}
