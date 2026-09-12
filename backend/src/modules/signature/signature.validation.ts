import { z } from 'zod';

export const initiateSignatureSchema = z.object({
  body: z.object({
    signers: z
      .array(
        z.object({
          signerType: z.enum(['Internal', 'External']),
          userId: z.string().optional(),
          name: z.string().min(1),
          email: z.string().email(),
        })
      )
      .min(1, 'At least one signer is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({ contractId: z.string() }),
});
