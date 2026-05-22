import { z } from 'zod';

export const V2LocationShareModeSchema = z.enum(['everyone', 'followers', 'none']);

export const V2AvatarUploadSchema = z.object({
  filename: z.string().trim().min(1).max(120).optional(),
}).default({});

export const V2PrivacySchema = z.object({
  is_private: z.boolean().optional(),
  location_share_mode: V2LocationShareModeSchema.optional(),
  bio_extended: z.string().trim().max(1000).nullable().optional(),
  presence_visible: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export const V2PresenceSchema = z.object({
  status: z.enum(['online', 'dnd', 'offline']),
  visible: z.boolean().optional(),
});

export const V2UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const V2VehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2VehicleIconSlugSchema = z.enum([
  'motorcycle_standard',
  'motorcycle_chopper',
  'motorcycle_sport',
  'motorcycle_enduro',
  'motorcycle_scooter',
  'car_sedan',
  'car_suv',
  'car_hatchback',
  'car_pickup',
  'car_classic',
  'car_sport',
]);

export const V2UpdateVehicleSchema = z.object({
  icon_slug: V2VehicleIconSlugSchema.nullable().optional(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export const V2FollowListQuerySchema = z.object({
  user_id: z.string().uuid(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const V2FollowRequestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2PostVisibilitySchema = z.enum(['public', 'followers', 'private']);

export const V2PostIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2CommentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2UsernameParamSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
});

export const V2CreatePostSchema = z.object({
  caption: z.string().trim().max(2200).optional(),
  media_id: z.string().uuid().optional(),
  visibility: V2PostVisibilitySchema.default('public'),
}).refine((value) => value.caption || value.media_id, {
  message: 'Caption or media_id is required',
});

export const V2CreateCommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
  parent_id: z.string().uuid().optional(),
});

export const V2CursorQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const V2StoryAudienceSchema = z.enum(['public', 'followers', 'private']);

export const V2StoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2CreateStorySchema = z.object({
  media_id: z.string().uuid(),
  audience: V2StoryAudienceSchema.default('followers'),
  expires_at: z.string().datetime().optional(),
}).superRefine((value, ctx) => {
  if (!value.expires_at) return;

  const expiresAt = Date.parse(value.expires_at);
  const now = Date.now();
  if (expiresAt <= now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expires_at'],
      message: 'expires_at must be in the future',
    });
  }
  if (expiresAt > now + 24 * 60 * 60 * 1000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expires_at'],
      message: 'expires_at cannot be more than 24 hours in the future',
    });
  }
});

export const V2CommunityIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2CommunityRoleParamSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const V2CommunityMemberRoleParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const V2CommunityRolePermissionsSchema = z.object({
  can_invite: z.boolean().optional(),
  can_kick: z.boolean().optional(),
  can_create_event: z.boolean().optional(),
  can_pin: z.boolean().optional(),
  can_moderate: z.boolean().optional(),
}).strict();

export const V2CreateCommunityRoleSchema = z.object({
  name: z.string().trim().min(2).max(40),
  permissions: V2CommunityRolePermissionsSchema.default({}),
  rank_order: z.number().int().min(0).max(1000).default(100),
});

export const V2UpdateCommunityRoleSchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  permissions: V2CommunityRolePermissionsSchema.optional(),
  rank_order: z.number().int().min(0).max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export const V2AssignCommunityRoleSchema = z.object({
  role_id: z.string().uuid(),
});

export const V2InviteSlugParamSchema = z.object({
  slug: z.string().regex(/^[a-zA-Z0-9_-]{6,64}$/),
});

export const V2CommunityInviteIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2CreateCommunityInviteSchema = z.object({
  type: z.enum(['link', 'code']).default('link'),
  mode: z.enum(['instant', 'request']).default('instant'),
  expires_at: z.string().datetime().optional(),
  max_uses: z.number().int().min(1).max(10_000).optional(),
}).superRefine((value, ctx) => {
  if (!value.expires_at) return;

  const expiresAt = Date.parse(value.expires_at);
  if (expiresAt <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expires_at'],
      message: 'expires_at must be in the future',
    });
  }
});

export const V2InviteUserSchema = z.object({
  user_id: z.string().uuid(),
});

export const V2RespondCommunityInviteSchema = z.object({
  response: z.enum(['accept', 'reject']),
});

export const V2CommunityEventStatusSchema = z.enum(['scheduled', 'canceled', 'completed']);

export const V2EventIdParamSchema = z.object({
  id: z.string().uuid(),
});

const h3CellSchema = z.string().regex(/^[0-9a-f]{15}$/i);

export const V2CreateCommunityEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  starts_at: z.string().datetime(),
  location_h3: h3CellSchema.optional(),
}).superRefine((value, ctx) => {
  if (Date.parse(value.starts_at) <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['starts_at'],
      message: 'starts_at must be in the future',
    });
  }
});

export const V2CommunityEventsQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: V2CommunityEventStatusSchema.optional(),
});

export const V2EventRsvpSchema = z.object({
  response: z.enum(['yes', 'maybe', 'no']),
});

export const V2CreateCommunityPollSchema = z.object({
  question: z.string().trim().min(3).max(240),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
});

export const V2CommunityNeedStatusSchema = z.enum(['open', 'resolved', 'closed']);

export const V2CreateCommunityNeedSchema = z.object({
  type: z.enum(['parts', 'fuel', 'tools', 'ride_help', 'other']),
  urgency_color: z.enum(['yellow', 'red']),
  body: z.string().trim().min(3).max(500),
});

export const V2CommunityNeedsQuerySchema = z.object({
  status: V2CommunityNeedStatusSchema.default('open'),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const V2CompetitionIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const V2CompetitionEntryVoteParamSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
});

export const V2CompetitionFiltersSchema = z.object({
  vehicle_type: z.enum(['any', 'car', 'motorcycle']).default('any'),
  media_type: z.enum(['any', 'photo', 'video']).default('photo'),
}).strict().default({});

export const V2CreateCompetitionSchema = z.object({
  community_id: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  filters: V2CompetitionFiltersSchema,
  voting_starts_at: z.string().datetime(),
  voting_ends_at: z.string().datetime(),
}).superRefine((value, ctx) => {
  const startsAt = Date.parse(value.voting_starts_at);
  const endsAt = Date.parse(value.voting_ends_at);
  if (startsAt <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['voting_starts_at'],
      message: 'voting_starts_at must be in the future',
    });
  }
  if (endsAt <= startsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['voting_ends_at'],
      message: 'voting_ends_at must be after voting_starts_at',
    });
  }
});

export const V2CreateCompetitionEntrySchema = z.object({
  media_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional(),
  caption: z.string().trim().max(500).optional(),
});

export const V2AdminCompetitionsQuerySchema = z.object({
  status: z.enum(['open', 'voting', 'closed', 'canceled']).optional(),
  community_id: z.string().uuid().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const V2AdminRejectCompetitionEntrySchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
}).default({});

export const V2AdminCommunityNeedsQuerySchema = z.object({
  status: V2CommunityNeedStatusSchema.or(z.literal('flagged')).default('flagged'),
  community_id: z.string().uuid().optional(),
  creator_id: z.string().uuid().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
