import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { InternalStatusBadge } from '@/components/ui/internal-status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';

describe('badge wrappers', () => {
  it('SeverityBadge exposes label + accessible name (three channels)', () => {
    render(<SeverityBadge severity="High" />);
    expect(screen.getByLabelText('Mức độ Cao')).toHaveTextContent('High');
  });

  it('StatusBadge shows the external VN label', () => {
    render(<StatusBadge status="Processing" />);
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
  });

  it('InternalStatusBadge shows the internal VN label', () => {
    render(<InternalStatusBadge status="Pending" />);
    expect(screen.getByText('Chờ tiếp nhận')).toBeInTheDocument();
  });
});
