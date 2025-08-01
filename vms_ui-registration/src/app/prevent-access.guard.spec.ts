import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { preventAccessGuard } from './prevent-access.guard';

describe('preventAccessGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => preventAccessGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
