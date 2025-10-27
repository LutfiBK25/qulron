import L from 'leaflet';
import { Localization } from './localization';

export interface FormatterOptions {
  units?: 'metric' | 'imperial';
  unitNames?: any;
  language?: string | string[];
  roundingSensitivity?: number;
  distanceTemplate?: string;
}

export class Formatter {
  options: FormatterOptions;
  private _localization: Localization;

  constructor(options: FormatterOptions = {}) {
    const defaultOptions: FormatterOptions = {
      units: 'metric',
      unitNames: null,
      language: 'en',
      roundingSensitivity: 1,
      distanceTemplate: '{value} {unit}',
    };

    this.options = { ...defaultOptions, ...options };

    const langs = Array.isArray(this.options.language)
      ? this.options.language
      : [this.options.language || 'en', 'en'];
    this._localization = new Localization(langs);
  }

  formatDistance(d: number, sensitivity?: number): string {
    const un = this.options.unitNames || this._localization.localize('units');
    const simpleRounding = (sensitivity || 0) <= 0;
    const round = simpleRounding
      ? (v: number) => v
      : (v: number) => this._round(v, sensitivity);
    let v: number;
    let yards: number;
    let data: { value: number; unit: string };

    if (this.options.units === 'imperial') {
      yards = d / 0.9144;
      if (yards >= 1000) {
        data = {
          value: round(d / 1609.344),
          unit: un.miles,
        };
      } else {
        data = {
          value: round(yards),
          unit: un.yards,
        };
      }
    } else {
      v = round(d);
      data = {
        value: v >= 1000 ? v / 1000 : v,
        unit: v >= 1000 ? un.kilometers : un.meters,
      };
    }

    if (simpleRounding && sensitivity) {
      data.value = parseFloat(data.value.toFixed(-sensitivity));
    }

    return L.Util.template(
      this.options.distanceTemplate || '{value} {unit}',
      data
    );
  }

  private _round(d: number, sensitivity?: number): number {
    const s = sensitivity || this.options.roundingSensitivity || 1;
    const pow10 = Math.pow(10, (Math.floor(d / s) + '').length - 1);
    const r = Math.floor(d / pow10);
    const p = r > 5 ? pow10 : pow10 / 2;

    return Math.round(d / p) * p;
  }

  formatTime(t: number): string {
    const un = this.options.unitNames || this._localization.localize('units');
    // More than 30 seconds precision looks ridiculous
    t = Math.round(t / 30) * 30;

    if (t > 86400) {
      return Math.round(t / 3600) + ' ' + un.hours;
    } else if (t > 3600) {
      return (
        Math.floor(t / 3600) +
        ' ' +
        un.hours +
        ' ' +
        Math.round((t % 3600) / 60) +
        ' ' +
        un.minutes
      );
    } else if (t > 300) {
      return Math.round(t / 60) + ' ' + un.minutes;
    } else if (t > 60) {
      return (
        Math.floor(t / 60) +
        ' ' +
        un.minutes +
        (t % 60 !== 0 ? ' ' + (t % 60) + ' ' + un.seconds : '')
      );
    } else {
      return t + ' ' + un.seconds;
    }
  }

  formatInstruction(instr: any, i: number): string {
    if (instr.text === undefined) {
      return this.capitalize(
        L.Util.template(this._getInstructionTemplate(instr, i), {
          ...instr,
          exitStr: instr.exit
            ? this._localization.localize('formatOrder')(instr.exit)
            : '',
          dir: this._localization.localize(['directions', instr.direction]),
          modifier: this._localization.localize(['directions', instr.modifier]),
        })
      );
    } else {
      return instr.text;
    }
  }

  getIconName(instr: any, i: number): string {
    switch (instr.type) {
      case 'Head':
        if (i === 0) {
          return 'depart';
        }
        break;
      case 'WaypointReached':
        return 'via';
      case 'Roundabout':
        return 'enter-roundabout';
      case 'DestinationReached':
        return 'arrive';
    }

    switch (instr.modifier) {
      case 'Straight':
        return 'continue';
      case 'SlightRight':
        return 'bear-right';
      case 'Right':
        return 'turn-right';
      case 'SharpRight':
        return 'sharp-right';
      case 'TurnAround':
      case 'Uturn':
        return 'u-turn';
      case 'SharpLeft':
        return 'sharp-left';
      case 'Left':
        return 'turn-left';
      case 'SlightLeft':
        return 'bear-left';
      default:
        return 'continue';
    }
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.substring(1);
  }

  private _getInstructionTemplate(instr: any, i: number): string {
    const type =
      instr.type === 'Straight' ? (i === 0 ? 'Head' : 'Continue') : instr.type;
    let strings = this._localization.localize(['instructions', type]);

    if (!strings) {
      strings = [
        this._localization.localize(['directions', type]),
        ' ' + this._localization.localize(['instructions', 'Onto']),
      ];
    }

    return strings[0] + (strings.length > 1 && instr.road ? strings[1] : '');
  }
}
