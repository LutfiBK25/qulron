import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import L from 'leaflet';
import {
  DriversLocation,
  FacilityPoint,
} from '../../../../core/models/interface/custom-map.interface';

@Component({
  selector: 'app-custom-map',
  imports: [CommonModule],
  templateUrl: './custom-map.component.html',
  styleUrl: './custom-map.component.css',
})
export class CustomMapComponent {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() driverLocations: any[] = [];

  private map!: L.Map;
  private facilityMarkers: L.Marker[] = [];
  private facilityAreas: L.Polygon[] = [];
  private driverMarkers: L.Marker[] = [];

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
    // {
    //   id: 'yard',
    //   name: 'Yard Area',
    //   type: 'yard',
    //   lat: 40.52208284394376,
    //   lng: -74.32851733730054,
    //   icon: '🚚',
    // },
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

  ngOnInit() {
    this.initializeMap();
  }

  ngOnChanges() {
    this.addDriverMarkers();
  }

  private initializeMap() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [40.52073949391192, -74.32665600727385],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      // Add these options to improve performance
      preferCanvas: true,
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 20,
      minZoom: 10,
    }).addTo(this.map);

    this.addFacilityAreas();
    this.addFacilityMarkers();

    // If driver locations are already available, add them
    if (this.driverLocations && this.driverLocations.length > 0) {
      console.log(
        'Driver locations available during map init, adding markers...'
      );
      this.addDriverMarkers();
    }
  }

  private addDriverMarkers() {
    // Clear existing driver markers
    this.driverMarkers.forEach((marker) => marker.remove());
    this.driverMarkers = [];

    // Add new driver markers
    this.driverLocations.forEach((driver: any, index: number) => {
      if (driver.latitude && driver.longitude) {
        const customIcon = L.divIcon({
          className: 'custom-driver-marker',
          html: `<div style="font-size: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🚚</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([driver.latitude, driver.longitude], {
          icon: customIcon,
        }).addTo(this.map);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <b>${driver.driverName || 'Driver'}</b><br>
            Order: ${driver.orderNumbers || 'N/A'}<br>
            Phone: ${driver.phoneNumber || 'N/A'}<br>
          </div>
        `;

        // Bind popup with proper options
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'driver-popup',
        });

        // Add click event for debugging
        marker.on('click', () => {});

        this.driverMarkers.push(marker);
      }
    });
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

  // Public methods for zoom controls
  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  resetToFacility() {
    this.map.setView(
      [40.52073949391192, -74.32665600727385] as [number, number],
      16
    );
  }

  focusOnDriver(orderNumber: string) {
    const driver = this.driverLocations.find(
      (driver: any) => driver.orderNumber === orderNumber
    );

    if (driver && driver.latitude && driver.longitude) {
      // Focus map on the driver's location
      this.map.setView([driver.latitude, driver.longitude], 18);

      // Find and open the popup for this driver's marker
      const marker = this.driverMarkers.find((marker: any) => {
        const markerLatLng = marker.getLatLng();
        return (
          markerLatLng.lat === driver.latitude &&
          markerLatLng.lng === driver.longitude
        );
      });

      if (marker) {
        marker.openPopup();
      }
    }
  }
}
