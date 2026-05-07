import { z } from 'zod';

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);

export const MapNearbyQuerySchema = z.object({
  h3cell: h3CellSchema,
  k: z.coerce.number().int().min(0).max(5).default(2),
});

export const MapPinsQuerySchema = MapNearbyQuerySchema.extend({
  category: z.enum(['garage', 'repair', 'parts', 'fuel', 'cafe', 'other']).optional(),
});

export const MapHeatmapQuerySchema = z.object({
  bounds: z
    .string()
    .optional()
    .transform((value) => value?.split(',').map((cell) => cell.trim()).filter(Boolean) ?? [])
    .pipe(z.array(h3CellSchema).max(200)),
});
