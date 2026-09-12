import { Request, Response } from 'express';
import { tenantRepository } from './tenant.repository';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';

export const tenantController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await tenantRepository.find({}, 200));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const existing = await tenantRepository.findBySlug(req.body.slug);
    if (existing) throw AppError.conflict('A tenant with this slug already exists');
    const tenant = await tenantRepository.create(req.body);
    sendSuccess(res, tenant, 201);
  }),
};
