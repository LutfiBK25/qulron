import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFacilityMapComponent } from './custom-facility-map.component';

describe('CustomFacilityMapComponent', () => {
  let component: CustomFacilityMapComponent;
  let fixture: ComponentFixture<CustomFacilityMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFacilityMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomFacilityMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
