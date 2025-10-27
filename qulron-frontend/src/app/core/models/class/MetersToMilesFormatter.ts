import {
  Formatter,
  FormatterOptions,
} from '../../../../libs/leaflet-routing/formatter';

export class MetersToMilesFormatter extends Formatter {
  constructor(options: Partial<FormatterOptions> = {}) {
    super({
      language: 'en',
      units: 'imperial',
      roundingSensitivity: 10,
      distanceTemplate: '{value} mi',
      ...options,
    });
  }

  override formatDistance(d: number): string {
    // d is in meters
    const feet = d * 3.28084;
    if (feet <= 1000) {
      // Round to nearest 100 ft
      const roundedFeet = Math.round(feet / 100) * 100;
      return `${roundedFeet} ft`;
    } else {
      // Round to nearest 0.1 mile
      const miles = d / 1609.344;
      const roundedMiles = Math.round(miles * 10) / 10;
      return `${roundedMiles} mi`;
    }
  }
}
