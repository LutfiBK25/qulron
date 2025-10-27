import L from 'leaflet';
import { GeocoderElement } from './geocoder-element';
import { Waypoint } from './waypoint';

export interface PlanOptions {
  dragStyles?: L.PolylineOptions[];
  draggableWaypoints?: boolean;
  routeWhileDragging?: boolean;
  addWaypoints?: boolean;
  reverseWaypoints?: boolean;
  addButtonClassName?: string;
  language?: string;
  createGeocoderElement?: (
    wp: Waypoint,
    i: number,
    nWps: number,
    plan: any
  ) => GeocoderElement;
  createMarker?: (i: number, wp: Waypoint, nWps?: number) => L.Marker | null;
  geocodersClassName?: string;
  geocoder?: any;
}

export interface WaypointEvent {
  waypoints: Waypoint[];
}

export interface WaypointSplicedEvent {
  index: number;
  nRemoved: number;
  added: any[];
}

export interface WaypointDragEvent {
  index: number;
  latlng: L.LatLng;
}

export interface WaypointGeocodedEvent {
  waypointIndex: number;
  waypoint: Waypoint;
}

export class Plan extends L.Layer {
  declare options: any;
  private _waypoints: Waypoint[] = [];
  private _markers: (L.Marker | null)[] = [];
  protected declare _map: L.Map;
  private _geocoderContainer?: HTMLElement;
  private _geocoderElems?: GeocoderElement[];
  private _newWp?: {
    lines: L.Polyline[];
  };

  // Event mixin functionality (for compatibility with original JS implementation)
  includes =
    (typeof L.Evented !== 'undefined' && L.Evented.prototype) ||
    (L as any).Mixin.Events;

  constructor(waypoints?: any[], options: PlanOptions = {}) {
    super(options as any);

    const defaultOptions: PlanOptions = {
      dragStyles: [
        { color: 'black', opacity: 0.15, weight: 9 },
        { color: 'white', opacity: 0.8, weight: 6 },
        { color: 'red', opacity: 1, weight: 2, dashArray: '7,12' },
      ],
      draggableWaypoints: false,
      routeWhileDragging: false,
      addWaypoints: false,
      reverseWaypoints: false,
      addButtonClassName: '',
      language: 'en',
      createGeocoderElement: function (
        wp: Waypoint,
        i: number,
        nWps: number,
        plan: any
      ): GeocoderElement {
        return new GeocoderElement(wp, i, nWps, plan);
      },
      createMarker: function (i: number, wp: Waypoint): L.Marker | null {
        const options = {
          draggable: this.draggableWaypoints,
        };
        return wp.latLng ? L.marker(wp.latLng, options) : null;
      },
      geocodersClassName: '',
    };

    this.options = { ...defaultOptions, ...options };
    this._waypoints = [];
    if (waypoints) {
      this.setWaypoints(waypoints);
    }
  }

  isReady(): boolean {
    for (let i = 0; i < this._waypoints.length; i++) {
      if (!this._waypoints[i].latLng) {
        return false;
      }
    }
    return true;
  }

  getWaypoints(): Waypoint[] {
    const wps: Waypoint[] = [];
    for (let i = 0; i < this._waypoints.length; i++) {
      wps.push(this._waypoints[i]);
    }
    return wps;
  }

  setWaypoints(waypoints: any[]): this {
    const args = [0, this._waypoints.length].concat(waypoints);
    this.spliceWaypoints.apply(this, args);
    return this;
  }

  spliceWaypoints(...args: any[]): Waypoint[] {
    const processedArgs = [args[0], args[1]];

    for (let i = 2; i < args.length; i++) {
      processedArgs.push(
        args[i] && args[i].hasOwnProperty('latLng')
          ? args[i]
          : new Waypoint(args[i])
      );
    }

    const removed = Array.prototype.splice.apply(
      this._waypoints,
      processedArgs as [number, number, ...any[]]
    );

    // Make sure there's always at least two waypoints
    while (this._waypoints.length < 2) {
      this.spliceWaypoints(this._waypoints.length, 0, null);
    }

    this._updateMarkers();
    this._fireChanged.apply(this, processedArgs);

    return removed;
  }

  override onAdd(map: L.Map): this {
    this._map = map;
    this._updateMarkers();
    return this;
  }

