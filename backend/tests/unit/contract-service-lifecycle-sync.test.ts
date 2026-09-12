

jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: {
    findSignedPastEffectiveDate: jest.fn(),
    findActivePastExpiryDate: jest.fn(),
  },
}));
jest.mock('../../src/modules/contracts/contract-search.service', () => ({
  enqueueContractIndexing: jest.fn().mockResolvedValue(undefined),
  searchContractIds: jest.fn(),
}));
jest.mock('../../src/core/events/event-bus', () => ({
  eventBus: { emitEvent: jest.fn() },
}));

import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { enqueueContractIndexing } from '../../src/modules/contracts/contract-search.service';
import { eventBus } from '../../src/core/events/event-bus';
import { DomainEvent } from '../../src/core/events/event-types';
import { contractService } from '../../src/modules/contracts/contract.service';
import { ContractStatus } from '../../src/modules/contracts/contract.types';

function buildContract(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => overrides._id ?? 'contract1' },
    tenant: { toString: () => 'tenant1' },
    status: ContractStatus.SIGNED,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('contractService.syncLifecycleStatuses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contractRepository.findSignedPastEffectiveDate as jest.Mock).mockResolvedValue([]);
    (contractRepository.findActivePastExpiryDate as jest.Mock).mockResolvedValue([]);
  });

  it('transitions every Signed contract past its effectiveDate to Active', async () => {
    const contract = buildContract({ status: ContractStatus.SIGNED });
    (contractRepository.findSignedPastEffectiveDate as jest.Mock).mockResolvedValue([contract]);

    const result = await contractService.syncLifecycleStatuses();

    expect(contract.status).toBe(ContractStatus.ACTIVE);
    expect(contract.save).toHaveBeenCalledTimes(1);
    expect(result.activated).toBe(1);
  });

  it('transitions every Active contract past its expiryDate to Expired', async () => {
    const contract = buildContract({ status: ContractStatus.ACTIVE });
    (contractRepository.findActivePastExpiryDate as jest.Mock).mockResolvedValue([contract]);

    const result = await contractService.syncLifecycleStatuses();

    expect(contract.status).toBe(ContractStatus.EXPIRED);
    expect(contract.save).toHaveBeenCalledTimes(1);
    expect(result.expired).toBe(1);
  });

  it('emits CONTRACT_STATUS_CHANGED with the correct from/to for each transition', async () => {
    const contract = buildContract({ _id: 'contract7', status: ContractStatus.SIGNED });
    (contractRepository.findSignedPastEffectiveDate as jest.Mock).mockResolvedValue([contract]);

    await contractService.syncLifecycleStatuses();

    expect(eventBus.emitEvent).toHaveBeenCalledWith(DomainEvent.CONTRACT_STATUS_CHANGED, {
      contractId: 'contract7',
      fromStatus: ContractStatus.SIGNED,
      toStatus: ContractStatus.ACTIVE,
    });
  });

  it('re-indexes every transitioned contract for search (status is a filterable field)', async () => {
    const contract = buildContract({ _id: 'contract9', status: ContractStatus.SIGNED });
    (contractRepository.findSignedPastEffectiveDate as jest.Mock).mockResolvedValue([contract]);

    await contractService.syncLifecycleStatuses();

    expect(enqueueContractIndexing).toHaveBeenCalledWith('contract9');
  });

  it('processes both transitions in the same run and sums their counts independently', async () => {
    const toActivate = buildContract({ _id: 'c1', status: ContractStatus.SIGNED });
    const toExpire = buildContract({ _id: 'c2', status: ContractStatus.ACTIVE });
    (contractRepository.findSignedPastEffectiveDate as jest.Mock).mockResolvedValue([toActivate]);
    (contractRepository.findActivePastExpiryDate as jest.Mock).mockResolvedValue([toExpire]);

    const result = await contractService.syncLifecycleStatuses();

    expect(result).toEqual({ activated: 1, expired: 1 });
  });

  it('does nothing and returns zero counts when no contract has crossed either date', async () => {
    const result = await contractService.syncLifecycleStatuses();
    expect(result).toEqual({ activated: 0, expired: 0 });
    expect(eventBus.emitEvent).not.toHaveBeenCalled();
  });
});
