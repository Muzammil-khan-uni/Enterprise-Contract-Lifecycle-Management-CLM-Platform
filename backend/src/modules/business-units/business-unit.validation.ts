import { z } from 'zod';

export const createBusinessUnitSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    code: z.string().min(1).max(20),
    parentUnit: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateBusinessUnitSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).max(20).optional(),
    parentUnit: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const businessUnitIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});
