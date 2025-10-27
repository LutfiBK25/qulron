import L from 'leaflet';

export interface AutocompleteOptions {
  timeout?: number;
  blurTimeout?: number;
  noResultsMessage?: string;
  attachResultsToContainer?: boolean;
  resultFn?: (
    query: string,
    callback: (results: any[]) => void,
    context: any
  ) => void;
  resultContext?: any;
  autocompleteFn?: (
    query: string,
    callback: (results: any[]) => void,
    context: any
  ) => void;
  autocompleteContext?: any;
  formatGeocoderResult?: (result: any) => Node;
}

export interface GeocoderResult {
  name: string;
  center: L.LatLng;
  [key: string]: any;
}

export class Autocomplete {
  options: AutocompleteOptions;
  private _elem: HTMLElement;
  private _resultFn:
    | ((
        query: string,
        callback: (results: any[]) => void,
        context: any
      ) => void)
    | null;
  private _autocomplete:
    | ((
        query: string,
        callback: (results: any[]) => void,
        context: any
      ) => void)
    | null;
  private _selectFn: (result: GeocoderResult) => void;
  private _container: HTMLElement;
  private _resultTable: HTMLTableElement;
  private _isOpen?: boolean;
  private _selection?: HTMLElement;
  private _results?: GeocoderResult[];
  private _timer?: any;
  private _lastCompletedText?: string;

  constructor(
    elem: HTMLElement,
    callback: (result: GeocoderResult) => void,
    context: any,
    options: AutocompleteOptions = {}
  ) {
    const defaultOptions: AutocompleteOptions = {
      timeout: 500,
      blurTimeout: 100,
      noResultsMessage: 'No results found.',
      attachResultsToContainer: false,
    };

    this.options = { ...defaultOptions, ...options };

    this._elem = elem;
    this._resultFn = options.resultFn
      ? options.resultFn.bind(options.resultContext)
      : null;
    this._autocomplete = options.autocompleteFn
      ? options.autocompleteFn.bind(options.autocompleteContext)
      : null;
    this._selectFn = callback.bind(context);
    this._container = L.DomUtil.create(
      'div',
      'leaflet-routing-geocoder-result',
      options.attachResultsToContainer
        ? this._elem.parentElement || undefined
        : undefined
    );
    this._resultTable = L.DomUtil.create(
      'table',
      '',
      this._container
    ) as HTMLTableElement;

    // TODO: looks a bit like a kludge to register same for input and keypress -
    // browsers supporting both will get duplicate events; just registering
    // input will not catch enter, though.
    L.DomEvent.addListener(this._elem, 'input', this._keyPressed as any, this);
    L.DomEvent.addListener(
      this._elem,
      'keypress',
      this._keyPressed as any,
      this
    );
    L.DomEvent.addListener(this._elem, 'keydown', this._keyDown as any, this);
    L.DomEvent.addListener(
      this._elem,
      'blur',
      () => {
        if (this._isOpen) {
          this.close();
        }
      },
      this
    );
  }

  close(): void {
    L.DomUtil.removeClass(
      this._container,
      'leaflet-routing-geocoder-result-open'
    );
    if (this.options.attachResultsToContainer) {
      this._container.style.position = 'absolute';
    }
    this._isOpen = false;
  }

  private _open(): void {
    const rect = this._elem.getBoundingClientRect();
    if (!this._container.parentElement) {
      // See notes section under https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX
      // This abomination is required to support all flavors of IE
      const scrollX =
        window.pageXOffset !== undefined
          ? window.pageXOffset
          : (
              document.documentElement ||
              document.body.parentNode ||
              document.body
            ).scrollLeft;
      const scrollY =
        window.pageYOffset !== undefined
          ? window.pageYOffset
          : (
              document.documentElement ||
              document.body.parentNode ||
              document.body
            ).scrollTop;
      this._container.style.left = rect.left + scrollX + 'px';
      this._container.style.top = rect.bottom + scrollY + 'px';
      this._container.style.width = rect.right - rect.left + 'px';
      document.body.appendChild(this._container);
    } else if (this.options.attachResultsToContainer) {
      this._container.style.position = 'relative';
    }

    L.DomUtil.addClass(this._container, 'leaflet-routing-geocoder-result-open');
    this._isOpen = true;
  }

