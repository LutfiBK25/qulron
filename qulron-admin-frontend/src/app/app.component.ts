import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserManagementService } from './core/service/user-management.service';
import { CustomPopupComponent } from './shared/reusableComponents/custom-popup/custom-popup.component';
import { PopupService } from './core/service/popup.service';
import { LoginComponent } from './components/user-management/login/login.component';
import { ResetPasswordComponent } from './components/user-management/reset-password/reset-password.component';
import { MainComponent } from './components/main/main.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MainNavComponent } from './components/main-nav/main-nav.component';
import { HeaderComponent } from './components/header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    CustomPopupComponent,
    LoginComponent,
    ResetPasswordComponent,
    MainComponent,
    SidebarComponent,
    MainNavComponent,
    HeaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild(CustomPopupComponent) popup!: CustomPopupComponent;
  isLoggedIn = false;
  isPasswordResetReq = false;

  constructor(
    private usersService: UserManagementService,
    private popupService: PopupService
  ) {}

  isLeftSidebarCollapsed = signal<boolean>(false);

  // Record the Window Width
  screenWidth = signal<number>(window.innerWidth);

  ngOnInit() {
    // Check login status on component initialization
    this.isLoggedIn = this.usersService.isAuthenticated();

    // Subscribe to authentication changes (if you implement an authentication status Observable)
    this.usersService.authStatus$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.usersService.passwordResetStatus$.subscribe((status) => {
      this.isPasswordResetReq = status;
    });

    this.usersService.checkApiHealth(); // Start auto logout if API fails
  }

  ngAfterViewInit() {
    this.popupService.register(this.popup);
  }

  // Resizing Window
  @HostListener('window:resize') // listens for window resize events.
  onResize() {
    this.screenWidth.set(window.innerWidth); // new screen width record
    if (this.screenWidth() < 768) {
      // if it is less than 768 collapse
      this.isLeftSidebarCollapsed.set(true);
    } else if (this.screenWidth() >= 768) {
      this.isLeftSidebarCollapsed.set(false);
    }
  }
}
