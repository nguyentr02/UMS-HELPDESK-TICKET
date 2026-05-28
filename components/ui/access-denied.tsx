import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Explicit denial view for RBAC-gated areas (S2 — never a blank screen). */
export function AccessDenied({
  message = 'Bạn không có quyền truy cập khu vực này.',
}: {
  message?: string;
}) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertTitle>Không có quyền</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
