import { z } from 'zod';

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề tối thiểu 3 ký tự').max(200, 'Tối đa 200 ký tự'),
  description: z.string().trim().min(1, 'Vui lòng mô tả vấn đề').max(5000, 'Tối đa 5000 ký tự'),
  severity: z.enum(SEVERITIES, { errorMap: () => ({ message: 'Vui lòng chọn mức độ' }) }),
  categoryId: z.string().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const forwardSchema = z.object({
  departmentId: z.string().min(1, 'Chọn phòng ban'),
});

export const redirectSchema = z.object({
  departmentId: z.string().min(1, 'Chọn phòng ban'),
  reason: z.string().trim().min(3, 'Lý do tối thiểu 3 ký tự').max(500, 'Tối đa 500 ký tự'),
});

export const assignSchema = z.object({
  agentId: z.string().min(1, 'Chọn nhân viên Helpdesk'),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Nội dung không được trống').max(5000, 'Tối đa 5000 ký tự'),
});

export const closeSchema = z.object({
  note: z.string().trim().max(2000, 'Tối đa 2000 ký tự').optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  parentId: z.string().optional().nullable(),
});

// Attachment rules — the FE mirrors these for UX; the server is the authority.
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;

/** Returns a Vietnamese error message, or null if the file is acceptable. */
export function attachmentError(file: { type: string; size: number }): string | null {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
  if (!allowed.includes(file.type)) return 'Định dạng tệp không hỗ trợ (chỉ ảnh hoặc tài liệu).';
  if (file.size > MAX_FILE_BYTES) return 'Tệp vượt quá 10MB.';
  return null;
}