  override onRemove(): this {
    this._removeMarkers();

    if (this._newWp) {
      for (let i = 0; i < this._newWp.lines.length; i++) {
        this._map!.removeLayer(this._newWp.lines[i]);
      }
    }

    this._map = undefined as any;
    return this;
  }

  createGeocoders(): HTMLElement {
    const container = L.DomUtil.create(
      'div',
      'leaflet-routing-geocoders ' + this.options.geocodersClassName
    );
    const waypoints = this._waypoints;

    this._geocoderContainer = container;
    this._geocoderElems = [];

    if (this.options.addWaypoints) {
      const addWpBtn = L.DomUtil.create(
        'button',
        'leaflet-routing-add-waypoint ' + this.options.addButtonClassName,
        container
      );
      addWpBtn.setAttribute('type', 'button');
      L.DomEvent.addListener(
        addWpBtn,
        'click',
        () => {
          this.spliceWaypoints(waypoints.length, 0, null);
        },
        this
      );
    }

    if (this.options.reverseWaypoints) {
      const reverseBtn = L.DomUtil.create(
        'button',
        'leaflet-routing-reverse-waypoints',
        container
      );
      reverseBtn.setAttribute('type', 'button');
      L.DomEvent.addListener(
        reverseBtn,
        'click',
        () => {
          this._waypoints.reverse();
          this.setWaypoints(this._waypoints);
        },
        this
      );
    }

    this._updateGeocoders();
    (this as any).on('waypointsspliced', this._updateGeocoders);

    return container;
  }

  private _createGeocoder(i: number): GeocoderElement {
    const geocoder = this.options.createGeocoderElement!(
      this._waypoints[i],
      i,
      this._waypoints.length,
      this.options
    );

    (geocoder as any)
      .on(
        'delete',
        () => {
          if (i > 0 || this._waypoints.length > 2) {
            this.spliceWaypoints(i, 1);
          } else {
            this.spliceWaypoints(i, 1, new Waypoint());
          }
        },
        this
      )
      .on(
        'geocoded',
        (e: any) => {
          this._updateMarkers();
          this._fireChanged();
          this._focusGeocoder(i + 1);
          (this as any).fire('waypointgeocoded', {
            waypointIndex: i,
            waypoint: e.waypoint,
          });
        },
        this
      )
      .on(
        'reversegeocoded',
        (e: any) => {
          (this as any).fire('waypointgeocoded', {
            waypointIndex: i,
            waypoint: e.waypoint,
          });
        },
        this
      );

    return geocoder;
  }

  private _updateGeocoders(): void {
    const elems: GeocoderElement[] = [];

    if (this._geocoderElems) {
      for (let i = 0; i < this._geocoderElems.length; i++) {
        this._geocoderContainer!.removeChild(
          this._geocoderElems[i].getContainer()
        );
      }
    }

    for (let i = this._waypoints.length - 1; i >= 0; i--) {
      const geocoderElem = this._createGeocoder(i);
      this._geocoderContainer!.insertBefore(
        geocoderElem.getContainer(),
        this._geocoderContainer!.firstChild
      );
      elems.push(geocoderElem);
    }

    this._geocoderElems = elems.reverse();
  }

  private _removeMarkers(): void {
    if (this._markers) {
      for (let i = 0; i < this._markers.length; i++) {
        if (this._markers[i]) {
          this._map!.removeLayer(this._markers[i]!);
        }
      }
    }
    this._markers = [];
  }

  private _updateMarkers(): void {
    if (!this._map) {
      return;
    }

    this._removeMarkers();

    for (let i = 0; i < this._waypoints.length; i++) {
      let m: L.Marker | null = null;
      if (this._waypoints[i].latLng) {
        m = this.options.createMarker!(
          i,
          this._waypoints[i],
          this._waypoints.length
        );
        if (m) {
          m.addTo(this._map);
          if (this.options.draggableWaypoints) {
            this._hookWaypointEvents(m, i);
          }
        }
      }
      this._markers.push(m);
    }
  }

  private _fireChanged(...args: any[]): void {
    (this as any).fire('waypointschanged', { waypoints: this.getWaypoints() });

    if (args.length >= 2) {
      (this as any).fire('waypointsspliced', {
        index: args.shift(),
        nRemoved: args.shift(),
        added: args,
      });
    }
  }

