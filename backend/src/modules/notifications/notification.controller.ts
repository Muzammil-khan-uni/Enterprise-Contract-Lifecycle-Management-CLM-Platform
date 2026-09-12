import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { JwtAccessPayload } from '../users/user.types';
import { getParam } from '../../core/utils/params';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const [notifications, unreadCount] = await Promise.all([
      notificationService.listForRecipient(user.sub),
      notificationService.countUnread(user.sub),
    ]);
    sendSuccess(res, notifications, 200, { unreadCount });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const notification = await notificationService.markRead(getParam(req, 'id'), user.sub);
    sendSuccess(res, notification);
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    await notificationService.markAllRead(user.sub);
    sendSuccess(res, { success: true });
  }),
};
