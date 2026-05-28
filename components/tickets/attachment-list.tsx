import { Paperclip } from 'lucide-react';
import type { Attachment } from '@/lib/types/domain';
import { BASE_URL } from '@/lib/api/client';

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <a
            href={`${BASE_URL}/attachments/${a.id}`}
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
