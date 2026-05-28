'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  ALLOWED_DOC_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_FILES,
  attachmentError,
} from '@/lib/validation/schemas';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ACCEPT = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].join(',');

export interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Server-side error to surface (e.g. mapped from a 422). */
  error?: string;
}

/** Multi-file picker mirroring the server's type/size/count rules for UX. */
export function FileUpload({ files, onChange, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    let err: string | null = null;
    const accepted: File[] = [];
    for (const file of Array.from(selected)) {
      const e = attachmentError(file);
      if (e) {
        err = e;
        continue;
      }
      accepted.push(file);
    }
    let next = [...files, ...accepted];
    if (next.length > MAX_FILES) {
      err = `Tối đa ${MAX_FILES} tệp.`;
      next = next.slice(0, MAX_FILES);
    }
    setLocalError(err);
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const shownError = localError ?? error ?? null;

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        aria-label="Đính kèm tệp"
        onChange={(e) => addFiles(e.target.files)}
        className="cursor-pointer"
      />
      <p className="text-xs text-muted-foreground">
        Ảnh hoặc tài liệu, tối đa {MAX_FILES} tệp · 10MB mỗi tệp.
      </p>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <Badge variant="secondary" className="gap-1 font-normal">
                <span className="max-w-[12rem] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Xóa ${file.name}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {shownError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}
