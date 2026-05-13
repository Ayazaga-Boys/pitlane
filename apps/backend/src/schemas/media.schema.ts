import { z } from 'zod';

export const MEDIA_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'] as const;

export const UploadUrlSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  content_type: z.enum(MEDIA_CONTENT_TYPES),
  asset_type: z.enum(['photo', 'video']),
  size_bytes: z.number().int().positive().max(100 * 1024 * 1024),
}).refine((value) => {
  if (value.asset_type === 'video') return value.content_type === 'video/mp4';
  return value.content_type.startsWith('image/');
}, {
  message: 'asset_type and content_type do not match',
  path: ['content_type'],
});

export const FinalizeMediaSchema = z.object({
  asset_id: z.string().uuid(),
});

export const MediaIdParamSchema = z.object({
  id: z.string().uuid(),
});
