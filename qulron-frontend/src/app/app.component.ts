import {
  AfterViewInit,
  Component,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CustomPopupComponent } from './shared/reusableComponents/custom-popup/custom-popup.component';
import { PopupService } from './core/service/popup.service';
import { CommonModule } from '@angular/common';
import { UserManagementService } from './core/service/user-management.service';
import { UserRole } from './core/enums/user-role.enum';
import { DriverDashboardComponent } from './components/driver-dashboard/driver-dashboard.component';
import { BrokerDashboardComponent } from './components/broker-dashboard/broker-dashboard.component';
import { RouterOutlet } from '@angular/router';
import { LanguagePickerComponent } from './shared/reusableComponents/language-picker/language-picker.component';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    CustomPopupComponent,
    DriverDashboardComponent,
    BrokerDashboardComponent,
    RouterOutlet,
    LanguagePickerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild(CustomPopupComponent) popup!: CustomPopupComponent;
  isLoggedIn = false;
  userRole: UserRole | null = null;
  public UserRole = UserRole;
  showLanguagePicker = false;

  constructor(
    private popupService: PopupService,
    private userManagementService: UserManagementService,
    private translate: TranslateService
  ) {
    this.userManagementService.isLoggedIn$.subscribe(
      (val) => (this.isLoggedIn = val)
    );
    this.userManagementService.userRole$.subscribe(
      (val) => (this.userRole = val as UserRole | null)
    );
  }

  // Record the Window Width
  screenWidth = signal<number>(window.innerWidth);

  ngOnInit() {
    this.translate.setDefaultLang('en'); // <-- Set fallback language

    // check language
    const lang = localStorage.getItem('lang');
    if (!lang) {
      this.showLanguagePicker = true;
    } else {
      this.translate.use(lang);
    }

    // Check login status on component initialization
    this.isLoggedIn = this.userManagementService.isAuthenticated();

    // Subscribe to authentication changes (if you implement an authentication status Observable)
    this.userManagementService.authStatus$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.userManagementService.userRole$.subscribe((role) => {
      this.userRole = role;
    });
  }

  ngAfterViewInit() {
    this.popupService.register(this.popup);
  }

  onLanguageSelected(lang: string) {
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
    this.showLanguagePicker = false;
  }
}
