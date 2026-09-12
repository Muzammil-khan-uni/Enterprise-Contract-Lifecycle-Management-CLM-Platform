import { Request, Response } from 'express';
import { versionRepository } from './version.repository';
import { diffContent } from './version.diff.util';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { JwtAccessPayload } from '../users/user.types';
import { contractService } from '../contracts/contract.service';
import { getParam } from '../../core/utils/params';

export const versionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const versions = await versionRepository.listForContract(getParam(req, 'contractId'));
    sendSuccess(res, versions);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const version = await contractService.saveNewVersion(
      getParam(req, 'contractId'),
      req.body.content,
      req.body.changeSummary ?? null,
      user.sub
    );
    sendSuccess(res, version, 201);
  }),

  compare: asyncHandler(async (req: Request, res: Response) => {
    const contractId = getParam(req, 'contractId');
    const versionId = getParam(req, 'versionId');
    const target = await versionRepository.findById(versionId);
    if (!target || target.contract.toString() !== contractId) {
      throw AppError.notFound('Version not found for this contract');
    }

    const previous = await versionRepository.getByVersionNumber(contractId, target.versionNumber - 1);
    const diffs = diffContent(previous?.content ?? null, target.content);

    sendSuccess(res, { versionNumber: target.versionNumber, comparedTo: previous?.versionNumber ?? null, diffs });
  }),

  

  compareVersions: asyncHandler(async (req: Request, res: Response) => {
    const contractId = getParam(req, 'contractId');
    const fromNumber = Number(req.query.from);
    const toNumber = Number(req.query.to);
    if (!Number.isInteger(fromNumber) || !Number.isInteger(toNumber)) {
      throw AppError.badRequest('Query params "from" and "to" must be integers');
    }

    const [from, to] = await Promise.all([
      versionRepository.getByVersionNumber(contractId, fromNumber),
      versionRepository.getByVersionNumber(contractId, toNumber),
    ]);
    if (!to) throw AppError.notFound(`Version ${toNumber} not found for this contract`);

    const diffs = diffContent(from?.content ?? null, to.content);
    sendSuccess(res, { from: from?.versionNumber ?? null, to: to.versionNumber, diffs });
  }),

  

  rollback: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const contractId = getParam(req, 'contractId');
    const targetVersionNumber = Number(req.body.targetVersionNumber);
    if (!Number.isInteger(targetVersionNumber)) {
      throw AppError.badRequest('targetVersionNumber must be an integer');
    }

    const version = await contractService.rollbackToVersion(contractId, targetVersionNumber, user.sub);
    sendSuccess(res, version, 201);
  }),
};
