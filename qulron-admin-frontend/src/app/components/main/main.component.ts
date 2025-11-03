import { Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { DynamicComponent } from '../../core/models/interface/dynamic-component.interface';
import { DynamicCompService } from '../../core/service/dynamic-comp.service';
import { DcDirective } from '../../shared/directives/dc.directive';
import { CommonModule } from '@angular/common';
import { BookedOrderListComponent } from '../order-management/booked-order-list/booked-order-list.component';

@Component({
  selector: 'app-main',
  imports: [DcDirective, CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
  @ViewChild(DcDirective, { static: true }) dcWrapper!: DcDirective;
  private unsubscribe$ = new Subject<void>();
  loading = false;

  constructor(private dcService: DynamicCompService) {}

  ngOnInit() {
    // Subscribe to loading state
    this.dcService.loading$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((loading) => {
        this.loading = loading;
      });

    this.dcService.component$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((component) => {
        if (!component) {
          this.dcWrapper.viewContainerRef.createComponent(BookedOrderListComponent);
          return;
        }
        this.dcWrapper.viewContainerRef.clear();
        const componentRef =
          this.dcWrapper.viewContainerRef.createComponent<DynamicComponent>(
            component.component
          );
        componentRef.instance.data = component.data;

        // Setup component readiness tracking
        this.setupComponentReadiness(componentRef);
      });
  }

  private setupComponentReadiness(componentRef: any) {
    // Initialize componentReady BehaviorSubject if it doesn't exist
    if (!componentRef.instance.componentReady) {
      componentRef.instance.componentReady = new BehaviorSubject<boolean>(
        false
      );
    }

    // Subscribe to the component's ready state
    componentRef.instance.componentReady
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((ready: boolean) => {
        if (ready) {
          // Use setTimeout to defer the loading state change to the next tick
          setTimeout(() => {
            this.dcService.setLoading(false);
          });
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
