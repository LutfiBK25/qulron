export interface FacilityPoint {
  id: string;
  name: string;
  type: 'warehouse' | 'yard' | 'entrance' | 'exit' | 'parking';
  lat: number;
  lng: number;
  icon: string;
}

export interface RouteStep {
  lat: number;
  lng: number;
  instruction: string;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
  speed?: number;
  heading?: number;
  isMoving?: boolean;
  batteryLevel?: number;
}

export interface LocationUpdate {
  driverId: string;
  location: DriverLocation;
  destinationWarehouse?: string;
  estimatedArrival?: number;
}
