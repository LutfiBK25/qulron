import { Component, OnInit } from '@angular/core';
import { DynamicItem } from '../../../core/models/class/dynamic-item';
import { UserManagementService } from '../../../core/service/user-management.service';
import { PopupService } from '../../../core/service/popup.service';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DynamicPageData } from '../../../core/models/interface/dynamic-component.interface';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  pageName: string = 'Profile';
  componentReady = new BehaviorSubject<boolean>(false);

  successMessage: string = '';
  errorMessage: string = '';

  user: any;
  constructor(
    private dcService: DynamicCompService,
    private userService: UserManagementService,
    private popupService: PopupService
  ) {}

  ngOnInit() {
    this.setMainNavPageData();
    this.loadProfile();
  }

  setMainNavPageData() {
    const pageData: DynamicPageData = {
      pageTitle: this.pageName,
    };
    this.dcService.setPageData(pageData);
  }

  async loadProfile() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      this.userService.myProfile(token).subscribe({
        next: (response) => {
          if (response.statusCode == 200) {
            this.user = response.user;
          } else {
            this.popupService.show('Error', `${response.message}`);
          }
          this.componentReady.next(true);
        },
        error: (err) => this.popupService.show('Error', `${err.message}`),
      });
    } catch (error: any) {
      this.popupService.show('Error', `${error.message}`);
    }
  }

  async updateUser() {
    const { UpdateProfileComponent } = await import(
      '../update-profile/update-profile.component'
    );
    this.dcService.loadComponent(new DynamicItem(UpdateProfileComponent, ''));
  }

  async updatePassword() {
    const { UpdatePasswordComponent } = await import(
      '../update-password/update-password.component'
    );
    this.dcService.loadComponent(new DynamicItem(UpdatePasswordComponent, ''));
  }
}
