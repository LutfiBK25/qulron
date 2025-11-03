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
  type: 'alert' | 'confirm' = 'alert';
  private confirmCallback?: () => void;

  show(
    title: string,
    message: string,
    type: 'alert' | 'confirm' = 'alert',
    onConfirm?: () => void
  ) {
    this.title = title;
    this.message = message;
    this.type = type;
    this.visible = true;
    this.confirmCallback = onConfirm;
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
