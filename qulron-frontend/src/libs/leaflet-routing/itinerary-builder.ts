import L from 'leaflet';

export interface ItineraryBuilderOptions {
  containerClassName?: string;
}

export class ItineraryBuilder {
  options: ItineraryBuilderOptions;

  constructor(options: ItineraryBuilderOptions = {}) {
    this.options = options;
  }

  createContainer(className?: string): HTMLTableElement {
    const table = L.DomUtil.create(
      'table',
      `${className || ''} ${this.options.containerClassName || ''}`
    ) as HTMLTableElement;
    const colgroup = L.DomUtil.create('colgroup', '', table);

    L.DomUtil.create('col', 'leaflet-routing-instruction-icon', colgroup);
    L.DomUtil.create('col', 'leaflet-routing-instruction-text', colgroup);
    L.DomUtil.create('col', 'leaflet-routing-instruction-distance', colgroup);

    return table;
  }

  createStepsContainer(): HTMLTableSectionElement {
    return L.DomUtil.create('tbody', '') as HTMLTableSectionElement;
  }

  createStep(
    text: string,
    distance: string,
    icon: string,
    steps: HTMLTableSectionElement
  ): HTMLTableRowElement {
    const row = L.DomUtil.create('tr', '', steps) as HTMLTableRowElement;

    let td = L.DomUtil.create('td', '', row);
    const span = L.DomUtil.create(
      'span',
      `leaflet-routing-icon leaflet-routing-icon-${icon}`,
      td
    );
    td.appendChild(span);

    td = L.DomUtil.create('td', '', row);
    td.appendChild(document.createTextNode(text));

    td = L.DomUtil.create('td', '', row);
    td.appendChild(document.createTextNode(distance));

    return row;
  }
}
