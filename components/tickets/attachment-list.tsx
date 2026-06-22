import { Paperclip } from 'lucide-react';

import { BASE_URL } from '@/lib/api/client';
import type { Attachment } from '@/lib/types/domain';

/**
 * Always download through the auth'd BE proxy at /attachments/:id. It's
 * same-origin (via the /api/v1 rewrite), so the browser sends the first-party
 * session cookie on a plain `<a href>` navigation — the proxy then enforces
 * per-ticket access (assertCanViewTicket) and forces a safe `attachment`
 * disposition. We never link the raw public Blob URL (that would bypass authz).
 */
function downloadHrefFor(a: Attachment): string {
  return `${BASE_URL}/attachments/${a.id}`;
}

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <a
            href={downloadHrefFor(a)}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {a.filename}
          </a>
        </li>
      ))}
    </ul>
  );
}
