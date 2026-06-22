'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { handleMutationError } from '@/lib/api/errors';
import { updateCreatedPersona } from '@/lib/auth/created-personas';
import { ROLE_VI } from '@/lib/auth/nav';
import { useDepartments } from '@/lib/queries/catalog';
import { useUpdateUser } from '@/lib/queries/users';
import type { Role, User } from '@/lib/types/domain';
import { cn } from '@/lib/utils';
import { NAME_ERROR,NAME_REGEX } from '@/lib/validation/user-name';

const NO_DEPT = '__none__';

const ROLE_OPTIONS: Role[] = ['SV', 'GV', 'NV', 'HelpdeskAgent', 'HelpdeskLead', 'DeptStaff', 'Admin'];

/**
 * Edit-form schema mirrors the BE `UpdateUserBody`:
 *   - displayName: 2–200 chars
 *   - role: required enum
 *   - departmentId: required only when role=DeptStaff (cross-field refine)
 *   - password: optional reset, ≥8 chars when set; blank ⇒ existing hash unchanged
 * Email is intentionally absent — identity changes belong to M1/IAM.
 */
const FormSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Tối thiểu 2 ký tự')
      .max(200)
      .regex(NAME_REGEX, NAME_ERROR),
    role: z.enum(ROLE_OPTIONS as [Role, ...Role[]]),
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
type FieldName = 'displayName' | 'role' | 'departmentId' | 'password';
const FIELD_NAMES: FieldName[] = ['displayName', 'role', 'departmentId', 'password'];

/**
 * Admin-only "Edit user" form. Prefilled from the existing user record; on
 * success navigates back to the detail page. Password input is a reset
 * channel (blank ⇒ leave existing hash alone).
 */
export function UserEditForm({ user }: { user: User }) {
  const router = useRouter();
  const update = useUpdateUser(user.id);
  const departments = useDepartments();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      displayName: user.displayName,
      role: user.role,
      departmentId: user.department?.id ?? '',
      password: '',
    },
  });

  const selectedRole = useWatch({ control: form.control, name: 'role' });
  const deptRequired = selectedRole === 'DeptStaff';

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Only send fields that changed — keeps the PATCH minimal AND avoids
      // re-validating DeptStaff dept invariants when the admin only tweaked
      // the password.
      const patch: Record<string, unknown> = {};
      if (values.displayName !== user.displayName) patch.displayName = values.displayName;
      if (values.role !== user.role) patch.role = values.role;
      const currentDept = user.department?.id ?? '';
      if (values.departmentId !== currentDept) {
        patch.departmentId = values.departmentId === '' ? null : values.departmentId;
      }
      if (values.password) patch.password = values.password;

      if (Object.keys(patch).length === 0) {
        toast.info('Không có thay đổi nào để lưu.');
        return;
      }

      const updated = await update.mutateAsync(patch);
      // Mirror the new identity into the localStorage-backed credential
      // helper list (no-op if the user is a seeded persona, which lives in
      // the bundled PERSONAS constant). Without this, a role/dept change
      // would leave the helper showing the user under their old role tab.
      updateCreatedPersona(updated.id, {
        displayName: updated.displayName,
        role: updated.role,
        departmentCode: updated.department?.code ?? null,
      });
      toast.success(`Đã cập nhật ${updated.displayName}`);
      router.push(`/admin/users/${updated.id}`);
    } catch (err) {
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
        fallbackMessage: 'Không cập nhật được người dùng, vui lòng thử lại.',
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Cập nhật người dùng">
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">Email: </span>
          <span className="font-mono">{user.email}</span>
          <FormDescription className="mt-1 text-xs">
            Email không thể chỉnh sửa tại đây — thuộc về M1 (IAM).
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phòng ban only applies to DeptStaff — hidden for other roles.
            Switching away clears the value so a stale dept isn't sent. */}
        <div className={deptRequired ? 'grid gap-5 sm:grid-cols-2' : ''}>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vai trò</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v !== 'DeptStaff') form.setValue('departmentId', '');
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Vai trò">
                      <SelectValue />
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

          {deptRequired ? (
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phòng ban <span className="text-red-600">*</span>
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
                  <FormDescription>Bắt buộc cho vai trò Nhân viên phòng ban.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đặt lại mật khẩu</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Để trống nếu không đổi mật khẩu"
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
                Tối thiểu 8 ký tự khi đặt mới. Để trống ⇒ giữ nguyên mật khẩu cũ.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/admin/users/${user.id}`)}
            disabled={update.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
