import { Request, Response } from 'express';
import { contractService } from './contract.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { JwtAccessPayload } from '../users/user.types';
import { ContractStatus, ContractType } from './contract.types';
import { getParam } from '../../core/utils/params';

export const contractController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { status, contractType, businessUnit, department, search, cursor, limit } = req.query;
    const result = await contractService.listContracts({
      status: status as ContractStatus | undefined,
      contractType: contractType as ContractType | undefined,
      businessUnit: businessUnit as string | undefined,
      department: department as string | undefined,
      search: search as string | undefined,
      cursor: cursor as string | undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result.items, 200, { nextCursor: result.nextCursor, hasNextPage: result.hasNextPage });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const contract = await contractService.createContract(req.body, user.sub);
    sendSuccess(res, contract, 201);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const contract = await contractService.getContractOrThrow(getParam(req, 'id'));
    sendSuccess(res, contract);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const contract = await contractService.updateContract(getParam(req, 'id'), req.body);
    sendSuccess(res, contract);
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const contract = await contractService.archiveContract(getParam(req, 'id'));
    sendSuccess(res, contract);
  }),

  renew: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const renewed = await contractService.renewContract(getParam(req, 'id'), req.body, user.sub);
    sendSuccess(res, renewed, 201);
  }),

  
  renewalCandidates: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await contractService.listRenewalCandidates());
  }),
};
