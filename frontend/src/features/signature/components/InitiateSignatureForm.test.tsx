import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { InitiateSignatureForm } from './InitiateSignatureForm';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn() },
}));

const DIRECTORY = [
  { id: 'user1', name: 'Jamie Legal', email: 'jamie@acme.com' },
  { id: 'user2', name: 'Sam Finance', email: 'sam@acme.com' },
];

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <InitiateSignatureForm contractId="contract1" />
    </QueryClientProvider>
  );
}

describe('InitiateSignatureForm — Internal signer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: DIRECTORY } });
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: [] } });
  });

  it('defaults to External with free-text name/email fields', async () => {
    renderForm();
    expect(await screen.findByLabelText('Signer name')).toBeInTheDocument();
    expect(screen.getByLabelText('Signer email')).toBeInTheDocument();
  });

  it('switching to Internal shows a directory picker instead of free-text fields', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('Signer type'), 'Internal');

    expect(screen.queryByLabelText('Signer name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Signer email')).not.toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Jamie Legal/ })).toBeInTheDocument();
  });

  it('submits a real userId, name, and email for the selected Internal signer', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('Signer type'), 'Internal');
    await user.selectOptions(await screen.findByLabelText('Internal signer'), 'user1');
    await user.click(screen.getByRole('button', { name: /request signature/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/contracts/contract1/signature/initiate', {
        signers: [{ signerType: 'Internal', userId: 'user1', name: 'Jamie Legal', email: 'jamie@acme.com' }],
      });
    });
  });

  it('still submits an External signer with free-typed name/email as before', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(await screen.findByLabelText('Signer name'), 'Acme Vendor');
    await user.type(screen.getByLabelText('Signer email'), 'vendor@acme-external.com');
    await user.click(screen.getByRole('button', { name: /request signature/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/contracts/contract1/signature/initiate', {
        signers: [{ signerType: 'External', name: 'Acme Vendor', email: 'vendor@acme-external.com' }],
      });
    });
  });
});
