import { notificationRepository } from './notification.repository';
import { getSocketServer } from '../../config/socket';
import { NotificationType, NotificationChannel } from './notification.types';
import { AppError } from '../../core/errors/AppError';
import { logger } from '../../core/utils/logger';
import { runWithTenant } from '../../core/tenancy/tenant-context';

export interface CreateNotificationInput {
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedContract?: string | null;
  relatedObligation?: string | null;
  channel?: NotificationChannel;
}

export const notificationService = {
  

  async createAndDeliver(input: CreateNotificationInput & { tenantId: string }) {
    return runWithTenant(input.tenantId, async () => {
      const notification = await notificationRepository.create({
      recipient: input.recipient as never,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedContract: (input.relatedContract as never) ?? null,
      relatedObligation: (input.relatedObligation as never) ?? null,
      channel: input.channel ?? NotificationChannel.IN_APP,
      status: 'Sent' as never,
      scheduledFor: new Date(),
      sentAt: new Date(),
    });

    const io = getSocketServer();
    if (io) {
      io.to(`user:${input.recipient}`).emit('notification', {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
      });
    } else {
      
      
      
      logger.debug('No socket server in this process; notification persisted only', {
        recipient: input.recipient,
      });
    }

      return notification;
    });
  },

  async listForRecipient(recipientId: string) {
    return notificationRepository.listForRecipient(recipientId);
  },

  async countUnread(recipientId: string) {
    return notificationRepository.countUnread(recipientId);
  },

  async markRead(id: string, recipientId: string) {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw AppError.notFound('Notification not found');
    if (notification.recipient.toString() !== recipientId) {
      throw AppError.forbidden('This notification does not belong to you');
    }
    return notificationRepository.markRead(id);
  },

  async markAllRead(recipientId: string) {
    return notificationRepository.markAllRead(recipientId);
  },
};
