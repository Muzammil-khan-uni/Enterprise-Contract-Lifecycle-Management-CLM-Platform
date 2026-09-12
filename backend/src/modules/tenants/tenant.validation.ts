import { z } from 'zod';

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    plan: z.enum(['Free', 'Standard', 'Enterprise']).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
