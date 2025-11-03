import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { DynamicItem } from '../../core/models/class/dynamic-item';
import { NavType } from '../../core/enums/nav-type.enum';
import { MenuItem } from '../../core/models/interface/MenuItem.interface';
import { UserManagementService } from '../../core/service/user-management.service';
import { DynamicCompService } from '../../core/service/dynamic-comp.service';
import { CommonModule } from '@angular/common';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, SidebarMenuComponent],
})
export class SidebarComponent implements OnInit {
  /*** Inputs and outputs ***/
  @Input() isLeftSidebarCollapsed: boolean = false; // Corrected Input property
  @Output() changeIsLeftSidebarCollapsed: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  menuList: any[] = [];

  menuItems: MenuItem[] = [];

  // Record the Window Width
  screenWidth = signal<number>(window.innerWidth);
  constructor(
    private dcService: DynamicCompService,
    private readonly userService: UserManagementService
  ) {}

  ngOnInit(): void {
    // get the nav data
    if (this.userService.getUserRole() == 'ADMIN') {
      this.loadAdminMenuItems();
    }
    this.loadOrderManagerMenuItems();
    // Side Bar Collapse if screen is small when login
    this.screenWidth.set(window.innerWidth); // new screen width record
    if (this.screenWidth() < 768) {
      // if it is less than 768 collapse
      this.isLeftSidebarCollapsed = true;
    } else if (this.screenWidth() >= 768) {
      this.isLeftSidebarCollapsed = false;
    }
  }

  //*** Sidebar Toggle ***//
  toggleSidebar(): void {
    this.isLeftSidebarCollapsed = !this.isLeftSidebarCollapsed; // Toggle sidebar state
    this.changeIsLeftSidebarCollapsed.emit(this.isLeftSidebarCollapsed); // Emit updated state
  }
  //*** Load Admin Nav Items ***/

  loadAdminMenuItems() {
    this.menuItems.push({
      label: 'User Manager',
      type: NavType.SUBMENU,
      children: [
        {
          label: 'Create User',
          type: NavType.PAGE,
          componentName: 'createUserComp',
        },
        {
          label: 'Users List',
          type: NavType.PAGE,
          componentName: 'userListComp',
        },
      ],
    });
  }

  //*** Load Order Manager Nav Items ***/
  loadOrderManagerMenuItems() {
    this.menuItems.push(
      {
        label: 'Booked Orders',
        type: NavType.PAGE,
        componentName: 'ordersListComp',
      },
      {
        label: 'UnBooked Orders',
        type: NavType.PAGE,
        componentName: 'unbookedOrderListComp',
      },
      {
        label: 'Live Orders',
        type: NavType.PAGE,
        componentName: 'liveOrderMapComp',
      }
    );
  }

  transformMenu(json: any): MenuItem[] {
    return json.appsList
      .sort((a: any, b: any) => a.Sequence - b.Sequence)
      .map((app: any) => ({
        label: app.AppName,
        type: NavType.SUBMENU,
        children: this.sortBySequence(app.Nodes).map((n: any) =>
          this.transformNode(app.AppName, n)
        ),
        open: false,
      }));
  }

  transformNode(appName: string, node: any): MenuItem {
    const isPage = node.NodeType === 'PAGE';
    const children =
      !isPage && Array.isArray(node.Nodes)
        ? this.sortBySequence(node.Nodes).map((n: any) =>
            this.transformNode(appName, n)
          )
        : [];
    return {
      appName: appName,
      label: node.NodeName,
      type: isPage ? NavType.PAGE : NavType.SUBMENU, // Use NavType enum
      pageId: isPage ? node.TargetPageId : undefined,
      pageType: isPage ? node.TargetPageType : undefined,
      componentName: isPage
        ? this.getComponentName(node.TargetPageType)
        : undefined,
      children,
      open: false,
    };
  }

  getComponentName(type: string | null): string | undefined {
    if (!type) return undefined;
    switch (type.toUpperCase()) {
      case 'REPORT':
        return 'ReportPageComponent';
      case 'SEARCH':
        return 'SearchPageComponent';
      case 'PROCESS':
        return 'ProcessPageComponent';
      default:
        return 'UnknownComponent';
    }
  }

  sortBySequence(nodes: any[] = []): any[] {
    return nodes.sort((a, b) => a.Sequence - b.Sequence);
  }

  //*** Loading Compnent to Main ***/

  async loadComponentToMain(componentName: string, data: any = {}) {
    let component: DynamicItem;
    switch (componentName) {
      case 'createUserComp':
        const { CreateUserComponent } = await import(
          '../user-management/create-user/create-user.component'
        );
        component = new DynamicItem(CreateUserComponent, '');
        break;
      case 'userListComp':
        const { UserListComponent } = await import(
          '../user-management/user-list/user-list.component'
        );
        component = new DynamicItem(UserListComponent, '');
        break;
      case 'ordersListComp':
        const { BookedOrderListComponent: BookedOrderListComponent } = await import(
          '../order-management/booked-order-list/booked-order-list.component'
        );
        component = new DynamicItem(BookedOrderListComponent, '');
        break;
      case 'unbookedOrderListComp':
        const { UnbookedOrderListComponent } = await import(
          '../order-management/unbooked-order-list/unbooked-order-list.component'
        );
        component = new DynamicItem(UnbookedOrderListComponent, '');
        break;
      case 'liveOrderMapComp':
        const { LiveOrderMapComponent } = await import(
          '../order-management/live-order-map/live-order-map.component'
        );
        component = new DynamicItem(LiveOrderMapComponent, '');
        break;
      // Add your othe dynamic imports here
      default:
        console.error(`Component '${componentName}' not found!`);
        return;
    }

    if (component) {
      this.dcService.loadComponent(component);
    } else {
      console.error(`there is no component to load`);
    }
  }
}
