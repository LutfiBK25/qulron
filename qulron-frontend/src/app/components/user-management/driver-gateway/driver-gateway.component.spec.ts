import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverGatewayComponent } from './driver-gateway.component';

describe('DriverGatewayComponent', () => {
  let component: DriverGatewayComponent;
  let fixture: ComponentFixture<DriverGatewayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverGatewayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverGatewayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
