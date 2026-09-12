import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ObligationList } from './ObligationList';
import type { Obligation } from '../types';

vi.mock('../api/obligationApi', () => ({
  useCompleteObligation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../../documents/api/documentApi', () => ({
  useContractDocuments: () => ({
    data: [{ _id: 'doc1', fileName: 'signed-deliverable.pdf' }],
  }),
}));

function buildObligation(overrides: Partial<Obligation> = {}): Obligation {
  return {
    _id: 'ob1',
    contract: 'contract1',
    type: 'Payment',
    description: 'Q1 invoice',
    dueDate: '2026-09-15T00:00:00.000Z',
    assignedTo: 'user1',
    status: 'Pending',
    recurrence: 'None',
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    evidence: null,
    amount: null,
    currency: null,
    slaThreshold: null,
    slaPenalty: null,
    breached: false,
    ...overrides,
  };
}

function renderList(obligations: Obligation[]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ObligationList obligations={obligations} showContractLink />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ObligationList — contract link', () => {
  it('renders a real, navigable link with the contract title and number when populated', () => {
    renderList([
      buildObligation({
        contract: { _id: 'contract1', title: 'Acme Vendor Agreement', contractNumber: 'CLM-2026-000001' },
      }),
    ]);

    const link = screen.getByRole('link', { name: /Acme Vendor Agreement \(CLM-2026-000001\)/ });
    expect(link).toHaveAttribute('href', '/contracts/contract1');
  });

  it('falls back to a plain navigable link when the contract is not populated', () => {
    renderList([buildObligation({ contract: 'contract1' })]);

    const link = screen.getByRole('link', { name: /view contract/i });
    expect(link).toHaveAttribute('href', '/contracts/contract1');
  });

  it('never renders a raw ObjectId as unlinked text', () => {
    renderList([buildObligation({ contract: 'contract1' })]);
    expect(screen.queryByText(/Contract contract1$/)).not.toBeInTheDocument();
  });
});

describe('ObligationList — Deliverable evidence requirement', () => {
  it('disables Mark done for a Deliverable until a document is selected', () => {
    renderList([buildObligation({ type: 'Deliverable', description: 'Final design files' })]);

    const button = screen.getByRole('button', { name: /mark done/i });
    expect(button).toBeDisabled();
  });

  it('shows a Payment amount alongside its description', () => {
    renderList([buildObligation({ type: 'Payment', amount: 5000, currency: 'USD' })]);
    expect(screen.getByText(/USD\s*5,000/)).toBeInTheDocument();
  });

  it('does not require evidence for non-Deliverable types (Mark done stays enabled)', () => {
    renderList([buildObligation({ type: 'Payment' })]);
    const button = screen.getByRole('button', { name: /mark done/i });
    expect(button).not.toBeDisabled();
  });
});
