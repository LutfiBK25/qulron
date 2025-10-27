import L from 'leaflet';
import { Formatter } from './formatter';
import { ItineraryBuilder } from './itinerary-builder';

export interface ItineraryOptions extends L.ControlOptions {
  pointMarkerStyle?: {
    radius: number;
    color: string;
    fillColor: string;
    opacity: number;
    fillOpacity: number;
  };
  summaryTemplate?: string | ((data: any) => string);
  timeTemplate?: string;
  containerClassName?: string;
  alternativeClassName?: string;
  minimizedClassName?: string;
  itineraryClassName?: string;
  totalDistanceRoundingSensitivity?: number;
  show?: boolean;
  collapsible?: boolean;
  collapseBtn?: (itinerary: Itinerary) => void;
  collapseBtnClass?: string;
  formatter?: Formatter;
  itineraryBuilder?: ItineraryBuilder;
  position?: L.ControlPosition;
}

export interface RouteData {
  name: string;
  summary: {
    totalDistance: number;
    totalTime: number;
  };
  instructions: Array<{
    distance: number;
    index?: number;
  }>;
  coordinates: L.LatLng[];
  routesIndex?: number;
}

export class Itinerary extends L.Control {
  declare options: ItineraryOptions;

  // Event mixin functionality (for compatibility with original JS implementation)
  includes =
    (typeof L.Evented !== 'undefined' && L.Evented.prototype) ||
    (L as any).Mixin.Events;

  private _formatter: Formatter;
  private _itineraryBuilder: ItineraryBuilder;
  private _container!: HTMLElement;
  private _altContainer!: HTMLElement;
  private _altElements: HTMLElement[] = [];
  private _routes: RouteData[] = [];
  private _marker?: L.CircleMarker;
  private _map!: L.Map;

  constructor(options?: ItineraryOptions) {
    super(options);

    // Initialize event functionality using Leaflet's standard mixin approach
    L.Util.extend(this, L.Evented.prototype);

    // Initialize the _events object that Leaflet uses internally
    (this as any)._events = {};

    const defaultOptions: ItineraryOptions = {
      pointMarkerStyle: {
        radius: 5,
        color: '#03f',
        fillColor: 'white',
        opacity: 1,
        fillOpacity: 0.7,
      },
      summaryTemplate: '<h2>{name}</h2><h3>{distance}, {time}</h3>',
      timeTemplate: '{time}',
      containerClassName: '',
      alternativeClassName: '',
      minimizedClassName: '',
      itineraryClassName: '',
      totalDistanceRoundingSensitivity: -1,
      show: true,
      collapsible: undefined,
      collapseBtn: function (itinerary: Itinerary) {
        const collapseBtn = L.DomUtil.create(
          'span',
          itinerary.options.collapseBtnClass || ''
        );
        L.DomEvent.on(collapseBtn, 'click', itinerary._toggle, itinerary);
        itinerary._container.insertBefore(
          collapseBtn,
          itinerary._container.firstChild
        );
      },
      collapseBtnClass: 'leaflet-routing-collapse-btn',
      position: 'topleft',
    };

    // Use Leaflet's setOptions to properly merge options like the original JS
    L.Util.setOptions(this, { ...defaultOptions, ...options });
    this._formatter =
      this.options.formatter || new Formatter(this.options as any);
    this._itineraryBuilder =
      this.options.itineraryBuilder ||
      new ItineraryBuilder({
        containerClassName: this.options.itineraryClassName,
      });
  }

  override onAdd(map: L.Map): HTMLElement {
    this._map = map;
    let collapsible = this.options.collapsible;

    collapsible =
      collapsible || (collapsible === undefined && map.getSize().x <= 640);

    this._container = L.DomUtil.create(
      'div',
      'leaflet-routing-container leaflet-bar ' +
        (!this.options.show ? 'leaflet-routing-container-hide ' : '') +
        (collapsible ? 'leaflet-routing-collapsible ' : '') +
        (this.options.containerClassName || '')
    );

    this._altContainer = this.createAlternativesContainer();
    this._container.appendChild(this._altContainer);
    L.DomEvent.disableClickPropagation(this._container);
    L.DomEvent.addListener(this._container, 'mousewheel', function (e: Event) {
      L.DomEvent.stopPropagation(e);
    });

    if (collapsible && this.options.collapseBtn) {
      this.options.collapseBtn(this);
    }

    return this._container;
  }

  override onRemove(): void {
    // Cleanup if needed
  }

  createAlternativesContainer(): HTMLElement {
    return L.DomUtil.create('div', 'leaflet-routing-alternatives-container');
  }

  setAlternatives(routes: RouteData[]): this {
    this._clearAlts();
    this._routes = routes;

    for (let i = 0; i < this._routes.length; i++) {
      const alt = this._routes[i];
      const altDiv = this._createAlternative(alt, i);
      this._altContainer.appendChild(altDiv);
      this._altElements.push(altDiv);
    }

    this._selectRoute({
      route: this._routes[0],
      alternatives: this._routes.slice(1),
    });

    return this;
  }

