import { z } from 'zod';

export const UsernameParamSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
});

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional(),
  ghost_mode: z.boolean().optional(),
});

export const CreateVehicleSchema = z.object({
  type: z.enum(['car', 'motorcycle', 'other']),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1885).max(2100).optional(),
  color: z.string().trim().max(40).optional(),
  photo_url: z.string().url().optional(),
  is_primary: z.boolean().default(false),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export const VehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});
