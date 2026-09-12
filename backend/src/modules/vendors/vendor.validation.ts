import { z } from 'zod';

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    vendorCode: z.string().min(1),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    country: z.string().min(1),
    businessUnits: z.array(z.string()).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateVendorSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      contactEmail: z.string().email().nullable().optional(),
      contactPhone: z.string().nullable().optional(),
      country: z.string().min(1).optional(),
      businessUnits: z.array(z.string()).optional(),
      riskRating: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const vendorIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});
