import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PopupService } from '../../../core/service/popup.service';
import { DriverService } from '../../../core/service/driver.service';
import { VerificationPopupComponent } from '../../../shared/reusableComponents/verification-popup/verification-popup.component';
import { TranslateModule } from '@ngx-translate/core';
import { UserRole } from '../../../core/enums/user-role.enum';
import { DriverAuthResponse } from '../../../core/models/interface/driver-auth.interface';
import { UserManagementService } from '../../../core/service/user-management.service';

@Component({
  selector: 'app-driver-gateway',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    VerificationPopupComponent,
    TranslateModule,
  ],
  templateUrl: './driver-gateway.component.html',
  styleUrl: './driver-gateway.component.css',
})
export class DriverGatewayComponent implements OnInit {
  isBroker = false;
  isDriver = true;

  driverForm: FormGroup = new FormGroup({});

  // Driver Auth
  currentPhoneNumber = '';
  showVerificationPopup = false;
  isVerifying = false;
  clearVerificationInput = false;

  //Privacy and Terms
  showTermsPopup = false;
  showPrivacyPopup = false;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private driverService: DriverService,
    private popupService: PopupService,
    private userManagementService: UserManagementService
  ) {}

  ngOnInit() {
    this.initializeDriverForm();
  }

  formatPhoneNumber(input: HTMLInputElement) {
    let cleaned = input.value.replace(/\D/g, '');
    cleaned = cleaned.substring(0, 10);
    let formatted = cleaned;
    if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(
        3,
        6
      )}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    input.value = formatted;
  }

  // Driver Section
  initializeDriverForm() {
    this.driverForm = this.formBuilder.group({
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(12),
        ],
      ],
    });
  }
  // Driver Submit
  onDriverSubmit() {
    if (this.driverForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const phoneNumber = this.driverForm.get('phoneNumber')?.value;
      this.currentPhoneNumber = phoneNumber;

      this.driverService
        .requestVerificationCode(phoneNumber)
        .pipe(
          switchMap((response) => {
            if (response.statusCode === 200) {
              this.showVerificationPopup = true;
              return EMPTY;
            } else {
              this.popupService.show('Error', response.message);
              return EMPTY;
            }
          }),
          catchError((err) => {
            this.popupService.show('Error', err.message);
            return EMPTY;
          }),
          finalize(() => (this.isSubmitting = false))
        )
        .subscribe();
    } else {
      this.popupService.show(
        'Form is Invalid',
        'Please enter a valid phone number.'
      );
    }
  }

  // Verification Code Submitted
  onVerificationCodeSubmitted(code: string) {
    this.isVerifying = true;

    this.driverService
      .verifyCodeAndLogin(this.currentPhoneNumber, code)
      .pipe(
        switchMap((response) => {
          if (response.statusCode === 200) {
            this.handleSuccessfulLogin(response);
            return EMPTY;
          } else {
            this.handleLoginError(response.message);
            return EMPTY;
          }
        }),
        catchError((err) => {
          this.handleLoginError(this.getErrorMessage(err));
          return EMPTY;
        }),
        finalize(() => {
          this.isVerifying = false;
        })
      )
      .subscribe();
  }

  private handleSuccessfulLogin(response: DriverAuthResponse): void {
    this.showVerificationPopup = false;

    // Save token
    sessionStorage.setItem('token', response.token);

    // Set login state
    this.userManagementService.login(UserRole.Driver);

    // Store trailer info
    localStorage.setItem('hasTrailer', response.hasTrailer ? 'true' : 'false');

    // Show success message
    this.popupService.notify(
      'Login Successful',
      `Welcome ${response.driverName}!`
    );
  }

  private handleLoginError(message: string): void {
    this.popupService.show('Error', message);
    this.clearVerificationInput = true;
    setTimeout(() => {
      this.clearVerificationInput = false;
    }, 100);
  }

  private getErrorMessage(err: any): string {
    if (err.status === 401) {
      return 'Invalid verification code. Please try again.';
    } else if (err.status === 429) {
      return 'Too many attempts. Please wait before trying again.';
    } else if (err.status === 400) {
      return err.error?.message || 'Invalid code format';
    } else if (err.status === 500) {
      return 'Server error. Please try again later.';
    } else if (err.status === 0) {
      return 'No internet connection. Please check your network.';
    }
    return 'Verification failed. Please try again.';
  }

  onVerificationPopupClosed() {
    this.showVerificationPopup = false;
    this.driverForm.reset();
  }

  // Terms and Privacy
  showSMSTerms() {
    this.showTermsPopup = true;
  }

  showSMSPrivacy() {
    this.showPrivacyPopup = true;
  }

  closeTermsPopup() {
    this.showTermsPopup = false;
  }

  closePrivacyPopup() {
    this.showPrivacyPopup = false;
  }

  // Close popups when clicking outside (Terms and Privacy)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('popup-backdrop')) {
      this.showTermsPopup = false;
      this.showPrivacyPopup = false;
    }
  }
}
