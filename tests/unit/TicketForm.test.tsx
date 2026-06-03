import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { TicketForm } from '@/components/tickets/ticket-form';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: toastSuccess, error: toastError },
  Toaster: () => null,
}));

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Tiêu đề'), 'Mất điện phòng A1');
  await user.type(screen.getByLabelText('Mô tả'), 'Phòng A1 mất điện từ sáng');
}

describe('TicketForm (S1)', () => {
  it('S1-H1: creates a ticket then navigates to My Tickets', async () => {
    // jsdom+undici mangle multipart bodies, so accept any body and return 201.
    server.use(
      http.post(`${base}/tickets`, () =>
        HttpResponse.json(
          { data: { code: 'HD-2026-000123' }, error: null, requestId: 'r' },
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<TicketForm />, { role: 'SV' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/tickets'));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('S1-X1: blocks submit and shows a title error when title is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm />, { role: 'SV' });
    await user.type(screen.getByLabelText('Tiêu đề'), 'ab');
    await user.type(screen.getByLabelText('Mô tả'), 'mô tả hợp lệ');
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    expect(await screen.findByText('Tiêu đề tối thiểu 3 ký tự')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('does not surface a severity field — triage happens later', async () => {
    renderWithProviders(<TicketForm />, { role: 'SV' });
    // No severity radio group; no "Mức độ ưu tiên" label.
    expect(screen.queryByText(/Mức độ ưu tiên/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /High/ })).not.toBeInTheDocument();
  });

  it('S1-X2: maps a 422 to the title field and preserves the form', async () => {
    server.use(
      http.post(`${base}/tickets`, () =>
        HttpResponse.json(
          {
            data: null,
            error: { code: 'validation_error', message: 'bad', fields: { title: 'Tiêu đề bị trùng' } },
            requestId: 'r',
          },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<TicketForm />, { role: 'SV' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    expect(await screen.findByText('Tiêu đề bị trùng')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    // form preserved
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Mất điện phòng A1');
  });

  it('S1-E4: a Dept Staff can open and submit the create form', async () => {
    server.use(
      http.post(`${base}/tickets`, () =>
        HttpResponse.json(
          { data: { code: 'HD-2026-000999' }, error: null, requestId: 'r' },
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<TicketForm />, { role: 'DeptStaff' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/tickets'));
  });
});
