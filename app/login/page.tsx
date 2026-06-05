'use client';

import { useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CredentialHelperNote } from '@/components/auth/credential-helper-note';
import { LoginForm, type LoginFormHandle } from '@/components/auth/login-form';

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
  const [noteOpen, setNoteOpen] = useState(true);

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
          <Card className="w-full max-w-md p-6 shadow-md">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-foreground">Đăng nhập</h1>
                <p className="text-sm text-muted-foreground">
                  Nhập email và mật khẩu để truy cập DAU Helpdesk.
                </p>
              </div>
              {!noteOpen ? (
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
            <LoginForm ref={formRef} />
          </Card>
        </section>
      </div>

      {/* Credential helper modal — controlled from this page; covers the full viewport. */}
      <CredentialHelperNote
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        onPick={(persona) => {
          formRef.current?.setEmail(persona.email);
          formRef.current?.setPassword(persona.password);
        }}
      />
    </div>
  );
}
