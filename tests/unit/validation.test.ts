import { describe, it, expect } from 'vitest';
import { createTicketSchema, attachmentError, MAX_FILE_BYTES } from '@/lib/validation/schemas';

describe('zod schemas', () => {
  it('createTicket requires title ≥ 3 and a valid severity', () => {
    expect(createTicketSchema.safeParse({ title: 'ab', description: 'x', severity: 'High' }).success).toBe(false);
    expect(createTicketSchema.safeParse({ title: 'Mất điện', description: 'x', severity: 'High' }).success).toBe(true);
    expect(createTicketSchema.safeParse({ title: 'Mất điện', description: 'x', severity: 'Nope' }).success).toBe(false);
  });
});

describe('attachmentError', () => {
  it('rejects unsupported types and oversized files, accepts valid ones', () => {
    expect(attachmentError({ type: 'application/x-msdownload', size: 1 })).toBeTruthy();
    expect(attachmentError({ type: 'image/png', size: MAX_FILE_BYTES + 1 })).toBeTruthy();
    expect(attachmentError({ type: 'image/png', size: 100 })).toBeNull();
  });
});
