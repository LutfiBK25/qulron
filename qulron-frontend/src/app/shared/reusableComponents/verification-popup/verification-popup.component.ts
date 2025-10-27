import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-verification-popup',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './verification-popup.component.html',
  styleUrl: './verification-popup.component.css',
})
export class VerificationPopupComponent implements OnChanges {
  @Input() visible = false;
  @Input() isLoading = false;
  @Input() clearInput = false;
  @Output() codeSubmitted = new EventEmitter<string>();
  @Output() popupClosed = new EventEmitter<void>();

  phoneNumber = '';
  verificationForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.verificationForm = this.formBuilder.group({
      verificationCode: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && changes['visible'].currentValue) {
      this.verificationForm.reset();
      this.isLoading = false;
    }

    if (changes['clearInput'] && changes['clearInput'].currentValue) {
      this.clearVerificationCode();
    }
  }

  show(phoneNumber: string) {
    this.phoneNumber = phoneNumber;
    this.visible = true;
    this.verificationForm.reset();
  }

  close() {
    this.visible = false;
    this.popupClosed.emit();
  }

  clearVerificationCode() {
    this.verificationForm.get('verificationCode')?.setValue('');
    this.isLoading = false;
  }

  onSubmit() {
    if (this.verificationForm.valid) {
      this.isLoading = true;
      const code = this.verificationForm.get('verificationCode')?.value;
      this.codeSubmitted.emit(code);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent) {
    if (this.visible) {
      this.close();
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent) {
    if (this.visible && this.verificationForm.valid) {
      this.onSubmit();
    }
  }
}
