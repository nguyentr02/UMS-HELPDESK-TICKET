'use client';

import { Button } from '@/components/ui/button';
import { googleLoginUrl } from '@/lib/api/auth';

/**
 * "Đăng nhập bằng Google" button — initiates the OAuth Authorization Code
 * Flow by full-page-navigating to the BE's `/auth/google`. We never `fetch()`
 * the redirect: it has to be a top-level browser navigation so Google can
 * actually take over the page.
 *
 * `next` is the FE path the BE should redirect the browser to after the
 * callback completes; the BE sanitizes it server-side so this prop only
 * needs to be a hint (defaults to "/").
 */
export function GoogleLoginButton({ next = '/' }: { next?: string }) {
  function handleClick() {
    if (typeof window === 'undefined') return;
    window.location.href = googleLoginUrl(next);
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="w-full gap-2 border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50"
      aria-label="Đăng nhập bằng Google"
    >
      <GoogleGlyph className="h-4 w-4 shrink-0" />
      Đăng nhập bằng Google
    </Button>
  );
}

/** Official Google "G" mark — 4-color SVG, marked decorative for screen readers. */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
