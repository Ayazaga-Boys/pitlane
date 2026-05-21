import { z } from 'zod';
import { TAX_DOCUMENT_CONTENT_TYPES } from './pin.schema.js';

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);
const businessCategorySchema = z.enum(['garage', 'repair', 'parts', 'fuel', 'cafe', 'dealer', 'other']);
const applicationStatusSchema = z.enum(['pending', 'under_review', 'approved', 'rejected']);

export const V2BusinessApplicationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2CreateBusinessApplicationSchema = z.object({
  business_name: z.string().trim().min(2).max(120),
  category: businessCategorySchema,
  description: z.string().trim().max(2000).nullable().optional(),
  h3_cell: h3CellSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().min(3).max(240),
  phone: z.string().trim().max(24).optional(),
  website: z.string().url().optional(),
  photo_url: z.string().url().optional(),
  working_hours: z.record(z.unknown()).optional(),
});

export const V2BusinessApplicationDocumentSchema = z.object({
  document_type: z.enum(['tax_license', 'business_license', 'identity', 'other']),
  filename: z.string().trim().min(1).max(200),
  content_type: z.enum(TAX_DOCUMENT_CONTENT_TYPES),
  size_bytes: z.number().int().positive().max(15 * 1024 * 1024),
});

export const V2AdminBusinessApplicationsQuerySchema = z.object({
  status: applicationStatusSchema.default('pending'),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const V2RejectBusinessApplicationSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const V2BusinessLocationsNearbyQuerySchema = z.object({
  h3cell: h3CellSchema,
  k: z.coerce.number().int().min(0).max(5).default(2),
  category: businessCategorySchema.optional(),
});
