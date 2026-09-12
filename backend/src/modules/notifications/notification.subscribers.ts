import { eventBus } from '../../core/events/event-bus';
import { DomainEvent } from '../../core/events/event-types';
import { getQueue } from '../../core/queues/queue.factory';
import { QueueName } from '../../core/queues/queue.names';
import { NotificationType } from './notification.types';
import { NotificationJobData } from './notification.job.types';
import { userRepository } from '../users/user.repository';
import { contractRepository } from '../contracts/contract.repository';
import { UserRole } from '../users/user.types';
import { APPROVAL_LEVEL_PERMISSION } from '../workflow/workflow.types';
import { getRolePermissions } from '../../core/middleware/permissions.config';
import { logger } from '../../core/utils/logger';

function enqueue(data: NotificationJobData): void {
  getQueue(QueueName.NOTIFICATIONS).add('deliver', data);
}

async function usersWithPermissionForContract(requiredPermission: string, businessUnit: string | null, tenantId: string) {
  const rolesWithPermission = Object.values(UserRole).filter((role) =>
    getRolePermissions(role).includes(requiredPermission as never)
  );
  const users = await userRepository.findActiveByRoles(rolesWithPermission, tenantId);
  
  
  
  return users.filter((u) => !u.businessUnit || !businessUnit || u.businessUnit.toString() === businessUnit);
}

const OBLIGATION_TYPE_LABEL: Record<string, string> = {
  Payment: 'Payment obligation',
  Service: 'Service obligation',
  Deliverable: 'Deliverable',
  SLA: 'SLA deadline',
  Renewal: 'Renewal',
  Compliance: 'Compliance review',
};

function obligationLabel(type: string): string {
  return OBLIGATION_TYPE_LABEL[type] ?? 'Obligation';
}

export function registerNotificationSubscribers(): void {
  eventBus.onEvent(DomainEvent.APPROVAL_SUBMITTED, async ({ contractId }) => {
    const contract = await contractRepository.findById(contractId);
    if (!contract) return;
    
    
    const recipients = await usersWithPermissionForContract(
      APPROVAL_LEVEL_PERMISSION.Legal,
      contract.businessUnit?.toString() ?? null,
      contract.tenant.toString()
    );
    for (const user of recipients) {
      enqueue({
        tenantId: contract.tenant.toString(),
        recipient: user._id.toString(),
        type: NotificationType.APPROVAL_UPDATE,
        title: 'New contract awaiting your approval',
        message: `"${contract.title}" (${contract.contractNumber}) was submitted for Legal review.`,
        relatedContract: contractId,
      });
    }
  });

  eventBus.onEvent(DomainEvent.APPROVAL_COMPLETED, async ({ contractId }) => {
    const contract = await contractRepository.findById(contractId);
    if (!contract) return;
    enqueue({
      tenantId: contract.tenant.toString(),
      recipient: contract.owner.toString(),
      type: NotificationType.APPROVAL_UPDATE,
      title: 'Your contract was fully approved',
      message: `"${contract.title}" (${contract.contractNumber}) cleared all approval steps.`,
      relatedContract: contractId,
    });
  });

  eventBus.onEvent(DomainEvent.APPROVAL_REJECTED, async ({ contractId, reason }) => {
    const contract = await contractRepository.findById(contractId);
    if (!contract) return;
    enqueue({
      tenantId: contract.tenant.toString(),
      recipient: contract.owner.toString(),
      type: NotificationType.APPROVAL_UPDATE,
      title: 'Your contract was rejected',
      message: `"${contract.title}" (${contract.contractNumber}) was rejected: ${reason}`,
      relatedContract: contractId,
    });
  });

  eventBus.onEvent(DomainEvent.WORKFLOW_SLA_BREACHED, async ({ contractId, level }) => {
    const contract = await contractRepository.findById(contractId);
    if (!contract) return;
    const recipients = await usersWithPermissionForContract(
      APPROVAL_LEVEL_PERMISSION[level as keyof typeof APPROVAL_LEVEL_PERMISSION],
      contract.businessUnit?.toString() ?? null,
      contract.tenant.toString()
    );
    for (const user of recipients) {
      enqueue({
        tenantId: contract.tenant.toString(),
        recipient: user._id.toString(),
        type: NotificationType.SLA_DEADLINE,
        title: 'Approval SLA breached',
        message: `"${contract.title}" has been waiting on ${level} approval past its SLA deadline.`,
        relatedContract: contractId,
      });
    }
  });

  eventBus.onEvent(DomainEvent.SIGNATURE_COMPLETED, async ({ contractId }) => {
    const contract = await contractRepository.findById(contractId);
    if (!contract) return;
    enqueue({
      tenantId: contract.tenant.toString(),
      recipient: contract.owner.toString(),
      type: NotificationType.SIGNATURE_UPDATE,
      title: 'A signature was completed',
      message: `A signer has completed signing "${contract.title}" (${contract.contractNumber}).`,
      relatedContract: contractId,
    });
  });

  

  eventBus.onEvent(DomainEvent.SIGNATURE_REMINDER, async ({ contractId, recipientId }) => {
    const contract = await contractRepository.findById(contractId);
    if (!contract) return;
    enqueue({
      tenantId: contract.tenant.toString(),
      recipient: recipientId,
      type: NotificationType.SIGNATURE_UPDATE,
      title: 'Signature still pending',
      message: `"${contract.title}" (${contract.contractNumber}) is still waiting on your signature.`,
      relatedContract: contractId,
    });
  });

  eventBus.onEvent(DomainEvent.CONTRACT_EXPIRING, async ({ contractId, expiryDate, recipientId, tenantId }) => {
    enqueue({
      tenantId,
      recipient: recipientId,
      type: NotificationType.CONTRACT_EXPIRY,
      title: 'Contract expiring soon',
      message: `A contract you own expires on ${new Date(expiryDate).toLocaleDateString()}.`,
      relatedContract: contractId,
    });
  });

  eventBus.onEvent(DomainEvent.OBLIGATION_DUE_SOON, async ({ obligationId, obligationType, dueDate, recipientId, tenantId }) => {
    const label = obligationLabel(obligationType);
    enqueue({
      tenantId,
      recipient: recipientId,
      type: NotificationType.OBLIGATION_REMINDER,
      title: `${label} due soon`,
      message: `A ${label.toLowerCase()} assigned to you is due on ${new Date(dueDate).toLocaleDateString()}.`,
      relatedObligation: obligationId,
    });
  });

  eventBus.onEvent(DomainEvent.OBLIGATION_OVERDUE, async ({ obligationId, obligationType, recipientId, tenantId }) => {
    const label = obligationLabel(obligationType);
    enqueue({
      tenantId,
      recipient: recipientId,
      type: NotificationType.OBLIGATION_REMINDER,
      title: `${label} overdue`,
      message: `A ${label.toLowerCase()} assigned to you is now overdue.`,
      relatedObligation: obligationId,
    });
  });

  logger.info('Notification subscribers registered');
}
