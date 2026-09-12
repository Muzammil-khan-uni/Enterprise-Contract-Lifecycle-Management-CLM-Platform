import { z } from 'zod';
import { UserRole, Permission } from './user.types';

export const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      role: z.nativeEnum(UserRole).optional(),
      businessUnit: z.string().nullable().optional(),
      department: z.string().nullable().optional(),
      permissionOverrides: z.array(z.nativeEnum(Permission)).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});
