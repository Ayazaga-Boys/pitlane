import { z } from 'zod';

export const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const CreateReportSchema = z.object({
  content_type: z.enum(['message', 'flare', 'community', 'profile', 'business_pin']),
  content_id: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'fake', 'other']),
  description: z.string().trim().max(500).optional(),
});
