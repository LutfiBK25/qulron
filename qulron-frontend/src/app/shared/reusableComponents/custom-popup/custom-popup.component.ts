import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-custom-popup',
  imports: [CommonModule],
  templateUrl: './custom-popup.component.html',
  styleUrl: './custom-popup.component.css',
})
export class CustomPopupComponent {
  visible = false;
  message = '';
  title = '';
  type: 'alert' | 'confirm' | 'notify' = 'alert';
  private confirmCallback?: () => void;
  private autoCloseTimeout: any;

  show(
    title: string,
    message: string,
    type: 'alert' | 'confirm' | 'notify' = 'alert',
    onConfirm?: () => void
  ) {
    this.title = title;
    this.message = message;
    this.type = type;
    this.visible = true;
    this.confirmCallback = onConfirm;

    // If notify, set a timer to auto-close
    if (type === 'notify') {
      if (this.autoCloseTimeout) {
        clearTimeout(this.autoCloseTimeout);
      }
      this.autoCloseTimeout = setTimeout(() => {
        this.close();
      }, 2000); // 2000ms = 2 seconds, adjust as needed
    }
  }

  close() {
    this.visible = false;
  }

  confirm() {
    this.visible = false;
    if (this.confirmCallback) {
      this.confirmCallback();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent) {
    if (this.visible) {
      this.close();
    }
  }
}
