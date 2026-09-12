import { z } from 'zod';
import { ObligationType, RecurrenceInterval } from './obligation.types';

export const createObligationSchema = z.object({
  body: z
    .object({
      type: z.nativeEnum(ObligationType),
      description: z.string().min(1).max(1000),
      dueDate: z.string().datetime(),
      assignedTo: z.string().optional(),
      recurrence: z.nativeEnum(RecurrenceInterval).optional(),
      
      
      
      
      
      
      amount: z.number().positive().optional(),
      currency: z
        .string()
        .length(3)
        .transform((c) => c.toUpperCase())
        .optional(),
      
      
      
      
      
      slaThreshold: z.string().max(500).optional(),
      slaPenalty: z.string().max(500).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === ObligationType.PAYMENT) {
        if (data.amount === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'amount is required for a Payment obligation' });
        }
        if (data.currency === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['currency'], message: 'currency is required for a Payment obligation' });
        }
      }
    }),
  query: z.object({}).optional(),
  params: z.object({ contractId: z.string() }),
});

export const completeObligationSchema = z.object({
  body: z.object({
    evidence: z.string().optional(), 
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string() }),
});
