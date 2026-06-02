import { upload } from '@vercel/blob/client';
import { BASE_URL } from './client';

export interface UploadedAttachment {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Uploads files directly to Vercel Blob via the BE's signed-token broker.
 * Bypasses Vercel's 4.5 MB function-body limit so the project's 10 MB-per-file
 * cap actually works end-to-end.
 *
 * Returns the metadata array the BE expects in the `attachments` field of
 * POST /tickets (and POST /:id/comments).
 */
export async function uploadFilesToBlob(files: File[]): Promise<UploadedAttachment[]> {
  if (!files.length) return [];
  const handleUploadUrl = `${BASE_URL}/attachments/upload-url`;
  return Promise.all(
    files.map(async (file) => {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl,
        contentType: file.type || undefined,
      });
      return {
        url: blob.url,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      };
    }),
  );
}
