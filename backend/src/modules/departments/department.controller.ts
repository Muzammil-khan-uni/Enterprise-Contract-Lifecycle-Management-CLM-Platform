import { Request, Response } from 'express';
import { departmentRepository } from './department.repository';
import { businessUnitRepository } from '../business-units/business-unit.repository';
import { UserModel } from '../users/user.model';
import { ContractModel } from '../contracts/contract.model';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { getParam } from '../../core/utils/params';

export const departmentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { businessUnit } = req.query;
    const departments =
      typeof businessUnit === 'string'
        ? await departmentRepository.listByBusinessUnit(businessUnit)
        : await departmentRepository.listAll();
    sendSuccess(res, departments);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentRepository.findById(getParam(req, 'id'));
    if (!department) throw AppError.notFound('Department not found');
    sendSuccess(res, department);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const businessUnit = await businessUnitRepository.findById(req.body.businessUnit);
    if (!businessUnit) throw AppError.badRequest('businessUnit does not reference an existing business unit');
    const department = await departmentRepository.create(req.body);
    sendSuccess(res, department, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = getParam(req, 'id');
    if (req.body.businessUnit) {
      const businessUnit = await businessUnitRepository.findById(req.body.businessUnit);
      if (!businessUnit) throw AppError.badRequest('businessUnit does not reference an existing business unit');
    }
    const department = await departmentRepository.updateById(id, req.body);
    if (!department) throw AppError.notFound('Department not found');
    sendSuccess(res, department);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = getParam(req, 'id');
    const existing = await departmentRepository.findById(id);
    if (!existing) throw AppError.notFound('Department not found');

    
    
    
    
    
    
    
    const [users, contracts] = await Promise.all([
      UserModel.countDocuments({ department: id }),
      ContractModel.countDocuments({ department: id }),
    ]);

    if (users || contracts) {
      throw AppError.conflict('Cannot delete a department that still has users or contracts referencing it');
    }

    await departmentRepository.deleteById(id);
    sendSuccess(res, { deleted: true });
  }),
};
