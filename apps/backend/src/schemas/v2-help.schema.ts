import { z } from 'zod';

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);

export const V2CreateHelpSchema = z.object({
  h3_cell: h3CellSchema,
  issue_type: z.enum(['breakdown', 'flat_tire', 'fuel', 'accident', 'other']),
  description: z.string().trim().max(300).optional(),
  vehicle_id: z.string().uuid().optional(),
  target_type: z.enum(['nearby', 'followers', 'group']).default('nearby'),
  target_id: z.string().uuid().nullable().optional(),
  urgency: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
}).superRefine((value, ctx) => {
  if (value.target_type === 'group' && !value.target_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['target_id'],
      message: 'target_id is required for group target',
    });
  }
  if (value.target_type !== 'group' && value.target_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['target_id'],
      message: 'target_id is only supported for group target',
    });
  }
});
