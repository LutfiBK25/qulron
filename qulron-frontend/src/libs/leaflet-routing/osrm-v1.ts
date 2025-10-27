import L from 'leaflet';
import { Waypoint } from './waypoint';

// @ts-ignore - Suppress TypeScript errors for these untyped modules
import corslite from '@mapbox/corslite';
// @ts-ignore
import * as polyline from '@mapbox/polyline';
// @ts-ignore
import osrmTextInstructionsFactory from 'osrm-text-instructions';
import { RoutingService } from '../../app/core/service/routing.service';

// Initialize OSRM text instructions
const osrmTextInstructions = osrmTextInstructionsFactory('v5');

export interface OSRMv1Options {
  serviceUrl?: string;
  profile?: string;
  timeout?: number;
  routingOptions?: {
    alternatives?: boolean;
    steps?: boolean;
  };
  polylinePrecision?: number;
  useHints?: boolean;
  suppressDemoServerWarning?: boolean;
  language?: string;
  requestParameters?: { [key: string]: any };
  stepToText?: (step: any, options: any) => string;
}

export interface OSRMRoute {
  name: string;
  coordinates: L.LatLng[];
  instructions: OSRMInstruction[];
  summary: {
    totalDistance: number;
    totalTime: number;
  };
  inputWaypoints?: Waypoint[];
  waypoints?: Waypoint[];
  waypointIndices?: number[];
  properties?: {
    isSimplified: boolean;
  };
}

export interface OSRMInstruction {
  type: string;
  distance: number;
  time: number;
  road: string;
  direction: string;
  exit?: number;
  index: number;
  mode: string;
  modifier: string;
  text: string;
}

export interface OSRMResponse {
  code: string;
  routes: any[];
  waypoints: any[];
}

export interface OSRMError {
  status: number;
  message: string;
  url?: string;
  target?: any;
  type?: string;
}

/**
 * Works against OSRM's new API in version 5.0; this has
 * the API version v1.
 */
export class OSRMv1 {
  options: OSRMv1Options;
  private _hints: {
    locations: { [key: string]: string };
  };
  private routingService: RoutingService;

  constructor(options: OSRMv1Options = {}, routingService: RoutingService) {
    const defaultOptions: OSRMv1Options = {
      serviceUrl: '',
      profile: 'driving',
      timeout: 30 * 1000,
      routingOptions: {
        alternatives: true,
        steps: true,
      },
      polylinePrecision: 5,
      useHints: true,
      suppressDemoServerWarning: false,
      language: 'en',
    };

    this.options = { ...defaultOptions, ...options };
    this.routingService = routingService;
    this._hints = {
      locations: {},
    };

    // warn about demo server usage
    if (
      !this.options.suppressDemoServerWarning &&
      this.options.serviceUrl!.indexOf('//router.project-osrm.org') >= 0
    ) {
      console.warn(
        "You are using OSRM's demo server. " +
          'Please note that it is **NOT SUITABLE FOR PRODUCTION USE**.\\n' +
          "Refer to the demo server's usage policy: " +
          'https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy\\n\\n' +
          'To change, set the serviceUrl option.\\n\\n' +
          'Please do not report issues with this server to neither ' +
          "Leaflet Routing Machine or OSRM - it's for\\n" +
          'demo only, and will sometimes not be available, or work in ' +
          'unexpected ways.\\n\\n' +
          'Please set up your own OSRM server, or use a paid service ' +
          'provider for production.'
      );
    }
  }

  // main routing function
  route(
    waypoints: Waypoint[],
    callback: (error: OSRMError | null, routes?: OSRMRoute[]) => void,
    context?: any,
    options: any = {}
  ): any {
    console.log('Route has been called from osrm-v1');
    // Initialize variables
    let timedOut = false;
    const wps: Waypoint[] = [];
    let url: string;
    let timer: any;

    // merge options
    options = { ...this.options.routingOptions, ...options };

    // build the request URL
    url = this.buildRouteUrl(waypoints, options);

    // add request parameters if any
    if (this.options.requestParameters) {
      url += L.Util.getParamString(this.options.requestParameters, url);
    }

    // set up the timeout before we send the request
    timer = setTimeout(() => {
      timedOut = true;
      callback.call(context || callback, {
        status: -1,
        message: 'OSRM request timed out.',
      });
    }, this.options.timeout);

    // Create a copy of the waypoints, since they
    // might otherwise be asynchronously modified while
    // the request is being processed.
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      wps.push(new Waypoint(wp.latLng, wp.name, wp.options));
    }

