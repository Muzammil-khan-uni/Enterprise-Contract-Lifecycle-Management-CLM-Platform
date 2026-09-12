import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';

export const dashboardController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getSummary());
  }),

  expiring: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getExpiringContracts());
  }),

  byDepartment: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getByDepartment());
  }),

  byVendor: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getByVendor());
  }),
};
