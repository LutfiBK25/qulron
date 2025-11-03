import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserManagementService } from '../../../core/service/user-management.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private readonly usersService: UserManagementService) {}

  username: string = '';
  password: string = '';
  errorMessage: string = '';

  handleSubmit() {
    // this is not necessary because we made the fields required
    // if (!this.username || !this.password) {
    //   this.showError('Username and Password is required');
    //   return;
    // }

    this.usersService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.statusCode == 200) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('role', response.role);
          location.reload();
        } else {
          this.showError(response.message);
        }
      },
      error: (err) => this.showError(err.message),
    });
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ''), 3000);
  }
}