    // Convert waypoints to the format expected by the routing service
    const routingWaypoints = wps.map((wp) => ({
      lat: wp.latLng!.lat,
      lng: wp.latLng!.lng,
    }));

    this.routingService
      .calculateRoute({
        waypoints: routingWaypoints,
        profile: this.options.profile!,
      })
      .subscribe({
        next: (data: any) => {
          // Clear the timeout, request is completed
          clearTimeout(timer);
          if (!timedOut) {
            console.log('Routing service response:', data);
            try {
              // process response
              this._routeDone(data, wps, options, callback, context);
            } catch (ex: any) {
              const error: OSRMError = {
                status: -3,
                message: ex.toString(),
              };
              callback.call(context || callback, error);
            }
          }
        },
        error: (err: any) => {
          // Clear the timeout, request is completed
          clearTimeout(timer);
          if (!timedOut) {
            const error: OSRMError = {
              status: -1,
              message:
                'Routing service request failed: ' +
                (err.message || err.toString()),
            };
            callback.call(context || callback, error);
          }
        },
      });
  }

  // check if we need more detail
  requiresMoreDetail(
    route: OSRMRoute,
    zoom: number,
    bounds: L.LatLngBounds
  ): boolean {
    if (!route.properties?.isSimplified) {
      return false;
    }

    const waypoints = route.inputWaypoints;
    if (waypoints) {
      for (let i = 0; i < waypoints.length; ++i) {
        if (waypoints[i].latLng && !bounds.contains(waypoints[i].latLng!)) {
          return true;
        }
      }
    }

    return false;
  }

  // Processes OSRM response, converts routes, saves hints, and calls the callback with results.
  private _routeDone(
    response: OSRMResponse,
    inputWaypoints: Waypoint[],
    options: any,
    callback: (error: OSRMError | null, routes?: OSRMRoute[]) => void,
    context?: any
  ): void {
    const alts: OSRMRoute[] = [];
    let actualWaypoints: Waypoint[];

    context = context || callback;
    if (response.code !== 'Ok') {
      callback.call(context, {
        status: response.code,
      } as any);
      return;
    }

    actualWaypoints = this._toWaypoints(inputWaypoints, response.waypoints);

    for (let i = 0; i < response.routes.length; i++) {
      const route = this._convertRoute(response.routes[i]);
      route.inputWaypoints = inputWaypoints;
      route.waypoints = actualWaypoints;
      route.properties = {
        isSimplified:
          !options || !options.geometryOnly || options.simplifyGeometry,
      };
      alts.push(route);
    }

    this._saveHintData(response.waypoints, inputWaypoints);

    callback.call(context, null, alts);
  }

  // - Converts OSRM route response to internal format:
  //   - Decodes geometry.
  //   - Extracts instructions.
  //   - Builds summary and waypoint indices.
  private _convertRoute(responseRoute: any): OSRMRoute {
    const result: OSRMRoute = {
      name: '',
      coordinates: [],
      instructions: [],
      summary: {
        totalDistance: responseRoute.distance,
        totalTime: responseRoute.duration,
      },
    };

    const legNames: string[] = [];
    const waypointIndices: number[] = [];
    let index = 0;
    const legCount = responseRoute.legs.length;
    const hasSteps = responseRoute.legs[0].steps.length > 0;

    let stepToText: (step: any, options: any) => string;
    if (this.options.stepToText) {
      stepToText = this.options.stepToText;
    } else {
      stepToText = (step: any, options: any) =>
        osrmTextInstructions.compile(
          this.options.language || 'en',
          step,
          options
        );
    }

    for (let i = 0; i < legCount; i++) {
      const leg = responseRoute.legs[i];
      legNames.push(
        leg.summary &&
          leg.summary.charAt(0).toUpperCase() + leg.summary.substring(1)
      );
      for (let j = 0; j < leg.steps.length; j++) {
        const step = leg.steps[j];
        const geometry = this._decodePolyline(step.geometry);
        result.coordinates.push(...geometry);
        const type = this._maneuverToInstructionType(
          step.maneuver,
          i === legCount - 1
        );
        const modifier = this._maneuverToModifier(step.maneuver);
        const text = stepToText(step, { legCount: legCount, legIndex: i });

        if (type) {
          if (
            (i === 0 && step.maneuver.type === 'depart') ||
            step.maneuver.type === 'arrive'
          ) {
            waypointIndices.push(index);
          }

          result.instructions.push({
            type: type,
            distance: step.distance,
            time: step.duration,
            road: step.name,
            direction: this._bearingToDirection(step.maneuver.bearing_after),
            exit: step.maneuver.exit,
            index: index,
            mode: step.mode,
            modifier: modifier,
            text: text,
          });
        }

        index += geometry.length;
      }
    }

    result.name = legNames.join(', ');
    if (!hasSteps) {
      result.coordinates = this._decodePolyline(responseRoute.geometry);
    } else {
      result.waypointIndices = waypointIndices;
    }

    return result;
  }

  // Converts a bearing in degrees to one of the 8 cardinal and intercardinal directions.
  private _bearingToDirection(bearing: number): string {
    const oct = Math.round(bearing / 45) % 8;
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][oct];
  }

  // Converts OSRM maneuver to instruction type.(Maps OSRM maneuver types to instruction types.)
  private _maneuverToInstructionType(maneuver: any, lastLeg: boolean): string {
    switch (maneuver.type) {
      case 'new name':
        return 'Continue';
      case 'depart':
        return 'Head';
      case 'arrive':
        return lastLeg ? 'DestinationReached' : 'WaypointReached';
      case 'roundabout':
      case 'rotary':
        return 'Roundabout';
      case 'merge':
      case 'fork':
      case 'on ramp':
      case 'off ramp':
      case 'end of road':
        return this._camelCase(maneuver.type);
      // These are all reduced to the same instruction in the current model
      //case 'turn':
      //case 'ramp': // deprecated in v5.1
      default:
        return this._camelCase(maneuver.modifier);
    }
  }

  // Maps OSRM maneuver modifiers to internal format.
  private _maneuverToModifier(maneuver: any): string {
    let modifier = maneuver.modifier;

    switch (maneuver.type) {
      case 'merge':
      case 'fork':
      case 'on ramp':
      case 'off ramp':
      case 'end of road':
        modifier = this._leftOrRight(modifier);
    }

    return modifier && this._camelCase(modifier);
  }

  private _camelCase(s: string): string {
    const words = s.split(' ');
    let result = '';
    for (let i = 0, l = words.length; i < l; i++) {
      result += words[i].charAt(0).toUpperCase() + words[i].substring(1);
    }
    return result;
  }

  private _leftOrRight(d: string): string {
    return d.indexOf('left') >= 0 ? 'Left' : 'Right';
  }

  private _decodePolyline(routeGeometry: string): L.LatLng[] {
    const cs = polyline.decode(routeGeometry, this.options.polylinePrecision);
    const result = new Array(cs.length);
    for (let i = cs.length - 1; i >= 0; i--) {
      result[i] = L.latLng(cs[i][0], cs[i][1]);
    }
    return result;
  }

  private _toWaypoints(inputWaypoints: Waypoint[], vias: any[]): Waypoint[] {
    const wps: Waypoint[] = [];
    for (let i = 0; i < vias.length; i++) {
      const viaLoc = vias[i].location;
      wps.push(
        new Waypoint(
          L.latLng(viaLoc[1], viaLoc[0]),
          inputWaypoints[i].name,
          inputWaypoints[i].options
        )
      );
    }
    return wps;
  }

  // build the request URL
  buildRouteUrl(waypoints: Waypoint[], options: any): string {
    const locs: string[] = [];
    const hints: string[] = [];
    const computeAlternative = true;

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const latLng = wp.latLng;
      if (latLng) {
        locs.push(latLng.lng + ',' + latLng.lat);
        hints.push(this._hints.locations[this._locationKey(latLng)] || '');
      }
    }

    const computeInstructions = true;

    return (
      this.options.serviceUrl +
      '/' +
      this.options.profile +
      '/' +
      locs.join(';') +
      '?' +
      (options.geometryOnly
        ? options.simplifyGeometry
          ? ''
          : 'overview=full'
        : 'overview=false') +
      '&alternatives=' +
      computeAlternative.toString() +
      '&steps=' +
      computeInstructions.toString() +
      (this.options.useHints ? '&hints=' + hints.join(';') : '') +
      (options.allowUTurns ? '&continue_straight=' + !options.allowUTurns : '')
    );
  }

  private _locationKey(location: L.LatLng): string {
    return location.lat + ',' + location.lng;
  }

  private _saveHintData(actualWaypoints: any[], waypoints: Waypoint[]): void {
    this._hints = {
      locations: {},
    };
    for (let i = actualWaypoints.length - 1; i >= 0; i--) {
      const loc = waypoints[i].latLng;
      if (loc) {
        this._hints.locations[this._locationKey(loc)] = actualWaypoints[i].hint;
      }
    }
  }
}
