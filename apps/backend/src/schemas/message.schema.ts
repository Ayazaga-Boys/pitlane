import { z } from 'zod';

export const MessageIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const PeerIdParamSchema = z.object({
  peerId: z.string().uuid(),
});

export const RoomIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const ListMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional(),
});

export const SendMessageSchema = z
  .object({
    body: z.string().trim().max(2000).optional(),
    media_url: z.string().url().optional(),
    media_type: z.enum(['image', 'video', 'audio']).optional(),
  })
  .refine((value) => Boolean(value.body || value.media_url), {
    message: 'body or media_url is required',
  })
  .refine((value) => !value.media_url || Boolean(value.media_type), {
    message: 'media_type is required when media_url is provided',
    path: ['media_type'],
  });
