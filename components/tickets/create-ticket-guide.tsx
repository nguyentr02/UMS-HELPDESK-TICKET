import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { SEVERITIES_BY_PRIORITY } from '@/lib/status/severity';
import type { Severity } from '@/lib/types/domain';

const SEVERITY_WHEN: Record<Severity, string> = {
  Critical: 'Gián đoạn diện rộng, nhiều người bị ảnh hưởng (mất điện toà nhà, hệ thống sập).',
  High: 'Ảnh hưởng trực tiếp đến công việc / học tập, cần xử lý sớm.',
  Medium: 'Gây bất tiện nhưng vẫn có thể xoay sở tạm thời.',
  Low: 'Yêu cầu thông thường, không gấp.',
};

/** Helper panel shown beside the create form (fill guide + severity explanation). */
export function CreateTicketGuide() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hướng dẫn điền</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground">Tiêu đề</span> ngắn gọn (3–200 ký tự).
            </li>
            <li>
              Chọn <span className="text-foreground">danh mục</span> phù hợp để định tuyến đúng phòng
              ban.
            </li>
            <li>
              Chọn <span className="text-foreground">mức độ ưu tiên</span> (xem bảng bên dưới).
            </li>
            <li>
              <span className="text-foreground">Mô tả</span> chi tiết, kèm bước tái hiện lỗi nếu có.
            </li>
            <li>Đính kèm ảnh / tài liệu — tối đa 5 tệp, mỗi tệp ≤ 10MB.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mức độ ưu tiên</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3 text-sm">
            {SEVERITIES_BY_PRIORITY.map((s) => (
              <li key={s} className="flex flex-col gap-1">
                <SeverityBadge severity={s} />
                <span className="text-muted-foreground">{SEVERITY_WHEN[s]}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
