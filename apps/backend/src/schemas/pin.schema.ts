import { z } from 'zod';

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);

function campaignEndsWithinThirtyDays(value: string): boolean {
  const endsAt = new Date(value).getTime();
  return endsAt > Date.now() && endsAt <= Date.now() + 30 * 24 * 60 * 60 * 1000;
}

export const PinIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const ListPinsQuerySchema = z.object({
  h3cell: h3CellSchema.optional(),
  k: z.coerce.number().int().min(0).max(5).default(3),
  category: z.enum(['garage', 'repair', 'parts', 'fuel', 'cafe', 'other']).optional(),
});

export const CreatePinSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.enum(['garage', 'repair', 'parts', 'fuel', 'cafe', 'other']),
  h3_cell: h3CellSchema,
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  website: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
});

export const UpdatePinSchema = CreatePinSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export const StartCampaignSchema = z.object({
  campaign_text: z.string().trim().min(8).max(200),
  campaign_ends_at: z.string().datetime().refine(campaignEndsWithinThirtyDays, {
    message: 'campaign_ends_at must be within the next 30 days',
  }),
});
