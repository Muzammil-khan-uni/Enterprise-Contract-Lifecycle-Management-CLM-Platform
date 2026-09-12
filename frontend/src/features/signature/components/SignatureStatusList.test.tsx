import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SignatureStatusList } from './SignatureStatusList';
import type { Signature } from '../types';

function buildSignature(overrides: Partial<Signature> = {}): Signature {
  return {
    _id: 'sig1',
    contract: 'contract1',
    signerType: 'Internal',
    signer: 'user1',
    externalSignerName: null,
    externalSignerEmail: null,
    signatureStatus: 'Pending',
    signedAt: null,
    provider: 'docusign',
    auditTrail: [],
    ...overrides,
  };
}

function renderList(signatures: Signature[], showContractLink = false) {
  render(
    <MemoryRouter>
      <SignatureStatusList signatures={signatures} showContractLink={showContractLink} />
    </MemoryRouter>
  );
}

describe('SignatureStatusList — contract link', () => {
  it('renders no contract link by default (existing per-contract embedded use)', () => {
    renderList([buildSignature({ contract: { _id: 'contract1', title: 'Acme MSA', contractNumber: 'CLM-1', status: 'PendingSignature' } })]);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a real, navigable link with the contract title and number when populated and requested', () => {
    renderList(
      [buildSignature({ contract: { _id: 'contract1', title: 'Acme MSA', contractNumber: 'CLM-1', status: 'PendingSignature' } })],
      true
    );
    const link = screen.getByRole('link', { name: /Acme MSA \(CLM-1\)/ });
    expect(link).toHaveAttribute('href', '/contracts/contract1');
  });

  it('renders no link when showContractLink is true but the contract is not populated (a raw id)', () => {
    renderList([buildSignature({ contract: 'contract1' })], true);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
