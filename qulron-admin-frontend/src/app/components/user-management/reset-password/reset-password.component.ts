import { Component } from '@angular/core';
import { UserManagementService } from '../../../core/service/user-management.service';
import { PopupService } from '../../../core/service/popup.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';

  constructor(
    private usersService: UserManagementService,
    private popupService: PopupService
  ) {}

  handleSubmit() {
    if (this.newPassword !== this.confirmNewPassword) {
      this.popupService.show(`Error`, `Passwords don't match`);
      return;
    }

    this.usersService
      .updatePassword(this.oldPassword, this.newPassword)
      .subscribe({
        next: (response) => {
          if (response.statusCode == 200) {
            this.popupService.show(
              `Password Reset Successfully`,
              `Redirecting to Login Page...`
            );
            setTimeout(() => {
              this.usersService.logout();
              location.reload();
            }, 1000);
          } else {
            this.popupService.show(`Error`, `${response.message}`);
          }
        },
        error: (err) => this.popupService.show(`Error`, `${err.message}`),
      });
  }
}
