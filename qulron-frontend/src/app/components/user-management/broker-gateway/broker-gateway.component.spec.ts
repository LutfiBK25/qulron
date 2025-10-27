import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerGatewayComponent } from './broker-gateway.component';

describe('BrokerGatewayComponent', () => {
  let component: BrokerGatewayComponent;
  let fixture: ComponentFixture<BrokerGatewayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokerGatewayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrokerGatewayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
