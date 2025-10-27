import L from 'leaflet';
import { Itinerary, ItineraryOptions } from './itinerary';
import { Line, LineOptions } from './line';
import { Plan, PlanOptions } from './plan';
import { OSRMv1, OSRMRoute } from './osrm-v1';
import { Waypoint } from './waypoint';

export interface ControlOptions extends ItineraryOptions {
  fitSelectedRoutes?: 'smart' | boolean;
  routeLine?: (route: OSRMRoute, options?: LineOptions) => Line;
  autoRoute?: boolean;
  routeWhileDragging?: boolean;
  routeDragInterval?: number;
  waypointMode?: 'connect' | 'snap';
  showAlternatives?: boolean;
  defaultErrorHandler?: (e: { error: any }) => void;
  router?: any;
  plan?: Plan;
  waypoints?: any[];
  useZoomParameter?: boolean;
  addWaypoints?: boolean;
  lineOptions?: LineOptions;
  altLineOptions?: LineOptions;
  position?: L.ControlPosition; // Add position property
}

export interface RouteEvent {
  route: OSRMRoute;
  alternatives: OSRMRoute[];
}

export class Control extends Itinerary {
  declare options: ControlOptions;
  private _router: any;
  private _plan: Plan;
  private _requestCount: number = 0;
  private _selectedRoute?: OSRMRoute;
  private _line?: Line;
  private _alternatives?: Line[];

  private _pendingRequest?: any;

