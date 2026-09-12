

import { eventBus } from '../../src/core/events/event-bus';
import { DomainEvent } from '../../src/core/events/event-types';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('eventBus.onEvent error isolation', () => {
  afterEach(() => {
    eventBus.removeAllListeners();
  });

  it('isolates an async handler that rejects — emitEvent itself does not throw', async () => {
    eventBus.onEvent(DomainEvent.CONTRACT_EXPIRING, async () => {
      throw new Error('subscriber failed');
    });

    expect(() =>
      eventBus.emitEvent(DomainEvent.CONTRACT_EXPIRING, {
        contractId: 'c1',
        expiryDate: new Date().toISOString(),
        recipientId: 'u1', tenantId: 't1',
      })
    ).not.toThrow();

    await flushPromises();
  });

  it('isolates a handler that throws SYNCHRONOUSLY (declared without async) — the fragile-invariant case', async () => {
    
    
    
    
    eventBus.onEvent(DomainEvent.CONTRACT_EXPIRING, (() => {
      throw new Error('synchronous subscriber failure');
    }) as unknown as (payload: unknown) => void);

    expect(() =>
      eventBus.emitEvent(DomainEvent.CONTRACT_EXPIRING, {
        contractId: 'c1',
        expiryDate: new Date().toISOString(),
        recipientId: 'u1', tenantId: 't1',
      })
    ).not.toThrow();

    await flushPromises();
  });

  it('still runs every other subscriber even when one fails', async () => {
    const secondHandlerCalls: string[] = [];

    eventBus.onEvent(DomainEvent.CONTRACT_EXPIRING, async () => {
      throw new Error('first subscriber fails');
    });
    eventBus.onEvent(DomainEvent.CONTRACT_EXPIRING, async ({ contractId }) => {
      secondHandlerCalls.push(contractId);
    });

    eventBus.emitEvent(DomainEvent.CONTRACT_EXPIRING, {
      contractId: 'c1',
      expiryDate: new Date().toISOString(),
      recipientId: 'u1', tenantId: 't1',
    });

    await flushPromises();
    expect(secondHandlerCalls).toEqual(['c1']);
  });

  it('runs a successful async handler to completion (sanity check, not just the failure paths)', async () => {
    const received: string[] = [];
    eventBus.onEvent(DomainEvent.OBLIGATION_OVERDUE, async ({ obligationId }) => {
      received.push(obligationId);
    });

    eventBus.emitEvent(DomainEvent.OBLIGATION_OVERDUE, { obligationId: 'o1', obligationType: 'Payment', recipientId: 'u1', tenantId: 't1' });

    await flushPromises();
    expect(received).toEqual(['o1']);
  });
});
