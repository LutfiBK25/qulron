import { Component, OnInit } from '@angular/core';
import { DynamicItem } from '../../../core/models/class/dynamic-item';
import { BehaviorSubject, catchError, EMPTY, from, switchMap } from 'rxjs';
import {
  DynamicButtonData,
  DynamicPageData,
} from '../../../core/models/interface/dynamic-component.interface';
import { PopupService } from '../../../core/service/popup.service';
import { UserManagementService } from '../../../core/service/user-management.service';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.css',
})
export class UpdatePasswordComponent implements OnInit {
  componentReady = new BehaviorSubject<boolean>(false);

  formData: any = {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private readonly userService: UserManagementService,
    private readonly dcService: DynamicCompService,
    private popupService: PopupService
  ) {}
  componentName: string = 'Update Password';

  ngOnInit(): void {
    // Pass Page Data dynamicakky based on the component
    const pageData: DynamicPageData = {
      pageTitle: 'Update Password',
    };
    // Pass button data dynamically based on the component
    const buttonData: DynamicButtonData[] = [
      {
        buttonVisible: true,
        buttonLabel: 'Change Password',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c9c9c9">
        <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480h80q0 66 25 124.5t68.5 102q43.5 43.5 102 69T480-159q134 0 227-93t93-227q0-134-93-227t-227-93q-89 0-161.5 43.5T204-640h116v80H80v-240h80v80q55-73 138-116.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-80-240q-17 0-28.5-11.5T360-360v-120q0-17 11.5-28.5T400-520v-40q0-33 23.5-56.5T480-640q33 0 56.5 23.5T560-560v40q17 0 28.5 11.5T600-480v120q0 17-11.5 28.5T560-320H400Zm40-200h80v-40q0-17-11.5-28.5T480-600q-17 0-28.5 11.5T440-560v40Z"/>
        </svg>`,
        action: () => this.handleSubmit(),
      },
    ];

    this.dcService.setPageData(pageData);
    this.dcService.setButtonData(buttonData);
    this.componentReady.next(true);
  }

  async handleSubmit() {
    if (!this.userService.isAuthenticated()) {
      this.popupService.show('Unauthenticated', 'You are not Authenticated');
      return;
    }
    // Check if all fields are not empty
    if (
      !this.formData.oldPassword ||
      !this.formData.newPassword ||
      !this.formData.confirmNewPassword
    ) {
      this.showError('Please fill in all fields.');
      return;
    }

    if (this.formData.newPassword !== this.formData.confirmNewPassword) {
      this.popupService.show('Error', 'Passwords do not match.');
      return;
    }
    this.popupService.confirm(
      `Change Password`,
      `Would you like to update your password?`,
      () => {
        this.userService
          .updatePassword(this.formData.oldPassword, this.formData.newPassword)
          .pipe(
            switchMap((response: any) => {
              if (response.statusCode === 200) {
                this.popupService.show(
                  'Password Updated',
                  'Your password updated successfully.'
                );
                return from(this.goToProfile()); // convert Promise to Observable
              } else {
                this.popupService.show('Error', `${response.message}`);
                return EMPTY;
              }
            }),
            catchError((err) => {
              this.popupService.show('Error', err.message || 'Update failed');
              return EMPTY;
            })
          )
          .subscribe();
      }
    );
  }

  private async goToProfile() {
    const { ProfileComponent } = await import('../profile/profile.component');
    this.dcService.loadComponent(new DynamicItem(ProfileComponent, ''));
  }

  showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = ''; // Clear the error message after the specified duration
    }, 6000);
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = ''; // Clear the error message after the specified duration
    }, 3000);
  }
}
