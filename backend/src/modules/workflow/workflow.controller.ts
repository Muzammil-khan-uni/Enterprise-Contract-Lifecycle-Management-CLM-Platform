import { Request, Response } from 'express';
import { workflowService } from './workflow.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { JwtAccessPayload } from '../users/user.types';
import { getParam } from '../../core/utils/params';

export const workflowController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const workflow = await workflowService.submitForApproval(getParam(req, 'contractId'), user.sub);
    sendSuccess(res, workflow, 201);
  }),

  listForContract: asyncHandler(async (req: Request, res: Response) => {
    const workflows = await workflowService.getForContract(getParam(req, 'contractId'));
    sendSuccess(res, workflows);
  }),

  getQueue: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const queue = await workflowService.getQueueForUser(user.permissions, user.businessUnit);
    sendSuccess(res, queue);
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const workflow = await workflowService.approveStep(
      getParam(req, 'workflowId'),
      user.sub,
      user.permissions,
      user.businessUnit,
      req.body.comments
    );
    sendSuccess(res, workflow);
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const workflow = await workflowService.rejectStep(
      getParam(req, 'workflowId'),
      user.sub,
      user.permissions,
      user.businessUnit,
      req.body.comments
    );
    sendSuccess(res, workflow);
  }),

  escalate: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const workflow = await workflowService.escalateStep(
      getParam(req, 'workflowId'),
      user.permissions,
      user.businessUnit,
      req.body.escalateTo,
      req.body.reason
    );
    sendSuccess(res, workflow);
  }),
};
