import { describe, expect,it } from 'vitest';

import {
  backlogAgeDays,
  EXTERNAL_STATUS_VI,
  INTERNAL_STATUS_VI,
  isOpen,
  OPEN_STATUSES,
  toExternalStatus,
} from '@/lib/status/status';

describe('status mappers', () => {
  it('maps the 4 internal statuses to 3 external', () => {
    expect(toExternalStatus('Pending')).toBe('Requested');
    expect(toExternalStatus('Assigned')).toBe('Requested');
    expect(toExternalStatus('InProgress')).toBe('Processing');
    expect(toExternalStatus('Closed')).toBe('Finished');
  });

  it('exposes VN labels', () => {
    expect(EXTERNAL_STATUS_VI.Finished).toBe('Hoàn tất');
    expect(INTERNAL_STATUS_VI.InProgress).toBe('Đang xử lý');
  });

  it('treats only Closed as non-open', () => {
    expect(isOpen('Closed')).toBe(false);
    expect(isOpen('Pending')).toBe(true);
    expect(OPEN_STATUSES).not.toContain('Closed');
  });

  it('floors backlog age to whole days and clamps the future to 0', () => {
    const now = new Date('2026-05-28T00:00:00Z');
    expect(backlogAgeDays('2026-05-25T00:00:00Z', now)).toBe(3);
    expect(backlogAgeDays('2026-05-28T05:00:00Z', now)).toBe(0);
  });
});
