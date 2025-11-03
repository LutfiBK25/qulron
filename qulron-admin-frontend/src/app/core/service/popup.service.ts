import { Injectable } from '@angular/core';
import { CustomPopupComponent } from '../../shared/reusableComponents/custom-popup/custom-popup.component';

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  private popupComponent!: CustomPopupComponent;
  constructor() {}
  register(popup: CustomPopupComponent) {
    this.popupComponent = popup;
  }

  show(title: string, message: string) {
    this.popupComponent?.show(title, message, 'alert');
  }

  confirm(title: string, message: string, onConfirm: () => void) {
    this.popupComponent?.show(title, message, 'confirm', onConfirm);
  }
}
