'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createTicketSchema, SEVERITIES, type CreateTicketInput } from '@/lib/validation/schemas';
import { SEVERITY_META } from '@/lib/status/severity';
import type { Severity } from '@/lib/types/domain';
import { cn } from '@/lib/utils';
import { useCreateTicket } from '@/lib/queries/tickets';
import { useCategories } from '@/lib/queries/catalog';
import { handleMutationError } from '@/lib/api/errors';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NO_CATEGORY = '__none__'; // Radix Select forbids empty-string item values.

type FieldName = 'title' | 'description' | 'severity' | 'categoryId';

// Selected-card colour per severity (literal classes so Tailwind keeps them).
const SEVERITY_CARD: Record<Severity, string> = {
  Critical: 'border-red-500 bg-red-100 text-red-900',
  High: 'border-orange-500 bg-orange-100 text-orange-900',
  Medium: 'border-yellow-500 bg-yellow-100 text-yellow-900',
  Low: 'border-green-500 bg-green-100 text-green-900',
};

/** S1 — create a ticket (severity required, attachments, client + server validation). */
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
    fd.set('severity', values.severity);
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
            } else if (['title', 'description', 'severity', 'categoryId'].includes(key)) {
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
          name="severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mức độ ưu tiên <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {SEVERITIES.map((s) => {
                    const selected = field.value === s;
                    return (
                      <Label
                        key={s}
                        htmlFor={`sev-${s}`}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-3 text-center font-normal transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1',
                          selected
                            ? SEVERITY_CARD[s]
                            : 'border-border bg-card text-foreground hover:bg-accent',
                        )}
                      >
                        <RadioGroupItem value={s} id={`sev-${s}`} className="sr-only" />
                        <span className="text-3xl" aria-hidden>
                          {SEVERITY_META[s].emoji}
                        </span>
                        <span className="text-sm font-semibold">{SEVERITY_META[s].label}</span>
                        <span className="text-[11px] opacity-70">{SEVERITY_META[s].viLabel}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
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
