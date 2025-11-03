import { Component } from '@angular/core';
import { DynamicItem } from '../../core/models/class/dynamic-item';
import { UserManagementService } from '../../core/service/user-management.service';
import { DynamicCompService } from '../../core/service/dynamic-comp.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  constructor(
    private readonly usersService: UserManagementService,
    private dcservice: DynamicCompService
  ) {}

  //*** Loading Compnent to Main ***/

  async loadComponentToMain(componentName: string) {
    let component: DynamicItem;
    switch (componentName) {
      case 'home':
        const { DashboardComponent } = await import(
          '../dashboard/dashboard.component'
        );
        component = new DynamicItem(DashboardComponent, '');
        break;
      case 'profile':
        const { ProfileComponent } = await import(
          '../user-management/profile/profile.component'
        );
        component = new DynamicItem(ProfileComponent, '');
        break;
      default:
        console.error(`Component '${componentName}' not found!`);
        return;
    }

    if (component) {
      this.dcservice.loadComponent(component);
    }
  }
  logout(): void {
    this.usersService.logout();
  }
}
