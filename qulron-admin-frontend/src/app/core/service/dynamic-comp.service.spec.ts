import { TestBed } from '@angular/core/testing';

import { DynamicCompService } from './dynamic-comp.service';

describe('DynamicCompService', () => {
  let service: DynamicCompService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicCompService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
