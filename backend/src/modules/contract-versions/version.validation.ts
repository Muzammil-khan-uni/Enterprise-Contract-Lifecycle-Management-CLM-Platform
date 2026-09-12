import { z } from 'zod';

export const rollbackSchema = z.object({
  body: z.object({
    targetVersionNumber: z.number().int().positive(),
  }),
  query: z.object({}).optional(),
  params: z.object({ contractId: z.string().min(1) }),
});

export const compareVersionsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    from: z.string().regex(/^\d+$/, 'from must be an integer'),
    to: z.string().regex(/^\d+$/, 'to must be an integer'),
  }),
  params: z.object({ contractId: z.string().min(1) }),
});
