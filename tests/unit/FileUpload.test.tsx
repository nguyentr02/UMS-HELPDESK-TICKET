import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';

function Harness() {
  const [files, setFiles] = useState<File[]>([]);
  return <FileUpload files={files} onChange={setFiles} />;
}

const img = (name: string) => new File(['x'], name, { type: 'image/png' });

describe('FileUpload (S1 attachments)', () => {
  it('S1-E2: rejects the 6th file and keeps the first 5', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Đính kèm tệp');
    await user.upload(input, [img('a.png'), img('b.png'), img('c.png'), img('d.png'), img('e.png'), img('f.png')]);
    expect(await screen.findByText('Tối đa 5 tệp.')).toBeInTheDocument();
    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.queryByText('f.png')).not.toBeInTheDocument();
  });

  it('restricts the picker to image/document types via accept', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Đính kèm tệp');
    // The accept attribute is the first-line type guard; attachmentError() (unit-tested
    // in validation.test.ts) is the defense for anything that slips through.
    expect(input).toHaveAttribute('accept', expect.stringContaining('image/png'));
    expect(input).toHaveAttribute('accept', expect.stringContaining('application/pdf'));
    expect(input.getAttribute('accept')).not.toContain('application/x-msdownload');
  });
});
