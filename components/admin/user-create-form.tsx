'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartments } from '@/lib/queries/catalog';
import { useCreateUser } from '@/lib/queries/users';
import { ROLE_VI } from '@/lib/auth/nav';
import { handleMutationError } from '@/lib/api/errors';
import { ApiError } from '@/lib/api/client';
import { addCreatedPersona } from '@/lib/auth/created-personas';
import { NAME_REGEX, NAME_ERROR } from '@/lib/validation/user-name';
import type { Role } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const NO_DEPT = '__none__'; // Radix Select forbids empty string item values.

const ROLE_OPTIONS: Role[] = ['SV', 'GV', 'NV', 'HelpdeskAgent', 'HelpdeskLead', 'DeptStaff', 'Admin'];

/**
 * Zod schema mirrors the BE `CreateUserBody` shape (routes/users.ts):
 *   - email: trimmed, lower-cased, email format, max 200
 *   - displayName: 2–200 chars, letters (incl. Vietnamese diacritics) + spaces only
 *   - role: required enum
 *   - departmentId: required only when role=DeptStaff (cross-field refine)
 *   - password: optional, ≥ 8 chars when set
 */
const FormSchema = z
  .object({
    email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ').max(200),
    displayName: z
      .string()
      .trim()
      .min(2, 'Tối thiểu 2 ký tự')
      .max(200)
      .regex(NAME_REGEX, NAME_ERROR),
    role: z.enum(ROLE_OPTIONS as [Role, ...Role[]], { required_error: 'Chọn vai trò' }),
    departmentId: z.string(),
    password: z.string().refine((v) => v === '' || v.length >= 8, 'Mật khẩu tối thiểu 8 ký tự'),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'DeptStaff' && !data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['departmentId'],
        message: 'Bắt buộc cho vai trò DeptStaff',
      });
    }
  });

type FormValues = z.infer<typeof FormSchema>;
type FieldName = 'email' | 'displayName' | 'role' | 'departmentId' | 'password';
const FIELD_NAMES: FieldName[] = ['email', 'displayName', 'role', 'departmentId', 'password'];

/**
 * Admin-only "Create user" form. POSTs to `/users` and on success navigates
 * to `/admin/users/[id]` for quick verification. Password is optional — blank
 * = SSO-only login.
 *
 * Steps outside the helpdesk's bounded context (M1/IAM normally owns user
 * lifecycle); kept here for the practice/demo flow per explicit decision.
 */
export function UserCreateForm() {
  const router = useRouter();
  const create = useCreateUser();
  const departments = useDepartments();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', displayName: '', role: 'SV', departmentId: '', password: '' },
  });

  const selectedRole = form.watch('role');
  const deptRequired = selectedRole === 'DeptStaff';

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await create.mutateAsync({
        email: values.email,
        displayName: values.displayName,
        role: values.role,
        departmentId: values.departmentId || null,
        password: values.password || null,
      });
      // Surface the new user on the /login credential helper so the admin can
      // recognize "yes that account I just made shows up here" and the click
      // auto-fills the email. **Password is never persisted client-side** —
      // see lib/auth/created-personas.ts for the rationale.
      addCreatedPersona({
        id: created.id,
        email: created.email,
        displayName: created.displayName,
        role: created.role,
        departmentCode: created.department?.code ?? null,
      });
      toast.success(`Đã tạo người dùng ${created.displayName}`);
      router.push(`/admin/users/${created.id}`);
    } catch (err) {
      // 409 = duplicate email — surface as an inline field error instead of the
      // generic "stale data" toast that handleMutationError emits.
      if (err instanceof ApiError && err.status === 409) {
        form.setError('email', { message: err.message || 'Email đã được sử dụng' });
        return;
      }
      handleMutationError(err, {
        onUnauthorized: () => router.push('/login'),
        onFields: (fields) => {
          let handled = false;
          for (const [key, message] of Object.entries(fields)) {
            if (FIELD_NAMES.includes(key as FieldName)) {
              form.setError(key as FieldName, { message });
              handled = true;
            }
          }
          return handled;
        },
        fallbackMessage: 'Không tạo được người dùng, vui lòng thử lại.',
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Tạo người dùng">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="off"
                  placeholder="newuser@ums.edu.vn"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <FormControl>
                <Input placeholder="Nguyễn Văn Mới" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vai trò</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Vai trò">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_VI[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phòng ban {deptRequired ? <span className="text-red-600">*</span> : null}
                </FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === NO_DEPT ? '' : v)}
                  value={field.value === '' ? NO_DEPT : field.value}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Phòng ban">
                      <SelectValue placeholder="Không có" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_DEPT}>Không có</SelectItem>
                    {(departments.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {deptRequired
                    ? 'Bắt buộc cho vai trò Nhân viên phòng ban.'
                    : 'Tùy chọn cho các vai trò khác.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Để trống nếu chỉ dùng Google SSO"
                    className="pr-10"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  className={cn(
                    'absolute inset-y-0 right-0 flex w-10 items-center justify-center',
                    'rounded-r-md text-slate-500 hover:text-slate-900',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
                  )}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              <FormDescription>
                Để trống ⇒ người dùng chỉ có thể đăng nhập bằng Google SSO. Tối thiểu 8 ký tự khi đặt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/users')}
            disabled={create.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Đang tạo…' : 'Tạo người dùng'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
