import { BaseRepository } from '../../core/base/BaseRepository';
import { NotificationModel, INotification } from './notification.model';
import { NotificationStatus } from './notification.types';

class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }

  async listForRecipient(recipientId: string, limit = 50) {
    return NotificationModel.find({ recipient: recipientId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async countUnread(recipientId: string) {
    return NotificationModel.countDocuments({
      recipient: recipientId,
      status: { $in: [NotificationStatus.PENDING, NotificationStatus.SENT] },
    }).exec();
  }

  async markRead(id: string) {
    return NotificationModel.findByIdAndUpdate(id, { status: NotificationStatus.READ }, { new: true }).exec();
  }

  async markAllRead(recipientId: string) {
    return NotificationModel.updateMany(
      { recipient: recipientId, status: { $in: [NotificationStatus.PENDING, NotificationStatus.SENT] } },
      { $set: { status: NotificationStatus.READ } }
    ).exec();
  }
}

export const notificationRepository = new NotificationRepository();
