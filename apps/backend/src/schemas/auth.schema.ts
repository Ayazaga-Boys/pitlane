import { z } from 'zod';

export const ValidateInviteCodeSchema = z.object({
  code: z.string().trim().min(3).max(32).transform((value) => value.toUpperCase()),
});

export const JoinWaitingListSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  vehicle_type: z.enum(['car', 'motorcycle', 'other']).optional(),
  city: z.string().trim().min(2).max(80).optional(),
});
