import { describe, it, expect } from 'vitest';
import {
  canForwardFrom,
  canRedirectFrom,
  canProgressFrom,
  canCloseFrom,
  canAssignFrom,
  canOverrideSeverityFrom,
} from '@/lib/status/transitions';

describe('status transition guards (state machine)', () => {
  it('forward only from Pending or Redirected', () => {
    expect(canForwardFrom('Pending')).toBe(true);
    expect(canForwardFrom('Redirected')).toBe(true);
    expect(canForwardFrom('Assigned')).toBe(false);
    expect(canForwardFrom('Closed')).toBe(false);
  });

  it('redirect only from Assigned or InProgress', () => {
    expect(canRedirectFrom('Assigned')).toBe(true);
    expect(canRedirectFrom('InProgress')).toBe(true);
    expect(canRedirectFrom('Pending')).toBe(false);
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
