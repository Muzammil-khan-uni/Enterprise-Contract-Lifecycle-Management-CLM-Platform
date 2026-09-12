import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { DocumentUpload } from './DocumentUpload';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { post: vi.fn() },
}));

function renderUpload() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentUpload contractId="contract1" />
    </QueryClientProvider>
  );
}

describe('DocumentUpload — Supporting Document type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: { _id: 'doc1' } } });
  });

  it('offers "Supporting Document" as a selectable type', () => {
    renderUpload();
    expect(screen.getByRole('option', { name: 'Supporting Document' })).toBeInTheDocument();
  });

  it('uploads with type=SupportingDocument when selected', async () => {
    const user = userEvent.setup();
    renderUpload();

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'SupportingDocument');

    const file = new File(['contents'], 'policy-appendix.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [, formData] = vi.mocked(axiosClient.post).mock.calls[0];
    expect((formData as FormData).get('type')).toBe('SupportingDocument');
  });
});
