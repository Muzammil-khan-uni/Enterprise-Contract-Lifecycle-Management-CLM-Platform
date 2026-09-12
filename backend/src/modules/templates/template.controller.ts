import { Request, Response } from 'express';
import { templateService } from './template.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { JwtAccessPayload } from '../users/user.types';
import { getParam } from '../../core/utils/params';

export const templateController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await templateService.listActive());
  }),

  adminList: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await templateService.listAllForAdmin());
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.getByIdOrThrow(getParam(req, 'id')));
  }),

  getForAuthoring: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.getForAuthoringOrThrow(getParam(req, 'id')));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const template = await templateService.create(req.body, user.sub);
    sendSuccess(res, template, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    sendSuccess(res, await templateService.update(getParam(req, 'id'), req.body, user.sub));
  }),

  
  listVersions: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.listVersions(getParam(req, 'id')));
  }),

  
  compareVersions: asyncHandler(async (req: Request, res: Response) => {
    const templateId = getParam(req, 'id');
    const fromNumber = Number(req.query.from);
    const toNumber = Number(req.query.to);
    const result = await templateService.compareVersions(templateId, fromNumber, toNumber);
    sendSuccess(res, result);
  }),

  
  rollbackVersion: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const template = await templateService.rollbackToVersion(
      getParam(req, 'id'),
      req.body.targetVersionNumber,
      user.sub
    );
    sendSuccess(res, template, 201);
  }),

  listClauses: asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query;
    sendSuccess(res, await templateService.listClauses(category as string | undefined));
  }),

  createClause: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.createClause(req.body), 201);
  }),

  updateClause: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.updateClause(getParam(req, 'id'), req.body));
  }),

  deleteClause: asyncHandler(async (req: Request, res: Response) => {
    await templateService.deleteClause(getParam(req, 'id'));
    sendSuccess(res, { deleted: true });
  }),
};
