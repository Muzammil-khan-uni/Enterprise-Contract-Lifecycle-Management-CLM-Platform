import { Request, Response } from 'express';
import { businessUnitRepository } from './business-unit.repository';
import { DepartmentModel } from '../departments/department.model';
import { UserModel } from '../users/user.model';
import { ContractModel } from '../contracts/contract.model';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { getParam } from '../../core/utils/params';

export const businessUnitController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const units = await businessUnitRepository.listAll();
    sendSuccess(res, units);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const unit = await businessUnitRepository.findById(getParam(req, 'id'));
    if (!unit) throw AppError.notFound('Business unit not found');
    sendSuccess(res, unit);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (req.body.parentUnit) {
      const parent = await businessUnitRepository.findById(req.body.parentUnit);
      if (!parent) throw AppError.badRequest('parentUnit does not reference an existing business unit');
    }
    const unit = await businessUnitRepository.create(req.body);
    sendSuccess(res, unit, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = getParam(req, 'id');
    if (req.body.parentUnit) {
      if (req.body.parentUnit === id) throw AppError.badRequest('A business unit cannot be its own parent');
      const parent = await businessUnitRepository.findById(req.body.parentUnit);
      if (!parent) throw AppError.badRequest('parentUnit does not reference an existing business unit');
    }
    const unit = await businessUnitRepository.updateById(id, req.body);
    if (!unit) throw AppError.notFound('Business unit not found');
    sendSuccess(res, unit);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = getParam(req, 'id');
    const existing = await businessUnitRepository.findById(id);
    if (!existing) throw AppError.notFound('Business unit not found');

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const [childUnits, departments, users, contracts] = await Promise.all([
      businessUnitRepository.hasChildren(id),
      DepartmentModel.countDocuments({ businessUnit: id }),
      UserModel.countDocuments({ businessUnit: id }),
      ContractModel.countDocuments({ businessUnit: id }),
    ]);

    if (childUnits || departments || users || contracts) {
      throw AppError.conflict(
        'Cannot delete a business unit that still has child units, departments, users, or contracts referencing it'
      );
    }

    await businessUnitRepository.deleteById(id);
    sendSuccess(res, { deleted: true });
  }),
};
