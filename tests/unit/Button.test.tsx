import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button (shadcn primitive)', () => {
  it('renders its label as a button', () => {
    render(<Button>Bắt đầu</Button>);
    expect(screen.getByRole('button', { name: 'Bắt đầu' })).toBeInTheDocument();
  });

  it('applies the destructive variant', () => {
    render(<Button variant="destructive">Đóng</Button>);
    expect(screen.getByRole('button', { name: 'Đóng' }).className).toContain('bg-destructive');
  });

  it('renders as a child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/tickets">Yêu cầu của tôi</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Yêu cầu của tôi' })).toHaveAttribute(
      'href',
      '/tickets',
    );
  });
});
