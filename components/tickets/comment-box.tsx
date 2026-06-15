'use client';

import { type FormEvent,useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { handleMutationError } from '@/lib/api/errors';
import { useAddComment } from '@/lib/queries/tickets';

/** Add a comment (matrix: every role can comment). */
export function CommentBox({ ticketId }: { ticketId: string }) {
  const addComment = useAddComment(ticketId);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (body.trim().length < 1) {
      setError('Nội dung không được trống');
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set('body', body.trim());
    try {
      await addComment.mutateAsync(fd);
      setBody('');
      toast.success('Đã gửi bình luận.');
    } catch (err) {
      handleMutationError(err, {
        onFields: (f) => {
          if (f.body) {
            setError(f.body);
            return true;
          }
        },
        fallbackMessage: 'Không gửi được bình luận.',
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Thêm bình luận…"
        aria-label="Bình luận"
        rows={3}
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={addComment.isPending}>
          {addComment.isPending ? 'Đang gửi…' : 'Gửi bình luận'}
        </Button>
      </div>
    </form>
  );
}
