import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { localDateInputToISOString } from '../../../shared/lib/localDate';
import ContractDetailPage from './ContractDetailPage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function buildContract(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'contract1',
    contractNumber: 'CLM-2026-000001',
    title: 'Acme Vendor Agreement',
    contractType: 'Vendor',
    department: 'dept1',
    businessUnit: 'bu1',
    parties: [{ partyType: 'Vendor', name: 'Acme Corp', role: 'Vendor' }],
    effectiveDate: null,
    expiryDate: null,
    status: 'Draft',
    contractValue: null,
    currency: null,
    tags: [],
    confidentialityLevel: 'Internal',
    renewedFrom: null,
    renewedTo: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function mockGetForContract(contract: ReturnType<typeof buildContract>) {
  return (url: string) => {
    if (url === '/contracts/contract1') return Promise.resolve({ data: { data: contract } });
    if (url === '/contracts/contract1/versions') return Promise.resolve({ data: { data: [] } });
    if (url === '/contracts/contract1/workflow') return Promise.resolve({ data: { data: [] } });
    if (url === '/contracts/contract1/signature') return Promise.resolve({ data: { data: [] } });
    if (url === '/contracts/contract1/obligations') return Promise.resolve({ data: { data: [] } });
    if (url === '/contracts/contract1/documents') return Promise.resolve({ data: { data: [] } });
    if (url === '/business-units') return Promise.resolve({ data: { data: [{ _id: 'bu1', name: 'Operations' }] } });
    if (url === '/departments') return Promise.resolve({ data: { data: [{ _id: 'dept1', name: 'Procurement' }] } });
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/contracts/contract1']}>
        <Routes>
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ContractDetailPage — Edit Details (Parties / Effective Date)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an Edit Details button for a Draft contract', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Draft' })));
    renderPage();

    expect(await screen.findByRole('button', { name: /edit details/i })).toBeInTheDocument();
  });

  it('does not show an Edit Details button for an Active contract', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Active' })));
    renderPage();

    await screen.findByText('Acme Vendor Agreement');
    expect(screen.queryByRole('button', { name: /edit details/i })).not.toBeInTheDocument();
  });

  it('pre-fills the form with the existing party, lets it be edited, and PATCHes on save', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Draft' })));
    vi.mocked(axiosClient.patch).mockResolvedValue({ data: { data: buildContract() } });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /edit details/i }));

    
    expect(await screen.findByDisplayValue('Acme Corp')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Effective Date'), { target: { value: '2026-10-01' } });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(axiosClient.patch).toHaveBeenCalledWith(
        '/contracts/contract1',
        expect.objectContaining({
          
          
          effectiveDate: localDateInputToISOString('2026-10-01'),
          parties: [{ partyType: 'Vendor', name: 'Acme Corp', role: 'Vendor' }],
        })
      );
    });
  });

  it('allows adding a second party in the edit form', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Draft' })));
    vi.mocked(axiosClient.patch).mockResolvedValue({ data: { data: buildContract() } });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /edit details/i }));
    await screen.findByDisplayValue('Acme Corp');

    await user.click(screen.getByRole('button', { name: '+ Add Party' }));
    fireEvent.change(screen.getByLabelText('Party 2 name'), { target: { value: 'Internal Legal' } });
    fireEvent.change(screen.getByLabelText('Party 2 role'), { target: { value: 'Counterparty' } });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(axiosClient.patch).toHaveBeenCalled());
    const [, body] = vi.mocked(axiosClient.patch).mock.calls[0];
    expect((body as { parties: unknown[] }).parties).toHaveLength(2);
  });

  it('closes the edit form and shows the read-only view again after Cancel', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Draft' })));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /edit details/i }));
    await screen.findByDisplayValue('Acme Corp');

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByDisplayValue('Acme Corp')).not.toBeInTheDocument();
    expect(axiosClient.patch).not.toHaveBeenCalled();
  });
});
