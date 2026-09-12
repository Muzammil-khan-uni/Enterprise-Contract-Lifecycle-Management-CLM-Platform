

jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: { create: jest.fn(), findById: jest.fn() },
}));
jest.mock('../../src/modules/contract-versions/version.repository', () => ({
  versionRepository: { create: jest.fn(), getLatest: jest.fn() },
}));
jest.mock('../../src/modules/contracts/contract-number.util', () => ({
  generateContractNumber: jest.fn().mockResolvedValue('CLM-2026-000002'),
}));
jest.mock('../../src/modules/contracts/contract-search.service', () => ({
  enqueueContractIndexing: jest.fn().mockResolvedValue(undefined),
  searchContractIds: jest.fn(),
}));
jest.mock('../../src/core/events/event-bus', () => ({
  eventBus: { emitEvent: jest.fn() },
}));

import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { versionRepository } from '../../src/modules/contract-versions/version.repository';
import { contractService } from '../../src/modules/contracts/contract.service';
import { ContractStatus } from '../../src/modules/contracts/contract.types';
import { runWithTenant } from '../../src/core/tenancy/tenant-context';
import { AppError } from '../../src/core/errors/AppError';

function buildOriginal(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'contract1',
    contractNumber: 'CLM-2026-000001',
    title: 'Acme Vendor Agreement',
    contractType: 'Vendor',
    department: 'dept1',
    businessUnit: 'bu1',
    parties: [{ partyType: 'Vendor', name: 'Acme', role: 'Vendor' }],
    governingLawCountry: 'US',
    timezone: 'UTC',
    status: ContractStatus.ACTIVE,
    contractValue: 5000,
    currency: 'USD',
    tags: ['renewal-candidate'],
    confidentialityLevel: 'Internal',
    owner: 'owner1',
    renewedTo: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('contractService.renewContract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contractRepository.create as jest.Mock).mockImplementation((data) =>
      Promise.resolve({ ...data, _id: 'contract2', save: jest.fn().mockResolvedValue(undefined) })
    );
    (versionRepository.create as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data, _id: 'version2' }));
    (versionRepository.getLatest as jest.Mock).mockResolvedValue({ content: { 'Section A': 'Original terms' } });
  });

  it('creates a new contract linked to the original and marks the original Renewed', async () => {
    const original = buildOriginal();
    (contractRepository.findById as jest.Mock).mockResolvedValue(original);

    const renewed = await runWithTenant('tenant1', () =>
      contractService.renewContract('contract1', { newExpiryDate: '2027-01-01T00:00:00.000Z' }, 'user1')
    );

    expect(renewed.renewedFrom).toBe('contract1');
    expect(renewed.status).toBe(ContractStatus.DRAFT);
    expect(renewed.contractNumber).toBe('CLM-2026-000002');
    expect(original.status).toBe(ContractStatus.RENEWED);
    expect(original.renewedTo).toBe('contract2');
    expect(original.save).toHaveBeenCalled();
  });

  it('carries the original latest version content forward as the renewal starting point', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildOriginal());

    await runWithTenant('tenant1', () => contractService.renewContract('contract1', {}, 'user1'));

    const versionArg = (versionRepository.create as jest.Mock).mock.calls[0][0];
    expect(versionArg.content).toEqual({ 'Section A': 'Original terms' });
    expect(versionArg.changeSummary).toMatch(/Renewed from CLM-2026-000001/);
  });

  it('rejects renewing a Draft contract (not yet eligible)', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildOriginal({ status: ContractStatus.DRAFT }));

    await expect(
      runWithTenant('tenant1', () => contractService.renewContract('contract1', {}, 'user1'))
    ).rejects.toThrow(AppError);
    expect(contractRepository.create).not.toHaveBeenCalled();
  });

  it('rejects renewing a contract that has already been renewed', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(
      buildOriginal({ renewedTo: 'some-other-contract' })
    );

    await expect(
      runWithTenant('tenant1', () => contractService.renewContract('contract1', {}, 'user1'))
    ).rejects.toThrow(/already been renewed/);
    expect(contractRepository.create).not.toHaveBeenCalled();
  });

  it('rejects renewing a Terminated contract', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(
      buildOriginal({ status: ContractStatus.TERMINATED })
    );

    await expect(
      runWithTenant('tenant1', () => contractService.renewContract('contract1', {}, 'user1'))
    ).rejects.toThrow(/cannot be renewed/);
  });

  it('allows renewing an Expired contract', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildOriginal({ status: ContractStatus.EXPIRED }));

    const renewed = await runWithTenant('tenant1', () => contractService.renewContract('contract1', {}, 'user1'));
    expect(renewed.status).toBe(ContractStatus.DRAFT);
  });

  it('overrides contractValue when the caller supplies one, otherwise carries the original forward', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildOriginal({ contractValue: 5000 }));

    const renewed = await runWithTenant('tenant1', () =>
      contractService.renewContract('contract1', { contractValue: 7500 }, 'user1')
    );
    expect(renewed.contractValue).toBe(7500);
  });
});
