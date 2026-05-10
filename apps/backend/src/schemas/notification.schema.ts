import { z } from 'zod';

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const PushDeviceTokenParamSchema = z.object({
  token: z.string().min(20).max(500),
});

export const ListNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const RegisterDeviceSchema = z.object({
  platform: z.enum(['ios', 'android']),
  token: z.string().min(20).max(500),
  app_build: z.string().max(40).optional(),
});
