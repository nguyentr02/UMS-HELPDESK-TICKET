import { describe, it, expect } from 'vitest';
import { SEVERITY_META, SEVERITIES_BY_PRIORITY } from '@/lib/status/severity';

describe('severity meta', () => {
  it('orders Critical → Low', () => {
    expect(SEVERITIES_BY_PRIORITY).toEqual(['Critical', 'High', 'Medium', 'Low']);
  });

  it('carries VN label + emoji + color token (three channels)', () => {
    expect(SEVERITY_META.Critical.viLabel).toBe('Nghiêm trọng');
    expect(SEVERITY_META.Critical.emoji).toBe('🔴');
    expect(SEVERITY_META.Low.colorClass).toBe('bg-severity-low');
  });
});
