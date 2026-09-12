import { Request, Response } from 'express';
import { obligationService } from './obligation.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { JwtAccessPayload } from '../users/user.types';
import { ObligationStatus } from './obligation.types';
import { getParam } from '../../core/utils/params';

export const obligationController = {
  listForContract: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await obligationService.listForContract(getParam(req, 'contractId')));
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const status = req.query.status as ObligationStatus | undefined;
    sendSuccess(res, await obligationService.listForAssignee(user.sub, status));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const obligation = await obligationService.createObligation(getParam(req, 'contractId'), req.body);
    sendSuccess(res, obligation, 201);
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const obligation = await obligationService.completeObligation(getParam(req, 'id'), user.sub, req.body.evidence);
    sendSuccess(res, obligation);
  }),

  waive: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await obligationService.waiveObligation(getParam(req, 'id')));
  }),
};
