'use client';

import { Download, ImageOff, Paperclip } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BASE_URL } from '@/lib/api/client';
import type { Attachment } from '@/lib/types/domain';

/**
 * Always go through the auth'd BE proxy at /attachments/:id — same-origin via
 * the /api/v1 rewrite, so the first-party session cookie rides along and the
 * proxy enforces per-ticket access. We never link the raw public Blob URL.
 *
 * The proxy serves images + PDFs `inline` and everything else `attachment`, so:
 *   - images   → previewed in an in-page lightbox (light, safe — can't execute),
 *   - PDFs     → opened in a new tab → the browser's native (sandboxed) viewer,
 *   - docx/xls → downloaded (no safe in-browser viewer).
 */
function hrefFor(a: Attachment): string {
  return `${BASE_URL}/attachments/${a.id}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [imgError, setImgError] = useState(false);
  if (attachments.length === 0) return null;

  function openPreview(a: Attachment) {
    setImgError(false); // reset for the newly-opened image
    setPreview(a);
  }

  return (
    <>
      <ul className="flex flex-col gap-1 text-sm">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {a.kind === 'Image' ? (
              // Images preview in a lightbox (no navigation away from the ticket).
              <button
                type="button"
                onClick={() => openPreview(a)}
                className="text-left text-primary hover:underline"
              >
                {a.filename}
              </button>
            ) : (
              // PDFs open inline in a new tab; Office docs download (BE disposition).
              <a
                href={hrefFor(a)}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {a.filename}
              </a>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.filename}</DialogTitle>
            <DialogDescription>
              {preview ? `Hình ảnh · ${formatBytes(preview.sizeBytes)}` : null}
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              {imgError ? (
                // The proxy couldn't return the file (e.g. the Blob is missing).
                // Show a clean state instead of a broken-image icon.
                <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                  <ImageOff className="h-10 w-10" aria-hidden />
                  <p className="text-sm">Không tải được hình ảnh.</p>
                </div>
              ) : (
                // Plain <img>, not next/image: the source is the auth'd proxy, which
                // the Next image optimizer can't reach with the user's cookie.
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={hrefFor(preview)}
                  alt={preview.filename}
                  onError={() => setImgError(true)}
                  className="max-h-[70vh] max-w-full rounded-md object-contain"
                />
              )}
              <a
                href={hrefFor(preview)}
                download={preview.filename}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Tải xuống
              </a>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}