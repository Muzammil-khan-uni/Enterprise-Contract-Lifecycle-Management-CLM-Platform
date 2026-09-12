import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { DocumentList } from './DocumentList';
import type { ContractDocument } from '../types';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), delete: vi.fn(), post: vi.fn() },
}));

const DOC: ContractDocument = {
  _id: 'doc1',
  contract: 'contract1',
  type: 'Attachment',
  fileName: 'msa-final.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 204800,
  uploadedBy: 'user1',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  ocrText: null,
};

function renderDocumentList(documents: ContractDocument[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentList documents={documents} contractId="contract1" />
    </QueryClientProvider>
  );
}

describe('DocumentList', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('calls the tracked /download endpoint (not a direct link to storageUrl) when a document is clicked', async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { data: { url: 'https://cdn.example.com/msa-final.pdf' } },
    });
    const user = userEvent.setup();
    renderDocumentList([DOC]);

    await user.click(screen.getByText('msa-final.pdf'));

    await waitFor(() => {
      expect(axiosClient.get).toHaveBeenCalledWith('/contracts/contract1/documents/doc1/download');
    });
  });

  it('opens the URL returned by the download endpoint, not a durable storage URL directly', async () => {
    
    
    
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { data: { url: 'https://cdn.example.com/signed-url-abc123' } },
    });
    const user = userEvent.setup();
    renderDocumentList([DOC]);

    await user.click(screen.getByText('msa-final.pdf'));

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith('https://cdn.example.com/signed-url-abc123', '_blank', 'noopener,noreferrer');
    });
  });

  it('never renders a plain <a href> pointing at storageUrl', () => {
    renderDocumentList([DOC]);
    const link = screen.queryByRole('link', { name: /msa-final\.pdf/i });
    expect(link).not.toBeInTheDocument();
  });

  it('calls the delete endpoint when Delete is clicked', async () => {
    vi.mocked(axiosClient.delete).mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();
    renderDocumentList([DOC]);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(axiosClient.delete).toHaveBeenCalledWith('/contracts/contract1/documents/doc1');
    });
  });

  it('shows an empty-state message when there are no documents', () => {
    renderDocumentList([]);
    expect(screen.getByText(/no documents uploaded yet/i)).toBeInTheDocument();
  });
});

describe('DocumentList — OCR extracted text', () => {
  it('does not show a "View extracted text" button when ocrText is null', () => {
    renderDocumentList([DOC]);
    expect(screen.queryByRole('button', { name: /view extracted text/i })).not.toBeInTheDocument();
  });

  it('shows and toggles the extracted-text panel when ocrText is present', async () => {
    const scanned: ContractDocument = { ...DOC, type: 'ScannedCopy', ocrText: 'This Agreement is made between...' };
    const user = userEvent.setup();
    renderDocumentList([scanned]);

    expect(screen.queryByText(/this agreement is made between/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view extracted text/i }));
    expect(screen.getByText(/this agreement is made between/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /hide extracted text/i }));
    expect(screen.queryByText(/this agreement is made between/i)).not.toBeInTheDocument();
  });
});
