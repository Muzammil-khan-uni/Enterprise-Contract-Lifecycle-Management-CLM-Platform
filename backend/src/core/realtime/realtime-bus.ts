import { getSocketServer } from '../../config/socket';
import { getCurrentTenantId } from '../tenancy/tenant-context';
import { logger } from '../utils/logger';

export type EntityChangeAction = 'created' | 'updated' | 'deleted';

export interface EntityChangePayload {
  resource: string; 
  action: EntityChangeAction;
  id: string;
}

export interface EntityChangeEvent extends EntityChangePayload {
  tenantId: string;
}

export type EntityChangeListener = (event: EntityChangeEvent) => void;

const listeners: EntityChangeListener[] = [];

export function onEntityChange(listener: EntityChangeListener): void {
  listeners.push(listener);
}

export function broadcastEntityChange(resource: string, action: EntityChangeAction, id: string): void {
  const tenantId = getCurrentTenantId();
  if (!tenantId) return; 

  try {
    const io = getSocketServer();
    if (io) {
      const payload: EntityChangePayload = { resource, action, id };
      io.to(`tenant:${tenantId}`).emit('entity-change', payload);
    } 
  } catch (err) {
    
    logger.error('Realtime broadcast failed', {
      resource,
      action,
      id,
      error: err instanceof Error ? err.message : err,
    });
  }

  for (const listener of listeners) {
    try {
      listener({ resource, action, id, tenantId });
    } catch (err) {
      
      
      logger.error('Entity-change listener failed', {
        resource,
        action,
        id,
        error: err instanceof Error ? err.message : err,
      });
    }
  }
}
