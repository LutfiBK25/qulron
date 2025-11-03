import { BehaviorSubject } from 'rxjs';

export interface DynamicComponent {
  componentName: string;
  data: any; // Input data that each dynamic component will receive
  componentReady?: BehaviorSubject<boolean>; // Add this to track component readiness
}

export interface DynamicPageData {
  pageTitle: string;
}

export interface DynamicButtonData {
  buttonVisible: boolean;
  buttonLabel: string;
  svg?: string;
  action?: any;
  children?: DynamicButtonData[];
}
