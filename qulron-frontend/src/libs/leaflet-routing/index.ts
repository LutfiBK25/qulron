import L from 'leaflet';

import { Control } from './control';
import { Itinerary } from './itinerary';
import { Line } from './line';
import { OSRMv1 } from './osrm-v1';
import { Plan } from './plan';
import { Waypoint } from './waypoint';
import { Autocomplete } from './autocomplete';
import { Formatter } from './formatter';
import { GeocoderElement } from './geocoder-element';
import { Localization } from './localization';
import { ItineraryBuilder } from './itinerary-builder';
import { ErrorControl } from './error-control';

// Extend Leaflet namespace without conflicts
declare module 'leaflet' {
  namespace Routing {
    class RoutingControl extends Control {}
    class RoutingItinerary extends Itinerary {}
    class RoutingLine extends Line {}
    class RoutingOSRMv1 extends OSRMv1 {}
    class RoutingPlan extends Plan {}
    class RoutingWaypoint extends Waypoint {}
    class RoutingAutocomplete extends Autocomplete {}
    class RoutingFormatter extends Formatter {}
    class RoutingGeocoderElement extends GeocoderElement {}
    class RoutingLocalization extends Localization {}
    class RoutingItineraryBuilder extends ItineraryBuilder {}
    class RoutingErrorControl extends ErrorControl {}
  }

  namespace routing {
    function control(options?: any): Control;
    function itinerary(options?: any): Itinerary;
    function line(route: any, options?: any): Line;
    function plan(waypoints: any[], options?: any): Plan;
    function waypoint(latLng: L.LatLng, name?: string, options?: any): Waypoint;
    function osrmv1(options?: any): OSRMv1;
    function localization(langs: string | string[]): Localization;
    function formatter(options?: any): Formatter;
    function geocoderElement(
      wp: any,
      i: number,
      nWps: number,
      plan: any
    ): GeocoderElement;
    function itineraryBuilder(options?: any): ItineraryBuilder;
    function errorControl(routingControl: any, options?: any): ErrorControl;
    function autocomplete(
      elem: any,
      callback: any,
      context: any,
      options?: any
    ): Autocomplete;
  }
}

// Attach factory functions to L.routing namespace
(L as any).routing = {
  control: (options?: any) => new Control(options),
  itinerary: (options?: any) => new Itinerary(options),
  line: (route: any, options?: any) => new Line(route, options),
  plan: (waypoints?: any[], options?: any) => new Plan(waypoints, options),
  waypoint: (latLng: L.LatLng, name?: string, options?: any) =>
    new Waypoint(latLng, name, options),
  osrmv1: (options?: any, routingService?: any) =>
    new OSRMv1(options, routingService),
  localization: (langs: string | string[]) => new Localization(langs),
  formatter: (options?: any) => new Formatter(options),
  geocoderElement: (wp: any, i: number, nWps: number, plan: any) =>
    new GeocoderElement(wp, i, nWps, plan),
  itineraryBuilder: (options?: any) => new ItineraryBuilder(options),
  errorControl: (routingControl: any, options?: any) =>
    new ErrorControl(routingControl, options),
  autocomplete: (elem: any, callback: any, context: any, options?: any) =>
    new Autocomplete(elem, callback, context, options),
};

// Attach classes to L.Routing namespace
(L as any).Routing = {
  Control,
  Itinerary,
  Line,
  OSRMv1,
  Plan,
  Waypoint,
  Autocomplete,
  Formatter,
  GeocoderElement,
  Localization,
  ItineraryBuilder,
  ErrorControl,

  // Legacy factory functions for backward compatibility
  control: (L as any).routing.control,
  itinerary: (L as any).routing.itinerary,
  line: (L as any).routing.line,
  plan: (L as any).routing.plan,
  waypoint: (L as any).routing.waypoint,
  osrmv1: (L as any).routing.osrmv1,
  localization: (L as any).routing.localization,
  formatter: (L as any).routing.formatter,
  geocoderElement: (L as any).routing.geocoderElement,
  itineraryBuilder: (L as any).routing.itineraryBuilder,
  errorControl: (L as any).routing.errorControl,
  autocomplete: (L as any).routing.autocomplete,
};

// Main exports for ES6 module usage
export {
  Control,
  Itinerary,
  Line,
  OSRMv1,
  Plan,
  Waypoint,
  Autocomplete,
  Formatter,
  GeocoderElement,
  Localization,
  ItineraryBuilder,
  ErrorControl,
};

// Default export for convenience
export default {
  Control,
  Itinerary,
  Line,
  OSRMv1,
  Plan,
  Waypoint,
  Autocomplete,
  Formatter,
  GeocoderElement,
  Localization,
  ItineraryBuilder,
  ErrorControl,
};