  show(): void {
    L.DomUtil.removeClass(this._container, 'leaflet-routing-container-hide');
  }

  hide(): void {
    L.DomUtil.addClass(this._container, 'leaflet-routing-container-hide');
  }

  private _toggle(): void {
    const collapsed = L.DomUtil.hasClass(
      this._container,
      'leaflet-routing-container-hide'
    );
    this[collapsed ? 'show' : 'hide']();
  }

  private _createAlternative(alt: RouteData, i: number): HTMLElement {
    const altDiv = L.DomUtil.create(
      'div',
      'leaflet-routing-alt ' +
        (this.options.alternativeClassName || '') +
        (i > 0
          ? ' leaflet-routing-alt-minimized ' +
            (this.options.minimizedClassName || '')
          : '')
    );

    const template = this.options.summaryTemplate;
    const data = {
      distance: this._formatter.formatDistance(
        alt.summary.totalDistance,
        this.options.totalDistanceRoundingSensitivity
      ),
      time: this._formatter.formatTime(alt.summary.totalTime),
      ...alt,
    };

    if (typeof template === 'function') {
      altDiv.innerHTML = template(data);
    } else if (template) {
      altDiv.innerHTML = L.Util.template(template, data);
    }

    L.DomEvent.addListener(altDiv, 'click', this._onAltClicked, this);
    (this as any).on('routeselected', this._selectAlt, this);

    altDiv.appendChild(this._createItineraryContainer(alt));
    return altDiv;
  }

  private _clearAlts(): void {
    const el = this._altContainer;
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
    this._altElements = [];
  }

  private _createItineraryContainer(r: RouteData): HTMLElement {
    const container = this._itineraryBuilder.createContainer();
    const steps = this._itineraryBuilder.createStepsContainer();

    container.appendChild(steps);

    for (let i = 0; i < r.instructions.length; i++) {
      const instr = r.instructions[i];
      const text = this._formatter.formatInstruction(instr, i);
      const distance = this._formatter.formatDistance(instr.distance);
      const icon = this._formatter.getIconName(instr, i);
      const step = this._itineraryBuilder.createStep(
        text,
        distance,
        icon,
        steps
      );

      if (instr.index !== undefined) {
        this._addRowListeners(step, r.coordinates[instr.index]);
      }
    }

    return container;
  }

  private _addRowListeners(row: HTMLElement, coordinate: L.LatLng): void {
    L.DomEvent.addListener(
      row,
      'mouseover',
      () => {
        if (this.options.pointMarkerStyle) {
          this._marker = L.circleMarker(
            coordinate,
            this.options.pointMarkerStyle
          ).addTo(this._map);
        }
      },
      this
    );

    L.DomEvent.addListener(
      row,
      'mouseout',
      () => {
        if (this._marker) {
          this._map.removeLayer(this._marker);
          delete this._marker;
        }
      },
      this
    );

    L.DomEvent.addListener(
      row,
      'click',
      (e: Event) => {
        this._map.panTo(coordinate);
        L.DomEvent.stopPropagation(e);
      },
      this
    );
  }

  private _onAltClicked(e: Event): void {
    let altElem = e.target as HTMLElement;
    if (!altElem) return;

    while (!L.DomUtil.hasClass(altElem, 'leaflet-routing-alt')) {
      if (!altElem.parentElement) return;
      altElem = altElem.parentElement;
    }

    const j = this._altElements.indexOf(altElem);
    const alts = this._routes.slice();
    const route = alts.splice(j, 1)[0];

    (this as any).fire('routeselected', {
      route: route,
      alternatives: alts,
    });
  }

  private _selectAlt(e: { route: RouteData }): void {
    if (e.route.routesIndex === undefined) return;

    const altElem = this._altElements[e.route.routesIndex];

    if (L.DomUtil.hasClass(altElem, 'leaflet-routing-alt-minimized')) {
      for (let j = 0; j < this._altElements.length; j++) {
        const n = this._altElements[j];
        const classFn = j === e.route.routesIndex ? 'removeClass' : 'addClass';
        L.DomUtil[classFn](n, 'leaflet-routing-alt-minimized');

        if (this.options.minimizedClassName) {
          L.DomUtil[classFn](n, this.options.minimizedClassName);
        }

        if (j !== e.route.routesIndex) {
          n.scrollTop = 0;
        }
      }
    }

    L.DomEvent.stop(e as any);
  }

  private _selectRoute(routes: {
    route: RouteData;
    alternatives: RouteData[];
  }): void {
    if (this._marker) {
      this._map.removeLayer(this._marker);
      delete this._marker;
    }
    (this as any).fire('routeselected', routes);
  }
}
