import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { localDateInputToISOString } from '../../../shared/lib/localDate';
import ContractCreatePage from './ContractCreatePage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn() },
}));

const BUSINESS_UNITS = [{ _id: 'bu1', name: 'Operations' }];
const DEPARTMENTS = [{ _id: 'dept1', name: 'Procurement' }];

function mockGet(url: string) {
  if (url === '/business-units') return Promise.resolve({ data: { data: BUSINESS_UNITS } });
  if (url === '/departments') return Promise.resolve({ data: { data: DEPARTMENTS } });
  if (url === '/templates') return Promise.resolve({ data: { data: [] } });
  return Promise.reject(new Error(`Unexpected GET ${url}`));
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ContractCreatePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ContractCreatePage — Parties and Effective Date', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosClient.get).mockImplementation(mockGet);
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: { _id: 'contract1' } } });
  });

  it('sends effectiveDate and a filled-in party on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Title'), 'Acme Vendor Deal');
    fireEvent.change(screen.getByLabelText('Effective Date'), { target: { value: '2026-09-01' } });

    await user.click(screen.getByRole('button', { name: '+ Add Party' }));
    fireEvent.change(screen.getByLabelText('Party 1 name'), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText('Party 1 role'), { target: { value: 'Vendor' } });

    await user.selectOptions(screen.getByLabelText('Business Unit'), 'bu1');
    await user.selectOptions(await screen.findByLabelText('Department'), 'dept1');

    await user.click(screen.getByRole('button', { name: /create contract/i }));

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [, body] = vi.mocked(axiosClient.post).mock.calls[0];
    const payload = body as { effectiveDate?: string; parties: { name: string; role: string; partyType: string }[] };
    
    
    
    
    
    
    expect(payload.effectiveDate).toBe(localDateInputToISOString('2026-09-01'));
    expect(payload.parties).toEqual([{ partyType: 'Vendor', name: 'Acme Corp', role: 'Vendor' }]);
  });

  it('drops a party row that was added but left entirely blank', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Title'), 'Blank Party Row');
    await user.click(screen.getByRole('button', { name: '+ Add Party' }));
    
    await user.selectOptions(screen.getByLabelText('Business Unit'), 'bu1');
    await user.selectOptions(await screen.findByLabelText('Department'), 'dept1');

    await user.click(screen.getByRole('button', { name: /create contract/i }));

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [, body] = vi.mocked(axiosClient.post).mock.calls[0];
    expect((body as { parties: unknown[] }).parties).toEqual([]);
  });

  it('removes a party row when Remove is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '+ Add Party' }));
    expect(screen.getByLabelText('Party 1 name')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove party 1'));
    expect(screen.queryByLabelText('Party 1 name')).not.toBeInTheDocument();
  });

  it('omits effectiveDate when left blank', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Title'), 'No Effective Date');
    await user.selectOptions(screen.getByLabelText('Business Unit'), 'bu1');
    await user.selectOptions(await screen.findByLabelText('Department'), 'dept1');

    await user.click(screen.getByRole('button', { name: /create contract/i }));

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [, body] = vi.mocked(axiosClient.post).mock.calls[0];
    expect(body).not.toHaveProperty('effectiveDate', expect.anything());
    expect((body as { effectiveDate?: string }).effectiveDate).toBeUndefined();
  });
});
