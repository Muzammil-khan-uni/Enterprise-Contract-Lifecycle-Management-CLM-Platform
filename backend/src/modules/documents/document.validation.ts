import { z } from 'zod';
import { DocumentType } from './document.types';

export const uploadDocumentSchema = z.object({
  body: z.object({
    type: z.nativeEnum(DocumentType),
  }),
  query: z.object({}).optional(),
  params: z.object({ contractId: z.string() }),
});
