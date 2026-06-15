'use client';

import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CredentialHelperNote } from '@/components/auth/credential-helper-note';
import { LoginForm, type LoginFormHandle } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Map BE callback error codes (`/login?error=<code>`) to user-facing messages.
 * Source of codes: `feat-helpdesk-api/src/routes/auth.ts` GET /auth/google/callback.
 */
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Phiên đăng nhập Google đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
  google_verification_failed: 'Xác minh tài khoản Google thất bại. Vui lòng thử lại.',
  domain_not_allowed:
    'Tài khoản Google không thuộc miền cho phép (@ums.edu.vn hoặc @dau.edu.vn).',
  account_disabled:
    'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
  access_denied: 'Bạn đã từ chối cấp quyền cho ứng dụng. Vui lòng thử lại nếu cần.',
  unknown_error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.',
};

/**
 * Demo login page. Full-screen overlay above the AppShell chrome.
 *
 * On `lg:+` it's a two-column layout: left brand panel shows just the DAU
 * logo on the landing watermark background; right column hosts the login
 * card. Below `lg:` only the login card shows.
 *
 * Logged-in visitors hitting `/login` are bounced to their role's home by
 * `AuthGate` (Feature Plan §11.5); this page renders only for anonymous calls.
 */
export default function LoginPage() {
  const formRef = useRef<LoginFormHandle | null>(null);
  const router = useRouter();
  const [externalError, setExternalError] = useState<string | null>(null);
  // `null` until the boot-effect decides whether to open the note. We can't
  // peek at `window.location` in the initial render without risking a
  // hydration mismatch — so the note simply doesn't render for a frame, and
  // then opens (no error) or stays closed (with error). Avoids the flash
  // where the modal opens briefly before the error handler closes it.
  const [noteOpen, setNoteOpen] = useState<boolean | null>(null);

  // Surface BE callback errors (e.g. `/login?error=domain_not_allowed`) two
  // ways: a sticky toast (10 s — long enough to read) AND a persistent
  // inline amber banner on the form (caught by users who blinked past the
  // toast). Reads from `window.location.search` directly to avoid pulling
  // `useSearchParams` into the page — that opts the route out of static
  // optimization unless wrapped in <Suspense>.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('error');
    if (code) {
      const message = GOOGLE_ERROR_MESSAGES[code] ?? GOOGLE_ERROR_MESSAGES.unknown_error;
      setExternalError(message);
      setNoteOpen(false);
      toast.error(message, { duration: 10_000 });
      router.replace('/login');
      return;
    }
    // Plain `/login` visit (no Google round-trip residue) — open the note.
    setNoteOpen(true);
  }, [router]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left — brand visual (lg:+ only): blurred landing watermark + DAU logo. */}
        <aside className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:px-10 lg:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 scale-110 bg-cover bg-center bg-no-repeat blur-sm"
            style={{ backgroundImage: "url('/landing-bg.png')" }}
          />
          <div className="flex flex-col items-center gap-5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dau-logo.png"
              alt="DAU"
              width={220}
              height={220}
              className="h-44 w-44 [filter:drop-shadow(0_0_24px_rgba(220,38,38,0.55))] xl:h-56 xl:w-56"
            />
            <p className="whitespace-nowrap text-sm font-bold tracking-wide text-slate-700 [text-shadow:0_0_14px_rgba(51,65,85,0.4)] sm:text-base xl:text-lg">
              Smart University – Shaping the Future – Integrating Globally
            </p>
          </div>
        </aside>

        {/* Right — login card column. */}
        <section className="flex flex-1 items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md p-6 shadow-2xl ring-1 ring-slate-900/5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-foreground">Đăng nhập</h1>
                <p className="text-sm text-muted-foreground">
                  Nhập email và mật khẩu để truy cập DAU Helpdesk.
                </p>
              </div>
              {noteOpen === false ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 px-2 text-xs text-slate-600 hover:text-slate-900"
                  onClick={() => setNoteOpen(true)}
                  aria-label="Hiện thông tin tài khoản mẫu"
                >
                  <Info className="h-3.5 w-3.5" aria-hidden />
                  Hiện tài khoản mẫu
                </Button>
              ) : null}
            </div>
            <LoginForm ref={formRef} externalError={externalError} />
          </Card>
        </section>
      </div>

      {/* Credential helper modal — controlled from this page; covers the full viewport. */}
      <CredentialHelperNote
        open={noteOpen === true}
        onClose={() => setNoteOpen(false)}
        onPick={(persona) => {
          formRef.current?.setEmail(persona.email);
          formRef.current?.setPassword(persona.password);
        }}
      />
    </div>
  );
}
