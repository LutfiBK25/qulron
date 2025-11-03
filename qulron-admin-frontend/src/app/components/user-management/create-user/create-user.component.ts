import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, from, switchMap } from 'rxjs';
import { UserManagementService } from '../../../core/service/user-management.service';
import { PopupService } from '../../../core/service/popup.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  DynamicButtonData,
  DynamicComponent,
  DynamicPageData,
} from '../../../core/models/interface/dynamic-component.interface';
import { DynamicItem } from '../../../core/models/class/dynamic-item';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';

@Component({
  selector: 'app-create-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
})
export class CreateUserComponent implements DynamicComponent, OnInit {
  @Input() data: any;
  componentReady = new BehaviorSubject<boolean>(false);

  formData: any = {
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  };
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private readonly userService: UserManagementService,
    private readonly dcService: DynamicCompService,
    private popupService: PopupService
  ) {}
  componentName: string = 'CreateUser';

  ngOnInit(): void {
    // Pass Page Data dynamicakky based on the component
    const pageData: DynamicPageData = {
      pageTitle: 'Create User',
    };
    // Pass button data dynamically based on the component
    const buttonData: DynamicButtonData[] = [
      {
        buttonVisible: true,
        buttonLabel: 'Register',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c9c9c9">
        <path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z"/>
        </svg>`,
        action: () => this.handleSubmit(),
      },
    ];

    this.dcService.setPageData(pageData);
    this.dcService.setButtonData(buttonData);
    this.componentReady.next(true);
  }

  async handleSubmit() {
    if (this.userService.getUserRole() !== 'ADMIN') {
      this.popupService.show('Unauthorized', 'You are not an admin');
      this.componentReady.next(true);
      return;
    }
    // Check if all fields are not empty
    if (
      !this.formData.username ||
      !this.formData.firstName ||
      !this.formData.lastName ||
      !this.formData.phone ||
      !this.formData.email ||
      !this.formData.password ||
      !this.formData.confirmPassword ||
      !this.formData.role
    ) {
      this.showError('Please fill in all fields.');
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.popupService.show('Error', 'Passwords do not match.');
      return;
    }
    this.popupService.confirm(
      `Create User`,
      `You are creating user: ${this.formData.username}`,
      () => {
        try {
          this.userService
            .register(this.formData)
            .pipe(
              switchMap((response) => {
                if (response.statusCode == 200) {
                  this.popupService.show(
                    `User Created`,
                    `The User: ${this.formData.username} created successfully.`
                  );
                  return from(this.goToUserList());
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
        } catch (error: any) {
          this.showError(error.message);
        }
      }
    );
  }

  private async goToUserList() {
    const { UserListComponent } = await import(
      '../user-list/user-list.component'
    );
    this.dcService.loadComponent(new DynamicItem(UserListComponent, ''));
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
