import L from 'leaflet';

export interface WaypointOptions {
  allowUTurn?: boolean;
}

export class Waypoint {
  latLng: L.LatLng | null;
  name?: string;
  options: WaypointOptions;

  constructor(
    latLng?: L.LatLng | L.LatLngExpression | null,
    name?: string,
    options: WaypointOptions = {}
  ) {
    this.options = { allowUTurn: false, ...options }; // merge defaults
    this.latLng = latLng ? L.latLng(latLng) : null; // always normalize
    this.name = name;
  }
}
