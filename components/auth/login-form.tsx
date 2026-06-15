'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api/client';
import { safeNextForRole } from '@/lib/auth/nav';
import { useLoginMutation } from '@/lib/queries/auth';
import { cn } from '@/lib/utils';

import { GoogleLoginButton } from './google-login-button';

const LoginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type LoginValues = z.infer<typeof LoginSchema>;

export interface LoginFormHandle {
  /** Programmatically fill the email field (used by the credential helper note). */
  setEmail: (email: string) => void;
  /** Programmatically fill the password field (used by the credential helper note). */
  setPassword: (password: string) => void;
}

export interface LoginFormProps {
  /**
   * Persistent error banner shown at the top of the form. Used by the parent
   * page to surface BE-callback failures (e.g. `?error=domain_not_allowed`)
   * that the user might miss as a transient toast.
   */
  externalError?: string | null;
}

/**
 * Email + password form. On 401 surfaces a single field-agnostic error
 * ("Sai email hoặc mật khẩu") so reviewers can't enumerate users. After a
 * successful login redirects to `?next=` (when allowed by the role) or the
 * role's home route.
 *
 * The password field hides input by default and exposes a click-to-reveal eye
 * icon that animates between Eye / EyeOff. Auto-fill from the credential
 * helper note still respects this — the visible characters are the persona's
 * password whenever the user toggles reveal on.
 */
export const LoginForm = forwardRef<LoginFormHandle, LoginFormProps>(function LoginForm(
  { externalError },
  ref,
) {
  const router = useRouter();
  const login = useLoginMutation();
  const [topLevelError, setTopLevelError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  useImperativeHandle(ref, () => ({
    setEmail: (email: string) => {
      form.setValue('email', email, { shouldValidate: false, shouldDirty: true });
    },
    setPassword: (password: string) => {
      form.setValue('password', password, { shouldValidate: false, shouldDirty: true });
    },
  }));

  async function onSubmit(values: LoginValues) {
    setTopLevelError(null);
    try {
      const result = await login.mutateAsync(values);
      // Read `?next=` via window.location so we don't pull useSearchParams
      // into the build — see the note in auth-gate.tsx. `safeNextForRole`
      // validates the path against the user's role and falls back to home
      // when the role can't access it (e.g. SV bouncing through
      // `/login?next=%2Fanalytics`).
      const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const rawNext = params?.get('next');
      const decoded = rawNext ? decodeURIComponent(rawNext) : null;
      router.replace(safeNextForRole(decoded, result.user.role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setTopLevelError('Sai email hoặc mật khẩu');
        return;
      }
      if (err instanceof ApiError && err.status === 429) {
        setTopLevelError(err.message || 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau.');
        return;
      }
      setTopLevelError('Không thể đăng nhập. Vui lòng thử lại.');
    }
  }

  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
      aria-label="Đăng nhập"
    >
      {externalError ? (
        <p
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="alert"
        >
          {externalError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'login-email-error' : undefined}
          {...form.register('email')}
        />
        {emailError ? (
          <p id="login-email-error" className="text-xs text-red-600" role="alert">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'login-password-error' : undefined}
            className="pr-10"
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {/*
              Two icons stacked at the same position; crossfade + scale +
              rotate between them when `showPassword` flips. Keeps the button
              visually anchored while the icon swap animates.
            */}
            <span className="relative h-4 w-4">
              <Eye
                aria-hidden
                className={cn(
                  'absolute inset-0 h-4 w-4 transition-all duration-200',
                  showPassword
                    ? 'rotate-90 scale-50 opacity-0'
                    : 'rotate-0 scale-100 opacity-100',
                )}
              />
              <EyeOff
                aria-hidden
                className={cn(
                  'absolute inset-0 h-4 w-4 transition-all duration-200',
                  showPassword
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-50 opacity-0',
                )}
              />
            </span>
          </button>
        </div>
        {passwordError ? (
          <p id="login-password-error" className="text-xs text-red-600" role="alert">
            {passwordError}
          </p>
        ) : null}
      </div>

      {topLevelError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {topLevelError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={login.isPending} aria-label="Đăng nhập">
        {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs uppercase tracking-wider text-muted-foreground">
            hoặc
          </span>
        </div>
      </div>

      <GoogleLoginButton />
    </form>
  );
});
