import { Request, Response } from 'express';
import { riskService } from './risk.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';

export const riskController = {
  topRisk: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    sendSuccess(res, await riskService.getTopRiskContracts(limit));
  }),
};
