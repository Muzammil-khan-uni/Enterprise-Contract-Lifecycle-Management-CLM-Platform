import { Request, Response } from 'express';
import { documentService } from './document.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { asyncHandler } from '../../core/errors/error-handler.middleware';
import { AppError } from '../../core/errors/AppError';
import { JwtAccessPayload } from '../users/user.types';
import { getParam } from '../../core/utils/params';

function toDocumentResponse(document: Awaited<ReturnType<typeof documentService.uploadDocument>>) {
  return {
    _id: document._id,
    contract: document.contract,
    type: document.type,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    uploadedBy: document.uploadedBy,
    version: document.version,
    ocrText: document.ocrText,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export const documentController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtAccessPayload }).user;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw AppError.badRequest('No file was uploaded (expected multipart field "file")');

    
    
    
    
    
    
    const document = await documentService.uploadDocument(getParam(req, 'contractId'), file, req.body.type, user.sub, user.tenant);
    sendSuccess(res, toDocumentResponse(document), 201);
  }),

  listForContract: asyncHandler(async (req: Request, res: Response) => {
    const documents = await documentService.listForContract(getParam(req, 'contractId'));
    sendSuccess(res, documents.map(toDocumentResponse));
  }),

  

  download: asyncHandler(async (req: Request, res: Response) => {
    const url = await documentService.getDownloadUrl(getParam(req, 'contractId'), getParam(req, 'id'));
    sendSuccess(res, { url });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await documentService.deleteDocument(getParam(req, 'contractId'), getParam(req, 'id'));
    sendSuccess(res, { deleted: true });
  }),
};
