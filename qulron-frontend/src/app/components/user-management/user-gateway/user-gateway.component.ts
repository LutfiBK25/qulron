import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, EMPTY, switchMap } from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PopupService } from '../../../core/service/popup.service';
import { BrokerService } from '../../../core/service/broker.service';
import { DriverService } from '../../../core/service/driver.service';
import { VerificationPopupComponent } from '../../../shared/reusableComponents/verification-popup/verification-popup.component';
import { TranslateModule } from '@ngx-translate/core';
import { UserRole } from '../../../core/enums/user-role.enum';
import { environment } from '../../../../environments/environment';
import { UserManagementService } from '../../../core/service/user-management.service';

@Component({
  selector: 'app-user-gateway',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    VerificationPopupComponent,
    TranslateModule,
  ],
  templateUrl: './user-gateway.component.html',
  styleUrl: './user-gateway.component.css',
})
export class UserGatewayComponent implements OnInit {
  isBroker = true;
  isDriver = false;
  isSubmitting = false;
  showOrderNote = false; // Add this property for the order number note
  showStateNote = false; // Add this property for the state note

  brokerForm: FormGroup = new FormGroup({});
  driverForm: FormGroup = new FormGroup({});

  // Driver Auth
  currentPhoneNumber = '';
  showVerificationPopup = false;
  isVerifying = false;
  clearVerificationInput = false;

  //Privacy and Terms
  showTermsPopup = false;
  showPrivacyPopup = false;

  constructor(
    private formBuilder: FormBuilder,
    private brokerService: BrokerService,
    private driverService: DriverService,
    private popupService: PopupService,
    private userManagementService: UserManagementService
  ) {}

  ngOnInit() {
    this.InitilizeBrokerForm();
    this.initializeDriverForm();
  }

  brokerMode() {
    this.isBroker = true;
    this.isDriver = false;
  }

  driverMode() {
    this.isBroker = false;
    this.isDriver = true;
  }

  // Broker Section
  InitilizeBrokerForm() {
    this.brokerForm = this.formBuilder.group({
      orderNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20),
        ],
      ],
      // brokerName: [
      //   '',
      //   [
      //     Validators.required,
      //     Validators.minLength(5),
      //     Validators.maxLength(50),
      //   ],
      // ],
      state: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(3),
        ],
      ],
      driverName: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(50),
        ],
      ],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(12),
        ],
      ],
      confirmPhoneNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(12),
        ],
      ],
    });
  }

  onSubmitOrder() {
    if (!this.phoneMatchValidator2(this.brokerForm)) {
      this.popupService.show(
        'Phone Number Missmatch',
        'Please make sure the phone number is correct!'
      );
      return;
    }

    if (this.brokerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formData = this.brokerForm.value;

      this.brokerService
        .submitOrder(formData)
        .pipe(
          switchMap((response) => {
            if (response.statusCode == 200) {
              this.popupService.show(
                `Order Submited`,
                `Order Submited Sucessfully, The Driver Can Access The Order Once They are Close to The Site`
              );
              this.brokerForm.reset();
              this.isSubmitting = false;
              return EMPTY;
            } else {
              this.popupService.show(`Error`, `${response.message}`);
              this.isSubmitting = false;
              return EMPTY;
            }
          }),
          catchError((err) => {
            this.popupService.show('Error', err.message || 'Update failed');
            this.isSubmitting = false;
            return EMPTY;
          })
        )
        .subscribe(() => {
          this.isSubmitting = false;
        });
    } else {
      this.popupService.show(
        'Form is Invalid',
        'Please check all required fields and try again.'
      );
      this.isSubmitting = false;
    }
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

  phoneMatchValidator2(form: AbstractControl) {
    const phone = form.get('phoneNumber')?.value;
    const confirm = form.get('confirmPhoneNumber')?.value;
    return phone === confirm ? true : false;
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

  onDriverSubmit() {
    if (this.driverForm.valid) {
      const phoneNumber = this.driverForm.get('phoneNumber')?.value;
      this.currentPhoneNumber = phoneNumber;

      this.driverService
        .requestVerificationCode(phoneNumber)
        .pipe(
          switchMap((response) => {
            if (response.statusCode === 200) {
              this.showVerificationPopup = true;
              return EMPTY;
            } else if (response.statusCode === 400) {
              this.popupService.show('Error', response.message);
              return EMPTY;
            } else {
              this.popupService.show('Error', response.message);
              return EMPTY;
            }
          }),
          catchError((err) => {
            this.popupService.show('Error', err.message || 'Request failed');
            return EMPTY;
          })
        )
        .subscribe();
    } else {
      this.popupService.show(
        'Form is Invalid',
        'Please enter a valid phone number.'
      );
    }
  }

  onVerificationCodeSubmitted(code: string) {
    this.driverService
      .verifyCodeAndLogin(this.currentPhoneNumber, code)
      .pipe(
        switchMap((response) => {
          if (response.statusCode === 200) {
            this.showVerificationPopup = false;
            this.isVerifying = false;

            // Save token if needed
            sessionStorage.setItem('token', response.token);

            // Set login state and role using AuthService
            this.userManagementService.login(UserRole.Driver); // or response.role if dynamic

            // Optionally, store hasTrailer if you use it elsewhere
            localStorage.setItem(
              'hasTrailer',
              response.hasTrailer ? 'true' : 'false'
            );

            this.popupService.notify(
              'Login Successful',
              `Welcome ${response.driverName}!`
            );
            return EMPTY;
          } else {
            this.popupService.show('Error', response.message);
            this.isVerifying = false;
            this.clearVerificationInput = true;
            setTimeout(() => {
              this.clearVerificationInput = false;
            }, 100);
            return EMPTY;
          }
        }),
        catchError((err) => {
          this.popupService.show('Error', err.message || 'Verification failed');
          this.isVerifying = false;
          this.clearVerificationInput = true;
          setTimeout(() => {
            this.clearVerificationInput = false;
          }, 100);
          return EMPTY;
        })
      )
      .subscribe();
  }

  onVerificationPopupClosed() {
    this.showVerificationPopup = false;
    this.driverForm.reset();
  }

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

  // Close popups when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('popup-backdrop')) {
      this.showTermsPopup = false;
      this.showPrivacyPopup = false;
    }
  }
}
