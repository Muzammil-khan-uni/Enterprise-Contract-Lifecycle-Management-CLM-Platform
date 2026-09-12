import { FilterQuery } from 'mongoose';
import { AuditLogModel, IAuditLog } from './audit.model';
import { buildCursorQuery, resolveLimit } from '../../core/utils/pagination';

export interface AuditListFilters {
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: string;
  cursor?: string;
  limit?: number;
}

class AuditRepository {
  async create(entry: Partial<IAuditLog>) {
    return AuditLogModel.create(entry);
  }

  async listForEntity(entityType: string, entityId: string, limit = 100) {
    return AuditLogModel.find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('actor', 'name email')
      .exec();
  }

  async list(filters: AuditListFilters) {
    const query: FilterQuery<IAuditLog> = { ...buildCursorQuery(filters.cursor) };
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.actor) query.actor = filters.actor;
    if (filters.action) query.action = filters.action;

    const limit = resolveLimit(filters.limit, 200, 50);
    const results = await AuditLogModel.find(query)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .populate('actor', 'name email')
      .exec();

    const hasNextPage = results.length > limit;
    const items = hasNextPage ? results.slice(0, limit) : results;
    const nextCursor = hasNextPage ? items[items.length - 1]._id.toString() : null;

    return { items, nextCursor, hasNextPage };
  }
}

export const auditRepository = new AuditRepository();
