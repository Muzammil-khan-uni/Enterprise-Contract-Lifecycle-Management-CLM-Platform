import { obligationRepository } from './obligation.repository';
import { contractRepository } from '../contracts/contract.repository';
import { AppError } from '../../core/errors/AppError';
import { ObligationStatus, ObligationType, RecurrenceInterval } from './obligation.types';
import { eventBus } from '../../core/events/event-bus';
import { DomainEvent } from '../../core/events/event-types';
import { runWithTenant } from '../../core/tenancy/tenant-context';

export function nextOccurrence(dueDate: Date, recurrence: RecurrenceInterval): Date | null {
  const next = new Date(dueDate);
  switch (recurrence) {
    case RecurrenceInterval.WEEKLY:
      next.setDate(next.getDate() + 7);
      return next;
    case RecurrenceInterval.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      return next;
    case RecurrenceInterval.QUARTERLY:
      next.setMonth(next.getMonth() + 3);
      return next;
    case RecurrenceInterval.ANNUALLY:
      next.setFullYear(next.getFullYear() + 1);
      return next;
    default:
      return null;
  }
}

export const obligationService = {
  async createObligation(
    contractId: string,
    input: {
      type: string;
      description: string;
      dueDate: string;
      assignedTo?: string;
      recurrence?: string;
      amount?: number;
      currency?: string;
      slaThreshold?: string;
      slaPenalty?: string;
    }
  ) {
    const contract = await contractRepository.findById(contractId);
    if (!contract) throw AppError.notFound('Contract not found');

    return obligationRepository.create({
      contract: contract._id,
      type: input.type as never,
      description: input.description,
      dueDate: new Date(input.dueDate),
      assignedTo: (input.assignedTo as never) ?? null,
      status: ObligationStatus.PENDING,
      recurrence: (input.recurrence as never) ?? RecurrenceInterval.NONE,
      completedAt: null,
      completedBy: null,
      evidence: null,
      
      
      
      amount: input.amount ?? null,
      currency: input.currency ?? null,
      
      
      slaThreshold: input.slaThreshold ?? null,
      slaPenalty: input.slaPenalty ?? null,
      breached: false,
    });
  },

  async listForContract(contractId: string) {
    return obligationRepository.listForContract(contractId);
  },

  async listForAssignee(userId: string, status?: ObligationStatus) {
    return obligationRepository.listForAssignee(userId, status);
  },

  

  async completeObligation(id: string, completedBy: string, evidenceDocId?: string) {
    const obligation = await obligationRepository.findById(id);
    if (!obligation) throw AppError.notFound('Obligation not found');

    if (obligation.status === ObligationStatus.COMPLETED) {
      throw AppError.conflict('This obligation is already completed');
    }

    if (obligation.type === ObligationType.DELIVERABLE && !evidenceDocId) {
      throw AppError.badRequest('Evidence is required to complete a Deliverable obligation');
    }

    obligation.status = ObligationStatus.COMPLETED;
    obligation.completedAt = new Date();
    obligation.completedBy = completedBy as never;
    if (evidenceDocId) obligation.evidence = evidenceDocId as never;
    obligation.breached = false; 
    await obligation.save();

    const nextDue = nextOccurrence(obligation.dueDate, obligation.recurrence);
    if (nextDue) {
      await obligationRepository.create({
        contract: obligation.contract,
        type: obligation.type,
        description: obligation.description,
        dueDate: nextDue,
        assignedTo: obligation.assignedTo,
        status: ObligationStatus.PENDING,
        recurrence: obligation.recurrence,
        completedAt: null,
        completedBy: null,
        evidence: null,
        amount: obligation.amount,
        currency: obligation.currency,
        slaThreshold: obligation.slaThreshold,
        slaPenalty: obligation.slaPenalty,
        breached: false,
      });
    }

    return obligation;
  },

  async waiveObligation(id: string) {
    const obligation = await obligationRepository.findById(id);
    if (!obligation) throw AppError.notFound('Obligation not found');
    obligation.status = ObligationStatus.WAIVED;
    await obligation.save();
    return obligation;
  },

  

  async sweepOverdue() {
    const overdue = await obligationRepository.findDueWithinDays(0); 
    for (const obligation of overdue) {
      obligation.status = ObligationStatus.OVERDUE;
      if (obligation.type === ObligationType.SLA) obligation.breached = true;
      await runWithTenant(obligation.tenant.toString(), () => obligation.save());
      if (obligation.assignedTo) {
        eventBus.emitEvent(DomainEvent.OBLIGATION_OVERDUE, {
          obligationId: obligation._id.toString(),
          obligationType: obligation.type,
          recipientId: obligation.assignedTo.toString(),
          tenantId: obligation.tenant.toString(),
        });
      }
    }
    return overdue.length;
  },

  

  async sweepDueSoon(days = 3) {
    const dueSoon = await obligationRepository.findDueWithinDays(days);
    const stillPending = dueSoon.filter((o) => o.status === ObligationStatus.PENDING);
    for (const obligation of stillPending) {
      if (obligation.assignedTo) {
        eventBus.emitEvent(DomainEvent.OBLIGATION_DUE_SOON, {
          obligationId: obligation._id.toString(),
          obligationType: obligation.type,
          dueDate: obligation.dueDate.toISOString(),
          recipientId: obligation.assignedTo.toString(),
          tenantId: obligation.tenant.toString(),
        });
      }
    }
    return stillPending.length;
  },
};
