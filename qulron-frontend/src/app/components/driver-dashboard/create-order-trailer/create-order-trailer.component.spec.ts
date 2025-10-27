import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOrderTrailerComponent } from './create-order-trailer.component';

describe('CreateOrderTrailerComponent', () => {
  let component: CreateOrderTrailerComponent;
  let fixture: ComponentFixture<CreateOrderTrailerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrderTrailerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateOrderTrailerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
