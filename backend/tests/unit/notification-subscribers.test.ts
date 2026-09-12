import { eventBus } from '../../src/core/events/event-bus';
import { DomainEvent } from '../../src/core/events/event-types';

jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: {
    findById: jest.fn(),
  },
}));

const addMock = jest.fn();
jest.mock('../../src/core/queues/queue.factory', () => ({
  getQueue: () => ({ add: addMock }),
}));

import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { registerNotificationSubscribers } from '../../src/modules/notifications/notification.subscribers';

describe('notification.subscribers', () => {
  beforeAll(() => {
    registerNotificationSubscribers();
  });

  beforeEach(() => {
    addMock.mockClear();
    (contractRepository.findById as jest.Mock).mockReset();
  });

  it('enqueues one notification to the contract owner on APPROVAL_COMPLETED', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'c1',
      title: 'Vendor Agreement',
      contractNumber: 'CLM-2026-000001',
      owner: { toString: () => 'owner-1' },
      tenant: { toString: () => 'tenant-1' },
    });

    eventBus.emitEvent(DomainEvent.APPROVAL_COMPLETED, { workflowId: 'w1', contractId: 'c1' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(addMock).toHaveBeenCalledTimes(1);
    const [, jobData] = addMock.mock.calls[0];
    expect(jobData.recipient).toBe('owner-1');
    expect(jobData.relatedContract).toBe('c1');
  });

  it('does nothing if the contract no longer exists', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(null);

    eventBus.emitEvent(DomainEvent.APPROVAL_REJECTED, { workflowId: 'w2', contractId: 'missing', reason: 'test' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(addMock).not.toHaveBeenCalled();
  });

  

  it('enqueues one notification to the pending signer on SIGNATURE_REMINDER', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'c1',
      title: 'Vendor Agreement',
      contractNumber: 'CLM-2026-000001',
      owner: { toString: () => 'owner-1' },
      tenant: { toString: () => 'tenant-1' },
    });

    eventBus.emitEvent(DomainEvent.SIGNATURE_REMINDER, {
      contractId: 'c1',
      signatureId: 'sig-1',
      recipientId: 'signer-1',
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(addMock).toHaveBeenCalledTimes(1);
    const [, jobData] = addMock.mock.calls[0];
    expect(jobData.recipient).toBe('signer-1');
    expect(jobData.relatedContract).toBe('c1');
    expect(jobData.type).toBe('SignatureUpdate');
  });

  it('does nothing on SIGNATURE_REMINDER if the contract no longer exists', async () => {
    (contractRepository.findById as jest.Mock).mockResolvedValue(null);

    eventBus.emitEvent(DomainEvent.SIGNATURE_REMINDER, {
      contractId: 'missing',
      signatureId: 'sig-1',
      recipientId: 'signer-1',
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(addMock).not.toHaveBeenCalled();
  });
});
