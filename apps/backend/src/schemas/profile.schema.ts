import { z } from 'zod';

export const NotificationPrefsSchema = z.object({
  help_nearby: z.boolean().optional(),
  help_helper_arrived: z.boolean().optional(),
  flare_invite: z.boolean().optional(),
  flare_starting: z.boolean().optional(),
  dm_new: z.boolean().optional(),
  community_message: z.boolean().optional(),
  community_invite: z.boolean().optional(),
  system: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  quiet_hours_end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
}).strict();

export const UsernameParamSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
});

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional(),
  ghost_mode: z.boolean().optional(),
  notification_prefs: NotificationPrefsSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export const DeleteProfileSchema = z.object({
  reason: z.string().trim().max(300).optional(),
}).default({});

export const ProfileDeletionCancelTokenParamSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
});

export const CreateVehicleSchema = z.object({
  type: z.enum(['car', 'motorcycle', 'other']),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1885).max(2100).optional(),
  color: z.string().trim().max(40).optional(),
  photo_url: z.string().url().optional(),
  is_primary: z.boolean().default(false),
  icon_slug: z.string().regex(/^(motorcycle_(standard|chopper|sport|enduro|scooter)|car_(sedan|suv|hatchback|pickup|classic|sport))$/).optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export const VehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});