  private _setResults(results: GeocoderResult[]): void {
    delete this._selection;
    this._results = results;

    while (this._resultTable.firstChild) {
      this._resultTable.removeChild(this._resultTable.firstChild);
    }

    for (let i = 0; i < results.length; i++) {
      const tr = L.DomUtil.create('tr', '', this._resultTable);
      tr.setAttribute('data-result-index', i.toString());
      const td = L.DomUtil.create('td', '', tr);

      let text: Node;
      if (this.options.formatGeocoderResult) {
        text = this.options.formatGeocoderResult(results[i]);
      } else {
        text = document.createTextNode(results[i].name);
      }

      td.appendChild(text);
      // mousedown + click because:
      // http://stackoverflow.com/questions/10652852/jquery-fire-click-before-blur-event
      L.DomEvent.addListener(td, 'mousedown', L.DomEvent.preventDefault);
      L.DomEvent.addListener(
        td,
        'click',
        this._createClickListener(results[i])
      );
    }

    if (!results.length) {
      const tr = L.DomUtil.create('tr', '', this._resultTable);
      const td = L.DomUtil.create(
        'td',
        'leaflet-routing-geocoder-no-results',
        tr
      );
      td.innerHTML = this.options.noResultsMessage || 'No results found.';
    }

    this._open();

    if (results.length > 0) {
      // Select the first entry
      this._select(1);
    }
  }

  private _createClickListener(r: GeocoderResult): () => void {
    const resultSelected = this._resultSelected(r);
    return () => {
      (this._elem as HTMLInputElement).blur();
      resultSelected();
    };
  }

  private _resultSelected(r: GeocoderResult): () => void {
    return () => {
      this.close();
      (this._elem as HTMLInputElement).value = r.name;
      this._lastCompletedText = r.name;
      this._selectFn(r);
    };
  }

  private _keyPressed(e: KeyboardEvent): void {
    if (this._isOpen && e.keyCode === 13 && this._selection) {
      const index = parseInt(
        this._selection.getAttribute('data-result-index') || '0',
        10
      );
      this._resultSelected(this._results![index])();
      L.DomEvent.preventDefault(e);
      return;
    }

    if (e.keyCode === 13) {
      L.DomEvent.preventDefault(e);
      this._complete(this._resultFn, true);
      return;
    }

    if (this._autocomplete && document.activeElement === this._elem) {
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timer = setTimeout(() => {
        this._complete(this._autocomplete);
      }, this.options.timeout);
      return;
    }

    this._unselect();
  }

  private _select(dir: number): void {
    let sel = this._selection;
    if (sel) {
      L.DomUtil.removeClass(
        sel.firstChild as HTMLElement,
        'leaflet-routing-geocoder-selected'
      );
      sel = (sel as any)[dir > 0 ? 'nextSibling' : 'previousSibling'];
    }
    if (!sel) {
      sel = (this._resultTable as any)[dir > 0 ? 'firstChild' : 'lastChild'];
    }

    if (sel) {
      L.DomUtil.addClass(
        sel.firstChild as HTMLElement,
        'leaflet-routing-geocoder-selected'
      );
      this._selection = sel;
    }
  }

  private _unselect(): void {
    if (this._selection) {
      L.DomUtil.removeClass(
        this._selection.firstChild as HTMLElement,
        'leaflet-routing-geocoder-selected'
      );
    }
    delete this._selection;
  }

  private _keyDown(e: KeyboardEvent): void {
    if (this._isOpen) {
      switch (e.keyCode) {
        // Escape
        case 27:
          this.close();
          L.DomEvent.preventDefault(e);
          return;
        // Up
        case 38:
          this._select(-1);
          L.DomEvent.preventDefault(e);
          return;
        // Down
        case 40:
          this._select(1);
          L.DomEvent.preventDefault(e);
          return;
      }
    }
  }

  private _complete(
    completeFn:
      | ((
          query: string,
          callback: (results: any[]) => void,
          context: any
        ) => void)
      | null,
    trySelect?: boolean
  ): void {
    const v = (this._elem as HTMLInputElement).value;
    const completeResults = (results: GeocoderResult[]) => {
      this._lastCompletedText = v;
      if (trySelect && results.length === 1) {
        this._resultSelected(results[0])();
      } else {
        this._setResults(results);
      }
    };

    if (!v) {
      return;
    }

    if (v !== this._lastCompletedText) {
      completeFn?.(v, completeResults.bind(this), this);
    } else if (trySelect) {
      completeResults.call(this, this._results || []);
    }
  }
}
