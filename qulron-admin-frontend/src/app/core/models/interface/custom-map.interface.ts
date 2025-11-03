export interface FacilityPoint {
  id: string;
  name: string;
  type: 'warehouse' | 'yard' | 'entrance' | 'exit' | 'parking';
  lat: number;
  lng: number;
  icon: string;
}

export interface DriversLocation {
  orderNumber: string;
  driverName: string;
  lat: number;
  lng: number;
  icon: string;
}
