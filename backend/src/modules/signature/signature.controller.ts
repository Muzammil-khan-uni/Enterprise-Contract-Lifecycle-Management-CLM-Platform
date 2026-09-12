import { Request, Response } from 'express';
import { signatureService } from './signature.service';
import { signatureProvider } from './signature.provider';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { getParam } from '../../core/utils/params';
import { JwtAccessPayload } from '../users/user.types';

export const signatureController = {
  initiate: asyncHandler(async (req: Request, res: Response) => {
    const signatures = await signatureService.initiateSignature(getParam(req, 'contractId'), req.body.signers);
    sendSuccess(res, signatures, 201);
  }),

  listForContract: asyncHandler(async (req: Request, res: Response) => {
    const signatures = await signatureService.listForContract(getParam(req, 'contractId'));
    sendSuccess(res, signatures);
  }),

  
  listMine: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    sendSuccess(res, await signatureService.listMine(user.sub));
  }),

  auditTrail: asyncHandler(async (req: Request, res: Response) => {
    const trail = await signatureService.getAuditTrail(getParam(req, 'signatureId'));
    sendSuccess(res, trail);
  }),

  

  docusignWebhook: asyncHandler(async (req: Request, res: Response) => {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw AppError.badRequest('Missing request body');

    if (!signatureProvider.verifyWebhook({ rawBody, headers: req.headers as Record<string, string | string[] | undefined> })) {
      throw AppError.unauthorized('Webhook signature verification failed');
    }

    const event = signatureProvider.parseWebhookEvent(rawBody);
    await signatureService.handleProviderWebhookEvent(event);
    res.status(200).json({ success: true });
  }),

  adobesignWebhook: asyncHandler(async (req: Request, res: Response) => {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw AppError.badRequest('Missing request body');

    if (!signatureProvider.verifyWebhook({ rawBody, headers: req.headers as Record<string, string | string[] | undefined> })) {
      throw AppError.unauthorized('Webhook signature verification failed');
    }

    const event = signatureProvider.parseWebhookEvent(rawBody);
    await signatureService.handleProviderWebhookEvent(event);
    res.status(200).json({ success: true });
  }),
};
