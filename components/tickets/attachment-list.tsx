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
  // Documents (PDF/Office) whose blob the proxy couldn't return — typically an
  // old attachment whose underlying Blob object is gone. We flag the row so it
  // shows a clean "unavailable" state instead of navigating the browser to the
  // raw JSON 404 envelope.
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(new Set());
  if (attachments.length === 0) return null;

  function openPreview(a: Attachment) {
    setImgError(false); // reset for the newly-opened image
    setPreview(a);
  }

  // A plain <a> to /attachments/:id can't catch a missing file — a direct
  // navigation just renders the BE's JSON error. So we fetch the bytes here,
  // then open (PDF) or download (Office) a blob URL, and on failure flip the
  // row to an unavailable state — mirroring the image lightbox's onError.
  function openDocument(a: Attachment) {
    const isPdf = a.mimeType === 'application/pdf';
    // Open the viewer tab synchronously (inside the click gesture) so it isn't
    // blocked as a popup; we point it at the blob once the bytes arrive, or
    // close it on failure. If the browser still blocks it, we fall back to a
    // download below.
    const tab = isPdf ? window.open('', '_blank') : null;
    void (async () => {
      try {
        const res = await fetch(hrefFor(a), { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const url = URL.createObjectURL(await res.blob());
        if (isPdf && tab) {
          tab.location.href = url;
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.download = a.filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        // Give the tab/download a moment to grab the URL before revoking it.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch {
        tab?.close();
        setFailedIds((prev) => new Set(prev).add(a.id));
      }
    })();
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
            ) : failedIds.has(a.id) ? (
              // The proxy couldn't return the file (e.g. the Blob is missing).
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <span className="line-through">{a.filename}</span>
                <span className="text-xs">· tệp không còn khả dụng</span>
              </span>
            ) : (
              // PDFs open inline in a new tab; Office docs download. We fetch via
              // JS (not a plain <a>) so a missing file degrades gracefully.
              <button
                type="button"
                onClick={() => openDocument(a)}
                className="text-left text-primary hover:underline"
              >
                {a.filename}
              </button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="grid-cols-[minmax(0,1fr)] max-w-3xl">
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
              {!imgError && (
                <a
                  href={hrefFor(preview)}
                  download={preview.filename}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Tải xuống
                </a>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}