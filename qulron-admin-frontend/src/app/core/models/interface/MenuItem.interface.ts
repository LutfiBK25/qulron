import { NavType } from '../../enums/nav-type.enum';

export interface MenuItem {
  label: string;
  type: NavType;
  appName?: string;
  pageId?: number;
  pageType?: string;
  children?: MenuItem[];
  componentName?: string;
  open?: boolean;
}
