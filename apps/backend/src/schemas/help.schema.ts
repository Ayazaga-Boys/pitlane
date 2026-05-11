import { z } from 'zod';

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);

export const HelpIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CreateHelpSchema = z.object({
  h3_cell: h3CellSchema,
  issue_type: z.enum(['breakdown', 'flat_tire', 'fuel', 'accident', 'other']),
  description: z.string().trim().max(300).optional(),
  vehicle_id: z.string().uuid().optional(),
});
