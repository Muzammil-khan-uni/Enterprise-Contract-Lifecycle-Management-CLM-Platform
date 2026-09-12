import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.string(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string() }),
});

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(120),
    bio: z.string().max(500, 'Bio must be 500 characters or fewer').optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
