import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { DynamicCompService } from '../../core/service/dynamic-comp.service';
import { DynamicButtonData } from '../../core/models/interface/dynamic-component.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-nav',
  imports: [CommonModule],
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.css',
})
export class MainNavComponent implements OnInit {
  @Output() buttonClicked = new EventEmitter<void>(); // EventEmitter to emit when button is clicked

  pageTitle: string = '';
  pageId: number = 0;
  dynamicButtonData: DynamicButtonData[] = [];
  private unsubscribe$ = new Subject<void>();
  constructor(
    private dcService: DynamicCompService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Subscribe to dynamic page data and update accordingly
    this.dcService.pageData$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((pageData) => {
        if (pageData) {
          this.pageTitle = pageData.pageTitle;
        } else {
          this.pageTitle = ''; // or some default fallback
        }
        // Manually trigger change detection after updating the data
        this.cdr.detectChanges();
      });
    // Subscribe to dynamic button data and update accordingly
    this.dcService.buttonData$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((buttonData) => {
        this.dynamicButtonData = buttonData;
        // Manually trigger change detection after updating the data
        this.cdr.detectChanges();
      });
  }

  getSanitizedSvg(svg?: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg || '');
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // Action handler for button clicks
  onButtonClick(action: any) {
    action(); // Ensure this is calling the function reference directly
    this.buttonClicked.emit(); // Emit event when button is clicked
  }
}
