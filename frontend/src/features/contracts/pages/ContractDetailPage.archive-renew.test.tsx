import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import ContractDetailPage from './ContractDetailPage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function buildContract(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'contract1',
    contractNumber: 'CLM-2026-000001',
    title: 'Acme Vendor Agreement',
    contractType: 'Vendor',
    department: 'dept1',
    businessUnit: 'bu1',
    parties: [],
    effectiveDate: null,
    expiryDate: null,
    status: 'Active',
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

describe('ContractDetailPage — Archive and Renew', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an Archive button for a non-archived contract and calls the archive endpoint on confirm', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Active' })));
    vi.mocked(axiosClient.delete).mockResolvedValue({ data: { data: buildContract({ status: 'Archived' }) } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderPage();

    const archiveButton = await screen.findByRole('button', { name: /^archive$/i });
    await user.click(archiveButton);

    await waitFor(() => expect(axiosClient.delete).toHaveBeenCalledWith('/contracts/contract1'));
  });

  it('does not call the archive endpoint if the confirm dialog is declined', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Active' })));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();

    const archiveButton = await screen.findByRole('button', { name: /^archive$/i });
    await user.click(archiveButton);

    expect(axiosClient.delete).not.toHaveBeenCalled();
  });

  it('does not show an Archive button for an already-archived contract', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Archived' })));
    renderPage();

    await screen.findByText('Acme Vendor Agreement');
    expect(screen.queryByRole('button', { name: /^archive$/i })).not.toBeInTheDocument();
  });

  it('shows a Renew button for an Active contract, submits new terms, and navigates to the renewed contract', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Active' })));
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: { _id: 'contract2' } } });
    const user = userEvent.setup();
    renderPage();

    const renewButton = await screen.findByRole('button', { name: /^renew$/i });
    await user.click(renewButton);

    fireEvent.change(await screen.findByLabelText('New Expiry Date'), { target: { value: '2027-06-01' } });
    fireEvent.change(screen.getByLabelText(/New Value/), { target: { value: '9000' } });

    await user.click(screen.getByRole('button', { name: /confirm renewal/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/contracts/contract1/renew',
        expect.objectContaining({ contractValue: 9000 })
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/contracts/contract2');
  });

  it('shows a disabled Renew button with a reason for a Draft contract', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGetForContract(buildContract({ status: 'Draft' })));
    renderPage();

    const renewButton = await screen.findByRole('button', { name: /^renew$/i });
    expect(renewButton).toBeDisabled();
    expect(renewButton).toHaveAttribute('title', expect.stringContaining('Draft'));
  });

  it('shows a disabled Renew button for a contract that has already been renewed', async () => {
    vi.mocked(axiosClient.get).mockImplementation(
      mockGetForContract(buildContract({ status: 'Active', renewedTo: 'contract2' }))
    );
    renderPage();

    const renewButton = await screen.findByRole('button', { name: /^renew$/i });
    expect(renewButton).toBeDisabled();
    expect(renewButton).toHaveAttribute('title', expect.stringContaining('already been renewed'));
    expect(await screen.findByText(/view the renewal/i)).toBeInTheDocument();
  });
});
