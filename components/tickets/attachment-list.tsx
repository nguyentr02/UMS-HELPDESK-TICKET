import { Paperclip } from 'lucide-react';
import type { Attachment } from '@/lib/types/domain';
import { BASE_URL } from '@/lib/api/client';

/**
 * Prefer the direct Blob URL (`a.url`) — the BE proxy at /attachments/:id
 * requires SSO headers which a plain `<a href>` doesn't send (would 401).
 * Fall back to the proxy for legacy memory/disk-stored attachments.
 */
function downloadHrefFor(a: Attachment): string {
  return a.url ?? `${BASE_URL}/attachments/${a.id}`;
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
