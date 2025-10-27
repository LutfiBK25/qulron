
export interface DriverDashboardData {
  statusCode: number;
  error?: string;
  message?: string;
  driverName: string;
  phoneNumber: string;
  brokerName: string;
  orderNumbers: string;
  destinationWarehouse: string;
  warehouseAddress: string;
  trailerNumber?: string;
  driverArrived?: boolean;
  currentDestinationArea?: string;
  currentDestinationLocation?: string;
  latitude?: number;
  longitude?: number;
  potentialWeight?: number;
  customerName?: string;
  customerAddress?: string;
}

export interface ConfirmArrivalRequest{
  isLocationTracking: boolean;
  driverLat: number;
  driverLng: number;
}

export interface ConfirmArrivalResponse{
  statusCode: number;
  error?: string;
  message?: string;
  messageCode?: string;
}