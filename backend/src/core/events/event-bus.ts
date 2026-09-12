import { EventEmitter } from 'node:events';
import { DomainEvent, DomainEventPayloadMap } from './event-types';
import { logger } from '../utils/logger';

class TypedEventBus extends EventEmitter {
  emitEvent<E extends DomainEvent>(event: E, payload: DomainEventPayloadMap[E]): void {
    logger.debug('Domain event emitted', { event, payload });
    this.emit(event, payload);
  }

  onEvent<E extends DomainEvent>(
    event: E,
    handler: (payload: DomainEventPayloadMap[E]) => void | Promise<void>
  ): void {
    this.on(event, (payload) => {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      try {
        Promise.resolve(handler(payload)).catch((err) => {
          
          
          
          logger.error('Domain event handler failed', { event, error: err?.message });
        });
      } catch (err) {
        
        logger.error('Domain event handler threw synchronously', {
          event,
          error: err instanceof Error ? err.message : err,
        });
      }
    });
  }
}

export const eventBus = new TypedEventBus();
