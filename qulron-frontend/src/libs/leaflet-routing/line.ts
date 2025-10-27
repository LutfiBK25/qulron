import L from 'leaflet';

export interface LineOptions {
  styles: L.PolylineOptions[];
  missingRouteStyles: L.PolylineOptions[];
  addWaypoints: boolean;
  extendToWaypoints: boolean;
  missingRouteTolerance: number;
}

export class Line extends L.LayerGroup {
  private lineOptions: LineOptions;
  private _route: any;
  private _wpIndices: any;

  // Event mixin functionality (for compatibility with original JS implementation)
  includes =
    (typeof L.Evented !== 'undefined' && L.Evented.prototype) ||
    (L as any).Mixin.Events;

  constructor(route: any, options?: Partial<LineOptions>) {
    super();
    this.lineOptions = {
      styles: [
        { color: 'black', opacity: 0.15, weight: 9 },
        { color: 'white', opacity: 0.8, weight: 6 },
        { color: 'red', opacity: 1, weight: 2 },
      ],
      missingRouteStyles: [
        { color: 'black', opacity: 0.15, weight: 7 },
        { color: 'white', opacity: 0.6, weight: 4 },
        { color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12' },
      ],
      addWaypoints: true,
      extendToWaypoints: true,
      missingRouteTolerance: 10,
      ...options,
    };
    this._route = route;
    if (this.lineOptions.extendToWaypoints) {
      this._extendToWaypoints();
    }
    this._addSegment(
      route.coordinates,
      this.lineOptions.styles,
      this.lineOptions.addWaypoints
    );
  }

  getBounds(): L.LatLngBounds {
    return L.latLngBounds(this._route.coordinates);
  }

  private _findWaypointIndices(): number[] {
    const wps = this._route.inputWaypoints;
    const indices: number[] = [];
    for (let i = 0; i < wps.length; i++) {
      indices.push(this._findClosestRoutePoint(wps[i].latLng));
    }
    return indices;
  }

  private _findClosestRoutePoint(latlng: L.LatLng): number {
    let minDist = Number.MAX_VALUE;
    let minIndex = 0;
    for (let i = this._route.coordinates.length - 1; i >= 0; i--) {
      const d = latlng.distanceTo(this._route.coordinates[i]);
      if (d < minDist) {
        minIndex = i;
        minDist = d;
      }
    }
    return minIndex;
  }

  private _extendToWaypoints(): void {
    const wps = this._route.inputWaypoints;
    const wpIndices = this._getWaypointIndices();
    for (let i = 0; i < wps.length; i++) {
      const wpLatLng = wps[i].latLng;
      const routeCoord = L.latLng(this._route.coordinates[wpIndices[i]]);
      if (
        wpLatLng.distanceTo(routeCoord) > this.lineOptions.missingRouteTolerance
      ) {
        this._addSegment(
          [wpLatLng, routeCoord],
          this.lineOptions.missingRouteStyles
        );
      }
    }
  }

  private _addSegment(
    coords: L.LatLng[],
    styles: L.PolylineOptions[],
    mouselistener?: boolean
  ): void {
    for (let i = 0; i < styles.length; i++) {
      const pl = L.polyline(coords, styles[i]);
      this.addLayer(pl);
      if (mouselistener) {
        pl.on('mousedown', this._onLineTouched, this);
      }
    }
  }

  private _findNearestWpBefore(i: number): number {
    const wpIndices = this._getWaypointIndices();
    let j = wpIndices.length - 1;
    while (j >= 0 && wpIndices[j] > i) {
      j--;
    }
    return j;
  }

  private _onLineTouched(e: L.LeafletMouseEvent): void {
    const afterIndex = this._findNearestWpBefore(
      this._findClosestRoutePoint(e.latlng)
    );
    (this as any).fire('linetouched', {
      afterIndex,
      latlng: e.latlng,
    });
    L.DomEvent.stop(e);
  }

  private _getWaypointIndices(): number[] {
    if (!this._wpIndices) {
      this._wpIndices =
        this._route.waypointIndices || this._findWaypointIndices();
    }
    return this._wpIndices;
  }
}
