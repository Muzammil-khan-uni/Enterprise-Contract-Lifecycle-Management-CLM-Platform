import { z } from 'zod';

export const actionWorkflowSchema = z.object({
  body: z.object({
    comments: z.string().max(2000).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ workflowId: z.string() }),
});

export const escalateWorkflowSchema = z.object({
  body: z.object({
    escalateTo: z.string().min(1),
    reason: z.string().max(2000).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ workflowId: z.string() }),
});