  constructor(options: ControlOptions = {}) {
    const defaultOptions: ControlOptions = {
      fitSelectedRoutes: 'smart',
      routeLine: function (route: OSRMRoute, options?: LineOptions): Line {
        return new Line(route, options);
      },
      autoRoute: true,
      routeWhileDragging: false,
      routeDragInterval: 500,
      waypointMode: 'connect',
      showAlternatives: false,
      defaultErrorHandler: function (e: { error: any }): void {
        console.error('Routing error:', e.error);
      },
      position: 'topleft', // Add default position for L.Control
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Call parent Itinerary constructor first (required by TypeScript)
    super(mergedOptions);

    if (this.options.router) {
      this._router = this.options.router;
    } else {
      throw new Error(
        'Router must be provided when using Control. Please provide a router in the options.'
      );
    }
    this._plan = this.options.plan || new Plan(this.options.waypoints, options);
    this._requestCount = 0;

    (this as any).on('routeselected', this._routeSelected, this);
    if (this.options.defaultErrorHandler) {
      (this as any).on('routingerror', this.options.defaultErrorHandler);
    }
    (this._plan as any).on('waypointschanged', this._onWaypointsChanged, this);
    if (options.routeWhileDragging) {
      this._setupRouteDragging();
    }
  }

  // Zoom end is not needed (it was making the route to be called twice)
  // private _onZoomEnd(): void {
  //   if (!this._selectedRoute || !this._router.requiresMoreDetail) {
  //     return;
  //   }

  //   const map = (this as any)._map;
  //   if (
  //     this._router.requiresMoreDetail(
  //       this._selectedRoute,
  //       map.getZoom(),
  //       map.getBounds()
  //     )
  //   ) {
  //     this.route({
  //       callback: (err: any, routes: OSRMRoute[]) => {
  //         if (!err) {
  //           for (let i = 0; i < routes.length; i++) {
  //             (this as any)._routes[i].properties = routes[i].properties;
  //           }
  //           this._updateLineCallback(err, routes);
  //         }
  //       },
  //       simplifyGeometry: false,
  //       geometryOnly: true,
  //     });
  //   }
  // }

  override onAdd(map: L.Map): HTMLElement {
    if (this.options.autoRoute) {
      this.route();
    }

    const container = super.onAdd(map);

    (this as any)._map = map;
    (this as any)._map.addLayer(this._plan as any);

    // Zoom end is not needed (it was making the route to be called twice)
    // (this as any)._map.on('zoomend', this._onZoomEnd, this);

    if ((this._plan.options as any).geocoder) {
      container.insertBefore(
        this._plan.createGeocoders(),
        container.firstChild
      );
    }

    return container;
  }

  override onRemove(): void {
    const map = (this as any)._map;
    // Zoom end is not needed (it was making the route to be called twice)
    // map.off('zoomend', this._onZoomEnd, this);
    if (this._line) {
      map.removeLayer(this._line);
    }
    map.removeLayer(this._plan as any);
    if (this._alternatives && this._alternatives.length > 0) {
      for (let i = 0, len = this._alternatives.length; i < len; i++) {
        map.removeLayer(this._alternatives[i]);
      }
    }
    super.onRemove();
  }

  getWaypoints(): Waypoint[] {
    return this._plan.getWaypoints();
  }

  setWaypoints(waypoints: any[]): this {
    this._plan.setWaypoints(waypoints);
    return this;
  }

  spliceWaypoints(...args: any[]): Waypoint[] {
    return this._plan.spliceWaypoints.apply(this._plan, args);
  }

  getPlan(): Plan {
    return this._plan;
  }

  getRouter(): any {
    return this._router;
  }

  private _routeSelected(e: RouteEvent): void {
    const route = (this._selectedRoute = e.route);
    const alternatives = this.options.showAlternatives && e.alternatives;
    const fitMode = this.options.fitSelectedRoutes;
    const fitBounds =
      (fitMode === 'smart' && !this._waypointsVisible()) ||
      (fitMode !== 'smart' && fitMode);

    this._updateLines({ route: route, alternatives: alternatives });

    if (fitBounds && this._line) {
      (this as any)._map.fitBounds(this._line.getBounds());
    }

    if (this.options.waypointMode === 'snap') {
      (this._plan as any).off(
        'waypointschanged',
        this._onWaypointsChanged,
        this
      );
      this.setWaypoints(route.waypoints!);
      (this._plan as any).on(
        'waypointschanged',
        this._onWaypointsChanged,
        this
      );
    }
  }

  private _waypointsVisible(): boolean {
    const wps = this.getWaypoints();
    let mapSize: L.Point;
    let bounds: L.Bounds | undefined;
    let boundsSize: L.Point;

    try {
      mapSize = (this as any)._map.getSize();

      for (let i = 0; i < wps.length; i++) {
        if (wps[i].latLng) {
          const p = (this as any)._map.latLngToLayerPoint(wps[i].latLng!);

          if (bounds) {
            bounds.extend(p);
          } else {
            bounds = L.bounds([p]);
          }
        }
      }

      if (!bounds) {
        return false;
      }

      boundsSize = bounds.getSize();
      return (
        (boundsSize.x > mapSize.x / 5 || boundsSize.y > mapSize.y / 5) &&
        this._waypointsInViewport()
      );
    } catch (e) {
      return false;
    }
  }

  private _waypointsInViewport(): boolean {
    const wps = this.getWaypoints();
    let mapBounds: L.LatLngBounds;

    try {
      mapBounds = (this as any)._map.getBounds();
    } catch (e) {
      return false;
    }

    for (let i = 0; i < wps.length; i++) {
      if (wps[i].latLng && mapBounds.contains(wps[i].latLng!)) {
        return true;
      }
    }

    return false;
  }

  private _updateLines(routes: {
    route: OSRMRoute;
    alternatives?: OSRMRoute[] | false;
  }): void {
    const addWaypoints =
      this.options.addWaypoints !== undefined
        ? this.options.addWaypoints
        : true;
    this._clearLines();

    // add alternatives first so they lie below the main route
    this._alternatives = [];
    if (routes.alternatives) {
      routes.alternatives.forEach((alt: OSRMRoute, i: number) => {
        this._alternatives![i] = this.options.routeLine!(alt, {
          isAlternative: true,
          ...this.options.altLineOptions,
          ...this.options.lineOptions,
        } as any);
        this._alternatives![i].addTo((this as any)._map);
        this._hookAltEvents(this._alternatives![i]);
      });
    }

    this._line = this.options.routeLine!(routes.route, {
      addWaypoints: addWaypoints,
      extendToWaypoints: this.options.waypointMode === 'connect',
      ...this.options.lineOptions,
    } as any);
    this._line.addTo((this as any)._map);
    this._hookEvents(this._line);
  }

  private _hookEvents(l: Line): void {
    l.on(
      'linetouched',
      (e: any) => {
        if (e.afterIndex < this.getWaypoints().length - 1) {
          this._plan.dragNewWaypoint(e);
        }
      },
      this
    );
  }

  private _hookAltEvents(l: Line): void {
    l.on(
      'linetouched',
      (e: any) => {
        const alts = (this as any)._routes.slice();
        const selected = alts.splice(
          (e.target as any)._route.routesIndex,
          1
        )[0];
        (this as any).fire('routeselected', {
          route: selected,
          alternatives: alts,
        });
      },
      this
    );
  }

  private _onWaypointsChanged(e: { waypoints: Waypoint[] }): void {
    if (this.options.autoRoute) {
      this.route({});
    }
    if (!this._plan.isReady()) {
      this._clearLines();
      (this as any)._clearAlts();
    }
    (this as any).fire('waypointschanged', { waypoints: e.waypoints });
  }

  private _setupRouteDragging(): void {
    let timer: any = 0;
    let waypoints: Waypoint[];

    (this._plan as any).on(
      'waypointdrag',
      (e: any) => {
        waypoints = e.waypoints;

        if (!timer) {
          timer = setTimeout(() => {
            this.route({
              waypoints: waypoints,
              geometryOnly: true,
              callback: this._updateLineCallback.bind(this),
            });
            timer = undefined;
          }, this.options.routeDragInterval);
        }
      },
      this
    );

    (this._plan as any).on(
      'waypointdragend',
      () => {
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
        this.route();
      },
      this
    );
  }

  private _updateLineCallback(err: any, routes: OSRMRoute[]): void {
    if (!err) {
      routes = routes.slice();
      const selected = routes.splice(
        (this._selectedRoute as any).routesIndex,
        1
      )[0];
      this._updateLines({
        route: selected,
        alternatives: this.options.showAlternatives ? routes : false,
      });
    } else if (err.type !== 'abort') {
      this._clearLines();
    }
  }

  route(options: any = {}): any {
    const ts = ++this._requestCount;

    if (this._pendingRequest && this._pendingRequest.abort) {
      this._pendingRequest.abort();
      this._pendingRequest = null;
    }

    if (this._plan.isReady()) {
      if (this.options.useZoomParameter) {
        options.z = (this as any)._map && (this as any)._map.getZoom();
      }

      const wps = (options && options.waypoints) || this._plan.getWaypoints();
      (this as any).fire('routingstart', { waypoints: wps });

      this._pendingRequest = this._router.route(
        wps,
        (err: any, routes: OSRMRoute[]) => {
          this._pendingRequest = null;

          if (options.callback) {
            return options.callback.call(this, err, routes);
          }

          // Prevent race among multiple requests,
          // by checking the current request's count
          // against the last request's; ignore result if
          // this isn't the last request.
          if (ts === this._requestCount) {
            this._clearLines();
            (this as any)._clearAlts();
            if (err && err.type !== 'abort') {
              (this as any).fire('routingerror', { error: err });
              return;
            }

            routes.forEach((route: OSRMRoute, i: number) => {
              (route as any).routesIndex = i;
            });

            if (!options.geometryOnly) {
              (this as any).fire('routesfound', {
                waypoints: wps,
                routes: routes,
              });
              this.setAlternatives(routes);
            } else {
              const selectedRoute = routes.splice(0, 1)[0];
              this._routeSelected({
                route: selectedRoute,
                alternatives: routes,
              });
            }
          }
        },
        this,
        options
      );
    }

    return this._pendingRequest;
  }

  private _clearLines(): void {
    if (this._line) {
      (this as any)._map.removeLayer(this._line);
      delete this._line;
    }
    if (this._alternatives && this._alternatives.length) {
      for (const alt of this._alternatives) {
        (this as any)._map.removeLayer(alt);
      }
      this._alternatives = [];
    }
  }
}
