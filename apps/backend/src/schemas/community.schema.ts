import { z } from 'zod';

export const CommunityIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CommunitySlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
});

export const CommunityMemberParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const ListCommunitiesQuerySchema = z.object({
  city: z.string().trim().max(80).optional(),
  vehicle_type: z.enum(['car', 'motorcycle', 'all']).optional(),
  type: z.enum(['public', 'private', 'secret']).optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CreateCommunitySchema = z.object({
  name: z.string().trim().min(3).max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,40}$/),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['public', 'private', 'secret']).default('public'),
  vehicle_type: z.enum(['car', 'motorcycle', 'all']).default('all'),
  city: z.string().trim().max(80).optional(),
  cover_url: z.string().url().optional(),
});

export const UpdateCommunitySchema = CreateCommunitySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export const UpdateCommunityMemberSchema = z.object({
  role: z.enum(['captain', 'moderator', 'member']),
});
