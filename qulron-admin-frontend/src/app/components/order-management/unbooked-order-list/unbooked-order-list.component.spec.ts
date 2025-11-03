import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnbookedOrderListComponent } from './unbooked-order-list.component';

describe('UnbookedOrderListComponent', () => {
  let component: UnbookedOrderListComponent;
  let fixture: ComponentFixture<UnbookedOrderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnbookedOrderListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnbookedOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
