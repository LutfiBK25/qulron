import L from 'leaflet';
import { Autocomplete, GeocoderResult } from './autocomplete';
import { Localization } from './localization';
import { Waypoint } from './waypoint';

function selectInputText(input: HTMLInputElement): void {
  if (input.setSelectionRange) {
    // On iOS, select() doesn't work
    input.setSelectionRange(0, 9999);
  } else {
    // On at least IE8, setSelectionRange doesn't exist
    input.select();
  }
}

export interface GeocoderElementOptions {
  createGeocoder?: (
    i: number,
    nWps: number,
    options: GeocoderElementOptions
  ) => {
    container: HTMLElement;
    input: HTMLInputElement;
    closeButton?: HTMLElement;
  };
  geocoderPlaceholder?: (
    i: number,
    numberWaypoints: number,
    geocoderElement: GeocoderElement
  ) => string;
  geocoderClass?: (i: number, nWps: number) => string;
  waypointNameFallback?: (latLng: L.LatLng) => string;
  maxGeocoderTolerance?: number;
  autocompleteOptions?: any;
  language?: string;
  addWaypoints?: boolean;
  geocoder?: {
    geocode?: (
      query: string,
      callback: (results: any[]) => void,
      context: any
    ) => void;
    suggest?: (
      query: string,
      callback: (results: any[]) => void,
      context: any
    ) => void;
    reverse?: (
      latLng: L.LatLng,
      scale: number,
      callback: (results: any[]) => void,
      context: any
    ) => void;
  };
  formatGeocoderResult?: (result: any) => Node;
}

export class GeocoderElement {
  options: GeocoderElementOptions;
  private _element: {
    container: HTMLElement;
    input: HTMLInputElement;
    closeButton?: HTMLElement;
  };
  private _waypoint: Waypoint;

  // Event mixin functionality (for compatibility with original JS implementation)
  includes =
    (typeof L.Evented !== 'undefined' && L.Evented.prototype) ||
    (L as any).Mixin.Events;

  constructor(
    wp: Waypoint,
    i: number,
    nWps: number,
    options: GeocoderElementOptions = {}
  ) {
    const defaultOptions: GeocoderElementOptions = {
      createGeocoder: function (
        i: number,
        nWps: number,
        options: GeocoderElementOptions
      ) {
        const container = L.DomUtil.create('div', 'leaflet-routing-geocoder');
        const input = L.DomUtil.create(
          'input',
          '',
          container
        ) as HTMLInputElement;
        const remove = options.addWaypoints
          ? L.DomUtil.create(
              'span',
              'leaflet-routing-remove-waypoint',
              container
            )
          : undefined;

        input.disabled = !options.addWaypoints;

        return {
          container: container,
          input: input,
          closeButton: remove,
        };
      },
      geocoderPlaceholder: function (
        i: number,
        numberWaypoints: number,
        geocoderElement: GeocoderElement
      ): string {
        const l = new Localization(
          geocoderElement.options.language || 'en'
        ).localize('ui');
        return i === 0
          ? l.startPlaceholder
          : i < numberWaypoints - 1
          ? L.Util.template(l.viaPlaceholder, { viaNumber: i })
          : l.endPlaceholder;
      },
      geocoderClass: function (): string {
        return '';
      },
      waypointNameFallback: function (latLng: L.LatLng): string {
        const ns = latLng.lat < 0 ? 'S' : 'N';
        const ew = latLng.lng < 0 ? 'W' : 'E';
        const lat = (
          Math.round(Math.abs(latLng.lat) * 10000) / 10000
        ).toString();
        const lng = (
          Math.round(Math.abs(latLng.lng) * 10000) / 10000
        ).toString();
        return ns + lat + ', ' + ew + lng;
      },
      maxGeocoderTolerance: 200,
      autocompleteOptions: {},
      language: 'en',
    };

    this.options = { ...defaultOptions, ...options };

    const g = this.options.createGeocoder!(i, nWps, this.options);
    const closeButton = g.closeButton;
    const geocoderInput = g.input;

    geocoderInput.setAttribute(
      'placeholder',
      this.options.geocoderPlaceholder!(i, nWps, this)
    );
    geocoderInput.className = this.options.geocoderClass!(i, nWps);

    this._element = g;
    this._waypoint = wp;

    this.update();
    // This has to be here, or geocoder's value will not be properly
    // initialized.
    // TODO: look into why and make _updateWaypointName fix this.
    geocoderInput.value = wp.name || '';

    L.DomEvent.addListener(
      geocoderInput,
      'click',
      function (this: HTMLInputElement) {
        selectInputText(this);
      },
      geocoderInput
    );

    if (closeButton) {
      L.DomEvent.addListener(
        closeButton,
        'click',
        () => {
          (this as any).fire('delete', { waypoint: this._waypoint });
        },
        this
      );
    }

    if (typeof this.options.formatGeocoderResult === 'function') {
      this.options.autocompleteOptions.formatGeocoderResult =
        this.options.formatGeocoderResult;
    }

    if (this.options.geocoder) {
      new Autocomplete(
        geocoderInput,
        (r: GeocoderResult) => {
          geocoderInput.value = r.name;
          wp.name = r.name;
          wp.latLng = r.center;
          (this as any).fire('geocoded', { waypoint: wp, value: r });
        },
        this,
        {
          resultFn: this.options.geocoder.geocode,
          resultContext: this.options.geocoder,
          autocompleteFn: this.options.geocoder.suggest,
          autocompleteContext: this.options.geocoder,
          ...this.options.autocompleteOptions,
        }
      );
    }
  }

  getContainer(): HTMLElement {
    return this._element.container;
  }

  setValue(v: string): void {
    this._element.input.value = v;
  }

  update(force?: boolean): void {
    const wp = this._waypoint;

    wp.name = wp.name || '';

    if (wp.latLng && (force || !wp.name)) {
      const wpCoords = this.options.waypointNameFallback!(wp.latLng);
      if (this.options.geocoder && this.options.geocoder.reverse) {
        this.options.geocoder.reverse(
          wp.latLng,
          67108864 /* zoom 18 */,
          (rs: any[]) => {
            if (
              rs.length > 0 &&
              rs[0].center.distanceTo(wp.latLng) <
                this.options.maxGeocoderTolerance!
            ) {
              wp.name = rs[0].name;
            } else {
              wp.name = wpCoords;
            }
            this._update();
          },
          this
        );
      } else {
        wp.name = wpCoords;
        this._update();
      }
    }
  }

  focus(): void {
    const input = this._element.input;
    input.focus();
    selectInputText(input);
  }

  private _update(): void {
    const wp = this._waypoint;
    const value = wp && wp.name ? wp.name : '';
    this.setValue(value);
    (this as any).fire('reversegeocoded', { waypoint: wp, value: value });
  }
}
