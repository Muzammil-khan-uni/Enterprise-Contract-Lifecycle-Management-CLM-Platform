import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import ContractCreatePage from './ContractCreatePage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn() },
}));

const BUSINESS_UNITS = [{ _id: 'bu1', name: 'Operations' }];
const DEPARTMENTS = [{ _id: 'dept1', name: 'Procurement' }];
const TEMPLATES = [
  { _id: 'tmpl1', name: 'Vendor Agreement', contractType: 'Vendor' },
  { _id: 'tmpl2', name: 'Offer Letter', contractType: 'Employment' },
];
const TEMPLATE_FOR_AUTHORING = {
  _id: 'tmpl1',
  name: 'Vendor Agreement',
  contractType: 'Vendor',
  isActive: true,
  sections: [
    {
      title: 'Payment Terms',
      order: 1,
      clauses: [{ title: 'Payment', text: 'Vendor shall be paid {{amount}}.' }],
    },
  ],
  variables: [{ name: 'amount', label: 'Payment Amount', type: 'number', required: true }],
};

function mockGet(url: string) {
  if (url === '/business-units') return Promise.resolve({ data: { data: BUSINESS_UNITS } });
  if (url === '/departments') return Promise.resolve({ data: { data: DEPARTMENTS } });
  if (url === '/templates') return Promise.resolve({ data: { data: TEMPLATES } });
  if (url === '/templates/tmpl1/for-authoring') return Promise.resolve({ data: { data: TEMPLATE_FOR_AUTHORING } });
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

describe('ContractCreatePage — Start from Template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosClient.get).mockImplementation(mockGet);
  });

  it('only offers templates matching the selected contract type', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(axiosClient.get).toHaveBeenCalledWith('/templates'));

    
    
    expect(await screen.findByRole('option', { name: 'Vendor Agreement' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Offer Letter' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Contract Type'), 'Employment');

    expect(await screen.findByRole('option', { name: 'Offer Letter' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Vendor Agreement' })).not.toBeInTheDocument();
  });

  it('shows a variable-fill form and live preview once a template is picked', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('option', { name: 'Vendor Agreement' });
    await user.selectOptions(screen.getByLabelText(/Start from Template/i), 'tmpl1');

    expect(await screen.findByLabelText('Payment Amount *')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Payment Amount *'), { target: { value: '5000' } });

    expect(await screen.findByText('Vendor shall be paid 5000.')).toBeInTheDocument();
  });

  it('submits templateId and correctly-typed variableValues on save', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: { _id: 'contract1' } } });
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('option', { name: 'Vendor Agreement' });
    await user.type(screen.getByLabelText('Title'), 'Acme Vendor Deal');
    await user.selectOptions(screen.getByLabelText(/Start from Template/i), 'tmpl1');
    await screen.findByLabelText('Payment Amount *');
    fireEvent.change(screen.getByLabelText('Payment Amount *'), { target: { value: '5000' } });
    await user.selectOptions(screen.getByLabelText('Business Unit'), 'bu1');
    await user.selectOptions(await screen.findByLabelText('Department'), 'dept1');

    await user.click(screen.getByRole('button', { name: /create contract/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/contracts',
        expect.objectContaining({
          templateId: 'tmpl1',
          variableValues: { amount: 5000 },
        })
      );
    });
    
    
    const [, body] = vi.mocked(axiosClient.post).mock.calls[0];
    expect(typeof (body as { variableValues: { amount: unknown } }).variableValues.amount).toBe('number');
  });

  it('does not send templateId/variableValues when no template is selected', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: { _id: 'contract1' } } });
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('option', { name: 'Vendor Agreement' });
    await user.type(screen.getByLabelText('Title'), 'Blank Contract');
    await user.selectOptions(screen.getByLabelText('Business Unit'), 'bu1');
    await user.selectOptions(await screen.findByLabelText('Department'), 'dept1');

    await user.click(screen.getByRole('button', { name: /create contract/i }));

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [, body] = vi.mocked(axiosClient.post).mock.calls[0];
    expect(body).not.toHaveProperty('templateId');
    expect(body).not.toHaveProperty('variableValues');
  });
});
