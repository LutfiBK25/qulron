import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';
import { UserManagementService } from '../../../core/service/user-management.service';
import { PopupService } from '../../../core/service/popup.service';
import {
  DynamicButtonData,
  DynamicPageData,
} from '../../../core/models/interface/dynamic-component.interface';
import { BehaviorSubject, catchError, EMPTY, from, switchMap } from 'rxjs';
import { DynamicItem } from '../../../core/models/class/dynamic-item';

@Component({
  selector: 'app-update-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './update-profile.component.html',
  styleUrl: './update-profile.component.css',
})
export class UpdateProfileComponent implements OnInit {
  componentReady = new BehaviorSubject<boolean>(false);
  pageName: string = 'Update Profile';
  user: any;

  constructor(
    private dcService: DynamicCompService,
    private userService: UserManagementService,
    private popupService: PopupService
  ) {}

  ngOnInit() {
    this.setMainNavPageData();
    const token = sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    this.loadUser();
    this.componentReady.next(true);
  }

  setMainNavPageData() {
    // get main nav data
    // Pass Page Data dynamiclly based on the component
    const pageData: DynamicPageData = {
      pageTitle: this.pageName,
    };

    const buttonData: DynamicButtonData[] = [
      {
        buttonVisible: true,
        buttonLabel: 'Update Profile',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c9c9c9">
        <path d="M480-440q-58 0-99-41t-41-99q0-58 41-99t99-41q58 0 99 41t41 99q0 58-41 99t-99 41Zm0-80q25 0 42.5-17.5T540-580q0-25-17.5-42.5T480-640q-25 0-42.5 17.5T420-580q0 25 17.5 42.5T480-520Zm0 460L120-280v-400l360-220 360 220v400L480-60Zm0-93 147-91q-34-18-71.5-27t-75.5-9q-38 0-75.5 9T333-244l147 91ZM256-291q50-34 107-51.5T480-360q60 0 117 17.5T704-291l56-33v-311L480-806 200-635v311l56 33Zm224-189Z"/>
        </svg>`,
        action: () => this.handleSubmit(),
      },
    ];

    this.dcService.setPageData(pageData);
    this.dcService.setButtonData(buttonData);
  }

  async loadUser() {
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
        },
        error: (err) => this.popupService.show('Error', `${err.message}`),
      });
    } catch (error: any) {
      this.popupService.show('Error', `${error.message}`);
    }
  }

  handleSubmit() {
    if (!this.userService.isAuthenticated()) {
      this.popupService.show('Unauthenticated', 'You are not Authenticated');
      return;
    }

    this.popupService.confirm(
      `Update Profile`,
      `Are you sure you want to update your profile?`,
      () => {
        this.userService
          .updateProfile(this.user)
          .pipe(
            switchMap((response) => {
              if (response.statusCode === 200) {
                this.popupService.show(
                  'Profile Updated',
                  'Your profile updated successfully.'
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
}
