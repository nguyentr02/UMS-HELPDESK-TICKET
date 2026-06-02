'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Right-side filter drawer with a backdrop-blurred overlay. The trigger is a
 * single "Bộ lọc" button that surfaces the active filter count so users know
 * something is in effect without opening the drawer.
 *
 * Uses Radix Dialog directly (rather than the shared shadcn Sheet) so the
 * overlay can swap the default solid dim for a translucent blur without
 * touching the Sheet primitives used elsewhere.
 */
export function FilterDrawer({
  activeCount,
  triggerLabel = 'Bộ lọc',
  title = 'Bộ lọc',
  description,
  children,
}: {
  activeCount: number;
  triggerLabel?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shadow-sm" aria-label={triggerLabel}>
          <Filter className="h-4 w-4" aria-hidden />
          <span>{triggerLabel}</span>
          {activeCount > 0 ? (
            <Badge
              variant="default"
              className="ml-1 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-xs"
            >
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-background/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-300 data-[state=open]:duration-300',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng bộ lọc" className="-mr-2">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
