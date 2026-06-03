import { describe, it, expect } from 'vitest';
import {
  canForwardFrom,
  canProgressFrom,
  canCloseFrom,
  canAssignFrom,
  canOverrideSeverityFrom,
} from '@/lib/status/transitions';

describe('status transition guards (state machine)', () => {
  it('forward only from Pending', () => {
    expect(canForwardFrom('Pending')).toBe(true);
    expect(canForwardFrom('Assigned')).toBe(false);
    expect(canForwardFrom('InProgress')).toBe(false);
    expect(canForwardFrom('Closed')).toBe(false);
  });

  it('progress only from Assigned', () => {
    expect(canProgressFrom('Assigned')).toBe(true);
    expect(canProgressFrom('InProgress')).toBe(false);
  });

  it('assign / override / close allowed for any non-Closed status', () => {
    for (const fn of [canAssignFrom, canOverrideSeverityFrom, canCloseFrom]) {
      expect(fn('Pending')).toBe(true);
      expect(fn('InProgress')).toBe(true);
      expect(fn('Closed')).toBe(false);
    }
  });
});
