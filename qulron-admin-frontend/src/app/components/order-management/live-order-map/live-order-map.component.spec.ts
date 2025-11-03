import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveOrderMapComponent } from './live-order-map.component';

describe('LiveOrderMapComponent', () => {
  let component: LiveOrderMapComponent;
  let fixture: ComponentFixture<LiveOrderMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveOrderMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveOrderMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
