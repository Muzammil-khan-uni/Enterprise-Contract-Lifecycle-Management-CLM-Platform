import { auditRepository } from './audit.repository';
import { AuditAction } from './audit.types';

export interface RecordAuditInput {
  actor: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  

  tenant?: string;
}

export const auditService = {
  async record(input: RecordAuditInput) {
    return auditRepository.create({
      actor: (input.actor as never) ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes ?? null,
      ipAddress: input.ipAddress ?? null,
      timestamp: new Date(),
      ...(input.tenant ? { tenant: input.tenant as never } : {}),
    });
  },

  async listForEntity(entityType: string, entityId: string) {
    return auditRepository.listForEntity(entityType, entityId);
  },

  async list(filters: Parameters<typeof auditRepository.list>[0]) {
    return auditRepository.list(filters);
  },
};
