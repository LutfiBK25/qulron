export interface RoutingRequest {
  waypoints: Waypoint[];
  profile: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
}
