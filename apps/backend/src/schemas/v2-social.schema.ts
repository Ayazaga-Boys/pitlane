import { z } from 'zod';

export const V2LocationShareModeSchema = z.enum(['everyone', 'followers', 'none']);

export const V2AvatarUploadSchema = z.object({
  filename: z.string().trim().min(1).max(120).optional(),
}).default({});

export const V2PrivacySchema = z.object({
  is_private: z.boolean().optional(),
  location_share_mode: V2LocationShareModeSchema.optional(),
  bio_extended: z.string().trim().max(1000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export const V2UserIdParamSchema = z.object({
  userId: z.string().uuid(),
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