  private _hookWaypointEvents(
    m: L.Marker,
    i: number,
    trackMouseMove?: boolean
  ): void {
    const eventLatLng = (e: any): L.LatLng => {
      return trackMouseMove ? e.latlng : e.target.getLatLng();
    };

    const dragStart = (e: any) => {
      (this as any).fire('waypointdragstart', {
        index: i,
        latlng: eventLatLng(e),
      });
    };

    const drag = (e: any) => {
      this._waypoints[i].latLng = eventLatLng(e);
      (this as any).fire('waypointdrag', { index: i, latlng: eventLatLng(e) });
    };

    const dragEnd = (e: any) => {
      this._waypoints[i].latLng = eventLatLng(e);
      this._waypoints[i].name = '';
      if (this._geocoderElems) {
        this._geocoderElems[i].update(true);
      }
      (this as any).fire('waypointdragend', {
        index: i,
        latlng: eventLatLng(e),
      });
      this._fireChanged();
    };

    if (trackMouseMove) {
      const mouseMove = (e: L.LeafletMouseEvent) => {
        this._markers[i]!.setLatLng(e.latlng);
        drag(e);
      };

      const mouseUp = (e: L.LeafletMouseEvent) => {
        this._map!.dragging.enable();
        this._map!.off('mouseup', mouseUp);
        this._map!.off('mousemove', mouseMove);
        dragEnd(e);
      };

      this._map!.dragging.disable();
      this._map!.on('mousemove', mouseMove);
      this._map!.on('mouseup', mouseUp);
      dragStart({ latlng: this._waypoints[i].latLng });
    } else {
      m.on('dragstart', dragStart);
      m.on('drag', drag);
      m.on('dragend', dragEnd);
    }
  }

  dragNewWaypoint(e: { afterIndex: number; latlng: L.LatLng }): void {
    const newWpIndex = e.afterIndex + 1;
    if (this.options.routeWhileDragging) {
      this.spliceWaypoints(newWpIndex, 0, e.latlng);
      this._hookWaypointEvents(this._markers[newWpIndex]!, newWpIndex, true);
    } else {
      this._dragNewWaypoint(newWpIndex, e.latlng);
    }
  }

  private _dragNewWaypoint(newWpIndex: number, initialLatLng: L.LatLng): void {
    newWpIndex = newWpIndex === 0 ? 1 : newWpIndex;
    const wp = new Waypoint(initialLatLng);
    const prevWp = this._waypoints[newWpIndex - 1];
    const nextWp = this._waypoints[newWpIndex];
    const marker = this.options.createMarker!(
      newWpIndex,
      wp,
      this._waypoints.length + 1
    );
    const lines: L.Polyline[] = [];
    const draggingEnabled = this._map!.dragging.enabled();

    const mouseMove = (e: L.LeafletMouseEvent) => {
      if (marker) {
        marker.setLatLng(e.latlng);
      }
      for (let i = 0; i < lines.length; i++) {
        const latLngs = lines[i].getLatLngs() as L.LatLng[];
        latLngs.splice(1, 1, e.latlng);
        lines[i].setLatLngs(latLngs);
      }
      L.DomEvent.stop(e as any);
    };

    const mouseUp = (e: L.LeafletMouseEvent) => {
      if (marker) {
        this._map!.removeLayer(marker);
      }
      for (let i = 0; i < lines.length; i++) {
        this._map!.removeLayer(lines[i]);
      }
      this._map!.off('mousemove', mouseMove);
      this._map!.off('mouseup', mouseUp);
      this.spliceWaypoints(newWpIndex, 0, e.latlng);
      if (draggingEnabled) {
        this._map!.dragging.enable();
      }
      L.DomEvent.stop(e as any);
    };

    if (marker) {
      marker.addTo(this._map!);
    }

    for (let i = 0; i < this.options.dragStyles!.length; i++) {
      lines.push(
        L.polyline(
          [prevWp.latLng!, initialLatLng, nextWp.latLng!],
          this.options.dragStyles![i]
        ).addTo(this._map!)
      );
    }

    if (draggingEnabled) {
      this._map!.dragging.disable();
    }

    this._map!.on('mousemove', mouseMove);
    this._map!.on('mouseup', mouseUp);
  }

  private _focusGeocoder(i: number): void {
    if (this._geocoderElems && this._geocoderElems[i]) {
      this._geocoderElems[i].focus();
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  }
}
