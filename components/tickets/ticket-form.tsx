'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { handleMutationError } from '@/lib/api/errors';
import { useCategories } from '@/lib/queries/catalog';
import { useCreateTicket } from '@/lib/queries/tickets';
import { type CreateTicketInput,createTicketSchema } from '@/lib/validation/schemas';

const NO_CATEGORY = '__none__'; // Radix Select forbids empty-string item values.

type FieldName = 'title' | 'description' | 'categoryId';

/** S1 — create a ticket. Severity is set later by Lead/Agent (triage); this
 *  form only collects what the requester actually knows. */
export function TicketForm() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createTicket = useCreateTicket();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: '', description: '', categoryId: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const fd = new FormData();
    fd.set('title', values.title);
    fd.set('description', values.description);
    if (values.categoryId) fd.set('categoryId', values.categoryId);
    for (const f of files) fd.append('files', f);

    try {
      const ticket = await createTicket.mutateAsync(fd);
      toast.success(`Đã tạo yêu cầu ${ticket.code}`);
      router.push('/tickets');
    } catch (err) {
      handleMutationError(err, {
        onUnauthorized: () => router.push('/login'),
        onFields: (fields) => {
          let handled = false;
          for (const [key, message] of Object.entries(fields)) {
            if (key === 'files') {
              setFileError(message);
              handled = true;
            } else if (['title', 'description', 'categoryId'].includes(key)) {
              form.setError(key as FieldName, { message });
              handled = true;
            }
          }
          return handled;
        },
        fallbackMessage: 'Không tạo được yêu cầu, vui lòng thử lại.',
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl>
                <Input placeholder="VD: Không đăng nhập được vào UMS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Danh mục (tuỳ chọn)</FormLabel>
              <Select
                value={field.value ? field.value : NO_CATEGORY}
                onValueChange={(v) => field.onChange(v === NO_CATEGORY ? '' : v)}
              >
                <FormControl>
                  <SelectTrigger aria-label="Danh mục">
                    <SelectValue placeholder="— Chọn danh mục —" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>— Không chọn —</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Mô tả chi tiết vấn đề, kèm bước tái hiện nếu có…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Đính kèm</span>
          <FileUpload
            files={files}
            onChange={(f) => {
              setFiles(f);
              setFileError(undefined);
            }}
            error={fileError}
          />
        </div>

        <div>
          <Button type="submit" disabled={createTicket.isPending}>
            {createTicket.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
