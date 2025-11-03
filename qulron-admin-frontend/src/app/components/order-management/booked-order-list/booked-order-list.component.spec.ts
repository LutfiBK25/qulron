import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookedOrderListComponent } from './booked-order-list.component';

describe('OrderListComponent', () => {
  let component: BookedOrderListComponent;
  let fixture: ComponentFixture<BookedOrderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookedOrderListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookedOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
