import { z } from 'zod';
import { ContractType } from './contract.types';

const partySchema = z.object({
  partyType: z.enum(['Internal', 'Vendor', 'Customer']),
  refId: z.string().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
});

export const createContractSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(300),
    contractType: z.nativeEnum(ContractType),
    department: z.string().min(1),
    businessUnit: z.string().min(1),
    parties: z.array(partySchema).default([]),
    effectiveDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    governingLawCountry: z.string().optional(),
    timezone: z.string().optional(),
    contractValue: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    tags: z.array(z.string()).optional(),
    confidentialityLevel: z.enum(['Public', 'Internal', 'Confidential', 'Restricted']).optional(),
    
    
    
    
    
    
    
    templateId: z.string().optional(),
    variableValues: z.record(z.string(), z.unknown()).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateContractSchema = z.object({
  
  
  
  
  
  
  body: createContractSchema.shape.body.omit({ templateId: true, variableValues: true }).partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string() }),
});

export const listContractsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: z.string().optional(),
    contractType: z.string().optional(),
    businessUnit: z.string().optional(),
    department: z.string().optional(),
    search: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
  }),
  params: z.object({}).optional(),
});

export const renewContractSchema = z.object({
  body: z.object({
    newExpiryDate: z.string().datetime().optional(),
    contractValue: z.number().nonnegative().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string() }),
});
