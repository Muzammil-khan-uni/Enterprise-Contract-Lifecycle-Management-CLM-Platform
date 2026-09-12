import { Request, Response } from 'express';
import { vendorRepository } from './vendor.repository';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { getParam } from '../../core/utils/params';

export const vendorController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const vendors = await vendorRepository.find({ isActive: true }, 200);
    sendSuccess(res, vendors);
  }),

  

  adminList: asyncHandler(async (_req: Request, res: Response) => {
    const vendors = await vendorRepository.listAll();
    sendSuccess(res, vendors);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await vendorRepository.create(req.body);
    sendSuccess(res, vendor, 201);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await vendorRepository.findById(getParam(req, 'id'));
    if (!vendor) throw AppError.notFound('Vendor not found');
    sendSuccess(res, vendor);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await vendorRepository.updateById(getParam(req, 'id'), req.body);
    if (!vendor) throw AppError.notFound('Vendor not found');
    sendSuccess(res, vendor);
  }),
};
