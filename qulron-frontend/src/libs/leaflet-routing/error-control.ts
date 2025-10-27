import L from 'leaflet';

export interface ErrorControlOptions extends L.ControlOptions {
  header?: string;
  formatMessage?: (error: { status: number; message: string }) => string;
}

export class ErrorControl extends L.Control {
  declare options: ErrorControlOptions;
  private _element?: HTMLElement;

  constructor(routingControl: any, options?: ErrorControlOptions) {
    super(options);

    const defaultOptions: ErrorControlOptions = {
      header: 'Routing error',
      formatMessage: function (error: {
        status: number;
        message: string;
      }): string {
        if (error.status < 0) {
          return (
            'Calculating the route caused an error. Technical description follows: <code><pre>' +
            error.message +
            '</pre></code>'
          );
        } else {
          return 'The route could not be calculated. ' + error.message;
        }
      },
    };

    this.options = { ...defaultOptions, ...options };

    routingControl
      .on(
        'routingerror',
        (e: { error: { status: number; message: string } }) => {
          if (this._element && this._element.children[1]) {
            (this._element.children[1] as HTMLElement).innerHTML = this.options
              .formatMessage!(e.error);
            this._element.style.visibility = 'visible';
          }
        },
        this
      )
      .on(
        'routingstart',
        () => {
          if (this._element) {
            this._element.style.visibility = 'hidden';
          }
        },
        this
      );
  }

  override onAdd(): HTMLElement {
    this._element = L.DomUtil.create(
      'div',
      'leaflet-bar leaflet-routing-error'
    );
    this._element.style.visibility = 'hidden';

    const header = L.DomUtil.create('h3', '', this._element);
    const message = L.DomUtil.create('span', '', this._element);

    header.innerHTML = this.options.header || 'Routing error';

    return this._element;
  }

  override onRemove(): void {
    delete this._element;
  }
}
