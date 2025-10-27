import { Component, OnInit } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-broker-gateway',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './broker-gateway.component.html',
  styleUrl: './broker-gateway.component.css',
})
export class BrokerGatewayComponent implements OnInit {
  isBroker = true;
  isDriver = false;
  isSubmitting = false;
  showOrderNote = false; // Add this property for the order number note
  showStateNote = false; // Add this property for the state note


  brokerForm: FormGroup = new FormGroup({});

  // Driver Auth
  currentPhoneNumber = '';
  showVerificationPopup = false;
  isVerifying = false;
  clearVerificationInput = false;

  constructor(
    private formBuilder: FormBuilder,
    private brokerService: BrokerService,
    private popupService: PopupService
  ) {}

  ngOnInit() {
    //  Forms Initilization
    this.InitilizeBrokerForm();
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
}
