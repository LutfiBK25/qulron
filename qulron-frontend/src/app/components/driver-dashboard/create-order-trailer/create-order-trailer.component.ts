import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrailerService } from '../../../core/service/trailer.service';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { PopupService } from '../../../core/service/popup.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-order-trailer',
  imports: [FormsModule, CommonModule, TranslateModule],
  templateUrl: './create-order-trailer.component.html',
  styleUrl: './create-order-trailer.component.css',
})
export class CreateOrderTrailerComponent {
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();

  trailerNumber: string = '';

  constructor(
    private trailerService: TrailerService,
    private popupService: PopupService
  ) {}
  onClose() {
    this.close.emit();
  }

  onSubmit() {
    this.trailerService
      .createOrderTrailer(this.trailerNumber)
      .pipe(
        switchMap((response) => {
          if (response.statusCode === 200) {
            localStorage.setItem('hasTrailer', 'true');
            this.onClose();
            return EMPTY;
          } else {
            this.popupService.show('Error', response.message);
            return EMPTY;
          }
        }),
        catchError((err) => {
          this.popupService.show('Error', err.message || 'Verification failed');
          return EMPTY;
        })
      )
      .subscribe();
  }
}
