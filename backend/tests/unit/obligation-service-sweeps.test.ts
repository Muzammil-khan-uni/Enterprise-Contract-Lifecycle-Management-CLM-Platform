jest.mock('../../src/modules/obligations/obligation.repository', () => ({
  obligationRepository: { findDueWithinDays: jest.fn() },
}));
jest.mock('../../src/core/events/event-bus', () => ({
  eventBus: { emitEvent: jest.fn() },
}));

import { obligationRepository } from '../../src/modules/obligations/obligation.repository';
import { eventBus } from '../../src/core/events/event-bus';
import { obligationService } from '../../src/modules/obligations/obligation.service';
import { DomainEvent } from '../../src/core/events/event-types';

function buildObligation(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'ob1' },
    tenant: { toString: () => 'tenant1' },
    type: 'Renewal',
    dueDate: new Date('2026-09-01'),
    assignedTo: { toString: () => 'user1' },
    status: 'Pending',
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('obligationService.sweepDueSoon', () => {
  beforeEach(() => jest.clearAllMocks());

  it('emits OBLIGATION_DUE_SOON with the obligation type included in the payload', async () => {
    (obligationRepository.findDueWithinDays as jest.Mock).mockResolvedValue([buildObligation({ type: 'Compliance' })]);

    const count = await obligationService.sweepDueSoon(7);

    expect(count).toBe(1);
    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      DomainEvent.OBLIGATION_DUE_SOON,
      expect.objectContaining({ obligationId: 'ob1', obligationType: 'Compliance', recipientId: 'user1' })
    );
  });

  it('does not notify an obligation with no assignee (though it is still counted as a due-soon candidate)', async () => {
    (obligationRepository.findDueWithinDays as jest.Mock).mockResolvedValue([buildObligation({ assignedTo: null })]);

    
    
    
    
    const count = await obligationService.sweepDueSoon(7);

    expect(count).toBe(1);
    expect(eventBus.emitEvent).not.toHaveBeenCalled();
  });
});

describe('obligationService.sweepOverdue', () => {
  beforeEach(() => jest.clearAllMocks());

  it('flips a still-Pending, past-due obligation to Overdue and notifies, with type in the payload', async () => {
    const obligation = buildObligation({ type: 'Payment', status: 'Pending' });
    (obligationRepository.findDueWithinDays as jest.Mock).mockResolvedValue([obligation]);

    const count = await obligationService.sweepOverdue();

    expect(count).toBe(1);
    expect(obligation.status).toBe('Overdue');
    expect(obligation.save).toHaveBeenCalled();
    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      DomainEvent.OBLIGATION_OVERDUE,
      expect.objectContaining({ obligationId: 'ob1', obligationType: 'Payment', recipientId: 'user1' })
    );
  });

  

  it('never re-notifies an obligation that is already Overdue from a previous run', async () => {
    
    
    
    
    (obligationRepository.findDueWithinDays as jest.Mock).mockResolvedValue([]);

    const count = await obligationService.sweepOverdue();

    expect(count).toBe(0);
    expect(eventBus.emitEvent).not.toHaveBeenCalled();
  });
});
