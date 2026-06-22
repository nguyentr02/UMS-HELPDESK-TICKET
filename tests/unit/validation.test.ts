import { describe, expect,it } from 'vitest';

import { attachmentError, createTicketSchema, MAX_FILE_BYTES } from '@/lib/validation/schemas';

describe('zod schemas', () => {
  it('createTicket requires title ≥ 3 chars; severity is no longer collected', () => {
    expect(createTicketSchema.safeParse({ title: 'ab', description: 'x' }).success).toBe(false);
    expect(createTicketSchema.safeParse({ title: 'Mất điện', description: 'x' }).success).toBe(true);
    // Extra/unknown fields (e.g. severity from older clients) are ignored, not rejected.
    expect(
      createTicketSchema.safeParse({ title: 'Mất điện', description: 'x', severity: 'High' }).success,
    ).toBe(true);
  });
});

describe('attachmentError', () => {
  it('rejects unsupported types and oversized files, accepts valid ones', () => {
    expect(attachmentError({ type: 'application/x-msdownload', size: 1 })).toBeTruthy();
    expect(attachmentError({ type: 'image/png', size: MAX_FILE_BYTES + 1 })).toBeTruthy();
    expect(attachmentError({ type: 'image/png', size: 100 })).toBeNull();
  });
});
