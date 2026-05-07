import { z } from 'zod';

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);

function atLeastFiveMinutesFromNow(value: string): boolean {
  return new Date(value).getTime() >= Date.now() + 5 * 60 * 1000;
}

function endsAfterStart(value: { starts_at?: string | undefined; ends_at?: string | undefined }): boolean {
  if (!value.starts_at || !value.ends_at) return true;
  return new Date(value.ends_at).getTime() > new Date(value.starts_at).getTime();
}

export const FlareIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const ListFlaresQuerySchema = z.object({
  h3cell: h3CellSchema.optional(),
  k: z.coerce.number().int().min(0).max(5).default(2),
  community_id: z.string().uuid().optional(),
});

const CreateFlareBaseSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).optional(),
  h3_cell: h3CellSchema,
  starts_at: z.string().datetime().refine(atLeastFiveMinutesFromNow, {
    message: 'starts_at must be at least 5 minutes from now',
  }),
  ends_at: z.string().datetime().optional(),
  community_id: z.string().uuid().optional(),
  cover_url: z.string().url().optional(),
});

export const CreateFlareSchema = CreateFlareBaseSchema
  .refine(endsAfterStart, {
    message: 'ends_at must be after starts_at',
    path: ['ends_at'],
  });

export const UpdateFlareSchema = CreateFlareBaseSchema.pick({
  title: true,
  description: true,
  starts_at: true,
  ends_at: true,
  community_id: true,
  cover_url: true,
})
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })
  .refine(endsAfterStart, {
    message: 'ends_at must be after starts_at',
    path: ['ends_at'],
  });

export const RsvpFlareSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']).default('going'),
});
