import { Request, Response } from 'express';
import { auditService } from './audit.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { getParam } from '../../core/utils/params';

export const auditController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId, actor, action, cursor, limit } = req.query;
    const result = await auditService.list({
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      actor: actor as string | undefined,
      action: action as string | undefined,
      cursor: cursor as string | undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result.items, 200, { nextCursor: result.nextCursor, hasNextPage: result.hasNextPage });
  }),

  listForEntity: asyncHandler(async (req: Request, res: Response) => {
    const logs = await auditService.listForEntity(getParam(req, 'entityType'), getParam(req, 'entityId'));
    sendSuccess(res, logs);
  }),
};
