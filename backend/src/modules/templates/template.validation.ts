import { z } from 'zod';

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    contractType: z.string().min(1),
    sections: z
      .array(z.object({ title: z.string(), order: z.number(), clauses: z.array(z.string()).default([]) }))
      .default([]),
    variables: z
      .array(
        z.object({
          name: z.string(),
          label: z.string(),
          type: z.enum(['text', 'number', 'date', 'boolean']),
          required: z.boolean().default(false),
        })
      )
      .default([]),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const createClauseSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    category: z.string().min(1),
    text: z.string().min(1),
    isMandatory: z.boolean().default(false),
    applicableContractTypes: z.array(z.string()).default([]),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateTemplateSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      contractType: z.string().min(1).optional(),
      sections: z
        .array(z.object({ title: z.string(), order: z.number(), clauses: z.array(z.string()).default([]) }))
        .optional(),
      variables: z
        .array(
          z.object({
            name: z.string(),
            label: z.string(),
            type: z.enum(['text', 'number', 'date', 'boolean']),
            required: z.boolean().default(false),
          })
        )
        .optional(),
      isActive: z.boolean().optional(),
      
      
      
      
      
      changeSummary: z.string().max(1000).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const updateClauseSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
      text: z.string().min(1).optional(),
      isMandatory: z.boolean().optional(),
      applicableContractTypes: z.array(z.string()).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const templateIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const clauseIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const rollbackTemplateSchema = z.object({
  body: z.object({
    targetVersionNumber: z.number().int().positive(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const compareTemplateVersionsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    from: z.string().regex(/^\d+$/, 'from must be an integer'),
    to: z.string().regex(/^\d+$/, 'to must be an integer'),
  }),
  params: z.object({ id: z.string().min(1) }),
});
